import { MainLayout } from '@/components/layout/MainLayout';
import { useOnboardingChecklists } from '@/hooks/useOnboarding';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, ArrowRight } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

export default function Checklists() {
    const { data: checklists = [], isLoading } = useOnboardingChecklists();

    const getStatusBadge = (status: string) => {
        switch (status.toLowerCase()) {
            case 'completed':
                return <Badge className="bg-hrms-success/10 text-hrms-success border-hrms-success/20">Completed</Badge>;
            case 'in_progress':
                return <Badge className="bg-hrms-primary/10 text-hrms-primary border-hrms-primary/20">In Progress</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const calculateProgress = (items: any[] = []) => {
        if (items.length === 0) return 0;
        const completed = items.filter(item => item.is_completed).length;
        return Math.round((completed / items.length) * 100);
    };

    return (
        <MainLayout onAddNew={() => { }}>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Onboarding Checklists</h1>
                        <p className="text-muted-foreground">Monitor and manage onboarding progress for new hires.</p>
                    </div>
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
                                    <TableHead>Checklist Title</TableHead>
                                    <TableHead>Progress</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {checklists.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                                            No onboarding checklists found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    checklists.map((checklist) => {
                                        const progress = calculateProgress(checklist.items);
                                        return (
                                            <TableRow key={checklist.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Avatar className="h-6 w-6">
                                                            <AvatarFallback>
                                                                {checklist.employee?.first_name?.[0]}
                                                                {checklist.employee?.last_name?.[0]}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <span className="font-medium">{checklist.employee?.first_name} {checklist.employee?.last_name}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{checklist.title}</TableCell>
                                                <TableCell className="w-1/4">
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                                            <span>{progress}% complete</span>
                                                            <span>{checklist.items?.filter(i => i.is_completed).length}/{checklist.items?.length || 0} tasks</span>
                                                        </div>
                                                        <Progress value={progress} className="h-2" />
                                                    </div>
                                                </TableCell>
                                                <TableCell>{getStatusBadge(checklist.status)}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="sm">
                                                        <ArrowRight className="h-4 w-4 mr-2" />
                                                        Details
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>
        </MainLayout>
    );
}
