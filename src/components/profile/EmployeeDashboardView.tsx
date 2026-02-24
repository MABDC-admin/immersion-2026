import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { TodaySummaryCards } from './TodaySummaryCards';
import { QuickActions } from './QuickActions';
import { AnnouncementsWidget } from './AnnouncementsWidget';
import { CreateLeaveModal } from '@/components/leave/CreateLeaveModal';

import { useLeaveRequests } from '@/hooks/useLeave';
import { useEnrollments } from '@/hooks/useTraining';
import { useLeaveBalances, useAnnouncements } from '@/hooks/useDashboard';
import { useCurrentEmployee } from '@/hooks/useEmployees';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, ArrowRight } from 'lucide-react';

interface EmployeeDashboardViewProps {
    employeeId: string;
    onUpdateProfile?: () => void;
}

export function EmployeeDashboardView({ employeeId, onUpdateProfile }: EmployeeDashboardViewProps) {
    const { user } = useAuth();
    const { data: employee } = useCurrentEmployee(user?.id || '');

    // Dashboard Data
    const { data: leaveRequests = [] } = useLeaveRequests(employeeId);
    const { data: leaveBalances = [] } = useLeaveBalances(employeeId);
    const { data: enrollments = [] } = useEnrollments(employeeId);
    const { data: announcements = [] } = useAnnouncements();

    const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);

    return (
        <div className="space-y-4 animate-fade-in">
            {/* Welcome message - Hidden on mobile, visible on desktop */}
            {employee && (
                <Card className="hidden md:block border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow duration-300">
                    <CardContent className="px-5 py-6">
                        <h3 className="text-2xl font-bold text-foreground">
                            Welcome, {employee.first_name} {employee.last_name}
                        </h3>
                        {employee.job_title && (
                            <p className="text-base font-medium text-muted-foreground mt-1">{employee.job_title}</p>
                        )}
                    </CardContent>
                </Card>
            )}

            <TodaySummaryCards
                leaveBalances={leaveBalances}
                enrollments={enrollments}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                <div className="lg:col-span-2 space-y-6 md:space-y-8">
                    <QuickActions
                        onRequestLeave={() => setIsLeaveModalOpen(true)}
                        onUpdateProfile={onUpdateProfile || (() => { })}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Link to="/leave/requests">
                            <Card className="hover:bg-accent/50 transition-all cursor-pointer shadow-sm hover:shadow-md border border-muted/20">
                                <CardContent className="flex items-center justify-between p-5">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 rounded-lg bg-primary/10">
                                            <Calendar className="h-6 w-6 text-primary" />
                                        </div>
                                        <span className="text-sm font-semibold">View Leave Calendar</span>
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-50" />
                                </CardContent>
                            </Card>
                        </Link>
                    </div>

                    <AnnouncementsWidget announcements={announcements} />
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
