import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ClipboardCheck, Plus, Eye, Edit2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCurrentEmployee } from '@/hooks/useEmployees';
import { useEvaluations, InternEvaluation } from '@/hooks/useEvaluations';
import { EvaluationForm } from '@/components/evaluations/EvaluationForm';
import { EvaluationDetail } from '@/components/evaluations/EvaluationDetail';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const statusColors: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  submitted: 'bg-primary text-primary-foreground',
  finalized: 'bg-hrms-success text-white',
};

export default function EvaluationsPage() {
  const { user } = useAuth();
  const { data: employee } = useCurrentEmployee(user?.id || '');
  const { data: evaluations = [], isLoading } = useEvaluations(employee?.id || '');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedEval, setSelectedEval] = useState<InternEvaluation | null>(null);
  const [viewEval, setViewEval] = useState<InternEvaluation | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filtered = statusFilter === 'all' ? evaluations : evaluations.filter(e => e.status === statusFilter);

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Evaluations</h1>
            <p className="text-sm text-muted-foreground">DEPED Senior High School Work Immersion evaluations</p>
          </div>
          <Button onClick={() => { setSelectedEval(null); setIsFormOpen(true); }} className="gap-2">
            <Plus className="h-4 w-4" />
            New Evaluation
          </Button>
        </div>

        <div className="flex gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
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
          <div className="flex items-center justify-center h-48">
            <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="p-4 rounded-full bg-muted mb-4">
                <ClipboardCheck className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-1">No Evaluations Yet</h3>
              <p className="text-sm text-muted-foreground">Create your first evaluation to get started.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map(ev => (
              <Card key={ev.id} className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-all">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm">
                          {ev.intern ? `${ev.intern.first_name} ${ev.intern.last_name}` : 'Unknown Intern'}
                        </h4>
                        <Badge className={cn("text-[9px] font-bold uppercase rounded-full", statusColors[ev.status])}>
                          {ev.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Period: {format(new Date(ev.evaluation_period_start), 'MMM d')} – {format(new Date(ev.evaluation_period_end), 'MMM d, yyyy')}
                      </p>
                      {ev.overall_rating && (
                        <p className="text-xs font-semibold text-primary">
                          Overall: {Number(ev.overall_rating).toFixed(2)}/5
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => setViewEval(ev)}>
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </Button>
                      {ev.status === 'draft' && (
                        <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => { setSelectedEval(ev); setIsFormOpen(true); }}>
                          <Edit2 className="h-3.5 w-3.5" />
                          Edit
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {employee && (
        <EvaluationForm
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          evaluatorId={employee.id}
          evaluation={selectedEval}
        />
      )}

      <EvaluationDetail
        open={!!viewEval}
        onOpenChange={() => setViewEval(null)}
        evaluation={viewEval}
      />
    </MainLayout>
  );
}
