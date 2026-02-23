import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface OnboardingChecklist {
    id: string;
    employee_id: string;
    title: string;
    status: string;
    created_at: string;
    employee?: {
        first_name: string;
        last_name: string;
        avatar_url?: string;
    };
    items?: OnboardingItem[];
}

export interface OnboardingItem {
    id: string;
    checklist_id: string;
    title: string;
    description: string | null;
    due_date: string | null;
    is_completed: boolean;
    created_at: string;
}

export function useOnboardingChecklists() {
    return useQuery({
        queryKey: ['onboarding_checklists'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('onboarding_checklists')
                .select(`
          *,
          employee:employees(first_name, last_name, avatar_url),
          items:onboarding_items(*)
        `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return (data as unknown) as OnboardingChecklist[];
        },
    });
}

export function useUpdateOnboardingStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, status }: { id: string; status: string }) => {
            const { data, error } = await supabase
                .from('onboarding_checklists')
                .update({ status })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['onboarding_checklists'] });
            toast.success('Onboarding status updated');
        },
    });
}

export function useToggleOnboardingItem() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, isCompleted }: { id: string; isCompleted: boolean }) => {
            const { data, error } = await supabase
                .from('onboarding_items')
                .update({ is_completed: isCompleted })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['onboarding_checklists'] });
        },
    });
}
