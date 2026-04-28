import React from 'react';
import {
    MoreVertical,
    Edit2,
    Trash2,
    ExternalLink,
    Mail,
    Building2,
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
import { getEmployeeDepartmentName } from '@/lib/departments';
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
    active: 'border-emerald-200 bg-emerald-100 text-emerald-800',
    inactive: 'border-slate-200 bg-slate-100 text-slate-700',
    on_leave: 'border-amber-200 bg-amber-100 text-amber-800',
    terminated: 'border-rose-200 bg-rose-100 text-rose-800',
};

const statusLabels = {
    active: 'Active',
    inactive: 'Inactive',
    on_leave: 'On Leave',
    terminated: 'Terminated',
};

const TABLE_ACCENTS = [
    {
        row: 'hover:bg-orange-50/60',
        avatar: 'border-orange-200 bg-orange-100 text-orange-800',
        icon: 'text-orange-700',
    },
    {
        row: 'hover:bg-cyan-50/60',
        avatar: 'border-cyan-200 bg-cyan-100 text-cyan-800',
        icon: 'text-cyan-700',
    },
    {
        row: 'hover:bg-violet-50/60',
        avatar: 'border-violet-200 bg-violet-100 text-violet-800',
        icon: 'text-violet-700',
    },
    {
        row: 'hover:bg-emerald-50/60',
        avatar: 'border-emerald-200 bg-emerald-100 text-emerald-800',
        icon: 'text-emerald-700',
    },
] as const;

export const EmployeeTable = ({ employees, readOnly = false, onEdit, onDelete, onView }: EmployeeTableProps) => {
    return (
        <div className="overflow-hidden rounded-2xl border border-cyan-200 bg-gradient-to-br from-cyan-50/50 via-white to-orange-50/40 shadow-sm">
            <Table>
                <TableHeader>
                    <TableRow className="border-cyan-100 bg-white/80">
                        <TableHead className="w-[300px]">Intern</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {employees.map((employee, index) => {
                        const fullName = `${employee.first_name} ${employee.last_name}`;
                        const initials = `${employee.first_name[0]}${employee.last_name[0]}`.toUpperCase();
                        const accent = TABLE_ACCENTS[index % TABLE_ACCENTS.length];

                        return (
                            <TableRow key={employee.id} className={`group border-cyan-100 bg-white/70 transition-colors ${accent.row}`}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar className={`h-10 w-10 border ${accent.avatar}`}>
                                            <AvatarImage src={employee.avatar_url || ''} alt={fullName} />
                                            <AvatarFallback className={`font-medium ${accent.avatar}`}>
                                                {initials}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col">
                                            <span className="font-medium text-foreground">{fullName}</span>
                                            <span className="text-xs text-muted-foreground">{employee.job_title || 'Intern'}</span>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Building2 className={`h-4 w-4 ${accent.icon}`} />
                                        <span>{getEmployeeDepartmentName(employee)}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className={cn(statusColors[employee.status])}>
                                        {statusLabels[employee.status]}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <Mail className={`h-3 w-3 ${accent.icon}`} />
                                            <span>{employee.email}</span>
                                        </div>
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
                                                                <AlertDialogTitle>Delete Intern Account</AlertDialogTitle>
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
