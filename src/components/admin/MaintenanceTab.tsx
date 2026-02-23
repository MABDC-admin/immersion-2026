import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Database, Activity, HardDrive } from 'lucide-react';

export function MaintenanceTab() {
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
