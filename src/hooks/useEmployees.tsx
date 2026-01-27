import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Employee {
  id: string;
  user_id?: string;
  employee_id?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  job_title?: string;
  department_id?: string;
  location_id?: string;
  manager_id?: string;
  hire_date: string;
  status: 'active' | 'inactive' | 'on_leave' | 'terminated';
  avatar_url?: string;
  address?: string;
  city?: string;
  country?: string;
  linkedin_url?: string;
  twitter_url?: string;
  slack_username?: string;
  created_at: string;
  updated_at: string;
}

export interface EmployeeWithRelations extends Employee {
  location?: {
    id: string;
    name: string;
    city: string;
    country: string;
  } | null;
  department?: {
    id: string;
    name: string;
  } | null;
  manager?: {
    id: string;
    first_name: string;
    last_name: string;
  } | null;
}

export function useEmployees() {
  return useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select(`
          *,
          location:locations(id, name, city, country),
          department:departments(id, name)
        `)
        .order('last_name', { ascending: true });

      if (error) {
        console.error('Error fetching employees:', error);
        throw error;
      }

      // Fetch managers separately to handle self-referencing
      const employeesWithManagers = await Promise.all(
        (data || []).map(async (employee) => {
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

export function useCreateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (employee: Omit<Employee, 'id' | 'created_at' | 'updated_at'>) => {
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
