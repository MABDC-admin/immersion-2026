import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { EmployeeWithRelations } from '@/types/employee';

interface EmployeeStatusChartProps {
  employees: EmployeeWithRelations[];
}

const COLORS = {
  active: 'hsl(var(--hrms-success))',
  inactive: 'hsl(var(--muted-foreground))',
  on_leave: 'hsl(var(--hrms-warning))',
  terminated: 'hsl(var(--destructive))',
};

const STATUS_LABELS = {
  active: 'Active',
  inactive: 'Inactive',
  on_leave: 'On Leave',
  terminated: 'Terminated',
};

export function EmployeeStatusChart({ employees }: EmployeeStatusChartProps) {
  const data = useMemo(() => {
    const statusCounts = employees.reduce((acc, emp) => {
      acc[emp.status] = (acc[emp.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(statusCounts).map(([status, count]) => ({
      name: STATUS_LABELS[status as keyof typeof STATUS_LABELS] || status,
      value: count,
      color: COLORS[status as keyof typeof COLORS] || 'hsl(var(--muted))',
    }));
  }, [employees]);

  return (
    <Card className="animate-fade-in" style={{ animationDelay: '200ms' }}>
      <CardHeader>
        <CardTitle className="text-lg">Employee Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                animationBegin={0}
                animationDuration={1000}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value) => (
                  <span className="text-sm text-foreground">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
