import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Settings2, Clock, History, Target, Users } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCurrentEmployee } from '@/hooks/useEmployees';
import { useAllInternsOjt, useOjtOverrides, useCreateOjtOverride } from '@/hooks/useOjtOverrides';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const statusColors: Record<string, string> = {
    in_progress: 'bg-primary text-primary-foreground',
    completed: 'bg-hrms-success text-white',
    extended: 'bg-hrms-warning text-white',
    withdrawn: 'bg-destructive text-white',
};

export default function OjtManagement() {
    const { user } = useAuth();
    const { data: admin } = useCurrentEmployee(user?.id || '');
    const { data: interns = [], isLoading } = useAllInternsOjt();
    const createOverride = useCreateOjtOverride();
    const { toast } = useToast();

    const [selectedInternId, setSelectedInternId] = useState<string | null>(null);
    const [isOverrideOpen, setIsOverrideOpen] = useState(false);

    // Override form state
    const [overrideType, setOverrideType] = useState('hours_adjustment');
    const [hoursValue, setHoursValue] = useState('');
    const [progressPct, setProgressPct] = useState('');
    const [completionStatus, setCompletionStatus] = useState('in_progress');
    const [notes, setNotes] = useState('');

    const { data: selectedOverrides = [] } = useOjtOverrides(selectedInternId || '');

    const selectedIntern = interns.find(i => i.id === selectedInternId);

    const resetForm = () => {
        setOverrideType('hours_adjustment');
        setHoursValue('');
        setProgressPct('');
        setCompletionStatus('in_progress');
        setNotes('');
    };

    const openOverride = (internId: string) => {
        setSelectedInternId(internId);
        resetForm();
        setIsOverrideOpen(true);
    };

    const handleSubmitOverride = async () => {
        if (!admin || !selectedInternId) return;
        try {
            await createOverride.mutateAsync({
                intern_id: selectedInternId,
                admin_id: admin.id,
                override_type: overrideType,
                hours_value: overrideType === 'hours_adjustment' ? parseFloat(hoursValue) || 0 : undefined,
                progress_pct: overrideType === 'progress_override' ? parseFloat(progressPct) || undefined : undefined,
                completion_status: overrideType === 'status_change' ? completionStatus : undefined,
                notes: notes.trim() || undefined,
            });
            toast({ title: 'Override applied successfully' });
            setIsOverrideOpen(false);
            resetForm();
        } catch (err: any) {
            toast({ title: 'Error', description: err.message, variant: 'destructive' });
        }
    };

    // Stats
    const totalInterns = interns.length;
    const completedCount = interns.filter(i => i.completionStatus === 'completed').length;
    const avgProgress = totalInterns > 0
        ? Math.round(interns.reduce((s, i) => s + i.effectiveProgress, 0) / totalInterns)
        : 0;

    return (
        <MainLayout>
            <div className="space-y-6 animate-fade-in">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold">Work Immersion Tracking</h1>
                    <p className="text-sm text-muted-foreground">Override and adjust intern Work Immersion records</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                    <Card className="shadow-sm">
                        <CardContent className="p-3 md:p-4 flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10"><Users className="h-4 w-4 md:h-5 md:w-5 text-primary" /></div>
                            <div>
                                <p className="text-[9px] md:text-[10px] text-muted-foreground uppercase font-bold">Total Interns</p>
                                <p className="text-lg md:text-xl font-bold">{totalInterns}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="shadow-sm">
                        <CardContent className="p-3 md:p-4 flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-hrms-success/10"><Target className="h-4 w-4 md:h-5 md:w-5 text-hrms-success" /></div>
                            <div>
                                <p className="text-[9px] md:text-[10px] text-muted-foreground uppercase font-bold">Completed</p>
                                <p className="text-lg md:text-xl font-bold">{completedCount}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="shadow-sm">
                        <CardContent className="p-3 md:p-4 flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-hrms-warning/10"><Clock className="h-4 w-4 md:h-5 md:w-5 text-hrms-warning" /></div>
                            <div>
                                <p className="text-[9px] md:text-[10px] text-muted-foreground uppercase font-bold">Avg Progress</p>
                                <p className="text-lg md:text-xl font-bold">{avgProgress}%</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="shadow-sm">
                        <CardContent className="p-3 md:p-4 flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-purple-500/10"><History className="h-4 w-4 md:h-5 md:w-5 text-purple-500" /></div>
                            <div>
                                <p className="text-[9px] md:text-[10px] text-muted-foreground uppercase font-bold">In Progress</p>
                                <p className="text-lg md:text-xl font-bold">{totalInterns - completedCount}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Intern List */}
                {isLoading ? (
                    <div className="flex items-center justify-center h-32">
                        <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (
                    <div className="space-y-3">
                        {interns.map(intern => (
                            <Card key={intern.id} className="shadow-sm hover:shadow-md transition-all">
                                <CardContent className="p-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                        {/* Intern info */}
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <Avatar className="h-10 w-10 shrink-0">
                                                <AvatarImage src={intern.avatar_url || ''} />
                                                <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                                                    {`${intern.first_name[0]}${intern.last_name[0]}`}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0 flex-1">
                                                <p className="font-bold text-sm truncate">{intern.first_name} {intern.last_name}</p>
                                                <p className="text-[10px] text-muted-foreground truncate">{intern.job_title} • {intern.email}</p>
                                            </div>
                                        </div>

                                        {/* Progress */}
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className="flex-1 space-y-1">
                                                <div className="flex justify-between text-[10px]">
                                                    <span className="text-muted-foreground font-medium">
                                                        {intern.adjustedHours}h / 80h
                                                    </span>
                                                    <span className="font-bold">{intern.effectiveProgress}%</span>
                                                </div>
                                                <Progress value={intern.effectiveProgress} className="h-2" />
                                            </div>
                                            <Badge className={cn("text-[9px] font-bold uppercase shrink-0", statusColors[intern.completionStatus] || 'bg-muted')}>
                                                {intern.completionStatus.replace('_', ' ')}
                                            </Badge>
                                        </div>

                                        {/* Actions */}
                                        <Button variant="outline" size="sm" className="text-xs gap-1.5 shrink-0" onClick={() => openOverride(intern.id)}>
                                            <Settings2 className="h-3.5 w-3.5" />
                                            <span className="hidden sm:inline">Override</span>
                                        </Button>
                                    </div>

                                    {intern.overrideCount > 0 && (
                                        <p className="text-[10px] text-muted-foreground mt-2 pl-13">
                                            {intern.overrideCount} manual override{intern.overrideCount !== 1 ? 's' : ''} applied
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                        {interns.length === 0 && (
                            <Card className="border-dashed">
                                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                                    <Users className="h-8 w-8 text-muted-foreground mb-3" />
                                    <p className="text-sm text-muted-foreground">No interns found</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}
            </div>

            {/* Override Dialog */}
            <Dialog open={isOverrideOpen} onOpenChange={setIsOverrideOpen}>
                <DialogContent className="sm:max-w-lg w-[95vw]">
                    <DialogHeader>
                        <DialogTitle>Work Immersion Override</DialogTitle>
                        <DialogDescription>
                            {selectedIntern && `Adjust Work Immersion progress for ${selectedIntern.first_name} ${selectedIntern.last_name}`}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedIntern && (
                        <div className="p-3 rounded-lg bg-muted/30 border mb-2">
                            <div className="grid grid-cols-3 gap-2 text-center text-xs">
                                <div>
                                    <p className="text-muted-foreground text-[9px] uppercase font-bold">Base Hours</p>
                                    <p className="font-bold">{selectedIntern.baseHours}h</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-[9px] uppercase font-bold">Adjusted</p>
                                    <p className="font-bold">{selectedIntern.adjustedHours}h</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-[9px] uppercase font-bold">Progress</p>
                                    <p className="font-bold">{selectedIntern.effectiveProgress}%</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label>Override Type</Label>
                            <Select value={overrideType} onValueChange={setOverrideType}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="hours_adjustment">Hours Adjustment</SelectItem>
                                    <SelectItem value="progress_override">Progress Override</SelectItem>
                                    <SelectItem value="status_change">Status Change</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {overrideType === 'hours_adjustment' && (
                            <div className="space-y-2">
                                <Label>Hours to Add/Subtract</Label>
                                <Input type="number" step="0.5" placeholder="e.g. +5 or -2" value={hoursValue} onChange={e => setHoursValue(e.target.value)} />
                                <p className="text-[10px] text-muted-foreground">Use negative values to subtract hours</p>
                            </div>
                        )}

                        {overrideType === 'progress_override' && (
                            <div className="space-y-2">
                                <Label>Set Progress Percentage</Label>
                                <Input type="number" min="0" max="100" step="1" placeholder="e.g. 75" value={progressPct} onChange={e => setProgressPct(e.target.value)} />
                            </div>
                        )}

                        {overrideType === 'status_change' && (
                            <div className="space-y-2">
                                <Label>Completion Status</Label>
                                <Select value={completionStatus} onValueChange={setCompletionStatus}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="in_progress">In Progress</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                        <SelectItem value="extended">Extended</SelectItem>
                                        <SelectItem value="withdrawn">Withdrawn</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label>Admin Notes</Label>
                            <Textarea rows={2} placeholder="Reason for this override..." value={notes} onChange={e => setNotes(e.target.value)} />
                        </div>
                    </div>

                    {/* Override History */}
                    {selectedOverrides.length > 0 && (
                        <div className="border-t pt-3 mt-2">
                            <p className="text-xs font-bold mb-2">Override History</p>
                            <div className="space-y-2 max-h-32 overflow-y-auto">
                                {selectedOverrides.slice(0, 5).map(o => (
                                    <div key={o.id} className="text-[10px] p-2 rounded bg-muted/30 border">
                                        <div className="flex justify-between">
                                            <Badge variant="outline" className="text-[8px]">{o.override_type.replace('_', ' ')}</Badge>
                                            <span className="text-muted-foreground">{format(new Date(o.created_at), 'MMM d, h:mm a')}</span>
                                        </div>
                                        {o.notes && <p className="mt-1 text-muted-foreground">{o.notes}</p>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <DialogFooter className="flex-col sm:flex-row gap-2">
                        <Button variant="outline" onClick={() => setIsOverrideOpen(false)}>Cancel</Button>
                        <Button onClick={handleSubmitOverride} disabled={createOverride.isPending}>
                            {createOverride.isPending ? 'Applying...' : 'Apply Override'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </MainLayout>
    );
}
