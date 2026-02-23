import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface LeaveBalance {
    id: string;
    employee_id: string;
    leave_type: string;
    total_days: number;
    used_days: number;
    remaining_days: number;
    year: number;
}

export interface Announcement {
    id: string;
    title: string;
    content: string;
    category: string;
    created_at: string;
    author?: {
        first_name: string;
        last_name: string;
    };
}

export function useLeaveBalances(employeeId: string) {
    return useQuery({
        queryKey: ['leave_balances', employeeId],
        queryFn: async () => {
            const year = new Date().getFullYear();
            const { data, error } = await supabase
                .from('leave_balances')
                .select('*')
                .eq('employee_id', employeeId)
                .eq('year', year);

            if (error) throw error;
            return data as LeaveBalance[];
        },
        enabled: !!employeeId,
    });
}

export function useAnnouncements() {
    return useQuery({
        queryKey: ['announcements'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('announcements')
                .select(`
          *,
          author:employees(first_name, last_name)
        `)
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as Announcement[];
        },
    });
}
