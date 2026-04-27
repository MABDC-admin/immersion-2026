import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { ClipboardCheck, Eye, Plus, Edit2, Target, FileText, Trash2 } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
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
import { countCompletedRubricItems, InternEvaluation, useDeleteEvaluation, useEvaluations } from '@/hooks/useEvaluations';

const statusColors: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  submitted: 'bg-primary text-primary-foreground',
  finalized: 'bg-emerald-600 text-white',
};

function getInitials(evaluation: InternEvaluation) {
  const first = evaluation.intern?.first_name?.[0] || 'I';
  const last = evaluation.intern?.last_name?.[0] || 'N';
  return `${first}${last}`.toUpperCase();
}

export default function EvaluationsPage() {
  const { user, userRole } = useAuth();
  const { data: employee } = useCurrentEmployee(user?.id || '');
  const { data: evaluations = [], isLoading } = useEvaluations(employee?.id || '');
  const [searchParams] = useSearchParams();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedEval, setSelectedEval] = useState<InternEvaluation | null>(null);
  const [viewEval, setViewEval] = useState<InternEvaluation | null>(null);
  const [deleteEval, setDeleteEval] = useState<InternEvaluation | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const deleteEvaluation = useDeleteEvaluation();

  const preselectedInternId = searchParams.get('intern');
  const filtered = statusFilter === 'all' ? evaluations : evaluations.filter((evaluation) => evaluation.status === statusFilter);
  const summary = useMemo(() => ({
    total: evaluations.length,
    submitted: evaluations.filter((evaluation) => evaluation.status !== 'draft').length,
    awardEligible: evaluations.filter((evaluation) => evaluation.award_eligible).length,
  }), [evaluations]);

  const canAuthor = userRole === 'supervisor' || userRole === 'admin' || userRole === 'hr_manager';

  return (
    <MainLayout>
        <div className="space-y-6 animate-fade-in">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Supervisor Evaluations</h1>
              <p className="text-sm text-muted-foreground">DEPED work immersion rubric for assigned interns</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => window.open('/rubrics/work-immersion-internship-rubrics.pdf', '_blank', 'noopener,noreferrer')}
              >
                <FileText className="h-4 w-4" />
                View Rubric PDF
              </Button>
              {canAuthor && (
                <Button
                  onClick={() => {
                    setSelectedEval(null);
                    setIsFormOpen(true);
                  }}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  New Evaluation
                </Button>
              )}
            </div>
          </div>

          <Card className="border-orange-200/70 bg-orange-50/40 shadow-sm">
            <CardContent className="p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Official Rubric</p>
                  <p className="text-sm text-muted-foreground">
                    Supervisors score each intern using the official PDF rubric: 5 categories, 4 criteria per category, every item rated from 1 to 5, with a final score out of 100.
                  </p>
                </div>
                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
                  {[
                    'Attendance & Punctuality',
                    'Attitude & Enthusiasm',
                    'Work Ethics & Responsibility',
                    'Quality of Work & Accomplishments',
                    'Teamwork & Collaboration',
                  ].map((item) => (
                    <div key={item} className="rounded-lg border bg-background px-3 py-2 text-xs font-medium">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="border-l-4 border-l-primary">
            <CardContent className="p-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Total Evaluations</p>
              <p className="mt-2 text-3xl font-black">{summary.total}</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-sky-500">
            <CardContent className="p-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Submitted</p>
              <p className="mt-2 text-3xl font-black">{summary.submitted}</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-amber-500">
            <CardContent className="p-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Award Eligible</p>
              <p className="mt-2 text-3xl font-black">{summary.awardEligible}</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
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
          <div className="space-y-3">
            {filtered.map((evaluation) => {
              const ratedItems = countCompletedRubricItems(evaluation);

              return (
                <Card key={evaluation.id} className="overflow-hidden border border-slate-200/80 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                  <CardContent className="p-0">
                    <div
                      className="h-28 w-full border-b border-slate-200 bg-cover bg-center bg-no-repeat"
                      style={{ backgroundImage: "url('/images/intern-card-header.svg')" }}
                    />
                    <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_220px]">
                      <div className="border-l-4 border-l-primary p-5">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0 space-y-3">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-12 w-12 border border-slate-200 shadow-sm">
                                <AvatarImage src={evaluation.intern?.avatar_url || ''} />
                                <AvatarFallback className="bg-primary/10 font-semibold text-primary">
                                  {getInitials(evaluation)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h4 className="truncate text-base font-bold text-slate-900">
                                    {evaluation.intern ? `${evaluation.intern.first_name} ${evaluation.intern.last_name}` : 'Unknown Intern'}
                                  </h4>
                                  <Badge className={statusColors[evaluation.status] || statusColors.draft}>{evaluation.status}</Badge>
                                  {evaluation.award_eligible && <Badge className="bg-amber-500 text-black">Award Eligible</Badge>}
                                </div>
                                <p className="mt-1 text-sm text-muted-foreground">
                                  Period: {format(new Date(evaluation.evaluation_period_start), 'MMM d')} - {format(new Date(evaluation.evaluation_period_end), 'MMM d, yyyy')}
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                              <span>{ratedItems} / 20 rated</span>
                              <span className="h-1 w-1 rounded-full bg-slate-300" />
                              <span>{evaluation.intern?.department?.name || 'Unassigned Department'}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col justify-between gap-4 bg-slate-50/80 p-5 lg:border-l">
                        <div className="space-y-1">
                          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Total Score</p>
                          <div className="flex items-end gap-2">
                            <span className="text-4xl font-black leading-none text-slate-900">
                              {evaluation.overall_score ?? 0}
                            </span>
                            <span className="pb-1 text-sm font-medium text-muted-foreground">/ 100</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {evaluation.award_eligible ? 'Award eligible performance' : 'Supervisor evaluation record'}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
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
          <Card className="border-orange-200 bg-orange-50/70">
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
