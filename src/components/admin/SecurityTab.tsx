import { useAuditLogs } from '@/hooks/useAdmin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, ShieldCheck, Lock, Eye } from 'lucide-react';
import { format } from 'date-fns';

export function SecurityTab() {
  const { data: logs = [], isLoading } = useAuditLogs();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10"><ShieldCheck className="h-5 w-5 text-primary" /></div>
              <div>
                <p className="font-medium text-foreground">Password Policy</p>
                <p className="text-sm text-muted-foreground">Min 6 characters required</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100"><Lock className="h-5 w-5 text-green-600" /></div>
              <div>
                <p className="font-medium text-foreground">Data Encryption</p>
                <p className="text-sm text-muted-foreground">AES-256 at rest</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent"><Eye className="h-5 w-5 text-accent-foreground" /></div>
              <div>
                <p className="font-medium text-foreground">Audit Logging</p>
                <p className="text-sm text-muted-foreground">{logs.length} entries recorded</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Audit Log</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : (
            <Table>
              <TableHeader><TableRow><TableHead>Action</TableHead><TableHead>Entity</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
              <TableBody>
                {logs.map(log => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">{log.action}</TableCell>
                    <TableCell><Badge variant="outline">{log.entity_type || '-'}</Badge></TableCell>
                    <TableCell className="text-muted-foreground">{format(new Date(log.created_at), 'PPp')}</TableCell>
                  </TableRow>
                ))}
                {logs.length === 0 && <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">No audit logs yet</TableCell></TableRow>}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
