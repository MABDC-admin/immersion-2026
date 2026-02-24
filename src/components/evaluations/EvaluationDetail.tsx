import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { InternEvaluation } from '@/hooks/useEvaluations';
import { format } from 'date-fns';

const CRITERIA_LABELS: Record<string, string> = {
  attendance_punctuality: 'Attendance & Punctuality',
  work_quality: 'Quality of Work',
  work_quantity: 'Quantity of Work',
  initiative_creativity: 'Initiative & Creativity',
  teamwork_cooperation: 'Teamwork & Cooperation',
  communication_skills: 'Communication Skills',
  professionalism: 'Professionalism & Work Ethics',
  adaptability: 'Adaptability & Flexibility',
};

const RATING_LABELS: Record<number, string> = {
  1: 'Poor', 2: 'Needs Improvement', 3: 'Satisfactory', 4: 'Very Satisfactory', 5: 'Outstanding',
};

const statusColors: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  submitted: 'bg-primary text-primary-foreground',
  finalized: 'bg-hrms-success text-white',
};

interface EvaluationDetailProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  evaluation: InternEvaluation | null;
}

export function EvaluationDetail({ open, onOpenChange, evaluation }: EvaluationDetailProps) {
  if (!evaluation) return null;

  const criteriaKeys = Object.keys(CRITERIA_LABELS);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto print:max-w-none print:shadow-none">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-bold">DEPED Work Immersion Evaluation</DialogTitle>
            <Badge className={statusColors[evaluation.status] || 'bg-muted'}>
              {evaluation.status.toUpperCase()}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Info */}
          <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-muted/30 border">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-medium">Intern</p>
              <p className="text-sm font-bold">
                {evaluation.intern ? `${evaluation.intern.first_name} ${evaluation.intern.last_name}` : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase font-medium">Evaluator</p>
              <p className="text-sm font-bold">
                {evaluation.evaluator ? `${evaluation.evaluator.first_name} ${evaluation.evaluator.last_name}` : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase font-medium">Evaluation Period</p>
              <p className="text-sm font-medium">
                {format(new Date(evaluation.evaluation_period_start), 'MMM d, yyyy')} – {format(new Date(evaluation.evaluation_period_end), 'MMM d, yyyy')}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase font-medium">Date Evaluated</p>
              <p className="text-sm font-medium">{format(new Date(evaluation.evaluation_date), 'MMM d, yyyy')}</p>
            </div>
          </div>

          {/* Criteria Scores */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Criteria Scores</h3>
            {criteriaKeys.map(key => {
              const score = evaluation[key as keyof InternEvaluation] as number | null;
              return (
                <div key={key} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{CRITERIA_LABELS[key]}</span>
                    <span className="font-bold text-primary">
                      {score ? `${score}/5 – ${RATING_LABELS[score]}` : 'Not rated'}
                    </span>
                  </div>
                  <Progress value={score ? (score / 5) * 100 : 0} className="h-2" />
                </div>
              );
            })}
          </div>

          {/* Overall Rating */}
          {evaluation.overall_rating && (
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-center">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Overall Rating</p>
              <p className="text-3xl font-black text-primary">{Number(evaluation.overall_rating).toFixed(2)}</p>
              <p className="text-sm font-semibold text-primary/80">{RATING_LABELS[Math.round(Number(evaluation.overall_rating))]}</p>
            </div>
          )}

          {/* Comments */}
          {evaluation.comments && (
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">Comments</h3>
              <p className="text-sm text-foreground bg-muted/30 p-3 rounded-lg border">{evaluation.comments}</p>
            </div>
          )}

          {/* Recommendations */}
          {evaluation.recommendations && (
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">Recommendations</h3>
              <p className="text-sm text-foreground bg-muted/30 p-3 rounded-lg border">{evaluation.recommendations}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
