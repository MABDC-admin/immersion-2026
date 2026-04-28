import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnnouncementsWidget } from './AnnouncementsWidget';
import { CreateLeaveModal } from '@/components/leave/CreateLeaveModal';
import { useLeaveBalances, useAnnouncements } from '@/hooks/useDashboard';
import { useAttendance } from '@/hooks/useAttendance';
import { useEnrollments } from '@/hooks/useTraining';
import { useCurrentEmployee } from '@/hooks/useEmployees';
import { useJournalEntries, usePendingJournalApprovals } from '@/hooks/useJournal';
import { useInternEvaluations } from '@/hooks/useEvaluations';
import { useInternTasks } from '@/hooks/useTasks';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Activity,
    ArrowRight,
    BookOpen,
    Calendar,
    CalendarPlus,
    CheckCircle2,
    ClipboardCheck,
    Clock,
    FileText,
    GraduationCap,
    ListChecks,
    MessageSquare,
    Sparkles,
    Target,
    UserPen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface EmployeeDashboardViewProps {
    employeeId: string;
    onUpdateProfile?: () => void;
}

const TARGET_OJT_HOURS = 80;

function calculateTotalHours(records: any[]): number {
    let totalMinutes = 0;
    for (const record of records) {
        if (record.clock_in && record.clock_out) {
            totalMinutes += (new Date(record.clock_out).getTime() - new Date(record.clock_in).getTime()) / 60000;
        }
    }
    return Math.round((totalMinutes / 60) * 10) / 10;
}

export function EmployeeDashboardView({ employeeId }: EmployeeDashboardViewProps) {
    const { user } = useAuth();
    const { data: employee } = useCurrentEmployee(user?.id || '');
    const navigate = useNavigate();
    const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);

    const { data: leaveBalances = [] } = useLeaveBalances(employeeId);
    const { data: enrollments = [] } = useEnrollments(employeeId);
    const { data: announcements = [] } = useAnnouncements();
    const { data: attendanceRecords = [] } = useAttendance(employeeId);
    const { data: journalEntries = [] } = useJournalEntries(employeeId);
    const { data: pendingApprovals = [] } = usePendingJournalApprovals(employee?.id || '');
    const { data: tasks = [] } = useInternTasks(employeeId);
    const { data: evaluations = [] } = useInternEvaluations(employeeId);

    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const todayRecord = attendanceRecords.find((record) => record.clock_in?.startsWith(todayStr));
    const todayEntry = journalEntries.find((entry) => entry.entry_date === todayStr);
    const isClockedIn = todayRecord && !todayRecord.clock_out;

    const totalOjtHours = useMemo(() => {
        const attendanceHours = calculateTotalHours(attendanceRecords);
        const journalHours = journalEntries.reduce((sum, entry) => sum + (Number(entry.hours_worked) || 0), 0);
        return Math.round((attendanceHours + journalHours) * 10) / 10;
    }, [attendanceRecords, journalEntries]);

    const ojtProgress = Math.min((totalOjtHours / TARGET_OJT_HOURS) * 100, 100);
    const activeTasks = tasks.filter((task) => task.status !== 'completed').length;
    const submittedTasks = tasks.filter((task) => task.status === 'submitted').length;
    const approvedJournals = journalEntries.filter((entry) => entry.status === 'approved').length;
    const visibleEvaluations = evaluations.filter((evaluation) => evaluation.status === 'submitted' || evaluation.status === 'finalized');
    const totalLeaveDays = leaveBalances.reduce((sum, balance) => sum + balance.remaining_days, 0);
    const activeTraining = enrollments.filter((enrollment) => enrollment.status !== 'completed').length;
    const latestJournal = journalEntries[0];

    const kpiWidgets = [
        {
            label: 'Immersion Hours',
            value: totalOjtHours,
            detail: `${Math.max(TARGET_OJT_HOURS - totalOjtHours, 0).toFixed(1)} hours remaining`,
            icon: Target,
            cardClass: 'border-orange-200/80 bg-gradient-to-br from-orange-50 via-white to-white',
            iconClass: 'bg-orange-100 text-orange-700',
        },
        {
            label: 'Tasks',
            value: activeTasks,
            detail: `${submittedTasks} submitted for review`,
            icon: ListChecks,
            cardClass: 'border-sky-200/80 bg-gradient-to-br from-sky-50 via-white to-white',
            iconClass: 'bg-sky-100 text-sky-700',
        },
        {
            label: 'Journals',
            value: journalEntries.length,
            detail: `${approvedJournals} approved entries`,
            icon: BookOpen,
            cardClass: 'border-amber-200/80 bg-gradient-to-br from-amber-50 via-white to-white',
            iconClass: 'bg-amber-100 text-amber-700',
        },
        {
            label: 'Evaluations',
            value: visibleEvaluations.length,
            detail: 'Supervisor feedback',
            icon: ClipboardCheck,
            cardClass: 'border-violet-200/80 bg-gradient-to-br from-violet-50 via-white to-white',
            iconClass: 'bg-violet-100 text-violet-700',
        },
    ];

    const quickNavItems = [
        {
            label: 'My Tasks',
            description: `${activeTasks} active tasks`,
            icon: ListChecks,
            href: '/my-tasks',
            cardClass: 'border-orange-200/80 bg-orange-50/80 hover:bg-orange-50',
            iconClass: 'bg-orange-100 text-orange-700',
        },
        {
            label: 'Daily Journal',
            description: todayEntry ? 'Today is logged' : 'Create today entry',
            icon: BookOpen,
            href: '/journal',
            cardClass: 'border-amber-200/80 bg-amber-50/80 hover:bg-amber-50',
            iconClass: 'bg-amber-100 text-amber-700',
        },
        {
            label: 'My Evaluations',
            description: `${visibleEvaluations.length} available`,
            icon: ClipboardCheck,
            href: '/my-evaluations',
            cardClass: 'border-violet-200/80 bg-violet-50/80 hover:bg-violet-50',
            iconClass: 'bg-violet-100 text-violet-700',
        },
        {
            label: 'Attendance',
            description: `${attendanceRecords.length} days recorded`,
            icon: Clock,
            href: '/attendance',
            cardClass: 'border-sky-200/80 bg-sky-50/80 hover:bg-sky-50',
            iconClass: 'bg-sky-100 text-sky-700',
        },
        {
            label: 'Documents',
            description: 'View your files',
            icon: FileText,
            href: '/my-documents',
            cardClass: 'border-rose-200/80 bg-rose-50/80 hover:bg-rose-50',
            iconClass: 'bg-rose-100 text-rose-700',
        },
        {
            label: 'My Profile',
            description: 'Review your details',
            icon: UserPen,
            href: employee ? `/employees/${employee.id}` : '#',
            cardClass: 'border-emerald-200/80 bg-emerald-50/80 hover:bg-emerald-50',
            iconClass: 'bg-emerald-100 text-emerald-700',
        },
    ];

    return (
        <div className="animate-fade-in space-y-8">
            {employee && (
                <Card className="overflow-hidden border-white/80 bg-gradient-to-br from-orange-500/15 via-sky-500/10 to-emerald-500/15 shadow-sm">
                    <CardContent className="p-0">
                        <div className="grid gap-0 xl:grid-cols-[1.45fr_0.85fr]">
                            <div className="flex flex-col gap-5 px-6 py-6 md:flex-row md:items-center md:px-8">
                                <Avatar className="h-20 w-20 shrink-0 ring-4 ring-white/70">
                                    <AvatarImage src={employee.avatar_url || ''} />
                                    <AvatarFallback className="bg-orange-100 text-xl font-black text-orange-700">
                                        {`${employee.first_name[0]}${employee.last_name[0]}`.toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Badge variant="outline" className="border-orange-200 bg-white/80 text-orange-700">Intern Portal</Badge>
                                        {employee.job_title && (
                                            <Badge variant="outline" className="border-sky-200 bg-white/80 text-sky-700">{employee.job_title}</Badge>
                                        )}
                                    </div>
                                    <h1 className="mt-4 truncate text-3xl font-bold text-foreground">Welcome, {employee.first_name}</h1>
                                    <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                                        Track your immersion hours, journal, tasks, attendance, and supervisor feedback from one place.
                                    </p>
                                    <div className="mt-5 flex flex-wrap gap-3">
                                        <Button className="gap-2 bg-orange-600 hover:bg-orange-700" onClick={() => navigate('/journal')}>
                                            <BookOpen className="h-4 w-4" />
                                            New Journal Entry
                                        </Button>
                                        <Button variant="outline" className="gap-2 border-emerald-200 bg-white/80 text-emerald-800 hover:bg-emerald-50" onClick={() => navigate('/my-tasks')}>
                                            <ListChecks className="h-4 w-4" />
                                            My Tasks
                                        </Button>
                                    </div>
                                </div>
                            </div>
                            <div className="border-t border-white/70 bg-white/55 px-6 py-6 xl:border-l xl:border-t-0">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                                        <Target className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Immersion Progress</p>
                                        <p className="text-3xl font-bold text-foreground">{ojtProgress.toFixed(0)}%</p>
                                    </div>
                                </div>
                                <div className="mt-5 h-3 overflow-hidden rounded-full bg-white">
                                    <div className="h-full rounded-full bg-gradient-to-r from-orange-500 via-sky-500 to-emerald-500" style={{ width: `${ojtProgress}%` }} />
                                </div>
                                <p className="mt-3 text-sm text-muted-foreground">{totalOjtHours} of {TARGET_OJT_HOURS} hours logged.</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

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

            {employee?.cv_data && (
                <Card className="border-violet-200/80 bg-gradient-to-br from-violet-50 via-white to-white shadow-sm">
                    <CardContent className="p-5">
                        <div className="mb-4 flex items-center gap-2">
                            <div className="rounded-2xl bg-violet-100 p-2.5 text-violet-700">
                                <Sparkles className="h-5 w-5" />
                            </div>
                            <h4 className="font-bold text-sm">Profile Summary</h4>
                        </div>
                        <div className="space-y-4">
                            {employee.cv_data.summary && <p className="text-sm leading-6 text-muted-foreground">{employee.cv_data.summary}</p>}
                            {employee.cv_data.skills && employee.cv_data.skills.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {employee.cv_data.skills.slice(0, 10).map((skill: string) => (
                                        <Badge key={skill} variant="outline" className="border-violet-200 bg-white text-violet-700">{skill}</Badge>
                                    ))}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {pendingApprovals.length > 0 && (
                <Card className="border-amber-200/80 bg-gradient-to-r from-amber-50 via-white to-orange-50 shadow-sm">
                    <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-3">
                            <div className="rounded-2xl bg-amber-100 p-3 text-amber-700">
                                <Clock className="h-5 w-5" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-amber-900">Pending Journal Approvals</h4>
                                <p className="text-xs text-muted-foreground">
                                    {pendingApprovals.length} journal {pendingApprovals.length === 1 ? 'entry is' : 'entries are'} awaiting review.
                                </p>
                            </div>
                        </div>
                        <Button size="sm" className="gap-2 bg-amber-600 hover:bg-amber-700" onClick={() => navigate(`/journal/${pendingApprovals[0].employee_id}`)}>
                            Review Now
                            <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                <Card className="border-white/80 bg-gradient-to-br from-white via-orange-50/60 to-sky-50/60 shadow-sm">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <CardTitle>Intern Widgets</CardTitle>
                                <p className="mt-1 text-sm text-muted-foreground">Fast actions for your daily portal work.</p>
                            </div>
                            <Badge variant="outline" className="border-orange-200 bg-orange-50 text-orange-700">Daily tools</Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            {quickNavItems.map((item) => (
                                <button
                                    key={item.label}
                                    type="button"
                                    className={cn('group rounded-xl border p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md', item.cardClass)}
                                    onClick={() => navigate(item.href)}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className={cn('rounded-xl p-2.5', item.iconClass)}>
                                            <item.icon className="h-5 w-5" />
                                        </div>
                                        <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                                    </div>
                                    <p className="mt-4 text-sm font-semibold text-foreground">{item.label}</p>
                                    <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.description}</p>
                                </button>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-sky-200/70 bg-gradient-to-br from-sky-50 via-white to-white shadow-sm">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between gap-4">
                            <CardTitle>Today</CardTitle>
                            <Calendar className="h-5 w-5 text-sky-700" />
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="rounded-xl border border-white bg-white/80 p-4 shadow-sm">
                            <div className="flex items-center justify-between gap-3">
                                <Badge variant="outline" className={todayEntry ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}>
                                    {todayEntry ? 'Journal Logged' : 'Journal Needed'}
                                </Badge>
                                {todayEntry ? <CheckCircle2 className="h-4 w-4 text-emerald-700" /> : <BookOpen className="h-4 w-4 text-amber-700" />}
                            </div>
                            <p className="mt-3 text-sm text-muted-foreground">
                                {todayEntry
                                    ? `${todayEntry.hours_worked || 0} hours recorded${todayEntry.attachments?.length ? ` with ${todayEntry.attachments.length} media files` : ''}.`
                                    : 'Create a new journal entry before the day ends.'}
                            </p>
                        </div>
                        <div className="rounded-xl border border-white bg-white/80 p-4 shadow-sm">
                            <div className="flex items-center justify-between gap-3">
                                <Badge variant="outline" className={isClockedIn ? 'border-sky-200 bg-sky-50 text-sky-700' : 'border-slate-200 bg-slate-50 text-slate-700'}>
                                    {isClockedIn ? 'Clocked In' : 'Attendance'}
                                </Badge>
                                <Activity className="h-4 w-4 text-sky-700" />
                            </div>
                            <p className="mt-3 text-sm text-muted-foreground">
                                {todayRecord?.clock_in
                                    ? `Clock in: ${format(new Date(todayRecord.clock_in), 'hh:mm a')}${todayRecord.clock_out ? `, out: ${format(new Date(todayRecord.clock_out), 'hh:mm a')}` : ''}`
                                    : 'No clock-in record found for today.'}
                            </p>
                        </div>
                        {latestJournal && (
                            <div className="rounded-xl border border-white bg-white/80 p-4 shadow-sm">
                                <p className="text-xs font-bold uppercase text-muted-foreground">Latest Journal</p>
                                <p className="mt-2 line-clamp-2 text-sm text-foreground">{latestJournal.activities}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Card className="border-amber-200/70 bg-gradient-to-br from-amber-50 via-white to-white shadow-sm">
                    <CardContent className="p-5">
                        <CalendarPlus className="h-5 w-5 text-amber-700" />
                        <p className="mt-3 text-xs font-semibold uppercase text-muted-foreground">Leave Days</p>
                        <p className="mt-2 text-2xl font-bold">{totalLeaveDays}</p>
                    </CardContent>
                </Card>
                <Card className="border-emerald-200/70 bg-gradient-to-br from-emerald-50 via-white to-white shadow-sm">
                    <CardContent className="p-5">
                        <GraduationCap className="h-5 w-5 text-emerald-700" />
                        <p className="mt-3 text-xs font-semibold uppercase text-muted-foreground">Active Training</p>
                        <p className="mt-2 text-2xl font-bold">{activeTraining}</p>
                    </CardContent>
                </Card>
                <Card className="border-rose-200/70 bg-gradient-to-br from-rose-50 via-white to-white shadow-sm">
                    <CardContent className="p-5">
                        <MessageSquare className="h-5 w-5 text-rose-700" />
                        <p className="mt-3 text-xs font-semibold uppercase text-muted-foreground">Communication</p>
                        <Button variant="outline" size="sm" className="mt-3 border-rose-200 bg-white text-rose-800 hover:bg-rose-50" onClick={() => navigate('/chat')}>
                            Open Chat
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <AnnouncementsWidget announcements={announcements} />

            <CreateLeaveModal
                open={isLeaveModalOpen}
                onOpenChange={setIsLeaveModalOpen}
                employeeId={employeeId}
            />
        </div>
    );
}
