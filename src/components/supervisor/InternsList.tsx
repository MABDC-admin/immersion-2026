import { useAssignedInterns } from '@/hooks/useEvaluations';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, ClipboardCheck, Clock, LogIn, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const statusColors: Record<string, string> = {
  active: 'bg-hrms-success text-white',
  inactive: 'bg-muted-foreground text-white',
  on_leave: 'bg-hrms-warning text-white',
  terminated: 'bg-destructive text-white',
};

const attendanceStatusColors: Record<string, string> = {
  present: 'text-hrms-success border-hrms-success/30 bg-hrms-success/10',
  absent: 'text-destructive border-destructive/30 bg-destructive/10',
  late: 'text-hrms-warning border-hrms-warning/30 bg-hrms-warning/10',
  no_record: 'text-muted-foreground border-muted/30 bg-muted/10',
};

interface InternsListProps {
  supervisorId: string;
  onEvaluate?: (internId: string) => void;
}

function useInternsAttendance(internIds: string[]) {
  const today = new Date().toISOString().split('T')[0];
  return useQuery({
    queryKey: ['interns-attendance', internIds, today],
    queryFn: async () => {
      if (internIds.length === 0) return [];
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .in('employee_id', internIds)
        .eq('date', today);
      if (error) throw error;
      return data || [];
    },
    enabled: internIds.length > 0,
  });
}

export function InternsList({ supervisorId, onEvaluate }: InternsListProps) {
  const { data: interns = [], isLoading } = useAssignedInterns(supervisorId);
  const internIds = interns.map((i: any) => i.id);
  const { data: attendanceRecords = [] } = useInternsAttendance(internIds);

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
    <div className="space-y-3">
      {interns.map((intern: any) => {
        const initials = `${intern.first_name[0]}${intern.last_name[0]}`.toUpperCase();
        const attendance = attendanceRecords.find((a: any) => a.employee_id === intern.id);
        const attendanceStatus = attendance?.status || 'no_record';
        const clockIn = attendance?.clock_in ? format(new Date(attendance.clock_in), 'h:mm a') : null;
        const clockOut = attendance?.clock_out ? format(new Date(attendance.clock_out), 'h:mm a') : null;

        return (
          <Card key={intern.id} className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-all">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-10 w-10 border-2 border-card shrink-0">
                  <AvatarImage src={intern.avatar_url || ''} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">{initials}</AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm truncate">{intern.first_name} {intern.last_name}</h4>
                    <Badge className={cn("text-[9px] font-bold uppercase px-2 rounded-full shrink-0", statusColors[intern.status] || 'bg-muted')}>
                      {intern.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{intern.job_title || 'Intern'} • {intern.department?.name || 'Unassigned'}</p>
                </div>

                {/* Attendance status */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase", attendanceStatusColors[attendanceStatus])}>
                    <Clock className="h-3 w-3" />
                    {attendanceStatus === 'no_record' ? 'No Record' : attendanceStatus}
                  </div>
                  {clockIn && (
                    <div className="hidden sm:flex items-center gap-1 text-[10px] text-muted-foreground">
                      <LogIn className="h-3 w-3" />
                      {clockIn}
                    </div>
                  )}
                  {clockOut && (
                    <div className="hidden sm:flex items-center gap-1 text-[10px] text-muted-foreground">
                      <LogOut className="h-3 w-3" />
                      {clockOut}
                    </div>
                  )}
                </div>

                {onEvaluate && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs shrink-0"
                    onClick={() => onEvaluate(intern.id)}
                  >
                    <ClipboardCheck className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Evaluate</span>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
