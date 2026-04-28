import { useEffect, useMemo, useRef, useState } from 'react';
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
  useEvaluations,
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

const SECTION_COLORS = [
  'border-orange-200 bg-orange-50/70 text-orange-700',
  'border-sky-200 bg-sky-50/70 text-sky-700',
  'border-violet-200 bg-violet-50/70 text-violet-700',
  'border-emerald-200 bg-emerald-50/70 text-emerald-700',
  'border-rose-200 bg-rose-50/70 text-rose-700',
] as const;

const SCORE_COLORS: Record<number, string> = {
  1: 'border-rose-200 bg-rose-50 text-rose-700',
  2: 'border-orange-200 bg-orange-50 text-orange-700',
  3: 'border-sky-200 bg-sky-50 text-sky-700',
  4: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  5: 'border-violet-200 bg-violet-50 text-violet-700',
};

interface EvaluationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  evaluatorId: string;
  evaluation?: InternEvaluation | null;
  preselectedInternId?: string | null;
}

type ScoreState = Partial<Record<EvaluationScoreField, number>>;

export function EvaluationForm({ open, onOpenChange, evaluatorId, evaluation, preselectedInternId }: EvaluationFormProps) {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const { data: interns = [] } = useAssignedInterns(evaluatorId);
  const { data: existingEvaluations = [] } = useEvaluations(evaluatorId);
  const createEvaluation = useCreateEvaluation();
  const updateEvaluation = useUpdateEvaluation();

  const [internId, setInternId] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [scores, setScores] = useState<ScoreState>({});
  const [comments, setComments] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [supervisorComments, setSupervisorComments] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  const submittedInternIds = useMemo(
    () =>
      new Set(
        existingEvaluations
          .filter((entry) => entry.status === 'submitted' || entry.status === 'finalized')
          .map((entry) => entry.intern_id)
      ),
    [existingEvaluations]
  );
  const availableInterns = useMemo(
    () => interns.filter((intern) => !submittedInternIds.has(intern.id)),
    [interns, submittedInternIds]
  );

  useEffect(() => {
    if (!open) return;
    setActiveStep(0);

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

    const nextInternId = preselectedInternId && availableInterns.some((intern) => intern.id === preselectedInternId)
      ? preselectedInternId
      : '';
    setInternId(nextInternId);
    setPeriodStart('');
    setPeriodEnd('');
    setScores({});
    setComments('');
    setRecommendations('');
    setSupervisorComments('');
  }, [availableInterns, evaluation, open, preselectedInternId]);

  useEffect(() => {
    if (!open || evaluation || !internId) return;
    if (submittedInternIds.has(internId)) {
      setInternId('');
    }
  }, [evaluation, internId, open, submittedInternIds]);

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
  const rubricStepStart = 2;
  const notesStepIndex = rubricStepStart + RUBRIC_SECTIONS.length;
  const totalSteps = notesStepIndex + 1;
  const currentRubricSection = activeStep >= rubricStepStart && activeStep < notesStepIndex
    ? RUBRIC_SECTIONS[activeStep - rubricStepStart]
    : null;
  const stepLabels = [
    'Setup',
    'Guide',
    ...RUBRIC_SECTIONS.map((section) => section.title.replace(' & ', ' + ')),
    'Notes',
  ];
  const canContinueSetup = Boolean(internId && periodStart && periodEnd);
  const canGoNext = activeStep < totalSteps - 1;
  const completedPercent = Math.round((completedCount / RUBRIC_FIELD_KEYS.length) * 100);

  const handleScoreChange = (key: EvaluationScoreField, value: number) => {
    setScores((previous) => ({ ...previous, [key]: value }));
  };

  const goToStep = (stepIndex: number) => {
    setActiveStep(Math.max(0, Math.min(stepIndex, totalSteps - 1)));
    requestAnimationFrame(() => {
      contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    });
  };

  const goToNextStep = () => {
    goToStep(activeStep + 1);
  };

  const goToPreviousStep = () => {
    goToStep(activeStep - 1);
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
      <DialogContent className="flex max-h-[92vh] max-w-6xl flex-col overflow-hidden p-0">
        <DialogHeader className="border-b bg-gradient-to-br from-orange-50 via-white to-sky-50 px-5 py-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <DialogTitle className="text-lg font-bold">
                {evaluation ? 'Edit Supervisor Evaluation' : 'Supervisor Evaluation Rubric'}
              </DialogTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Step {activeStep + 1} of {totalSteps}: {stepLabels[activeStep]}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{completedCount} / {RUBRIC_FIELD_KEYS.length} rated</Badge>
              <Badge className={cn('text-white', awardEligible ? 'bg-emerald-600' : 'bg-primary')}>
                {overallScore} / 100
              </Badge>
              <Badge variant="secondary">{overallRating.toFixed(2)} / 5</Badge>
              {awardEligible && <Badge className="bg-amber-500 text-black">Award Eligible</Badge>}
            </div>
          </div>

          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white">
            <div
              className="h-full rounded-full bg-gradient-to-r from-orange-500 via-sky-500 to-emerald-500 transition-all"
              style={{ width: `${completedPercent}%` }}
            />
          </div>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {stepLabels.map((label, index) => (
              <button
                key={`${label}-${index}`}
                type="button"
                onClick={() => goToStep(index)}
                className={cn(
                  'shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
                  activeStep === index
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-white text-muted-foreground hover:bg-muted'
                )}
              >
                {index + 1}. {label}
              </button>
            ))}
          </div>
        </DialogHeader>

        <div ref={contentRef} className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          {activeStep === 0 && (
            <div className="space-y-5">
              <div className="overflow-hidden rounded-2xl border border-orange-200/70 bg-gradient-to-br from-orange-50 via-white to-sky-50 p-5 shadow-sm">
                <div className="space-y-1">
                  <p className="text-sm font-semibold tracking-wide">M.A. Brain Development Center</p>
                  <p className="text-sm text-muted-foreground">Abu Dhabi, United Arab Emirates</p>
                  <h2 className="pt-1 text-lg font-bold">Work Immersion Internship</h2>
                  <p className="text-sm text-muted-foreground">
                    Select the intern and evaluation period first. Then use Next to score one section at a time.
                  </p>
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
                      {availableInterns.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-muted-foreground">
                          All assigned interns already have submitted evaluations.
                        </div>
                      ) : availableInterns.map((intern) => (
                        <SelectItem key={intern.id} value={intern.id}>
                          {intern.first_name} {intern.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!evaluation && (
                    <p className="text-xs text-muted-foreground">
                      Interns with submitted or finalized evaluations are hidden from this list.
                    </p>
                  )}
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

              <div className="rounded-2xl border border-orange-200/70 bg-gradient-to-r from-orange-500/10 via-background to-background p-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Progress</p>
                <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
                  The final submit button unlocks after all {RUBRIC_FIELD_KEYS.length} rubric items are rated. Drafts can be saved once an intern and period are selected.
                </p>
              </div>
            </div>
          )}

          {activeStep === 1 && (
            <div className="space-y-5">
              <div className="overflow-hidden rounded-2xl border border-orange-200/70 bg-gradient-to-br from-orange-50 via-white to-sky-50 p-5 shadow-sm">
                <div className="space-y-1">
                  <p className="text-sm font-semibold tracking-wide">Guidelines for Supervisors Before Intern Evaluation</p>
                  <p className="text-sm text-muted-foreground">
                    Base the assessment on observable internship performance and behavior.
                  </p>
                </div>
                <ul className="mt-4 grid gap-2 text-sm text-muted-foreground lg:grid-cols-2">
                  {SUPERVISOR_EVALUATION_GUIDELINES.map((guideline) => (
                    <li key={guideline} className="flex gap-2">
                      <span className="mt-1 text-foreground">•</span>
                      <span>{guideline}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-sky-200/70 bg-gradient-to-br from-sky-50 via-white to-white p-4 shadow-sm">
                <div className="mb-3">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Rating Scale</p>
                </div>
                <div className="grid gap-3 md:grid-cols-5">
                  {Object.entries(RATING_LABELS).map(([value, label]) => {
                    const descriptions: Record<string, string> = {
                      '1': 'Fails to meet established expectations; performance is inadequate.',
                      '2': 'Falls below standards in several areas and requires guidance.',
                      '3': 'Meets basic requirements and performs adequately.',
                      '4': 'Consistently meets and occasionally surpasses expectations.',
                      '5': 'Demonstrates exceptional performance that exceeds expectations.',
                    };

                    return (
                      <div key={value} className={cn('rounded-xl border p-3 shadow-sm', SCORE_COLORS[Number(value)])}>
                        <p className="text-base font-bold">{value}</p>
                        <p className="text-sm font-semibold">{label}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{descriptions[value]}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {currentRubricSection && (
            <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
              <div className={cn('border-b px-4 py-3', SECTION_COLORS[RUBRIC_SECTIONS.findIndex((section) => section.id === currentRubricSection.id)])}>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-base font-bold">{currentRubricSection.title}</h3>
                    <p className="text-sm opacity-80">Maximum total: {currentRubricSection.maxScore} points</p>
                  </div>
                  <Badge variant="outline" className="w-fit bg-white/80">
                    Category Total: {categoryTotals[currentRubricSection.id]} / {currentRubricSection.maxScore}
                  </Badge>
                </div>
              </div>

              <div className="space-y-3 p-4">
                {currentRubricSection.items.map((item, itemIndex) => (
                  <div key={item.key} className="rounded-xl border border-muted/70 bg-gradient-to-br from-white to-muted/20 p-4">
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
          )}

          {activeStep === notesStepIndex && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
                {RUBRIC_SECTIONS.map((section) => (
                  <div key={section.id} className="rounded-2xl border bg-muted/20 p-4">
                    <p className="line-clamp-2 min-h-10 text-sm font-semibold">{section.title}</p>
                    <p className="mt-2 text-2xl font-black text-primary">{categoryTotals[section.id]} / {section.maxScore}</p>
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
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 border-t bg-background px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={goToPreviousStep} disabled={isPending || activeStep === 0}>
              Back
            </Button>
            <span className="text-sm text-muted-foreground">
              {stepLabels[activeStep]}
            </span>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
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
            {canGoNext ? (
              <Button onClick={goToNextStep} disabled={isPending || (activeStep === 0 && !canContinueSetup)}>
                Next
              </Button>
            ) : (
              <Button
                onClick={() => handleSubmit('submitted')}
                disabled={isPending || !internId || !periodStart || !periodEnd || completedCount < RUBRIC_FIELD_KEYS.length}
              >
                {isEditingSubmitted ? 'Save Submitted Changes' : 'Submit Evaluation'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
