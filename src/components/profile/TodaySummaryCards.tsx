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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow duration-300">
                <CardContent className="p-4 md:p-6">
                    <div className="flex items-center justify-between gap-2">
                        <div>
                            <p className="text-[10px] md:text-sm font-semibold text-muted-foreground uppercase tracking-wider">Check-in</p>
                            <h3 className="text-xl md:text-2xl font-bold mt-1 text-foreground">
                                {clockInTime ? format(clockInTime, 'hh:mm a') : 'Not In'}
                            </h3>
                        </div>
                        <div className="p-3 rounded-xl bg-primary/5">
                            <Clock className="h-5 w-5 md:h-8 md:w-8 text-primary" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-l-4 border-l-hrms-success shadow-sm hover:shadow-md transition-shadow duration-300">
                <CardContent className="p-4 md:p-6">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[10px] md:text-sm font-semibold text-muted-foreground uppercase tracking-wider">Target Progress</p>
                                <h3 className="text-xl md:text-2xl font-bold mt-1 text-foreground">
                                    {totalHours.toFixed(1)} / {TARGET_HOURS}h
                                </h3>
                            </div>
                            <div className="p-3 rounded-xl bg-hrms-success/5">
                                <Clock className="h-5 w-5 md:h-8 md:w-8 text-hrms-success" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Progress value={progressPercentage} className="h-2 bg-hrms-success/10" />
                            <div className="flex justify-between text-[10px] md:text-xs text-muted-foreground font-medium">
                                <span>{progressPercentage.toFixed(0)}% Completed</span>
                                <span>{Math.max(TARGET_HOURS - totalHours, 0).toFixed(1)}h left</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
