import { MainLayout } from '@/components/layout/MainLayout';
import { useAttendance, useClockIn, useClockOut, useTodayAttendance } from '@/hooks/useAttendance';
import { useAuth } from '@/hooks/useAuth';
import { useCurrentEmployee } from '@/hooks/useEmployees';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format, differenceInMinutes } from 'date-fns';
import { Loader2, Play, Square, Clock } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Attendance() {
    const { user, isAdmin, isManager, userRole } = useAuth();
    const { data: employee } = useCurrentEmployee(user?.id || '');
    const employeeId = employee?.id || '';
    const isAdminOrHR = isAdmin || userRole === 'hr_manager';
    const isSupervisor = isAdmin || isManager;

    const { data: attendance = [], isLoading } = useAttendance();
    const { data: todayRecord, isLoading: isLoadingToday } = useTodayAttendance(employeeId);
    const clockIn = useClockIn();
    const clockOut = useClockOut();

    const handleClockIn = () => {
        if (employeeId) {
            clockIn.mutate({ employeeId });
        }
    };

    const handleClockOut = () => {
        if (todayRecord?.id) {
            clockOut.mutate({ id: todayRecord.id });
        }
    };

    // For regular employees, filter attendance to only their own records
    const filteredAttendance = isAdminOrHR
        ? attendance
        : attendance.filter(record => record.employee_id === employeeId);

    const myAttendance = attendance.filter(record => record.employee_id === employeeId);
    const totalMinutes = myAttendance.reduce((acc, record) => {
        if (!record.clock_in || !record.clock_out) return acc;
        return acc + differenceInMinutes(new Date(record.clock_out), new Date(record.clock_in));
    }, 0);
    const totalHoursDisplay = `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`;

    const getStatusBadge = (status: string) => {
        switch (status.toLowerCase()) {
            case 'present':
                return <Badge className="bg-hrms-success/10 text-hrms-success border-hrms-success/20">Present</Badge>;
            case 'absent':
                return <Badge variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20">Absent</Badge>;
            case 'late':
                return <Badge variant="outline" className="text-hrms-warning border-hrms-warning/20">Late</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <MainLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Attendance</h1>
                        <p className="text-muted-foreground">
                            {isAdminOrHR ? 'Track and manage employee attendance.' : 'View your attendance records.'}
                        </p>
                    </div>
                </div>

                {!isSupervisor && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground uppercase">Today's Status</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {todayRecord?.clock_in ? 'Clocked In' : 'Not Clocked In'}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {todayRecord?.clock_in && `In: ${format(new Date(todayRecord.clock_in), 'hh:mm a')}`}
                                    {todayRecord?.clock_out && ` • Out: ${format(new Date(todayRecord.clock_out), 'hh:mm a')}`}
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground uppercase">Total Hours</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{totalHoursDisplay}</div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Across {myAttendance.filter(r => r.clock_in && r.clock_out).length} recorded day{myAttendance.filter(r => r.clock_in && r.clock_out).length !== 1 ? 's' : ''}
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="border rounded-lg overflow-hidden bg-card">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    {isAdminOrHR && <TableHead>Employee</TableHead>}
                                    <TableHead>Date</TableHead>
                                    <TableHead>Clock In</TableHead>
                                    <TableHead>Clock Out</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredAttendance.map((record) => (
                                    <TableRow key={record.id}>
                                        {isAdminOrHR && (
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="h-6 w-6">
                                                        <AvatarFallback>
                                                            {record.employee?.first_name?.[0]}
                                                            {record.employee?.last_name?.[0]}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span>{record.employee?.first_name} {record.employee?.last_name}</span>
                                                </div>
                                            </TableCell>
                                        )}
                                        <TableCell>{format(new Date(record.date), 'MMM dd, yyyy')}</TableCell>
                                        <TableCell>{record.clock_in ? format(new Date(record.clock_in), 'hh:mm a') : '-'}</TableCell>
                                        <TableCell>{record.clock_out ? format(new Date(record.clock_out), 'hh:mm a') : '-'}</TableCell>
                                        <TableCell>{getStatusBadge(record.status)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>
        </MainLayout>
    );
}
