import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { LeaveRequest, CreateLeaveRequestInput, LeaveStatus, LeaveBalance } from '@/types/employee';

export function useLeaveRequests(employeeId?: string) {
    return useQuery({
        queryKey: ['leave_requests', employeeId],
        queryFn: async () => {
            let query = supabase
                .from('leave_requests')
                .select(`
          *,
          employee:employees(first_name, last_name, avatar_url, email)
        `)
                .order('created_at', { ascending: false });

            if (employeeId) {
                query = query.eq('employee_id', employeeId);
            }

            const { data, error } = await query;

            if (error) throw error;
            return (data as unknown) as LeaveRequest[];
        },
    });
}

export function useLeaveBalances(employeeId?: string) {
    return useQuery({
        queryKey: ['leave_balances', employeeId],
        enabled: !!employeeId,
        queryFn: async () => {
            const currentYear = new Date().getFullYear();
            const { data, error } = await supabase
                .from('leave_balances')
                .select('*')
                .eq('employee_id', employeeId!)
                .eq('year', currentYear);

            if (error) throw error;
            return (data as unknown) as LeaveBalance[];
        },
    });
}

export function useCreateLeaveRequest() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: CreateLeaveRequestInput) => {
            const { data, error } = await supabase
                .from('leave_requests')
                .insert([input])
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['leave_requests'] });
            toast.success('Leave request submitted successfully');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to submit leave request');
        },
    });
}

export function useUpdateLeaveStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, status, approvedBy }: { id: string; status: LeaveStatus; approvedBy?: string }) => {
            // Update the leave request status
            const { data, error } = await supabase
                .from('leave_requests')
                .update({ status, approved_by: approvedBy })
                .eq('id', id)
                .select(`
                    *,
                    employee:employees(first_name, last_name, email)
                `)
                .single();

            if (error) throw error;

            // Send email notification
            try {
                const employee = (data as any).employee;
                if (employee?.email) {
                    await supabase.functions.invoke('send-onboarding-email', {
                        body: {
                            to: employee.email,
                            firstName: employee.first_name,
                            lastName: employee.last_name,
                            type: 'leave_status',
                            leaveType: (data as any).leave_type,
                            startDate: (data as any).start_date,
                            endDate: (data as any).end_date,
                            leaveStatus: status,
                        },
                    });
                }
            } catch (emailError) {
                console.error('Failed to send leave status email:', emailError);
                // Don't fail the mutation if email fails
            }

            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['leave_requests'] });
            toast.success('Leave status updated');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to update leave status');
        },
    });
}
