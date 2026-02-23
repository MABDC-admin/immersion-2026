import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Course {
    id: string;
    title: string;
    description: string | null;
    duration: string | null;
    created_at: string;
}

export interface Enrollment {
    id: string;
    course_id: string;
    employee_id: string;
    progress: number | null;
    status: string;
    created_at: string;
    course?: Course;
    employee?: {
        first_name: string;
        last_name: string;
    };
}

export function useCourses() {
    return useQuery({
        queryKey: ['courses'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('courses')
                .select('*')
                .order('title', { ascending: true });

            if (error) throw error;
            return data as Course[];
        },
    });
}

export function useEnrollments(employeeId?: string) {
    return useQuery({
        queryKey: ['enrollments', employeeId],
        queryFn: async () => {
            let query = supabase
                .from('course_enrollments')
                .select(`
          *,
          course:courses(*),
          employee:employees(first_name, last_name)
        `)
                .order('created_at', { ascending: false });

            if (employeeId) {
                query = query.eq('employee_id', employeeId);
            }

            const { data, error } = await query;

            if (error) throw error;
            return (data as unknown) as Enrollment[];
        },
    });
}

export function useCreateCourse() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: Omit<Course, 'id' | 'created_at'>) => {
            const { data, error } = await supabase
                .from('courses')
                .insert([input])
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['courses'] });
            toast.success('Course created successfully');
        },
    });
}
