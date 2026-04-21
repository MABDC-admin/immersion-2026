import { MainLayout } from '@/components/layout/MainLayout';
import { useEmployees } from '@/hooks/useEmployees';
import { useOnboardingChecklists } from '@/hooks/useOnboarding';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format, differenceInDays, parseISO } from 'date-fns';
import { Progress } from '@/components/ui/progress';

export default function NewHires() {
    const { data: employees = [], isLoading } = useEmployees();
    const { data: checklists = [] } = useOnboardingChecklists();

    // Employees hired in last 90 days
    const recentHires = employees.filter(e => {
        const daysAgo = differenceInDays(new Date(), parseISO(e.hire_date));
        return daysAgo <= 90;
    }).sort((a, b) => new Date(b.hire_date).getTime() - new Date(a.hire_date).getTime());

    const getChecklistProgress = (employeeId: string) => {
        const cl = checklists.find(c => c.employee_id === employeeId);
        if (!cl?.items?.length) return { progress: 0, status: 'pending' };
        const completed = cl.items.filter(i => i.is_completed).length;
        return { progress: Math.round((completed / cl.items.length) * 100), status: cl.status };
    };

    return (
        <MainLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">New Hires</h1>
                    <p className="text-muted-foreground">Track recently hired employees (last 90 days).</p>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                ) : recentHires.length === 0 ? (
                    <div className="flex items-center justify-center h-96 border-2 border-dashed rounded-lg">
                        <p className="text-muted-foreground">No new hires in the last 90 days.</p>
                    </div>
                ) : (
                    <div className="border rounded-lg overflow-hidden bg-card">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Intern</TableHead>
                                    <TableHead>Job Title</TableHead>
                                    <TableHead>Hire Date</TableHead>
                                    <TableHead>Days Since Hire</TableHead>
                                    <TableHead>Onboarding Progress</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recentHires.map(emp => {
                                    const { progress, status } = getChecklistProgress(emp.id);
                                    return (
                                        <TableRow key={emp.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarImage src={emp.avatar_url || ''} />
                                                        <AvatarFallback>{emp.first_name[0]}{emp.last_name[0]}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-medium">{emp.first_name} {emp.last_name}</p>
                                                        <p className="text-xs text-muted-foreground">{emp.email}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>{emp.job_title || '-'}</TableCell>
                                            <TableCell>{format(parseISO(emp.hire_date), 'MMM dd, yyyy')}</TableCell>
                                            <TableCell>{differenceInDays(new Date(), parseISO(emp.hire_date))} days</TableCell>
                                            <TableCell className="w-40">
                                                <div className="space-y-1">
                                                    <Progress value={progress} className="h-2" />
                                                    <span className="text-xs text-muted-foreground">{progress}%</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={status === 'completed' ? 'bg-green-500/10 text-green-600' : 'bg-primary/10 text-primary'}>
                                                    {status === 'completed' ? 'Completed' : 'In Progress'}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>
        </MainLayout>
    );
}
