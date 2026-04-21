import { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import {
  BookOpen,
  CalendarDays,
  Clock3,
  Download,
  FileText,
  Film,
  Lightbulb,
  Loader2,
  MessageSquare,
  Search,
  Sparkles,
  Trash2,
  Users,
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
  type JournalUploadProgress,
} from '@/hooks/useJournal';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { JournalMediaUploader } from '@/components/journal/JournalMediaUploader';
import { useToast } from '@/hooks/use-toast';
import { formatJournalMediaSize } from '@/lib/journalMedia';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

const statusStyles: Record<string, string> = {
  approved: 'bg-green-500/10 text-green-700 border-green-500/20',
  rejected: 'bg-destructive/10 text-destructive border-destructive/20',
  pending: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
  draft: 'bg-muted text-muted-foreground border-border',
};

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
  const { toast } = useToast();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<JournalUploadProgress | null>(null);
  const [previewAttachment, setPreviewAttachment] = useState<{
    url: string;
    type: string;
    name: string;
  } | null>(null);

  useEffect(() => {
    setSelectedFiles([]);
    setUploadProgress(null);
    setPreviewAttachment(null);
  }, [selectedEntry?.id, open]);

  if (!selectedEntry) return null;

  const getAttachmentUrl = (filePath: string) =>
    supabase.storage.from('journal-media').getPublicUrl(filePath).data.publicUrl;

  const removePendingFile = (indexToRemove: number) => {
    setSelectedFiles((current) => current.filter((_, index) => index !== indexToRemove));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    try {
      const result = await uploadAttachments.mutateAsync({
        journalId: selectedEntry.id,
        employeeId: selectedEntry.employee_id,
        files: selectedFiles,
        onProgress: (progress) => setUploadProgress(progress),
      });

      onEntryChange({
        ...selectedEntry,
        attachments: [...(selectedEntry.attachments || []), ...result.uploadedAttachments],
      });
      setSelectedFiles([]);
      setUploadProgress(null);
      toast({
        title: 'Media uploaded',
        description: `${result.uploadedAttachments.length} ${result.uploadedAttachments.length === 1 ? 'file was' : 'files were'} added to this journal entry.`,
      });
    } catch (error) {
      setUploadProgress(null);
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Something went wrong while uploading media.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteAttachment = async (attachment: JournalAttachment) => {
    try {
      await deleteAttachment.mutateAsync({
        attachmentId: attachment.id,
        filePath: attachment.file_path,
        employeeId: selectedEntry.employee_id,
      });

      onEntryChange({
        ...selectedEntry,
        attachments: (selectedEntry.attachments || []).filter((item) => item.id !== attachment.id),
      });
      toast({ title: 'Attachment removed' });
    } catch (error) {
      toast({
        title: 'Unable to remove attachment',
        description: error instanceof Error ? error.message : 'Something went wrong while deleting the file.',
        variant: 'destructive',
      });
    }
  };

  return (
    <>
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
            <JournalMediaUploader
              title="Admin Media Upload"
              description="Drop photos or videos onto this journal entry and upload them without leaving the review modal."
              selectedFiles={selectedFiles}
              onAddFiles={(files) => setSelectedFiles((current) => [...current, ...files])}
              onRemoveFile={removePendingFile}
              progress={uploadProgress}
              isUploading={uploadAttachments.isPending}
              browseLabel="Choose Files"
              actions={(
                <Button
                  type="button"
                  size="sm"
                  className="gap-2"
                  disabled={selectedFiles.length === 0 || uploadAttachments.isPending}
                  onClick={handleUpload}
                >
                  {uploadAttachments.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Upload Now
                </Button>
              )}
            />
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
                      <button
                        type="button"
                        className="block w-full text-left"
                        onClick={() => setPreviewAttachment({
                          url: attachmentUrl,
                          type: attachment.file_type,
                          name: attachment.file_name,
                        })}
                      >
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
                            {formatJournalMediaSize(attachment.file_size)}
                          </p>
                        </div>
                      </button>
                      <div className="absolute right-2 top-2 flex gap-2 opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                        <Button
                          type="button"
                          variant="secondary"
                          size="icon"
                          className="h-7 w-7"
                          asChild
                        >
                          <a
                            href={attachmentUrl}
                            download={attachment.file_name}
                            onClick={(event) => event.stopPropagation()}
                          >
                            <Download className="h-3.5 w-3.5" />
                          </a>
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleDeleteAttachment(attachment)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
        </DialogContent>
      </Dialog>
      <Dialog open={!!previewAttachment} onOpenChange={(nextOpen) => !nextOpen && setPreviewAttachment(null)}>
        <DialogContent className="max-w-5xl overflow-hidden bg-black p-2">
          {previewAttachment && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3 px-3 pt-2 text-white">
                <p className="truncate text-sm">{previewAttachment.name}</p>
                <Button variant="secondary" size="sm" className="gap-2" asChild>
                  <a href={previewAttachment.url} download={previewAttachment.name}>
                    <Download className="h-4 w-4" />
                    Download
                  </a>
                </Button>
              </div>
              {previewAttachment.type.startsWith('video/') ? (
                <video
                  src={previewAttachment.url}
                  controls
                  autoPlay
                  className="max-h-[80vh] w-full rounded-lg"
                />
              ) : (
                <img
                  src={previewAttachment.url}
                  alt={previewAttachment.name}
                  className="max-h-[80vh] w-full rounded-lg object-contain"
                />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
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
