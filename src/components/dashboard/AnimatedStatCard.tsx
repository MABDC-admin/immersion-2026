import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface AnimatedStatCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  delay?: number;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function AnimatedStatCard({
  title,
  value,
  icon: Icon,
  color,
  bgColor,
  delay = 0,
  trend,
}: AnimatedStatCardProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const accentShell = useMemo(() => {
    if (bgColor.includes('success')) return 'border-emerald-200/80 bg-gradient-to-br from-emerald-500/12 via-background to-background';
    if (bgColor.includes('warning')) return 'border-amber-200/80 bg-gradient-to-br from-amber-500/14 via-background to-background';
    return 'border-orange-200/70 bg-gradient-to-br from-orange-500/12 via-background to-background';
  }, [bgColor]);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (!isVisible) return;

    const duration = 1000;
    const steps = 30;
    const stepValue = value / steps;
    let current = 0;
    let step = 0;

    const interval = setInterval(() => {
      step++;
      current = Math.min(Math.round(stepValue * step), value);
      setDisplayValue(current);

      if (step >= steps) {
        clearInterval(interval);
        setDisplayValue(value);
      }
    }, duration / steps);

    return () => clearInterval(interval);
  }, [value, isVisible]);

  return (
    <Card
      className={cn(
        'overflow-hidden border transition-all duration-500 hover:shadow-lg hover:scale-[1.02]',
        accentShell,
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={cn('rounded-2xl p-2.5 shadow-sm transition-all duration-300 animate-pulse-glow', bgColor)}>
          <Icon className={cn('h-5 w-5', color)} />
        </div>
      </CardHeader>
      <CardContent className="pt-1">
        <div className="flex items-end justify-between">
          <div className="text-3xl font-bold animate-count-up">{displayValue}</div>
          {trend && (
            <span
              className={cn(
                'text-xs font-medium px-2 py-1 rounded-full',
                trend.isPositive
                  ? 'bg-hrms-success/10 text-hrms-success'
                  : 'bg-destructive/10 text-destructive'
              )}
            >
              {trend.isPositive ? '+' : ''}{trend.value}%
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
