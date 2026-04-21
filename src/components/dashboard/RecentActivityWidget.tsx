import { UserPlus, UserMinus, Clock, Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useActivities } from '@/hooks/useEmployees';
import { formatDistanceToNow } from 'date-fns';

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
  const { data: activities = [], isLoading } = useActivities();

  return (
    <Card className={cn('animate-fade-in border-orange-200/70 bg-gradient-to-br from-orange-500/[0.08] via-background to-background shadow-sm', className)} style={{ animationDelay: '400ms' }}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Recent Activity</CardTitle>
        <p className="text-sm text-muted-foreground">Latest updates across records, staffing changes, and operational edits.</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-8 h-8 bg-muted rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-muted rounded w-3/4" />
                    <div className="h-2 bg-muted rounded w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : activities.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
          ) : (
            activities.map((activity, index) => {
              const config = activityConfig[activity.type] || activityConfig.update;
              const Icon = config.icon;

              return (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 rounded-2xl border border-white/60 bg-white/70 px-3 py-3 animate-fade-in"
                  style={{ animationDelay: `${500 + index * 100}ms` }}
                >
                  <div className={cn('p-2 rounded-full', config.bgColor)}>
                    <Icon className={cn('h-4 w-4', config.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">{activity.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
