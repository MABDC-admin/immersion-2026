import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  Briefcase,
  Building2,
  Calendar,
  ClipboardCheck,
  MessageSquare,
  Shield,
  Sparkles,
  Target,
  TrendingUp,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import { isSupervisorLikeEmployee, useEmployees, useCurrentEmployee, useEmployee, useSupervisorOptions } from '@/hooks/useEmployees';
import { useAuth } from '@/hooks/useAuth';
import { useImpersonation } from '@/hooks/useImpersonation';
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
import { cn } from '@/lib/utils';
import { getEmployeeDepartmentName } from '@/lib/departments';

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

  const adminActiveCount = useMemo(
    () => visibleEmployees.filter((currentEmployee) => currentEmployee.status === 'active').length,
    [visibleEmployees]
  );
  const adminOnLeaveCount = useMemo(
    () => visibleEmployees.filter((currentEmployee) => currentEmployee.status === 'on_leave').length,
    [visibleEmployees]
  );
  const adminInactiveCount = useMemo(
    () => visibleEmployees.filter((currentEmployee) => currentEmployee.status !== 'active' && currentEmployee.status !== 'on_leave').length,
    [visibleEmployees]
  );
  const adminRecentHireCount = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return visibleEmployees.filter((currentEmployee) => new Date(currentEmployee.hire_date) >= thirtyDaysAgo).length;
  }, [visibleEmployees]);
  const adminRecentHires = useMemo(
    () =>
      [...visibleEmployees]
        .sort((a, b) => new Date(b.hire_date).getTime() - new Date(a.hire_date).getTime())
        .slice(0, 5),
    [visibleEmployees]
  );
  const adminDepartmentRows = useMemo(() => {
    const totals = new Map<string, number>();

    visibleEmployees.forEach((currentEmployee) => {
      const departmentName = getEmployeeDepartmentName(currentEmployee);
      totals.set(departmentName, (totals.get(departmentName) || 0) + 1);
    });

    return Array.from(totals, ([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [visibleEmployees]);
  const adminActiveRate = visibleEmployees.length > 0
    ? Math.round((adminActiveCount / visibleEmployees.length) * 100)
    : 0;
  const adminStatusRows = [
    { label: 'Active', value: adminActiveCount, color: 'bg-emerald-500', badge: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
    { label: 'On Leave', value: adminOnLeaveCount, color: 'bg-amber-500', badge: 'border-amber-200 bg-amber-50 text-amber-700' },
    { label: 'Inactive', value: adminInactiveCount, color: 'bg-rose-500', badge: 'border-rose-200 bg-rose-50 text-rose-700' },
  ];
  const adminKpiWidgets = [
    {
      label: 'Total Interns',
      value: visibleEmployees.length,
      detail: `${adminActiveCount} active records`,
      icon: Users,
      cardClass: 'border-orange-200/80 bg-gradient-to-br from-orange-50 via-white to-white',
      iconClass: 'bg-orange-100 text-orange-700',
    },
    {
      label: 'Active Rate',
      value: `${adminActiveRate}%`,
      detail: 'Current active roster',
      icon: Activity,
      cardClass: 'border-emerald-200/80 bg-gradient-to-br from-emerald-50 via-white to-white',
      iconClass: 'bg-emerald-100 text-emerald-700',
    },
    {
      label: 'New This Month',
      value: adminRecentHireCount,
      detail: 'Last 30 days',
      icon: UserPlus,
      cardClass: 'border-sky-200/80 bg-gradient-to-br from-sky-50 via-white to-white',
      iconClass: 'bg-sky-100 text-sky-700',
    },
    {
      label: 'On Leave',
      value: adminOnLeaveCount,
      detail: 'Needs coverage check',
      icon: Calendar,
      cardClass: 'border-violet-200/80 bg-gradient-to-br from-violet-50 via-white to-white',
      iconClass: 'bg-violet-100 text-violet-700',
    },
  ];
  const adminActionWidgets = [
    {
      label: 'Intern Directory',
      description: 'Manage intern profiles, assignments, departments, and status.',
      href: '/employees',
      icon: Users,
      cardClass: 'border-orange-200/80 bg-orange-50/80 hover:bg-orange-50',
      iconClass: 'bg-orange-100 text-orange-700',
    },
    {
      label: 'Admin Panel',
      description: 'Open system settings, users, roles, and portal controls.',
      href: '/admin',
      icon: Shield,
      cardClass: 'border-slate-200 bg-slate-50/90 hover:bg-slate-50',
      iconClass: 'bg-slate-100 text-slate-700',
    },
    {
      label: 'Work Immersion',
      description: 'Coordinate immersion records, supervisors, and assignments.',
      href: '/admin/ojt',
      icon: Target,
      cardClass: 'border-emerald-200/80 bg-emerald-50/80 hover:bg-emerald-50',
      iconClass: 'bg-emerald-100 text-emerald-700',
    },
    {
      label: 'Evaluation Reports',
      description: 'Review scores, exports, and completion status.',
      href: '/reports/evaluations',
      icon: BarChart3,
      cardClass: 'border-violet-200/80 bg-violet-50/80 hover:bg-violet-50',
      iconClass: 'bg-violet-100 text-violet-700',
    },
    {
      label: 'Recruitment',
      description: 'View postings and candidate records.',
      href: '/recruitment/jobs',
      icon: Briefcase,
      cardClass: 'border-sky-200/80 bg-sky-50/80 hover:bg-sky-50',
      iconClass: 'bg-sky-100 text-sky-700',
    },
    {
      label: 'Onboarding',
      description: 'Track new hire checklists and documents.',
      href: '/onboarding/new-hires',
      icon: UserCheck,
      cardClass: 'border-amber-200/80 bg-amber-50/80 hover:bg-amber-50',
      iconClass: 'bg-amber-100 text-amber-700',
    },
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
  const principalInactiveCount = useMemo(
    () => visibleEmployees.filter((currentEmployee) => currentEmployee.status !== 'active' && currentEmployee.status !== 'on_leave').length,
    [visibleEmployees]
  );
  const principalRecentHireCount = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return visibleEmployees.filter((currentEmployee) => new Date(currentEmployee.hire_date) >= thirtyDaysAgo).length;
  }, [visibleEmployees]);
  const principalDepartmentRows = useMemo(() => {
    const totals = new Map<string, number>();

    visibleEmployees.forEach((currentEmployee) => {
      const departmentName = getEmployeeDepartmentName(currentEmployee);
      totals.set(departmentName, (totals.get(departmentName) || 0) + 1);
    });

    return Array.from(totals, ([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [visibleEmployees]);
  const principalActiveRate = visibleEmployees.length > 0
    ? Math.round((principalActiveCount / visibleEmployees.length) * 100)
    : 0;
  const principalStatusRows = [
    { label: 'Active', value: principalActiveCount, color: 'bg-emerald-500', badge: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
    { label: 'On Leave', value: principalOnLeaveCount, color: 'bg-amber-500', badge: 'border-amber-200 bg-amber-50 text-amber-700' },
    { label: 'Other', value: principalInactiveCount, color: 'bg-violet-500', badge: 'border-violet-200 bg-violet-50 text-violet-700' },
  ];
  const principalKpiWidgets = [
    {
      label: 'Visible Interns',
      value: visibleEmployees.length,
      detail: 'Intern-only records',
      icon: Users,
      cardClass: 'border-orange-200/80 bg-gradient-to-br from-orange-50 via-white to-white',
      iconClass: 'bg-orange-100 text-orange-700',
    },
    {
      label: 'Active Rate',
      value: `${principalActiveRate}%`,
      detail: `${principalActiveCount} active interns`,
      icon: Activity,
      cardClass: 'border-emerald-200/80 bg-gradient-to-br from-emerald-50 via-white to-white',
      iconClass: 'bg-emerald-100 text-emerald-700',
    },
    {
      label: 'New Hires',
      value: principalRecentHireCount,
      detail: 'Last 30 days',
      icon: Sparkles,
      cardClass: 'border-sky-200/80 bg-gradient-to-br from-sky-50 via-white to-white',
      iconClass: 'bg-sky-100 text-sky-700',
    },
    {
      label: 'On Leave',
      value: principalOnLeaveCount,
      detail: 'Currently away',
      icon: Calendar,
      cardClass: 'border-violet-200/80 bg-gradient-to-br from-violet-50 via-white to-white',
      iconClass: 'bg-violet-100 text-violet-700',
    },
  ];
  const principalActionWidgets = [
    {
      label: 'Intern Directory',
      description: 'Profiles, departments, status, and supervisor links.',
      href: '/employees',
      icon: Users,
      cardClass: 'border-orange-200/80 bg-orange-50/80 hover:bg-orange-50',
      iconClass: 'bg-orange-100 text-orange-700',
    },
    {
      label: 'Evaluation Reports',
      description: 'Review intern ratings, scores, and PDF exports.',
      href: '/reports/evaluations',
      icon: BarChart3,
      cardClass: 'border-sky-200/80 bg-sky-50/80 hover:bg-sky-50',
      iconClass: 'bg-sky-100 text-sky-700',
    },
    {
      label: 'Intern Journals',
      description: 'Open journal oversight and approval records.',
      href: '/supervisor/journals',
      icon: BookOpen,
      cardClass: 'border-emerald-200/80 bg-emerald-50/80 hover:bg-emerald-50',
      iconClass: 'bg-emerald-100 text-emerald-700',
    },
    {
      label: 'Messages',
      description: 'Continue portal communication and follow-ups.',
      href: '/chat',
      icon: MessageSquare,
      cardClass: 'border-rose-200/80 bg-rose-50/80 hover:bg-rose-50',
      iconClass: 'bg-rose-100 text-rose-700',
    },
  ];
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
        {effectiveIsPrincipal ? (
          <>
            <Card className="overflow-hidden border-white/80 bg-gradient-to-br from-orange-500/15 via-sky-500/10 to-violet-500/15 shadow-sm">
              <CardContent className="p-0">
                <div className="grid gap-0 lg:grid-cols-[1.5fr_0.8fr]">
                  <div className="px-6 py-6 md:px-8">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="border-orange-200 bg-white/80 text-orange-700">
                        {oversightBadge}
                      </Badge>
                      <Badge variant="outline" className="border-sky-200 bg-white/80 text-sky-700">
                        Supervisor profiles hidden
                      </Badge>
                    </div>
                    <h1 className="mt-5 text-3xl font-bold text-foreground">{oversightLabel}</h1>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                      {oversightDescription}
                    </p>
                    <div className="mt-5 flex flex-wrap gap-3">
                      <Button className="gap-2 bg-orange-600 hover:bg-orange-700" onClick={() => navigate('/employees')}>
                        <Users className="h-4 w-4" />
                        View Interns
                      </Button>
                      <Button variant="outline" className="gap-2 border-sky-200 bg-white/80 text-sky-800 hover:bg-sky-50" onClick={() => navigate('/reports/evaluations')}>
                        <BarChart3 className="h-4 w-4" />
                        Reports
                      </Button>
                    </div>
                  </div>
                  <div className="border-t border-white/70 bg-white/55 px-6 py-6 lg:border-l lg:border-t-0">
                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl bg-violet-100 p-3 text-violet-700">
                        <ClipboardCheck className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Oversight Health</p>
                        <p className="text-3xl font-bold text-foreground">{principalActiveRate}%</p>
                      </div>
                    </div>
                    <div className="mt-5 h-3 overflow-hidden rounded-full bg-white">
                      <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-sky-500 to-violet-500" style={{ width: `${principalActiveRate}%` }} />
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">
                      {principalActiveCount} active of {visibleEmployees.length} visible interns.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {principalKpiWidgets.map((widget) => (
                <Card key={widget.label} className={cn('border shadow-sm', widget.cardClass)}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase text-muted-foreground">{widget.label}</p>
                        <p className="mt-2 text-3xl font-bold text-foreground">{widget.value}</p>
                      </div>
                      <div className={cn('rounded-2xl p-3', widget.iconClass)}>
                        <widget.icon className="h-5 w-5" />
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">{widget.detail}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr]">
              <Card className="border-white/80 bg-gradient-to-br from-white via-orange-50/60 to-sky-50/60 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <CardTitle>Principal Widgets</CardTitle>
                      <p className="mt-1 text-sm text-muted-foreground">Fast actions for daily oversight.</p>
                    </div>
                    <Badge variant="outline" className="border-orange-200 bg-orange-50 text-orange-700">
                      Read-only
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {principalActionWidgets.map((item) => (
                      <button
                        key={item.label}
                        type="button"
                        className={cn(
                          'group rounded-xl border p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md',
                          item.cardClass
                        )}
                        onClick={() => navigate(item.href)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className={cn('rounded-xl p-2.5', item.iconClass)}>
                            <item.icon className="h-5 w-5" />
                          </div>
                          <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                        </div>
                        <p className="mt-4 text-sm font-semibold text-foreground">{item.label}</p>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.description}</p>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-violet-200/70 bg-gradient-to-br from-violet-50 via-white to-white shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-4">
                    <CardTitle>Status Snapshot</CardTitle>
                    <Activity className="h-5 w-5 text-violet-600" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {principalStatusRows.map((status) => {
                    const percent = visibleEmployees.length > 0 ? (status.value / visibleEmployees.length) * 100 : 0;

                    return (
                      <div key={status.label} className="rounded-xl border border-white bg-white/80 p-4 shadow-sm">
                        <div className="flex items-center justify-between gap-3">
                          <Badge variant="outline" className={status.badge}>
                            {status.label}
                          </Badge>
                          <span className="text-sm font-semibold text-foreground">{status.value}</span>
                        </div>
                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                          <div className={cn('h-full rounded-full', status.color)} style={{ width: `${percent}%` }} />
                        </div>
                      </div>
                    );
                  })}
                  <div className="rounded-xl border border-sky-200 bg-sky-50/80 px-4 py-3 text-sm text-sky-800">
                    Hidden supervisors: <span className="font-semibold">{hiddenSupervisorCount}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.9fr_1.1fr]">
              <Card className="border-emerald-200/70 bg-gradient-to-br from-emerald-50 via-white to-white shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-4">
                    <CardTitle>Department Mix</CardTitle>
                    <Building2 className="h-5 w-5 text-emerald-700" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {principalDepartmentRows.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No department data available yet.</p>
                  ) : (
                    principalDepartmentRows.map((department, index) => {
                      const percent = visibleEmployees.length > 0 ? (department.count / visibleEmployees.length) * 100 : 0;
                      const color = ['bg-orange-500', 'bg-sky-500', 'bg-emerald-500', 'bg-violet-500', 'bg-rose-500'][index] || 'bg-slate-500';

                      return (
                        <div key={department.name} className="rounded-xl border border-white bg-white/80 p-4 shadow-sm">
                          <div className="flex items-center justify-between gap-3">
                            <p className="truncate text-sm font-semibold text-foreground">{department.name}</p>
                            <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                              {department.count}
                            </span>
                          </div>
                          <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                            <div className={cn('h-full rounded-full', color)} style={{ width: `${percent}%` }} />
                          </div>
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>

              <Card className="border-sky-200/70 bg-gradient-to-br from-sky-50 via-white to-orange-50/50 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-4">
                    <CardTitle>Recent Hires</CardTitle>
                    <Badge variant="outline" className="border-sky-200 bg-sky-50 text-sky-700">
                      {principalRecentHireCount} this month
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {principalRecentHires.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No recent hires available yet.</p>
                  ) : (
                    principalRecentHires.map((recentHire) => (
                      <div key={recentHire.id} className="flex flex-col gap-3 rounded-xl border border-white bg-white/85 px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {recentHire.first_name} {recentHire.last_name}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <span className="rounded-full bg-orange-50 px-2 py-0.5 font-medium text-orange-700">
                              {recentHire.job_title || 'Intern'}
                            </span>
                            <span>{getEmployeeDepartmentName(recentHire)}</span>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5 text-sky-700" />
                          {new Date(recentHire.hire_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        ) : effectiveIsSupervisor ? (
          /* ========== SUPERVISOR DASHBOARD ========== */
          <SupervisorDashboardView
            supervisorId={employee?.id || ''}
          />
        ) : isAdminOrHR ? (
          /* ========== ADMIN / HR DASHBOARD ========== */
          <>
            <Card className="overflow-hidden border-white/80 bg-gradient-to-br from-orange-500/15 via-sky-500/10 to-emerald-500/15 shadow-sm">
              <CardContent className="p-0">
                <div className="grid gap-0 xl:grid-cols-[1.5fr_0.8fr]">
                  <div className="px-6 py-6 md:px-8">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="border-orange-200 bg-white/80 text-orange-700">
                        {adminRoleLabel}
                      </Badge>
                      <Badge variant="outline" className="border-sky-200 bg-white/80 text-sky-700">
                        Full portal management
                      </Badge>
                    </div>
                    <h1 className="mt-5 text-3xl font-bold text-foreground">
                      Welcome back, {employee?.first_name || user?.email?.split('@')[0] || 'Admin'}
                    </h1>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                      Manage intern records, immersion assignments, onboarding, reports, and communication from one command dashboard.
                    </p>
                    <div className="mt-5 flex flex-wrap gap-3">
                      <Button className="gap-2 bg-orange-600 hover:bg-orange-700" onClick={() => navigate('/employees')}>
                        <Users className="h-4 w-4" />
                        Manage Interns
                      </Button>
                      <Button variant="outline" className="gap-2 border-emerald-200 bg-white/80 text-emerald-800 hover:bg-emerald-50" onClick={() => navigate('/admin/ojt')}>
                        <Target className="h-4 w-4" />
                        Work Immersion
                      </Button>
                    </div>
                  </div>
                  <div className="border-t border-white/70 bg-white/55 px-6 py-6 xl:border-l xl:border-t-0">
                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                        <Activity className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Roster Health</p>
                        <p className="text-3xl font-bold text-foreground">{adminActiveRate}%</p>
                      </div>
                    </div>
                    <div className="mt-5 h-3 overflow-hidden rounded-full bg-white">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-orange-500 via-sky-500 to-emerald-500"
                        style={{ width: `${adminActiveRate}%` }}
                      />
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">
                      {adminActiveCount} active of {visibleEmployees.length} intern records.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {adminKpiWidgets.map((widget) => (
                <Card key={widget.label} className={cn('border shadow-sm', widget.cardClass)}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase text-muted-foreground">{widget.label}</p>
                        <p className="mt-2 text-3xl font-bold text-foreground">{widget.value}</p>
                      </div>
                      <div className={cn('rounded-2xl p-3', widget.iconClass)}>
                        <widget.icon className="h-5 w-5" />
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">{widget.detail}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr]">
              <Card className="border-white/80 bg-gradient-to-br from-white via-orange-50/60 to-sky-50/60 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <CardTitle>Admin Widgets</CardTitle>
                      <p className="mt-1 text-sm text-muted-foreground">Fast routes for daily portal operations.</p>
                    </div>
                    <Badge variant="outline" className="border-orange-200 bg-orange-50 text-orange-700">
                      {visibleEmployees.length} records
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {adminActionWidgets.map((item) => (
                      <button
                        key={item.label}
                        type="button"
                        className={cn(
                          'group rounded-xl border p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md',
                          item.cardClass
                        )}
                        onClick={() => navigate(item.href)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className={cn('rounded-xl p-2.5', item.iconClass)}>
                            <item.icon className="h-5 w-5" />
                          </div>
                          <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                        </div>
                        <p className="mt-4 text-sm font-semibold text-foreground">{item.label}</p>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.description}</p>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-violet-200/70 bg-gradient-to-br from-violet-50 via-white to-white shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-4">
                    <CardTitle>Status Snapshot</CardTitle>
                    <BarChart3 className="h-5 w-5 text-violet-600" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {adminStatusRows.map((status) => {
                    const percent = visibleEmployees.length > 0 ? (status.value / visibleEmployees.length) * 100 : 0;

                    return (
                      <div key={status.label} className="rounded-xl border border-white bg-white/80 p-4 shadow-sm">
                        <div className="flex items-center justify-between gap-3">
                          <Badge variant="outline" className={status.badge}>
                            {status.label}
                          </Badge>
                          <span className="text-sm font-semibold text-foreground">{status.value}</span>
                        </div>
                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                          <div className={cn('h-full rounded-full', status.color)} style={{ width: `${percent}%` }} />
                        </div>
                      </div>
                    );
                  })}
                  <Button variant="outline" className="w-full justify-between border-violet-200 bg-white/80" onClick={() => navigate('/attendance')}>
                    Open Attendance
                    <ArrowRight className="h-4 w-4 text-violet-700" />
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.9fr_1.1fr]">
              <Card className="border-emerald-200/70 bg-gradient-to-br from-emerald-50 via-white to-white shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-4">
                    <CardTitle>Department Mix</CardTitle>
                    <Building2 className="h-5 w-5 text-emerald-700" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {adminDepartmentRows.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No department data available yet.</p>
                  ) : (
                    adminDepartmentRows.map((department, index) => {
                      const percent = visibleEmployees.length > 0 ? (department.count / visibleEmployees.length) * 100 : 0;
                      const color = ['bg-orange-500', 'bg-sky-500', 'bg-emerald-500', 'bg-violet-500', 'bg-rose-500'][index] || 'bg-slate-500';

                      return (
                        <div key={department.name} className="rounded-xl border border-white bg-white/80 p-4 shadow-sm">
                          <div className="flex items-center justify-between gap-3">
                            <p className="truncate text-sm font-semibold text-foreground">{department.name}</p>
                            <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                              {department.count}
                            </span>
                          </div>
                          <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                            <div className={cn('h-full rounded-full', color)} style={{ width: `${percent}%` }} />
                          </div>
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>

              <Card className="border-sky-200/70 bg-gradient-to-br from-sky-50 via-white to-orange-50/50 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-4">
                    <CardTitle>Recent Interns</CardTitle>
                    <Badge variant="outline" className="border-sky-200 bg-sky-50 text-sky-700">
                      {adminRecentHireCount} this month
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {adminRecentHires.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No recent intern records available yet.</p>
                  ) : (
                    adminRecentHires.map((recentHire) => (
                      <button
                        key={recentHire.id}
                        type="button"
                        className="flex w-full flex-col gap-3 rounded-xl border border-white bg-white/85 px-4 py-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
                        onClick={() => navigate(`/employees/${recentHire.id}`)}
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {recentHire.first_name} {recentHire.last_name}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <span className="rounded-full bg-orange-50 px-2 py-0.5 font-medium text-orange-700">
                              {recentHire.job_title || 'Intern'}
                            </span>
                            <span>{getEmployeeDepartmentName(recentHire)}</span>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5 text-sky-700" />
                          {new Date(recentHire.hire_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      </button>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <EmployeeStatusChart employees={visibleEmployees} />
              <DepartmentDistributionChart employees={visibleEmployees} />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
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
