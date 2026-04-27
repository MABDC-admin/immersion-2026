import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { InternEvaluation, RUBRIC_SECTIONS, SUPERVISOR_EVALUATION_GUIDELINES, sumEvaluationSection } from '@/hooks/useEvaluations';

const RATING_LABELS: Record<number, string> = {
  1: 'Poor',
  2: 'Needs Improvement',
  3: 'Satisfactory',
  4: 'Very Satisfactory',
  5: 'Outstanding',
};

const PREPARED_BY = [
  'ABM Work Immersion Facilitator - Ms. Jade Emerald Amurao',
  'HUMSS Work Immersion Facilitator - Mr. Mark John Ramirez',
  'STEM Work Immersion Facilitator - Mr. Jan Alfred Macalintal',
] as const;

const statusColors: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  submitted: 'bg-primary text-primary-foreground',
  finalized: 'bg-emerald-600 text-white',
};

interface EvaluationDetailProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  evaluation: InternEvaluation | null;
}

function getInitials(evaluation: InternEvaluation) {
  const first = evaluation.intern?.first_name?.[0] || 'I';
  const last = evaluation.intern?.last_name?.[0] || 'N';
  return `${first}${last}`.toUpperCase();
}

export function EvaluationDetail({ open, onOpenChange, evaluation }: EvaluationDetailProps) {
  if (!evaluation) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[92vh] overflow-y-auto border-slate-200 bg-slate-50/50 print:max-w-none print:shadow-none">
        <DialogHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <DialogTitle className="text-lg font-bold">Supervisor Evaluation Report</DialogTitle>
            <div className="flex flex-wrap gap-2">
              <Badge className={statusColors[evaluation.status] || 'bg-muted'}>{evaluation.status.toUpperCase()}</Badge>
              {evaluation.award_eligible && <Badge className="bg-amber-500 text-black">Award Eligible</Badge>}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex min-w-0 items-center gap-4">
                <Avatar className="h-16 w-16 border border-slate-200 shadow-sm">
                  <AvatarImage src={evaluation.intern?.avatar_url || ''} />
                  <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">
                    {getInitials(evaluation)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-semibold tracking-wide">M.A. Brain Development Center</p>
                  <p className="text-sm text-muted-foreground">Abu Dhabi, United Arab Emirates</p>
                  <h2 className="pt-1 text-xl font-bold text-slate-900">
                    {evaluation.intern ? `${evaluation.intern.first_name} ${evaluation.intern.last_name}` : 'Intern Evaluation'}
                  </h2>
                  <p className="text-sm text-muted-foreground">Work Immersion Internship Supervisor Evaluation</p>
                </div>
              </div>

              <div className="rounded-2xl border border-primary/10 bg-primary/5 px-6 py-5 text-center lg:min-w-[220px]">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Total Score</p>
                <div className="mt-2 flex items-end justify-center gap-2">
                  <span className="text-5xl font-black leading-none text-primary">{evaluation.overall_score ?? 0}</span>
                  <span className="pb-1 text-base font-semibold text-muted-foreground">/ 100</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {evaluation.award_eligible ? 'Award eligible' : 'Evaluation completed'}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-white p-5 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Intern</p>
              <p className="mt-1 text-sm font-semibold">
                {evaluation.intern ? `${evaluation.intern.first_name} ${evaluation.intern.last_name}` : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Supervisor</p>
              <p className="mt-1 text-sm font-semibold">
                {evaluation.evaluator ? `${evaluation.evaluator.first_name} ${evaluation.evaluator.last_name}` : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Evaluation Period</p>
              <p className="mt-1 text-sm font-semibold">
                {format(new Date(evaluation.evaluation_period_start), 'MMM d, yyyy')} - {format(new Date(evaluation.evaluation_period_end), 'MMM d, yyyy')}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Date Evaluated</p>
              <p className="mt-1 text-sm font-semibold">{format(new Date(evaluation.evaluation_date), 'MMM d, yyyy')}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="mb-3">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Supervisor Evaluation Notes</p>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {SUPERVISOR_EVALUATION_GUIDELINES.slice(0, 6).map((guideline) => (
                <li key={guideline} className="flex gap-2">
                  <span className="mt-1 text-foreground">•</span>
                  <span>{guideline}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-5">
            {RUBRIC_SECTIONS.map((section) => {
              const sectionTotal = sumEvaluationSection(evaluation, section.id);

              return (
                <div key={section.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-base font-bold">{section.title}</h3>
                      <p className="text-sm text-muted-foreground">Category total: {sectionTotal} / {section.maxScore}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-right">
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Category Total</p>
                      <p className="text-lg font-bold text-slate-900">{sectionTotal} / {section.maxScore}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {section.items.map((item) => {
                      const score = evaluation[item.key];
                      const normalized = score ? (score / 5) * 100 : 0;

                      return (
                        <div key={item.key} className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <p className="text-sm font-semibold">{item.label}</p>
                              <p className="text-xs text-muted-foreground">{item.description}</p>
                            </div>
                            <div className="rounded-xl bg-white px-3 py-2 text-right shadow-sm">
                              <p className="text-lg font-bold text-primary">{score ?? 0}<span className="text-sm text-muted-foreground">/5</span></p>
                              <p className="text-[11px] font-medium text-muted-foreground">
                                {score ? RATING_LABELS[score] : 'Not rated'}
                              </p>
                            </div>
                          </div>
                          <Progress value={normalized} className="h-2.5 bg-slate-200" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {evaluation.supervisor_comments && (
            <div>
              <h3 className="mb-2 text-sm font-bold uppercase tracking-[0.18em] text-muted-foreground">Supervisor Comments</h3>
              <p className="rounded-2xl border border-slate-200 bg-white p-4 text-sm">{evaluation.supervisor_comments}</p>
            </div>
          )}

          {evaluation.comments && (
            <div>
              <h3 className="mb-2 text-sm font-bold uppercase tracking-[0.18em] text-muted-foreground">Comments</h3>
              <p className="rounded-2xl border border-slate-200 bg-white p-4 text-sm">{evaluation.comments}</p>
            </div>
          )}

          {evaluation.recommendations && (
            <div>
              <h3 className="mb-2 text-sm font-bold uppercase tracking-[0.18em] text-muted-foreground">Recommendations</h3>
              <p className="rounded-2xl border border-slate-200 bg-white p-4 text-sm">{evaluation.recommendations}</p>
            </div>
          )}

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Prepared By</p>
            <div className="mt-2 space-y-1 text-sm text-muted-foreground">
              {PREPARED_BY.map((person) => (
                <p key={person}>{person}</p>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
