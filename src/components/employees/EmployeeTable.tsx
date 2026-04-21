import React from 'react';
import {
    MoreVertical,
    Edit2,
    Trash2,
    ExternalLink,
    Phone,
    Mail,
    Building2,
    MapPin
} from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import type { EmployeeWithRelations } from '@/types/employee';

interface EmployeeTableProps {
    employees: EmployeeWithRelations[];
    readOnly?: boolean;
    onEdit: (employee: EmployeeWithRelations) => void;
    onDelete: (id: string) => void;
    onView: (id: string) => void;
}

const statusColors = {
    active: 'bg-hrms-success text-white',
    inactive: 'bg-muted-foreground text-white',
    on_leave: 'bg-hrms-warning text-white',
    terminated: 'bg-destructive text-white',
};

const statusLabels = {
    active: 'Active',
    inactive: 'Inactive',
    on_leave: 'On Leave',
    terminated: 'Terminated',
};

export const EmployeeTable = ({ employees, readOnly = false, onEdit, onDelete, onView }: EmployeeTableProps) => {
    return (
        <div className="rounded-md border bg-card">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[300px]">Employee</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {employees.map((employee) => {
                        const fullName = `${employee.first_name} ${employee.last_name}`;
                        const initials = `${employee.first_name[0]}${employee.last_name[0]}`.toUpperCase();

                        return (
                            <TableRow key={employee.id} className="group transition-colors">
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={employee.avatar_url || ''} alt={fullName} />
                                            <AvatarFallback className="bg-muted text-foreground font-medium">
                                                {initials}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col">
                                            <span className="font-medium text-foreground">{fullName}</span>
                                            <span className="text-xs text-muted-foreground">{employee.job_title || 'Employee'}</span>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Building2 className="h-4 w-4 text-muted-foreground" />
                                        <span>{employee.department?.name || 'Unassigned'}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <MapPin className="h-4 w-4 text-muted-foreground" />
                                        <span>{employee.location?.city || 'Unassigned'}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge className={cn(statusColors[employee.status])}>
                                        {statusLabels[employee.status]}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <Mail className="h-3 w-3" />
                                            <span>{employee.email}</span>
                                        </div>
                                        {employee.phone && (
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <Phone className="h-3 w-3" />
                                                <span>{employee.phone}</span>
                                            </div>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted">
                                                <MoreVertical className="h-4 w-4" />
                                                <span className="sr-only">Open menu</span>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-[160px] bg-popover">
                                            <DropdownMenuItem onClick={() => onView(employee.id)} className="gap-2">
                                                <ExternalLink className="h-4 w-4" />
                                                View Details
                                            </DropdownMenuItem>
                                            {!readOnly && (
                                                <>
                                                    <DropdownMenuItem onClick={() => onEdit(employee)} className="gap-2 text-primary focus:text-primary">
                                                        <Edit2 className="h-4 w-4" />
                                                        Edit record
                                                    </DropdownMenuItem>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <DropdownMenuItem
                                                                onSelect={(e) => e.preventDefault()}
                                                                className="gap-2 text-destructive focus:text-destructive"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                                Delete
                                                            </DropdownMenuItem>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent className="bg-card border-border">
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Delete Employee Account</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    Are you sure you want to delete {fullName}'s record? This action cannot be undone and will remove all associated data.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    onClick={() => onDelete(employee.id)}
                                                                    className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-medium"
                                                                >
                                                                    Delete Account
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
};
