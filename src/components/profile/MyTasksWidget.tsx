import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Clock, BookOpen, AlertCircle } from 'lucide-react';
import { LeaveRequest } from '@/types/employee';
import { Enrollment } from '@/hooks/useTraining';

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
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">My Tasks</CardTitle>
                <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-3">
                {tasks.length === 0 ? (
                    <div className="text-center py-6">
                        <CheckCircle2 className="h-10 w-10 text-hrms-success/20 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">All caught up!</p>
                    </div>
                ) : (
                    tasks.map((task) => (
                        <div key={task.id} className="flex items-center justify-between p-3 rounded-md border bg-card hover:bg-accent transition-colors cursor-pointer">
                            <div className="flex items-center gap-3">
                                <task.icon className={`h-4 w-4 ${task.color}`} />
                                <span className="text-sm font-medium">{task.title}</span>
                            </div>
                            <AlertCircle className="h-4 w-4 text-muted-foreground opacity-20" />
                        </div>
                    ))
                )}
            </CardContent>
        </Card>
    );
}
