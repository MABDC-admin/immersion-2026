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
    created_at: string;
    updated_at: string;
}

export function useJournalEntries(employeeId: string) {
    return useQuery({
        queryKey: ['journal-entries', employeeId],
        queryFn: async () => {
            if (!employeeId) return [];
            const { data, error } = await supabase
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
            const { data, error } = await supabase
                .from('intern_journals')
                .insert([entry] as any)
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
        }) => {
            const { data, error } = await supabase
                .from('intern_journals')
                .update(updates as any)
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
            const { error } = await supabase
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
