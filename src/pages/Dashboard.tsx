import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserPlus, Calendar, TrendingUp } from 'lucide-react';
import { useEmployees } from '@/hooks/useEmployees';
import { MakeAdminCard } from '@/components/admin/MakeAdminCard';
import { AdminAssignRole } from '@/components/admin/AdminAssignRole';
import { useAuth } from '@/hooks/useAuth';

export default function Dashboard() {
  const { data: employees = [] } = useEmployees();
  const { isAdmin, userRole } = useAuth();

  const activeEmployees = employees.filter((e) => e.status === 'active').length;
  const onLeaveEmployees = employees.filter((e) => e.status === 'on_leave').length;
  
  // Calculate new hires (joined in the last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const newHires = employees.filter(
    (e) => new Date(e.hire_date) >= thirtyDaysAgo
  ).length;

  const stats = [
    {
      title: 'Total Employees',
      value: employees.length,
      icon: Users,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Active Employees',
      value: activeEmployees,
      icon: TrendingUp,
      color: 'text-hrms-success',
      bgColor: 'bg-hrms-success/10',
    },
    {
      title: 'New Hires (30 days)',
      value: newHires,
      icon: UserPlus,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'On Leave',
      value: onLeaveEmployees,
      icon: Calendar,
      color: 'text-hrms-warning',
      bgColor: 'bg-hrms-warning/10',
    },
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome to Immersion HRMS. Here's an overview of your organization.
            </p>
          </div>
          {isAdmin && <AdminAssignRole />}
        </div>

        {/* Admin upgrade card for non-admin users */}
        {userRole !== 'admin' && <MakeAdminCard />}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                No recent activity to display.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pending Approvals</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                No pending approvals.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
