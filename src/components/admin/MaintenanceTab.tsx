import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Database, Activity, HardDrive, RefreshCw, GitBranch, CheckCircle, XCircle, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface AppliedMigration {
  id: string;
  filename: string;
  applied_at: string;
  status: string;
  error_message: string | null;
  content_hash: string | null;
}

export function MaintenanceTab() {
  const [isSyncing, setIsSyncing] = useState(false);
  const queryClient = useQueryClient();

  const { data: migrations, isLoading } = useQuery({
    queryKey: ['applied-migrations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('applied_migrations' as any)
        .select('*')
        .order('applied_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as AppliedMigration[];
    },
  });

  const handleSyncNow = async () => {
    setIsSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-github-migrations');
      if (error) throw error;
      toast.success(data?.message || 'Sync complete');
      queryClient.invalidateQueries({ queryKey: ['applied-migrations'] });
    } catch (err: any) {
      const message = err?.message || 'Unknown error';
      if (message.toLowerCase().includes('forbidden')) {
        toast.error('Sync failed: only admins can run GitHub migration sync.');
      } else if (message.toLowerCase().includes('unauthorized')) {
        toast.error('Sync failed: please sign in again and retry.');
      } else {
        toast.error(`Sync failed: ${message}`);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100"><Database className="h-5 w-5 text-green-600" /></div>
              <div>
                <p className="font-medium text-foreground">Database</p>
                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">Healthy</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100"><Activity className="h-5 w-5 text-green-600" /></div>
              <div>
                <p className="font-medium text-foreground">API Status</p>
                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">Operational</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10"><HardDrive className="h-5 w-5 text-primary" /></div>
              <div>
                <p className="font-medium text-foreground">Storage</p>
                <Badge variant="outline">Cloud Managed</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5" /> GitHub Migrations
            </CardTitle>
            <Button size="sm" onClick={handleSyncNow} disabled={isSyncing}>
              <RefreshCw className={`h-4 w-4 mr-1 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Sync Now'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading migrations...</p>
          ) : !migrations?.length ? (
            <p className="text-sm text-muted-foreground">No migrations applied yet. Click "Sync Now" to check GitHub for new SQL files.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Filename</TableHead>
                  <TableHead>Applied At</TableHead>
                  <TableHead>Error</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {migrations.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>
                      {m.status === 'success' ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : m.status === 'error' ? (
                        <XCircle className="h-4 w-4 text-destructive" />
                      ) : (
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{m.filename}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(m.applied_at).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-xs text-destructive max-w-[200px] truncate">
                      {m.error_message || '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>System Information</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Platform</span><span className="font-medium text-foreground">Lovable Cloud</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Database</span><span className="font-medium text-foreground">PostgreSQL</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Backups</span><span className="font-medium text-foreground">Automatic (Daily)</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">SSL</span><span className="font-medium text-foreground">Enabled</span></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
