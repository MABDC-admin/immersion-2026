import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Clock, Loader2, Monitor, RefreshCw, ShieldCheck, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface LoginAuditLog {
  id: string;
  user_id: string;
  email: string;
  user_role: string | null;
  user_agent: string | null;
  created_at: string;
}

function getDeviceLabel(userAgent: string | null) {
  if (!userAgent) return 'Unknown device';

  const browser = userAgent.includes('Edg/')
    ? 'Edge'
    : userAgent.includes('Chrome/')
      ? 'Chrome'
      : userAgent.includes('Firefox/')
        ? 'Firefox'
        : userAgent.includes('Safari/')
          ? 'Safari'
          : 'Browser';

  const os = userAgent.includes('Windows')
    ? 'Windows'
    : userAgent.includes('Mac OS')
      ? 'macOS'
      : userAgent.includes('Android')
        ? 'Android'
        : userAgent.includes('iPhone') || userAgent.includes('iPad')
          ? 'iOS'
          : 'Unknown OS';

  return `${browser} on ${os}`;
}

function getRoleLabel(role: string | null) {
  if (!role) return 'No role';
  return role.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function isToday(value: string) {
  const date = new Date(value);
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

function getQueryErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) return message;
  }
  return 'Unable to load login logs.';
}

export function LoginAuditTab() {
  const {
    data: logs = [],
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['login-audit-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('login_audit_logs')
        .select('id, user_id, email, user_role, user_agent, created_at')
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;
      return (data || []) as LoginAuditLog[];
    },
    retry: false,
  });

  const todayCount = logs.filter((log) => isToday(log.created_at)).length;
  const uniqueUsersToday = new Set(logs.filter((log) => isToday(log.created_at)).map((log) => log.user_id)).size;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12 text-sm text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        Loading login logs...
      </div>
    );
  }

  if (error) {
    const message = getQueryErrorMessage(error);

    return (
      <Card className="border-destructive/30">
        <CardContent className="flex flex-col gap-4 pt-6">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-destructive/10 p-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <h3 className="font-semibold">Login logs could not load</h3>
              <p className="mt-1 text-sm text-muted-foreground">{message}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                If the table was just added, apply the login audit migration in Supabase, then refresh this tab.
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="w-fit" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Logins Today</p>
                <p className="text-2xl font-bold">{todayCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-emerald-100 p-2">
                <Users className="h-5 w-5 text-emerald-700" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Unique Users Today</p>
                <p className="text-2xl font-bold">{uniqueUsersToday}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-sky-100 p-2">
                <ShieldCheck className="h-5 w-5 text-sky-700" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Stored Events</p>
                <p className="text-2xl font-bold">{logs.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Login Audit Trail</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Recent successful sign-ins captured from the portal login page.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
              No login logs recorded yet. New successful logins will appear here after the database migration is applied.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead className="text-right">Login Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{log.email}</p>
                        <p className="font-mono text-xs text-muted-foreground">{log.user_id.slice(0, 8)}...</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={log.user_role ? 'outline' : 'secondary'}>
                        {getRoleLabel(log.user_role)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Monitor className="h-4 w-4" />
                        {getDeviceLabel(log.user_agent)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {new Date(log.created_at).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
