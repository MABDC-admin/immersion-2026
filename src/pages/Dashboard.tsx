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
import { isSupervisorLikeEmployee, useEmployees, useCurrentEmployee, useEmployee, useSupervisorOptions } from '@/hooks/useEmployees';
import { useAuth } from '@/hooks/useAuth';
import { useImpersonation } from '@/hooks/useImpersonation';
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
  const { data: realEmployee } = useCurrentEmployee(user?.id || '');
  const { isImpersonating, impersonating, effectiveRole } = useImpersonation();
  const { data: impersonatedEmployee } = useEmployee(impersonating?.employeeId || '');
  const { data: supervisors = [] } = useSupervisorOptions();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const navigate = useNavigate();

  // If impersonating, override everything to mimic the impersonated user
  const employee = isImpersonating ? impersonatedEmployee : realEmployee;
  const isAdminOrHR = isImpersonating
    ? (effectiveRole === 'admin' || effectiveRole === 'hr_manager')
    : (isAdmin || userRole === 'hr_manager');
  const isOversightPortal = isImpersonating
    ? (effectiveRole === 'principal' || effectiveRole === 'supervisor')
    : (isPrincipal || isSupervisor);
  const effectiveIsSupervisor = isImpersonating ? effectiveRole === 'supervisor' : isSupervisor;
  const effectiveIsPrincipal = isImpersonating ? effectiveRole === 'principal' : isPrincipal;
  const supervisorIds = useMemo(() => new Set(supervisors.map((supervisor) => supervisor.id)), [supervisors]);
  const visibleEmployees = useMemo(
    () => {
      if (effectiveIsSupervisor && employee) {
        return employees.filter((currentEmployee) => currentEmployee.manager_id === employee.id);
      }

      if (effectiveIsPrincipal) {
        return employees.filter((currentEmployee) => !isSupervisorLikeEmployee(currentEmployee, supervisorIds));
      }

      return employees;
    },
    [employee, employees, effectiveIsPrincipal, effectiveIsSupervisor, supervisorIds]
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
  const oversightLabel = effectiveIsSupervisor ? 'Supervisor Portal' : 'Principal Portal';
  const oversightBadge = effectiveIsSupervisor ? 'Assigned intern oversight' : 'Read-only intern oversight';
  const oversightDescription = effectiveIsSupervisor
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
            <Card className="overflow-hidden border-intern-border/80 bg-gradient-to-r from-intern/15 via-background to-background shadow-sm">
              <CardContent className="flex flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-foreground">{oversightLabel}</h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {oversightDescription}
                  </p>
                </div>
                <Badge variant="outline" className="w-fit border-intern-border bg-intern/10 text-intern">
                  {oversightBadge}
                </Badge>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Card className="border-intern-border/70 bg-gradient-to-br from-intern/15 via-background to-background shadow-sm">
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

              <Card className="border-hrms-success/30 bg-gradient-to-br from-hrms-success/10 via-background to-background shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Active</p>
                      <p className="mt-2 text-3xl font-semibold">{principalActiveCount}</p>
                    </div>
                    <div className="rounded-2xl bg-hrms-success/10 p-3 text-hrms-success">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">Currently active intern records.</p>
                </CardContent>
              </Card>

              <Card className="border-hrms-warning/30 bg-gradient-to-br from-hrms-warning/15 via-background to-background shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">On Leave</p>
                      <p className="mt-2 text-3xl font-semibold">{principalOnLeaveCount}</p>
                    </div>
                    <div className="rounded-2xl bg-hrms-warning/10 p-3 text-hrms-warning">
                      <Calendar className="h-5 w-5" />
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">Interns currently marked on leave.</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.3fr_0.7fr]">
              <Card className="border-intern-border/70 bg-gradient-to-br from-intern/5 via-background to-background shadow-sm">
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
                  <Button variant="outline" className="w-full justify-between border-intern-border bg-intern/5 hover:bg-intern/10" onClick={() => navigate('/employees')}>
                    Intern Directory
                    <Users className="h-4 w-4 text-primary" />
                  </Button>
                  {effectiveIsPrincipal && (
                    <Button variant="outline" className="w-full justify-between border-evalinfo-border bg-evalinfo/5 hover:bg-evalinfo/10" onClick={() => navigate('/reports/evaluations')}>
                      Evaluation Reports
                      <TrendingUp className="h-4 w-4 text-evalinfo" />
                    </Button>
                  )}
                  {(effectiveIsPrincipal || effectiveIsSupervisor) && (
                    <Button variant="outline" className="w-full justify-between border-hrms-success/30 bg-hrms-success/5 hover:bg-hrms-success/10" onClick={() => navigate('/supervisor/journals')}>
                      Journal Oversight
                      <UserCheck className="h-4 w-4 text-hrms-success" />
                    </Button>
                  )}
                  <div className="rounded-xl border border-intern-border/60 bg-intern/5 px-4 py-3 text-sm text-muted-foreground">
                    {effectiveIsSupervisor ? 'Only your assigned interns appear in this portal.' : 'Supervisor records are hidden by design in the principal portal.'}
                  </div>
                  <div className="rounded-xl border border-evalinfo-border/60 bg-evalinfo/5 px-4 py-3 text-sm text-muted-foreground">
                    Journal entries are read-only and appear inside each employee profile.
                  </div>
                  <div className="rounded-xl border border-violet-100 bg-violet-500/5 px-4 py-3 text-sm text-muted-foreground">
                    {effectiveIsSupervisor ? (
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
            <Card className="overflow-hidden border-intern-border/80 bg-gradient-to-r from-intern/15 via-background to-background shadow-sm">
              <CardContent className="flex flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    Welcome back, {employee?.first_name || user?.email?.split('@')[0] || 'Admin'}
                  </h1>
                  <p className="text-muted-foreground mt-1">Organizational Overview</p>
                </div>
                <Badge variant="outline" className="w-fit border-intern-border bg-white/80 px-3 py-1 text-sm text-intern">
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
                    index === 0 && 'bg-gradient-to-br from-intern/15 to-background hover:bg-intern/10',
                    index === 1 && 'bg-gradient-to-br from-evalinfo/10 to-background hover:bg-evalinfo/10',
                    index === 2 && 'bg-gradient-to-br from-hrms-success/10 to-background hover:bg-hrms-success/10',
                    index === 3 && 'bg-gradient-to-br from-violet-500/10 to-background hover:bg-violet-500/10'
                  )}
                  onClick={() => navigate(item.href)}
                >
                  <item.icon className={cn(
                    'h-5 w-5',
                    index === 0 && 'text-intern',
                    index === 1 && 'text-evalinfo',
                    index === 2 && 'text-hrms-success',
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
        ) : effectiveIsSupervisor ? (
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
