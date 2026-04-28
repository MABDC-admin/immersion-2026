import { useMemo, useState } from 'react';
import { Award, BarChart3, Calendar, ClipboardCheck, Eye, Star, Trophy } from 'lucide-react';
import { format } from 'date-fns';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { useCurrentEmployee } from '@/hooks/useEmployees';
import { EvaluationDetail } from '@/components/evaluations/EvaluationDetail';
import { InternEvaluation, RUBRIC_SECTIONS, sumEvaluationSection, useInternEvaluations } from '@/hooks/useEvaluations';
import { cn } from '@/lib/utils';

const statusStyles: Record<string, string> = {
  submitted: 'border-sky-200 bg-sky-50 text-sky-700',
  finalized: 'border-emerald-200 bg-emerald-50 text-emerald-700',
};

const sectionColors = ['bg-orange-500', 'bg-sky-500', 'bg-emerald-500', 'bg-violet-500', 'bg-rose-500'];

export default function MyEvaluations() {
  const { user } = useAuth();
  const { data: employee } = useCurrentEmployee(user?.id || '');
  const { data: evaluations = [], isLoading } = useInternEvaluations(employee?.id || '');
  const [selectedEval, setSelectedEval] = useState<InternEvaluation | null>(null);

  const visibleEvaluations = useMemo(
    () => evaluations.filter((evaluation) => evaluation.status === 'submitted' || evaluation.status === 'finalized'),
    [evaluations]
  );
  const averageScore = visibleEvaluations.length > 0
    ? visibleEvaluations.reduce((sum, evaluation) => sum + (evaluation.overall_score ?? 0), 0) / visibleEvaluations.length
    : 0;
  const bestScore = visibleEvaluations.reduce((best, evaluation) => Math.max(best, evaluation.overall_score ?? 0), 0);
  const awardCount = visibleEvaluations.filter((evaluation) => evaluation.award_eligible).length;
  const latestEvaluation = visibleEvaluations[0];

  const widgets = [
    {
      label: 'Evaluations',
      value: visibleEvaluations.length,
      detail: 'Released by supervisor',
      icon: ClipboardCheck,
      cardClass: 'border-orange-200/80 bg-gradient-to-br from-orange-50 via-white to-white',
      iconClass: 'bg-orange-100 text-orange-700',
    },
    {
      label: 'Average Score',
      value: averageScore.toFixed(1),
      detail: 'Out of 100 points',
      icon: Star,
      cardClass: 'border-amber-200/80 bg-gradient-to-br from-amber-50 via-white to-white',
      iconClass: 'bg-amber-100 text-amber-700',
    },
    {
      label: 'Best Score',
      value: bestScore,
      detail: 'Highest evaluation',
      icon: Trophy,
      cardClass: 'border-emerald-200/80 bg-gradient-to-br from-emerald-50 via-white to-white',
      iconClass: 'bg-emerald-100 text-emerald-700',
    },
    {
      label: 'Award Eligible',
      value: awardCount,
      detail: 'Marked by supervisor',
      icon: Award,
      cardClass: 'border-violet-200/80 bg-gradient-to-br from-violet-50 via-white to-white',
      iconClass: 'bg-violet-100 text-violet-700',
    },
  ];

  return (
    <MainLayout>
      <div className="animate-fade-in space-y-8">
        <Card className="overflow-hidden border-white/80 bg-gradient-to-br from-violet-500/15 via-sky-500/10 to-orange-500/15 shadow-sm">
          <CardContent className="p-0">
            <div className="grid gap-0 xl:grid-cols-[1.5fr_0.8fr]">
              <div className="px-6 py-6 md:px-8">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="border-violet-200 bg-white/80 text-violet-700">My Evaluations</Badge>
                  <Badge variant="outline" className="border-sky-200 bg-white/80 text-sky-700">Supervisor feedback</Badge>
                </div>
                <h1 className="mt-5 text-3xl font-bold text-foreground">Performance Review Board</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                  View released evaluation scores, rubric sections, comments, and award eligibility.
                </p>
              </div>
              <div className="border-t border-white/70 bg-white/55 px-6 py-6 xl:border-l xl:border-t-0">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-amber-100 p-3 text-amber-700">
                    <Star className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Average Score</p>
                    <p className="text-3xl font-bold text-foreground">{averageScore.toFixed(1)}</p>
                  </div>
                </div>
                <div className="mt-5 h-3 overflow-hidden rounded-full bg-white">
                  <div className="h-full rounded-full bg-gradient-to-r from-orange-500 via-amber-500 to-emerald-500" style={{ width: `${Math.min(averageScore, 100)}%` }} />
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{visibleEvaluations.length} released evaluation records.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {widgets.map((widget) => (
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

        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : visibleEvaluations.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 rounded-full bg-muted p-4">
                <ClipboardCheck className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mb-1 text-lg font-semibold">No Evaluations Yet</h3>
              <p className="text-sm text-muted-foreground">Submitted supervisor evaluations will appear here once they are available.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {latestEvaluation && (
              <Card className="border-amber-200/70 bg-gradient-to-br from-amber-50 via-white to-white shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-4">
                    <CardTitle>Latest Evaluation</CardTitle>
                    <Calendar className="h-5 w-5 text-amber-700" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm font-bold">
                        {format(new Date(latestEvaluation.evaluation_period_start), 'MMM d')} - {format(new Date(latestEvaluation.evaluation_period_end), 'MMM d, yyyy')}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Evaluated by {latestEvaluation.evaluator ? `${latestEvaluation.evaluator.first_name} ${latestEvaluation.evaluator.last_name}` : 'Supervisor'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-amber-100 px-4 py-2 text-sm font-bold text-amber-800">
                        {latestEvaluation.overall_score ?? 0} / 100
                      </div>
                      <Button variant="outline" size="sm" className="gap-1.5 border-amber-200 bg-white" onClick={() => setSelectedEval(latestEvaluation)}>
                        <Eye className="h-3.5 w-3.5" />
                        Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {visibleEvaluations.map((evaluation) => (
              <Card key={evaluation.id} className="border-white/80 bg-gradient-to-br from-white via-violet-50/40 to-sky-50/50 shadow-sm">
                <CardContent className="p-5">
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-sm font-bold">
                            {format(new Date(evaluation.evaluation_period_start), 'MMM d')} - {format(new Date(evaluation.evaluation_period_end), 'MMM d, yyyy')}
                          </h4>
                          <Badge variant="outline" className={statusStyles[evaluation.status] || statusStyles.submitted}>{evaluation.status}</Badge>
                          {evaluation.award_eligible && <Badge className="bg-amber-400 text-amber-950">Award Eligible</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Evaluated by {evaluation.evaluator ? `${evaluation.evaluator.first_name} ${evaluation.evaluator.last_name}` : 'Supervisor'}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="rounded-full bg-violet-100 px-3 py-1.5 text-sm font-bold text-violet-800">
                          {evaluation.overall_score ?? 0} / 100
                        </div>
                        <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => setSelectedEval(evaluation)}>
                          <Eye className="h-3.5 w-3.5" />
                          Details
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
                      {RUBRIC_SECTIONS.map((section, index) => {
                        const total = sumEvaluationSection(evaluation, section.id);
                        return (
                          <div key={section.id} className="rounded-xl border bg-white/85 p-3 shadow-sm">
                            <p className="truncate text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">{section.title}</p>
                            <p className="mt-2 text-xl font-black">{total}<span className="text-sm font-medium text-muted-foreground"> / 20</span></p>
                            <Progress value={(total / 20) * 100} className="mt-2 h-1.5" />
                            <div className={cn('mt-2 h-1 rounded-full', sectionColors[index] || 'bg-slate-500')} />
                          </div>
                        );
                      })}
                    </div>

                    {evaluation.supervisor_comments && (
                      <div className="rounded-xl border bg-white/85 p-3 shadow-sm">
                        <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Supervisor Comments</p>
                        <p className="text-sm">{evaluation.supervisor_comments}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <EvaluationDetail open={!!selectedEval} onOpenChange={() => setSelectedEval(null)} evaluation={selectedEval} />
    </MainLayout>
  );
}
