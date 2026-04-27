import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const RUBRIC_SECTIONS = [
  {
    id: 'attendance',
    title: 'Attendance & Punctuality',
    maxScore: 20,
    items: [
      { key: 'attendance_arrives_on_time', label: 'Consistency in arriving on time', description: 'The intern demonstrates regular punctuality and is rarely late.' },
      { key: 'attendance_absence_communication', label: 'Communication about absences', description: 'The intern notifies the supervisor proactively about absences or delays.' },
      { key: 'attendance_schedule_adherence', label: 'Adherence to schedule', description: 'The intern follows work hours and deadlines reliably.' },
      { key: 'attendance_meeting_deadline_punctuality', label: 'Punctuality in meetings and deadlines', description: 'The intern arrives punctually for meetings and submits work promptly.' },
    ],
  },
  {
    id: 'attitude',
    title: 'Attitude & Enthusiasm',
    maxScore: 20,
    items: [
      { key: 'attitude_positive_towards_work', label: 'Positivity towards work', description: 'The intern always shows enthusiasm and a positive attitude.' },
      { key: 'attitude_willingness_to_learn', label: 'Willingness to learn', description: 'The intern always demonstrates enthusiasm and a positive outlook.' },
      { key: 'attitude_initiative_in_tasks', label: 'Initiative in tasks', description: 'The intern always proactively seeks additional responsibilities or improvements.' },
      { key: 'attitude_resilience_under_pressure', label: 'Resilience under pressure', description: 'The intern maintains composure and stays motivated during challenges.' },
    ],
  },
  {
    id: 'ethics',
    title: 'Work Ethics & Responsibility',
    maxScore: 20,
    items: [
      { key: 'ethics_task_reliability', label: 'Reliability in completing tasks', description: 'The intern consistently meets commitments.' },
      { key: 'ethics_professional_behavior', label: 'Professional behavior', description: 'The intern demonstrates respectful and appropriate conduct.' },
      { key: 'ethics_confidentiality', label: 'Respect for confidentiality', description: 'The intern handles sensitive information responsibly.' },
      { key: 'ethics_accountability_for_mistakes', label: 'Accountability for mistakes', description: 'The intern takes responsibility for errors and works to correct them.' },
    ],
  },
  {
    id: 'quality',
    title: 'Quality of Work & Accomplishments',
    maxScore: 20,
    items: [
      { key: 'quality_accuracy_thoroughness', label: 'Accuracy and thoroughness', description: 'The intern produces precise and complete work.' },
      { key: 'quality_creativity_problem_solving', label: 'Creativity and problem-solving', description: 'The intern applies innovative solutions and critical thinking.' },
      { key: 'quality_meeting_project_goals', label: 'Meeting project goals', description: 'The intern completes tasks aligned with objectives.' },
      { key: 'quality_initiative_new_tasks', label: 'Initiative in taking on new tasks', description: 'The intern shows eagerness to contribute beyond assigned duties.' },
    ],
  },
  {
    id: 'teamwork',
    title: 'Teamwork & Collaboration',
    maxScore: 20,
    items: [
      { key: 'teamwork_team_communication', label: 'Communication with the team', description: 'The intern shares information effectively and listens actively.' },
      { key: 'teamwork_supportiveness', label: 'Supportiveness to colleagues', description: 'The intern offers help and cooperates well.' },
      { key: 'teamwork_flexibility_adaptability', label: 'Flexibility and adaptability', description: 'The intern adjusts to changes and new directions.' },
      { key: 'teamwork_conflict_resolution', label: 'Conflict resolution skills', description: 'The intern handles disagreements professionally and constructively.' },
    ],
  },
] as const;

export type RubricSection = typeof RUBRIC_SECTIONS[number];
export type EvaluationScoreField = typeof RUBRIC_SECTIONS[number]['items'][number]['key'];
type EvaluationSectionId = typeof RUBRIC_SECTIONS[number]['id'];

export const RUBRIC_FIELD_KEYS: EvaluationScoreField[] = RUBRIC_SECTIONS.flatMap((section) =>
  section.items.map((item) => item.key)
) as EvaluationScoreField[];

export const SUPERVISOR_EVALUATION_GUIDELINES = [
  'Conduct a Comprehensive Review: Carefully assess the intern’s overall performance, including punctuality, quality of work, professionalism, and attitude throughout the internship period.',
  'Refer to Evaluation Criteria: Utilize the established rubric to ensure a consistent and objective assessment of each performance criterion.',
  'Consider Holistic Performance: Take into account the intern’s adaptability, willingness to learn, initiative, and ability to meet assigned responsibilities.',
  'Provide Constructive Feedback: When offering remarks, highlight specific strengths and identify areas for growth to facilitate the intern’s professional development.',
  'Assign an Overall Rating: Based on your thorough evaluation, select an appropriate rating from 1 (being the lowest) to 5 (being the highest).',
  'Ensure Fairness and Objectivity: Maintain impartiality and base your evaluation solely on observable performance and behavior during the internship.',
  'Complete and Submit the Evaluation: Accurately fill out the evaluation form online and ensure it is submitted on or before May 2, 2026.',
  'Additional Note on Awards: Interns who achieve an overall score of 90 or above will be eligible to receive an award during graduation. Please note that it is possible for more than one intern to receive this award.',
] as const;

type NullableScoreMap = Partial<Record<EvaluationScoreField, number | null>>;
export type EvaluationDraftInput = NullableScoreMap & {
  intern_id: string;
  evaluator_id: string;
  evaluation_date: string;
  evaluation_period_start: string;
  evaluation_period_end: string;
  status: 'draft' | 'submitted' | 'finalized';
  comments?: string | null;
  recommendations?: string | null;
  supervisor_comments?: string | null;
  submitted_at?: string | null;
  finalized_at?: string | null;
};

export interface InternEvaluation extends NullableScoreMap {
  id: string;
  intern_id: string;
  evaluator_id: string;
  evaluation_date: string;
  evaluation_period_start: string;
  evaluation_period_end: string;
  status: 'draft' | 'submitted' | 'finalized';
  comments: string | null;
  recommendations: string | null;
  supervisor_comments: string | null;
  submitted_at: string | null;
  finalized_at: string | null;
  attendance_total: number | null;
  attitude_total: number | null;
  ethics_total: number | null;
  quality_total: number | null;
  teamwork_total: number | null;
  overall_score: number | null;
  overall_rating: number | null;
  award_eligible: boolean | null;
  created_at: string;
  updated_at: string;
  intern?: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
    department: { id?: string; name: string } | null;
  };
  evaluator?: {
    id: string;
    first_name: string;
    last_name: string;
    department?: { id?: string; name: string } | null;
  };
}

export interface EvaluationReportRow extends InternEvaluation {
  intern_name: string;
  supervisor_name: string;
  department_name: string;
}

export interface EvaluationReportFilters {
  periodStart?: string;
  periodEnd?: string;
  supervisorId?: string;
  departmentName?: string;
  status?: string;
  awardEligible?: 'all' | 'yes' | 'no';
}

export interface EvaluationReportSummary {
  evaluationCount: number;
  averageOverallScore: number;
  awardEligibleCount: number;
  submittedCount: number;
  finalizedCount: number;
  categoryAverages: Record<EvaluationSectionId, number>;
  scoreBands: { label: string; value: number }[];
  supervisorBreakdown: { supervisorId: string; supervisorName: string; evaluationCount: number; averageScore: number; awardEligibleCount: number }[];
}

function toNumber(value: unknown): number | null {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
}

function normalizeEvaluation(row: Record<string, unknown>): InternEvaluation {
  const scoreEntries = Object.fromEntries(
    RUBRIC_FIELD_KEYS.map((key) => [key, toNumber(row[key])])
  ) as NullableScoreMap;

  return {
    id: String(row.id),
    intern_id: String(row.intern_id),
    evaluator_id: String(row.evaluator_id),
    evaluation_date: String(row.evaluation_date),
    evaluation_period_start: String(row.evaluation_period_start),
    evaluation_period_end: String(row.evaluation_period_end),
    status: (row.status as InternEvaluation['status']) ?? 'draft',
    comments: typeof row.comments === 'string' ? row.comments : null,
    recommendations: typeof row.recommendations === 'string' ? row.recommendations : null,
    supervisor_comments: typeof row.supervisor_comments === 'string' ? row.supervisor_comments : null,
    submitted_at: typeof row.submitted_at === 'string' ? row.submitted_at : null,
    finalized_at: typeof row.finalized_at === 'string' ? row.finalized_at : null,
    attendance_total: toNumber(row.attendance_total),
    attitude_total: toNumber(row.attitude_total),
    ethics_total: toNumber(row.ethics_total),
    quality_total: toNumber(row.quality_total),
    teamwork_total: toNumber(row.teamwork_total),
    overall_score: toNumber(row.overall_score),
    overall_rating: toNumber(row.overall_rating),
    award_eligible: typeof row.award_eligible === 'boolean' ? row.award_eligible : null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    intern: (row.intern as InternEvaluation['intern']) ?? undefined,
    evaluator: (row.evaluator as InternEvaluation['evaluator']) ?? undefined,
    ...scoreEntries,
  };
}

export function sumEvaluationSection(evaluation: Partial<InternEvaluation>, sectionId: EvaluationSectionId) {
  const section = RUBRIC_SECTIONS.find((entry) => entry.id === sectionId);
  if (!section) return 0;
  return section.items.reduce((sum, item) => sum + (evaluation[item.key] ?? 0), 0);
}

export function countCompletedRubricItems(evaluation: Partial<InternEvaluation>) {
  return RUBRIC_FIELD_KEYS.filter((key) => evaluation[key] !== null && evaluation[key] !== undefined).length;
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}

function buildReportSummary(rows: EvaluationReportRow[]): EvaluationReportSummary {
  const evaluationCount = rows.length;
  const categoryAverages = {
    attendance: 0,
    attitude: 0,
    ethics: 0,
    quality: 0,
    teamwork: 0,
  } satisfies Record<EvaluationSectionId, number>;

  if (evaluationCount > 0) {
    for (const section of RUBRIC_SECTIONS) {
      const average = rows.reduce((sum, row) => sum + sumEvaluationSection(row, section.id), 0) / evaluationCount;
      categoryAverages[section.id] = round(average);
    }
  }

  const averageOverallScore = evaluationCount > 0
    ? round(rows.reduce((sum, row) => sum + (row.overall_score ?? 0), 0) / evaluationCount)
    : 0;

  const awardEligibleCount = rows.filter((row) => row.award_eligible).length;
  const submittedCount = rows.filter((row) => row.status === 'submitted').length;
  const finalizedCount = rows.filter((row) => row.status === 'finalized').length;

  const scoreBands = [
    { label: '90-100', value: rows.filter((row) => (row.overall_score ?? 0) >= 90).length },
    { label: '75-89', value: rows.filter((row) => (row.overall_score ?? 0) >= 75 && (row.overall_score ?? 0) < 90).length },
    { label: '60-74', value: rows.filter((row) => (row.overall_score ?? 0) >= 60 && (row.overall_score ?? 0) < 75).length },
    { label: '<60', value: rows.filter((row) => (row.overall_score ?? 0) < 60).length },
  ];

  const supervisorMap = new Map<string, { supervisorId: string; supervisorName: string; evaluationCount: number; totalScore: number; awardEligibleCount: number }>();
  for (const row of rows) {
    const current = supervisorMap.get(row.evaluator_id) ?? {
      supervisorId: row.evaluator_id,
      supervisorName: row.supervisor_name,
      evaluationCount: 0,
      totalScore: 0,
      awardEligibleCount: 0,
    };
    current.evaluationCount += 1;
    current.totalScore += row.overall_score ?? 0;
    current.awardEligibleCount += row.award_eligible ? 1 : 0;
    supervisorMap.set(row.evaluator_id, current);
  }

  const supervisorBreakdown = Array.from(supervisorMap.values())
    .map((entry) => ({
      supervisorId: entry.supervisorId,
      supervisorName: entry.supervisorName,
      evaluationCount: entry.evaluationCount,
      averageScore: entry.evaluationCount > 0 ? round(entry.totalScore / entry.evaluationCount) : 0,
      awardEligibleCount: entry.awardEligibleCount,
    }))
    .sort((a, b) => b.averageScore - a.averageScore);

  return {
    evaluationCount,
    averageOverallScore,
    awardEligibleCount,
    submittedCount,
    finalizedCount,
    categoryAverages,
    scoreBands,
    supervisorBreakdown,
  };
}

export function useAssignedInterns(supervisorId: string) {
  return useQuery({
    queryKey: ['assigned-interns', supervisorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('id, first_name, last_name, avatar_url, status, email, job_title, manager_id, department:departments(id, name)')
        .eq('manager_id', supervisorId)
        .order('first_name', { ascending: true })
        .order('last_name', { ascending: true });
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
      const { data, error } = await (supabase as any)
        .from('intern_evaluations')
        .select(`
          *,
          intern:employees!intern_evaluations_intern_id_fkey(id, first_name, last_name, avatar_url, department:departments(id, name)),
          evaluator:employees!intern_evaluations_evaluator_id_fkey(id, first_name, last_name, department:departments(id, name))
        `)
        .eq('evaluator_id', evaluatorId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return ((data || []) as Record<string, unknown>[]).map(normalizeEvaluation);
    },
    enabled: !!evaluatorId,
  });
}

export function useInternEvaluations(internId: string) {
  return useQuery({
    queryKey: ['intern-evaluations', internId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('intern_evaluations')
        .select(`
          *,
          intern:employees!intern_evaluations_intern_id_fkey(id, first_name, last_name, avatar_url, department:departments(id, name)),
          evaluator:employees!intern_evaluations_evaluator_id_fkey(id, first_name, last_name, department:departments(id, name))
        `)
        .eq('intern_id', internId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return ((data || []) as Record<string, unknown>[]).map(normalizeEvaluation);
    },
    enabled: !!internId,
  });
}

export function useEvaluationReports(filters: EvaluationReportFilters = {}) {
  const query = useQuery({
    queryKey: ['evaluation-reports', filters],
    queryFn: async () => {
      let builder = (supabase as any)
        .from('intern_evaluations')
        .select(`
          *,
          intern:employees!intern_evaluations_intern_id_fkey(id, first_name, last_name, avatar_url, department:departments(id, name)),
          evaluator:employees!intern_evaluations_evaluator_id_fkey(id, first_name, last_name, department:departments(id, name))
        `)
        .order('evaluation_date', { ascending: false });

      if (filters.periodStart) builder = builder.gte('evaluation_period_start', filters.periodStart);
      if (filters.periodEnd) builder = builder.lte('evaluation_period_end', filters.periodEnd);
      if (filters.supervisorId) builder = builder.eq('evaluator_id', filters.supervisorId);
      if (filters.status && filters.status !== 'all') builder = builder.eq('status', filters.status);
      if (filters.awardEligible === 'yes') builder = builder.eq('award_eligible', true);
      if (filters.awardEligible === 'no') builder = builder.eq('award_eligible', false);

      const { data, error } = await builder;
      if (error) throw error;

      let rows = ((data || []) as Record<string, unknown>[]).map(normalizeEvaluation).map((row) => ({
        ...row,
        intern_name: row.intern ? `${row.intern.first_name} ${row.intern.last_name}` : 'Unknown Intern',
        supervisor_name: row.evaluator ? `${row.evaluator.first_name} ${row.evaluator.last_name}` : 'Unknown Supervisor',
        department_name: row.intern?.department?.name || 'Unassigned',
      }));

      if (filters.departmentName && filters.departmentName !== 'all') {
        rows = rows.filter((row) => row.department_name === filters.departmentName);
      }

      return rows;
    },
  });

  const summary = useMemo(
    () => buildReportSummary(query.data || []),
    [query.data]
  );

  return {
    ...query,
    rows: query.data || [],
    summary,
  };
}

export function useCreateEvaluation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (evaluation: EvaluationDraftInput) => {
      const { data, error } = await (supabase as any)
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
      queryClient.invalidateQueries({ queryKey: ['evaluation-reports'] });
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
      const { data, error } = await (supabase as any)
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
      queryClient.invalidateQueries({ queryKey: ['evaluation-reports'] });
      toast({ title: 'Evaluation updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error updating evaluation', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteEvaluation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('intern_evaluations')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evaluations'] });
      queryClient.invalidateQueries({ queryKey: ['intern-evaluations'] });
      queryClient.invalidateQueries({ queryKey: ['evaluation-reports'] });
      toast({ title: 'Evaluation deleted successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error deleting evaluation', description: error.message, variant: 'destructive' });
    },
  });
}
