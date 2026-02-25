import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ClipboardCheck, Star, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useCurrentEmployee } from '@/hooks/useEmployees';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { EvaluationDetail } from '@/components/evaluations/EvaluationDetail';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const statusColors: Record<string, string> = {
    draft: 'bg-muted text-muted-foreground',
    submitted: 'bg-primary text-primary-foreground',
    finalized: 'bg-hrms-success text-white',
};

const criteriaLabels = [
    { key: 'work_quality', label: 'Work Quality' },
    { key: 'work_quantity', label: 'Work Quantity' },
    { key: 'attendance_punctuality', label: 'Attendance & Punctuality' },
    { key: 'communication_skills', label: 'Communication Skills' },
    { key: 'teamwork_cooperation', label: 'Teamwork & Cooperation' },
    { key: 'initiative_creativity', label: 'Initiative & Creativity' },
    { key: 'adaptability', label: 'Adaptability' },
    { key: 'professionalism', label: 'Professionalism' },
];

export default function MyEvaluations() {
    const { user } = useAuth();
    const { data: employee } = useCurrentEmployee(user?.id || '');
    const [selectedEval, setSelectedEval] = useState<any>(null);

    // Fetch evaluations where this intern is the subject
    const { data: evaluations = [], isLoading } = useQuery({
        queryKey: ['my-evaluations', employee?.id],
        queryFn: async () => {
            if (!employee?.id) return [];
            const { data, error } = await supabase
                .from('intern_evaluations')
                .select(`
          *,
          evaluator:employees!intern_evaluations_evaluator_id_fkey (first_name, last_name, job_title)
        `)
                .eq('intern_id', employee.id)
                .in('status', ['submitted', 'finalized'])
                .order('evaluation_date', { ascending: false });
            if (error) throw error;
            return data || [];
        },
        enabled: !!employee?.id,
    });

    // Calculate average rating
    const avgRating = evaluations.length > 0
        ? evaluations.reduce((sum: number, ev: any) => sum + (Number(ev.overall_rating) || 0), 0) / evaluations.length
        : 0;

    return (
        <MainLayout>
            <div className="space-y-6 animate-fade-in">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">My Evaluations</h1>
                    <p className="text-sm text-muted-foreground">View performance evaluations from your supervisors</p>
                </div>

                {/* Summary Card */}
                {evaluations.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Card className="border-l-4 border-l-primary shadow-sm">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Total Evaluations</p>
                                        <p className="text-2xl font-bold">{evaluations.length}</p>
                                    </div>
                                    <div className="p-2 rounded-lg bg-primary/10">
                                        <ClipboardCheck className="h-5 w-5 text-primary" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border-l-4 border-l-hrms-warning shadow-sm">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Average Rating</p>
                                        <p className="text-2xl font-bold">{avgRating.toFixed(2)}<span className="text-sm text-muted-foreground font-normal">/5</span></p>
                                    </div>
                                    <div className="p-2 rounded-lg bg-hrms-warning/10">
                                        <Star className="h-5 w-5 text-hrms-warning" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border-l-4 border-l-hrms-success shadow-sm">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Latest Score</p>
                                        <p className="text-2xl font-bold">
                                            {evaluations[0]?.overall_rating
                                                ? `${Number(evaluations[0].overall_rating).toFixed(2)}/5`
                                                : 'N/A'}
                                        </p>
                                    </div>
                                    <div className="p-2 rounded-lg bg-hrms-success/10">
                                        <Star className="h-5 w-5 text-hrms-success" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Evaluations List */}
                {isLoading ? (
                    <div className="flex items-center justify-center h-48">
                        <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : evaluations.length === 0 ? (
                    <Card className="border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="p-4 rounded-full bg-muted mb-4">
                                <ClipboardCheck className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-semibold mb-1">No Evaluations Yet</h3>
                            <p className="text-sm text-muted-foreground">
                                Your supervisor's evaluations will appear here once submitted.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {evaluations.map((ev: any) => (
                            <Card key={ev.id} className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-all">
                                <CardContent className="p-5">
                                    <div className="flex flex-col gap-4">
                                        {/* Header */}
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-bold text-sm">
                                                        {format(new Date(ev.evaluation_period_start), 'MMM d')} – {format(new Date(ev.evaluation_period_end), 'MMM d, yyyy')}
                                                    </h4>
                                                    <Badge className={cn("text-[9px] font-bold uppercase rounded-full", statusColors[ev.status])}>
                                                        {ev.status}
                                                    </Badge>
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    Evaluated by: <span className="font-medium text-foreground">
                                                        {ev.evaluator ? `${ev.evaluator.first_name} ${ev.evaluator.last_name}` : 'Unknown'}
                                                    </span>
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {ev.overall_rating && (
                                                    <div className="flex items-center gap-1.5 bg-primary/5 px-3 py-1.5 rounded-full">
                                                        <Star className="h-4 w-4 text-primary fill-primary" />
                                                        <span className="text-sm font-bold text-primary">{Number(ev.overall_rating).toFixed(2)}/5</span>
                                                    </div>
                                                )}
                                                <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => setSelectedEval(ev)}>
                                                    <Eye className="h-3.5 w-3.5" />
                                                    Details
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Criteria bars */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                                            {criteriaLabels.map(({ key, label }) => {
                                                const val = Number(ev[key]) || 0;
                                                return (
                                                    <div key={key} className="space-y-1">
                                                        <div className="flex justify-between text-[10px]">
                                                            <span className="text-muted-foreground font-medium">{label}</span>
                                                            <span className="font-bold">{val}/5</span>
                                                        </div>
                                                        <Progress value={(val / 5) * 100} className="h-1.5" />
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Comments */}
                                        {ev.comments && (
                                            <div className="p-3 rounded-lg bg-muted/30 border">
                                                <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Comments</p>
                                                <p className="text-sm">{ev.comments}</p>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            <EvaluationDetail
                open={!!selectedEval}
                onOpenChange={() => setSelectedEval(null)}
                evaluation={selectedEval}
            />
        </MainLayout>
    );
}
