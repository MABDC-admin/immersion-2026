import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

export interface AttendanceRecord {
    id: string;
    employee_id: string;
    date: string;
    clock_in: string | null;
    clock_out: string | null;
    status: string;
    created_at: string;
    employee?: {
        first_name: string;
        last_name: string;
        avatar_url?: string;
    };
}

export function useAttendance(employeeId?: string, date?: string) {
    return useQuery({
        queryKey: ['attendance', employeeId, date],
        queryFn: async () => {
            let query = supabase
                .from('attendance')
                .select(`
          *,
          employee:employees(first_name, last_name, avatar_url)
        `)
                .order('date', { ascending: false });

            if (employeeId) {
                query = query.eq('employee_id', employeeId);
            }
            if (date) {
                query = query.eq('date', date);
            }

            const { data, error } = await query;

            if (error) throw error;
            return (data as unknown) as AttendanceRecord[];
        },
    });
}

export function useTodayAttendance(employeeId: string) {
    const today = format(new Date(), 'yyyy-MM-dd');
    return useQuery({
        queryKey: ['attendance', 'today', employeeId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('attendance')
                .select('*')
                .eq('employee_id', employeeId)
                .eq('date', today)
                .maybeSingle();

            if (error) throw error;
            return data as AttendanceRecord | null;
        },
    });
}

export function useClockIn() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ employeeId }: { employeeId: string }) => {
            const today = format(new Date(), 'yyyy-MM-dd');
            const now = new Date().toISOString();

            const { data, error } = await supabase
                .from('attendance')
                .insert([
                    {
                        employee_id: employeeId,
                        date: today,
                        clock_in: now,
                        status: 'present',
                    },
                ])
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['attendance'] });
            toast.success('Clocked in successfully');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to clock in');
        },
    });
}

export function useClockOut() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id }: { id: string }) => {
            const now = new Date().toISOString();

            const { data, error } = await supabase
                .from('attendance')
                .update({ clock_out: now })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['attendance'] });
            toast.success('Clocked out successfully');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to clock out');
        },
    });
}
