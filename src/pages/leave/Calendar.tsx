import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useLeaveRequests } from '@/hooks/useLeave';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isWithinInterval, parseISO } from 'date-fns';

const leaveTypeColors: Record<string, string> = {
    'Annual Leave': 'bg-primary/20 text-primary',
    'Sick Leave': 'bg-destructive/20 text-destructive',
    'Personal Leave': 'bg-yellow-500/20 text-yellow-600',
    'Maternity Leave': 'bg-pink-500/20 text-pink-600',
};

export default function LeaveCalendar() {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const { data: requests = [], isLoading } = useLeaveRequests();

    const approvedLeaves = requests.filter(r => r.status === 'approved');

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    const startPadding = monthStart.getDay();
    const paddedDays = [...Array(startPadding).fill(null), ...days];

    const getLeavesForDay = (day: Date) => {
        return approvedLeaves.filter(leave => {
            const start = parseISO(leave.start_date);
            const end = parseISO(leave.end_date);
            return isWithinInterval(day, { start, end });
        });
    };

    return (
        <MainLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Leave Calendar</h1>
                    <p className="text-muted-foreground">View organization-wide approved leave schedule.</p>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                ) : (
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                                <ChevronLeft className="h-5 w-5" />
                            </Button>
                            <CardTitle>{format(currentMonth, 'MMMM yyyy')}</CardTitle>
                            <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                                <ChevronRight className="h-5 w-5" />
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-7 gap-1">
                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                                    <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
                                ))}
                                {paddedDays.map((day, i) => {
                                    if (!day) return <div key={`pad-${i}`} className="h-24 border rounded-lg bg-muted/20" />;
                                    const leaves = getLeavesForDay(day);
                                    const isToday = isSameDay(day, new Date());
                                    return (
                                        <div key={day.toISOString()} className={`h-24 border rounded-lg p-1 overflow-hidden ${isToday ? 'border-primary bg-primary/5' : 'bg-card'}`}>
                                            <div className={`text-xs font-medium mb-1 ${isToday ? 'text-primary' : 'text-foreground'}`}>
                                                {format(day, 'd')}
                                            </div>
                                            <div className="space-y-0.5">
                                                {leaves.slice(0, 2).map(leave => (
                                                    <div key={leave.id} className={`text-[10px] px-1 py-0.5 rounded truncate ${leaveTypeColors[leave.leave_type] || 'bg-muted text-muted-foreground'}`}>
                                                        {leave.employee?.first_name?.[0]}.{leave.employee?.last_name}
                                                    </div>
                                                ))}
                                                {leaves.length > 2 && (
                                                    <div className="text-[10px] text-muted-foreground">+{leaves.length - 2} more</div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </MainLayout>
    );
}
