import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const TASK_FILES_BUCKET = 'task-submissions';

export interface InternTask {
    id: string;
    supervisor_id: string;
    intern_id: string;
    title: string;
    description: string | null;
    due_date: string | null;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'pending' | 'in_progress' | 'submitted' | 'completed' | 'overdue';
    progress: number;
    submission_notes: string | null;
    submission_file_path: string | null;
    task_attachment_name: string | null;
    task_attachment_path: string | null;
    supervisor_feedback: string | null;
    completed_at: string | null;
    created_at: string;
    updated_at: string;
    intern?: { first_name: string; last_name: string; avatar_url?: string; email: string };
    supervisor?: { first_name: string; last_name: string };
}

export function useSupervisorTasks(supervisorId: string, isAdmin: boolean = false) {
    return useQuery({
        queryKey: ['supervisor-tasks', supervisorId, isAdmin],
        queryFn: async () => {
            if (!supervisorId && !isAdmin) return [];

            let query = supabase
                .from('intern_tasks')
                .select('*, intern:employees!intern_tasks_intern_id_fkey(first_name, last_name, avatar_url, email)')
                .order('created_at', { ascending: false });

            if (!isAdmin) {
                query = query.eq('supervisor_id', supervisorId);
            }

            const { data, error } = await query;
            if (error) throw error;
            return (data || []) as InternTask[];
        },
        enabled: !!supervisorId || isAdmin,
    });
}

export function useInternTasks(internId: string) {
    return useQuery({
        queryKey: ['intern-tasks', internId],
        queryFn: async () => {
            if (!internId) return [];
            const { data, error } = await supabase
                .from('intern_tasks')
                .select('*, supervisor:employees!intern_tasks_supervisor_id_fkey(first_name, last_name)')
                .eq('intern_id', internId)
                .order('due_date', { ascending: true });
            if (error) throw error;
            return (data || []) as InternTask[];
        },
        enabled: !!internId,
    });
}

export function useCreateTask() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (task: {
            supervisor_id: string;
            intern_id?: string;
            intern_ids?: string[];
            assignments?: { intern_id: string; supervisor_id: string }[];
            title: string;
            description?: string;
            due_date?: string;
            priority?: string;
            task_attachment_name?: string | null;
            task_attachment_path?: string | null;
        }) => {
            const assignments = task.assignments && task.assignments.length > 0
                ? task.assignments
                : (task.intern_ids && task.intern_ids.length > 0
                    ? task.intern_ids.map((internId) => ({ intern_id: internId, supervisor_id: task.supervisor_id }))
                    : task.intern_id
                        ? [{ intern_id: task.intern_id, supervisor_id: task.supervisor_id }]
                        : []);

            if (assignments.length === 0) {
                throw new Error('Select at least one intern.');
            }

            const payload = assignments.map(({ intern_id, supervisor_id }) => ({
                supervisor_id,
                intern_id,
                title: task.title,
                description: task.description ?? null,
                due_date: task.due_date ?? null,
                priority: task.priority ?? 'medium',
                task_attachment_name: task.task_attachment_name ?? null,
                task_attachment_path: task.task_attachment_path ?? null,
            }));

            const { data, error } = await supabase
                .from('intern_tasks')
                .insert(payload as any)
                .select()
                .order('created_at', { ascending: false });
            if (error) throw error;
            return data;
        },
        onSuccess: (_, vars) => {
            qc.invalidateQueries({ queryKey: ['supervisor-tasks'] });
            const internIds = vars.assignments && vars.assignments.length > 0
                ? vars.assignments.map(({ intern_id }) => intern_id)
                : vars.intern_ids && vars.intern_ids.length > 0
                    ? vars.intern_ids
                    : vars.intern_id
                        ? [vars.intern_id]
                        : [];

            internIds.forEach((internId) => {
                qc.invalidateQueries({ queryKey: ['intern-tasks', internId] });
            });
        },
    });
}

export function useUpdateTask() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...updates }: { id: string;[key: string]: any }) => {
            const { data, error } = await supabase
                .from('intern_tasks')
                .update(updates as any)
                .eq('id', id)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['supervisor-tasks'] });
            qc.invalidateQueries({ queryKey: ['intern-tasks'] });
        },
    });
}

export function useDeleteTask() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('intern_tasks').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['supervisor-tasks'] });
            qc.invalidateQueries({ queryKey: ['intern-tasks'] });
        },
    });
}

export function useUploadTaskFile() {
    return useMutation({
        mutationFn: async ({ taskId, file }: { taskId: string; file: File }) => {
            const ext = file.name.split('.').pop();
            const path = `${taskId}/${Date.now()}.${ext}`;
            const { error } = await supabase.storage.from(TASK_FILES_BUCKET).upload(path, file);
            if (error) throw error;
            return path;
        },
    });
}

export function useUploadTaskAttachment() {
    return useMutation({
        mutationFn: async ({ file }: { file: File }) => {
            const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
            if (!isPdf) {
                throw new Error('Only PDF files can be attached to a task.');
            }

            const path = `task-attachments/${crypto.randomUUID()}-${Date.now()}.pdf`;
            const { error } = await supabase.storage.from(TASK_FILES_BUCKET).upload(path, file, {
                contentType: 'application/pdf',
            });
            if (error) throw error;
            return {
                path,
                name: file.name,
            };
        },
    });
}
