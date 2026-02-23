import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Calendar, BookOpen, AlertCircle } from 'lucide-react';
import { AttendanceRecord } from '@/hooks/useAttendance';
import { LeaveBalance } from '@/hooks/useDashboard';
import { Enrollment } from '@/hooks/useTraining';
import { format } from 'date-fns';

interface TodaySummaryCardsProps {
    attendance?: AttendanceRecord | null;
    leaveBalances?: LeaveBalance[];
    enrollments?: Enrollment[];
}

export function TodaySummaryCards({ attendance, leaveBalances, enrollments }: TodaySummaryCardsProps) {
    const clockInTime = attendance?.clock_in ? new Date(attendance.clock_in) : null;
    const clockOutTime = attendance?.clock_out ? new Date(attendance.clock_out) : null;

    const leaveBalance = leaveBalances?.reduce((sum, b) => sum + b.remaining_days, 0) || 0;
    const trainingCount = enrollments?.filter(e => e.status !== 'completed').length || 0;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-primary">
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground uppercase">Today's Check-in</p>
                            <h3 className="text-2xl font-bold mt-1">
                                {clockInTime ? format(clockInTime, 'hh:mm a') : 'Not In'}
                            </h3>
                        </div>
                        <Clock className="h-8 w-8 text-primary/20" />
                    </div>
                    {clockInTime && (
                        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                            {attendance?.status === 'late' && (
                                <span className="text-hrms-warning flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" /> Late arrival
                                </span>
                            )}
                            {attendance?.status === 'present' && <span className="text-hrms-success">On time</span>}
                        </p>
                    )}
                </CardContent>
            </Card>

            <Card className="border-l-4 border-l-hrms-success">
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground uppercase">Total Work Hours</p>
                            <h3 className="text-2xl font-bold mt-1">
                                {clockInTime && !clockOutTime
                                    ? ((new Date().getTime() - clockInTime.getTime()) / (1000 * 60 * 60)).toFixed(1)
                                    : clockInTime && clockOutTime
                                        ? ((clockOutTime.getTime() - clockInTime.getTime()) / (1000 * 60 * 60)).toFixed(1)
                                        : '0.0'}h
                            </h3>
                        </div>
                        <Clock className="h-8 w-8 text-hrms-success/20" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Target: 8.0h</p>
                </CardContent>
            </Card>

            <Card className="border-l-4 border-l-hrms-warning">
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground uppercase">Leave Balance</p>
                            <h3 className="text-2xl font-bold mt-1">{leaveBalance} Days</h3>
                        </div>
                        <Calendar className="h-8 w-8 text-hrms-warning/20" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Annual Allowance</p>
                </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground uppercase">Required Training</p>
                            <h3 className="text-2xl font-bold mt-1">{trainingCount} Pending</h3>
                        </div>
                        <BookOpen className="h-8 w-8 text-purple-500/20" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Compliance & Skills</p>
                </CardContent>
            </Card>
        </div>
    );
}
