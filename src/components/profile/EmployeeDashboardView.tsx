import React, { useState } from 'react';
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

interface EmployeeDashboardViewProps {
    employeeId: string;
    onUpdateProfile?: () => void;
}

export function EmployeeDashboardView({ employeeId, onUpdateProfile }: EmployeeDashboardViewProps) {
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
            />
        </div>
    );
}
