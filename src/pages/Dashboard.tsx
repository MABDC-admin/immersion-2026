import { useMemo, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Users, UserPlus, Calendar, TrendingUp } from 'lucide-react';
import { useEmployees } from '@/hooks/useEmployees';
import { MakeAdminCard } from '@/components/admin/MakeAdminCard';
import { AdminAssignRole } from '@/components/admin/AdminAssignRole';
import { useAuth } from '@/hooks/useAuth';
import { AnimatedStatCard } from '@/components/dashboard/AnimatedStatCard';
import { EmployeeStatusChart } from '@/components/dashboard/EmployeeStatusChart';
import { DepartmentDistributionChart } from '@/components/dashboard/DepartmentDistributionChart';
import { RecentActivityWidget } from '@/components/dashboard/RecentActivityWidget';
import { UpcomingEventsWidget } from '@/components/dashboard/UpcomingEventsWidget';
import { QuickActionsWidget } from '@/components/dashboard/QuickActionsWidget';
import { CreateEmployeeModal } from '@/components/employees/CreateEmployeeModal';

export default function Dashboard() {
  const { data: employees = [] } = useEmployees();
  const { isAdmin, userRole } = useAuth();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const stats = useMemo(() => {
    const activeEmployees = employees.filter((e) => e.status === 'active').length;
    const onLeaveEmployees = employees.filter((e) => e.status === 'on_leave').length;
    
    // Calculate new hires (joined in the last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newHires = employees.filter(
      (e) => new Date(e.hire_date) >= thirtyDaysAgo
    ).length;

    return [
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
        trend: { value: 5, isPositive: true },
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
  }, [employees]);

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

        {/* Animated Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <AnimatedStatCard
              key={stat.title}
              {...stat}
              delay={index * 100}
            />
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <EmployeeStatusChart employees={employees} />
          <DepartmentDistributionChart employees={employees} />
        </div>

        {/* Activity & Events Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <RecentActivityWidget className="lg:col-span-2" />
          <UpcomingEventsWidget />
        </div>

        {/* Quick Actions */}
        <QuickActionsWidget onAddEmployee={() => setIsCreateModalOpen(true)} />
      </div>

      <CreateEmployeeModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
      />
    </MainLayout>
  );
}
