import { UserPlus, UserMinus, Clock, Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface Activity {
  id: string;
  type: 'join' | 'leave' | 'update' | 'status';
  message: string;
  time: string;
}

// Mock data - in real app, this would come from an API
const mockActivities: Activity[] = [
  { id: '1', type: 'join', message: 'John Doe joined the Engineering team', time: '2 hours ago' },
  { id: '2', type: 'update', message: 'Sarah Smith updated her profile', time: '4 hours ago' },
  { id: '3', type: 'status', message: 'Mike Johnson is now on leave', time: '5 hours ago' },
  { id: '4', type: 'join', message: 'Emily Brown joined the Design team', time: '1 day ago' },
  { id: '5', type: 'leave', message: 'Alex Wilson left the company', time: '2 days ago' },
];

const activityConfig = {
  join: { icon: UserPlus, color: 'text-hrms-success', bgColor: 'bg-hrms-success/10' },
  leave: { icon: UserMinus, color: 'text-destructive', bgColor: 'bg-destructive/10' },
  update: { icon: Settings, color: 'text-primary', bgColor: 'bg-primary/10' },
  status: { icon: Clock, color: 'text-hrms-warning', bgColor: 'bg-hrms-warning/10' },
};

interface RecentActivityWidgetProps {
  className?: string;
}

export function RecentActivityWidget({ className }: RecentActivityWidgetProps) {
  return (
    <Card className={cn('animate-fade-in', className)} style={{ animationDelay: '400ms' }}>
      <CardHeader>
        <CardTitle className="text-lg">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockActivities.map((activity, index) => {
            const config = activityConfig[activity.type];
            const Icon = config.icon;

            return (
              <div
                key={activity.id}
                className="flex items-start gap-3 animate-fade-in"
                style={{ animationDelay: `${500 + index * 100}ms` }}
              >
                <div className={cn('p-2 rounded-full', config.bgColor)}>
                  <Icon className={cn('h-4 w-4', config.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">{activity.message}</p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
