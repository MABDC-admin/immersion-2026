import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import {
  BookOpen,
  CalendarDays,
  Clock3,
  FileText,
  Film,
  Lightbulb,
  Loader2,
  MessageSquare,
  Search,
  Sparkles,
  Trash2,
  Upload,
  Users,
  X,
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/hooks/useAuth';
import {
  useAdminEmployeeJournalGroups,
  useDeleteJournalAttachment,
  useUploadJournalAttachments,
  type EmployeeJournalGroup,
  type JournalAttachment,
  type JournalEntry,
} from '@/hooks/useJournal';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

const statusStyles: Record<string, string> = {
  approved: 'bg-green-500/10 text-green-700 border-green-500/20',
  rejected: 'bg-destructive/10 text-destructive border-destructive/20',
  pending: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
  draft: 'bg-muted text-muted-foreground border-border',
};

interface PendingPreviewItem {
  file: File;
  previewUrl: string;
}

function JournalEntryModal({
  open,
  onOpenChange,
  selectedEntry,
  employeeName,
  avatarUrl,
  onEntryChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedEntry: JournalEntry | null;
  employeeName: string;
  avatarUrl?: string;
  onEntryChange: (entry: JournalEntry) => void;
}) {
  const uploadAttachments = useUploadJournalAttachments();
  const deleteAttachment = useDeleteJournalAttachment();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const pendingPreviews = useMemo<PendingPreviewItem[]>(
    () => selectedFiles.map((file) => ({ file, previewUrl: URL.createObjectURL(file) })),
    [selectedFiles]
  );

  useEffect(() => {
    return () => {
      pendingPreviews.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    };
  }, [pendingPreviews]);

  useEffect(() => {
    setSelectedFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [selectedEntry?.id, open]);

  if (!selectedEntry) return null;

  const getAttachmentUrl = (filePath: string) =>
    supabase.storage.from('journal-media').getPublicUrl(filePath).data.publicUrl;

  const handleFilesPicked = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const allowedFiles = files.filter((file) => file.type.startsWith('image/') || file.type.startsWith('video/'));
    setSelectedFiles((current) => [...current, ...allowedFiles]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removePendingFile = (indexToRemove: number) => {
    setSelectedFiles((current) => current.filter((_, index) => index !== indexToRemove));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    const result = await uploadAttachments.mutateAsync({
      journalId: selectedEntry.id,
      employeeId: selectedEntry.employee_id,
      files: selectedFiles,
    });

    onEntryChange({
      ...selectedEntry,
      attachments: [...(selectedEntry.attachments || []), ...result.uploadedAttachments],
    });
    setSelectedFiles([]);
  };

  const handleDeleteAttachment = async (attachment: JournalAttachment) => {
    await deleteAttachment.mutateAsync({
      attachmentId: attachment.id,
      filePath: attachment.file_path,
      employeeId: selectedEntry.employee_id,
    });

    onEntryChange({
      ...selectedEntry,
      attachments: (selectedEntry.attachments || []).filter((item) => item.id !== attachment.id),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden">
        <div className="bg-gradient-to-br from-primary/10 via-background to-background px-6 py-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 ring-2 ring-background shadow-sm">
                <AvatarImage src={avatarUrl || ''} />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {employeeName
                    .split(' ')
                    .map((part) => part[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-semibold">{employeeName}</h2>
                <p className="text-sm text-muted-foreground">Daily Journal Entry</p>
              </div>
            </div>
            <Badge variant="outline" className={cn('uppercase tracking-wide', statusStyles[selectedEntry.status] || statusStyles.draft)}>
              {selectedEntry.status}
            </Badge>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border bg-background/80 px-4 py-3">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                <CalendarDays className="h-3.5 w-3.5" />
                Entry Date
              </div>
              <p className="mt-1 text-sm font-semibold">{format(parseISO(selectedEntry.entry_date), 'EEEE, MMMM d, yyyy')}</p>
            </div>
            <div className="rounded-xl border bg-background/80 px-4 py-3">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                <Clock3 className="h-3.5 w-3.5" />
                Hours Worked
              </div>
              <p className="mt-1 text-sm font-semibold">
                {selectedEntry.hours_worked ? `${selectedEntry.hours_worked}h` : 'Not recorded'}
              </p>
            </div>
          </div>
        </div>

        <Separator />

        <div className="max-h-[70vh] space-y-5 overflow-y-auto px-6 py-5">
          <section className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <FileText className="h-4 w-4 text-primary" />
              Activities
            </div>
            <div className="rounded-xl border bg-muted/30 px-4 py-3 text-sm leading-6 whitespace-pre-wrap">
              {selectedEntry.activities}
            </div>
          </section>

          {selectedEntry.learnings && (
            <section className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                Learnings
              </div>
              <div className="rounded-xl border bg-muted/30 px-4 py-3 text-sm leading-6 whitespace-pre-wrap">
                {selectedEntry.learnings}
              </div>
            </section>
          )}

          {selectedEntry.challenges && (
            <section className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Sparkles className="h-4 w-4 text-rose-500" />
                Challenges
              </div>
              <div className="rounded-xl border bg-muted/30 px-4 py-3 text-sm leading-6 whitespace-pre-wrap">
                {selectedEntry.challenges}
              </div>
            </section>
          )}

          {selectedEntry.supervisor_notes && (
            <section className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <MessageSquare className="h-4 w-4 text-violet-500" />
                Supervisor Notes
              </div>
              <div className="rounded-xl border border-violet-500/15 bg-violet-500/5 px-4 py-3 text-sm leading-6 whitespace-pre-wrap">
                {selectedEntry.supervisor_notes}
              </div>
            </section>
          )}

          <section className="space-y-3 rounded-xl border border-dashed bg-muted/20 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold">Admin Media Upload</p>
                <p className="text-xs text-muted-foreground">
                  Add multiple photos or videos directly to this employee&apos;s journal entry.
                </p>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="h-4 w-4" />
                  Choose Files
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="gap-2"
                  disabled={selectedFiles.length === 0 || uploadAttachments.isPending}
                  onClick={handleUpload}
                >
                  {uploadAttachments.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  Upload Now
                </Button>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              className="hidden"
              onChange={handleFilesPicked}
            />

            {pendingPreviews.length > 0 && (
              <div className="grid gap-3 sm:grid-cols-2">
                {pendingPreviews.map((item, index) => {
                  const isVideo = item.file.type.startsWith('video/');

                  return (
                    <div key={`${item.file.name}-${index}`} className="relative overflow-hidden rounded-xl border bg-background">
                      {isVideo ? (
                        <div className="relative aspect-video bg-black">
                          <video src={item.previewUrl} className="h-full w-full object-cover opacity-80" />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                            <Film className="h-7 w-7 text-white" />
                          </div>
                        </div>
                      ) : (
                        <div className="aspect-video bg-black/5">
                          <img src={item.previewUrl} alt={item.file.name} className="h-full w-full object-cover" />
                        </div>
                      )}
                      <div className="px-3 py-2">
                        <p className="truncate text-xs font-semibold">{item.file.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {(item.file.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        className="absolute right-2 top-2 h-7 w-7"
                        onClick={() => removePendingFile(index)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {selectedEntry.attachments && selectedEntry.attachments.length > 0 && (
            <section className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <FileText className="h-4 w-4 text-primary" />
                Media Attachments
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {selectedEntry.attachments.map((attachment) => {
                  const isVideo = attachment.file_type.startsWith('video/');
                  const attachmentUrl = getAttachmentUrl(attachment.file_path);

                  return (
                    <div
                      key={attachment.id}
                      className="group relative overflow-hidden rounded-xl border bg-muted/20 transition-colors hover:bg-muted/40"
                    >
                      <a href={attachmentUrl} target="_blank" rel="noreferrer" className="block">
                        {isVideo ? (
                          <div className="relative aspect-video bg-black">
                            <video src={attachmentUrl} className="h-full w-full object-cover opacity-80" />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                              <Film className="h-7 w-7 text-white" />
                            </div>
                          </div>
                        ) : (
                          <div className="aspect-video bg-black/5">
                            <img src={attachmentUrl} alt={attachment.file_name} className="h-full w-full object-cover" />
                          </div>
                        )}
                        <div className="px-3 py-2">
                          <p className="truncate text-xs font-semibold">{attachment.file_name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {attachment.file_size ? `${(attachment.file_size / (1024 * 1024)).toFixed(2)} MB` : 'Media'}
                          </p>
                        </div>
                      </a>
                      <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        className="absolute right-2 top-2 h-7 w-7 opacity-0 shadow-sm transition-opacity group-hover:opacity-100"
                        onClick={() => handleDeleteAttachment(attachment)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EmployeeJournalAccordion({
  group,
  onViewEntry,
}: {
  group: EmployeeJournalGroup;
  onViewEntry: (entry: JournalEntry, employeeName: string, avatarUrl?: string) => void;
}) {
  const employeeName = `${group.employee.first_name} ${group.employee.last_name}`;
  const pendingCount = group.entries.filter((entry) => entry.status === 'pending').length;

  return (
    <AccordionItem value={group.employee.id} className="rounded-2xl border bg-card px-4 shadow-sm">
      <AccordionTrigger className="py-4 hover:no-underline">
        <div className="flex min-w-0 flex-1 items-center gap-3 text-left">
          <Avatar className="h-11 w-11 border">
            <AvatarImage src={group.employee.avatar_url || ''} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {group.employee.first_name[0]}
              {group.employee.last_name[0]}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate font-semibold text-foreground">{employeeName}</p>
              <Badge variant="secondary" className="rounded-full">
                {group.entries.length} {group.entries.length === 1 ? 'entry' : 'entries'}
              </Badge>
              {pendingCount > 0 && (
                <Badge variant="outline" className={statusStyles.pending}>
                  {pendingCount} pending
                </Badge>
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span>{group.employee.job_title || 'Employee'}</span>
              <span>{group.employee.department?.name || 'No department'}</span>
              <span>
                {group.latestEntryDate
                  ? `Latest: ${format(parseISO(group.latestEntryDate), 'MMM d, yyyy')}`
                  : 'No journal entries yet'}
              </span>
            </div>
          </div>
        </div>
      </AccordionTrigger>

      <AccordionContent className="pb-4">
        {group.entries.length === 0 ? (
          <div className="rounded-xl border border-dashed px-4 py-6 text-sm text-muted-foreground">
            No daily journal entries recorded for this employee yet.
          </div>
        ) : (
          <div className="space-y-3">
            {group.entries.map((entry) => (
              <div
                key={entry.id}
                className="flex flex-col gap-3 rounded-xl border bg-muted/20 px-4 py-3 md:flex-row md:items-center md:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{format(parseISO(entry.entry_date), 'EEEE, MMM d')}</p>
                    <Badge variant="outline" className={statusStyles[entry.status] || statusStyles.draft}>
                      {entry.status}
                    </Badge>
                    {entry.hours_worked && (
                      <Badge variant="secondary" className="rounded-full">
                        {entry.hours_worked}h
                      </Badge>
                    )}
                    {entry.attachments && entry.attachments.length > 0 && (
                      <Badge variant="secondary" className="rounded-full">
                        {entry.attachments.length} media
                      </Badge>
                    )}
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                    {entry.activities}
                  </p>
                </div>

                <Button
                  variant="outline"
                  className="shrink-0"
                  onClick={() => onViewEntry(entry, employeeName, group.employee.avatar_url)}
                >
                  View Journal
                </Button>
              </div>
            ))}
          </div>
        )}
      </AccordionContent>
    </AccordionItem>
  );
}

export default function EmployeeJournals() {
  const { isAdmin, userRole } = useAuth();
  const [search, setSearch] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [selectedEmployeeName, setSelectedEmployeeName] = useState('');
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState<string | undefined>(undefined);
  const { data: groups = [], isLoading } = useAdminEmployeeJournalGroups();

  const canAccess = isAdmin || userRole === 'hr_manager';

  const filteredGroups = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return groups;

    return groups.filter((group) => {
      const fullName = `${group.employee.first_name} ${group.employee.last_name}`.toLowerCase();
      const department = group.employee.department?.name?.toLowerCase() || '';
      const jobTitle = group.employee.job_title?.toLowerCase() || '';

      return fullName.includes(query) || department.includes(query) || jobTitle.includes(query);
    });
  }, [groups, search]);

  const summary = useMemo(() => {
    const employeeCount = filteredGroups.length;
    const entryCount = filteredGroups.reduce((count, group) => count + group.entries.length, 0);
    const pendingCount = filteredGroups.reduce(
      (count, group) => count + group.entries.filter((entry) => entry.status === 'pending').length,
      0
    );
    const employeesWithEntries = filteredGroups.filter((group) => group.entries.length > 0).length;

    return { employeeCount, entryCount, pendingCount, employeesWithEntries };
  }, [filteredGroups]);

  if (!canAccess) return <Navigate to="/dashboard" replace />;

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold">
              <BookOpen className="h-6 w-6" />
              Employee Journals
            </h1>
            <p className="text-sm text-muted-foreground">
              Browse every employee journal from one place. Supervisors are excluded from this list.
            </p>
          </div>

          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search employee, department, or role..."
              className="pl-9"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Employees</CardDescription>
              <CardTitle className="text-2xl">{summary.employeeCount}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Journal Entries</CardDescription>
              <CardTitle className="text-2xl">{summary.entryCount}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Pending Review</CardDescription>
              <CardTitle className="text-2xl">{summary.pendingCount}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Employees With Entries</CardDescription>
              <CardTitle className="text-2xl">{summary.employeesWithEntries}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Card className="overflow-hidden border-0 shadow-none">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="rounded-2xl border border-dashed bg-card px-6 py-16 text-center text-muted-foreground">
                Loading employee journals...
              </div>
            ) : filteredGroups.length === 0 ? (
              <div className="rounded-2xl border border-dashed bg-card px-6 py-16 text-center">
                <Users className="mx-auto h-10 w-10 text-muted-foreground/40" />
                <p className="mt-4 text-lg font-medium">No employees match this view</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Try a different search, or wait for employees to start logging journals.
                </p>
              </div>
            ) : (
              <Accordion type="multiple" className="space-y-3">
                {filteredGroups.map((group) => (
                  <EmployeeJournalAccordion
                    key={group.employee.id}
                    group={group}
                    onViewEntry={(entry, employeeName, avatarUrl) => {
                      setSelectedEntry(entry);
                      setSelectedEmployeeName(employeeName);
                      setSelectedAvatarUrl(avatarUrl);
                    }}
                  />
                ))}
              </Accordion>
            )}
          </CardContent>
        </Card>

        <JournalEntryModal
          open={!!selectedEntry}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedEntry(null);
              setSelectedEmployeeName('');
              setSelectedAvatarUrl(undefined);
            }
          }}
          selectedEntry={selectedEntry}
          employeeName={selectedEmployeeName}
          avatarUrl={selectedAvatarUrl}
          onEntryChange={setSelectedEntry}
        />
      </div>
    </MainLayout>
  );
}
