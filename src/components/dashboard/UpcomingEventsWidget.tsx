import { Cake, Calendar, Gift } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useEvents } from '@/hooks/useEmployees';
import { format } from 'date-fns';

const eventConfig = {
  birthday: { icon: Cake, color: 'text-pink-500', bgColor: 'bg-pink-500/10' },
  anniversary: { icon: Gift, color: 'text-primary', bgColor: 'bg-primary/10' },
  holiday: { icon: Calendar, color: 'text-hrms-success', bgColor: 'bg-hrms-success/10' },
};

interface UpcomingEventsWidgetProps {
  className?: string;
}

export function UpcomingEventsWidget({ className }: UpcomingEventsWidgetProps) {
  const { data: events = [], isLoading } = useEvents();

  return (
    <Card className={cn('animate-fade-in border-violet-200/70 bg-gradient-to-br from-violet-500/[0.08] via-background to-background shadow-sm', className)} style={{ animationDelay: '500ms' }}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Upcoming Events</CardTitle>
        <p className="text-sm text-muted-foreground">Upcoming dates and milestones that deserve attention.</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-8 h-8 bg-muted rounded-full" />
                  <div className="flex-1 h-4 bg-muted rounded w-3/4" />
                </div>
              ))}
            </div>
          ) : events.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No upcoming events</p>
          ) : (
            events.map((event, index) => {
              const config = eventConfig[event.type] || eventConfig.holiday;
              const Icon = config.icon;

              return (
                <div
                  key={event.id}
                  className="flex items-center gap-3 rounded-2xl border border-white/60 bg-white/70 p-3 transition-colors hover:bg-white/90 animate-fade-in"
                  style={{ animationDelay: `${600 + index * 100}ms` }}
                >
                  <div className={cn('p-2 rounded-full', config.bgColor)}>
                    <Icon className={cn('h-4 w-4', config.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{event.title}</p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {format(new Date(event.date), 'MMM dd')}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
