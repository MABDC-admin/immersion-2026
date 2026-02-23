import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Announcement } from '@/hooks/useDashboard';
import { format } from 'date-fns';
import { Megaphone, Calendar, Info, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface AnnouncementsWidgetProps {
    announcements?: Announcement[];
    className?: string;
}

const categoryIcons = {
    general: Info,
    policy: AlertTriangle,
    event: Calendar,
    holiday: Megaphone,
};

const categoryColors = {
    general: 'bg-blue-500/10 text-blue-500',
    policy: 'bg-hrms-warning/10 text-hrms-warning',
    event: 'bg-purple-500/10 text-purple-500',
    holiday: 'bg-hrms-success/10 text-hrms-success',
};

export function AnnouncementsWidget({ announcements = [], className }: AnnouncementsWidgetProps) {
    return (
        <Card className={cn("shadow-sm hover:shadow-md transition-shadow duration-300", className)}>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Announcements</CardTitle>
                <Megaphone className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-4">
                {announcements.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No recent announcements</p>
                ) : (
                    announcements.map((item) => {
                        const Icon = categoryIcons[item.category as keyof typeof categoryIcons] || Info;
                        return (
                            <div key={item.id} className="flex gap-4 p-4 rounded-xl bg-card border shadow-sm transition-all hover:bg-muted/30">
                                <div className={cn(
                                    "p-2.5 rounded-full h-fit flex items-center justify-center shadow-sm",
                                    categoryColors[item.category as keyof typeof categoryColors] || categoryColors.general
                                )}>
                                    <Icon className="h-5 w-5" />
                                </div>
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-sm font-semibold">{item.title}</h4>
                                        <span className="text-xs text-muted-foreground">{format(new Date(item.created_at), 'MMM dd')}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground line-clamp-2">{item.content}</p>
                                    {item.author && (
                                        <p className="text-[10px] text-muted-foreground mt-2">
                                            Posted by: {item.author.first_name} {item.author.last_name}
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </CardContent>
        </Card>
    );
}
