import { useMemo, useState } from 'react';
import { ClipboardCheck, Eye, Star, Trophy } from 'lucide-react';
import { format } from 'date-fns';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useCurrentEmployee } from '@/hooks/useEmployees';
import { EvaluationDetail } from '@/components/evaluations/EvaluationDetail';
import { InternEvaluation, RUBRIC_SECTIONS, sumEvaluationSection, useInternEvaluations } from '@/hooks/useEvaluations';

const statusColors: Record<string, string> = {
  submitted: 'bg-primary text-primary-foreground',
  finalized: 'bg-hrms-success text-white',
};

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

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Evaluations</h1>
          <p className="text-sm text-muted-foreground">Supervisor evaluations for your work immersion performance</p>
        </div>

        {visibleEvaluations.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card className="border-l-4 border-l-primary shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Total Evaluations</p>
                    <p className="mt-2 text-2xl font-black">{visibleEvaluations.length}</p>
                  </div>
                  <ClipboardCheck className="h-5 w-5 text-primary" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-amber-500 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Average Score</p>
                    <p className="mt-2 text-2xl font-black">{averageScore.toFixed(2)}<span className="text-sm font-normal text-muted-foreground"> / 100</span></p>
                  </div>
                  <Star className="h-5 w-5 text-amber-500" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-emerald-500 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Award Eligible</p>
                    <p className="mt-2 text-2xl font-black">{visibleEvaluations.filter((evaluation) => evaluation.award_eligible).length}</p>
                  </div>
                  <Trophy className="h-5 w-5 text-hrms-success" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

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
              <p className="text-sm text-muted-foreground">
                Submitted supervisor evaluations will appear here once they are available.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {visibleEvaluations.map((evaluation) => (
              <Card key={evaluation.id} className="border-l-4 border-l-primary shadow-sm transition-all hover:shadow-md">
                <CardContent className="p-5">
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-sm font-bold">
                            {format(new Date(evaluation.evaluation_period_start), 'MMM d')} - {format(new Date(evaluation.evaluation_period_end), 'MMM d, yyyy')}
                          </h4>
                          <Badge className={statusColors[evaluation.status] || statusColors.submitted}>{evaluation.status}</Badge>
                          {evaluation.award_eligible && <Badge className="bg-hrms-warning/100 text-black">Award Eligible</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Evaluated by{' '}
                          <span className="font-medium text-foreground">
                            {evaluation.evaluator ? `${evaluation.evaluator.first_name} ${evaluation.evaluator.last_name}` : 'Unknown'}
                          </span>
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="rounded-full bg-primary/5 px-3 py-1.5 text-sm font-bold text-primary">
                          {evaluation.overall_score ?? 0} / 100
                        </div>
                        <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => setSelectedEval(evaluation)}>
                          <Eye className="h-3.5 w-3.5" />
                          Details
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
                      {RUBRIC_SECTIONS.map((section) => {
                        const total = sumEvaluationSection(evaluation, section.id);
                        return (
                          <div key={section.id} className="rounded-xl border bg-muted/20 p-3">
                            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{section.title}</p>
                            <p className="mt-2 text-xl font-black">{total}<span className="text-sm font-medium text-muted-foreground"> / 20</span></p>
                          </div>
                        );
                      })}
                    </div>

                    {evaluation.supervisor_comments && (
                      <div className="rounded-xl border bg-muted/20 p-3">
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
