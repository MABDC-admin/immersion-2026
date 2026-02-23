import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PerformanceReview {
    id: string;
    employee_id: string;
    reviewer_id: string | null;
    review_date: string;
    rating: number | null;
    comments: string | null;
    status: string;
    created_at: string;
    employee?: {
        first_name: string;
        last_name: string;
        avatar_url?: string;
    };
    reviewer?: {
        first_name: string;
        last_name: string;
    };
}

export function usePerformanceReviews(employeeId?: string) {
    return useQuery({
        queryKey: ['performance_reviews', employeeId],
        queryFn: async () => {
            let query = supabase
                .from('performance_reviews')
                .select(`
          *,
          employee:employees!performance_reviews_employee_id_fkey(first_name, last_name, avatar_url),
          reviewer:employees!performance_reviews_reviewer_id_fkey(first_name, last_name)
        `)
                .order('review_date', { ascending: false });

            if (employeeId) {
                query = query.eq('employee_id', employeeId);
            }

            const { data, error } = await query;

            if (error) throw error;
            return (data as unknown) as PerformanceReview[];
        },
    });
}

export function useCreatePerformanceReview() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: Omit<PerformanceReview, 'id' | 'created_at' | 'employee' | 'reviewer'>) => {
            const { data, error } = await supabase
                .from('performance_reviews')
                .insert([input])
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['performance_reviews'] });
            toast.success('Performance review created successfully');
        },
    });
}
