import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Plus, Edit2, Trash2, CheckCircle2, XCircle, Clock, Search, Download, Eye, CalendarDays, Timer, BookOpen, Lightbulb, AlertTriangle, MessageSquare } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';

interface JournalWithEmployee {
  id: string;
  employee_id: string;
  entry_date: string;
  activities: string;
  learnings: string | null;
  challenges: string | null;
  supervisor_notes: string | null;
  hours_worked: number | null;
  status: string;
  created_at: string;
  updated_at: string;
  employee?: { first_name: string; last_name: string; avatar_url: string | null };
}

function useAllJournals(statusFilter: string) {
  return useQuery({
    queryKey: ['admin-journals', statusFilter],
    queryFn: async () => {
      let query = (supabase as any)
        .from('intern_journals')
        .select('*, employee:employees(first_name, last_name, avatar_url)')
        .order('entry_date', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as JournalWithEmployee[];
    },
  });
}

function useEmployeesList() {
  return useQuery({
    queryKey: ['employees-list-for-journals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('id, first_name, last_name')
        .eq('status', 'active')
        .order('first_name');
      if (error) throw error;
      return data || [];
    },
  });
}

const statusColors: Record<string, string> = {
  approved: 'bg-green-100 text-green-800 border-green-200',
  rejected: 'bg-destructive/10 text-destructive border-destructive/20',
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  draft: 'bg-muted text-muted-foreground border-muted',
};

const statusIcons: Record<string, React.ReactNode> = {
  approved: <CheckCircle2 className="h-3 w-3" />,
  rejected: <XCircle className="h-3 w-3" />,
  pending: <Clock className="h-3 w-3" />,
  draft: <Clock className="h-3 w-3" />,
};

export function JournalsTab() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [viewEntry, setViewEntry] = useState<JournalWithEmployee | null>(null);
  const [editingEntry, setEditingEntry] = useState<JournalWithEmployee | null>(null);

  // Form state
  const [formEmployeeId, setFormEmployeeId] = useState('');
  const [formDate, setFormDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [formActivities, setFormActivities] = useState('');
  const [formLearnings, setFormLearnings] = useState('');
  const [formChallenges, setFormChallenges] = useState('');
  const [formHours, setFormHours] = useState('');
  const [formStatus, setFormStatus] = useState('pending');
  const [formSupervisorNotes, setFormSupervisorNotes] = useState('');

  const { data: journals = [], isLoading } = useAllJournals(statusFilter);
  const { data: employees = [] } = useEmployeesList();

  const filtered = journals.filter((j) => {
    if (!search) return true;
    const name = `${j.employee?.first_name || ''} ${j.employee?.last_name || ''}`.toLowerCase();
    return name.includes(search.toLowerCase()) || j.activities.toLowerCase().includes(search.toLowerCase());
  });

  const resetForm = () => {
    setFormEmployeeId('');
    setFormDate(format(new Date(), 'yyyy-MM-dd'));
    setFormActivities('');
    setFormLearnings('');
    setFormChallenges('');
    setFormHours('');
    setFormStatus('pending');
    setFormSupervisorNotes('');
    setEditingEntry(null);
  };

  const openCreate = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const openEdit = (entry: JournalWithEmployee) => {
    setEditingEntry(entry);
    setFormEmployeeId(entry.employee_id);
    setFormDate(entry.entry_date);
    setFormActivities(entry.activities);
    setFormLearnings(entry.learnings || '');
    setFormChallenges(entry.challenges || '');
    setFormHours(entry.hours_worked?.toString() || '');
    setFormStatus(entry.status);
    setFormSupervisorNotes(entry.supervisor_notes || '');
    setIsFormOpen(true);
  };

  const openView = (entry: JournalWithEmployee) => {
    setViewEntry(entry);
    setIsViewOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!formActivities.trim() || (!editingEntry && !formEmployeeId)) {
        throw new Error('Employee and activities are required');
      }
      const payload: any = {
        activities: formActivities.trim(),
        learnings: formLearnings.trim() || null,
        challenges: formChallenges.trim() || null,
        hours_worked: formHours ? parseFloat(formHours) : null,
        status: formStatus,
        supervisor_notes: formSupervisorNotes.trim() || null,
      };

      if (editingEntry) {
        const { error } = await (supabase as any)
          .from('intern_journals')
          .update(payload)
          .eq('id', editingEntry.id);
        if (error) throw error;
      } else {
        payload.employee_id = formEmployeeId;
        payload.entry_date = formDate;
        const { error } = await (supabase as any)
          .from('intern_journals')
          .insert([payload]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-journals'] });
      toast.success(editingEntry ? 'Journal entry updated' : 'Journal entry created');
      setIsFormOpen(false);
      resetForm();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('intern_journals').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-journals'] });
      toast.success('Journal entry deleted');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const quickStatusUpdate = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await (supabase as any)
        .from('intern_journals')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-journals'] });
      toast.success('Status updated');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const exportCSV = () => {
    const headers = ['Employee', 'Date', 'Activities', 'Learnings', 'Challenges', 'Hours', 'Status', 'Supervisor Notes'];
    const rows = filtered.map((j) => [
      `${j.employee?.first_name || ''} ${j.employee?.last_name || ''}`,
      j.entry_date,
      `"${j.activities.replace(/"/g, '""')}"`,
      `"${(j.learnings || '').replace(/"/g, '""')}"`,
      `"${(j.challenges || '').replace(/"/g, '""')}"`,
      j.hours_worked || '',
      j.status,
      `"${(j.supervisor_notes || '').replace(/"/g, '""')}"`,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `journals-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported');
  };

  const counts = {
    all: journals.length,
    pending: journals.filter((j) => j.status === 'pending').length,
    approved: journals.filter((j) => j.status === 'approved').length,
    rejected: journals.filter((j) => j.status === 'rejected').length,
    draft: journals.filter((j) => j.status === 'draft').length,
  };

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <CardTitle>Daily Journal Overview</CardTitle>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={exportCSV}><Download className="h-4 w-4 mr-1" />Export</Button>
            <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4 mr-1" />New Entry</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {(['all', 'pending', 'approved', 'rejected', 'draft'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`rounded-lg border p-3 text-left transition-colors ${statusFilter === s ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}
              >
                <p className="text-xs text-muted-foreground capitalize">{s}</p>
                <p className="text-xl font-bold">{counts[s]}</p>
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or activity..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Intern</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Activities</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No journal entries found
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((j) => (
                    <TableRow key={j.id}>
                      <TableCell className="font-medium">
                        {j.employee?.first_name} {j.employee?.last_name}
                      </TableCell>
                      <TableCell className="text-muted-foreground whitespace-nowrap">
                        {format(parseISO(j.entry_date), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-sm">
                        {j.activities}
                      </TableCell>
                      <TableCell>{j.hours_worked ?? '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`gap-1 text-[10px] ${statusColors[j.status] || ''}`}>
                          {statusIcons[j.status]}
                          {j.status.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openView(j)}>
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          {j.status === 'pending' && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-green-600"
                                onClick={() => quickStatusUpdate.mutate({ id: j.id, status: 'approved' })}
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-destructive"
                                onClick={() => quickStatusUpdate.mutate({ id: j.id, status: 'rejected' })}
                              >
                                <XCircle className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(j)}>
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-destructive"
                            onClick={() => {
                              if (confirm('Delete this journal entry?')) deleteMutation.mutate(j.id);
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden">
          {viewEntry && (
            <div className="animate-fade-in">
              {/* Hero Header */}
              <div className={`relative px-6 pt-6 pb-5 ${
                viewEntry.status === 'approved' ? 'bg-gradient-to-br from-green-500/10 via-emerald-500/5 to-transparent' :
                viewEntry.status === 'rejected' ? 'bg-gradient-to-br from-destructive/10 via-red-500/5 to-transparent' :
                viewEntry.status === 'pending' ? 'bg-gradient-to-br from-yellow-500/10 via-amber-500/5 to-transparent' :
                'bg-gradient-to-br from-muted/50 via-muted/20 to-transparent'
              }`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 ring-2 ring-background shadow-md">
                      <AvatarImage src={viewEntry.employee?.avatar_url || ''} />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {viewEntry.employee?.first_name?.[0]}{viewEntry.employee?.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-lg leading-tight">
                        {viewEntry.employee?.first_name} {viewEntry.employee?.last_name}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-0.5">Daily Journal Entry</p>
                    </div>
                  </div>
                  <Badge variant="outline" className={`gap-1.5 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider ${statusColors[viewEntry.status] || ''}`}>
                    {statusIcons[viewEntry.status]}
                    {viewEntry.status}
                  </Badge>
                </div>

                {/* Meta Cards */}
                <div className="grid grid-cols-2 gap-3 mt-5">
                  <div className="flex items-center gap-2.5 rounded-lg border bg-background/80 backdrop-blur-sm px-3.5 py-2.5 shadow-sm">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                      <CalendarDays className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Date</p>
                      <p className="text-sm font-semibold">{format(parseISO(viewEntry.entry_date), 'MMMM d, yyyy')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 rounded-lg border bg-background/80 backdrop-blur-sm px-3.5 py-2.5 shadow-sm">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                      <Timer className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Hours Worked</p>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold">{viewEntry.hours_worked ?? '—'}{viewEntry.hours_worked ? 'h' : ''}</p>
                        {viewEntry.hours_worked && (
                          <Progress value={Math.min((viewEntry.hours_worked / 8) * 100, 100)} className="h-1.5 w-16" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Content Sections */}
              <div className="px-6 py-5 space-y-5 max-h-[50vh] overflow-y-auto">
                {/* Activities */}
                <div className="group">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-500/10">
                      <BookOpen className="h-3.5 w-3.5 text-blue-600" />
                    </div>
                    <h4 className="text-sm font-semibold text-foreground">Activities</h4>
                  </div>
                  <div className="ml-8 rounded-lg bg-muted/40 border border-transparent group-hover:border-border transition-colors px-4 py-3">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">{viewEntry.activities}</p>
                  </div>
                </div>

                {/* Learnings */}
                {viewEntry.learnings && (
                  <div className="group">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-500/10">
                        <Lightbulb className="h-3.5 w-3.5 text-amber-600" />
                      </div>
                      <h4 className="text-sm font-semibold text-foreground">Learnings</h4>
                    </div>
                    <div className="ml-8 rounded-lg bg-muted/40 border border-transparent group-hover:border-border transition-colors px-4 py-3">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">{viewEntry.learnings}</p>
                    </div>
                  </div>
                )}

                {/* Challenges */}
                {viewEntry.challenges && (
                  <div className="group">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-red-500/10">
                        <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                      </div>
                      <h4 className="text-sm font-semibold text-foreground">Challenges</h4>
                    </div>
                    <div className="ml-8 rounded-lg bg-muted/40 border border-transparent group-hover:border-border transition-colors px-4 py-3">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">{viewEntry.challenges}</p>
                    </div>
                  </div>
                )}

                {/* Supervisor Notes */}
                {viewEntry.supervisor_notes && (
                  <div className="group">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-purple-500/10">
                        <MessageSquare className="h-3.5 w-3.5 text-purple-600" />
                      </div>
                      <h4 className="text-sm font-semibold text-foreground">Supervisor Notes</h4>
                    </div>
                    <div className="ml-8 rounded-lg bg-purple-500/5 border border-purple-500/10 px-4 py-3">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90 italic">{viewEntry.supervisor_notes}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <Separator />
              <div className="px-6 py-3 flex items-center justify-between bg-muted/20">
                <p className="text-[11px] text-muted-foreground">
                  Created {format(parseISO(viewEntry.created_at), 'MMM d, yyyy · h:mm a')}
                </p>
                <Button variant="outline" size="sm" onClick={() => setIsViewOpen(false)}>Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create/Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={(open) => { setIsFormOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingEntry ? 'Edit Journal Entry' : 'Create Journal Entry'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {!editingEntry && (
              <div>
                <Label>Intern *</Label>
                <Select value={formEmployeeId} onValueChange={setFormEmployeeId}>
                  <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                  <SelectContent>
                    {employees.map((e) => (
                      <SelectItem key={e.id} value={e.id}>{e.first_name} {e.last_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Date</Label>
                <Input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} disabled={!!editingEntry} />
              </div>
              <div>
                <Label>Hours Worked</Label>
                <Input type="number" step="0.5" min="0" max="24" value={formHours} onChange={(e) => setFormHours(e.target.value)} placeholder="e.g. 8" />
              </div>
            </div>
            <div>
              <Label>Activities *</Label>
              <Textarea value={formActivities} onChange={(e) => setFormActivities(e.target.value)} rows={3} placeholder="What was done today..." />
            </div>
            <div>
              <Label>Learnings</Label>
              <Textarea value={formLearnings} onChange={(e) => setFormLearnings(e.target.value)} rows={2} placeholder="Key takeaways..." />
            </div>
            <div>
              <Label>Challenges</Label>
              <Textarea value={formChallenges} onChange={(e) => setFormChallenges(e.target.value)} rows={2} placeholder="Difficulties faced..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Status</Label>
                <Select value={formStatus} onValueChange={setFormStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Supervisor Notes</Label>
              <Textarea value={formSupervisorNotes} onChange={(e) => setFormSupervisorNotes(e.target.value)} rows={2} placeholder="Admin/supervisor comments..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsFormOpen(false); resetForm(); }}>Cancel</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              {editingEntry ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
