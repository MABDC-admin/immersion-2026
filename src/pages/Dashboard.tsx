import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Users, UserPlus, Calendar, TrendingUp, Shield, Briefcase, UserCheck } from 'lucide-react';
import { useEmployees, useCurrentEmployee } from '@/hooks/useEmployees';
import { useAuth } from '@/hooks/useAuth';
import { AnimatedStatCard } from '@/components/dashboard/AnimatedStatCard';
import { EmployeeStatusChart } from '@/components/dashboard/EmployeeStatusChart';
import { DepartmentDistributionChart } from '@/components/dashboard/DepartmentDistributionChart';
import { RecentActivityWidget } from '@/components/dashboard/RecentActivityWidget';
import { UpcomingEventsWidget } from '@/components/dashboard/UpcomingEventsWidget';
import { EmployeeDashboardView } from '@/components/profile/EmployeeDashboardView';
import { EditEmployeeModal } from '@/components/employees/EditEmployeeModal';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';

export default function Dashboard() {
  const { data: employees = [] } = useEmployees();
  const { user, isAdmin, userRole } = useAuth();
  const { data: employee } = useCurrentEmployee(user?.id || '');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const navigate = useNavigate();

  const isAdminOrHR = isAdmin || userRole === 'hr_manager';

  const stats = useMemo(() => {
    const activeEmployees = employees.filter((e) => e.status === 'active').length;
    const onLeaveEmployees = employees.filter((e) => e.status === 'on_leave').length;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newHires = employees.filter(
      (e) => new Date(e.hire_date) >= thirtyDaysAgo
    ).length;

    return [
      { title: 'Total Employees', value: employees.length, icon: Users, color: 'text-primary', bgColor: 'bg-primary/10' },
      { title: 'Active Employees', value: activeEmployees, icon: TrendingUp, color: 'text-hrms-success', bgColor: 'bg-hrms-success/10', trend: { value: 5, isPositive: true } },
      { title: 'New Hires (30 days)', value: newHires, icon: UserPlus, color: 'text-primary', bgColor: 'bg-primary/10' },
      { title: 'On Leave', value: onLeaveEmployees, icon: Calendar, color: 'text-hrms-warning', bgColor: 'bg-hrms-warning/10' },
    ];
  }, [employees]);

  const adminQuickNav = [
    { label: 'Admin Panel', icon: Shield, href: '/admin' },
    { label: 'Employees', icon: Users, href: '/employees' },
    { label: 'Recruitment', icon: Briefcase, href: '/recruitment/jobs' },
    { label: 'Onboarding', icon: UserCheck, href: '/onboarding/new-hires' },
  ];

  return (
    <MainLayout>
      <div className="space-y-8">
        {isAdminOrHR ? (
          /* ========== ADMIN / HR DASHBOARD ========== */
          <>
            {/* Welcome Header */}
            <Card className="border-l-4 border-l-primary shadow-sm">
              <CardContent className="px-6 py-5 flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    Welcome back, {employee?.first_name || user?.email?.split('@')[0] || 'Admin'}
                  </h1>
                  <p className="text-muted-foreground mt-1">Organizational Overview</p>
                </div>
                <Badge variant="secondary" className="text-sm px-3 py-1">
                  {userRole === 'admin' ? 'Administrator' : userRole === 'manager' ? 'Supervisor' : 'HR Manager'}
                </Badge>
              </CardContent>
            </Card>

            {/* Quick Navigation */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {adminQuickNav.map((item) => (
                <Button
                  key={item.label}
                  variant="outline"
                  className="h-auto flex-col gap-2 py-4 hover:scale-105 transition-transform"
                  onClick={() => navigate(item.href)}
                >
                  <item.icon className="h-5 w-5 text-primary" />
                  <span className="text-xs font-medium">{item.label}</span>
                </Button>
              ))}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <AnimatedStatCard key={stat.title} {...stat} delay={index * 100} />
              ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <EmployeeStatusChart employees={employees} />
              <DepartmentDistributionChart employees={employees} />
            </div>

            {/* Activity & Events */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <RecentActivityWidget className="lg:col-span-2" />
              <UpcomingEventsWidget />
            </div>
          </>
        ) : (
          /* ========== EMPLOYEE / INTERN DASHBOARD ========== */
          <EmployeeDashboardView
            employeeId={employee?.id || ''}
            onUpdateProfile={() => setIsEditModalOpen(true)}
          />
        )}
      </div>

      {employee && (
        <EditEmployeeModal
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          employee={employee}
        />
      )}
    </MainLayout>
  );
}
