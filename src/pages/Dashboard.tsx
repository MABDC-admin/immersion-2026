import { useMemo, useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Users, UserPlus, Calendar, TrendingUp } from 'lucide-react';
import { useEmployees, useCurrentEmployee } from '@/hooks/useEmployees';
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
import { EmployeeDashboardView } from '@/components/profile/EmployeeDashboardView';
import { EditEmployeeModal } from '@/components/employees/EditEmployeeModal';
import { TutorialDialog } from '@/components/onboarding/TutorialDialog';
import { useUpdateTutorialStatus } from '@/hooks/useEmployees';

export default function Dashboard() {
  const { data: employees = [] } = useEmployees();
  const { user, isAdmin, isManager, userRole } = useAuth();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);

  // For employee view - resolve employee record from Auth ID
  const { data: employee } = useCurrentEmployee(user?.id || '');
  const updateTutorialStatus = useUpdateTutorialStatus();

  // Check if tutorial should be shown
  useEffect(() => {
    if (employee && employee.has_completed_tutorial === false) {
      setIsTutorialOpen(true);
    }
  }, [employee]);

  const handleCloseTutorial = () => {
    setIsTutorialOpen(false);
    if (employee?.id) {
      updateTutorialStatus.mutate({ employeeId: employee.id, completed: true });
    }
  };

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
      <div className="space-y-10">
        <div className="flex items-center justify-end">
          {isAdmin && <AdminAssignRole />}
        </div>

        {/* Global Personal Overview - Everyone sees this */}
        <div className="space-y-6">
          <EmployeeDashboardView
            employeeId={employee?.id || ''}
            onUpdateProfile={() => setIsEditModalOpen(true)}
          />
        </div>

        {/* Admin/HR/Manager Specific Content */}
        {(isAdmin || isManager || userRole === 'hr_manager') && (
          <div className="space-y-6 pt-6 border-t">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Organizational Overview</h2>
              {userRole !== 'admin' && userRole !== 'manager' && <MakeAdminCard />}
            </div>

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
        )}

        {!isAdmin && !isManager && userRole !== 'admin' && userRole !== 'hr_manager' && userRole !== 'manager' && (
          <MakeAdminCard />
        )}
      </div>

      <CreateEmployeeModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
      />

      {employee && (
        <EditEmployeeModal
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          employee={employee}
        />
      )}

      <TutorialDialog
        open={isTutorialOpen}
        onClose={handleCloseTutorial}
      />
    </MainLayout>
  );
}
