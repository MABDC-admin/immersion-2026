import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Employee, EmployeeWithRelations, EmployeeDocument, CreateEmployeeInput, Activity, Event } from '@/types/employee';

export type { Employee, EmployeeWithRelations, EmployeeDocument };

export interface SupervisorOption {
  id: string;
  user_id: string | null;
  first_name: string;
  last_name: string;
  job_title: string | null;
  department: {
    name: string;
  } | null;
}

interface UserRoleRecord {
  user_id: string | null;
  role: string;
}

export function isSupervisorLikeEmployee(
  employee: Pick<Employee, 'id' | 'job_title'>,
  supervisorIds: Set<string>
) {
  const jobTitle = employee.job_title?.toLowerCase() || '';
  return supervisorIds.has(employee.id) || jobTitle.includes('supervisor');
}

export function isHiddenPortalAccount(
  employee: Pick<Employee, 'email' | 'job_title' | 'user_id'>,
  hiddenUserIds: Set<string>
) {
  const email = employee.email?.toLowerCase() || '';
  const jobTitle = employee.job_title?.toLowerCase() || '';

  return (
    (!!employee.user_id && hiddenUserIds.has(employee.user_id)) ||
    email.includes('principal') ||
    jobTitle.includes('principal') ||
    jobTitle.includes('oversight')
  );
}

export function useEmployees() {
  return useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const [{ data, error }, { data: rolesData, error: rolesError }] = await Promise.all([
        supabase
          .from('employees')
          .select(`
            *,
            location:locations(id, name, city, country),
            department:departments(id, name)
          `)
          .order('last_name', { ascending: true }),
        supabase
          .from('user_roles')
          .select('user_id, role')
          .eq('role', 'principal'),
      ]);

      if (error) {
        console.error('Error fetching employees:', error);
        throw error;
      }
      if (rolesError) {
        console.error('Error fetching principal roles:', rolesError);
        throw rolesError;
      }

      const hiddenUserIds = new Set(
        ((rolesData || []) as UserRoleRecord[])
          .map((record) => record.user_id)
          .filter((userId): userId is string => Boolean(userId))
      );
      const visibleEmployees = ((data || []) as EmployeeWithRelations[]).filter(
        (employee) => !isHiddenPortalAccount(employee, hiddenUserIds)
      );

      // Fetch managers separately to handle self-referencing
      const employeesWithManagers = await Promise.all(
        visibleEmployees.map(async (employee) => {
          let manager = null;
          if (employee.manager_id) {
            const { data: managerData } = await supabase
              .from('employees')
              .select('id, first_name, last_name')
              .eq('id', employee.manager_id)
              .maybeSingle();
            manager = managerData;
          }
          return {
            ...employee,
            manager,
          } as EmployeeWithRelations;
        })
      );

      return employeesWithManagers;
    },
  });
}

export function useEmployee(id: string) {
  return useQuery({
    queryKey: ['employee', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select(`
          *,
          location:locations(id, name, city, country),
          department:departments(id, name)
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching employee:', error);
        throw error;
      }

      if (!data) return null;

      // Fetch manager separately
      let manager = null;
      if (data.manager_id) {
        const { data: managerData } = await supabase
          .from('employees')
          .select('id, first_name, last_name')
          .eq('id', data.manager_id)
          .maybeSingle();
        manager = managerData;
      }

      return {
        ...data,
        manager,
      } as EmployeeWithRelations;
    },
    enabled: !!id,
  });
}

export function useCurrentEmployee(userId: string) {
  return useQuery({
    queryKey: ['employee', 'current', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select(`
          *,
          location:locations(id, name, city, country),
          department:departments(id, name)
        `)
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching current employee:', error);
        throw error;
      }

      if (!data) return null;

      // Fetch manager separately
      let manager = null;
      if (data.manager_id) {
        const { data: managerData } = await supabase
          .from('employees')
          .select('id, first_name, last_name')
          .eq('id', data.manager_id)
          .maybeSingle();
        manager = managerData;
      }

      return {
        ...data,
        manager,
      } as EmployeeWithRelations;
    },
    enabled: !!userId,
  });
}

export function useSupervisorOptions() {
  return useQuery({
    queryKey: ['supervisor-options'],
    queryFn: async () => {
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'supervisor');

      if (roleError) throw roleError;

      const supervisorUserIds = Array.from(
        new Set((roleData || []).map((record) => record.user_id).filter(Boolean))
      );

      if (supervisorUserIds.length === 0) {
        return [] as SupervisorOption[];
      }

      const { data, error } = await supabase
        .from('employees')
        .select('id, user_id, first_name, last_name, job_title, department:departments(name)')
        .in('user_id', supervisorUserIds)
        .order('first_name', { ascending: true })
        .order('last_name', { ascending: true });

      if (error) throw error;
      return (data || []) as SupervisorOption[];
    },
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (employee: CreateEmployeeInput) => {
      const { data, error } = await supabase
        .from('employees')
        .insert(employee)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['supervisor-options'] });
      toast.success('Employee created successfully');
    },
    onError: (error) => {
      console.error('Error creating employee:', error);
      toast.error('Failed to create employee');
    },
  });
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Employee> & { id: string }) => {
      const { data, error } = await supabase
        .from('employees')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employee', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['supervisor-options'] });
      toast.success('Employee updated successfully');
    },
    onError: (error) => {
      console.error('Error updating employee:', error);
      toast.error('Failed to update employee');
    },
  });
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['supervisor-options'] });
      toast.success('Employee deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting employee:', error);
      toast.error('Failed to delete employee');
    },
  });
}

export function useLocations() {
  return useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return data;
    },
  });
}

export function useDepartments() {
  return useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return data;
    },
  });
}

// Avatar upload hook
export function useUploadAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ employeeId, file }: { employeeId: string; file: File }) => {
      const fileExt = file.name.split('.').pop();
      const filePath = `${employeeId}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update employee record with new avatar URL
      const { error: updateError } = await supabase
        .from('employees')
        .update({ avatar_url: publicUrl })
        .eq('id', employeeId);

      if (updateError) throw updateError;

      return publicUrl;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employee', variables.employeeId] });
      toast.success('Avatar uploaded successfully');
    },
    onError: (error) => {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload avatar');
    },
  });
}

// Document hooks
export function useEmployeeDocuments(employeeId: string) {
  return useQuery({
    queryKey: ['employee-documents', employeeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employee_documents')
        .select('*')
        .eq('employee_id', employeeId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as EmployeeDocument[];
    },
    enabled: !!employeeId,
  });
}

export function useUploadDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ employeeId, file }: { employeeId: string; file: File }) => {
      const filePath = `${employeeId}/${Date.now()}_${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from('employee-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data, error: insertError } = await supabase
        .from('employee_documents')
        .insert({
          employee_id: employeeId,
          file_name: file.name,
          file_path: filePath,
          file_type: file.type,
          file_size: file.size,
        })
        .select()
        .single();

      if (insertError) throw insertError;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['employee-documents', variables.employeeId] });
      toast.success('Document uploaded successfully');
    },
    onError: (error) => {
      console.error('Error uploading document:', error);
      toast.error('Failed to upload document');
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, filePath, employeeId }: { id: string; filePath: string; employeeId: string }) => {
      await supabase.storage.from('employee-documents').remove([filePath]);

      const { error } = await supabase
        .from('employee_documents')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return employeeId;
    },
    onSuccess: (employeeId) => {
      queryClient.invalidateQueries({ queryKey: ['employee-documents', employeeId] });
      toast.success('Document deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document');
    },
  });
}

export function useDownloadDocument() {
  return useMutation({
    mutationFn: async ({ filePath, fileName }: { filePath: string; fileName: string }) => {
      const { data, error } = await supabase.storage
        .from('employee-documents')
        .download(filePath);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    onError: (error) => {
      console.error('Error downloading document:', error);
      toast.error('Failed to download document');
    },
  });
}

export function useActivities() {
  return useQuery({
    queryKey: ['activities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data as Activity[];
    },
  });
}

export function useEvents() {
  return useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true })
        .gte('date', new Date().toISOString().split('T')[0])
        .limit(5);

      if (error) throw error;
      return data as Event[];
    },
  });
}

export function useUpdateTutorialStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ employeeId, completed }: { employeeId: string; completed: boolean }) => {
      const { data, error } = await supabase
        .from('employees')
        .update({ has_completed_tutorial: completed } as never)
        .eq('id', employeeId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['employee', 'current'] });
      queryClient.invalidateQueries({ queryKey: ['employee', variables.employeeId] });
    },
    onError: (error) => {
      console.error('Error updating tutorial status:', error);
    },
  });
}
