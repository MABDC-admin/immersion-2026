import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import {
  ArrowRight,
  Building2,
  Calendar,
  Eye,
  Shield,
  Sparkles,
  TrendingUp,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import { useEmployees, useCurrentEmployee, useSupervisorOptions } from '@/hooks/useEmployees';
import { useAuth } from '@/hooks/useAuth';
import { AnimatedStatCard } from '@/components/dashboard/AnimatedStatCard';
import { EmployeeStatusChart } from '@/components/dashboard/EmployeeStatusChart';
import { DepartmentDistributionChart } from '@/components/dashboard/DepartmentDistributionChart';
import { RecentActivityWidget } from '@/components/dashboard/RecentActivityWidget';
import { UpcomingEventsWidget } from '@/components/dashboard/UpcomingEventsWidget';
import { EmployeeDashboardView } from '@/components/profile/EmployeeDashboardView';
import { SupervisorDashboardView } from '@/components/supervisor/SupervisorDashboardView';
import { EditEmployeeModal } from '@/components/employees/EditEmployeeModal';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';

export default function Dashboard() {
  const { data: employees = [] } = useEmployees();
  const { user, isAdmin, userRole, isSupervisor, isPrincipal } = useAuth();
  const { data: employee } = useCurrentEmployee(user?.id || '');
  const { data: supervisors = [] } = useSupervisorOptions();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const navigate = useNavigate();

  const isAdminOrHR = isAdmin || userRole === 'hr_manager';
  const supervisorIds = useMemo(() => new Set(supervisors.map((supervisor) => supervisor.id)), [supervisors]);
  const visibleEmployees = useMemo(
    () => (isPrincipal ? employees.filter((currentEmployee) => !supervisorIds.has(currentEmployee.id)) : employees),
    [employees, isPrincipal, supervisorIds]
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
      { title: 'Total Employees', value: visibleEmployees.length, icon: Users, color: 'text-primary', bgColor: 'bg-primary/10' },
      { title: 'Active Employees', value: activeEmployees, icon: TrendingUp, color: 'text-hrms-success', bgColor: 'bg-hrms-success/10', trend: { value: 5, isPositive: true } },
      { title: 'New Hires (30 days)', value: newHires, icon: UserPlus, color: 'text-primary', bgColor: 'bg-primary/10' },
      { title: 'On Leave', value: onLeaveEmployees, icon: Calendar, color: 'text-hrms-warning', bgColor: 'bg-hrms-warning/10' },
    ];
  }, [visibleEmployees]);

  const adminQuickNav = [
    { label: 'Admin Panel', icon: Shield, href: '/admin' },
    { label: 'Employees', icon: Users, href: '/employees' },
    { label: 'Recruitment', icon: Briefcase, href: '/recruitment/jobs' },
    { label: 'Onboarding', icon: UserCheck, href: '/onboarding/new-hires' },
  ];
  const principalQuickNav = [
    { label: 'Employees', icon: Users, href: '/employees' },
  ];
  const principalRecentHires = useMemo(
    () =>
      [...visibleEmployees]
        .sort((a, b) => new Date(b.hire_date).getTime() - new Date(a.hire_date).getTime())
        .slice(0, 5),
    [visibleEmployees]
  );
  const principalDepartmentCount = useMemo(
    () => new Set(visibleEmployees.map((currentEmployee) => currentEmployee.department?.name).filter(Boolean)).size,
    [visibleEmployees]
  );

  return (
    <MainLayout>
      <div className="space-y-8">
        {isPrincipal ? (
          <>
            <Card className="overflow-hidden border-none bg-gradient-to-br from-sky-600 via-sky-700 to-slate-900 text-white shadow-xl">
              <CardContent className="relative px-6 py-8 sm:px-8">
                <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
                <div className="absolute bottom-0 left-1/3 h-32 w-32 rounded-full bg-cyan-300/10 blur-3xl" />
                <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                  <div className="max-w-2xl space-y-4">
                    <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-sky-100">
                      <Sparkles className="h-3.5 w-3.5" />
                      Principal Portal
                    </div>
                    <div className="space-y-2">
                      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                        Executive visibility across employee records
                      </h1>
                      <p className="max-w-xl text-sm leading-6 text-sky-50/85 sm:text-base">
                        Review employee coverage, hiring movement, and department distribution in one read-only workspace designed for principal oversight.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-sky-100/80">Visible employees</p>
                        <p className="mt-1 text-2xl font-semibold">{visibleEmployees.length}</p>
                      </div>
                      <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-sky-100/80">Supervisors excluded</p>
                        <p className="mt-1 text-2xl font-semibold">{supervisors.length}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:w-[360px]">
                    <Button
                      variant="secondary"
                      className="h-auto justify-between rounded-2xl border-0 bg-white/95 px-5 py-4 text-left text-slate-900 shadow-lg hover:bg-white"
                      onClick={() => navigate('/employees')}
                    >
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Open</p>
                        <p className="mt-1 text-sm font-semibold">Employee Directory</p>
                      </div>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                    <div className="rounded-2xl border border-white/15 bg-white/10 px-5 py-4 backdrop-blur">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-100/80">Access mode</p>
                      <p className="mt-1 text-sm font-semibold">Read-only oversight</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Card className="rounded-[1.5rem] border-sky-500/15 bg-gradient-to-br from-sky-500/10 via-background to-background shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Employees</p>
                      <p className="mt-2 text-3xl font-semibold">{visibleEmployees.length}</p>
                    </div>
                    <div className="rounded-2xl bg-sky-500/10 p-3 text-sky-600">
                      <Users className="h-5 w-5" />
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">Visible to principals across the organization.</p>
                </CardContent>
              </Card>

              <Card className="rounded-[1.5rem] shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Active today</p>
                      <p className="mt-2 text-3xl font-semibold">
                        {visibleEmployees.filter((currentEmployee) => currentEmployee.status === 'active').length}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-600">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">Current active employee records only.</p>
                </CardContent>
              </Card>

              <Card className="rounded-[1.5rem] shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Departments</p>
                      <p className="mt-2 text-3xl font-semibold">{principalDepartmentCount}</p>
                    </div>
                    <div className="rounded-2xl bg-amber-500/10 p-3 text-amber-600">
                      <Building2 className="h-5 w-5" />
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">Active departments represented in the visible employee list.</p>
                </CardContent>
              </Card>

              <Card className="rounded-[1.5rem] shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Hidden by design</p>
                      <p className="mt-2 text-3xl font-semibold">{supervisors.length}</p>
                    </div>
                    <div className="rounded-2xl bg-violet-500/10 p-3 text-violet-600">
                      <Shield className="h-5 w-5" />
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">Supervisor records excluded from the principal portal.</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
              <Card className="xl:col-span-2">
                <CardHeader>
                  <CardTitle>Employee Status Snapshot</CardTitle>
                </CardHeader>
                <CardContent>
                  <EmployeeStatusChart employees={visibleEmployees} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Oversight Scope</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-2xl border bg-muted/30 px-4 py-4">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <Eye className="h-4 w-4 text-primary" />
                      What principals can do
                    </div>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      View employee records, department spread, and hiring movement without editing data or accessing supervisor-only modules.
                    </p>
                  </div>
                  <div className="rounded-2xl border bg-muted/30 px-4 py-4">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <Shield className="h-4 w-4 text-violet-600" />
                      Guardrails
                    </div>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      Chat, admin tools, journals, and supervisor profiles are intentionally blocked from this portal.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
              <Card className="xl:col-span-2">
                <CardHeader>
                  <CardTitle>Department Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <DepartmentDistributionChart employees={visibleEmployees} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Hires</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {principalRecentHires.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No recent hires available yet.</p>
                  ) : (
                    principalRecentHires.map((recentHire) => (
                      <div key={recentHire.id} className="rounded-2xl border bg-background px-4 py-3">
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
            </div>
          </>
        ) : isAdminOrHR ? (
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
                  {userRole === 'admin' ? 'Administrator' :
                    userRole === 'supervisor' ? 'Supervisor' :
                      userRole === 'manager' ? 'Manager' :
                        userRole === 'hr_manager' ? 'HR Manager' :
                          'Payroll Officer'}
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
