import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import {
  Briefcase,
  Calendar,
  Shield,
  TrendingUp,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import { isSupervisorLikeEmployee, useEmployees, useCurrentEmployee, useSupervisorOptions } from '@/hooks/useEmployees';
import { useAuth } from '@/hooks/useAuth';
import { AnimatedStatCard } from '@/components/dashboard/AnimatedStatCard';
import { EmployeeStatusChart } from '@/components/dashboard/EmployeeStatusChart';
import { DepartmentDistributionChart } from '@/components/dashboard/DepartmentDistributionChart';
import { RecentActivityWidget } from '@/components/dashboard/RecentActivityWidget';
import { UpcomingEventsWidget } from '@/components/dashboard/UpcomingEventsWidget';
import { EmployeeDashboardView } from '@/components/profile/EmployeeDashboardView';
import { SupervisorDashboardView } from '@/components/supervisor/SupervisorDashboardView';
import { EditEmployeeModal } from '@/components/employees/EditEmployeeModal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const { data: employees = [] } = useEmployees();
  const { user, isAdmin, userRole, isSupervisor, isPrincipal } = useAuth();
  const { data: employee } = useCurrentEmployee(user?.id || '');
  const { data: supervisors = [] } = useSupervisorOptions();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const navigate = useNavigate();

  const isAdminOrHR = isAdmin || userRole === 'hr_manager';
  const isOversightPortal = isPrincipal || isSupervisor;
  const supervisorIds = useMemo(() => new Set(supervisors.map((supervisor) => supervisor.id)), [supervisors]);
  const visibleEmployees = useMemo(
    () => {
      if (isSupervisor && employee) {
        return employees.filter((currentEmployee) => currentEmployee.manager_id === employee.id);
      }

      if (isPrincipal) {
        return employees.filter((currentEmployee) => !isSupervisorLikeEmployee(currentEmployee, supervisorIds));
      }

      return employees;
    },
    [employee, employees, isPrincipal, isSupervisor, supervisorIds]
  );
  const hiddenSupervisorCount = useMemo(
    () => employees.filter((currentEmployee) => isSupervisorLikeEmployee(currentEmployee, supervisorIds)).length,
    [employees, supervisorIds]
  );

  const stats = useMemo(() => {
    const activeEmployees = visibleEmployees.filter((e) => e.status === 'active').length;
    const onLeaveEmployees = visibleEmployees.filter((e) => e.status === 'on_leave').length;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newHires = visibleEmployees.filter(
      (e) => new Date(e.hire_date) >= thirtyDaysAgo
    ).length;

    return [
      { title: 'Total Interns', value: visibleEmployees.length, icon: Users, color: 'text-primary', bgColor: 'bg-primary/10' },
      { title: 'Active Interns', value: activeEmployees, icon: TrendingUp, color: 'text-hrms-success', bgColor: 'bg-hrms-success/10', trend: { value: 5, isPositive: true } },
      { title: 'New Hires (30 days)', value: newHires, icon: UserPlus, color: 'text-primary', bgColor: 'bg-primary/10' },
      { title: 'On Leave', value: onLeaveEmployees, icon: Calendar, color: 'text-hrms-warning', bgColor: 'bg-hrms-warning/10' },
    ];
  }, [visibleEmployees]);

  const adminQuickNav = [
    { label: 'Admin Panel', icon: Shield, href: '/admin' },
    { label: 'Interns', icon: Users, href: '/employees' },
    { label: 'Recruitment', icon: Briefcase, href: '/recruitment/jobs' },
    { label: 'Onboarding', icon: UserCheck, href: '/onboarding/new-hires' },
  ];
  const principalQuickNav = [
    { label: 'Interns', icon: Users, href: '/employees' },
  ];
  const principalRecentHires = useMemo(
    () =>
      [...visibleEmployees]
        .sort((a, b) => new Date(b.hire_date).getTime() - new Date(a.hire_date).getTime())
        .slice(0, 6),
    [visibleEmployees]
  );
  const principalActiveCount = useMemo(
    () => visibleEmployees.filter((currentEmployee) => currentEmployee.status === 'active').length,
    [visibleEmployees]
  );
  const principalOnLeaveCount = useMemo(
    () => visibleEmployees.filter((currentEmployee) => currentEmployee.status === 'on_leave').length,
    [visibleEmployees]
  );
  const oversightLabel = isSupervisor ? 'Supervisor Portal' : 'Principal Portal';
  const oversightBadge = isSupervisor ? 'Assigned intern oversight' : 'Read-only intern oversight';
  const oversightDescription = isSupervisor
    ? 'Focused oversight for your assigned interns using the same compact portal experience.'
    : 'Simple, read-only oversight of intern records. Supervisor profiles stay hidden in this portal.';
  const adminRoleLabel =
    userRole === 'admin' ? 'Administrator' :
      userRole === 'supervisor' ? 'Supervisor' :
        userRole === 'manager' ? 'Manager' :
          userRole === 'hr_manager' ? 'HR Manager' :
            'Payroll Officer';

  return (
    <MainLayout>
      <div className="space-y-8">
        {isOversightPortal ? (
          <>
            <Card className="overflow-hidden border-orange-200/80 bg-gradient-to-r from-orange-500/12 via-background to-background shadow-sm">
              <CardContent className="flex flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-foreground">{oversightLabel}</h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {oversightDescription}
                  </p>
                </div>
                <Badge variant="outline" className="w-fit border-orange-200 bg-orange-500/10 text-orange-700">
                  {oversightBadge}
                </Badge>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Card className="border-orange-200/70 bg-gradient-to-br from-orange-500/12 via-background to-background shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Interns</p>
                      <p className="mt-2 text-3xl font-semibold">{visibleEmployees.length}</p>
                    </div>
                    <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                      <Users className="h-5 w-5" />
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">Visible intern records only.</p>
                </CardContent>
              </Card>

              <Card className="border-emerald-200/70 bg-gradient-to-br from-emerald-500/10 via-background to-background shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Active</p>
                      <p className="mt-2 text-3xl font-semibold">{principalActiveCount}</p>
                    </div>
                    <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-600">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">Currently active intern records.</p>
                </CardContent>
              </Card>

              <Card className="border-amber-200/80 bg-gradient-to-br from-amber-500/14 via-background to-background shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">On Leave</p>
                      <p className="mt-2 text-3xl font-semibold">{principalOnLeaveCount}</p>
                    </div>
                    <div className="rounded-2xl bg-amber-500/10 p-3 text-amber-600">
                      <Calendar className="h-5 w-5" />
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">Interns currently marked on leave.</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.3fr_0.7fr]">
              <Card className="border-orange-200/70 bg-gradient-to-br from-orange-500/[0.06] via-background to-background shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle>Recent Hires</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {principalRecentHires.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No recent hires available yet.</p>
                  ) : (
                    principalRecentHires.map((recentHire) => (
                      <div key={recentHire.id} className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3 shadow-sm">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">
                              {recentHire.first_name} {recentHire.last_name}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {recentHire.department?.name || 'No department assigned'}
                            </p>
                          </div>
                          <div className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary">
                            New
                          </div>
                        </div>
                        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5" />
                          Hired {new Date(recentHire.hire_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card className="border-violet-200/70 bg-gradient-to-br from-violet-500/[0.06] via-background to-background shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle>Quick Access</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-between border-orange-200 bg-orange-500/5 hover:bg-orange-500/10" onClick={() => navigate('/employees')}>
                    Intern Directory
                    <Users className="h-4 w-4 text-primary" />
                  </Button>
                  <div className="rounded-xl border border-orange-100 bg-orange-500/5 px-4 py-3 text-sm text-muted-foreground">
                    {isSupervisor ? 'Only your assigned interns appear in this portal.' : 'Supervisor records are hidden by design in the principal portal.'}
                  </div>
                  <div className="rounded-xl border border-sky-100 bg-sky-500/5 px-4 py-3 text-sm text-muted-foreground">
                    Journal entries are read-only and appear inside each employee profile.
                  </div>
                  <div className="rounded-xl border border-violet-100 bg-violet-500/5 px-4 py-3 text-sm text-muted-foreground">
                    {isSupervisor ? (
                      <>Assigned interns: <span className="font-semibold text-foreground">{visibleEmployees.length}</span></>
                    ) : (
                      <>Hidden supervisors: <span className="font-semibold text-foreground">{hiddenSupervisorCount}</span></>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        ) : isAdminOrHR ? (
          /* ========== ADMIN / HR DASHBOARD ========== */
          <>
            {/* Welcome Header */}
            <Card className="overflow-hidden border-orange-200/80 bg-gradient-to-r from-orange-500/14 via-background to-background shadow-sm">
              <CardContent className="flex flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    Welcome back, {employee?.first_name || user?.email?.split('@')[0] || 'Admin'}
                  </h1>
                  <p className="text-muted-foreground mt-1">Organizational Overview</p>
                </div>
                <Badge variant="outline" className="w-fit border-orange-200 bg-white/80 px-3 py-1 text-sm text-orange-700">
                  {adminRoleLabel}
                </Badge>
              </CardContent>
            </Card>

            {/* Quick Navigation */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {adminQuickNav.map((item, index) => (
                <Button
                  key={item.label}
                  variant="outline"
                  className={cn(
                    'h-auto flex-col gap-2 border-white/70 py-4 shadow-sm transition-all hover:scale-[1.02] hover:shadow-md',
                    index === 0 && 'bg-gradient-to-br from-orange-500/12 to-background hover:bg-orange-500/10',
                    index === 1 && 'bg-gradient-to-br from-sky-500/10 to-background hover:bg-sky-500/10',
                    index === 2 && 'bg-gradient-to-br from-emerald-500/10 to-background hover:bg-emerald-500/10',
                    index === 3 && 'bg-gradient-to-br from-violet-500/10 to-background hover:bg-violet-500/10'
                  )}
                  onClick={() => navigate(item.href)}
                >
                  <item.icon className={cn(
                    'h-5 w-5',
                    index === 0 && 'text-orange-600',
                    index === 1 && 'text-sky-600',
                    index === 2 && 'text-emerald-600',
                    index === 3 && 'text-violet-600'
                  )} />
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
              <EmployeeStatusChart employees={visibleEmployees} />
              <DepartmentDistributionChart employees={visibleEmployees} />
            </div>

            {/* Activity & Events */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <RecentActivityWidget className="lg:col-span-2" />
              <UpcomingEventsWidget />
            </div>
          </>
        ) : isSupervisor ? (
          /* ========== SUPERVISOR DASHBOARD ========== */
          <SupervisorDashboardView
            supervisorId={employee?.id || ''}
          />
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
