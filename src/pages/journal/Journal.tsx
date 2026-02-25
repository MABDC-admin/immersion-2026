import { useState } from 'react';
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
import { BookOpen, Plus, Edit2, Trash2, Clock, Calendar } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCurrentEmployee } from '@/hooks/useEmployees';
import {
    useJournalEntries,
    useCreateJournalEntry,
    useUpdateJournalEntry,
    useDeleteJournalEntry,
    JournalEntry,
} from '@/hooks/useJournal';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function Journal() {
    const { user } = useAuth();
    const { data: employee } = useCurrentEmployee(user?.id || '');
    const { data: entries = [], isLoading } = useJournalEntries(employee?.id || '');
    const createEntry = useCreateJournalEntry();
    const updateEntry = useUpdateJournalEntry();
    const deleteEntry = useDeleteJournalEntry();
    const { toast } = useToast();

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);

    // Form state
    const [entryDate, setEntryDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [activities, setActivities] = useState('');
    const [learnings, setLearnings] = useState('');
    const [challenges, setChallenges] = useState('');
    const [hoursWorked, setHoursWorked] = useState('');

    const resetForm = () => {
        setEntryDate(format(new Date(), 'yyyy-MM-dd'));
        setActivities('');
        setLearnings('');
        setChallenges('');
        setHoursWorked('');
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
        if (!employee || !activities.trim()) {
            toast({ title: 'Please fill in your activities for the day', variant: 'destructive' });
            return;
        }

        try {
            if (editingEntry) {
                await updateEntry.mutateAsync({
                    id: editingEntry.id,
                    employeeId: employee.id,
                    activities: activities.trim(),
                    learnings: learnings.trim() || undefined,
                    challenges: challenges.trim() || undefined,
                    hours_worked: hoursWorked ? parseFloat(hoursWorked) : undefined,
                });
                toast({ title: 'Journal entry updated' });
            } else {
                await createEntry.mutateAsync({
                    employee_id: employee.id,
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
        if (!employee) return;
        try {
            await deleteEntry.mutateAsync({ id: entry.id, employeeId: employee.id });
            toast({ title: 'Entry deleted' });
        } catch (err: any) {
            toast({ title: 'Error', description: err.message, variant: 'destructive' });
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
                    <div className="space-y-3">
                        {entries.map(entry => (
                            <Card key={entry.id} className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-all">
                                <CardContent className="p-4">
                                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                        <div className="flex-1 space-y-2">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h4 className="font-bold text-sm">{formatDateLabel(entry.entry_date)}</h4>
                                                {entry.hours_worked && (
                                                    <Badge variant="outline" className="text-[9px] font-bold gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        {entry.hours_worked}h
                                                    </Badge>
                                                )}
                                            </div>
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
                                            </div>
                                        </div>
                                        <div className="flex gap-1 shrink-0">
                                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEditEntry(entry)}>
                                                <Edit2 className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => handleDelete(entry)}>
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
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
        </MainLayout>
    );
}
