import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAttendance } from '@/hooks/useAttendance';
import { useEmployees } from '@/hooks/useEmployees';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Clock } from 'lucide-react';
import { format, parseISO, differenceInMinutes } from 'date-fns';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export default function Timesheets() {
    const { data: attendance = [], isLoading } = useAttendance();
    const { data: employees = [] } = useEmployees();
    const [filterEmployee, setFilterEmployee] = useState<string>('all');

    const filtered = filterEmployee === 'all'
        ? attendance
        : attendance.filter(a => a.employee_id === filterEmployee);

    const calculateHours = (clockIn: string | null, clockOut: string | null) => {
        if (!clockIn || !clockOut) return '-';
        const mins = differenceInMinutes(new Date(clockOut), new Date(clockIn));
        const hours = Math.floor(mins / 60);
        const remaining = mins % 60;
        return `${hours}h ${remaining}m`;
    };

    const totalHours = filtered.reduce((acc, record) => {
        if (!record.clock_in || !record.clock_out) return acc;
        return acc + differenceInMinutes(new Date(record.clock_out), new Date(record.clock_in));
    }, 0);

    return (
        <MainLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Timesheets</h1>
                        <p className="text-muted-foreground">View and manage employee work hours.</p>
                    </div>
                    <Select value={filterEmployee} onValueChange={setFilterEmployee}>
                        <SelectTrigger className="w-56">
                            <SelectValue placeholder="Filter by employee" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Employees</SelectItem>
                            {employees.map(e => (
                                <SelectItem key={e.id} value={e.id}>{e.first_name} {e.last_name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Records</CardTitle></CardHeader>
                        <CardContent><p className="text-2xl font-bold">{filtered.length}</p></CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Hours</CardTitle></CardHeader>
                        <CardContent><p className="text-2xl font-bold">{Math.floor(totalHours / 60)}h {totalHours % 60}m</p></CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Avg Hours/Day</CardTitle></CardHeader>
                        <CardContent><p className="text-2xl font-bold">{filtered.length > 0 ? (totalHours / filtered.length / 60).toFixed(1) : '0'}h</p></CardContent>
                    </Card>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                ) : (
                    <div className="border rounded-lg overflow-hidden bg-card">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Employee</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Clock In</TableHead>
                                    <TableHead>Clock Out</TableHead>
                                    <TableHead>Total Hours</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.length === 0 ? (
                                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No timesheet records found.</TableCell></TableRow>
                                ) : (
                                    filtered.map(record => (
                                        <TableRow key={record.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="h-6 w-6">
                                                        <AvatarFallback>{record.employee?.first_name?.[0]}{record.employee?.last_name?.[0]}</AvatarFallback>
                                                    </Avatar>
                                                    <span>{record.employee?.first_name} {record.employee?.last_name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{format(parseISO(record.date), 'MMM dd, yyyy')}</TableCell>
                                            <TableCell>{record.clock_in ? format(new Date(record.clock_in), 'hh:mm a') : '-'}</TableCell>
                                            <TableCell>{record.clock_out ? format(new Date(record.clock_out), 'hh:mm a') : '-'}</TableCell>
                                            <TableCell className="font-medium"><Clock className="h-3 w-3 inline mr-1" />{calculateHours(record.clock_in, record.clock_out)}</TableCell>
                                            <TableCell><Badge variant="outline">{record.status}</Badge></TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>
        </MainLayout>
    );
}
