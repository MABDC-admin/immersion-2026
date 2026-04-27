import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  countCompletedRubricItems,
  EvaluationScoreField,
  InternEvaluation,
  RUBRIC_FIELD_KEYS,
  RUBRIC_SECTIONS,
  SUPERVISOR_EVALUATION_GUIDELINES,
  sumEvaluationSection,
  useAssignedInterns,
  useCreateEvaluation,
  useUpdateEvaluation,
} from '@/hooks/useEvaluations';

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

interface EvaluationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  evaluatorId: string;
  evaluation?: InternEvaluation | null;
  preselectedInternId?: string | null;
}

type ScoreState = Partial<Record<EvaluationScoreField, number>>;

export function EvaluationForm({ open, onOpenChange, evaluatorId, evaluation, preselectedInternId }: EvaluationFormProps) {
  const { data: interns = [] } = useAssignedInterns(evaluatorId);
  const createEvaluation = useCreateEvaluation();
  const updateEvaluation = useUpdateEvaluation();

  const [internId, setInternId] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [scores, setScores] = useState<ScoreState>({});
  const [comments, setComments] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [supervisorComments, setSupervisorComments] = useState('');

  useEffect(() => {
    if (!open) return;

    if (evaluation) {
      setInternId(evaluation.intern_id);
      setPeriodStart(evaluation.evaluation_period_start);
      setPeriodEnd(evaluation.evaluation_period_end);
      const nextScores: ScoreState = {};
      for (const key of RUBRIC_FIELD_KEYS) {
        const value = evaluation[key];
        if (typeof value === 'number') {
          nextScores[key] = value;
        }
      }
      setScores(nextScores);
      setComments(evaluation.comments || '');
      setRecommendations(evaluation.recommendations || '');
      setSupervisorComments(evaluation.supervisor_comments || '');
      return;
    }

    setInternId(preselectedInternId || '');
    setPeriodStart('');
    setPeriodEnd('');
    setScores({});
    setComments('');
    setRecommendations('');
    setSupervisorComments('');
  }, [evaluation, open, preselectedInternId]);

  const completedCount = countCompletedRubricItems(scores);
  const categoryTotals = useMemo(
    () => Object.fromEntries(RUBRIC_SECTIONS.map((section) => [section.id, sumEvaluationSection(scores, section.id)])),
    [scores]
  ) as Record<(typeof RUBRIC_SECTIONS)[number]['id'], number>;
  const overallScore = Object.values(categoryTotals).reduce((sum, value) => sum + value, 0);
  const overallRating = completedCount > 0 ? overallScore / 20 : 0;
  const awardEligible = completedCount === RUBRIC_FIELD_KEYS.length && overallScore >= 90;
  const isPending = createEvaluation.isPending || updateEvaluation.isPending;
  const isEditingSubmitted = evaluation?.status === 'submitted';

  const handleScoreChange = (key: EvaluationScoreField, value: number) => {
    setScores((previous) => ({ ...previous, [key]: value }));
  };

  const handleSubmit = async (status: 'draft' | 'submitted' | 'finalized') => {
    const now = new Date().toISOString();
    const submittedAt = status === 'submitted' || status === 'finalized'
      ? evaluation?.submitted_at || now
      : null;
    const finalizedAt = status === 'finalized'
      ? evaluation?.finalized_at || now
      : null;
    const payload = {
      intern_id: internId,
      evaluator_id: evaluatorId,
      evaluation_date: new Date().toISOString().split('T')[0],
      evaluation_period_start: periodStart,
      evaluation_period_end: periodEnd,
      status,
      comments: comments || null,
      recommendations: recommendations || null,
      supervisor_comments: supervisorComments || null,
      submitted_at: submittedAt,
      finalized_at: finalizedAt,
      ...Object.fromEntries(RUBRIC_FIELD_KEYS.map((key) => [key, scores[key] ?? null])),
    };

    if (evaluation) {
      await updateEvaluation.mutateAsync({ id: evaluation.id, ...payload });
    } else {
      await createEvaluation.mutateAsync(payload);
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            {evaluation ? 'Edit Supervisor Evaluation' : 'Supervisor Evaluation Rubric'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="space-y-1">
              <p className="text-sm font-semibold tracking-wide">M.A. Brain Development Center</p>
              <p className="text-sm text-muted-foreground">Abu Dhabi, United Arab Emirates</p>
              <h2 className="pt-1 text-lg font-bold">Work Immersion Internship</h2>
              <p className="text-sm text-muted-foreground">Guidelines for Supervisors Before Intern Evaluation</p>
            </div>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              {SUPERVISOR_EVALUATION_GUIDELINES.map((guideline) => (
                <li key={guideline} className="flex gap-2">
                  <span className="mt-1 text-foreground">•</span>
                  <span>{guideline}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-orange-200/70 bg-gradient-to-r from-orange-500/10 via-background to-background p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Progress</p>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <Badge variant="outline">{completedCount} / {RUBRIC_FIELD_KEYS.length} items rated</Badge>
                  <Badge className={cn('text-white', awardEligible ? 'bg-emerald-600' : 'bg-primary')}>
                    {overallScore} / 100
                  </Badge>
                  <Badge variant="secondary">{overallRating.toFixed(2)} / 5</Badge>
                  {awardEligible && <Badge className="bg-amber-500 text-black">Award Eligible</Badge>}
                </div>
              </div>
              <p className="max-w-2xl text-sm text-muted-foreground">
                Rate each rubric item from 1 to 5 using the official rating scale from the PDF and base your assessment only on observable internship performance and behavior.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border bg-muted/20 p-4">
            <div className="mb-3">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Rating Scale</p>
            </div>
            <div className="grid gap-3 md:grid-cols-5">
              {Object.entries(RATING_LABELS).map(([value, label]) => {
                const descriptions: Record<string, string> = {
                  '1': 'Fails to meet established expectations; performance is inadequate. Immediate corrective action is required.',
                  '2': 'Performance does not consistently meet expectations and falls below standards in several areas. Requires guidance and targeted development.',
                  '3': 'Meets the basic requirements and performs adequately. Displays potential for growth despite some gaps that need attention.',
                  '4': 'Consistently meets and occasionally surpasses expectations. Performs well with minimal areas requiring improvement.',
                  '5': 'Demonstrates exceptional performance that exceeds expectations.',
                };

                return (
                  <div key={value} className="rounded-xl border bg-background p-3">
                    <p className="text-base font-bold">{value}</p>
                    <p className="text-sm font-semibold">{label}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{descriptions[value]}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2 md:col-span-1">
              <Label>Intern</Label>
              <Select value={internId} onValueChange={setInternId} disabled={!!evaluation}>
                <SelectTrigger>
                  <SelectValue placeholder="Select intern to evaluate" />
                </SelectTrigger>
                <SelectContent>
                  {interns.map((intern) => (
                    <SelectItem key={intern.id} value={intern.id}>
                      {intern.first_name} {intern.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Period Start</Label>
              <Input type="date" value={periodStart} onChange={(event) => setPeriodStart(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Period End</Label>
              <Input type="date" value={periodEnd} onChange={(event) => setPeriodEnd(event.target.value)} />
            </div>
          </div>

          <div className="space-y-5">
            {RUBRIC_SECTIONS.map((section) => (
              <div key={section.id} className="rounded-2xl border bg-card p-4 shadow-sm">
                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-base font-bold">{section.title}</h3>
                    <p className="text-sm text-muted-foreground">Maximum total: {section.maxScore} points</p>
                  </div>
                  <Badge variant="outline" className="w-fit">
                    Category Total: {categoryTotals[section.id]} / {section.maxScore}
                  </Badge>
                </div>

                <div className="space-y-3">
                  {section.items.map((item, itemIndex) => (
                    <div key={item.key} className="rounded-xl border border-muted/70 bg-muted/20 p-4">
                      <div className="mb-3 flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold">
                            {itemIndex + 1}. {item.label}
                          </p>
                          <p className="text-xs text-muted-foreground">{item.description}</p>
                        </div>
                        <Badge variant="secondary" className="w-fit">
                          {scores[item.key] ? `${scores[item.key]} - ${RATING_LABELS[scores[item.key] as number]}` : 'Not rated'}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-5 gap-2">
                        {[1, 2, 3, 4, 5].map((value) => {
                          const active = scores[item.key] === value;
                          return (
                            <Button
                              key={value}
                              type="button"
                              variant={active ? 'default' : 'outline'}
                              className={cn('h-auto flex-col gap-1 py-3 text-center', active && 'shadow-sm')}
                              onClick={() => handleScoreChange(item.key, value)}
                            >
                              <span className="text-sm font-bold">{value}</span>
                              <span className="text-[10px] leading-tight">{RATING_LABELS[value]}</span>
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="space-y-2 lg:col-span-1">
              <Label>Supervisor Comments</Label>
              <Textarea
                value={supervisorComments}
                onChange={(event) => setSupervisorComments(event.target.value)}
                placeholder="Constructive summary of the intern's performance..."
                rows={5}
              />
            </div>
            <div className="space-y-2 lg:col-span-1">
              <Label>Comments</Label>
              <Textarea
                value={comments}
                onChange={(event) => setComments(event.target.value)}
                placeholder="Specific strengths, examples, or context..."
                rows={5}
              />
            </div>
            <div className="space-y-2 lg:col-span-1">
              <Label>Recommendations</Label>
              <Textarea
                value={recommendations}
                onChange={(event) => setRecommendations(event.target.value)}
                placeholder="Areas for growth and next-step guidance..."
                rows={5}
              />
            </div>
          </div>

          <div className="rounded-2xl border bg-muted/20 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Prepared By</p>
            <div className="mt-2 space-y-1 text-sm text-muted-foreground">
              {PREPARED_BY.map((person) => (
                <p key={person}>{person}</p>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
            {!isEditingSubmitted && (
              <Button
                variant="secondary"
                onClick={() => handleSubmit('draft')}
                disabled={isPending || !internId || !periodStart || !periodEnd}
              >
                Save Draft
              </Button>
            )}
            <Button
              onClick={() => handleSubmit('submitted')}
              disabled={isPending || !internId || !periodStart || !periodEnd || completedCount < RUBRIC_FIELD_KEYS.length}
            >
              {isEditingSubmitted ? 'Save Submitted Changes' : 'Submit Evaluation'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
