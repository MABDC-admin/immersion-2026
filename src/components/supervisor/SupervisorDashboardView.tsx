
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAssignedInterns } from '@/hooks/useEvaluations';
import { usePendingJournalApprovals } from '@/hooks/useJournal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Users, Clock, BookOpen, ClipboardCheck,
    ArrowRight, Target, ListChecks, MessageSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { InternsList } from './InternsList';

interface SupervisorDashboardViewProps {
    supervisorId: string;
}

export function SupervisorDashboardView({ supervisorId }: SupervisorDashboardViewProps) {
    const navigate = useNavigate();

    // Data
    const { data: interns = [], isLoading: internsLoading } = useAssignedInterns(supervisorId);
    const { data: pendingApprovals = [], isLoading: approvalsLoading } = usePendingJournalApprovals(supervisorId);

    const stats = useMemo(() => {
        return [
            {
                title: 'Assigned Interns',
                value: interns.length,
                icon: Users,
                color: 'text-primary',
                bgColor: 'bg-primary/10'
            },
            {
                title: 'Pending Approvals',
                value: pendingApprovals.length,
                icon: Clock,
                color: 'text-hrms-warning',
                bgColor: 'bg-hrms-warning/10'
            },
        ];
    }, [interns, pendingApprovals]);

    const quickNav = [
        { label: 'Attendance', icon: Clock, href: '/supervisor/attendance', color: 'text-blue-600', bg: 'bg-blue-100' },
        { label: 'Daily Journal for Interns', icon: BookOpen, href: '/supervisor/journals', color: 'text-green-600', bg: 'bg-green-100' },
        { label: 'Tasks', icon: ListChecks, href: '/supervisor/tasks', color: 'text-purple-600', bg: 'bg-purple-100' },
        { label: 'Chat', icon: MessageSquare, href: '/chat', color: 'text-indigo-600', bg: 'bg-indigo-100' },
    ];

    if (internsLoading || approvalsLoading) {
        return (
            <div className="flex items-center justify-center h-48">
                <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Quick Navigation */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {quickNav.map((item) => (
                    <Button
                        key={item.label}
                        variant="ghost"
                        className="h-auto flex-col gap-2 py-4 hover:scale-105 transition-transform rounded-xl border border-transparent hover:border-muted px-2"
                        onClick={() => navigate(item.href)}
                    >
                        <div className={cn("p-2.5 rounded-xl", item.bg)}>
                            <item.icon className={cn("h-5 w-5", item.color)} />
                        </div>
                        <span className="text-[10px] font-semibold text-muted-foreground">{item.label}</span>
                    </Button>
                ))}
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {stats.map((stat) => (
                    <Card key={stat.title} className="border-l-4 border-l-primary shadow-sm">
                        <CardContent className="p-5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={cn("p-2 rounded-lg", stat.bgColor)}>
                                    <stat.icon className={cn("h-5 w-5", stat.color)} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold">{stat.title}</h4>
                                    <p className="text-2xl font-bold">{stat.value}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Pending Approvals Alert */}
            {pendingApprovals.length > 0 && (
                <Card className="border-l-4 border-l-hrms-warning bg-hrms-warning/5 shadow-sm overflow-hidden">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-hrms-warning/20">
                                <BookOpen className="h-5 w-5 text-hrms-warning" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-hrms-warning">Action Required</h4>
                                <p className="text-xs text-muted-foreground">
                                    You have {pendingApprovals.length} journal {pendingApprovals.length === 1 ? 'submission' : 'submissions'} pending review.
                                </p>
                            </div>
                        </div>
                        <Button
                            size="sm"
                            className="bg-hrms-warning hover:bg-hrms-warning/90 text-[11px] h-8 font-bold"
                            onClick={() => navigate(`/journal/${pendingApprovals[0].employee_id}`)}
                        >
                            Review Journals
                            <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Main Content: Interns List */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <Users className="h-5 w-5 text-primary" />
                            Assigned Interns
                        </h3>
                        <Badge variant="outline" className="text-[10px] font-bold uppercase">{interns.length} total</Badge>
                    </div>
                    <InternsList supervisorId={supervisorId} onEvaluate={(id) => navigate(`/evaluations?intern=${id}`)} />
                </div>

                <div className="space-y-4">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <Target className="h-5 w-5 text-primary" />
                        Recent Activity
                    </h3>
                    <Card className="shadow-sm">
                        <CardContent className="p-4">
                            {pendingApprovals.length === 0 ? (
                                <p className="text-xs text-muted-foreground italic text-center py-8">No recent activity to show.</p>
                            ) : (
                                <div className="space-y-4">
                                    {pendingApprovals.slice(0, 5).map((approval) => (
                                        <div key={approval.id} className="flex items-start gap-3 pb-3 border-b border-muted last:border-0 last:pb-0">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={approval.employee?.avatar_url || ''} />
                                                <AvatarFallback className="text-[10px]">
                                                    {approval.employee?.first_name?.[0]}{approval.employee?.last_name?.[0]}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-semibold truncate">
                                                    {approval.employee?.first_name} {approval.employee?.last_name}
                                                </p>
                                                <p className="text-[10px] text-muted-foreground">
                                                    Submitted journal for {format(new Date(approval.entry_date), 'MMM d, yyyy')}
                                                </p>
                                                <div className="mt-1">
                                                    <Badge variant="outline" className="text-[9px] py-0 h-4 border-hrms-warning/30 bg-hrms-warning/5 text-hrms-warning">
                                                        PENDING
                                                    </Badge>
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 w-7 p-0"
                                                onClick={() => navigate(`/journal/${approval.employee_id}`)}
                                            >
                                                <ArrowRight className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
