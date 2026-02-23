import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Clock, BookOpen, AlertCircle, ArrowRight } from 'lucide-react';
import { LeaveRequest } from '@/types/employee';
import { Enrollment } from '@/hooks/useTraining';
import { cn } from '@/lib/utils';

interface MyTasksWidgetProps {
    pendingApprovals?: LeaveRequest[];
    incompleteRequiredCourses?: Enrollment[];
}

export function MyTasksWidget({ pendingApprovals = [], incompleteRequiredCourses = [] }: MyTasksWidgetProps) {
    const tasks = [
        ...pendingApprovals.map(req => ({
            id: req.id,
            title: `Approve leave for ${req.employee?.first_name}`,
            type: 'approval',
            icon: Clock,
            color: 'text-hrms-warning',
        })),
        ...incompleteRequiredCourses.map(enr => ({
            id: enr.id,
            title: `Complete course: ${enr.course?.title}`,
            type: 'training',
            icon: BookOpen,
            color: 'text-purple-500',
        }))
    ];

    return (
        <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">My Tasks</CardTitle>
                <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-3">
                {tasks.length === 0 ? (
                    <div className="text-center py-10 bg-muted/20 rounded-lg border border-dashed">
                        <div className="bg-hrms-success/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                            <CheckCircle2 className="h-8 w-8 text-hrms-success" />
                        </div>
                        <p className="text-sm font-semibold text-foreground">All caught up!</p>
                        <p className="text-xs text-muted-foreground mt-1">Enjoy your productive day.</p>
                    </div>
                ) : (
                    tasks.map((task) => (
                        <div key={task.id} className="flex items-center justify-between p-4 rounded-xl border bg-card hover:bg-accent transition-all cursor-pointer shadow-sm group">
                            <div className="flex items-center gap-4">
                                <div className={cn("p-2 rounded-lg bg-muted/50 group-hover:bg-background transition-colors")}>
                                    <task.icon className={cn("h-5 w-5", task.color)} />
                                </div>
                                <span className="text-sm font-semibold">{task.title}</span>
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground opacity-40 group-hover:translate-x-1 transition-transform" />
                        </div>
                    ))
                )}
            </CardContent>
        </Card>
    );
}
