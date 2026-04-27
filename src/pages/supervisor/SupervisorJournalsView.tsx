import { useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { useSearchParams } from 'react-router-dom';
import { useAssignedInterns } from '@/hooks/useEvaluations';
import { useAuth } from '@/hooks/useAuth';
import { useJournalEntries } from '@/hooks/useJournal';
import { isSupervisorLikeEmployee, useCurrentEmployee, useEmployees, useSupervisorOptions } from '@/hooks/useEmployees';
import { supabase } from '@/integrations/supabase/client';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BookOpen, Calendar, Clock3, Film, ImageIcon, User } from 'lucide-react';

const statusColors: Record<string, string> = {
    draft: 'bg-muted text-muted-foreground',
    pending: 'bg-amber-100 text-amber-900',
    approved: 'bg-emerald-100 text-emerald-900',
    rejected: 'bg-rose-100 text-rose-900',
};

export default function SupervisorJournalsView() {
    const { user, userRole } = useAuth();
    const { data: employee } = useCurrentEmployee(user?.id || '');
    const { data: employees = [] } = useEmployees();
    const { data: supervisors = [] } = useSupervisorOptions();
    const supervisorId = employee?.id || '';
    const { data: assignedInterns = [] } = useAssignedInterns(supervisorId);
    const [searchParams, setSearchParams] = useSearchParams();
    const isPrincipal = userRole === 'principal';
    const supervisorIds = new Set(supervisors.map((supervisor) => supervisor.id));

    const principalInterns = employees.filter((currentEmployee) => !isSupervisorLikeEmployee(currentEmployee, supervisorIds));
    const interns = isPrincipal ? principalInterns : assignedInterns;
    const selectedInternId = searchParams.get('intern') || '';
    const selectedIntern = useMemo(
        () => interns.find((intern) => intern.id === selectedInternId) || interns[0] || null,
        [interns, selectedInternId]
    );
    const { data: entries = [], isLoading } = useJournalEntries(selectedIntern?.id || '');

    useEffect(() => {
        if (!interns.length) return;
        if (selectedInternId && interns.some((intern) => intern.id === selectedInternId)) return;

        const nextParams = new URLSearchParams(searchParams);
        nextParams.set('intern', interns[0].id);
        setSearchParams(nextParams, { replace: true });
    }, [interns, searchParams, selectedInternId, setSearchParams]);

    return (
        <MainLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Intern Daily Journals</h1>
                    <p className="text-sm text-muted-foreground">
                        {isPrincipal
                            ? 'Read-only journal oversight for all interns across the organization'
                            : 'Review and approve daily activities for your assigned interns'}
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <div className="space-y-4 md:col-span-1">
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium">
                                    {isPrincipal ? 'All Interns' : 'Assigned Interns'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y">
                                    {interns.map((intern) => (
                                        <button
                                            key={intern.id}
                                            onClick={() => {
                                                const nextParams = new URLSearchParams(searchParams);
                                                nextParams.set('intern', intern.id);
                                                setSearchParams(nextParams, { replace: true });
                                            }}
                                            className={`w-full p-4 text-left transition-colors ${
                                                selectedIntern?.id === intern.id ? 'bg-primary/5' : 'hover:bg-muted/50'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                                        {intern.first_name[0]}{intern.last_name[0]}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold">{intern.first_name} {intern.last_name}</p>
                                                        <p className="text-[10px] text-muted-foreground">{intern.department?.name || 'Unassigned'}</p>
                                                    </div>
                                                </div>
                                                <Badge variant="outline" className="text-[10px]">
                                                    View Journal
                                                </Badge>
                                            </div>
                                        </button>
                                    ))}
                                    {interns.length === 0 && (
                                        <div className="p-8 text-center text-muted-foreground">
                                            <User className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                            <p className="text-sm">{isPrincipal ? 'No intern records available' : 'No interns assigned'}</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="md:col-span-2">
                        {!selectedIntern ? (
                            <Card className="border-dashed h-full flex items-center justify-center min-h-[400px]">
                                <CardContent className="text-center space-y-4">
                                    <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                                        <BookOpen className="h-8 w-8 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold">Select an Intern</h3>
                                        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                                            {isPrincipal
                                                ? 'Choose any intern from the list to review their journal history in read-only mode.'
                                                : 'Choose an intern from the list to review their daily activity logs and provide feedback.'}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : (
                            <Card className="min-h-[400px]">
                                <CardHeader className="border-b bg-muted/20">
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-12 w-12 border border-slate-200">
                                                <AvatarImage src={selectedIntern.avatar_url || ''} />
                                                <AvatarFallback className="bg-primary/10 font-semibold text-primary">
                                                    {selectedIntern.first_name[0]}{selectedIntern.last_name[0]}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <CardTitle className="text-base">{selectedIntern.first_name} {selectedIntern.last_name}</CardTitle>
                                                <p className="text-sm text-muted-foreground">
                                                    {selectedIntern.job_title || 'Intern'} • {selectedIntern.department?.name || 'Unassigned Department'}
                                                </p>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className="w-fit">
                                            {entries.length} journal {entries.length === 1 ? 'entry' : 'entries'}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-5">
                                    {isLoading ? (
                                        <div className="flex h-48 items-center justify-center">
                                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                        </div>
                                    ) : entries.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-16 text-center">
                                            <div className="mb-4 rounded-full bg-muted p-4">
                                                <BookOpen className="h-8 w-8 text-muted-foreground" />
                                            </div>
                                            <h3 className="text-lg font-semibold">No Journal Entries Yet</h3>
                                            <p className="mt-1 max-w-md text-sm text-muted-foreground">
                                                {isPrincipal
                                                    ? 'This intern has not submitted any daily journal entries yet.'
                                                    : 'This intern has not recorded any daily activity journal entries yet.'}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {entries.map((entry) => (
                                                <div key={entry.id} className="rounded-2xl border bg-white p-4 shadow-sm">
                                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                                        <div className="space-y-2">
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <h3 className="text-sm font-semibold">
                                                                    {format(new Date(entry.entry_date), 'MMMM d, yyyy')}
                                                                </h3>
                                                                <Badge className={statusColors[entry.status] || statusColors.draft}>
                                                                    {entry.status}
                                                                </Badge>
                                                                {entry.hours_worked ? (
                                                                    <Badge variant="outline" className="gap-1">
                                                                        <Clock3 className="h-3 w-3" />
                                                                        {entry.hours_worked}h
                                                                    </Badge>
                                                                ) : null}
                                                                {entry.attachments?.length ? (
                                                                    <Badge variant="outline" className="gap-1">
                                                                        <ImageIcon className="h-3 w-3" />
                                                                        {entry.attachments.length} media
                                                                    </Badge>
                                                                ) : null}
                                                            </div>
                                                            <p className="text-sm text-muted-foreground">
                                                                Submitted on {format(new Date(entry.created_at), 'MMM d, yyyy h:mm a')}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                            <Calendar className="h-3.5 w-3.5" />
                                                            Updated {format(new Date(entry.updated_at), 'MMM d, yyyy')}
                                                        </div>
                                                    </div>

                                                    <div className="mt-4 space-y-4">
                                                        <DetailBlock label="Activities" value={entry.activities} />
                                                        {entry.learnings ? <DetailBlock label="Key Learnings" value={entry.learnings} /> : null}
                                                        {entry.challenges ? <DetailBlock label="Challenges" value={entry.challenges} /> : null}
                                                        {entry.attachments && entry.attachments.length > 0 ? (
                                                            <div className="space-y-3">
                                                                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                                                                    Photo & Video Updates
                                                                </p>
                                                                <div className="grid gap-3 sm:grid-cols-2">
                                                                    {entry.attachments.map((attachment) => (
                                                                        <JournalAttachmentCard key={attachment.id} attachment={attachment} />
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ) : null}
                                                        {entry.supervisor_notes ? <DetailBlock label="Supervisor Notes" value={entry.supervisor_notes} emphasized /> : null}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}

function DetailBlock({ label, value, emphasized = false }: { label: string; value: string; emphasized?: boolean }) {
    return (
        <div className={`rounded-xl border p-3 ${emphasized ? 'border-primary/20 bg-primary/5' : 'bg-muted/20'}`}>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
            <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">{value}</p>
        </div>
    );
}

function JournalAttachmentCard({
    attachment,
}: {
    attachment: {
        id: string;
        file_name: string;
        file_path: string;
        file_type: string;
    };
}) {
    const attachmentUrl = supabase.storage.from('journal-media').getPublicUrl(attachment.file_path).data.publicUrl;
    const isVideo = attachment.file_type.startsWith('video/');

    return (
        <a
            href={attachmentUrl}
            target="_blank"
            rel="noreferrer"
            className="group overflow-hidden rounded-xl border bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
            {isVideo ? (
                <div className="relative aspect-video overflow-hidden bg-black">
                    <video src={attachmentUrl} className="h-full w-full object-cover opacity-80" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <Film className="h-7 w-7 text-white" />
                    </div>
                </div>
            ) : (
                <div className="aspect-video overflow-hidden bg-muted/20">
                    <img src={attachmentUrl} alt={attachment.file_name} className="h-full w-full object-cover" />
                </div>
            )}
            <div className="space-y-1 px-3 py-2">
                <p className="truncate text-xs font-semibold text-foreground">{attachment.file_name}</p>
                <p className="text-[11px] text-muted-foreground">
                    {isVideo ? 'Video attachment' : 'Image attachment'}
                </p>
            </div>
        </a>
    );
}
