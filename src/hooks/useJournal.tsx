import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface JournalEntry {
    id: string;
    employee_id: string;
    entry_date: string;
    activities: string;
    learnings: string | null;
    challenges: string | null;
    supervisor_notes: string | null;
    hours_worked: number | null;
    status: 'draft' | 'pending' | 'approved' | 'rejected';
    created_at: string;
    updated_at: string;
}

export function useJournalEntries(employeeId: string) {
    return useQuery({
        queryKey: ['journal-entries', employeeId],
        queryFn: async () => {
            if (!employeeId) return [];
            const { data, error } = await (supabase as any)
                .from('intern_journals')
                .select('*')
                .eq('employee_id', employeeId)
                .order('entry_date', { ascending: false });
            if (error) throw error;
            return (data || []) as JournalEntry[];
        },
        enabled: !!employeeId,
    });
}

export function useCreateJournalEntry() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (entry: {
            employee_id: string;
            entry_date: string;
            activities: string;
            learnings?: string;
            challenges?: string;
            hours_worked?: number;
        }) => {
            const { data, error } = await (supabase as any)
                .from('intern_journals')
                .insert([entry])
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: (_, vars) => {
            queryClient.invalidateQueries({ queryKey: ['journal-entries', vars.employee_id] });
        },
    });
}

export function useUpdateJournalEntry() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({
            id,
            employeeId,
            ...updates
        }: {
            id: string;
            employeeId: string;
            activities?: string;
            learnings?: string;
            challenges?: string;
            hours_worked?: number;
            status?: 'draft' | 'pending' | 'approved' | 'rejected';
            supervisor_notes?: string;
        }) => {
            const { data, error } = await (supabase as any)
                .from('intern_journals')
                .update(updates)
                .eq('id', id)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: (_, vars) => {
            queryClient.invalidateQueries({ queryKey: ['journal-entries', vars.employeeId] });
        },
    });
}

export function useDeleteJournalEntry() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, employeeId }: { id: string; employeeId: string }) => {
            const { error } = await (supabase as any)
                .from('intern_journals')
                .delete()
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: (_, vars) => {
            queryClient.invalidateQueries({ queryKey: ['journal-entries', vars.employeeId] });
        },
    });
}
export function useApproveJournalEntry() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({
            id,
            employeeId,
            status,
            supervisor_notes,
        }: {
            id: string;
            employeeId: string;
            status: 'approved' | 'rejected';
            supervisor_notes?: string;
        }) => {
            const { data, error } = await (supabase as any)
                .from('intern_journals')
                .update({ status, supervisor_notes })
                .eq('id', id)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: (_, vars) => {
            queryClient.invalidateQueries({ queryKey: ['journal-entries', vars.employeeId] });
            queryClient.invalidateQueries({ queryKey: ['pending-journal-approvals'] });
        },
    });
}

export function usePendingJournalApprovals(supervisorId: string) {
    return useQuery({
        queryKey: ['pending-journal-approvals', supervisorId],
        queryFn: async () => {
            if (!supervisorId) return [];

            // First get assigned intern IDs
            const { data: interns, error: internsError } = await supabase
                .from('employees')
                .select('id')
                .eq('manager_id', supervisorId);

            if (internsError) throw internsError;
            if (!interns || interns.length === 0) return [];

            const internIds = interns.map(i => i.id);

            // Then get pending journals for these interns
            const { data, error } = await (supabase as any)
                .from('intern_journals')
                .select(`
                    *,
                    employee:employees(first_name, last_name, avatar_url)
                `)
                .in('employee_id', internIds)
                .eq('status', 'pending')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as any[];
        },
        enabled: !!supervisorId,
    });
}
