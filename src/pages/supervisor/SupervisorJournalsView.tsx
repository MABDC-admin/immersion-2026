
import { useAssignedInterns } from '@/hooks/useEvaluations';
import { useAuth } from '@/hooks/useAuth';
import { useCurrentEmployee } from '@/hooks/useEmployees';
import { useJournalEntries } from '@/hooks/useJournal';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { format, parseISO } from 'date-fns';
import { BookOpen, CheckCircle2, Clock, MessageSquare, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

export default function SupervisorJournalsView() {
    const { user } = useAuth();
    const { data: employee } = useCurrentEmployee(user?.id || '');
    const supervisorId = employee?.id || '';
    const { data: interns = [] } = useAssignedInterns(supervisorId);
    const navigate = useNavigate();

    // In a real app, we'd have a hook to fetch journals for all assigned interns at once.
    // For now, we'll fetch from a generic hook or provide a list of interns to pick from.
    // Or better, we just show a "Select an Intern" view if not already showing something.

    return (
        <MainLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Intern Daily Journals</h1>
                    <p className="text-sm text-muted-foreground">Review and approve daily activities for your assigned interns</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-1 space-y-4">
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium">Assigned Interns</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y">
                                    {interns.map(intern => (
                                        <button
                                            key={intern.id}
                                            onClick={() => navigate(`/journal/${intern.id}`)}
                                            className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                                    {intern.first_name[0]}{intern.last_name[0]}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold">{intern.first_name} {intern.last_name}</p>
                                                    <p className="text-[10px] text-muted-foreground">{intern.department?.name || 'Unassigned'}</p>
                                                </div>
                                            </div>
                                            <Badge variant="outline" className="text-[10px]">
                                                View Journal
                                            </Badge>
                                        </button>
                                    ))}
                                    {interns.length === 0 && (
                                        <div className="p-8 text-center text-muted-foreground">
                                            <User className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                            <p className="text-sm">No interns assigned</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="md:col-span-2">
                        <Card className="border-dashed h-full flex items-center justify-center min-h-[400px]">
                            <CardContent className="text-center space-y-4">
                                <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                                    <BookOpen className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold">Select an Intern</h3>
                                    <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                                        Choose an intern from the list to review their daily activity logs and provide feedback.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
