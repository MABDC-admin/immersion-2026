import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAttendance, useClockIn, useClockOut, useTodayAttendance } from '@/hooks/useAttendance';
import { useAuth } from '@/hooks/useAuth';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Loader2, Play, Square, Clock } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Attendance() {
    const { user } = useAuth();
    const { data: attendance = [], isLoading } = useAttendance();
    const { data: todayRecord, isLoading: isLoadingToday } = useTodayAttendance(user?.id || '');
    const clockIn = useClockIn();
    const clockOut = useClockOut();

    const handleClockIn = () => {
        if (user?.id) {
            clockIn.mutate({ employeeId: user.id });
        }
    };

    const handleClockOut = () => {
        if (todayRecord?.id) {
            clockOut.mutate({ id: todayRecord.id });
        }
    };

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
                        <p className="text-muted-foreground">Track and manage employee attendance.</p>
                    </div>
                    <div className="flex gap-2">
                        {!todayRecord?.clock_in ? (
                            <Button onClick={handleClockIn} disabled={clockIn.isPending || isLoadingToday || !user}>
                                <Play className="h-4 w-4 mr-2" />
                                Clock In
                            </Button>
                        ) : !todayRecord?.clock_out ? (
                            <Button variant="destructive" onClick={handleClockOut} disabled={clockOut.isPending || isLoadingToday}>
                                <Square className="h-4 w-4 mr-2" />
                                Clock Out
                            </Button>
                        ) : (
                            <Button disabled variant="outline">
                                <Clock className="h-4 w-4 mr-2" />
                                Work Completed
                            </Button>
                        )}
                    </div>
                </div>

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
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="border rounded-lg overflow-hidden bg-card">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Employee</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Clock In</TableHead>
                                    <TableHead>Clock Out</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {attendance.map((record) => (
                                    <TableRow key={record.id}>
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
