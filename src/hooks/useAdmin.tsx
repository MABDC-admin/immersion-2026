import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface UserWithRole {
    id: string;
    user_id: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
    created_at: string;
    role?: string;
    email?: string;
}

export function useAllProfiles() {
    return useQuery({
        queryKey: ['admin-profiles'],
        queryFn: async () => {
            const { data: profiles, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) throw error;

            const { data: roles, error: rolesError } = await supabase
                .from('user_roles')
                .select('*');
            if (rolesError) throw rolesError;

            const roleMap = new Map(roles.map(r => [r.user_id, r.role]));

            return profiles.map(p => ({
                ...p,
                role: roleMap.get(p.user_id) || 'employee',
            })) as UserWithRole[];
        },
    });
}

export function useUpdateUserRole() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
            const { data: existing } = await supabase
                .from('user_roles')
                .select('id')
                .eq('user_id', userId)
                .maybeSingle();

            if (existing) {
            const { error } = await supabase
                    .from('user_roles')
                    .update({ role: role as 'admin' | 'hr_manager' | 'employee' })
                    .eq('user_id', userId);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('user_roles')
                    .insert([{ user_id: userId, role: role as 'admin' | 'hr_manager' | 'employee' }]);
                if (error) throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-profiles'] });
            toast.success('User role updated');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to update role');
        },
    });
}

export function useCreateDepartment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: { name: string; description?: string }) => {
            const { data, error } = await supabase
                .from('departments')
                .insert(input)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['departments'] });
            toast.success('Department created');
        },
    });
}

export function useDeleteDepartment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('departments').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['departments'] });
            toast.success('Department deleted');
        },
    });
}

export function useCreateLocation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: { name: string; city: string; country: string; address?: string }) => {
            const { data, error } = await supabase
                .from('locations')
                .insert(input)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['locations'] });
            toast.success('Location created');
        },
    });
}

export function useDeleteLocation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('locations').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['locations'] });
            toast.success('Location deleted');
        },
    });
}
