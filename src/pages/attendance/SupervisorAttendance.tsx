import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCurrentEmployee } from '@/hooks/useEmployees';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Clock, Link as LinkIcon, Copy, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, differenceInMinutes } from 'date-fns';
import { toast } from 'sonner';

const statusColors: Record<string, string> = {
  present: 'text-hrms-success border-hrms-success/30 bg-hrms-success/10',
  absent: 'text-destructive border-destructive/30 bg-destructive/10',
  late: 'text-hrms-warning border-hrms-warning/30 bg-hrms-warning/10',
};

export default function SupervisorAttendance() {
  const { user } = useAuth();
  const { data: employee } = useCurrentEmployee(user?.id || '');
  const supervisorId = employee?.id;
  const [nameFilter, setNameFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [copied, setCopied] = useState(false);

  const { data: interns = [] } = useQuery({
    queryKey: ['supervisor-interns', supervisorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('id, first_name, last_name, avatar_url, job_title')
        .eq('manager_id', supervisorId!);
      if (error) throw error;
      return data || [];
    },
    enabled: !!supervisorId,
  });

  const internIds = interns.map((i) => i.id);

  const { data: attendanceRecords = [], isLoading } = useQuery({
    queryKey: ['supervisor-all-attendance', internIds, dateFilter],
    queryFn: async () => {
      if (internIds.length === 0) return [];
      let query = supabase
        .from('attendance')
        .select('*')
        .in('employee_id', internIds)
        .order('date', { ascending: false })
        .limit(500);
      if (dateFilter) {
        query = query.eq('date', dateFilter);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: internIds.length > 0,
  });

  const internMap = useMemo(() => {
    const map: Record<string, typeof interns[0]> = {};
    interns.forEach((i) => { map[i.id] = i; });
    return map;
  }, [interns]);

  const filteredRecords = useMemo(() => {
    if (!nameFilter) return attendanceRecords;
    const lower = nameFilter.toLowerCase();
    return attendanceRecords.filter((r: any) => {
      const intern = internMap[r.employee_id];
      if (!intern) return false;
      return `${intern.first_name} ${intern.last_name}`.toLowerCase().includes(lower);
    });
  }, [attendanceRecords, nameFilter, internMap]);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayCount = attendanceRecords.filter((r: any) => r.date === todayStr).length;

  const kioskUrl = supervisorId
    ? `${window.location.origin}/kiosk/${supervisorId}`
    : '';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(kioskUrl);
    setCopied(true);
    toast.success('Kiosk link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Intern Attendance</h1>
          <p className="text-sm text-muted-foreground">View time clock records for all your interns</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{interns.length}</p>
                <p className="text-xs text-muted-foreground">Total Interns</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="p-3 rounded-lg bg-hrms-success/10">
                <CheckCircle2 className="h-5 w-5 text-hrms-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{todayCount}</p>
                <p className="text-xs text-muted-foreground">Today's Records</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="p-3 rounded-lg bg-accent/50">
                <LinkIcon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-1">Kiosk Link</p>
                <p className="text-[10px] text-muted-foreground truncate">{kioskUrl}</p>
              </div>
              <Button variant="outline" size="sm" className="gap-1 text-xs shrink-0" onClick={handleCopyLink}>
                {copied ? <CheckCircle2 className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="Filter by intern name..."
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
            className="sm:max-w-xs"
          />
          <Input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="sm:max-w-[200px]"
          />
          {dateFilter && (
            <Button variant="ghost" size="sm" onClick={() => setDateFilter('')}>
              Clear date
            </Button>
          )}
        </div>

        {/* Attendance Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Clock className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No attendance records found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-3 font-semibold text-muted-foreground">Intern</th>
                      <th className="text-left p-3 font-semibold text-muted-foreground">Date</th>
                      <th className="text-left p-3 font-semibold text-muted-foreground">Clock In</th>
                      <th className="text-left p-3 font-semibold text-muted-foreground">Clock Out</th>
                      <th className="text-right p-3 font-semibold text-muted-foreground">Hours</th>
                      <th className="text-center p-3 font-semibold text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.map((record: any) => {
                      const intern = internMap[record.employee_id];
                      const hrs = record.clock_in && record.clock_out
                        ? (differenceInMinutes(new Date(record.clock_out), new Date(record.clock_in)) / 60).toFixed(1)
                        : '-';
                      return (
                        <tr key={record.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                          <td className="p-3 font-medium">
                            {intern ? `${intern.first_name} ${intern.last_name}` : 'Unknown'}
                          </td>
                          <td className="p-3">{format(new Date(record.date), 'MMM d, yyyy')}</td>
                          <td className="p-3 text-muted-foreground">
                            {record.clock_in ? format(new Date(record.clock_in), 'h:mm a') : '-'}
                          </td>
                          <td className="p-3 text-muted-foreground">
                            {record.clock_out ? format(new Date(record.clock_out), 'h:mm a') : '-'}
                          </td>
                          <td className="p-3 text-right font-medium">{hrs}h</td>
                          <td className="p-3 text-center">
                            <Badge variant="outline" className={cn("text-[10px] font-bold uppercase", statusColors[record.status])}>
                              {record.status}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
