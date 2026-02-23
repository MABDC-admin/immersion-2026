import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useLeaveRequests, useUpdateLeaveStatus } from '@/hooks/useLeave';
import { CreateLeaveModal } from '@/components/leave/CreateLeaveModal';
import { useAuth } from '@/hooks/useAuth';
import { useCurrentEmployee } from '@/hooks/useEmployees';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const statusConfig = {
    pending: { label: 'Pending', variant: 'outline' as const, className: 'bg-hrms-warning/10 text-hrms-warning border-hrms-warning/20' },
    approved: { label: 'Approved', variant: 'default' as const, className: 'bg-hrms-success/10 text-hrms-success border-hrms-success/20' },
    rejected: { label: 'Rejected', variant: 'destructive' as const, className: 'bg-destructive/10 text-destructive border-destructive/20' },
    cancelled: { label: 'Cancelled', variant: 'secondary' as const, className: 'bg-muted text-muted-foreground border-muted' },
};

export default function LeaveRequests() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { user, isAdmin, userRole } = useAuth();
    const { data: employee } = useCurrentEmployee(user?.id || '');
    const isAdminOrHR = isAdmin || userRole === 'hr_manager';

    // Employees see only their own requests; admin/HR see all
    const { data: requests = [], isLoading } = useLeaveRequests(isAdminOrHR ? undefined : employee?.id);
    const updateStatus = useUpdateLeaveStatus();

    const handleAddNew = () => setIsModalOpen(true);

    const handleStatusUpdate = (id: string, status: 'approved' | 'rejected') => {
        updateStatus.mutate({ id, status });
    };

    return (
        <MainLayout onAddNew={handleAddNew}>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Leave Requests</h1>
                    <p className="text-muted-foreground">
                        {isAdminOrHR ? 'View and manage employee leave requests.' : 'View your leave requests.'}
                    </p>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : requests.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-96 border-2 border-dashed rounded-lg text-center p-8">
                        <p className="text-muted-foreground mb-4">No leave requests found.</p>
                        <Button onClick={handleAddNew}>Request Leave</Button>
                    </div>
                ) : (
                    <div className="border rounded-lg overflow-hidden bg-card">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    {isAdminOrHR && <TableHead>Employee</TableHead>}
                                    <TableHead>Type</TableHead>
                                    <TableHead>Duration</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Requested On</TableHead>
                                    {isAdminOrHR && <TableHead className="text-right">Actions</TableHead>}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {requests.map((request) => {
                                    const config = statusConfig[request.status];
                                    return (
                                        <TableRow key={request.id}>
                                            {isAdminOrHR && (
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarImage src={request.employee?.avatar_url} />
                                                            <AvatarFallback>
                                                                {request.employee?.first_name[0]}
                                                                {request.employee?.last_name[0]}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <span className="font-medium">
                                                            {request.employee?.first_name} {request.employee?.last_name}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                            )}
                                            <TableCell>{request.leave_type}</TableCell>
                                            <TableCell>
                                                <div className="text-sm">
                                                    {format(new Date(request.start_date), 'MMM dd')} - {format(new Date(request.end_date), 'MMM dd, yyyy')}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={config.variant} className={config.className}>
                                                    {config.label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-sm">
                                                {format(new Date(request.created_at), 'MMM dd, p')}
                                            </TableCell>
                                            {isAdminOrHR && (
                                                <TableCell className="text-right">
                                                    {request.status === 'pending' && (
                                                        <div className="flex justify-end gap-2">
                                                            <Button
                                                                variant="ghost" size="icon"
                                                                className="text-hrms-success hover:text-hrms-success hover:bg-hrms-success/10"
                                                                onClick={() => handleStatusUpdate(request.id, 'approved')}
                                                                disabled={updateStatus.isPending}
                                                            >
                                                                <CheckCircle className="h-5 w-5" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost" size="icon"
                                                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                                onClick={() => handleStatusUpdate(request.id, 'rejected')}
                                                                disabled={updateStatus.isPending}
                                                            >
                                                                <XCircle className="h-5 w-5" />
                                                            </Button>
                                                        </div>
                                                    )}
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>

            <CreateLeaveModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                employeeId={isAdminOrHR ? undefined : employee?.id}
            />
        </MainLayout>
    );
}
