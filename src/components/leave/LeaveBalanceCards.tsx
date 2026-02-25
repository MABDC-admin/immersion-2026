import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { LeaveBalance } from '@/types/employee';
import { CalendarDays, AlertTriangle } from 'lucide-react';

const leaveTypeConfig: Record<string, { color: string; bgColor: string; icon: string }> = {
  'LOP': { color: 'text-destructive', bgColor: 'bg-destructive/10', icon: '⏸' },
  'Annual Leave': { color: 'text-primary', bgColor: 'bg-primary/10', icon: '🌴' },
  'Local Leave': { color: 'text-amber-600', bgColor: 'bg-amber-500/10', icon: '📍' },
};

interface LeaveBalanceCardsProps {
  balances: LeaveBalance[];
  isLoading?: boolean;
}

export function LeaveBalanceCards({ balances, isLoading }: LeaveBalanceCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-5">
              <div className="h-20 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (balances.length === 0) {
    return (
      <Card>
        <CardContent className="p-5 text-center text-muted-foreground">
          <CalendarDays className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No leave balances configured yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {balances.map((balance) => {
        const config = leaveTypeConfig[balance.leave_type] || {
          color: 'text-muted-foreground',
          bgColor: 'bg-muted',
          icon: '📋',
        };
        const usedPercentage = balance.total_days > 0
          ? (balance.used_days / balance.total_days) * 100
          : 0;
        const isLow = balance.remaining_days !== null && balance.remaining_days <= 3 && balance.remaining_days > 0;
        const isExhausted = balance.remaining_days !== null && balance.remaining_days <= 0;

        return (
          <Card key={balance.id} className="relative overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={`text-xl p-1.5 rounded-lg ${config.bgColor}`}>
                    {config.icon}
                  </span>
                  <div>
                    <h3 className="font-semibold text-sm text-foreground">{balance.leave_type}</h3>
                    <p className="text-xs text-muted-foreground">{balance.year}</p>
                  </div>
                </div>
                {(isLow || isExhausted) && (
                  <AlertTriangle className={`h-4 w-4 ${isExhausted ? 'text-destructive' : 'text-amber-500'}`} />
                )}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Remaining</span>
                  <span className={`font-bold ${isExhausted ? 'text-destructive' : isLow ? 'text-amber-500' : config.color}`}>
                    {balance.remaining_days ?? (balance.total_days - balance.used_days)} / {balance.total_days}
                  </span>
                </div>
                <Progress
                  value={usedPercentage}
                  className="h-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Used: {balance.used_days} days</span>
                  <span>Total: {balance.total_days} days</span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
