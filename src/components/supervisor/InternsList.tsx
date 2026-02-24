import { useAssignedInterns } from '@/hooks/useEvaluations';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, ClipboardCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

const statusColors: Record<string, string> = {
  active: 'bg-hrms-success text-white',
  inactive: 'bg-muted-foreground text-white',
  on_leave: 'bg-hrms-warning text-white',
  terminated: 'bg-destructive text-white',
};

interface InternsListProps {
  supervisorId: string;
  onEvaluate?: (internId: string) => void;
}

export function InternsList({ supervisorId, onEvaluate }: InternsListProps) {
  const { data: interns = [], isLoading } = useAssignedInterns(supervisorId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (interns.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="p-4 rounded-full bg-muted mb-4">
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-1">No Interns Assigned</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            No interns are currently assigned to you. Contact your administrator to assign interns.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {interns.map((intern) => {
        const initials = `${intern.first_name[0]}${intern.last_name[0]}`.toUpperCase();
        return (
          <Card key={intern.id} className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-all">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Avatar className="h-12 w-12 border-2 border-card">
                  <AvatarImage src={intern.avatar_url || ''} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm truncate">{intern.first_name} {intern.last_name}</h4>
                  <p className="text-xs text-muted-foreground truncate">{intern.job_title || 'Intern'}</p>
                  <p className="text-xs text-muted-foreground truncate">{intern.department?.name || 'Unassigned'}</p>
                </div>
                <Badge className={cn("text-[9px] font-bold uppercase px-2 rounded-full shrink-0", statusColors[intern.status] || 'bg-muted')}>
                  {intern.status}
                </Badge>
              </div>
              {onEvaluate && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-3 gap-2 text-xs"
                  onClick={() => onEvaluate(intern.id)}
                >
                  <ClipboardCheck className="h-3.5 w-3.5" />
                  Evaluate
                </Button>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
