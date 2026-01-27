import { useNavigate } from 'react-router-dom';
import { UserPlus, FileText, Building2, Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const actions = [
  { icon: UserPlus, label: 'Add Employee', href: '/employees', action: 'add' },
  { icon: FileText, label: 'View Reports', href: '/dashboard' },
  { icon: Building2, label: 'Departments', href: '/dashboard' },
  { icon: Settings, label: 'Settings', href: '/dashboard' },
];

interface QuickActionsWidgetProps {
  className?: string;
  onAddEmployee?: () => void;
}

export function QuickActionsWidget({ className, onAddEmployee }: QuickActionsWidgetProps) {
  const navigate = useNavigate();

  const handleClick = (action: typeof actions[0]) => {
    if (action.action === 'add' && onAddEmployee) {
      onAddEmployee();
    } else {
      navigate(action.href);
    }
  };

  return (
    <Card className={cn('animate-fade-in', className)} style={{ animationDelay: '600ms' }}>
      <CardHeader>
        <CardTitle className="text-lg">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {actions.map((action, index) => (
            <Button
              key={action.label}
              variant="outline"
              className={cn(
                'h-auto flex-col gap-2 py-4 hover:scale-105 transition-transform animate-scale-in',
              )}
              style={{ animationDelay: `${700 + index * 100}ms` }}
              onClick={() => handleClick(action)}
            >
              <action.icon className="h-5 w-5 text-primary" />
              <span className="text-xs">{action.label}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
