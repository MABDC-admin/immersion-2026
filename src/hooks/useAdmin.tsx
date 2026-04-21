import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const ROLE_PRIORITY = ['admin', 'hr_manager', 'principal', 'supervisor', 'manager', 'payroll_officer', 'employee'] as const;

function resolvePrimaryRole(roles: string[]) {
  return ROLE_PRIORITY.find((role) => roles.includes(role)) || 'employee';
}

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

// ── Users & Roles ──

export function useAllProfiles() {
  return useQuery({
    queryKey: ['admin-profiles'],
    queryFn: async () => {
      const { data: profiles, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      const { data: roles, error: rolesError } = await supabase.from('user_roles').select('*');
      if (rolesError) throw rolesError;
      const { data: employees } = await supabase.from('employees').select('user_id, email');
      const groupedRoles = new Map<string, string[]>();
      roles.forEach((roleRecord) => {
        const existing = groupedRoles.get(roleRecord.user_id) || [];
        existing.push(roleRecord.role);
        groupedRoles.set(roleRecord.user_id, existing);
      });
      const emailMap = new Map(employees?.map(e => [e.user_id, e.email]) || []);
      return profiles.map((profile) => ({
        ...profile,
        role: resolvePrimaryRole(groupedRoles.get(profile.user_id) || []),
        email: emailMap.get(profile.user_id) || undefined,
      })) as UserWithRole[];
    },
  });
}

export function useUpdateUserRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const { data: existing } = await supabase.from('user_roles').select('id').eq('user_id', userId).maybeSingle();
      if (existing) {
        const { error } = await supabase.from('user_roles').update({ role: role as any }).eq('user_id', userId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('user_roles').insert([{ user_id: userId, role: role as any }]);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-profiles'] }); toast.success('Role updated'); },
    onError: (e: any) => toast.error(e.message || 'Failed to update role'),
  });
}

// ── Departments ──

export function useCreateDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; description?: string }) => {
      const { data, error } = await supabase.from('departments').insert(input).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['departments'] }); toast.success('Department created'); },
  });
}

export function useDeleteDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('departments').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['departments'] }); toast.success('Department deleted'); },
  });
}

// ── Locations ──

export function useCreateLocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; city: string; country: string; address?: string }) => {
      const { data, error } = await supabase.from('locations').insert(input).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['locations'] }); toast.success('Location created'); },
  });
}

export function useDeleteLocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('locations').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['locations'] }); toast.success('Location deleted'); },
  });
}

// ── Company Settings ──

export function useCompanySettings() {
  return useQuery({
    queryKey: ['company-settings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('company_settings').select('*').limit(1).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useUpsertCompanySettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: any) => {
      const { id, ...rest } = input;
      if (id) {
        const { error } = await supabase.from('company_settings').update(rest).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('company_settings').insert(rest);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['company-settings'] }); toast.success('Company settings saved'); },
    onError: (e: any) => toast.error(e.message || 'Failed to save'),
  });
}

// ── Leave Types ──

export function useLeaveTypes() {
  return useQuery({
    queryKey: ['leave-types'],
    queryFn: async () => {
      const { data, error } = await supabase.from('leave_types').select('*').order('created_at');
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateLeaveType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; days_per_year: number; carry_over: boolean; is_paid: boolean }) => {
      const { error } = await supabase.from('leave_types').insert(input);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['leave-types'] }); toast.success('Leave type created'); },
  });
}

export function useDeleteLeaveType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('leave_types').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['leave-types'] }); toast.success('Leave type deleted'); },
  });
}

// ── Work Schedules ──

export function useWorkSchedules() {
  return useQuery({
    queryKey: ['work-schedules'],
    queryFn: async () => {
      const { data, error } = await supabase.from('work_schedules').select('*').order('created_at');
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateWorkSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; start_time: string; end_time: string }) => {
      const { error } = await supabase.from('work_schedules').insert(input);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['work-schedules'] }); toast.success('Schedule created'); },
  });
}

export function useDeleteWorkSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('work_schedules').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['work-schedules'] }); toast.success('Schedule deleted'); },
  });
}

// ── Pay Grades ──

export function usePayGrades() {
  return useQuery({
    queryKey: ['pay-grades'],
    queryFn: async () => {
      const { data, error } = await supabase.from('pay_grades').select('*').order('created_at');
      if (error) throw error;
      return data;
    },
  });
}

export function useCreatePayGrade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; min_salary: number; max_salary: number; currency: string }) => {
      const { error } = await supabase.from('pay_grades').insert(input);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pay-grades'] }); toast.success('Pay grade created'); },
  });
}

export function useDeletePayGrade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('pay_grades').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pay-grades'] }); toast.success('Pay grade deleted'); },
  });
}

// ── Approval Workflows ──

export function useApprovalWorkflows() {
  return useQuery({
    queryKey: ['approval-workflows'],
    queryFn: async () => {
      const { data, error } = await supabase.from('approval_workflows').select('*').order('created_at');
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateWorkflow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; module: string }) => {
      const { error } = await supabase.from('approval_workflows').insert({ ...input, steps: [] });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['approval-workflows'] }); toast.success('Workflow created'); },
  });
}

export function useDeleteWorkflow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('approval_workflows').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['approval-workflows'] }); toast.success('Workflow deleted'); },
  });
}

// ── Audit Logs ──

export function useAuditLogs() {
  return useQuery({
    queryKey: ['audit-logs'],
    queryFn: async () => {
      const { data, error } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(100);
      if (error) throw error;
      return data;
    },
  });
}
