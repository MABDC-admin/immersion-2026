import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { useCreateEvaluation, useUpdateEvaluation, useAssignedInterns, InternEvaluation } from '@/hooks/useEvaluations';

const CRITERIA = [
  { key: 'attendance_punctuality', label: 'Attendance & Punctuality' },
  { key: 'work_quality', label: 'Quality of Work' },
  { key: 'work_quantity', label: 'Quantity of Work' },
  { key: 'initiative_creativity', label: 'Initiative & Creativity' },
  { key: 'teamwork_cooperation', label: 'Teamwork & Cooperation' },
  { key: 'communication_skills', label: 'Communication Skills' },
  { key: 'professionalism', label: 'Professionalism & Work Ethics' },
  { key: 'adaptability', label: 'Adaptability & Flexibility' },
] as const;

const RATING_LABELS: Record<number, string> = {
  1: 'Poor',
  2: 'Needs Improvement',
  3: 'Satisfactory',
  4: 'Very Satisfactory',
  5: 'Outstanding',
};

interface EvaluationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  evaluatorId: string;
  evaluation?: InternEvaluation | null;
  preselectedInternId?: string | null;
}

export function EvaluationForm({ open, onOpenChange, evaluatorId, evaluation, preselectedInternId }: EvaluationFormProps) {
  const { data: interns = [] } = useAssignedInterns(evaluatorId);
  const createEvaluation = useCreateEvaluation();
  const updateEvaluation = useUpdateEvaluation();

  const [internId, setInternId] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [scores, setScores] = useState<Record<string, number>>({});
  const [comments, setComments] = useState('');
  const [recommendations, setRecommendations] = useState('');

  useEffect(() => {
    if (evaluation) {
      setInternId(evaluation.intern_id);
      setPeriodStart(evaluation.evaluation_period_start);
      setPeriodEnd(evaluation.evaluation_period_end);
      const s: Record<string, number> = {};
      CRITERIA.forEach(c => {
        const val = evaluation[c.key as keyof InternEvaluation];
        if (typeof val === 'number') s[c.key] = val;
      });
      setScores(s);
      setComments(evaluation.comments || '');
      setRecommendations(evaluation.recommendations || '');
    } else {
      setInternId(preselectedInternId || '');
      setPeriodStart('');
      setPeriodEnd('');
      setScores({});
      setComments('');
      setRecommendations('');
    }
  }, [evaluation, preselectedInternId, open]);

  const filledScores = CRITERIA.filter(c => scores[c.key] !== undefined);
  const overallRating = filledScores.length > 0
    ? filledScores.reduce((sum, c) => sum + (scores[c.key] || 0), 0) / filledScores.length
    : 0;

  const handleSubmit = async (status: 'draft' | 'submitted') => {
    const payload = {
      intern_id: internId,
      evaluator_id: evaluatorId,
      evaluation_date: new Date().toISOString().split('T')[0],
      evaluation_period_start: periodStart,
      evaluation_period_end: periodEnd,
      status,
      ...Object.fromEntries(CRITERIA.map(c => [c.key, scores[c.key] || null])),
      overall_rating: overallRating > 0 ? Math.round(overallRating * 100) / 100 : null,
      comments: comments || null,
      recommendations: recommendations || null,
    };

    if (evaluation) {
      await updateEvaluation.mutateAsync({ id: evaluation.id, ...payload });
    } else {
      await createEvaluation.mutateAsync(payload as any);
    }
    onOpenChange(false);
  };

  const isPending = createEvaluation.isPending || updateEvaluation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            {evaluation ? 'Edit Evaluation' : 'DEPED Work Immersion Evaluation'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Intern Selection */}
          <div className="space-y-2">
            <Label>Intern</Label>
            <Select value={internId} onValueChange={setInternId} disabled={!!evaluation}>
              <SelectTrigger>
                <SelectValue placeholder="Select intern to evaluate" />
              </SelectTrigger>
              <SelectContent>
                {interns.map(intern => (
                  <SelectItem key={intern.id} value={intern.id}>
                    {intern.first_name} {intern.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Evaluation Period */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Period Start</Label>
              <Input type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Period End</Label>
              <Input type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} />
            </div>
          </div>

          {/* Criteria Scoring */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Evaluation Criteria (1-5 Scale)
            </h3>
            {CRITERIA.map(criterion => (
              <div key={criterion.key} className="space-y-2 p-3 rounded-lg border bg-card">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">{criterion.label}</Label>
                  <Badge variant="outline" className="text-xs font-bold">
                    {scores[criterion.key] ? `${scores[criterion.key]} - ${RATING_LABELS[scores[criterion.key]]}` : 'Not rated'}
                  </Badge>
                </div>
                <Slider
                  min={1}
                  max={5}
                  step={1}
                  value={[scores[criterion.key] || 1]}
                  onValueChange={([val]) => setScores(prev => ({ ...prev, [criterion.key]: val }))}
                  className="py-1"
                />
                <div className="flex justify-between text-[9px] text-muted-foreground">
                  <span>Poor</span>
                  <span>Outstanding</span>
                </div>
              </div>
            ))}
          </div>

          {/* Overall Rating */}
          {overallRating > 0 && (
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-center">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Overall Rating</p>
              <p className="text-3xl font-black text-primary">{overallRating.toFixed(2)}</p>
              <p className="text-sm font-semibold text-primary/80">{RATING_LABELS[Math.round(overallRating)]}</p>
            </div>
          )}

          {/* Comments & Recommendations */}
          <div className="space-y-2">
            <Label>Comments</Label>
            <Textarea value={comments} onChange={e => setComments(e.target.value)} placeholder="General comments about the intern's performance..." rows={3} />
          </div>
          <div className="space-y-2">
            <Label>Recommendations</Label>
            <Textarea value={recommendations} onChange={e => setRecommendations(e.target.value)} placeholder="Recommendations for improvement or commendation..." rows={3} />
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>Cancel</Button>
            <Button variant="secondary" onClick={() => handleSubmit('draft')} disabled={isPending || !internId || !periodStart || !periodEnd}>
              Save Draft
            </Button>
            <Button onClick={() => handleSubmit('submitted')} disabled={isPending || !internId || !periodStart || !periodEnd || filledScores.length < 8}>
              Submit Evaluation
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
