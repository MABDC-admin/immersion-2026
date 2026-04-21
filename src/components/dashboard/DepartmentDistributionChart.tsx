import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { EmployeeWithRelations } from '@/types/employee';

interface DepartmentDistributionChartProps {
  employees: EmployeeWithRelations[];
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--hrms-success))',
  'hsl(var(--hrms-warning))',
  'hsl(var(--accent))',
  'hsl(var(--muted-foreground))',
];

export function DepartmentDistributionChart({ employees }: DepartmentDistributionChartProps) {
  const data = useMemo(() => {
    const deptCounts = employees.reduce((acc, emp) => {
      const deptName = emp.department?.name || 'Unassigned';
      acc[deptName] = (acc[deptName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(deptCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [employees]);

  return (
    <Card className="animate-fade-in border-sky-200/70 bg-gradient-to-br from-sky-500/[0.08] via-background to-background shadow-sm" style={{ animationDelay: '300ms' }}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Department Distribution</CardTitle>
        <p className="text-sm text-muted-foreground">See which departments are carrying the largest share of active records.</p>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="name"
                width={100}
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '14px',
                }}
                formatter={(value) => [`${value} employees`, 'Count']}
              />
              <Bar
                dataKey="count"
                radius={[0, 4, 4, 0]}
                animationBegin={0}
                animationDuration={1000}
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
