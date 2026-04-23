import { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
    Plus, ListChecks, Clock, CheckCircle, AlertTriangle,
    Trash2, MessageSquare, Eye, Edit2, Users,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCurrentEmployee } from '@/hooks/useEmployees';
import { useSupervisorTasks, useCreateTask, useUpdateTask, useDeleteTask, InternTask } from '@/hooks/useTasks';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format, isPast, parseISO } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

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

export default function TaskDashboard() {
    const { user, isAdmin, userRole } = useAuth();
    const isAdminOrHR = isAdmin || userRole === 'hr_manager';
    const { data: employee, isLoading: isEmployeeLoading } = useCurrentEmployee(user?.id || '');
    const { data: tasks = [], isLoading } = useSupervisorTasks(employee?.id || '', isAdminOrHR);
    const createTask = useCreateTask();
    const updateTask = useUpdateTask();
    const deleteTask = useDeleteTask();
    const { toast } = useToast();

    // Fetch interns under this supervisor (or all interns if admin)
    const { data: myInterns = [] } = useQuery({
        queryKey: ['supervisor-interns', employee?.id, isAdminOrHR],
        queryFn: async () => {
            if (!employee?.id && !isAdminOrHR) return [];

            let query = supabase
                .from('employees')
                .select('id, first_name, last_name, avatar_url, email');

            if (!isAdminOrHR) {
                query = query.eq('manager_id', employee!.id);
            }
            // Need a way to filter only interns/employees. 
            // In a better setup, there's a specific role enum on employees, 
            // but for now, if admin, we pull everyone who could potentially be assigned tasks.

            const { data, error } = await query;
            if (error) throw error;
            return data || [];
        },
        enabled: !!employee?.id || isAdminOrHR,
    });

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<InternTask | null>(null);
    const [viewingTask, setViewingTask] = useState<InternTask | null>(null);

    // Form state
    const [taskTitle, setTaskTitle] = useState('');
    const [taskDesc, setTaskDesc] = useState('');
    const [taskInternIds, setTaskInternIds] = useState<string[]>([]);
    const [taskDueDate, setTaskDueDate] = useState('');
    const [taskPriority, setTaskPriority] = useState('medium');

    // Feedback form state
    const [feedback, setFeedback] = useState('');
    const [newProgress, setNewProgress] = useState('');
    const [newStatus, setNewStatus] = useState('');
    const [signedUrl, setSignedUrl] = useState<string | null>(null);

    const resetForm = () => {
        setTaskTitle(''); setTaskDesc(''); setTaskInternIds([]); setTaskDueDate(''); setTaskPriority('medium');
        setEditingTask(null);
    };

    const openNewTask = () => { resetForm(); setIsFormOpen(true); };

    const openEditTask = (task: InternTask) => {
        setEditingTask(task);
        setTaskTitle(task.title);
        setTaskDesc(task.description || '');
        setTaskInternIds([task.intern_id]);
        setTaskDueDate(task.due_date || '');
        setTaskPriority(task.priority);
        setIsFormOpen(true);
    };

    const openDetail = async (task: InternTask) => {
        setViewingTask(task);
        setFeedback(task.supervisor_feedback || '');
        setNewProgress(String(task.progress));
        setNewStatus(task.status);
        setIsDetailOpen(true);
        setSignedUrl(null);

        if (task.submission_file_path) {
            const { data } = await supabase.storage
                .from('task-submissions')
                .createSignedUrl(task.submission_file_path, 3600);
            if (data?.signedUrl) setSignedUrl(data.signedUrl);
        }
    };

    const handleSubmitTask = async () => {
        if (!taskTitle.trim() || taskInternIds.length === 0) {
            toast({ title: 'Please fill in title and select at least one intern', variant: 'destructive' });
            return;
        }

        // For admins without an employee record, look up by user_id at submit time
        let supervisorId = employee?.id;
        if (!supervisorId && user?.id) {
            const { data: empLookup } = await supabase
                .from('employees')
                .select('id')
                .eq('user_id', user.id)
                .maybeSingle();
            supervisorId = empLookup?.id;
        }
        if (!supervisorId) {
            toast({ title: 'Error: Could not find your employee record. Please contact admin.', variant: 'destructive' });
            return;
        }

        try {
            if (editingTask) {
                await updateTask.mutateAsync({
                    id: editingTask.id,
                    title: taskTitle.trim(),
                    description: taskDesc.trim() || null,
                    intern_id: taskInternIds[0],
                    due_date: taskDueDate || null,
                    priority: taskPriority,
                });
                toast({ title: 'Task updated' });
            } else {
                await createTask.mutateAsync({
                    supervisor_id: supervisorId,
                    intern_ids: taskInternIds,
                    title: taskTitle.trim(),
                    description: taskDesc.trim() || undefined,
                    due_date: taskDueDate || undefined,
                    priority: taskPriority,
                });
                toast({
                    title: taskInternIds.length === 1 ? 'Task created' : 'Tasks created',
                    description: taskInternIds.length === 1
                        ? 'The task was assigned successfully.'
                        : `The same task was assigned to ${taskInternIds.length} interns.`,
                });
            }
            setIsFormOpen(false);
            resetForm();
        } catch (err: any) {
            toast({ title: 'Error', description: err.message, variant: 'destructive' });
        }
    };

    const handleUpdateProgress = async () => {
        if (!viewingTask) return;
        try {
            const updates: any = {};
            if (newProgress) updates.progress = parseInt(newProgress);
            if (newStatus) updates.status = newStatus;
            if (feedback.trim()) updates.supervisor_feedback = feedback.trim();
            if (newStatus === 'completed') updates.completed_at = new Date().toISOString();
            await updateTask.mutateAsync({ id: viewingTask.id, ...updates });
            toast({ title: 'Task updated' });
            setIsDetailOpen(false);
        } catch (err: any) {
            toast({ title: 'Error', description: err.message, variant: 'destructive' });
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteTask.mutateAsync(id);
            toast({ title: 'Task deleted' });
        } catch (err: any) {
            toast({ title: 'Error', description: err.message, variant: 'destructive' });
        }
    };

    const selectedInterns = useMemo(
        () => myInterns.filter((intern) => taskInternIds.includes(intern.id)),
        [myInterns, taskInternIds]
    );

    const selectionLabel = editingTask
        ? selectedInterns[0]
            ? `${selectedInterns[0].first_name} ${selectedInterns[0].last_name}`
            : 'Select intern...'
        : taskInternIds.length === 0
            ? 'Select interns...'
            : taskInternIds.length === 1
                ? `${selectedInterns[0]?.first_name ?? ''} ${selectedInterns[0]?.last_name ?? ''}`.trim()
                : `${taskInternIds.length} interns selected`;

    const toggleInternSelection = (internId: string, checked: boolean) => {
        if (editingTask) {
            setTaskInternIds(checked ? [internId] : []);
            return;
        }

        setTaskInternIds((current) => {
            if (checked) {
                return current.includes(internId) ? current : [...current, internId];
            }

            return current.filter((id) => id !== internId);
        });
    };

    // Stats
    const stats = useMemo(() => {
        const total = tasks.length;
        const pending = tasks.filter(t => t.status === 'pending').length;
        const inProgress = tasks.filter(t => t.status === 'in_progress').length;
        const submitted = tasks.filter(t => t.status === 'submitted').length;
        const completed = tasks.filter(t => t.status === 'completed').length;
        const overdue = tasks.filter(t => t.due_date && isPast(parseISO(t.due_date)) && !['completed'].includes(t.status)).length;
        return { total, pending, inProgress, submitted, completed, overdue };
    }, [tasks]);

    // Group tasks by intern
    const tasksByIntern = useMemo(() => {
        const map = new Map<string, { intern: any; tasks: InternTask[] }>();
        for (const task of tasks) {
            const key = task.intern_id;
            if (!map.has(key)) {
                map.set(key, { intern: task.intern, tasks: [] });
            }
            map.get(key)!.tasks.push(task);
        }
        return Array.from(map.values());
    }, [tasks]);

    return (
        <MainLayout>
            <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold">Task Dashboard</h1>
                        <p className="text-sm text-muted-foreground">Create and manage intern tasks</p>
                    </div>
                    <Button onClick={openNewTask} className="w-full gap-2 sm:w-auto">
                        <Plus className="h-4 w-4" />
                        New Task
                    </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6 md:gap-3">
                    {[
                        { label: 'Total', value: stats.total, icon: ListChecks, color: 'text-primary', bg: 'bg-primary/10' },
                        { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-muted-foreground', bg: 'bg-muted' },
                        { label: 'Active', value: stats.inProgress, icon: ListChecks, color: 'text-primary', bg: 'bg-primary/10' },
                        { label: 'Submitted', value: stats.submitted, icon: ListChecks, color: 'text-hrms-warning', bg: 'bg-hrms-warning/10' },
                        { label: 'Done', value: stats.completed, icon: CheckCircle, color: 'text-hrms-success', bg: 'bg-hrms-success/10' },
                        { label: 'Overdue', value: stats.overdue, icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/10' },
                    ].map(s => (
                        <Card key={s.label} className="shadow-sm">
                            <CardContent className="p-3 text-center">
                                <div className={cn("p-1.5 rounded-lg inline-flex mb-1", s.bg)}>
                                    <s.icon className={cn("h-3.5 w-3.5", s.color)} />
                                </div>
                                <p className="text-lg font-bold">{s.value}</p>
                                <p className="text-[9px] text-muted-foreground uppercase font-bold">{s.label}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Tasks by Intern */}
                {isLoading ? (
                    <div className="flex items-center justify-center h-32">
                        <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : tasksByIntern.length === 0 ? (
                    <Card className="border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                            <ListChecks className="h-8 w-8 text-muted-foreground mb-3" />
                            <h3 className="text-lg font-semibold mb-1">No Tasks Yet</h3>
                            <p className="text-sm text-muted-foreground mb-4">Create tasks for your interns to track their progress.</p>
                            <Button onClick={openNewTask} className="w-full gap-2 sm:w-auto"><Plus className="h-4 w-4" />Create First Task</Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-6">
                        {tasksByIntern.map(({ intern, tasks: internTasks }) => (
                            <Card key={intern?.email || 'unknown'} className="shadow-sm">
                                <CardHeader className="pb-3">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={intern?.avatar_url || ''} />
                                            <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                                {intern ? `${intern.first_name[0]}${intern.last_name[0]}` : '?'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <CardTitle className="text-sm font-bold">
                                                {intern ? `${intern.first_name} ${intern.last_name}` : 'Unknown Intern'}
                                            </CardTitle>
                                            <p className="text-[10px] text-muted-foreground">
                                                {internTasks.length} task{internTasks.length !== 1 ? 's' : ''} •
                                                {internTasks.filter(t => t.status === 'completed').length} completed
                                            </p>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="px-3 sm:px-6 space-y-2">
                                    {internTasks.map(task => (
                                        <div
                                            key={task.id}
                                            className="flex flex-col justify-between gap-3 rounded-xl border bg-card p-3 transition-all hover:shadow-sm md:flex-row md:items-center"
                                            onClick={() => openDetail(task)}
                                        >
                                            <div className="flex-1 min-w-0 space-y-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <p className="text-sm font-bold truncate">{task.title}</p>
                                                    <Badge variant="outline" className={cn("text-[8px] font-bold uppercase", priorityColors[task.priority])}>
                                                        {task.priority}
                                                    </Badge>
                                                    <Badge className={cn("text-[8px] font-bold uppercase", statusColors[task.status])}>
                                                        {task.status.replace('_', ' ')}
                                                    </Badge>
                                                </div>
                                                {task.due_date && (
                                                    <p className={cn("text-[10px]", isPast(parseISO(task.due_date)) && task.status !== 'completed' ? 'text-destructive font-bold' : 'text-muted-foreground')}>
                                                        Due: {format(parseISO(task.due_date), 'MMM d, yyyy')}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end shrink-0 sm:min-w-[176px]">
                                                <div className="w-full sm:w-20">
                                                    <div className="flex justify-between text-[9px] mb-0.5">
                                                        <span className="text-muted-foreground">Progress</span>
                                                        <span className="font-bold">{task.progress}%</span>
                                                    </div>
                                                    <Progress value={task.progress} className="h-1.5" />
                                                </div>
                                                <div className="flex gap-2 sm:gap-1">
                                                    <Button variant="ghost" size="sm" className="h-9 flex-1 px-0 sm:h-7 sm:w-7 sm:flex-none sm:p-0" onClick={(e) => { e.stopPropagation(); openEditTask(task); }}>
                                                        <Edit2 className="h-3 w-3" />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" className="h-9 flex-1 px-0 text-destructive sm:h-7 sm:w-7 sm:flex-none sm:p-0" onClick={(e) => { e.stopPropagation(); handleDelete(task.id); }}>
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Create/Edit Task Dialog */}
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="w-[95vw] max-h-[90vh] overflow-hidden sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{editingTask ? 'Edit Task' : 'New Task'}</DialogTitle>
                        <DialogDescription>
                            {editingTask
                                ? 'Update the task details for this assigned intern.'
                                : 'Assign the same task to one or more interns with a deadline and priority.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 overflow-y-auto py-2 pr-1">
                        <div className="space-y-2">
                            <Label>{editingTask ? 'Assigned Intern *' : 'Assign To *'}</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full justify-between font-normal"
                                    >
                                        <span className="truncate">{selectionLabel}</span>
                                        <Users className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[min(20rem,calc(100vw-2rem))] p-0 sm:w-[320px]" align="start">
                                    <div className="border-b px-4 py-3">
                                        <p className="text-sm font-semibold">
                                            {editingTask ? 'Choose assigned intern' : 'Choose interns'}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {editingTask
                                                ? 'Editing keeps this task assigned to a single intern.'
                                                : 'Each selected intern will get their own copy of this task.'}
                                        </p>
                                    </div>
                                    <div className="max-h-64 overflow-y-auto p-2">
                                        {myInterns.length === 0 ? (
                                            <p className="px-2 py-4 text-sm text-muted-foreground">No interns available.</p>
                                        ) : (
                                            myInterns.map((intern) => {
                                                const isChecked = taskInternIds.includes(intern.id);

                                                return (
                                                    <label
                                                        key={intern.id}
                                                        className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted/50"
                                                    >
                                                        <Checkbox
                                                            checked={isChecked}
                                                            onCheckedChange={(checked) => toggleInternSelection(intern.id, checked === true)}
                                                        />
                                                        <div className="min-w-0 flex-1">
                                                            <p className="truncate text-sm font-medium">
                                                                {intern.first_name} {intern.last_name}
                                                            </p>
                                                            <p className="truncate text-xs text-muted-foreground">{intern.email}</p>
                                                        </div>
                                                    </label>
                                                );
                                            })
                                        )}
                                    </div>
                                </PopoverContent>
                            </Popover>
                            {!editingTask && selectedInterns.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {selectedInterns.map((intern) => (
                                        <Badge key={intern.id} variant="secondary" className="gap-1">
                                            {intern.first_name} {intern.last_name}
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label>Task Title *</Label>
                            <Input placeholder="e.g. Complete filing of documents" value={taskTitle} onChange={e => setTaskTitle(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea placeholder="Detailed task description..." rows={3} value={taskDesc} onChange={e => setTaskDesc(e.target.value)} />
                        </div>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Due Date</Label>
                                <Input type="date" value={taskDueDate} onChange={e => setTaskDueDate(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Priority</Label>
                                <Select value={taskPriority} onValueChange={setTaskPriority}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="low">Low</SelectItem>
                                        <SelectItem value="medium">Medium</SelectItem>
                                        <SelectItem value="high">High</SelectItem>
                                        <SelectItem value="urgent">Urgent</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="flex-col sm:flex-row gap-2">
                        <Button variant="outline" className="w-full sm:w-auto" onClick={() => setIsFormOpen(false)}>Cancel</Button>
                        <Button className="w-full sm:w-auto" onClick={handleSubmitTask} disabled={createTask.isPending || updateTask.isPending}>
                            {editingTask ? 'Update Task' : 'Create Task'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Task Detail / Feedback Dialog */}
            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent className="w-[95vw] max-h-[90vh] overflow-hidden sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Task Details</DialogTitle>
                    </DialogHeader>
                    {viewingTask && (
                        <div className="space-y-4 overflow-y-auto py-2 pr-1">
                            <div>
                                <h4 className="font-bold">{viewingTask.title}</h4>
                                {viewingTask.description && <p className="text-sm text-muted-foreground mt-1">{viewingTask.description}</p>}
                            </div>

                            <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                                <div>
                                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Status</p>
                                    <Badge className={cn("text-[9px]", statusColors[viewingTask.status])}>{viewingTask.status}</Badge>
                                </div>
                                <div>
                                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Priority</p>
                                    <Badge variant="outline" className={cn("text-[9px]", priorityColors[viewingTask.priority])}>{viewingTask.priority}</Badge>
                                </div>
                            </div>

                            {viewingTask.submission_notes && (
                                <div className="p-3 rounded-lg bg-hrms-warning/5 border border-hrms-warning/20">
                                    <p className="text-[10px] text-hrms-warning uppercase font-bold mb-1">Intern Submission</p>
                                    <p className="text-sm">{viewingTask.submission_notes}</p>
                                    {viewingTask.submission_file_path && (
                                        <div className="mt-3 space-y-2">
                                            {signedUrl ? (
                                                <div className="rounded-lg overflow-hidden border bg-black/5">
                                                    {viewingTask.submission_file_path.toLowerCase().match(/\.(mp4|webm|ogg|mov)$/) ? (
                                                        <video src={signedUrl} controls className="w-full max-h-[40vh] sm:max-h-[300px]" />
                                                    ) : viewingTask.submission_file_path.toLowerCase().endsWith('.pdf') ? (
                                                        <iframe src={signedUrl} className="h-[50vh] w-full sm:h-[400px]" title="PDF Preview" />
                                                    ) : viewingTask.submission_file_path.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/) ? (
                                                        <img src={signedUrl} alt="Submission" className="w-full object-contain max-h-[50vh] sm:max-h-[400px]" />
                                                    ) : (
                                                        <div className="p-8 text-center">
                                                            <p className="text-xs text-muted-foreground mb-3">Preview not available for this file type.</p>
                                                            <Button variant="outline" size="sm" onClick={() => window.open(signedUrl, '_blank')}>
                                                                <Eye className="h-3 w-3 mr-2" /> Open in New Tab
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="h-20 flex items-center justify-center border border-dashed rounded-lg">
                                                    <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="border-t pt-3 space-y-3">
                                <p className="text-xs font-bold">Update Progress</p>
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label className="text-xs">Progress %</Label>
                                        <Input type="number" min="0" max="100" value={newProgress} onChange={e => setNewProgress(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs">Status</Label>
                                        <Select value={newStatus} onValueChange={setNewStatus}>
                                            <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="pending">Pending</SelectItem>
                                                <SelectItem value="in_progress">In Progress</SelectItem>
                                                <SelectItem value="submitted">Submitted</SelectItem>
                                                <SelectItem value="completed">Completed</SelectItem>
                                                <SelectItem value="overdue">Overdue</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs">Supervisor Feedback</Label>
                                    <Textarea rows={2} placeholder="Provide feedback..." value={feedback} onChange={e => setFeedback(e.target.value)} />
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter className="flex-col sm:flex-row gap-2">
                        <Button variant="outline" className="w-full sm:w-auto" onClick={() => setIsDetailOpen(false)}>Close</Button>
                        <Button className="w-full sm:w-auto" onClick={handleUpdateProgress} disabled={updateTask.isPending}>
                            {updateTask.isPending ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </MainLayout>
    );
}
