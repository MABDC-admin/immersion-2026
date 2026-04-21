import { useEmployees, useDepartments } from '@/hooks/useEmployees';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Users, Building, TrendingUp } from 'lucide-react';

export function ReportsTab() {
  const { data: employees = [], isLoading: loadingEmp } = useEmployees();
  const { data: departments = [], isLoading: loadingDept } = useDepartments();

  if (loadingEmp || loadingDept) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  const activeCount = employees.filter(e => e.status === 'active').length;
  const onLeaveCount = employees.filter(e => e.status === 'on_leave').length;
  const terminatedCount = employees.filter(e => e.status === 'terminated').length;

  const deptDistribution = departments.map(d => ({
    name: d.name,
    count: employees.filter(e => e.department_id === d.id).length,
  })).sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10"><Users className="h-5 w-5 text-primary" /></div>
              <div>
                <p className="text-2xl font-bold text-foreground">{employees.length}</p>
                <p className="text-sm text-muted-foreground">Total Interns</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100"><TrendingUp className="h-5 w-5 text-green-600" /></div>
              <div>
                <p className="text-2xl font-bold text-foreground">{activeCount}</p>
                <p className="text-sm text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-100"><Users className="h-5 w-5 text-yellow-600" /></div>
              <div>
                <p className="text-2xl font-bold text-foreground">{onLeaveCount}</p>
                <p className="text-sm text-muted-foreground">On Leave</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Department Distribution</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {deptDistribution.map(d => (
              <div key={d.name} className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">{d.name}</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${employees.length ? (d.count / employees.length) * 100 : 0}%` }} />
                  </div>
                  <span className="text-sm text-muted-foreground w-8 text-right">{d.count}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
