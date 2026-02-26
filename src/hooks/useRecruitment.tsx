import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { sendOnboardingEmail } from '@/lib/email';

export interface JobPosting {
    id: string;
    title: string;
    description: string | null;
    department_id: string | null;
    location_id: string | null;
    status: string;
    created_at: string;
}

export interface Candidate {
    id: string;
    job_id: string | null;
    first_name: string;
    last_name: string;
    email: string;
    resume_url: string | null;
    status: string;
    cv_data?: any;
    created_at: string;
    job?: JobPosting;
}

export function useJobPostings() {
    return useQuery({
        queryKey: ['job_postings'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('job_postings')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) throw error;
            return data as JobPosting[];
        },
    });
}

export function useCreateJobPosting() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (input: Omit<JobPosting, 'id' | 'created_at'>) => {
            const { data, error } = await supabase
                .from('job_postings')
                .insert([input])
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['job_postings'] });
            toast.success('Job posting created');
        },
    });
}

export function useDeleteJobPosting() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('job_postings').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['job_postings'] });
            toast.success('Job posting deleted');
        },
    });
}

export function useCandidates() {
    return useQuery({
        queryKey: ['candidates'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('candidates')
                .select(`*, job:job_postings(*)`)
                .order('created_at', { ascending: false });
            if (error) throw error;
            return (data as unknown) as Candidate[];
        },
    });
}

export function useCreateCandidate() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (input: Omit<Candidate, 'id' | 'status' | 'created_at' | 'job'>) => {
            const { data, error } = await supabase
                .from('candidates')
                .insert([input])
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['candidates'] });
            toast.success('Application submitted successfully');
        },
    });
}

export function useApproveCandidate() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ candidate, startDate }: { candidate: Candidate; startDate: string }) => {
            const defaultPassword = '654321';

            const { error: updateError } = await supabase
                .from('candidates')
                .update({ status: 'approved' })
                .eq('id', candidate.id);
            if (updateError) throw updateError;

            const { data: employee, error: employeeError } = await supabase
                .from('employees')
                .insert([{
                    first_name: candidate.first_name,
                    last_name: candidate.last_name,
                    email: candidate.email,
                    hire_date: startDate,
                    status: 'active' as const,
                    job_title: candidate.job?.title || 'New Hire',
                    cv_data: candidate.cv_data,
                }])
                .select()
                .single();
            if (employeeError) throw employeeError;

            // Create auth account via edge function
            try {
                const { data: accountData, error: accountError } = await supabase.functions.invoke('create-employee-account', {
                    body: {
                        email: candidate.email,
                        password: defaultPassword,
                        firstName: candidate.first_name,
                        lastName: candidate.last_name,
                    },
                });

                if (accountError) {
                    console.error('Failed to create auth account:', accountError);
                } else if (accountData?.userId && employee?.id) {
                    await supabase.from('employees').update({ user_id: accountData.userId }).eq('id', employee.id);
                }
            } catch (error) {
                console.error('Failed to create auth account:', error);
            }

            const { error: checklistError } = await supabase
                .from('onboarding_checklists')
                .insert([{
                    employee_id: employee.id,
                    title: `Onboarding: ${employee.first_name} ${employee.last_name}`,
                    status: 'in_progress',
                }]);
            if (checklistError) throw checklistError;

            try {
                await sendOnboardingEmail(candidate.email, candidate.first_name, candidate.last_name, startDate, defaultPassword);
            } catch (emailError) {
                console.error('Failed to send approval email:', emailError);
                toast.error('Candidate approved, but failed to send email notification.');
            }

            return employee;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['candidates'] });
            queryClient.invalidateQueries({ queryKey: ['employees'] });
            queryClient.invalidateQueries({ queryKey: ['onboarding_checklists'] });
            toast.success('Candidate approved and transitioned to Onboarding');
        },
    });
}

export function useRejectCandidate() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('candidates')
                .update({ status: 'rejected' })
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['candidates'] });
            toast.success('Candidate application rejected');
        },
    });
}
