import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Calendar, BookOpen, AlertCircle } from 'lucide-react';
import { AttendanceRecord } from '@/hooks/useAttendance';
import { LeaveBalance } from '@/hooks/useDashboard';
import { Enrollment } from '@/hooks/useTraining';
import { format, differenceInMinutes } from 'date-fns';
import { Progress } from '@/components/ui/progress';

interface TodaySummaryCardsProps {
    attendance?: AttendanceRecord | null;
    allAttendance?: AttendanceRecord[];
    leaveBalances?: LeaveBalance[];
    enrollments?: Enrollment[];
}

export function TodaySummaryCards({ attendance, allAttendance = [], leaveBalances, enrollments }: TodaySummaryCardsProps) {
    const clockInTime = attendance?.clock_in ? new Date(attendance.clock_in) : null;
    const clockOutTime = attendance?.clock_out ? new Date(attendance.clock_out) : null;

    const leaveBalance = leaveBalances?.reduce((sum, b) => sum + b.remaining_days, 0) || 0;
    const trainingCount = enrollments?.filter(e => e.status !== 'completed').length || 0;

    // Calculate total cumulative hours
    const totalHours = allAttendance.reduce((sum, record) => {
        if (record.clock_in && record.clock_out) {
            const minutes = differenceInMinutes(new Date(record.clock_out), new Date(record.clock_in));
            return sum + (minutes / 60);
        }
        return sum;
    }, 0);

    const TARGET_HOURS = 80;
    const progressPercentage = Math.min((totalHours / TARGET_HOURS) * 100, 100);

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <Card className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow duration-300">
                <CardContent className="p-3 md:p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                        <div>
                            <p className="text-[10px] md:text-sm font-semibold text-muted-foreground uppercase">Check-in</p>
                            <h3 className="text-lg md:text-2xl font-bold mt-1">
                                {clockInTime ? format(clockInTime, 'hh:mm a') : 'Not In'}
                            </h3>
                        </div>
                        <Clock className="h-5 w-5 md:h-8 md:w-8 text-primary/20" />
                    </div>
                </CardContent>
            </Card>

            <Card className="border-l-4 border-l-hrms-success shadow-sm hover:shadow-md transition-shadow duration-300">
                <CardContent className="p-3 md:p-6">
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[10px] md:text-sm font-semibold text-muted-foreground uppercase">Target Progress</p>
                                <h3 className="text-lg md:text-2xl font-bold mt-1">
                                    {totalHours.toFixed(1)} / {TARGET_HOURS}h
                                </h3>
                            </div>
                            <Clock className="h-5 w-5 md:h-8 md:w-8 text-hrms-success/20" />
                        </div>
                        <div className="space-y-1.5">
                            <Progress value={progressPercentage} className="h-2 bg-hrms-success/10" />
                            <div className="flex justify-between text-[10px] md:text-xs text-muted-foreground">
                                <span>{progressPercentage.toFixed(0)}% Completed</span>
                                <span>{Math.max(TARGET_HOURS - totalHours, 0).toFixed(1)}h left</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-l-4 border-l-hrms-warning shadow-sm hover:shadow-md transition-shadow duration-300">
                <CardContent className="p-3 md:p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                        <div>
                            <p className="text-[10px] md:text-sm font-semibold text-muted-foreground uppercase">Leave Balance</p>
                            <h3 className="text-lg md:text-2xl font-bold mt-1">{leaveBalance} Days</h3>
                        </div>
                        <Calendar className="h-5 w-5 md:h-8 md:w-8 text-hrms-warning/20" />
                    </div>
                </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-shadow duration-300">
                <CardContent className="p-3 md:p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                        <div>
                            <p className="text-[10px] md:text-sm font-semibold text-muted-foreground uppercase">Training</p>
                            <h3 className="text-lg md:text-2xl font-bold mt-1">{trainingCount} Pending</h3>
                        </div>
                        <BookOpen className="h-5 w-5 md:h-8 md:w-8 text-purple-500/20" />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
