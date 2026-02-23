import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar as CalendarIcon, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { LeaveRequest } from '@/types/employee';
import { Enrollment } from '@/hooks/useTraining';

interface CalendarPreviewProps {
    leaveRequests?: LeaveRequest[];
    enrollments?: Enrollment[];
}

export function CalendarPreview({ leaveRequests = [], enrollments = [] }: CalendarPreviewProps) {
    // Get upcoming events (next 30 days)
    const upcomingLeave = leaveRequests.filter(req =>
        req.status === 'approved' && new Date(req.start_date) >= new Date()
    ).sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Schedule Preview</CardTitle>
                <CalendarIcon className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-4">
                {upcomingLeave.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No upcoming scheduled leave</p>
                ) : (
                    <div className="space-y-3">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Upcoming Leave</p>
                        {upcomingLeave.slice(0, 3).map((leave) => (
                            <div key={leave.id} className="flex items-center justify-between text-sm p-2 rounded-lg bg-muted/30">
                                <div className="flex flex-col">
                                    <span className="font-medium">{leave.leave_type}</span>
                                    <span className="text-xs text-muted-foreground">
                                        {format(new Date(leave.start_date), 'MMM dd')} - {format(new Date(leave.end_date), 'MMM dd')}
                                    </span>
                                </div>
                                <Badge variant="outline" className="bg-hrms-success/5 text-hrms-success">Approved</Badge>
                            </div>
                        ))}
                    </div>
                )}

                <Button variant="ghost" className="w-full text-xs gap-1 h-8 text-muted-foreground">
                    View Full Calendar
                    <ChevronRight className="h-3 w-3" />
                </Button>
            </CardContent>
        </Card>
    );
}
