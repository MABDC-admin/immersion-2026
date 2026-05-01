import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import {
  Activity,
  ArrowRight,
  Award,
  BarChart3,
  ClipboardCheck,
  Edit2,
  Eye,
  FileText,
  Plus,
  Sparkles,
  Target,
  Trash2,
  Trophy,
  Users,
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/hooks/useAuth';
import { useCurrentEmployee } from '@/hooks/useEmployees';
import { EvaluationDetail } from '@/components/evaluations/EvaluationDetail';
import { EvaluationForm } from '@/components/evaluations/EvaluationForm';
import {
  countCompletedRubricItems,
  InternEvaluation,
  RUBRIC_SECTIONS,
  sumEvaluationSection,
  useAssignedInterns,
  useDeleteEvaluation,
  useEvaluations,
} from '@/hooks/useEvaluations';
import { cn } from '@/lib/utils';
import { getEmployeeDepartmentName } from '@/lib/departments';

const statusColors: Record<string, string> = {
  draft: 'border-slate-200 bg-slate-50 text-slate-700',
  submitted: 'border-sky-200 bg-sky-50 text-sky-700',
  finalized: 'border-emerald-200 bg-emerald-50 text-emerald-700',
};

function getInitials(evaluation: InternEvaluation) {
  const first = evaluation.intern?.first_name?.[0] || 'I';
  const last = evaluation.intern?.last_name?.[0] || 'N';
  return `${first}${last}`.toUpperCase();
}

const rubricColors = [
  'bg-orange-500',
  'bg-sky-500',
  'bg-violet-500',
  'bg-emerald-500',
  'bg-rose-500',
];

export default function EvaluationsPage() {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const { data: employee } = useCurrentEmployee(user?.id || '');
  const { data: evaluations = [], isLoading } = useEvaluations(employee?.id || '');
  const { data: assignedInterns = [] } = useAssignedInterns(employee?.id || '');
  const [searchParams] = useSearchParams();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedEval, setSelectedEval] = useState<InternEvaluation | null>(null);
  const [viewEval, setViewEval] = useState<InternEvaluation | null>(null);
  const [deleteEval, setDeleteEval] = useState<InternEvaluation | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const deleteEvaluation = useDeleteEvaluation();

  const preselectedInternId = searchParams.get('intern');
  const filtered = statusFilter === 'all' ? evaluations : evaluations.filter((evaluation) => evaluation.status === statusFilter);
  const summary = useMemo(() => {
    const submitted = evaluations.filter((evaluation) => evaluation.status === 'submitted').length;
    const finalized = evaluations.filter((evaluation) => evaluation.status === 'finalized').length;
    const draft = evaluations.filter((evaluation) => evaluation.status === 'draft').length;
    const completedInternIds = new Set(
      evaluations
        .filter((evaluation) => evaluation.status === 'submitted' || evaluation.status === 'finalized')
        .map((evaluation) => evaluation.intern_id)
    );
    const averageScore = evaluations.length > 0
      ? evaluations.reduce((sum, evaluation) => sum + (evaluation.overall_score ?? 0), 0) / evaluations.length
      : 0;
    const coverage = assignedInterns.length > 0 ? Math.round((completedInternIds.size / assignedInterns.length) * 100) : 0;

    return {
      total: evaluations.length,
      submitted,
      finalized,
      draft,
      awardEligible: evaluations.filter((evaluation) => evaluation.award_eligible).length,
      averageScore,
      coverage,
      completedInterns: completedInternIds.size,
    };
  }, [assignedInterns.length, evaluations]);
  const topEvaluation = useMemo(
    () =>
      [...evaluations]
        .filter((evaluation) => typeof evaluation.overall_score === 'number')
        .sort((a, b) => (b.overall_score || 0) - (a.overall_score || 0))[0],
    [evaluations]
  );
  const recentEvaluations = useMemo(
    () => [...evaluations].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()).slice(0, 4),
    [evaluations]
  );
  const rubricAverages = useMemo(
    () =>
      RUBRIC_SECTIONS.map((section) => {
        const total = evaluations.reduce((sum, evaluation) => sum + sumEvaluationSection(evaluation, section.id), 0);
        const average = evaluations.length > 0 ? total / evaluations.length : 0;
        return { ...section, average };
      }),
    [evaluations]
  );
  const kpiWidgets = [
    {
      label: 'Evaluation Records',
      value: summary.total,
      detail: `${summary.draft} drafts in progress`,
      icon: ClipboardCheck,
      cardClass: 'border-orange-200/80 bg-gradient-to-br from-orange-50 via-white to-white',
      iconClass: 'bg-orange-100 text-orange-700',
    },
    {
      label: 'Coverage',
      value: `${summary.coverage}%`,
      detail: `${summary.completedInterns} of ${assignedInterns.length} interns evaluated`,
      icon: Users,
      cardClass: 'border-emerald-200/80 bg-gradient-to-br from-emerald-50 via-white to-white',
      iconClass: 'bg-emerald-100 text-emerald-700',
    },
    {
      label: 'Average Score',
      value: summary.averageScore.toFixed(1),
      detail: 'Average out of 100',
      icon: BarChart3,
      cardClass: 'border-sky-200/80 bg-gradient-to-br from-sky-50 via-white to-white',
      iconClass: 'bg-sky-100 text-sky-700',
    },
    {
      label: 'Award Eligible',
      value: summary.awardEligible,
      detail: '90+ overall score',
      icon: Trophy,
      cardClass: 'border-amber-200/80 bg-gradient-to-br from-amber-50 via-white to-white',
      iconClass: 'bg-amber-100 text-amber-700',
    },
  ];
  const statusRows = [
    { label: 'Draft', value: summary.draft, color: 'bg-slate-500', badge: statusColors.draft },
    { label: 'Submitted', value: summary.submitted, color: 'bg-sky-500', badge: statusColors.submitted },
    { label: 'Finalized', value: summary.finalized, color: 'bg-emerald-500', badge: statusColors.finalized },
  ];

  const canAuthor = userRole === 'supervisor' || userRole === 'admin' || userRole === 'hr_manager';

  return (
    <MainLayout>
      <div className="space-y-8 animate-fade-in">
        <Card className="overflow-hidden border-white/80 bg-gradient-to-br from-orange-500/15 via-sky-500/10 to-emerald-500/15 shadow-sm">
          <CardContent className="p-0">
            <div className="grid gap-0 xl:grid-cols-[1.45fr_0.85fr]">
              <div className="px-6 py-6 md:px-8">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="border-orange-200 bg-white/80 text-orange-700">
                    Supervisor Evaluations
                  </Badge>
                  <Badge variant="outline" className="border-sky-200 bg-white/80 text-sky-700">
                    Official immersion rubric
                  </Badge>
                </div>
                <h1 className="mt-5 text-3xl font-bold text-foreground">Evaluation Workspace</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                  Create, review, and manage intern evaluations using the official work immersion rubric.
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  {canAuthor && (
                    <Button
                      onClick={() => {
                        setSelectedEval(null);
                        setIsFormOpen(true);
                      }}
                      className="gap-2 bg-orange-600 hover:bg-orange-700"
                    >
                      <Plus className="h-4 w-4" />
                      New Evaluation
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    className="gap-2 border-sky-200 bg-white/80 text-sky-800 hover:bg-sky-50"
                    onClick={() => window.open('/rubrics/work-immersion-internship-rubrics.pdf', '_blank', 'noopener,noreferrer')}
                  >
                    <FileText className="h-4 w-4" />
                    View Rubric PDF
                  </Button>
                </div>
              </div>
              <div className="border-t border-white/70 bg-white/55 px-6 py-6 xl:border-l xl:border-t-0">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                    <Activity className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Evaluation Coverage</p>
                    <p className="text-3xl font-bold text-foreground">{summary.coverage}%</p>
                  </div>
                </div>
                <div className="mt-5 h-3 overflow-hidden rounded-full bg-white">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-orange-500 via-sky-500 to-emerald-500"
                    style={{ width: `${summary.coverage}%` }}
                  />
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  {summary.completedInterns} completed of {assignedInterns.length} assigned interns.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {kpiWidgets.map((widget) => (
            <Card key={widget.label} className={cn('border shadow-sm', widget.cardClass)}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase text-muted-foreground">{widget.label}</p>
                    <p className="mt-2 text-3xl font-bold text-foreground">{widget.value}</p>
                  </div>
                  <div className={cn('rounded-2xl p-3', widget.iconClass)}>
                    <widget.icon className="h-5 w-5" />
                  </div>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{widget.detail}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <Card className="border-white/80 bg-gradient-to-br from-white via-orange-50/60 to-sky-50/60 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>Rubric Categories</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">Five sections, twenty rubric items, 100 total points.</p>
                </div>
                <Badge variant="outline" className="w-fit border-orange-200 bg-orange-50 text-orange-700">
                  5 x 20 points
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                {rubricAverages.map((section, index) => (
                  <div key={section.id} className="rounded-xl border border-white bg-white/85 p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold leading-5 text-foreground">{section.title}</p>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                        {section.maxScore}
                      </span>
                    </div>
                    <p className="mt-3 text-2xl font-bold text-foreground">{section.average.toFixed(1)}</p>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                      <div className={cn('h-full rounded-full', rubricColors[index])} style={{ width: `${Math.min((section.average / 20) * 100, 100)}%` }} />
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">average score</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-violet-200/70 bg-gradient-to-br from-violet-50 via-white to-white shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-4">
                <CardTitle>Status Snapshot</CardTitle>
                <Target className="h-5 w-5 text-violet-600" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {statusRows.map((status) => {
                const percent = evaluations.length > 0 ? (status.value / evaluations.length) * 100 : 0;

                return (
                  <button
                    key={status.label}
                    type="button"
                    className="w-full rounded-xl border border-white bg-white/80 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                    onClick={() => setStatusFilter(status.label.toLowerCase())}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <Badge variant="outline" className={status.badge}>
                        {status.label}
                      </Badge>
                      <span className="text-sm font-semibold text-foreground">{status.value}</span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                      <div className={cn('h-full rounded-full', status.color)} style={{ width: `${percent}%` }} />
                    </div>
                  </button>
                );
              })}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.85fr_1.15fr]">
          <Card className="border-amber-200/70 bg-gradient-to-br from-amber-50 via-white to-white shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-4">
                <CardTitle>Top Evaluation</CardTitle>
                <Award className="h-5 w-5 text-amber-700" />
              </div>
            </CardHeader>
            <CardContent>
              {topEvaluation ? (
                <div className="rounded-xl border border-white bg-white/85 p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 border border-amber-200 shadow-sm">
                      <AvatarImage src={topEvaluation.intern?.avatar_url || ''} />
                      <AvatarFallback className="bg-amber-100 font-semibold text-amber-700">
                        {getInitials(topEvaluation)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {topEvaluation.intern ? `${topEvaluation.intern.first_name} ${topEvaluation.intern.last_name}` : 'Unknown Intern'}
                      </p>
                      <p className="text-xs text-muted-foreground">{topEvaluation.overall_score ?? 0} / 100 overall score</p>
                    </div>
                  </div>
                  <Button variant="outline" className="mt-4 w-full justify-between border-amber-200 bg-white" onClick={() => setViewEval(topEvaluation)}>
                    View Evaluation
                    <ArrowRight className="h-4 w-4 text-amber-700" />
                  </Button>
                </div>
              ) : (
                <p className="rounded-xl border border-dashed bg-white/70 px-4 py-8 text-center text-sm text-muted-foreground">
                  No scored evaluations yet.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="border-sky-200/70 bg-gradient-to-br from-sky-50 via-white to-emerald-50/50 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>Evaluation Records</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">Filter and manage supervisor evaluation records.</p>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full bg-white md:w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="finalized">Finalized</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentEvaluations.length === 0 ? (
                <p className="rounded-xl border border-dashed bg-white/70 px-4 py-8 text-center text-sm text-muted-foreground">
                  Recent evaluations will appear here.
                </p>
              ) : (
                recentEvaluations.map((evaluation) => (
                  <button
                    key={evaluation.id}
                    type="button"
                    className="flex w-full items-center gap-3 rounded-xl border border-white bg-white/85 px-4 py-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                    onClick={() => setViewEval(evaluation)}
                  >
                    <Avatar className="h-10 w-10 border border-sky-100">
                      <AvatarImage src={evaluation.intern?.avatar_url || ''} />
                      <AvatarFallback className="bg-sky-100 text-xs font-semibold text-sky-700">{getInitials(evaluation)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {evaluation.intern ? `${evaluation.intern.first_name} ${evaluation.intern.last_name}` : 'Unknown Intern'}
                        </p>
                        <Badge variant="outline" className={statusColors[evaluation.status] || statusColors.draft}>
                          {evaluation.status}
                        </Badge>
                      </div>
                      <p className="truncate text-xs text-muted-foreground">
                        Updated {format(new Date(evaluation.updated_at), 'MMM d, yyyy')} - {evaluation.overall_score ?? 0} / 100
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 rounded-full bg-muted p-4">
                <ClipboardCheck className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mb-1 text-lg font-semibold">No Evaluations Yet</h3>
              <p className="text-sm text-muted-foreground">Create the first rubric-based evaluation to get started.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {filtered.map((evaluation) => {
              const ratedItems = countCompletedRubricItems(evaluation);
              const completeness = Math.round((ratedItems / 20) * 100);

              return (
                <Card key={evaluation.id} className="overflow-hidden border border-white/80 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                  <CardContent className="p-0">
                    <div
                      className="h-3 w-full bg-gradient-to-r from-orange-500 via-sky-500 to-emerald-500"
                    />
                    <div className="p-5">
                      <div className="flex flex-col gap-5">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-12 w-12 border border-slate-200 shadow-sm">
                            <AvatarImage src={evaluation.intern?.avatar_url || ''} />
                            <AvatarFallback className="bg-orange-100 font-semibold text-orange-700">
                              {getInitials(evaluation)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="truncate text-base font-bold text-slate-900">
                                {evaluation.intern ? `${evaluation.intern.first_name} ${evaluation.intern.last_name}` : 'Unknown Intern'}
                              </h4>
                              <Badge variant="outline" className={statusColors[evaluation.status] || statusColors.draft}>
                                {evaluation.status}
                              </Badge>
                              {evaluation.award_eligible && <Badge className="bg-amber-500 text-black">Award Eligible</Badge>}
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {format(new Date(evaluation.evaluation_period_start), 'MMM d')} - {format(new Date(evaluation.evaluation_period_end), 'MMM d, yyyy')}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {evaluation.intern ? getEmployeeDepartmentName({ department: evaluation.intern.department as { id: string; name: string } | null | undefined, job_title: '' }) : 'Unassigned Department'}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                          <div className="rounded-xl border bg-orange-50/80 p-3">
                            <p className="text-[10px] font-bold uppercase text-orange-700">Score</p>
                            <p className="mt-1 text-2xl font-black text-foreground">{evaluation.overall_score ?? 0}</p>
                          </div>
                          <div className="rounded-xl border bg-sky-50/80 p-3">
                            <p className="text-[10px] font-bold uppercase text-sky-700">Rated</p>
                            <p className="mt-1 text-2xl font-black text-foreground">{ratedItems}/20</p>
                          </div>
                          <div className="rounded-xl border bg-emerald-50/80 p-3">
                            <p className="text-[10px] font-bold uppercase text-emerald-700">Complete</p>
                            <p className="mt-1 text-2xl font-black text-foreground">{completeness}%</p>
                          </div>
                          <div className="rounded-xl border bg-violet-50/80 p-3">
                            <p className="text-[10px] font-bold uppercase text-violet-700">Rating</p>
                            <p className="mt-1 text-2xl font-black text-foreground">{evaluation.overall_rating?.toFixed(1) || '0.0'}</p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="h-2 overflow-hidden rounded-full bg-muted">
                            <div className="h-full rounded-full bg-gradient-to-r from-orange-500 via-sky-500 to-emerald-500" style={{ width: `${completeness}%` }} />
                          </div>
                          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                            <span>Rubric completion</span>
                            <span>{ratedItems} / 20 items</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap justify-end gap-2 border-t pt-4">
                          <Button variant="outline" size="sm" className="gap-1.5 bg-white text-xs" onClick={() => setViewEval(evaluation)}>
                            <Eye className="h-3.5 w-3.5" />
                            View
                          </Button>
                          {evaluation.status !== 'finalized' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1.5 bg-white text-xs"
                              onClick={() => {
                                setSelectedEval(evaluation);
                                setIsFormOpen(true);
                              }}
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                              Edit
                            </Button>
                          )}
                          {evaluation.status !== 'finalized' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1.5 bg-white text-xs text-destructive hover:text-destructive"
                              onClick={() => setDeleteEval(evaluation)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {!canAuthor && (
          <Card className="border-intern-border bg-intern-soft/70">
            <CardContent className="flex items-center gap-3 p-4 text-sm text-orange-900">
              <Target className="h-4 w-4 shrink-0" />
              This workspace is intended for supervisors. You can still review existing records here if they are assigned to your role.
            </CardContent>
          </Card>
        )}
      </div>

      {employee && (
        <EvaluationForm
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          evaluatorId={employee.id}
          evaluation={selectedEval}
          preselectedInternId={preselectedInternId}
        />
      )}

      <EvaluationDetail open={!!viewEval} onOpenChange={() => setViewEval(null)} evaluation={viewEval} />

      <AlertDialog open={!!deleteEval} onOpenChange={(open) => !open && setDeleteEval(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete evaluation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the evaluation for{' '}
              {deleteEval?.intern ? `${deleteEval.intern.first_name} ${deleteEval.intern.last_name}` : 'this intern'}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteEvaluation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async (event) => {
                event.preventDefault();
                if (!deleteEval) return;
                await deleteEvaluation.mutateAsync(deleteEval.id);
                setDeleteEval(null);
              }}
            >
              {deleteEvaluation.isPending ? 'Deleting...' : 'Delete Evaluation'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
