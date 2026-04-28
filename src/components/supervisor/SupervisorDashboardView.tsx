import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
    Activity,
    ArrowRight,
    ArrowUpRight,
    BarChart3,
    BookOpen,
    CalendarClock,
    CheckCircle2,
    ClipboardCheck,
    Clock,
    FileText,
    ListChecks,
    MessageSquare,
    Sparkles,
    Target,
    Users,
} from 'lucide-react';
import { useAssignedInterns, useEvaluations, RUBRIC_SECTIONS } from '@/hooks/useEvaluations';
import { usePendingJournalApprovals } from '@/hooks/useJournal';
import { useSupervisorTasks } from '@/hooks/useTasks';
import { useEmployee } from '@/hooks/useEmployees';
import { ManageSupervisorInternsModal } from '@/components/admin/ManageSupervisorInternsModal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { getEmployeeDepartmentName } from '@/lib/departments';
import { InternsList } from './InternsList';

interface SupervisorDashboardViewProps {
    supervisorId: string;
}

const departmentColors = ['bg-orange-500', 'bg-sky-500', 'bg-emerald-500', 'bg-violet-500', 'bg-rose-500'];

export function SupervisorDashboardView({ supervisorId }: SupervisorDashboardViewProps) {
    const navigate = useNavigate();
    const [isManageOpen, setIsManageOpen] = useState(false);

    const { data: supervisorEmployee } = useEmployee(supervisorId);
    const { data: interns = [], isLoading: internsLoading } = useAssignedInterns(supervisorId);
    const { data: pendingApprovals = [], isLoading: approvalsLoading } = usePendingJournalApprovals(supervisorId);
    const { data: tasks = [], isLoading: tasksLoading } = useSupervisorTasks(supervisorId);
    const { data: evaluations = [], isLoading: evaluationsLoading } = useEvaluations(supervisorId);

    const supervisorName = `${supervisorEmployee?.first_name || 'Supervisor'} ${supervisorEmployee?.last_name || ''}`.trim();
    const activeInterns = interns.filter((intern: any) => intern.status === 'active').length;
    const submittedTasks = tasks.filter((task) => task.status === 'submitted');
    const openTasks = tasks.filter((task) => ['pending', 'in_progress', 'overdue'].includes(task.status));
    const overdueTasks = tasks.filter((task) => task.status === 'overdue');
    const completedTasks = tasks.filter((task) => task.status === 'completed');
    const evaluatedInternCount = useMemo(() => {
        const internIds = new Set(
            evaluations
                .filter((evaluation) => evaluation.status === 'submitted' || evaluation.status === 'finalized')
                .map((evaluation) => evaluation.intern_id)
        );

        return internIds.size;
    }, [evaluations]);
    const evaluationCoverage = interns.length > 0 ? Math.round((evaluatedInternCount / interns.length) * 100) : 0;
    const taskCompletionRate = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

    const departmentRows = useMemo(() => {
        const totals = new Map<string, number>();

        interns.forEach((intern: any) => {
            const departmentName = getEmployeeDepartmentName(intern);
            totals.set(departmentName, (totals.get(departmentName) || 0) + 1);
        });

        return Array.from(totals, ([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
    }, [interns]);

    const kpiWidgets = [
        {
            label: 'Assigned Interns',
            value: interns.length,
            detail: `${activeInterns} active interns`,
            icon: Users,
            cardClass: 'border-orange-200/80 bg-gradient-to-br from-orange-50 via-white to-white',
            iconClass: 'bg-orange-100 text-orange-700',
        },
        {
            label: 'Journal Reviews',
            value: pendingApprovals.length,
            detail: pendingApprovals.length === 1 ? 'Pending approval' : 'Pending approvals',
            icon: BookOpen,
            cardClass: 'border-amber-200/80 bg-gradient-to-br from-amber-50 via-white to-white',
            iconClass: 'bg-amber-100 text-amber-700',
        },
        {
            label: 'Submitted Tasks',
            value: submittedTasks.length,
            detail: `${openTasks.length} tasks still open`,
            icon: ListChecks,
            cardClass: 'border-sky-200/80 bg-gradient-to-br from-sky-50 via-white to-white',
            iconClass: 'bg-sky-100 text-sky-700',
        },
        {
            label: 'Evaluation Coverage',
            value: `${evaluationCoverage}%`,
            detail: `${evaluatedInternCount} of ${interns.length} completed`,
            icon: ClipboardCheck,
            cardClass: 'border-emerald-200/80 bg-gradient-to-br from-emerald-50 via-white to-white',
            iconClass: 'bg-emerald-100 text-emerald-700',
        },
    ];

    const actionWidgets = [
        {
            label: 'Evaluations',
            description: 'Score interns with the official work immersion rubric.',
            href: '/evaluations',
            icon: ClipboardCheck,
            cardClass: 'border-orange-200/80 bg-orange-50/80 hover:bg-orange-50',
            iconClass: 'bg-orange-100 text-orange-700',
        },
        {
            label: 'Attendance',
            description: 'Review daily attendance and intern time records.',
            href: '/supervisor/attendance',
            icon: CalendarClock,
            cardClass: 'border-sky-200/80 bg-sky-50/80 hover:bg-sky-50',
            iconClass: 'bg-sky-100 text-sky-700',
        },
        {
            label: 'Intern Journals',
            description: 'Approve, reject, or inspect journal submissions.',
            href: '/supervisor/journals',
            icon: BookOpen,
            cardClass: 'border-emerald-200/80 bg-emerald-50/80 hover:bg-emerald-50',
            iconClass: 'bg-emerald-100 text-emerald-700',
        },
        {
            label: 'Tasks',
            description: 'Assign work, monitor submissions, and give feedback.',
            href: '/supervisor/tasks',
            icon: ListChecks,
            cardClass: 'border-violet-200/80 bg-violet-50/80 hover:bg-violet-50',
            iconClass: 'bg-violet-100 text-violet-700',
        },
        {
            label: 'Chat',
            description: 'Message interns and continue follow-ups.',
            href: '/chat',
            icon: MessageSquare,
            cardClass: 'border-rose-200/80 bg-rose-50/80 hover:bg-rose-50',
            iconClass: 'bg-rose-100 text-rose-700',
        },
        {
            label: 'Manage Interns',
            description: 'Adjust the interns assigned to this supervisor.',
            href: 'manage',
            icon: Users,
            cardClass: 'border-slate-200 bg-slate-50/90 hover:bg-slate-50',
            iconClass: 'bg-slate-100 text-slate-700',
        },
    ];

    const taskStatusRows = [
        { label: 'Submitted', value: submittedTasks.length, color: 'bg-sky-500', badge: 'border-sky-200 bg-sky-50 text-sky-700' },
        { label: 'Open', value: openTasks.length, color: 'bg-violet-500', badge: 'border-violet-200 bg-violet-50 text-violet-700' },
        { label: 'Overdue', value: overdueTasks.length, color: 'bg-rose-500', badge: 'border-rose-200 bg-rose-50 text-rose-700' },
        { label: 'Completed', value: completedTasks.length, color: 'bg-emerald-500', badge: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
    ];

    const recentActivity = useMemo(() => {
        const journalItems = pendingApprovals.map((approval: any) => ({
            id: `journal-${approval.id}`,
            date: approval.created_at || approval.entry_date,
            title: `${approval.employee?.first_name || 'Intern'} ${approval.employee?.last_name || ''}`.trim(),
            subtitle: `Submitted journal for ${format(new Date(approval.entry_date), 'MMM d, yyyy')}`,
            href: `/journal/${approval.employee_id}`,
            icon: BookOpen,
            color: 'text-amber-700 bg-amber-100',
            badge: 'Journal',
        }));
        const taskItems = submittedTasks.map((task) => ({
            id: `task-${task.id}`,
            date: task.updated_at || task.created_at,
            title: task.title,
            subtitle: `${task.intern?.first_name || 'Intern'} ${task.intern?.last_name || ''}`.trim() || 'Task submitted',
            href: '/supervisor/tasks',
            icon: ListChecks,
            color: 'text-sky-700 bg-sky-100',
            badge: 'Task',
        }));

        return [...journalItems, ...taskItems]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 6);
    }, [pendingApprovals, submittedTasks]);

    if (internsLoading || approvalsLoading || tasksLoading || evaluationsLoading) {
        return (
            <div className="flex h-48 items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="animate-fade-in space-y-8">
            <Card className="overflow-hidden border-white/80 bg-gradient-to-br from-emerald-500/15 via-sky-500/10 to-orange-500/15 shadow-sm">
                <CardContent className="p-0">
                    <div className="grid gap-0 xl:grid-cols-[1.5fr_0.8fr]">
                        <div className="px-6 py-6 md:px-8">
                            <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="outline" className="border-emerald-200 bg-white/80 text-emerald-700">
                                    Supervisor Portal
                                </Badge>
                                <Badge variant="outline" className="border-sky-200 bg-white/80 text-sky-700">
                                    Assigned intern oversight
                                </Badge>
                            </div>
                            <h1 className="mt-5 text-3xl font-bold text-foreground">{supervisorName}</h1>
                            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                                Monitor intern work, journals, attendance, evaluations, and task submissions from one focused dashboard.
                            </p>
                            <div className="mt-5 flex flex-wrap gap-3">
                                <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700" onClick={() => navigate('/supervisor/tasks')}>
                                    <ListChecks className="h-4 w-4" />
                                    Review Tasks
                                </Button>
                                <Button variant="outline" className="gap-2 border-orange-200 bg-white/80 text-orange-800 hover:bg-orange-50" onClick={() => navigate('/evaluations')}>
                                    <ClipboardCheck className="h-4 w-4" />
                                    Open Evaluations
                                </Button>
                            </div>
                        </div>
                        <div className="border-t border-white/70 bg-white/55 px-6 py-6 xl:border-l xl:border-t-0">
                            <div className="flex items-center gap-3">
                                <div className="rounded-2xl bg-sky-100 p-3 text-sky-700">
                                    <Activity className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Task Completion</p>
                                    <p className="text-3xl font-bold text-foreground">{taskCompletionRate}%</p>
                                </div>
                            </div>
                            <div className="mt-5 h-3 overflow-hidden rounded-full bg-white">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-sky-500 to-violet-500"
                                    style={{ width: `${taskCompletionRate}%` }}
                                />
                            </div>
                            <p className="mt-3 text-sm text-muted-foreground">
                                {completedTasks.length} completed of {tasks.length} assigned tasks.
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

            {pendingApprovals.length > 0 && (
                <Card className="overflow-hidden border-amber-200/80 bg-gradient-to-r from-amber-50 via-white to-orange-50 shadow-sm">
                    <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-3">
                            <div className="rounded-2xl bg-amber-100 p-3 text-amber-700">
                                <BookOpen className="h-5 w-5" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-amber-900">Action Required</h4>
                                <p className="text-xs text-muted-foreground">
                                    {pendingApprovals.length} journal {pendingApprovals.length === 1 ? 'submission needs' : 'submissions need'} review.
                                </p>
                            </div>
                        </div>
                        <Button
                            size="sm"
                            className="gap-2 bg-amber-600 hover:bg-amber-700"
                            onClick={() => navigate('/supervisor/journals')}
                        >
                            Review Journals
                            <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                <Card className="border-white/80 bg-gradient-to-br from-white via-emerald-50/60 to-sky-50/60 shadow-sm">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <CardTitle>Supervisor Widgets</CardTitle>
                                <p className="mt-1 text-sm text-muted-foreground">Daily tools for intern oversight.</p>
                            </div>
                            <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                                {interns.length} interns
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            {actionWidgets.map((item) => (
                                <button
                                    key={item.label}
                                    type="button"
                                    className={cn(
                                        'group rounded-xl border p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md',
                                        item.cardClass
                                    )}
                                    onClick={() => item.href === 'manage' ? setIsManageOpen(true) : navigate(item.href)}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className={cn('rounded-xl p-2.5', item.iconClass)}>
                                            <item.icon className="h-5 w-5" />
                                        </div>
                                        <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                                    </div>
                                    <p className="mt-4 text-sm font-semibold text-foreground">{item.label}</p>
                                    <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.description}</p>
                                </button>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-violet-200/70 bg-gradient-to-br from-violet-50 via-white to-white shadow-sm">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between gap-4">
                            <CardTitle>Task Snapshot</CardTitle>
                            <BarChart3 className="h-5 w-5 text-violet-600" />
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {taskStatusRows.map((status) => {
                            const percent = tasks.length > 0 ? (status.value / tasks.length) * 100 : 0;

                            return (
                                <div key={status.label} className="rounded-xl border border-white bg-white/80 p-4 shadow-sm">
                                    <div className="flex items-center justify-between gap-3">
                                        <Badge variant="outline" className={status.badge}>
                                            {status.label}
                                        </Badge>
                                        <span className="text-sm font-semibold text-foreground">{status.value}</span>
                                    </div>
                                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                                        <div className={cn('h-full rounded-full', status.color)} style={{ width: `${percent}%` }} />
                                    </div>
                                </div>
                            );
                        })}
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.9fr_1.1fr]">
                <Card className="border-orange-200/70 bg-gradient-to-br from-orange-50 via-white to-white shadow-sm">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between gap-4">
                            <CardTitle>Rubric Focus</CardTitle>
                            <Target className="h-5 w-5 text-orange-700" />
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {RUBRIC_SECTIONS.map((section, index) => (
                            <div key={section.id} className="rounded-xl border border-white bg-white/80 p-3 shadow-sm">
                                <div className="flex items-center justify-between gap-3">
                                    <p className="truncate text-sm font-semibold text-foreground">{section.title}</p>
                                    <span className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-700">
                                        {section.maxScore}
                                    </span>
                                </div>
                                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                                    <div className={cn('h-full rounded-full', departmentColors[index] || 'bg-slate-500')} style={{ width: '100%' }} />
                                </div>
                            </div>
                        ))}
                        <Button variant="outline" className="w-full justify-between border-orange-200 bg-white/80" onClick={() => window.open('/rubrics/work-immersion-internship-rubrics.pdf', '_blank', 'noopener,noreferrer')}>
                            View Rubric PDF
                            <FileText className="h-4 w-4 text-orange-700" />
                        </Button>
                    </CardContent>
                </Card>

                <Card className="border-sky-200/70 bg-gradient-to-br from-sky-50 via-white to-emerald-50/50 shadow-sm">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between gap-4">
                            <CardTitle>Recent Activity</CardTitle>
                            <Badge variant="outline" className="border-sky-200 bg-sky-50 text-sky-700">
                                {recentActivity.length} items
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {recentActivity.length === 0 ? (
                            <div className="rounded-xl border border-dashed bg-white/70 px-4 py-8 text-center">
                                <CheckCircle2 className="mx-auto h-6 w-6 text-emerald-600" />
                                <p className="mt-2 text-sm font-semibold text-foreground">Nothing needs review right now.</p>
                                <p className="mt-1 text-xs text-muted-foreground">New journal and task submissions will appear here.</p>
                            </div>
                        ) : (
                            recentActivity.map((activity) => (
                                <button
                                    key={activity.id}
                                    type="button"
                                    className="flex w-full items-center gap-3 rounded-xl border border-white bg-white/85 px-4 py-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                                    onClick={() => navigate(activity.href)}
                                >
                                    <div className={cn('rounded-xl p-2.5', activity.color)}>
                                        <activity.icon className="h-4 w-4" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <p className="truncate text-sm font-semibold text-foreground">{activity.title}</p>
                                            <Badge variant="outline" className="shrink-0 border-sky-200 bg-sky-50 text-[10px] text-sky-700">
                                                {activity.badge}
                                            </Badge>
                                        </div>
                                        <p className="truncate text-xs text-muted-foreground">{activity.subtitle}</p>
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                </button>
                            ))
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_0.65fr]">
                <div className="space-y-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <h3 className="flex items-center gap-2 text-lg font-bold">
                            <Users className="h-5 w-5 text-emerald-700" />
                            Assigned Interns
                        </h3>
                        <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline" className="h-8 text-xs font-bold" onClick={() => setIsManageOpen(true)}>
                                Manage Interns
                            </Button>
                            <Badge variant="outline" className="text-[10px] font-bold uppercase">{interns.length} total</Badge>
                        </div>
                    </div>
                    <InternsList
                        supervisorId={supervisorId}
                        onEvaluate={(id) => navigate(`/evaluations?intern=${id}`)}
                        onManageInterns={() => setIsManageOpen(true)}
                    />
                </div>

                <Card className="h-fit border-emerald-200/70 bg-gradient-to-br from-emerald-50 via-white to-white shadow-sm">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between gap-4">
                            <CardTitle>Intern Mix</CardTitle>
                            <Sparkles className="h-5 w-5 text-emerald-700" />
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {departmentRows.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No department data available yet.</p>
                        ) : (
                            departmentRows.map((department, index) => {
                                const percent = interns.length > 0 ? (department.count / interns.length) * 100 : 0;

                                return (
                                    <div key={department.name} className="rounded-xl border border-white bg-white/80 p-4 shadow-sm">
                                        <div className="flex items-center justify-between gap-3">
                                            <p className="truncate text-sm font-semibold text-foreground">{department.name}</p>
                                            <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                                                {department.count}
                                            </span>
                                        </div>
                                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                                            <div className={cn('h-full rounded-full', departmentColors[index] || 'bg-slate-500')} style={{ width: `${percent}%` }} />
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </CardContent>
                </Card>
            </div>

            {isManageOpen && supervisorEmployee && (
                <ManageSupervisorInternsModal
                    open={isManageOpen}
                    onOpenChange={setIsManageOpen}
                    supervisor={{
                        employeeId: supervisorId,
                        firstName: supervisorEmployee.first_name,
                        lastName: supervisorEmployee.last_name,
                    }}
                />
            )}
        </div>
    );
}
