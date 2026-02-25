import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useLeaveRequests, useUpdateLeaveStatus, useLeaveBalances } from '@/hooks/useLeave';
import { CreateLeaveModal } from '@/components/leave/CreateLeaveModal';
import { LeaveBalanceCards } from '@/components/leave/LeaveBalanceCards';
import { useAuth } from '@/hooks/useAuth';
import { useCurrentEmployee } from '@/hooks/useEmployees';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { Loader2, CheckCircle, XCircle, Plus, Paperclip, ExternalLink } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { LeaveRequest, LeaveStatus } from '@/types/employee';

const statusConfig: Record<LeaveStatus, { label: string; variant: 'outline' | 'default' | 'destructive' | 'secondary'; className: string }> = {
    pending: { label: 'Pending', variant: 'outline', className: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
    approved: { label: 'Approved', variant: 'default', className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
    rejected: { label: 'Rejected', variant: 'destructive', className: 'bg-destructive/10 text-destructive border-destructive/20' },
    cancelled: { label: 'Cancelled', variant: 'secondary', className: 'bg-muted text-muted-foreground border-muted' },
};

function LeaveTable({ requests, isAdminOrHR, onStatusUpdate, isPending }: {
    requests: LeaveRequest[];
    isAdminOrHR: boolean;
    onStatusUpdate: (id: string, status: 'approved' | 'rejected') => void;
    isPending: boolean;
}) {
    if (requests.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <p className="text-muted-foreground">No leave requests in this category.</p>
            </div>
        );
    }

    return (
        <div className="border rounded-lg overflow-hidden bg-card">
            <Table>
                <TableHeader>
                    <TableRow>
                        {isAdminOrHR && <TableHead>Employee</TableHead>}
                        <TableHead>Type</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Requested On</TableHead>
                        <TableHead>Attachment</TableHead>
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
                                                <AvatarFallback className="text-xs">
                                                    {request.employee?.first_name?.[0]}
                                                    {request.employee?.last_name?.[0]}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="font-medium text-sm">
                                                {request.employee?.first_name} {request.employee?.last_name}
                                            </span>
                                        </div>
                                    </TableCell>
                                )}
                                <TableCell className="font-medium">{request.leave_type}</TableCell>
                                <TableCell>
                                    <div className="text-sm">
                                        {format(new Date(request.start_date), 'MMM dd')} – {format(new Date(request.end_date), 'MMM dd, yyyy')}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span className="text-sm text-muted-foreground truncate max-w-[150px] block">
                                        {request.reason || '—'}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={config.variant} className={config.className}>
                                        {config.label}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-muted-foreground text-sm">
                                    {format(new Date(request.created_at), 'MMM dd, p')}
                                </TableCell>
                                <TableCell>
                                    {request.attachment_url ? (
                                        <a href={request.attachment_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline text-sm">
                                            <Paperclip className="h-3 w-3" />
                                            <ExternalLink className="h-3 w-3" />
                                        </a>
                                    ) : (
                                        <span className="text-muted-foreground text-sm">—</span>
                                    )}
                                </TableCell>
                                {isAdminOrHR && (
                                    <TableCell className="text-right">
                                        {request.status === 'pending' && (
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost" size="icon"
                                                    className="text-emerald-600 hover:text-emerald-600 hover:bg-emerald-500/10 h-8 w-8"
                                                    onClick={() => onStatusUpdate(request.id, 'approved')}
                                                    disabled={isPending}
                                                    title="Approve"
                                                >
                                                    <CheckCircle className="h-5 w-5" />
                                                </Button>
                                                <Button
                                                    variant="ghost" size="icon"
                                                    className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                                                    onClick={() => onStatusUpdate(request.id, 'rejected')}
                                                    disabled={isPending}
                                                    title="Reject"
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
    );
}

export default function LeaveRequests() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { user, isAdmin, userRole } = useAuth();
    const { data: employee } = useCurrentEmployee(user?.id || '');
    const isAdminOrHR = isAdmin || userRole === 'hr_manager';

    const { data: requests = [], isLoading } = useLeaveRequests(isAdminOrHR ? undefined : employee?.id);
    const { data: balances = [], isLoading: balancesLoading } = useLeaveBalances(employee?.id);
    const updateStatus = useUpdateLeaveStatus();

    const handleAddNew = () => setIsModalOpen(true);

    const handleStatusUpdate = (id: string, status: 'approved' | 'rejected') => {
        updateStatus.mutate({ id, status });
    };

    const pendingRequests = requests.filter(r => r.status === 'pending');
    const approvedRequests = requests.filter(r => r.status === 'approved');
    const rejectedRequests = requests.filter(r => r.status === 'rejected');

    return (
        <MainLayout onAddNew={handleAddNew}>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Leave Management</h1>
                        <p className="text-muted-foreground">
                            {isAdminOrHR ? 'Manage team leave requests and approvals.' : 'Track your leave balances and requests.'}
                        </p>
                    </div>
                    <Button onClick={handleAddNew} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Request Leave
                    </Button>
                </div>

                {/* Balance Cards - show for employees */}
                {!isAdminOrHR && (
                    <LeaveBalanceCards balances={balances} isLoading={balancesLoading} />
                )}

                {/* HR Summary Cards */}
                {isAdminOrHR && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Card>
                            <CardContent className="p-4 flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                                    <span className="text-amber-600 font-bold text-lg">{pendingRequests.length}</span>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-foreground">Pending</p>
                                    <p className="text-xs text-muted-foreground">Awaiting approval</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4 flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                    <span className="text-emerald-600 font-bold text-lg">{approvedRequests.length}</span>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-foreground">Approved</p>
                                    <p className="text-xs text-muted-foreground">This period</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4 flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                                    <span className="text-destructive font-bold text-lg">{rejectedRequests.length}</span>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-foreground">Rejected</p>
                                    <p className="text-xs text-muted-foreground">This period</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Tabbed Requests */}
                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <Tabs defaultValue="all" className="w-full">
                        <TabsList>
                            <TabsTrigger value="all">
                                All <Badge variant="secondary" className="ml-1.5 text-xs">{requests.length}</Badge>
                            </TabsTrigger>
                            <TabsTrigger value="pending">
                                Pending <Badge variant="secondary" className="ml-1.5 text-xs bg-amber-500/10 text-amber-600">{pendingRequests.length}</Badge>
                            </TabsTrigger>
                            <TabsTrigger value="approved">
                                Approved <Badge variant="secondary" className="ml-1.5 text-xs bg-emerald-500/10 text-emerald-600">{approvedRequests.length}</Badge>
                            </TabsTrigger>
                            <TabsTrigger value="rejected">
                                Rejected <Badge variant="secondary" className="ml-1.5 text-xs bg-destructive/10 text-destructive">{rejectedRequests.length}</Badge>
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="all">
                            <LeaveTable requests={requests} isAdminOrHR={isAdminOrHR} onStatusUpdate={handleStatusUpdate} isPending={updateStatus.isPending} />
                        </TabsContent>
                        <TabsContent value="pending">
                            <LeaveTable requests={pendingRequests} isAdminOrHR={isAdminOrHR} onStatusUpdate={handleStatusUpdate} isPending={updateStatus.isPending} />
                        </TabsContent>
                        <TabsContent value="approved">
                            <LeaveTable requests={approvedRequests} isAdminOrHR={isAdminOrHR} onStatusUpdate={handleStatusUpdate} isPending={updateStatus.isPending} />
                        </TabsContent>
                        <TabsContent value="rejected">
                            <LeaveTable requests={rejectedRequests} isAdminOrHR={isAdminOrHR} onStatusUpdate={handleStatusUpdate} isPending={updateStatus.isPending} />
                        </TabsContent>
                    </Tabs>
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
