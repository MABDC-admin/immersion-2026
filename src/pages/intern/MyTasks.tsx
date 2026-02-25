import { useState, useRef } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
    Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { ListChecks, Upload, Clock, CheckCircle, Send, FileText, Eye } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCurrentEmployee } from '@/hooks/useEmployees';
import { useInternTasks, useUpdateTask, useUploadTaskFile, InternTask } from '@/hooks/useTasks';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format, isPast, parseISO } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

const priorityColors: Record<string, string> = {
    low: 'text-muted-foreground border-muted-foreground/20',
    medium: 'text-primary border-primary/20',
    high: 'text-hrms-warning border-hrms-warning/20',
    urgent: 'text-destructive border-destructive/20',
};

const statusColors: Record<string, string> = {
    pending: 'bg-muted text-muted-foreground',
    in_progress: 'bg-primary/10 text-primary',
    submitted: 'bg-hrms-warning/10 text-hrms-warning',
    completed: 'bg-hrms-success/10 text-hrms-success',
    overdue: 'bg-destructive/10 text-destructive',
};

export default function MyTasks() {
    const { user } = useAuth();
    const { data: employee } = useCurrentEmployee(user?.id || '');
    const { data: tasks = [], isLoading } = useInternTasks(employee?.id || '');
    const updateTask = useUpdateTask();
    const uploadFile = useUploadTaskFile();
    const { toast } = useToast();

    const [selectedTask, setSelectedTask] = useState<InternTask | null>(null);
    const [submissionNotes, setSubmissionNotes] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    const [filter, setFilter] = useState<string>('all');

    const filteredTasks = filter === 'all' ? tasks : tasks.filter(t => t.status === filter);

    const openSubmit = (task: InternTask) => {
        setSelectedTask(task);
        setSubmissionNotes(task.submission_notes || '');
        setSelectedFile(null);
    };

    const handleSubmit = async () => {
        if (!selectedTask) return;
        try {
            let filePath = selectedTask.submission_file_path;
            if (selectedFile) {
                filePath = await uploadFile.mutateAsync({ taskId: selectedTask.id, file: selectedFile });
            }
            await updateTask.mutateAsync({
                id: selectedTask.id,
                status: 'submitted',
                submission_notes: submissionNotes.trim() || null,
                submission_file_path: filePath,
                progress: 100,
            });
            toast({ title: 'Task submitted successfully!' });
            setSelectedTask(null);
        } catch (err: any) {
            toast({ title: 'Error', description: err.message, variant: 'destructive' });
        }
    };

    const handleStartTask = async (task: InternTask) => {
        try {
            await updateTask.mutateAsync({ id: task.id, status: 'in_progress' });
            toast({ title: 'Task started' });
        } catch (err: any) {
            toast({ title: 'Error', description: err.message, variant: 'destructive' });
        }
    };

    // Stats
    const pending = tasks.filter(t => t.status === 'pending').length;
    const inProgress = tasks.filter(t => t.status === 'in_progress').length;
    const completed = tasks.filter(t => t.status === 'completed').length;

    return (
        <MainLayout>
            <div className="space-y-6 animate-fade-in">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold">My Tasks</h1>
                    <p className="text-sm text-muted-foreground">Tasks assigned by your supervisor</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                    <Card className="shadow-sm">
                        <CardContent className="p-3 flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-hrms-warning/10"><Clock className="h-4 w-4 text-hrms-warning" /></div>
                            <div>
                                <p className="text-lg font-bold">{pending}</p>
                                <p className="text-[9px] text-muted-foreground uppercase font-bold">Pending</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="shadow-sm">
                        <CardContent className="p-3 flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-primary/10"><ListChecks className="h-4 w-4 text-primary" /></div>
                            <div>
                                <p className="text-lg font-bold">{inProgress}</p>
                                <p className="text-[9px] text-muted-foreground uppercase font-bold">Active</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="shadow-sm">
                        <CardContent className="p-3 flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-hrms-success/10"><CheckCircle className="h-4 w-4 text-hrms-success" /></div>
                            <div>
                                <p className="text-lg font-bold">{completed}</p>
                                <p className="text-[9px] text-muted-foreground uppercase font-bold">Done</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filter */}
                <div className="flex gap-2 flex-wrap">
                    {['all', 'pending', 'in_progress', 'submitted', 'completed'].map(f => (
                        <Button
                            key={f}
                            variant={filter === f ? 'default' : 'outline'}
                            size="sm"
                            className="text-xs capitalize"
                            onClick={() => setFilter(f)}
                        >
                            {f === 'all' ? 'All' : f.replace('_', ' ')}
                        </Button>
                    ))}
                </div>

                {/* Task List */}
                {isLoading ? (
                    <div className="flex items-center justify-center h-32">
                        <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : filteredTasks.length === 0 ? (
                    <Card className="border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                            <ListChecks className="h-8 w-8 text-muted-foreground mb-3" />
                            <h3 className="text-lg font-semibold mb-1">No Tasks</h3>
                            <p className="text-sm text-muted-foreground">
                                {filter === 'all' ? 'No tasks assigned yet.' : `No ${filter.replace('_', ' ')} tasks.`}
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {filteredTasks.map(task => {
                            const isOverdue = task.due_date && isPast(parseISO(task.due_date)) && task.status !== 'completed';
                            return (
                                <Card key={task.id} className={cn("shadow-sm hover:shadow-md transition-all", isOverdue && "border-destructive/30")}>
                                    <CardContent className="p-4">
                                        <div className="space-y-3">
                                            {/* Header */}
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <h4 className="font-bold text-sm">{task.title}</h4>
                                                        <Badge variant="outline" className={cn("text-[8px] font-bold uppercase", priorityColors[task.priority])}>
                                                            {task.priority}
                                                        </Badge>
                                                        <Badge className={cn("text-[8px] font-bold uppercase", statusColors[isOverdue ? 'overdue' : task.status])}>
                                                            {isOverdue ? 'overdue' : task.status.replace('_', ' ')}
                                                        </Badge>
                                                    </div>
                                                    {task.description && (
                                                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
                                                    )}
                                                </div>
                                                <div className="flex gap-2 shrink-0">
                                                    {task.status === 'pending' && (
                                                        <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => handleStartTask(task)}>
                                                            Start
                                                        </Button>
                                                    )}
                                                    {['pending', 'in_progress'].includes(task.status) && (
                                                        <Button size="sm" className="text-xs gap-1" onClick={() => openSubmit(task)}>
                                                            <Send className="h-3 w-3" />
                                                            Submit
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Progress + Meta */}
                                            <div className="flex items-center gap-4">
                                                <div className="flex-1">
                                                    <div className="flex justify-between text-[9px] mb-0.5">
                                                        <span className="text-muted-foreground">Progress</span>
                                                        <span className="font-bold">{task.progress}%</span>
                                                    </div>
                                                    <Progress value={task.progress} className="h-1.5" />
                                                </div>
                                                {task.due_date && (
                                                    <p className={cn("text-[10px] shrink-0", isOverdue ? 'text-destructive font-bold' : 'text-muted-foreground')}>
                                                        Due: {format(parseISO(task.due_date), 'MMM d')}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Supervisor Feedback */}
                                            {task.supervisor_feedback && (
                                                <div className="p-2 rounded-lg bg-primary/5 border border-primary/10">
                                                    <p className="text-[10px] text-primary uppercase font-bold">Supervisor Feedback</p>
                                                    <p className="text-xs">{task.supervisor_feedback}</p>
                                                </div>
                                            )}

                                            {/* Supervisor info */}
                                            {task.supervisor && (
                                                <p className="text-[10px] text-muted-foreground">
                                                    Assigned by: {task.supervisor.first_name} {task.supervisor.last_name}
                                                </p>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Submit Dialog */}
            <Dialog open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
                <DialogContent className="sm:max-w-lg w-[95vw]">
                    <DialogHeader>
                        <DialogTitle>Submit Task</DialogTitle>
                    </DialogHeader>
                    {selectedTask && (
                        <div className="space-y-4 py-2">
                            <div className="p-3 rounded-lg bg-muted/30 border">
                                <p className="font-bold text-sm">{selectedTask.title}</p>
                                {selectedTask.description && <p className="text-xs text-muted-foreground mt-1">{selectedTask.description}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label>Submission Notes</Label>
                                <Textarea
                                    rows={3}
                                    placeholder="Describe what you completed, any notes for your supervisor..."
                                    value={submissionNotes}
                                    onChange={e => setSubmissionNotes(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Attach File (optional)</Label>
                                <input
                                    type="file"
                                    ref={fileRef}
                                    className="hidden"
                                    onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                                />
                                <Button
                                    variant="outline"
                                    className="w-full gap-2 text-sm border-dashed h-16"
                                    onClick={() => fileRef.current?.click()}
                                >
                                    {selectedFile ? (
                                        <span className="flex items-center gap-2">
                                            <FileText className="h-4 w-4" />
                                            {selectedFile.name}
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-2 text-muted-foreground">
                                            <Upload className="h-4 w-4" />
                                            Click to upload a file
                                        </span>
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}
                    <DialogFooter className="flex-col sm:flex-row gap-2">
                        <Button variant="outline" onClick={() => setSelectedTask(null)}>Cancel</Button>
                        <Button onClick={handleSubmit} disabled={updateTask.isPending || uploadFile.isPending}>
                            {(updateTask.isPending || uploadFile.isPending) ? 'Submitting...' : 'Submit Task'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </MainLayout>
    );
}
