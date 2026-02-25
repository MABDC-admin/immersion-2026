import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
    Accordion,
    AccordionContent as AccordionUIContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { BookOpen, Plus, Edit2, Trash2, Clock, Calendar, CheckCircle2, XCircle, Send } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCurrentEmployee, useEmployee } from '@/hooks/useEmployees';
import {
    useJournalEntries,
    useCreateJournalEntry,
    useUpdateJournalEntry,
    useDeleteJournalEntry,
    useApproveJournalEntry,
    JournalEntry,
} from '@/hooks/useJournal';
import { format, isToday, isYesterday, parseISO, startOfWeek, endOfWeek } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function Journal() {
    const { internId } = useParams<{ internId: string }>();
    const { user, isAdmin, userRole } = useAuth();
    const { data: viewerEmployee } = useCurrentEmployee(user?.id || '');

    // If internId is provided, we're viewing someone else's journal
    const targetEmployeeId = internId || viewerEmployee?.id || '';
    const isViewingOwnJournal = !internId || internId === viewerEmployee?.id;

    const { data: targetEmployee } = useEmployee(targetEmployeeId);
    const { data: entries = [], isLoading } = useJournalEntries(targetEmployeeId);

    const createEntry = useCreateJournalEntry();
    const updateEntry = useUpdateJournalEntry();
    const deleteEntry = useDeleteJournalEntry();
    const approveEntry = useApproveJournalEntry();
    const { toast } = useToast();

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);

    // Form state
    const [entryDate, setEntryDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [activities, setActivities] = useState('');
    const [learnings, setLearnings] = useState('');
    const [challenges, setChallenges] = useState('');
    const [hoursWorked, setHoursWorked] = useState('');
    const [supervisorNotes, setSupervisorNotes] = useState('');

    const resetForm = () => {
        setEntryDate(format(new Date(), 'yyyy-MM-dd'));
        setActivities('');
        setLearnings('');
        setChallenges('');
        setHoursWorked('');
        setSupervisorNotes('');
        setEditingEntry(null);
    };

    const openNewEntry = () => {
        resetForm();
        setIsFormOpen(true);
    };

    const openEditEntry = (entry: JournalEntry) => {
        setEditingEntry(entry);
        setEntryDate(entry.entry_date);
        setActivities(entry.activities);
        setLearnings(entry.learnings || '');
        setChallenges(entry.challenges || '');
        setHoursWorked(entry.hours_worked?.toString() || '');
        setIsFormOpen(true);
    };

    const handleSubmit = async () => {
        if (!targetEmployee || !activities.trim()) {
            toast({ title: 'Please fill in your activities for the day', variant: 'destructive' });
            return;
        }

        try {
            if (editingEntry) {
                await updateEntry.mutateAsync({
                    id: editingEntry.id,
                    employeeId: targetEmployee.id,
                    activities: activities.trim(),
                    learnings: learnings.trim() || undefined,
                    challenges: challenges.trim() || undefined,
                    hours_worked: hoursWorked ? parseFloat(hoursWorked) : undefined,
                });
                toast({ title: 'Journal entry updated' });
            } else {
                await createEntry.mutateAsync({
                    employee_id: targetEmployee.id,
                    entry_date: entryDate,
                    activities: activities.trim(),
                    learnings: learnings.trim() || undefined,
                    challenges: challenges.trim() || undefined,
                    hours_worked: hoursWorked ? parseFloat(hoursWorked) : undefined,
                });
                toast({ title: 'Journal entry saved' });
            }
            setIsFormOpen(false);
            resetForm();
        } catch (err: any) {
            toast({ title: 'Error saving entry', description: err.message, variant: 'destructive' });
        }
    };

    const handleDelete = async (entry: JournalEntry) => {
        if (!targetEmployee) return;
        try {
            await deleteEntry.mutateAsync({ id: entry.id, employeeId: targetEmployee.id });
            toast({ title: 'Entry deleted' });
        } catch (err: any) {
            toast({ title: 'Error', description: err.message, variant: 'destructive' });
        }
    };

    const handleStatusUpdate = async (id: string, status: 'pending' | 'approved' | 'rejected', notes?: string) => {
        if (!targetEmployee) return;
        try {
            if (status === 'pending') {
                await updateEntry.mutateAsync({ id, employeeId: targetEmployee.id, status });
                toast({ title: 'Journal submitted for approval' });
            } else {
                await approveEntry.mutateAsync({
                    id,
                    employeeId: targetEmployee.id,
                    status: status as any,
                    supervisor_notes: notes
                });
                toast({ title: `Journal ${status}` });
            }
        } catch (err: any) {
            toast({ title: 'Error updating status', description: err.message, variant: 'destructive' });
        }
    };

    const renderStatusBadge = (status: string) => {
        switch (status) {
            case 'approved':
                return (
                    <Badge className="bg-hrms-success/10 text-hrms-success border-hrms-success/20 gap-1 text-[9px] font-bold py-0 h-5">
                        <CheckCircle2 className="h-3 w-3" />
                        APPROVED
                    </Badge>
                );
            case 'rejected':
                return (
                    <Badge variant="destructive" className="gap-1 text-[9px] font-bold py-0 h-5">
                        <XCircle className="h-3 w-3" />
                        REJECTED
                    </Badge>
                );
            case 'pending':
                return (
                    <Badge className="bg-hrms-warning/10 text-hrms-warning border-hrms-warning/20 gap-1 text-[9px] font-bold py-0 h-5">
                        <Clock className="h-3 w-3" />
                        PENDING
                    </Badge>
                );
            default:
                return (
                    <Badge variant="secondary" className="gap-1 text-[9px] font-bold py-0 h-5">
                        DRAFT
                    </Badge>
                );
        }
    };

    const formatDateLabel = (dateStr: string) => {
        const d = parseISO(dateStr);
        if (isToday(d)) return 'Today';
        if (isYesterday(d)) return 'Yesterday';
        return format(d, 'EEEE, MMMM d, yyyy');
    };

    const todayEntry = entries.find(e => e.entry_date === format(new Date(), 'yyyy-MM-dd'));

    return (
        <MainLayout>
            <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Daily Activity Journal</h1>
                        <p className="text-sm text-muted-foreground">Log your daily OJT activities and learnings</p>
                    </div>
                    <Button onClick={openNewEntry} className="gap-2">
                        <Plus className="h-4 w-4" />
                        New Entry
                    </Button>
                </div>

                {/* Today's Status */}
                <Card className={cn(
                    "border-l-4 shadow-sm",
                    todayEntry ? "border-l-hrms-success" : "border-l-hrms-warning"
                )}>
                    <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={cn("p-2 rounded-lg", todayEntry ? "bg-hrms-success/10" : "bg-hrms-warning/10")}>
                                <Calendar className={cn("h-5 w-5", todayEntry ? "text-hrms-success" : "text-hrms-warning")} />
                            </div>
                            <div>
                                <p className="text-sm font-semibold">
                                    {todayEntry ? "Today's entry logged ✓" : "No entry for today yet"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {todayEntry
                                        ? `${todayEntry.hours_worked || 0} hours recorded`
                                        : "Don't forget to log your activities!"}
                                </p>
                            </div>
                        </div>
                        {!todayEntry && (
                            <Button size="sm" variant="outline" onClick={openNewEntry} className="text-xs">
                                Log Now
                            </Button>
                        )}
                    </CardContent>
                </Card>

                {/* Entries List */}
                {isLoading ? (
                    <div className="flex items-center justify-center h-48">
                        <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : entries.length === 0 ? (
                    <Card className="border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="p-4 rounded-full bg-muted mb-4">
                                <BookOpen className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-semibold mb-1">No Journal Entries Yet</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                Start documenting your daily OJT activities and learnings.
                            </p>
                            <Button onClick={openNewEntry} className="gap-2">
                                <Plus className="h-4 w-4" />
                                Create First Entry
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <Accordion type="single" collapsible className="space-y-3">
                        {entries.map((entry, index) => {
                            const currentEntryDate = parseISO(entry.entry_date);
                            const prevEntry = index > 0 ? entries[index - 1] : null;
                            const prevEntryDate = prevEntry ? parseISO(prevEntry.entry_date) : null;

                            // Check if this entry starts a new week (comparing to the record before it)
                            const isNewWeek = !prevEntryDate ||
                                format(startOfWeek(currentEntryDate, { weekStartsOn: 1 }), 'yyyy-MM-dd') !==
                                format(startOfWeek(prevEntryDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');

                            const weekStart = startOfWeek(currentEntryDate, { weekStartsOn: 1 });
                            const weekEnd = endOfWeek(currentEntryDate, { weekStartsOn: 1 });

                            const isManager = viewerEmployee?.id === targetEmployee?.manager_id || isAdmin || userRole === 'hr_manager';
                            const canApprove = isManager && entry.status === 'pending';

                            return (
                                <div key={entry.id} className="space-y-3">
                                    {isNewWeek && (
                                        <div className="flex items-center gap-4 py-2 mt-4 first:mt-0">
                                            <div className="h-[1px] flex-1 bg-muted-foreground/20" />
                                            <Badge variant="secondary" className="bg-muted px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">
                                                Week of {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
                                            </Badge>
                                            <div className="h-[1px] flex-1 bg-muted-foreground/20" />
                                        </div>
                                    )}
                                    <AccordionItem
                                        value={entry.id}
                                        className="border-none"
                                    >
                                        <Card className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-all overflow-hidden">
                                            <AccordionTrigger className="p-4 py-3 hover:no-underline [&[data-state=open]]:pb-2">
                                                <div className="flex flex-1 items-center justify-between gap-3 text-left">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <div className="flex flex-col">
                                                            <h4 className="font-bold text-sm">{formatDateLabel(entry.entry_date)}</h4>
                                                            <span className="text-[9px] text-red-500 italic font-medium leading-none mt-0.5">
                                                                Submitted {format(parseISO(entry.created_at), 'MMM d, h:mm a')}
                                                            </span>
                                                        </div>
                                                        {renderStatusBadge(entry.status)}
                                                        {entry.hours_worked && (
                                                            <Badge variant="outline" className="text-[9px] font-bold gap-1 bg-primary/5">
                                                                <Clock className="h-3 w-3" />
                                                                {entry.hours_worked}h
                                                            </Badge>
                                                        )}
                                                        {entry.activities && !entry.supervisor_notes && entry.status !== 'approved' && (
                                                            <span className="text-[10px] text-muted-foreground truncate max-w-[150px] sm:max-w-xs font-normal">
                                                                {entry.activities.substring(0, 60)}...
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex gap-1 shrink-0 mr-2" onClick={(e) => e.stopPropagation()}>
                                                        {entry.status === 'draft' && isViewingOwnJournal && (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="h-7 text-[10px] font-bold bg-primary/5 hover:bg-primary/10 border-primary/20 text-primary gap-1"
                                                                onClick={() => handleStatusUpdate(entry.id, 'pending')}
                                                            >
                                                                <Send className="h-3 w-3" />
                                                                SUBMIT
                                                            </Button>
                                                        )}
                                                        {(entry.status === 'draft' || entry.status === 'rejected') && isViewingOwnJournal && (
                                                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEditEntry(entry)}>
                                                                <Edit2 className="h-3.5 w-3.5" />
                                                            </Button>
                                                        )}
                                                        {entry.status === 'draft' && isViewingOwnJournal && (
                                                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => handleDelete(entry)}>
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionUIContent className="px-4 pb-4 pt-1">
                                                <div className="space-y-3 pt-2 border-t border-muted/30">
                                                    <div className="space-y-1.5">
                                                        <div>
                                                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Activities</p>
                                                            <p className="text-sm text-foreground whitespace-pre-wrap">{entry.activities}</p>
                                                        </div>
                                                        {entry.learnings && (
                                                            <div>
                                                                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Key Learnings</p>
                                                                <p className="text-sm text-foreground whitespace-pre-wrap">{entry.learnings}</p>
                                                            </div>
                                                        )}
                                                        {entry.challenges && (
                                                            <div>
                                                                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Challenges</p>
                                                                <p className="text-sm text-foreground whitespace-pre-wrap">{entry.challenges}</p>
                                                            </div>
                                                        )}
                                                        {entry.supervisor_notes && (
                                                            <div className="mt-2 p-2 rounded-lg bg-primary/5 border border-primary/10">
                                                                <p className="text-[10px] text-primary uppercase font-bold tracking-wider">Supervisor Notes</p>
                                                                <p className="text-sm text-foreground">{entry.supervisor_notes}</p>
                                                            </div>
                                                        )}

                                                        {canApprove && (
                                                            <div className="mt-4 pt-4 border-t border-muted/30 space-y-3">
                                                                <div className="space-y-1.5">
                                                                    <Label htmlFor={`notes-${entry.id}`} className="text-xs">Supervisor Notes (Optional)</Label>
                                                                    <Textarea
                                                                        id={`notes-${entry.id}`}
                                                                        placeholder="Add feedback or notes here..."
                                                                        className="text-xs min-h-[80px]"
                                                                        value={supervisorNotes}
                                                                        onChange={(e) => setSupervisorNotes(e.target.value)}
                                                                    />
                                                                </div>
                                                                <div className="flex gap-2">
                                                                    <Button
                                                                        size="sm"
                                                                        className="bg-hrms-success hover:bg-hrms-success/90 text-[11px] h-8"
                                                                        onClick={() => {
                                                                            handleStatusUpdate(entry.id, 'approved', supervisorNotes);
                                                                            setSupervisorNotes('');
                                                                        }}
                                                                    >
                                                                        <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                                                                        Approve Entry
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="destructive"
                                                                        className="text-[11px] h-8"
                                                                        onClick={() => {
                                                                            handleStatusUpdate(entry.id, 'rejected', supervisorNotes);
                                                                            setSupervisorNotes('');
                                                                        }}
                                                                    >
                                                                        <XCircle className="h-3.5 w-3.5 mr-1.5" />
                                                                        Reject Entry
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        )}

                                                        <div className="pt-2 mt-2 border-t border-muted/20 flex justify-between items-center italic">
                                                            <p className="text-[10px] text-muted-foreground">
                                                                Entry for {format(parseISO(entry.entry_date), 'MMM d, yyyy')}
                                                            </p>
                                                            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                                <Clock className="h-2.5 w-2.5" />
                                                                Submitted on {format(parseISO(entry.created_at), 'MMM d, yyyy h:mm a')}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </AccordionUIContent>
                                        </Card>
                                    </AccordionItem>
                                </div>
                            );
                        })}
                    </Accordion>
                )}
            </div>

            {/* Form Dialog */}
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{editingEntry ? 'Edit Journal Entry' : 'New Journal Entry'}</DialogTitle>
                        <DialogDescription>Record your daily OJT activities, learnings, and challenges.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="date">Date</Label>
                                <Input
                                    id="date"
                                    type="date"
                                    value={entryDate}
                                    onChange={(e) => setEntryDate(e.target.value)}
                                    max={format(new Date(), 'yyyy-MM-dd')}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="hours">Hours Worked</Label>
                                <Input
                                    id="hours"
                                    type="number"
                                    min="0"
                                    max="24"
                                    step="0.5"
                                    placeholder="e.g. 8"
                                    value={hoursWorked}
                                    onChange={(e) => setHoursWorked(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="activities">Activities Performed *</Label>
                            <Textarea
                                id="activities"
                                placeholder="What did you do today? Describe your tasks and responsibilities..."
                                rows={3}
                                value={activities}
                                onChange={(e) => setActivities(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="learnings">Key Learnings</Label>
                            <Textarea
                                id="learnings"
                                placeholder="What did you learn? Any new skills or insights?"
                                rows={2}
                                value={learnings}
                                onChange={(e) => setLearnings(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="challenges">Challenges Encountered</Label>
                            <Textarea
                                id="challenges"
                                placeholder="Any difficulties or obstacles you faced?"
                                rows={2}
                                value={challenges}
                                onChange={(e) => setChallenges(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={createEntry.isPending || updateEntry.isPending}
                        >
                            {(createEntry.isPending || updateEntry.isPending) ? 'Saving...' : editingEntry ? 'Update Entry' : 'Save Entry'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </MainLayout >
    );
}
