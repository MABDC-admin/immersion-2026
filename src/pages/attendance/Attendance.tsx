import { MainLayout } from '@/components/layout/MainLayout';
import { useAttendance, useClockIn, useClockOut, useTodayAttendance } from '@/hooks/useAttendance';
import { useAuth } from '@/hooks/useAuth';
import { useCurrentEmployee } from '@/hooks/useEmployees';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format, differenceInMinutes } from 'date-fns';
import { Activity, Calendar, CheckCircle2, Clock, Loader2, Play, Square, Users } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function Attendance() {
    const { user, isAdmin, isManager, userRole } = useAuth();
    const { data: employee } = useCurrentEmployee(user?.id || '');
    const employeeId = employee?.id || '';
    const isAdminOrHR = isAdmin || userRole === 'hr_manager';
    const isSupervisor = isAdmin || isManager;

    const { data: attendance = [], isLoading } = useAttendance();
    const { data: todayRecord } = useTodayAttendance(employeeId);
    const clockIn = useClockIn();
    const clockOut = useClockOut();

    const filteredAttendance = isAdminOrHR
        ? attendance
        : attendance.filter((record) => record.employee_id === employeeId);

    const myAttendance = attendance.filter((record) => record.employee_id === employeeId);
    const completedRecords = myAttendance.filter((record) => record.clock_in && record.clock_out);
    const totalMinutes = completedRecords.reduce((acc, record) => {
        return acc + differenceInMinutes(new Date(record.clock_out), new Date(record.clock_in));
    }, 0);
    const totalHoursDisplay = `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`;
    const presentDays = myAttendance.filter((record) => record.status?.toLowerCase() === 'present').length;
    const lateDays = myAttendance.filter((record) => record.status?.toLowerCase() === 'late').length;
    const isClockedIn = !!todayRecord?.clock_in && !todayRecord?.clock_out;

    const handleClockIn = () => {
        if (employeeId) clockIn.mutate({ employeeId });
    };

    const handleClockOut = () => {
        if (todayRecord?.id) clockOut.mutate({ id: todayRecord.id });
    };

    const getStatusStyle = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'present':
                return 'border-emerald-200 bg-emerald-50 text-emerald-700';
            case 'absent':
                return 'border-rose-200 bg-rose-50 text-rose-700';
            case 'late':
                return 'border-amber-200 bg-amber-50 text-amber-700';
            default:
                return 'border-slate-200 bg-slate-50 text-slate-700';
        }
    };

    const widgets = [
        {
            label: 'Today',
            value: todayRecord?.clock_in ? 'Clocked In' : 'Not In',
            detail: todayRecord?.clock_in ? format(new Date(todayRecord.clock_in), 'hh:mm a') : 'No clock-in yet',
            icon: Activity,
            cardClass: 'border-sky-200/80 bg-gradient-to-br from-sky-50 via-white to-white',
            iconClass: 'bg-sky-100 text-sky-700',
        },
        {
            label: 'Total Hours',
            value: totalHoursDisplay,
            detail: `${completedRecords.length} completed day${completedRecords.length === 1 ? '' : 's'}`,
            icon: Clock,
            cardClass: 'border-orange-200/80 bg-gradient-to-br from-orange-50 via-white to-white',
            iconClass: 'bg-orange-100 text-orange-700',
        },
        {
            label: 'Present Days',
            value: presentDays,
            detail: `${lateDays} late record${lateDays === 1 ? '' : 's'}`,
            icon: CheckCircle2,
            cardClass: 'border-emerald-200/80 bg-gradient-to-br from-emerald-50 via-white to-white',
            iconClass: 'bg-emerald-100 text-emerald-700',
        },
    ];

    return (
        <MainLayout>
            <div className="animate-fade-in space-y-8">
                <Card className="overflow-hidden border-white/80 bg-gradient-to-br from-sky-500/15 via-orange-500/10 to-emerald-500/15 shadow-sm">
                    <CardContent className="p-0">
                        <div className="grid gap-0 xl:grid-cols-[1.5fr_0.8fr]">
                            <div className="px-6 py-6 md:px-8">
                                <div className="flex flex-wrap items-center gap-2">
                                    <Badge variant="outline" className="border-sky-200 bg-white/80 text-sky-700">Attendance</Badge>
                                    <Badge variant="outline" className="border-orange-200 bg-white/80 text-orange-700">
                                        {isAdminOrHR ? 'All records' : 'My records'}
                                    </Badge>
                                </div>
                                <h1 className="mt-5 text-3xl font-bold text-foreground">Attendance Tracker</h1>
                                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                                    {isAdminOrHR ? 'Monitor intern attendance and daily time records.' : 'Track your clock-in history and total immersion hours.'}
                                </p>
                                {!isSupervisor && (
                                    <div className="mt-5 flex flex-wrap gap-3">
                                        <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700" onClick={handleClockIn} disabled={!!todayRecord?.clock_in || clockIn.isPending}>
                                            <Play className="h-4 w-4" />
                                            Clock In
                                        </Button>
                                        <Button variant="outline" className="gap-2 border-rose-200 bg-white/80 text-rose-800 hover:bg-rose-50" onClick={handleClockOut} disabled={!isClockedIn || clockOut.isPending}>
                                            <Square className="h-4 w-4" />
                                            Clock Out
                                        </Button>
                                    </div>
                                )}
                            </div>
                            <div className="border-t border-white/70 bg-white/55 px-6 py-6 xl:border-l xl:border-t-0">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-2xl bg-sky-100 p-3 text-sky-700">
                                        <Clock className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Hours Logged</p>
                                        <p className="text-3xl font-bold text-foreground">{totalHoursDisplay}</p>
                                    </div>
                                </div>
                                <p className="mt-4 text-sm text-muted-foreground">{myAttendance.length} total attendance records.</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {!isAdminOrHR && (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        {widgets.map((widget) => (
                            <Card key={widget.label} className={cn('border shadow-sm', widget.cardClass)}>
                                <CardContent className="p-5">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-xs font-semibold uppercase text-muted-foreground">{widget.label}</p>
                                            <p className="mt-2 text-2xl font-bold text-foreground">{widget.value}</p>
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
                )}

                <Card className="border-white/80 bg-gradient-to-br from-white via-sky-50/50 to-orange-50/50 shadow-sm">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <CardTitle>Attendance Records</CardTitle>
                                <p className="mt-1 text-sm text-muted-foreground">{filteredAttendance.length} visible records</p>
                            </div>
                            <Calendar className="h-5 w-5 text-sky-700" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex h-64 items-center justify-center">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : filteredAttendance.length === 0 ? (
                            <div className="rounded-xl border border-dashed bg-white/70 px-4 py-12 text-center">
                                <Users className="mx-auto h-8 w-8 text-muted-foreground" />
                                <p className="mt-3 text-sm font-semibold text-foreground">No attendance records yet.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                                {filteredAttendance.map((record) => (
                                    <div key={record.id} className="rounded-xl border border-white bg-white/85 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                            <div className="flex min-w-0 items-center gap-3">
                                                {isAdminOrHR && (
                                                    <Avatar className="h-10 w-10">
                                                        <AvatarFallback className="bg-sky-100 text-sky-700">
                                                            {record.employee?.first_name?.[0]}{record.employee?.last_name?.[0]}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                )}
                                                <div className="min-w-0">
                                                    <p className="text-sm font-bold text-foreground">
                                                        {isAdminOrHR ? `${record.employee?.first_name || 'Intern'} ${record.employee?.last_name || ''}` : format(new Date(record.date), 'EEEE')}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">{format(new Date(record.date), 'MMM dd, yyyy')}</p>
                                                </div>
                                            </div>
                                            <Badge variant="outline" className={getStatusStyle(record.status)}>{record.status}</Badge>
                                        </div>
                                        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                                            <div className="rounded-lg bg-sky-50 px-3 py-2">
                                                <p className="text-[10px] font-bold uppercase text-sky-700">Clock In</p>
                                                <p className="mt-1 font-semibold">{record.clock_in ? format(new Date(record.clock_in), 'hh:mm a') : '-'}</p>
                                            </div>
                                            <div className="rounded-lg bg-orange-50 px-3 py-2">
                                                <p className="text-[10px] font-bold uppercase text-orange-700">Clock Out</p>
                                                <p className="mt-1 font-semibold">{record.clock_out ? format(new Date(record.clock_out), 'hh:mm a') : '-'}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
