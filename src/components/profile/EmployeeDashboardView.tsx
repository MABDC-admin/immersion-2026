import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CreateLeaveModal } from '@/components/leave/CreateLeaveModal';
import { AnnouncementsWidget } from './AnnouncementsWidget';

import { useLeaveBalances, useAnnouncements } from '@/hooks/useDashboard';
import { useAttendance } from '@/hooks/useAttendance';
import { useEnrollments } from '@/hooks/useTraining';
import { useCurrentEmployee } from '@/hooks/useEmployees';
import { useJournalEntries, usePendingJournalApprovals } from '@/hooks/useJournal';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Clock, BookOpen, ClipboardCheck, FileText, Calendar, ArrowRight, ListChecks,
    Timer, Target, CalendarPlus, UserPen, GraduationCap, MessageSquare, Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface EmployeeDashboardViewProps {
    employeeId: string;
    onUpdateProfile?: () => void;
}

// Target Work Immersion hours
const TARGET_OJT_HOURS = 80;

function calculateTotalHours(records: any[]): number {
    let totalMinutes = 0;
    for (const r of records) {
        if (r.clock_in && r.clock_out) {
            const diff = new Date(r.clock_out).getTime() - new Date(r.clock_in).getTime();
            totalMinutes += diff / 60000;
        }
    }
    return Math.round((totalMinutes / 60) * 10) / 10;
}

export function EmployeeDashboardView({ employeeId, onUpdateProfile }: EmployeeDashboardViewProps) {
    const { user } = useAuth();
    const { data: employee } = useCurrentEmployee(user?.id || '');
    const navigate = useNavigate();

    // Data
    const { data: leaveBalances = [] } = useLeaveBalances(employeeId);
    const { data: enrollments = [] } = useEnrollments(employeeId);
    const { data: announcements = [] } = useAnnouncements();
    const { data: attendanceRecords = [] } = useAttendance(employeeId);
    const { data: journalEntries = [] } = useJournalEntries(employeeId);
    const { data: pendingApprovals = [] } = usePendingJournalApprovals(employee?.id || '');

    const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);

    // Work Immersion Hours calculation
    const totalOjtHours = useMemo(() => {
        const attendanceHours = calculateTotalHours(attendanceRecords);
        const journalHours = journalEntries.reduce((sum, entry) => sum + (Number(entry.hours_worked) || 0), 0);
        return Math.round((attendanceHours + journalHours) * 10) / 10;
    }, [attendanceRecords, journalEntries]);

    const ojtProgress = Math.min((totalOjtHours / TARGET_OJT_HOURS) * 100, 100);

    // Today's attendance
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const todayRecord = attendanceRecords.find(r => r.clock_in?.startsWith(todayStr));
    const isClockedIn = todayRecord && !todayRecord.clock_out;

    // Leave balance total
    const totalLeaveDays = leaveBalances.reduce((sum, b) => sum + b.remaining_days, 0);

    // Active training
    const activeTraining = enrollments.filter(e => e.status !== 'completed').length;

    // Quick nav items
    const quickNavItems = [
        { label: 'My Tasks', icon: ListChecks, href: '/my-tasks', color: 'text-primary', bg: 'bg-primary/10' },
        { label: 'Journal', icon: BookOpen, href: '/journal', color: 'text-hrms-success', bg: 'bg-hrms-success/10' },
        { label: 'Evaluations', icon: ClipboardCheck, href: '/my-evaluations', color: 'text-hrms-warning', bg: 'bg-hrms-warning/10' },
        { label: 'Documents', icon: FileText, href: '/my-documents', color: 'text-purple-500', bg: 'bg-purple-500/10' },
        { label: 'Leave', icon: CalendarPlus, href: '/leave/requests', color: 'text-orange-500', bg: 'bg-orange-500/10' },
        { label: 'Training', icon: GraduationCap, href: '/training/courses', color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
        { label: 'Profile', icon: UserPen, href: employee ? `/employees/${employee.id}` : '#', color: 'text-pink-500', bg: 'bg-pink-500/10' },
        { label: 'Chat', icon: MessageSquare, href: '/chat', color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Welcome Header */}
            {employee && (
                <Card className="border-l-4 border-l-primary shadow-sm overflow-hidden">
                    <CardContent className="p-5 flex items-center gap-4">
                        <Avatar className="h-14 w-14 ring-2 ring-primary/20 shrink-0">
                            <AvatarImage src={employee.avatar_url || ''} />
                            <AvatarFallback className="bg-primary text-primary-foreground text-lg font-bold">
                                {`${employee.first_name[0]}${employee.last_name[0]}`.toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-xl md:text-2xl font-bold text-foreground truncate">
                                Welcome, {employee.first_name}!
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                                {employee.job_title && (
                                    <Badge variant="secondary" className="text-[10px] font-bold uppercase">
                                        {employee.job_title}
                                    </Badge>
                                )}

                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                className="gap-2 h-9 text-xs font-bold bg-hrms-success/5 hover:bg-hrms-success/10 border-hrms-success/20 text-hrms-success"
                                onClick={() => navigate('/journal')}
                            >
                                <BookOpen className="h-4 w-4" />
                                View My Journal
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* AI Profile Summary (From CV extraction) */}
            {employee?.cv_data && (
                <Card className="shadow-sm border-l-4 border-l-purple-500 bg-purple-500/5">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <Sparkles className="h-5 w-5 text-purple-500" />
                            <h4 className="font-bold text-sm">AI Profile Summary (From CV)</h4>
                        </div>
                        <div className="space-y-4">
                            {employee.cv_data.summary && (
                                <div>
                                    <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-bold">Professional Summary</p>
                                    <p className="text-sm">{employee.cv_data.summary}</p>
                                </div>
                            )}
                            {employee.cv_data.skills && employee.cv_data.skills.length > 0 && (
                                <div>
                                    <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider font-bold">Skills</p>
                                    <div className="flex gap-2 flex-wrap">
                                        {employee.cv_data.skills.map((skill: string) => (
                                            <Badge key={skill} variant="secondary" className="bg-purple-500/10 text-purple-600 border-purple-500/20">
                                                {skill}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {employee.cv_data.experience_years !== undefined && (
                                <div>
                                    <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-bold">Experience</p>
                                    <p className="text-sm">{employee.cv_data.experience_years} years</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Supervisor: Pending Approvals Alert */}
            {pendingApprovals.length > 0 && (
                <Card className="border-l-4 border-l-hrms-warning bg-hrms-warning/5 shadow-sm animate-pulse-subtle">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-hrms-warning/20">
                                <Clock className="h-5 w-5 text-hrms-warning" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-hrms-warning">Pending Journal Approvals</h4>
                                <p className="text-xs text-muted-foreground">
                                    You have {pendingApprovals.length} journal {pendingApprovals.length === 1 ? 'entry' : 'entries'} awaiting your review.
                                </p>
                            </div>
                        </div>
                        <Button
                            size="sm"
                            className="bg-hrms-warning hover:bg-hrms-warning/90 text-[11px] h-8 font-bold"
                            onClick={() => {
                                // For now, navigate to the first intern's journal
                                // In a more complex UI, this might open a review modal or a list
                                const firstEntry = pendingApprovals[0];
                                navigate(`/journal/${firstEntry.employee_id}`);
                            }}
                        >
                            Review Now
                            <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Work Immersion Progress + Stats Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Work Immersion Hours Progress — large card */}
                <Card className="lg:col-span-2 border-l-4 border-l-hrms-success shadow-sm">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-hrms-success/10">
                                    <Target className="h-5 w-5 text-hrms-success" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold">Work Immersion Hours Progress</h4>
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                                        Target: {TARGET_OJT_HOURS} hours
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-bold text-hrms-success">{totalOjtHours}</p>
                                <p className="text-[10px] text-muted-foreground">/ {TARGET_OJT_HOURS} hrs</p>
                            </div>
                        </div>
                        <Progress
                            value={ojtProgress}
                            className="h-3 rounded-full"
                        />
                        <div className="flex justify-between mt-2 text-[10px] text-muted-foreground font-medium">
                            <span>{ojtProgress.toFixed(0)}% Complete</span>
                            <span>{Math.max(TARGET_OJT_HOURS - totalOjtHours, 0)} hrs remaining</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-primary shadow-sm">
                    <CardContent className="p-5 flex flex-col justify-between h-full">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-primary/10">
                                    <Calendar className="h-5 w-5 text-primary" />
                                </div>
                                <h4 className="text-sm font-bold">Today</h4>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Days Present</span>
                                <span className="font-semibold">{attendanceRecords.length}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Work Immersion Progress</span>
                                <span className="font-semibold">{ojtProgress.toFixed(0)}%</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                            <Clock className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Days Present</p>
                            <p className="text-lg font-bold">{attendanceRecords.length}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-hrms-warning/10">
                            <Calendar className="h-5 w-5 text-hrms-warning" />
                        </div>
                        <div>
                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Leave Days</p>
                            <p className="text-lg font-bold">{totalLeaveDays}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-hrms-success/10">
                            <GraduationCap className="h-5 w-5 text-hrms-success" />
                        </div>
                        <div>
                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Training</p>
                            <p className="text-lg font-bold">{activeTraining}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-purple-500/10">
                            <Target className="h-5 w-5 text-purple-500" />
                        </div>
                        <div>
                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Work Immersion Progress</p>
                            <p className="text-lg font-bold">{ojtProgress.toFixed(0)}%</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Navigation Grid */}
            <Card className="shadow-sm">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base font-bold">Quick Access</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-8 gap-2">
                        {quickNavItems.map((item) => (
                            <Button
                                key={item.label}
                                variant="ghost"
                                className="h-auto flex-col gap-2 py-4 hover:scale-105 transition-transform rounded-xl border border-transparent hover:border-muted"
                                onClick={() => navigate(item.href)}
                            >
                                <div className={cn("p-2.5 rounded-xl", item.bg)}>
                                    <item.icon className={cn("h-5 w-5", item.color)} />
                                </div>
                                <span className="text-[10px] font-semibold text-muted-foreground">{item.label}</span>
                            </Button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Announcements */}
            <AnnouncementsWidget announcements={announcements} />

            <CreateLeaveModal
                open={isLeaveModalOpen}
                onOpenChange={setIsLeaveModalOpen}
                employeeId={employeeId}
            />
        </div>
    );
}
