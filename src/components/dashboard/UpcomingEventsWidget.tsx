import { Cake, Calendar, Gift } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface Event {
  id: string;
  type: 'birthday' | 'anniversary' | 'holiday';
  title: string;
  date: string;
}

// Mock data - in real app, this would come from an API
const mockEvents: Event[] = [
  { id: '1', type: 'birthday', title: 'John Doe\'s Birthday', date: 'Jan 28' },
  { id: '2', type: 'anniversary', title: 'Sarah Smith - 5 Years', date: 'Jan 29' },
  { id: '3', type: 'birthday', title: 'Mike Johnson\'s Birthday', date: 'Jan 30' },
  { id: '4', type: 'holiday', title: 'Company Holiday', date: 'Feb 1' },
];

const eventConfig = {
  birthday: { icon: Cake, color: 'text-pink-500', bgColor: 'bg-pink-500/10' },
  anniversary: { icon: Gift, color: 'text-primary', bgColor: 'bg-primary/10' },
  holiday: { icon: Calendar, color: 'text-hrms-success', bgColor: 'bg-hrms-success/10' },
};

interface UpcomingEventsWidgetProps {
  className?: string;
}

export function UpcomingEventsWidget({ className }: UpcomingEventsWidgetProps) {
  return (
    <Card className={cn('animate-fade-in', className)} style={{ animationDelay: '500ms' }}>
      <CardHeader>
        <CardTitle className="text-lg">Upcoming Events</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {mockEvents.map((event, index) => {
            const config = eventConfig[event.type];
            const Icon = config.icon;

            return (
              <div
                key={event.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors animate-fade-in"
                style={{ animationDelay: `${600 + index * 100}ms` }}
              >
                <div className={cn('p-2 rounded-full', config.bgColor)}>
                  <Icon className={cn('h-4 w-4', config.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{event.title}</p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{event.date}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
