import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAssignedInterns } from '@/hooks/useEvaluations';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Users, ClipboardCheck, Clock, LogIn, LogOut, ChevronDown, FileText, CalendarDays, Timer, QrCode, Download, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, differenceInMinutes } from 'date-fns';
import { QRCodeSVG } from 'qrcode.react';

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

function useInternAttendanceHistory(internId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['intern-attendance-history', internId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('employee_id', internId)
        .order('date', { ascending: false })
        .limit(30);
      if (error) throw error;
      return data || [];
    },
    enabled,
  });
}

function useInternAttendanceTotal(internId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['intern-attendance-total', internId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('employee_id', internId);
      if (error) throw error;
      return data || [];
    },
    enabled,
  });
}

function useInternResume(email: string, enabled: boolean) {
  return useQuery({
    queryKey: ['intern-resume', email],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('candidates')
        .select('resume_url')
        .eq('email', email)
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data?.resume_url || null;
    },
    enabled,
  });
}

function calculateTotalHours(records: any[]): { totalMinutes: number; totalHoursStr: string } {
  let totalMinutes = 0;
  records.forEach((r) => {
    if (r.clock_in && r.clock_out) {
      totalMinutes += differenceInMinutes(new Date(r.clock_out), new Date(r.clock_in));
    }
  });
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return { totalMinutes, totalHoursStr: `${hours}h ${mins}m` };
}

// Target OJT hours (configurable)
const TARGET_HOURS = 80;

function InternQRCode({ intern, supervisorId }: { intern: any; supervisorId: string }) {
  const qrRef = useRef<HTMLDivElement>(null);
  const qrValue = JSON.stringify({ employeeId: intern.id, supervisorId });

  const handleDownload = useCallback(() => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      ctx?.drawImage(img, 0, 0, 300, 300);
      const a = document.createElement('a');
      a.download = `qr-${intern.first_name}-${intern.last_name}.png`;
      a.href = canvas.toDataURL('image/png');
      a.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  }, [intern]);

  return (
    <div className="flex flex-col items-center gap-2 p-3 rounded-lg border border-border bg-muted/30">
      <div ref={qrRef}>
        <QRCodeSVG value={qrValue} size={160} level="M" />
      </div>
      <p className="text-[10px] text-muted-foreground text-center">
        {intern.first_name} {intern.last_name}
      </p>
      <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={handleDownload}>
        <Download className="h-3 w-3" /> Download QR
      </Button>
    </div>
  );
}

function InternExpandedSection({ intern, supervisorId }: { intern: any; supervisorId: string }) {
  const { data: historyRecords = [], isLoading: historyLoading } = useInternAttendanceHistory(intern.id, true);
  const { data: totalRecords = [] } = useInternAttendanceTotal(intern.id, true);
  const { data: resumeUrl, isLoading: resumeLoading } = useInternResume(intern.email, true);
  const { totalMinutes, totalHoursStr } = calculateTotalHours(totalRecords);
  const progressPercent = Math.min((totalMinutes / 60 / TARGET_HOURS) * 100, 100);

  return (
    <div className="mt-3 pt-3 border-t border-border space-y-4 animate-fade-in">
      {/* QR Code */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <QrCode className="h-4 w-4 text-primary" />
          <h5 className="text-sm font-semibold text-foreground">QR Code</h5>
        </div>
        <InternQRCode intern={intern} supervisorId={supervisorId} />
      </div>

      {/* Total Hours Progress */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Timer className="h-4 w-4 text-primary" />
          <h5 className="text-sm font-semibold text-foreground">Total Hours Rendered</h5>
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{totalHoursStr} completed</span>
            <span>{TARGET_HOURS}h target</span>
          </div>
          <Progress value={progressPercent} className="h-3" />
          <p className="text-xs text-muted-foreground text-right">{progressPercent.toFixed(1)}% complete</p>
        </div>
      </div>

      {/* CV / Resume */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          <h5 className="text-sm font-semibold text-foreground">CV / Resume</h5>
        </div>
        {resumeLoading ? (
          <div className="h-20 flex items-center justify-center">
            <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : resumeUrl ? (
          <div className="rounded-lg border border-border overflow-hidden bg-muted/30">
            <iframe
              src={resumeUrl}
              className="w-full h-[400px]"
              title={`${intern.first_name}'s CV`}
            />
            <div className="p-2 border-t border-border flex justify-end">
              <a
                href={resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline font-medium"
              >
                Open Full CV ↗
              </a>
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic">No CV uploaded.</p>
        )}
      </div>

      {/* Attendance Records */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-primary" />
          <h5 className="text-sm font-semibold text-foreground">Attendance Records</h5>
          <Badge variant="secondary" className="text-[10px] ml-auto">{historyRecords.length} records</Badge>
        </div>
        {historyLoading ? (
          <div className="h-16 flex items-center justify-center">
            <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : historyRecords.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">No attendance records found.</p>
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            <div className="max-h-[240px] overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="text-left p-2 font-semibold text-muted-foreground">Date</th>
                    <th className="text-left p-2 font-semibold text-muted-foreground">Status</th>
                    <th className="text-left p-2 font-semibold text-muted-foreground">Clock In</th>
                    <th className="text-left p-2 font-semibold text-muted-foreground">Clock Out</th>
                    <th className="text-right p-2 font-semibold text-muted-foreground">Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {historyRecords.map((record: any) => {
                    const hrs = record.clock_in && record.clock_out
                      ? (differenceInMinutes(new Date(record.clock_out), new Date(record.clock_in)) / 60).toFixed(1)
                      : '-';
                    return (
                      <tr key={record.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                        <td className="p-2 font-medium">{format(new Date(record.date), 'MMM d, yyyy')}</td>
                        <td className="p-2">
                          <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border", attendanceStatusColors[record.status] || attendanceStatusColors.no_record)}>
                            {record.status}
                          </span>
                        </td>
                        <td className="p-2 text-muted-foreground">{record.clock_in ? format(new Date(record.clock_in), 'h:mm a') : '-'}</td>
                        <td className="p-2 text-muted-foreground">{record.clock_out ? format(new Date(record.clock_out), 'h:mm a') : '-'}</td>
                        <td className="p-2 text-right font-medium">{hrs}h</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function InternsList({ supervisorId, onEvaluate }: InternsListProps) {
  const navigate = useNavigate();
  const { data: interns = [], isLoading } = useAssignedInterns(supervisorId);
  const internIds = interns.map((i: any) => i.id);
  const { data: attendanceRecords = [] } = useInternsAttendance(internIds);
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
        const isExpanded = expandedId === intern.id;

        return (
          <Card
            key={intern.id}
            className={cn(
              "border-l-4 border-l-primary shadow-sm transition-all",
              isExpanded ? "shadow-md" : "hover:shadow-md"
            )}
          >
            <CardContent className="p-4">
              <div
                className="flex items-center gap-4 cursor-pointer select-none"
                onClick={() => setExpandedId(isExpanded ? null : intern.id)}
              >
                <Avatar className="h-10 w-10 border-2 border-card shrink-0">
                  <AvatarImage src={intern.avatar_url || ''} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">{initials}</AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4
                      className="font-bold text-sm truncate hover:text-primary cursor-pointer transition-colors"
                      onClick={(e) => { e.stopPropagation(); navigate(`/journal/${intern.id}`); }}
                    >
                      {intern.first_name} {intern.last_name}
                    </h4>
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

                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs h-8"
                    onClick={(e) => { e.stopPropagation(); navigate(`/journal/${intern.id}`); }}
                  >
                    <BookOpen className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Journal</span>
                  </Button>
                  {onEvaluate && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-xs h-8 border-hrms-success/20 hover:bg-hrms-success/5 hover:text-hrms-success"
                      onClick={(e) => { e.stopPropagation(); onEvaluate(intern.id); }}
                    >
                      <ClipboardCheck className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Evaluate</span>
                    </Button>
                  )}
                </div>

                <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform duration-200 shrink-0", isExpanded && "rotate-180")} />
              </div>

              {isExpanded && <InternExpandedSection intern={intern} supervisorId={supervisorId} />}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
