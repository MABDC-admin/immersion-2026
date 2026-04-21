import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface OjtOverride {
    id: string;
    intern_id: string;
    admin_id: string;
    override_type: 'hours_adjustment' | 'status_change' | 'progress_override';
    hours_value: number;
    progress_pct: number | null;
    completion_status: string | null;
    notes: string | null;
    created_at: string;
    admin?: { first_name: string; last_name: string };
}

export function useOjtOverrides(internId: string) {
    return useQuery({
        queryKey: ['ojt-overrides', internId],
        queryFn: async () => {
            if (!internId) return [];
            const { data, error } = await (supabase as any)
                .from('intern_ojt_overrides')
                .select('*, admin:employees!intern_ojt_overrides_admin_id_fkey(first_name, last_name)')
                .eq('intern_id', internId)
                .order('created_at', { ascending: false });
            if (error) throw error;
            return (data || []) as OjtOverride[];
        },
        enabled: !!internId,
    });
}

export function useCreateOjtOverride() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (override: {
            intern_id: string;
            admin_id: string;
            override_type: string;
            hours_value?: number;
            progress_pct?: number;
            completion_status?: string;
            notes?: string;
        }) => {
            const { data, error } = await (supabase as any)
                .from('intern_ojt_overrides')
                .insert([override])
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: (_, vars) => {
            qc.invalidateQueries({ queryKey: ['ojt-overrides', vars.intern_id] });
            qc.invalidateQueries({ queryKey: ['ojt-overrides-all'] });
        },
    });
}

export interface OjtSummary {
    internId: string;
    baseHours: number;
    adjustedHours: number;
    effectiveProgress: number;
    completionStatus: string;
    overrideCount: number;
}

export function useAllInternsOjt() {
    return useQuery({
        queryKey: ['ojt-overrides-all'],
        queryFn: async () => {
            // Fetch all interns (employees whose job_title contains 'intern')
            const { data: interns, error: ie } = await supabase
                .from('employees')
                .select('id, first_name, last_name, job_title, email, avatar_url, manager_id, hire_date')
                .ilike('job_title', '%intern%');
            if (ie) throw ie;

            // Fetch all attendance records for these interns
            const internIds = (interns || []).map(i => i.id);
            if (internIds.length === 0) return [];

            const { data: attendance, error: ae } = await supabase
                .from('attendance')
                .select('employee_id, clock_in, clock_out')
                .in('employee_id', internIds);
            if (ae) throw ae;

            // Fetch all overrides
            // Fetch approved journal hours
            const { data: journals, error: je } = await (supabase as any)
                .from('intern_journals')
                .select('employee_id, hours_worked, status')
                .in('employee_id', internIds)
                .eq('status', 'approved');
            if (je) throw je;

            // Fetch all overrides
            const { data: overrides, error: oe } = await (supabase as any)
                .from('intern_ojt_overrides')
                .select('*')
                .in('intern_id', internIds);
            if (oe) throw oe;

            return (interns || []).map((intern: any) => {
                const records = (attendance || []).filter((a: any) => a.employee_id === intern.id);
                let baseMinutes = 0;
                for (const r of records) {
                    if (r.clock_in && r.clock_out) {
                        baseMinutes += (new Date(r.clock_out).getTime() - new Date(r.clock_in).getTime()) / 60000;
                    }
                }
                const baseHours = Math.round((baseMinutes / 60) * 10) / 10;

                // Add approved journal hours
                const internJournals = (journals || []).filter((j: any) => j.employee_id === intern.id);
                let journalHours = 0;
                for (const j of internJournals) {
                    journalHours += Number(j.hours_worked || 0);
                }
                const totalBaseHours = Math.round((baseHours + journalHours) * 10) / 10;

                const internOverrides = (overrides || []).filter((o: any) => o.intern_id === intern.id);
                let adjustedHours = totalBaseHours;
                let effectiveProgress: number | null = null;
                let completionStatus = 'in_progress';

                for (const o of internOverrides) {
                    if (o.override_type === 'hours_adjustment') {
                        adjustedHours += Number(o.hours_value || 0);
                    }
                    if (o.override_type === 'progress_override' && o.progress_pct != null) {
                        effectiveProgress = Number(o.progress_pct);
                    }
                    if (o.override_type === 'status_change' && o.completion_status) {
                        completionStatus = o.completion_status;
                    }
                }

                if (effectiveProgress == null) {
                    effectiveProgress = Math.min((adjustedHours / 80) * 100, 100);
                }

                return {
                    ...intern,
                    baseHours: totalBaseHours,
                    adjustedHours,
                    effectiveProgress: Math.round(effectiveProgress * 10) / 10,
                    completionStatus,
                    overrideCount: internOverrides.length,
                    daysPresent: records.length,
                };
            });
        },
    });
}
