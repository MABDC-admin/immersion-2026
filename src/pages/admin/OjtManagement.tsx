import { useMemo, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
    Activity,
    AlertTriangle,
    CheckCircle2,
    Clock,
    History,
    Search,
    Settings2,
    Target,
    TimerReset,
    Users,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCurrentEmployee } from '@/hooks/useEmployees';
import { useAllInternsOjt, useOjtOverrides, useCreateOjtOverride } from '@/hooks/useOjtOverrides';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const REQUIRED_HOURS = 80;

const statusStyles: Record<string, { badge: string; chip: string; label: string }> = {
    in_progress: {
        label: 'In Progress',
        badge: 'border-sky-200 bg-sky-50 text-sky-700',
        chip: 'bg-sky-500',
    },
    completed: {
        label: 'Completed',
        badge: 'border-emerald-200 bg-emerald-50 text-emerald-700',
        chip: 'bg-emerald-500',
    },
    extended: {
        label: 'Extended',
        badge: 'border-amber-200 bg-amber-50 text-amber-700',
        chip: 'bg-amber-500',
    },
    withdrawn: {
        label: 'Withdrawn',
        badge: 'border-rose-200 bg-rose-50 text-rose-700',
        chip: 'bg-rose-500',
    },
};

export default function OjtManagement() {
    const { user } = useAuth();
    const { data: admin } = useCurrentEmployee(user?.id || '');
    const { data: interns = [], isLoading } = useAllInternsOjt();
    const createOverride = useCreateOjtOverride();
    const { toast } = useToast();

    const [selectedInternId, setSelectedInternId] = useState<string | null>(null);
    const [isOverrideOpen, setIsOverrideOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const [overrideType, setOverrideType] = useState('hours_adjustment');
    const [hoursValue, setHoursValue] = useState('');
    const [progressPct, setProgressPct] = useState('');
    const [completionStatus, setCompletionStatus] = useState('in_progress');
    const [notes, setNotes] = useState('');

    const { data: selectedOverrides = [] } = useOjtOverrides(selectedInternId || '');
    const selectedIntern = interns.find((intern) => intern.id === selectedInternId);

    const totalInterns = interns.length;
    const completedCount = interns.filter((intern) => intern.completionStatus === 'completed').length;
    const extendedCount = interns.filter((intern) => intern.completionStatus === 'extended').length;
    const withdrawnCount = interns.filter((intern) => intern.completionStatus === 'withdrawn').length;
    const overrideTotal = interns.reduce((sum, intern) => sum + (intern.overrideCount || 0), 0);
    const avgProgress = totalInterns > 0
        ? Math.round(interns.reduce((sum, intern) => sum + intern.effectiveProgress, 0) / totalInterns)
        : 0;
    const totalAdjustedHours = interns.reduce((sum, intern) => sum + Number(intern.adjustedHours || 0), 0);
    const neededAttention = interns.filter(
        (intern) => intern.completionStatus === 'extended' || intern.effectiveProgress < 50 || intern.overrideCount > 0
    );

    const filteredInterns = useMemo(() => {
        const query = searchTerm.trim().toLowerCase();

        return interns.filter((intern) => {
            const matchesStatus = statusFilter === 'all' || intern.completionStatus === statusFilter;
            const matchesSearch =
                !query ||
                `${intern.first_name} ${intern.last_name}`.toLowerCase().includes(query) ||
                (intern.email || '').toLowerCase().includes(query) ||
                (intern.job_title || '').toLowerCase().includes(query);

            return matchesStatus && matchesSearch;
        });
    }, [interns, searchTerm, statusFilter]);

    const statusRows = [
        { label: 'Completed', value: completedCount, key: 'completed' },
        { label: 'In Progress', value: interns.filter((intern) => intern.completionStatus === 'in_progress').length, key: 'in_progress' },
        { label: 'Extended', value: extendedCount, key: 'extended' },
        { label: 'Withdrawn', value: withdrawnCount, key: 'withdrawn' },
    ];

    const kpiWidgets = [
        {
            label: 'Total Interns',
            value: totalInterns,
            detail: `${filteredInterns.length} visible now`,
            icon: Users,
            cardClass: 'border-orange-200/80 bg-gradient-to-br from-orange-50 via-white to-white',
            iconClass: 'bg-orange-100 text-orange-700',
        },
        {
            label: 'Average Progress',
            value: `${avgProgress}%`,
            detail: `${Math.round(totalAdjustedHours)} adjusted hours logged`,
            icon: Activity,
            cardClass: 'border-sky-200/80 bg-gradient-to-br from-sky-50 via-white to-white',
            iconClass: 'bg-sky-100 text-sky-700',
        },
        {
            label: 'Completed',
            value: completedCount,
            detail: `${totalInterns - completedCount} still active`,
            icon: CheckCircle2,
            cardClass: 'border-emerald-200/80 bg-gradient-to-br from-emerald-50 via-white to-white',
            iconClass: 'bg-emerald-100 text-emerald-700',
        },
        {
            label: 'Overrides',
            value: overrideTotal,
            detail: 'Manual adjustments applied',
            icon: History,
            cardClass: 'border-violet-200/80 bg-gradient-to-br from-violet-50 via-white to-white',
            iconClass: 'bg-violet-100 text-violet-700',
        },
    ];

    const resetForm = () => {
        setOverrideType('hours_adjustment');
        setHoursValue('');
        setProgressPct('');
        setCompletionStatus('in_progress');
        setNotes('');
    };

    const openOverride = (internId: string) => {
        setSelectedInternId(internId);
        resetForm();
        setIsOverrideOpen(true);
    };

    const handleSubmitOverride = async () => {
        if (!admin || !selectedInternId) return;

        try {
            await createOverride.mutateAsync({
                intern_id: selectedInternId,
                admin_id: admin.id,
                override_type: overrideType,
                hours_value: overrideType === 'hours_adjustment' ? parseFloat(hoursValue) || 0 : undefined,
                progress_pct: overrideType === 'progress_override' ? parseFloat(progressPct) || undefined : undefined,
                completion_status: overrideType === 'status_change' ? completionStatus : undefined,
                notes: notes.trim() || undefined,
            });
            toast({ title: 'Override applied successfully' });
            setIsOverrideOpen(false);
            resetForm();
        } catch (err: any) {
            toast({ title: 'Error', description: err.message, variant: 'destructive' });
        }
    };

    const getStatus = (status: string) => statusStyles[status] || statusStyles.in_progress;

    return (
        <MainLayout>
            <div className="animate-fade-in space-y-8">
                <Card className="overflow-hidden border-white/80 bg-gradient-to-br from-orange-500/15 via-sky-500/10 to-emerald-500/15 shadow-sm">
                    <CardContent className="p-0">
                        <div className="grid gap-0 xl:grid-cols-[1.5fr_0.8fr]">
                            <div className="px-6 py-6 md:px-8">
                                <div className="flex flex-wrap items-center gap-2">
                                    <Badge variant="outline" className="border-orange-200 bg-white/80 text-orange-700">
                                        Work Immersion Tracking
                                    </Badge>
                                    <Badge variant="outline" className="border-sky-200 bg-white/80 text-sky-700">
                                        {REQUIRED_HOURS} required hours
                                    </Badge>
                                </div>
                                <h1 className="mt-5 text-3xl font-bold text-foreground">Immersion Progress Board</h1>
                                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                                    Monitor intern hours, completion status, progress overrides, and records that need admin review.
                                </p>
                                <div className="mt-5 flex flex-wrap gap-3">
                                    <Button className="gap-2 bg-orange-600 hover:bg-orange-700" onClick={() => setStatusFilter('all')}>
                                        <Users className="h-4 w-4" />
                                        All Interns
                                    </Button>
                                    <Button variant="outline" className="gap-2 border-emerald-200 bg-white/80 text-emerald-800 hover:bg-emerald-50" onClick={() => setStatusFilter('completed')}>
                                        <CheckCircle2 className="h-4 w-4" />
                                        Completed
                                    </Button>
                                </div>
                            </div>
                            <div className="border-t border-white/70 bg-white/55 px-6 py-6 xl:border-l xl:border-t-0">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-2xl bg-sky-100 p-3 text-sky-700">
                                        <Target className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Overall Progress</p>
                                        <p className="text-3xl font-bold text-foreground">{avgProgress}%</p>
                                    </div>
                                </div>
                                <div className="mt-5 h-3 overflow-hidden rounded-full bg-white">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-orange-500 via-sky-500 to-emerald-500"
                                        style={{ width: `${avgProgress}%` }}
                                    />
                                </div>
                                <p className="mt-3 text-sm text-muted-foreground">
                                    {completedCount} completed of {totalInterns} active intern records.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {kpiWidgets.map((widget) => (
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

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.85fr_1.15fr]">
                    <Card className="border-violet-200/70 bg-gradient-to-br from-violet-50 via-white to-white shadow-sm">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between gap-4">
                                <CardTitle>Status Snapshot</CardTitle>
                                <TimerReset className="h-5 w-5 text-violet-600" />
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {statusRows.map((row) => {
                                const style = getStatus(row.key);
                                const percent = totalInterns > 0 ? (row.value / totalInterns) * 100 : 0;

                                return (
                                    <button
                                        key={row.key}
                                        type="button"
                                        className="w-full rounded-xl border border-white bg-white/80 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                                        onClick={() => setStatusFilter(row.key)}
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <Badge variant="outline" className={style.badge}>{row.label}</Badge>
                                            <span className="text-sm font-semibold text-foreground">{row.value}</span>
                                        </div>
                                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                                            <div className={cn('h-full rounded-full', style.chip)} style={{ width: `${percent}%` }} />
                                        </div>
                                    </button>
                                );
                            })}
                        </CardContent>
                    </Card>

                    <Card className="border-amber-200/70 bg-gradient-to-br from-amber-50 via-white to-orange-50/50 shadow-sm">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <CardTitle>Needs Attention</CardTitle>
                                    <p className="mt-1 text-sm text-muted-foreground">Extended, low-progress, or manually adjusted records.</p>
                                </div>
                                <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                                    {neededAttention.length}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            {neededAttention.slice(0, 4).map((intern) => {
                                const style = getStatus(intern.completionStatus);

                                return (
                                    <button
                                        key={intern.id}
                                        type="button"
                                        className="rounded-xl border border-white bg-white/85 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                                        onClick={() => openOverride(intern.id)}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="rounded-xl bg-amber-100 p-2.5 text-amber-700">
                                                <AlertTriangle className="h-4 w-4" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-semibold text-foreground">
                                                    {intern.first_name} {intern.last_name}
                                                </p>
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    {intern.effectiveProgress}% progress - {intern.overrideCount} override{intern.overrideCount === 1 ? '' : 's'}
                                                </p>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className={cn('mt-4', style.badge)}>{style.label}</Badge>
                                    </button>
                                );
                            })}
                            {neededAttention.length === 0 && (
                                <div className="col-span-full rounded-xl border border-dashed bg-white/70 px-4 py-8 text-center">
                                    <CheckCircle2 className="mx-auto h-6 w-6 text-emerald-600" />
                                    <p className="mt-2 text-sm font-semibold text-foreground">All records look steady.</p>
                                    <p className="mt-1 text-xs text-muted-foreground">Low-progress and adjusted records will appear here.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <Card className="border-white/80 bg-gradient-to-br from-white via-sky-50/60 to-orange-50/50 shadow-sm">
                    <CardHeader className="pb-3">
                        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                            <div>
                                <CardTitle>Intern Progress Records</CardTitle>
                                <p className="mt-1 text-sm text-muted-foreground">Search, filter, inspect progress, and apply official overrides.</p>
                            </div>
                            <div className="flex flex-col gap-2 sm:flex-row">
                                <div className="relative">
                                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        value={searchTerm}
                                        onChange={(event) => setSearchTerm(event.target.value)}
                                        placeholder="Search interns"
                                        className="h-10 w-full bg-white pl-9 sm:w-64"
                                    />
                                </div>
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="h-10 bg-white sm:w-44">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="in_progress">In Progress</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                        <SelectItem value="extended">Extended</SelectItem>
                                        <SelectItem value="withdrawn">Withdrawn</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex h-40 items-center justify-center">
                                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                            </div>
                        ) : filteredInterns.length === 0 ? (
                            <div className="rounded-xl border border-dashed bg-white/70 px-4 py-12 text-center">
                                <Users className="mx-auto h-8 w-8 text-muted-foreground" />
                                <p className="mt-3 text-sm font-semibold text-foreground">No interns match this view.</p>
                                <p className="mt-1 text-xs text-muted-foreground">Adjust the search or status filter.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                                {filteredInterns.map((intern) => {
                                    const style = getStatus(intern.completionStatus);
                                    const remainingHours = Math.max(REQUIRED_HOURS - Number(intern.adjustedHours || 0), 0);

                                    return (
                                        <Card key={intern.id} className="border-white bg-white/90 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                                            <CardContent className="p-4">
                                                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                                    <div className="flex min-w-0 items-center gap-3">
                                                        <Avatar className="h-12 w-12 shrink-0 ring-2 ring-orange-100">
                                                            <AvatarImage src={intern.avatar_url || ''} />
                                                            <AvatarFallback className="bg-orange-100 text-xs font-bold text-orange-700">
                                                                {`${intern.first_name[0]}${intern.last_name[0]}`}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="min-w-0">
                                                            <p className="truncate text-sm font-bold text-foreground">
                                                                {intern.first_name} {intern.last_name}
                                                            </p>
                                                            <p className="truncate text-xs text-muted-foreground">{intern.job_title || 'Intern'}</p>
                                                            <p className="truncate text-xs text-muted-foreground">{intern.email}</p>
                                                        </div>
                                                    </div>
                                                    <Badge variant="outline" className={cn('w-fit shrink-0', style.badge)}>
                                                        {style.label}
                                                    </Badge>
                                                </div>

                                                <div className="mt-5 space-y-2">
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="font-medium text-muted-foreground">
                                                            {Number(intern.adjustedHours || 0).toFixed(1)}h / {REQUIRED_HOURS}h
                                                        </span>
                                                        <span className="font-bold text-foreground">{intern.effectiveProgress}%</span>
                                                    </div>
                                                    <Progress value={intern.effectiveProgress} className="h-2.5" />
                                                </div>

                                                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                                                    <div className="rounded-xl border border-orange-100 bg-orange-50/70 px-2 py-3">
                                                        <p className="text-[10px] font-bold uppercase text-orange-700">Base</p>
                                                        <p className="mt-1 text-sm font-bold text-foreground">{Number(intern.baseHours || 0).toFixed(1)}h</p>
                                                    </div>
                                                    <div className="rounded-xl border border-sky-100 bg-sky-50/70 px-2 py-3">
                                                        <p className="text-[10px] font-bold uppercase text-sky-700">Left</p>
                                                        <p className="mt-1 text-sm font-bold text-foreground">{remainingHours.toFixed(1)}h</p>
                                                    </div>
                                                    <div className="rounded-xl border border-violet-100 bg-violet-50/70 px-2 py-3">
                                                        <p className="text-[10px] font-bold uppercase text-violet-700">Overrides</p>
                                                        <p className="mt-1 text-sm font-bold text-foreground">{intern.overrideCount}</p>
                                                    </div>
                                                </div>

                                                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                        <Clock className="h-3.5 w-3.5 text-sky-700" />
                                                        {intern.daysPresent || 0} attendance day{intern.daysPresent === 1 ? '' : 's'}
                                                    </div>
                                                    <Button variant="outline" size="sm" className="gap-1.5 border-orange-200 bg-white text-xs text-orange-800 hover:bg-orange-50" onClick={() => openOverride(intern.id)}>
                                                        <Settings2 className="h-3.5 w-3.5" />
                                                        Override
                                                    </Button>
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

            <Dialog open={isOverrideOpen} onOpenChange={setIsOverrideOpen}>
                <DialogContent className="max-h-[92vh] w-[95vw] overflow-y-auto sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Work Immersion Override</DialogTitle>
                        <DialogDescription>
                            {selectedIntern && `Adjust official progress for ${selectedIntern.first_name} ${selectedIntern.last_name}.`}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedIntern && (
                        <div className="rounded-2xl border border-orange-100 bg-gradient-to-br from-orange-50 via-white to-sky-50 p-4">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                                <Avatar className="h-12 w-12 ring-2 ring-orange-100">
                                    <AvatarImage src={selectedIntern.avatar_url || ''} />
                                    <AvatarFallback className="bg-orange-100 text-orange-700">
                                        {`${selectedIntern.first_name[0]}${selectedIntern.last_name[0]}`}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-bold text-foreground">
                                        {selectedIntern.first_name} {selectedIntern.last_name}
                                    </p>
                                    <p className="truncate text-xs text-muted-foreground">{selectedIntern.email}</p>
                                </div>
                                <Badge variant="outline" className={getStatus(selectedIntern.completionStatus).badge}>
                                    {getStatus(selectedIntern.completionStatus).label}
                                </Badge>
                            </div>
                            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                                <div className="rounded-xl bg-white/80 p-3">
                                    <p className="text-[10px] font-bold uppercase text-muted-foreground">Base Hours</p>
                                    <p className="mt-1 font-bold">{selectedIntern.baseHours}h</p>
                                </div>
                                <div className="rounded-xl bg-white/80 p-3">
                                    <p className="text-[10px] font-bold uppercase text-muted-foreground">Adjusted</p>
                                    <p className="mt-1 font-bold">{selectedIntern.adjustedHours}h</p>
                                </div>
                                <div className="rounded-xl bg-white/80 p-3">
                                    <p className="text-[10px] font-bold uppercase text-muted-foreground">Progress</p>
                                    <p className="mt-1 font-bold">{selectedIntern.effectiveProgress}%</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="grid gap-4 py-2 md:grid-cols-2">
                        <div className="space-y-2 md:col-span-2">
                            <Label>Override Type</Label>
                            <Select value={overrideType} onValueChange={setOverrideType}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="hours_adjustment">Hours Adjustment</SelectItem>
                                    <SelectItem value="progress_override">Progress Override</SelectItem>
                                    <SelectItem value="status_change">Status Change</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {overrideType === 'hours_adjustment' && (
                            <div className="space-y-2 md:col-span-2">
                                <Label>Hours to Add or Subtract</Label>
                                <Input type="number" step="0.5" placeholder="Example: +5 or -2" value={hoursValue} onChange={(event) => setHoursValue(event.target.value)} />
                                <p className="text-xs text-muted-foreground">Use a negative value to subtract hours.</p>
                            </div>
                        )}

                        {overrideType === 'progress_override' && (
                            <div className="space-y-2 md:col-span-2">
                                <Label>Set Progress Percentage</Label>
                                <Input type="number" min="0" max="100" step="1" placeholder="Example: 75" value={progressPct} onChange={(event) => setProgressPct(event.target.value)} />
                            </div>
                        )}

                        {overrideType === 'status_change' && (
                            <div className="space-y-2 md:col-span-2">
                                <Label>Completion Status</Label>
                                <Select value={completionStatus} onValueChange={setCompletionStatus}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="in_progress">In Progress</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                        <SelectItem value="extended">Extended</SelectItem>
                                        <SelectItem value="withdrawn">Withdrawn</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="space-y-2 md:col-span-2">
                            <Label>Admin Notes</Label>
                            <Textarea rows={3} placeholder="Reason for this override..." value={notes} onChange={(event) => setNotes(event.target.value)} />
                        </div>
                    </div>

                    {selectedOverrides.length > 0 && (
                        <div className="border-t pt-4">
                            <div className="mb-3 flex items-center justify-between gap-3">
                                <p className="text-sm font-bold">Override History</p>
                                <Badge variant="outline" className="border-violet-200 bg-violet-50 text-violet-700">
                                    {selectedOverrides.length}
                                </Badge>
                            </div>
                            <div className="max-h-40 space-y-2 overflow-y-auto">
                                {selectedOverrides.slice(0, 6).map((override) => (
                                    <div key={override.id} className="rounded-xl border bg-muted/25 p-3 text-xs">
                                        <div className="flex items-center justify-between gap-3">
                                            <Badge variant="outline" className="text-[10px]">{override.override_type.replace('_', ' ')}</Badge>
                                            <span className="text-muted-foreground">{format(new Date(override.created_at), 'MMM d, h:mm a')}</span>
                                        </div>
                                        {override.notes && <p className="mt-2 text-muted-foreground">{override.notes}</p>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <DialogFooter className="flex-col gap-2 sm:flex-row">
                        <Button variant="outline" onClick={() => setIsOverrideOpen(false)}>Cancel</Button>
                        <Button onClick={handleSubmitOverride} disabled={createOverride.isPending}>
                            {createOverride.isPending ? 'Applying...' : 'Apply Override'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </MainLayout>
    );
}
