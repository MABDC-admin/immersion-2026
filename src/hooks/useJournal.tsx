import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Employee } from '@/types/employee';

export interface JournalEntry {
    id: string;
    employee_id: string;
    entry_date: string;
    activities: string;
    learnings: string | null;
    challenges: string | null;
    supervisor_notes: string | null;
    hours_worked: number | null;
    status: 'draft' | 'pending' | 'approved' | 'rejected';
    created_at: string;
    updated_at: string;
    attachments?: JournalAttachment[];
}

export interface JournalAttachment {
    id: string;
    journal_id: string;
    file_name: string;
    file_path: string;
    file_type: string;
    file_size: number | null;
    created_at: string;
}

interface EmployeeRoleRecord {
    user_id: string;
    role: string;
}

interface EmployeeJournalEmployee extends Pick<Employee, 'id' | 'user_id' | 'first_name' | 'last_name' | 'avatar_url' | 'job_title' | 'status'> {
    department?: {
        name: string;
    } | null;
}

export interface EmployeeJournalGroup {
    employee: EmployeeJournalEmployee;
    entries: JournalEntry[];
    latestEntryDate: string | null;
}

export function useJournalEntries(employeeId: string) {
    return useQuery({
        queryKey: ['journal-entries', employeeId],
        queryFn: async () => {
            if (!employeeId) return [];
            const { data, error } = await (supabase as any)
                .from('intern_journals')
                .select('*, attachments:journal_attachments(*)')
                .eq('employee_id', employeeId)
                .order('entry_date', { ascending: false });
            if (error) throw error;
            return ((data || []) as JournalEntry[]).map((entry) => ({
                ...entry,
                attachments: (entry.attachments || []).sort((a, b) => a.created_at.localeCompare(b.created_at)),
            }));
        },
        enabled: !!employeeId,
    });
}

export function useAdminEmployeeJournalGroups() {
    return useQuery({
        queryKey: ['admin-employee-journal-groups'],
        queryFn: async () => {
            const [{ data: employeesData, error: employeesError }, { data: rolesData, error: rolesError }] = await Promise.all([
                supabase
                    .from('employees')
                    .select('id, user_id, first_name, last_name, avatar_url, job_title, status, department:departments(name)')
                    .order('first_name', { ascending: true }),
                supabase
                    .from('user_roles')
                    .select('user_id, role'),
            ]);

            if (employeesError) throw employeesError;
            if (rolesError) throw rolesError;

            const roles = (rolesData || []) as EmployeeRoleRecord[];
            const supervisorUserIds = new Set(
                roles.filter((roleRecord) => roleRecord.role === 'supervisor').map((roleRecord) => roleRecord.user_id)
            );

            const filteredEmployees = ((employeesData || []) as EmployeeJournalEmployee[]).filter((employee) => {
                if (!employee.user_id) return true;
                return !supervisorUserIds.has(employee.user_id);
            });

            if (filteredEmployees.length === 0) return [] as EmployeeJournalGroup[];

            const employeeIds = filteredEmployees.map((employee) => employee.id);
            const { data: entriesData, error: entriesError } = await supabase
                .from('intern_journals')
                .select('*, attachments:journal_attachments(*)')
                .in('employee_id', employeeIds)
                .order('entry_date', { ascending: false });

            if (entriesError) throw entriesError;

            const entries = ((entriesData || []) as JournalEntry[]).map((entry) => ({
                ...entry,
                attachments: (entry.attachments || []).sort((a, b) => a.created_at.localeCompare(b.created_at)),
            }));
            const entriesByEmployee = new Map<string, JournalEntry[]>();

            entries.forEach((entry) => {
                const existingEntries = entriesByEmployee.get(entry.employee_id) || [];
                existingEntries.push(entry);
                entriesByEmployee.set(entry.employee_id, existingEntries);
            });

            return filteredEmployees.map((employee) => {
                const employeeEntries = entriesByEmployee.get(employee.id) || [];

                return {
                    employee,
                    entries: employeeEntries,
                    latestEntryDate: employeeEntries[0]?.entry_date || null,
                };
            }) as EmployeeJournalGroup[];
        },
    });
}

export function useUploadJournalAttachments() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            journalId,
            employeeId,
            files,
        }: {
            journalId: string;
            employeeId: string;
            files: File[];
        }) => {
            const uploadedAttachments: JournalAttachment[] = [];

            for (const file of files) {
                const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
                const filePath = `${employeeId}/${journalId}/${Date.now()}_${sanitizedName}`;

                const { error: uploadError } = await (supabase as any).storage
                    .from('journal-media')
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                const { data, error } = await (supabase as any)
                    .from('journal_attachments')
                    .insert([{
                        journal_id: journalId,
                        file_name: file.name,
                        file_path: filePath,
                        file_type: file.type,
                        file_size: file.size,
                    }])
                    .select()
                    .single();

                if (error) throw error;
                uploadedAttachments.push(data as JournalAttachment);
            }

            return { journalId, employeeId, uploadedAttachments };
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['journal-entries', variables.employeeId] });
            queryClient.invalidateQueries({ queryKey: ['admin-employee-journal-groups'] });
            queryClient.invalidateQueries({ queryKey: ['admin-journals'] });
        },
    });
}

export function useDeleteJournalAttachment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            attachmentId,
            filePath,
            employeeId,
        }: {
            attachmentId: string;
            filePath: string;
            employeeId: string;
        }) => {
            await (supabase as any).storage.from('journal-media').remove([filePath]);

            const { error } = await (supabase as any)
                .from('journal_attachments')
                .delete()
                .eq('id', attachmentId);

            if (error) throw error;
            return employeeId;
        },
        onSuccess: (employeeId) => {
            queryClient.invalidateQueries({ queryKey: ['journal-entries', employeeId] });
            queryClient.invalidateQueries({ queryKey: ['admin-employee-journal-groups'] });
            queryClient.invalidateQueries({ queryKey: ['admin-journals'] });
        },
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
            const { data, error } = await (supabase as any)
                .from('intern_journals')
                .insert([entry])
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
            status?: 'draft' | 'pending' | 'approved' | 'rejected';
            supervisor_notes?: string;
        }) => {
            const { data, error } = await (supabase as any)
                .from('intern_journals')
                .update(updates)
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
            const { error } = await (supabase as any)
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
export function useApproveJournalEntry() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({
            id,
            employeeId,
            status,
            supervisor_notes,
        }: {
            id: string;
            employeeId: string;
            status: 'approved' | 'rejected';
            supervisor_notes?: string;
        }) => {
            const { data, error } = await (supabase as any)
                .from('intern_journals')
                .update({ status, supervisor_notes })
                .eq('id', id)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: (_, vars) => {
            queryClient.invalidateQueries({ queryKey: ['journal-entries', vars.employeeId] });
            queryClient.invalidateQueries({ queryKey: ['pending-journal-approvals'] });
        },
    });
}

export function usePendingJournalApprovals(supervisorId: string) {
    return useQuery({
        queryKey: ['pending-journal-approvals', supervisorId],
        queryFn: async () => {
            if (!supervisorId) return [];

            // First get assigned intern IDs
            const { data: interns, error: internsError } = await supabase
                .from('employees')
                .select('id')
                .eq('manager_id', supervisorId);

            if (internsError) throw internsError;
            if (!interns || interns.length === 0) return [];

            const internIds = interns.map(i => i.id);

            // Then get pending journals for these interns
            const { data, error } = await (supabase as any)
                .from('intern_journals')
                .select(`
                    *,
                    employee:employees(first_name, last_name, avatar_url)
                `)
                .in('employee_id', internIds)
                .eq('status', 'pending')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as any[];
        },
        enabled: !!supervisorId,
    });
}
