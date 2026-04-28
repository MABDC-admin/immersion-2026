import { useState, useRef } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
    Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { AlertTriangle, BarChart3, ListChecks, Upload, Clock, CheckCircle, Send, FileText, Eye } from 'lucide-react';
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

function getTaskAttachmentLabel(task: Pick<InternTask, 'task_attachment_name' | 'task_attachment_path'>) {
    if (task.task_attachment_name) return task.task_attachment_name;
    if (!task.task_attachment_path) return 'Task PDF';
    return task.task_attachment_path.split('/').pop() || 'Task PDF';
}

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
    const [openingAttachmentTaskId, setOpeningAttachmentTaskId] = useState<string | null>(null);
    const [previewingAttachmentTask, setPreviewingAttachmentTask] = useState<InternTask | null>(null);
    const [previewAttachmentUrl, setPreviewAttachmentUrl] = useState<string | null>(null);
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

    const handleOpenTaskAttachment = async (task: InternTask) => {
        if (!task.task_attachment_path) return;

        try {
            setOpeningAttachmentTaskId(task.id);
            setPreviewingAttachmentTask(task);
            setPreviewAttachmentUrl(null);
            const { data, error } = await supabase.storage
                .from('task-submissions')
                .createSignedUrl(task.task_attachment_path, 3600);

            if (error) throw error;
            if (data?.signedUrl) {
                setPreviewAttachmentUrl(data.signedUrl);
            }
        } catch (err: any) {
            setPreviewingAttachmentTask(null);
            toast({
                title: 'Unable to open PDF',
                description: err.message || 'Something went wrong while loading the task PDF.',
                variant: 'destructive',
            });
        } finally {
            setOpeningAttachmentTaskId(null);
        }
    };

    // Stats
    const pending = tasks.filter(t => t.status === 'pending').length;
    const inProgress = tasks.filter(t => t.status === 'in_progress').length;
    const submitted = tasks.filter(t => t.status === 'submitted').length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const overdue = tasks.filter(t => t.due_date && isPast(parseISO(t.due_date)) && t.status !== 'completed').length;
    const completionRate = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;
    const taskWidgets = [
        {
            label: 'Pending',
            value: pending,
            detail: 'Ready to start',
            icon: Clock,
            cardClass: 'border-amber-200/80 bg-gradient-to-br from-amber-50 via-white to-white',
            iconClass: 'bg-amber-100 text-amber-700',
        },
        {
            label: 'Active',
            value: inProgress,
            detail: 'Currently working',
            icon: ListChecks,
            cardClass: 'border-sky-200/80 bg-gradient-to-br from-sky-50 via-white to-white',
            iconClass: 'bg-sky-100 text-sky-700',
        },
        {
            label: 'Submitted',
            value: submitted,
            detail: 'Waiting for review',
            icon: Send,
            cardClass: 'border-violet-200/80 bg-gradient-to-br from-violet-50 via-white to-white',
            iconClass: 'bg-violet-100 text-violet-700',
        },
        {
            label: 'Completed',
            value: completed,
            detail: `${completionRate}% completion rate`,
            icon: CheckCircle,
            cardClass: 'border-emerald-200/80 bg-gradient-to-br from-emerald-50 via-white to-white',
            iconClass: 'bg-emerald-100 text-emerald-700',
        },
    ];

    return (
        <MainLayout>
            <div className="space-y-6 animate-fade-in">
                <Card className="overflow-hidden border-white/80 bg-gradient-to-br from-orange-500/15 via-sky-500/10 to-violet-500/15 shadow-sm">
                    <CardContent className="p-0">
                        <div className="grid gap-0 xl:grid-cols-[1.5fr_0.8fr]">
                            <div className="px-6 py-6 md:px-8">
                                <div className="flex flex-wrap items-center gap-2">
                                    <Badge variant="outline" className="border-orange-200 bg-white/80 text-orange-700">My Tasks</Badge>
                                    <Badge variant="outline" className="border-sky-200 bg-white/80 text-sky-700">Supervisor assignments</Badge>
                                </div>
                                <h1 className="mt-5 text-3xl font-bold text-foreground">Task Dashboard</h1>
                                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                                    Start assigned work, open task PDFs, upload submissions, and track supervisor feedback.
                                </p>
                            </div>
                            <div className="border-t border-white/70 bg-white/55 px-6 py-6 xl:border-l xl:border-t-0">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-2xl bg-orange-100 p-3 text-orange-700">
                                        <BarChart3 className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Completion Rate</p>
                                        <p className="text-3xl font-bold text-foreground">{completionRate}%</p>
                                    </div>
                                </div>
                                <p className="mt-4 text-sm text-muted-foreground">{completed} completed of {tasks.length} assigned tasks.</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {taskWidgets.map((widget) => (
                        <Card key={widget.label} className={cn('border shadow-sm', widget.cardClass)}>
                            <CardContent className="p-5">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-xs font-semibold uppercase text-muted-foreground">{widget.label}</p>
                                        <p className="mt-2 text-3xl font-bold text-foreground">{widget.value}</p>
                                    </div>
                                    <div className={cn('rounded-2xl p-3', widget.iconClass)}>
                                        <widget.icon className="h-5 w-5" />
                                    </div>
                                </div>
                                <p className="mt-3 text-sm text-muted-foreground">{widget.detail}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <Card className="border-white/80 bg-gradient-to-br from-white via-orange-50/50 to-sky-50/50 shadow-sm">
                    <CardHeader className="pb-3">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <CardTitle>Task Queue</CardTitle>
                                <p className="mt-1 text-sm text-muted-foreground">{filteredTasks.length} visible tasks</p>
                            </div>
                            {overdue > 0 && (
                                <Badge variant="outline" className="w-fit border-rose-200 bg-rose-50 text-rose-700">
                                    <AlertTriangle className="mr-1 h-3 w-3" />
                                    {overdue} overdue
                                </Badge>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-wrap gap-2">
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
                                                        {task.task_attachment_path && (
                                                            <Badge variant="secondary" className="gap-1 text-[8px] font-bold uppercase">
                                                                <FileText className="h-3 w-3" />
                                                                PDF Attached
                                                            </Badge>
                                                        )}
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
                                                    {task.task_attachment_path && (
                                                        <div className="mt-2">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="h-7 gap-1 text-[11px]"
                                                                onClick={() => handleOpenTaskAttachment(task)}
                                                                disabled={openingAttachmentTaskId === task.id}
                                                            >
                                                                <FileText className="h-3 w-3" />
                                                                {openingAttachmentTaskId === task.id ? 'Opening...' : getTaskAttachmentLabel(task)}
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex w-full gap-2 shrink-0 sm:w-auto">
                                                    {task.status === 'pending' && (
                                                        <Button size="sm" variant="outline" className="flex-1 gap-1 text-xs sm:flex-none" onClick={() => handleStartTask(task)}>
                                                            Start
                                                        </Button>
                                                    )}
                                                    {['pending', 'in_progress'].includes(task.status) && (
                                                        <Button size="sm" className="flex-1 gap-1 text-xs sm:flex-none" onClick={() => openSubmit(task)}>
                                                            <Send className="h-3 w-3" />
                                                            Submit
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Progress + Meta */}
                                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
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
                    </CardContent>
                </Card>
            </div>

            {/* Submit Dialog */}
            <Dialog open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
                <DialogContent className="w-[95vw] max-h-[90vh] overflow-hidden sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Submit Task</DialogTitle>
                    </DialogHeader>
                    {selectedTask && (
                        <div className="space-y-4 overflow-y-auto py-2 pr-1">
                            <div className="p-3 rounded-lg bg-muted/30 border">
                                <p className="font-bold text-sm">{selectedTask.title}</p>
                                {selectedTask.description && <p className="text-xs text-muted-foreground mt-1">{selectedTask.description}</p>}
                                {selectedTask.task_attachment_path && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="mt-3 gap-2"
                                        onClick={() => handleOpenTaskAttachment(selectedTask)}
                                        disabled={openingAttachmentTaskId === selectedTask.id}
                                    >
                                        <Eye className="h-3 w-3" />
                                        {openingAttachmentTaskId === selectedTask.id ? 'Opening PDF...' : 'Open Task PDF'}
                                    </Button>
                                )}
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
                        <Button variant="outline" className="w-full sm:w-auto" onClick={() => setSelectedTask(null)}>Cancel</Button>
                        <Button className="w-full sm:w-auto" onClick={handleSubmit} disabled={updateTask.isPending || uploadFile.isPending}>
                            {(updateTask.isPending || uploadFile.isPending) ? 'Submitting...' : 'Submit Task'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={!!previewingAttachmentTask} onOpenChange={(open) => {
                if (!open) {
                    setPreviewingAttachmentTask(null);
                    setPreviewAttachmentUrl(null);
                }
            }}>
                <DialogContent className="w-[95vw] max-h-[90vh] overflow-hidden sm:max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>{previewingAttachmentTask ? getTaskAttachmentLabel(previewingAttachmentTask) : 'Task PDF'}</DialogTitle>
                    </DialogHeader>
                    <div className="overflow-y-auto py-2 pr-1">
                        {previewAttachmentUrl ? (
                            <div className="overflow-hidden rounded-lg border bg-black/5">
                                <iframe
                                    src={previewAttachmentUrl}
                                    title="Task PDF Preview"
                                    className="h-[70vh] w-full"
                                />
                            </div>
                        ) : (
                            <div className="flex h-[40vh] items-center justify-center rounded-lg border border-dashed">
                                <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            </div>
                        )}
                    </div>
                    <DialogFooter className="flex-col sm:flex-row gap-2">
                        <Button
                            variant="outline"
                            className="w-full sm:w-auto"
                            onClick={() => {
                                setPreviewingAttachmentTask(null);
                                setPreviewAttachmentUrl(null);
                            }}
                        >
                            Close
                        </Button>
                        {previewAttachmentUrl && (
                            <Button
                                className="w-full sm:w-auto"
                                onClick={() => window.open(previewAttachmentUrl, '_blank', 'noopener,noreferrer')}
                            >
                                <Eye className="mr-2 h-3 w-3" />
                                Open in New Tab
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </MainLayout>
    );
}
