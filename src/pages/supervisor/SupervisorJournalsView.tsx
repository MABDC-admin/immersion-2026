import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { useSearchParams } from 'react-router-dom';
import { useAssignedInterns } from '@/hooks/useEvaluations';
import { useAuth } from '@/hooks/useAuth';
import { useJournalEntries } from '@/hooks/useJournal';
import { isSupervisorLikeEmployee, useCurrentEmployee, useEmployees, useSupervisorOptions } from '@/hooks/useEmployees';
import { supabase } from '@/integrations/supabase/client';
import { MainLayout } from '@/components/layout/MainLayout';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { BookOpen, Calendar, Clock3, Film, ImageIcon, User } from 'lucide-react';
import type { EmployeeWithRelations } from '@/types/employee';

const statusColors: Record<string, string> = {
    draft: 'bg-muted text-muted-foreground',
    pending: 'border-amber-200 bg-amber-100 text-amber-800',
    approved: 'border-emerald-200 bg-emerald-100 text-emerald-800',
    rejected: 'border-rose-200 bg-rose-100 text-rose-800',
};

const INTERN_CARD_STYLES = [
    {
        active: 'border-orange-200 bg-orange-50 text-orange-900',
        idle: 'hover:bg-orange-50/70',
        avatar: 'bg-orange-100 text-orange-800',
        badge: 'border-orange-200 bg-orange-50 text-orange-800',
    },
    {
        active: 'border-cyan-200 bg-cyan-50 text-cyan-900',
        idle: 'hover:bg-cyan-50/70',
        avatar: 'bg-cyan-100 text-cyan-800',
        badge: 'border-cyan-200 bg-cyan-50 text-cyan-800',
    },
    {
        active: 'border-violet-200 bg-violet-50 text-violet-900',
        idle: 'hover:bg-violet-50/70',
        avatar: 'bg-violet-100 text-violet-800',
        badge: 'border-violet-200 bg-violet-50 text-violet-800',
    },
    {
        active: 'border-emerald-200 bg-emerald-50 text-emerald-900',
        idle: 'hover:bg-emerald-50/70',
        avatar: 'bg-emerald-100 text-emerald-800',
        badge: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    },
] as const;

function getInternAccent(index: number) {
    return INTERN_CARD_STYLES[index % INTERN_CARD_STYLES.length];
}

export default function SupervisorJournalsView() {
    const { user, userRole } = useAuth();
    const { data: employee } = useCurrentEmployee(user?.id || '');
    const { data: employees = [] } = useEmployees();
    const { data: supervisors = [] } = useSupervisorOptions();
    const supervisorId = employee?.id || '';
    const { data: assignedInterns = [] } = useAssignedInterns(supervisorId);
    const [searchParams, setSearchParams] = useSearchParams();
    const [previewAttachment, setPreviewAttachment] = useState<{
        url: string;
        type: string;
        name: string;
    } | null>(null);
    const isPrincipal = userRole === 'principal';
    const supervisorIds = new Set(supervisors.map((supervisor) => supervisor.id));
    const employeesById = useMemo(
        () => new Map(employees.map((currentEmployee) => [currentEmployee.id, currentEmployee])),
        [employees]
    );

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
                <div className="rounded-3xl border border-orange-200 bg-gradient-to-r from-orange-50 via-white to-cyan-50 p-6 shadow-sm">
                    <h1 className="text-2xl font-bold text-foreground">Intern Daily Journals</h1>
                    <p className="text-sm text-muted-foreground">
                        {isPrincipal
                            ? 'Read-only journal oversight for all interns across the organization'
                            : 'Review and approve daily activities for your assigned interns'}
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <div className="space-y-4 md:col-span-1">
                        <Card className="border-violet-200 bg-gradient-to-br from-violet-50/75 via-white to-orange-50/75 shadow-sm">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium">
                                    {isPrincipal ? 'All Interns' : 'Assigned Interns'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="space-y-2 p-3">
                                    {interns.map((intern, index) => {
                                        const accent = getInternAccent(index);
                                        const isSelected = selectedIntern?.id === intern.id;

                                        return (
                                        <button
                                            key={intern.id}
                                            onClick={() => {
                                                const nextParams = new URLSearchParams(searchParams);
                                                nextParams.set('intern', intern.id);
                                                setSearchParams(nextParams, { replace: true });
                                            }}
                                            className={`w-full rounded-2xl border p-4 text-left transition-colors ${
                                                isSelected ? accent.active : `border-transparent bg-white/70 ${accent.idle}`
                                            }`}
                                        >
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="flex items-center gap-3">
                                                    <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${accent.avatar}`}>
                                                        {intern.first_name[0]}{intern.last_name[0]}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold">{intern.first_name} {intern.last_name}</p>
                                                        <p className="text-[10px] text-muted-foreground">
                                                            {getDepartmentName(intern, employeesById)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Badge variant="outline" className={`text-[10px] ${accent.badge}`}>
                                                    View Journal
                                                </Badge>
                                            </div>
                                        </button>
                                        );
                                    })}
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
                            <Card className="flex h-full min-h-[400px] items-center justify-center border-dashed border-cyan-200 bg-cyan-50/40">
                                <CardContent className="text-center space-y-4">
                                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-cyan-100">
                                        <BookOpen className="h-8 w-8 text-cyan-700" />
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
                            <Card className="min-h-[400px] border-cyan-200 bg-gradient-to-br from-cyan-50/60 via-white to-emerald-50/50 shadow-sm">
                                <CardHeader className="border-b border-cyan-100 bg-cyan-50/70">
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-12 w-12 border border-cyan-200">
                                                <AvatarImage src={selectedIntern.avatar_url || ''} />
                                                <AvatarFallback className="bg-cyan-100 font-semibold text-cyan-800">
                                                    {selectedIntern.first_name[0]}{selectedIntern.last_name[0]}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <CardTitle className="text-base">{selectedIntern.first_name} {selectedIntern.last_name}</CardTitle>
                                                <p className="text-sm text-muted-foreground">
                                                    {selectedIntern.job_title || 'Intern'} • {getDepartmentName(selectedIntern, employeesById)}
                                                </p>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className="w-fit border-emerald-200 bg-emerald-50 text-emerald-800">
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
                                            <div className="mb-4 rounded-full bg-amber-100 p-4">
                                                <BookOpen className="h-8 w-8 text-amber-700" />
                                            </div>
                                            <h3 className="text-lg font-semibold">No Journal Entries Yet</h3>
                                            <p className="mt-1 max-w-md text-sm text-muted-foreground">
                                                {isPrincipal
                                                    ? 'This intern has not submitted any daily journal entries yet.'
                                                    : 'This intern has not recorded any daily activity journal entries yet.'}
                                            </p>
                                        </div>
                                    ) : (
                                        <Accordion type="single" collapsible className="space-y-4">
                                            {entries.map((entry, index) => {
                                                const accent = getInternAccent(index);

                                                return (
                                                <AccordionItem key={entry.id} value={entry.id} className={`rounded-2xl border px-4 shadow-sm ${isPrincipal ? 'bg-white' : 'bg-white/90'} ${accent.active}`}>
                                                    <AccordionTrigger className="py-4 hover:no-underline">
                                                        <div className="flex w-full flex-col gap-3 text-left sm:flex-row sm:items-start sm:justify-between">
                                                            <div className="space-y-2">
                                                                <div className="flex flex-wrap items-center gap-2">
                                                                    <h3 className="text-sm font-semibold">
                                                                        {format(new Date(entry.entry_date), 'MMMM d, yyyy')}
                                                                    </h3>
                                                                    <Badge className={statusColors[entry.status] || statusColors.draft}>
                                                                        {entry.status}
                                                                    </Badge>
                                                                    {entry.hours_worked ? (
                                                                        <Badge variant="outline" className="gap-1 border-cyan-200 bg-cyan-50 text-cyan-800">
                                                                            <Clock3 className="h-3 w-3" />
                                                                            {entry.hours_worked}h
                                                                        </Badge>
                                                                    ) : null}
                                                                    {entry.attachments?.length ? (
                                                                        <Badge variant="outline" className="gap-1 border-violet-200 bg-violet-50 text-violet-800">
                                                                            <ImageIcon className="h-3 w-3" />
                                                                            {entry.attachments.length} media
                                                                        </Badge>
                                                                    ) : null}
                                                                </div>
                                                                <p className="text-sm text-muted-foreground">
                                                                    Submitted on {format(new Date(entry.created_at), 'MMM d, yyyy h:mm a')}
                                                                </p>
                                                            </div>
                                                            <div className="flex items-center gap-2 pr-2 text-xs text-muted-foreground">
                                                                <Calendar className="h-3.5 w-3.5" />
                                                                Updated {format(new Date(entry.updated_at), 'MMM d, yyyy')}
                                                            </div>
                                                        </div>
                                                    </AccordionTrigger>
                                                    <AccordionContent className="pb-4">
                                                        <div className="space-y-4 border-t border-cyan-100 pt-4">
                                                            <DetailBlock label="Activities" value={entry.activities} tone="activity" />
                                                            {entry.learnings ? <DetailBlock label="Key Learnings" value={entry.learnings} tone="learning" /> : null}
                                                            {entry.challenges ? <DetailBlock label="Challenges" value={entry.challenges} tone="challenge" /> : null}
                                                            {entry.attachments && entry.attachments.length > 0 ? (
                                                                <div className="space-y-3">
                                                                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                                                                        Photo & Video Updates
                                                                    </p>
                                                                    <div className="grid gap-3 sm:grid-cols-2">
                                                                        {entry.attachments.map((attachment) => (
                                                                            <JournalAttachmentCard
                                                                                key={attachment.id}
                                                                                attachment={attachment}
                                                                                onPreview={setPreviewAttachment}
                                                                            />
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            ) : null}
                                                            {entry.supervisor_notes ? <DetailBlock label="Supervisor Notes" value={entry.supervisor_notes} tone="supervisor" /> : null}
                                                        </div>
                                                    </AccordionContent>
                                                </AccordionItem>
                                                );
                                            })}
                                        </Accordion>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>

            <Dialog open={!!previewAttachment} onOpenChange={(open) => !open && setPreviewAttachment(null)}>
                <DialogContent className="max-w-5xl overflow-hidden bg-black p-2">
                    {previewAttachment && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between gap-3 px-3 pt-2 text-white">
                                <p className="truncate text-sm">{previewAttachment.name}</p>
                            </div>
                            {previewAttachment.type.startsWith('video/') ? (
                                <video src={previewAttachment.url} controls autoPlay className="max-h-[80vh] w-full rounded-lg" />
                            ) : (
                                <img src={previewAttachment.url} alt={previewAttachment.name} className="max-h-[80vh] w-full rounded-lg object-contain" />
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </MainLayout>
    );
}

const DETAIL_BLOCK_STYLES = {
    activity: 'border-orange-200 bg-orange-50/80',
    learning: 'border-emerald-200 bg-emerald-50/80',
    challenge: 'border-rose-200 bg-rose-50/80',
    supervisor: 'border-violet-200 bg-violet-50/80',
} as const;

function DetailBlock({
    label,
    value,
    tone = 'activity',
}: {
    label: string;
    value: string;
    tone?: keyof typeof DETAIL_BLOCK_STYLES;
}) {
    return (
        <div className={`rounded-xl border p-3 ${DETAIL_BLOCK_STYLES[tone]}`}>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
            <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">{value}</p>
        </div>
    );
}

function JournalAttachmentCard({
    attachment,
    onPreview,
}: {
    attachment: {
        id: string;
        file_name: string;
        file_path: string;
        file_type: string;
    };
    onPreview: (preview: { url: string; type: string; name: string } | null) => void;
}) {
    const attachmentUrl = supabase.storage.from('journal-media').getPublicUrl(attachment.file_path).data.publicUrl;
    const isVideo = attachment.file_type.startsWith('video/');

    return (
        <button
            type="button"
            onClick={() => onPreview({ url: attachmentUrl, type: attachment.file_type, name: attachment.file_name })}
            className="group overflow-hidden rounded-xl border border-violet-200 bg-violet-50/70 shadow-sm transition hover:-translate-y-0.5 hover:bg-violet-50 hover:shadow-md"
        >
            {isVideo ? (
                <div className="relative aspect-video overflow-hidden bg-black">
                    <video src={attachmentUrl} className="h-full w-full object-cover opacity-80" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <Film className="h-7 w-7 text-white" />
                    </div>
                </div>
            ) : (
                <div className="aspect-video overflow-hidden bg-cyan-50">
                    <img src={attachmentUrl} alt={attachment.file_name} className="h-full w-full object-cover" />
                </div>
            )}
            <div className="space-y-1 px-3 py-2">
                <p className="truncate text-xs font-semibold text-foreground">{attachment.file_name}</p>
                <p className="text-[11px] text-muted-foreground">
                    {isVideo ? 'Video attachment' : 'Image attachment'} • Tap to preview
                </p>
            </div>
        </button>
    );
}

function getDepartmentName(
    employee: Pick<EmployeeWithRelations, 'department' | 'manager_id' | 'job_title'>,
    employeesById: Map<string, EmployeeWithRelations>
) {
    if (employee.department?.name) return employee.department.name;

    const managerDepartment = employee.manager_id ? employeesById.get(employee.manager_id)?.department?.name : null;
    if (managerDepartment) return managerDepartment;

    const title = employee.job_title?.toLowerCase() || '';
    if (title.includes('account')) return 'Accounting Department';
    if (title.includes('human resource') || title.includes('hr')) return 'Human Resources Department';
    if (title.includes('it')) return 'IT Department';
    if (title.includes('safety')) return 'Safety Department';
    if (title.includes('health')) return 'Health and Safety Department';

    return 'Unassigned Department';
}
