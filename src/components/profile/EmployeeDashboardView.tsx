import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { TodaySummaryCards } from './TodaySummaryCards';
import { QuickActions } from './QuickActions';
import { AnnouncementsWidget } from './AnnouncementsWidget';
import { MyTasksWidget } from './MyTasksWidget';
import { CalendarPreview } from './CalendarPreview';
import { CreateLeaveModal } from '@/components/leave/CreateLeaveModal';
import { useAttendance, useTodayAttendance, useClockIn, useClockOut } from '@/hooks/useAttendance';
import { useLeaveRequests } from '@/hooks/useLeave';
import { useEnrollments } from '@/hooks/useTraining';
import { useLeaveBalances, useAnnouncements } from '@/hooks/useDashboard';
import { useCurrentEmployee } from '@/hooks/useEmployees';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, ArrowRight } from 'lucide-react';

interface EmployeeDashboardViewProps {
    employeeId: string;
    onUpdateProfile?: () => void;
}

export function EmployeeDashboardView({ employeeId, onUpdateProfile }: EmployeeDashboardViewProps) {
    const { user } = useAuth();
    const { data: employee } = useCurrentEmployee(user?.id || '');

    // Dashboard Data
    const { data: todayAttendance } = useTodayAttendance(employeeId);
    const clockIn = useClockIn();
    const clockOut = useClockOut();
    const { data: leaveRequests = [] } = useLeaveRequests(employeeId);
    const { data: leaveBalances = [] } = useLeaveBalances(employeeId);
    const { data: enrollments = [] } = useEnrollments(employeeId);
    const { data: announcements = [] } = useAnnouncements();

    const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);

    const handleClockIn = () => {
        clockIn.mutate({ employeeId });
    };

    const handleClockOut = () => {
        if (todayAttendance?.id) clockOut.mutate({ id: todayAttendance.id });
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Welcome message */}
            {employee && (
                <div className="rounded-lg border bg-card p-4">
                    <h3 className="text-lg font-semibold text-foreground">
                        Welcome, {employee.first_name} {employee.last_name}
                    </h3>
                    {employee.job_title && (
                        <p className="text-sm text-muted-foreground">{employee.job_title}</p>
                    )}
                </div>
            )}

            <TodaySummaryCards
                attendance={todayAttendance}
                leaveBalances={leaveBalances}
                enrollments={enrollments}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <QuickActions
                        onClockIn={handleClockIn}
                        onClockOut={handleClockOut}
                        onRequestLeave={() => setIsLeaveModalOpen(true)}
                        onUpdateProfile={onUpdateProfile || (() => { })}
                        isClockedIn={!!todayAttendance?.clock_in && !todayAttendance?.clock_out}
                        isClocking={clockIn.isPending || clockOut.isPending}
                    />

                    {/* Quick Navigation Links */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Link to="/leave/requests">
                            <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                                <CardContent className="flex items-center justify-between p-4">
                                    <div className="flex items-center gap-3">
                                        <Calendar className="h-5 w-5 text-primary" />
                                        <span className="text-sm font-medium">View Leave Calendar</span>
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                </CardContent>
                            </Card>
                        </Link>
                        <Link to="/attendance">
                            <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                                <CardContent className="flex items-center justify-between p-4">
                                    <div className="flex items-center gap-3">
                                        <Clock className="h-5 w-5 text-primary" />
                                        <span className="text-sm font-medium">View Attendance History</span>
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                </CardContent>
                            </Card>
                        </Link>
                    </div>

                    <AnnouncementsWidget announcements={announcements} />
                </div>
                <div className="space-y-6">
                    <MyTasksWidget
                        incompleteRequiredCourses={enrollments.filter(e => e.status !== 'completed')}
                    />
                    <CalendarPreview leaveRequests={leaveRequests} />
                </div>
            </div>

            <CreateLeaveModal
                open={isLeaveModalOpen}
                onOpenChange={setIsLeaveModalOpen}
                employeeId={employeeId}
            />
        </div>
    );
}
