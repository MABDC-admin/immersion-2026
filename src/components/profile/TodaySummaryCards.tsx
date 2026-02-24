import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, BookOpen } from 'lucide-react';
import { LeaveBalance } from '@/hooks/useDashboard';
import { Enrollment } from '@/hooks/useTraining';

interface TodaySummaryCardsProps {
    leaveBalances?: LeaveBalance[];
    enrollments?: Enrollment[];
}

export function TodaySummaryCards({ leaveBalances, enrollments }: TodaySummaryCardsProps) {
    const leaveBalance = leaveBalances?.reduce((sum, b) => sum + b.remaining_days, 0) || 0;
    const trainingCount = enrollments?.filter(e => e.status !== 'completed').length || 0;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow duration-300">
                <CardContent className="p-4 md:p-6">
                    <div className="flex items-center justify-between gap-2">
                        <div>
                            <p className="text-[10px] md:text-sm font-semibold text-muted-foreground uppercase tracking-wider">Leave Balance</p>
                            <h3 className="text-xl md:text-2xl font-bold mt-1 text-foreground">
                                {leaveBalance} days
                            </h3>
                        </div>
                        <div className="p-3 rounded-xl bg-primary/5">
                            <Calendar className="h-5 w-5 md:h-8 md:w-8 text-primary" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-l-4 border-l-hrms-success shadow-sm hover:shadow-md transition-shadow duration-300">
                <CardContent className="p-4 md:p-6">
                    <div className="flex items-center justify-between gap-2">
                        <div>
                            <p className="text-[10px] md:text-sm font-semibold text-muted-foreground uppercase tracking-wider">Active Training</p>
                            <h3 className="text-xl md:text-2xl font-bold mt-1 text-foreground">
                                {trainingCount} courses
                            </h3>
                        </div>
                        <div className="p-3 rounded-xl bg-hrms-success/5">
                            <BookOpen className="h-5 w-5 md:h-8 md:w-8 text-hrms-success" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
