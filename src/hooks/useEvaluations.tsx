import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface InternEvaluation {
  id: string;
  intern_id: string;
  evaluator_id: string;
  evaluation_date: string;
  evaluation_period_start: string;
  evaluation_period_end: string;
  status: string;
  attendance_punctuality: number | null;
  work_quality: number | null;
  work_quantity: number | null;
  initiative_creativity: number | null;
  teamwork_cooperation: number | null;
  communication_skills: number | null;
  professionalism: number | null;
  adaptability: number | null;
  overall_rating: number | null;
  comments: string | null;
  recommendations: string | null;
  created_at: string;
  updated_at: string;
  intern?: { id: string; first_name: string; last_name: string; avatar_url: string | null; department: { name: string } | null };
  evaluator?: { id: string; first_name: string; last_name: string };
}

export function useAssignedInterns(supervisorId: string) {
  return useQuery({
    queryKey: ['assigned-interns', supervisorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('*, department:departments(name)')
        .eq('manager_id', supervisorId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!supervisorId,
  });
}

export function useEvaluations(evaluatorId: string) {
  return useQuery({
    queryKey: ['evaluations', evaluatorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('intern_evaluations')
        .select('*, intern:employees!intern_evaluations_intern_id_fkey(id, first_name, last_name, avatar_url, department:departments(name)), evaluator:employees!intern_evaluations_evaluator_id_fkey(id, first_name, last_name)')
        .eq('evaluator_id', evaluatorId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as InternEvaluation[];
    },
    enabled: !!evaluatorId,
  });
}

export function useInternEvaluations(internId: string) {
  return useQuery({
    queryKey: ['intern-evaluations', internId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('intern_evaluations')
        .select('*, evaluator:employees!intern_evaluations_evaluator_id_fkey(id, first_name, last_name)')
        .eq('intern_id', internId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as InternEvaluation[];
    },
    enabled: !!internId,
  });
}

export function useCreateEvaluation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (evaluation: {
      intern_id: string;
      evaluator_id: string;
      evaluation_date: string;
      evaluation_period_start: string;
      evaluation_period_end: string;
      status: string;
      attendance_punctuality?: number;
      work_quality?: number;
      work_quantity?: number;
      initiative_creativity?: number;
      teamwork_cooperation?: number;
      communication_skills?: number;
      professionalism?: number;
      adaptability?: number;
      overall_rating?: number;
      comments?: string;
      recommendations?: string;
    }) => {
      const { data, error } = await supabase
        .from('intern_evaluations')
        .insert(evaluation)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evaluations'] });
      queryClient.invalidateQueries({ queryKey: ['intern-evaluations'] });
      toast({ title: 'Evaluation saved successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error saving evaluation', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateEvaluation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<InternEvaluation>) => {
      const { data, error } = await supabase
        .from('intern_evaluations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evaluations'] });
      queryClient.invalidateQueries({ queryKey: ['intern-evaluations'] });
      toast({ title: 'Evaluation updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error updating evaluation', description: error.message, variant: 'destructive' });
    },
  });
}
