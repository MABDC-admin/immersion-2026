import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useImpersonation } from '@/hooks/useImpersonation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Loader2, Search, Eye, Users, AlertTriangle, CheckCircle2, UserCheck, Shield, Building, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ManageSupervisorInternsModal } from './ManageSupervisorInternsModal';

const ROLES = [
  { value: 'all', label: 'All Roles' },
  { value: 'admin', label: 'Admin' },
  { value: 'hr_manager', label: 'HR Manager' },
  { value: 'principal', label: 'Principal' },
  { value: 'supervisor', label: 'Supervisor' },
  { value: 'manager', label: 'Manager' },
  { value: 'payroll_officer', label: 'Payroll Officer' },
  { value: 'employee', label: 'Employee' },
];

const roleLabels: Record<string, string> = {
  admin: 'Admin',
  hr_manager: 'HR Manager',
  principal: 'Principal',
  supervisor: 'Supervisor',
  manager: 'Manager',
  payroll_officer: 'Payroll Officer',
  employee: 'Employee',
};

const roleColors: Record<string, string> = {
  admin: 'bg-destructive/10 text-destructive border-destructive/20',
  hr_manager: 'bg-primary/10 text-primary border-primary/20',
  principal: 'bg-evalinfo-soft0/10 text-evalinfo border-sky-500/20',
  supervisor: 'bg-hrms-success/100/10 text-hrms-success border-emerald-500/20',
  manager: 'bg-accent text-accent-foreground border-accent',
  payroll_officer: 'bg-secondary text-secondary-foreground border-secondary',
  employee: 'bg-muted text-muted-foreground border-muted',
};

const ROLE_PRIORITY = ['admin', 'hr_manager', 'principal', 'supervisor', 'manager', 'payroll_officer', 'employee'] as const;

function resolvePrimaryRole(roles: string[]) {
  return ROLE_PRIORITY.find((role) => roles.includes(role)) || 'employee';
}

interface AssignedIntern {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  jobTitle: string | null;
  departmentName: string | null;
}

interface PortalUser {
  userId: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  avatarUrl: string | null;
  jobTitle: string | null;
  departmentName: string | null;
  assignedInternCount: number;
  assignedInterns: AssignedIntern[];
}

function usePortalUsers() {
  return useQuery({
    queryKey: ['impersonation-portal-users'],
    queryFn: async () => {
      // Fetch all data in parallel — include department relation
      const [
        { data: profiles, error: profilesError },
        { data: roles, error: rolesError },
        { data: employees, error: employeesError },
      ] = await Promise.all([
        supabase.from('profiles').select('*'),
        supabase.from('user_roles').select('*'),
        supabase.from('employees').select('id, user_id, first_name, last_name, email, job_title, avatar_url, manager_id, department_id, department:departments(id, name)'),
      ]);

      if (profilesError) throw profilesError;
      if (rolesError) throw rolesError;
      if (employeesError) throw employeesError;

      // Build role map
      const roleMap = new Map<string, string[]>();
      (roles || []).forEach((record: any) => {
        const existing = roleMap.get(record.user_id) || [];
        existing.push(record.role);
        roleMap.set(record.user_id, existing);
      });

      // Build employee map (user_id -> employee)
      const employeeByUserId = new Map<string, any>();
      (employees || []).forEach((emp: any) => {
        if (emp.user_id) employeeByUserId.set(emp.user_id, emp);
      });

      // Build employee map by ID for intern lookup
      const employeeById = new Map<string, any>();
      (employees || []).forEach((emp: any) => {
        employeeById.set(emp.id, emp);
      });

      // Build assigned interns per supervisor (employees where manager_id = supervisor employee id)
      const internsByManager = new Map<string, AssignedIntern[]>();
      (employees || []).forEach((emp: any) => {
        if (emp.manager_id) {
          const list = internsByManager.get(emp.manager_id) || [];
          list.push({
            id: emp.id,
            firstName: emp.first_name,
            lastName: emp.last_name,
            email: emp.email,
            jobTitle: emp.job_title || null,
            departmentName: emp.department?.name || null,
          });
          internsByManager.set(emp.manager_id, list);
        }
      });

      // Build final portal user list
      const portalUsers: PortalUser[] = [];
      (profiles || []).forEach((profile: any) => {
        const userRoles = roleMap.get(profile.user_id) || [];
        const primaryRole = resolvePrimaryRole(userRoles);
        const emp = employeeByUserId.get(profile.user_id);
        const interns = emp ? (internsByManager.get(emp.id) || []) : [];

        portalUsers.push({
          userId: profile.user_id,
          employeeId: emp?.id || '',
          firstName: emp?.first_name || profile.first_name || '',
          lastName: emp?.last_name || profile.last_name || '',
          email: emp?.email || '',
          role: primaryRole,
          avatarUrl: emp?.avatar_url || profile.avatar_url || null,
          jobTitle: emp?.job_title || null,
          departmentName: emp?.department?.name || null,
          assignedInternCount: interns.length,
          assignedInterns: interns,
        });
      });

      return portalUsers.sort((a, b) => {
        const roleOrder = ROLE_PRIORITY.indexOf(a.role as any) - ROLE_PRIORITY.indexOf(b.role as any);
        if (roleOrder !== 0) return roleOrder;
        return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
      });
    },
  });
}

export function ImpersonationTab() {
  const { data: users = [], isLoading } = usePortalUsers();
  const { startImpersonation, isImpersonating, impersonating } = useImpersonation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [expandedSupervisors, setExpandedSupervisors] = useState<Set<string>>(new Set());
  const [managingSupervisor, setManagingSupervisor] = useState<PortalUser | null>(null);

  const toggleSupervisorExpand = (userId: string) => {
    setExpandedSupervisors((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          u.firstName.toLowerCase().includes(q) ||
          u.lastName.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.jobTitle || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [users, searchQuery, roleFilter]);

  const supervisors = useMemo(() => users.filter((u) => u.role === 'supervisor'), [users]);
  const supervisorsWithInterns = supervisors.filter((s) => s.assignedInternCount > 0);
  const supervisorsWithoutInterns = supervisors.filter((s) => s.assignedInternCount === 0);

  const handleImpersonate = (user: PortalUser) => {
    if (!user.employeeId) {
      toast.error('This user has no linked employee record — cannot impersonate.');
      return;
    }
    startImpersonation({
      userId: user.userId,
      employeeId: user.employeeId,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
    });
    toast.success(`Now viewing as ${user.firstName} ${user.lastName} (${roleLabels[user.role] || user.role})`);
    navigate('/dashboard');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Supervisor Inspection Card */}
      <Card className="border-l-4 border-l-emerald-500 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <UserCheck className="h-5 w-5 text-hrms-success" />
            Supervisor Intern Assignment Inspection
          </CardTitle>
          <CardDescription>
            Check which supervisors have interns assigned and which ones are empty.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div className="rounded-xl border bg-muted/30 px-4 py-3">
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Total Supervisors</p>
              <p className="text-2xl font-bold mt-1">{supervisors.length}</p>
            </div>
            <div className="rounded-xl border border-hrms-success/30 bg-hrms-success/100/5 px-4 py-3">
              <p className="text-xs uppercase tracking-widest text-hrms-success font-semibold">With Interns</p>
              <p className="text-2xl font-bold mt-1 text-hrms-success">{supervisorsWithInterns.length}</p>
            </div>
            <div className="rounded-xl border border-hrms-warning/30 bg-hrms-warning/100/5 px-4 py-3">
              <p className="text-xs uppercase tracking-widest text-hrms-warning font-semibold">No Interns</p>
              <p className="text-2xl font-bold mt-1 text-hrms-warning">{supervisorsWithoutInterns.length}</p>
            </div>
          </div>

          {supervisors.length === 0 ? (
            <div className="text-center py-6 text-sm text-muted-foreground">
              No supervisor accounts found.
            </div>
          ) : (
            <div className="space-y-2">
              {supervisors.map((sup) => {
                const isExpanded = expandedSupervisors.has(sup.userId);
                return (
                  <Collapsible key={sup.userId} open={isExpanded} onOpenChange={() => toggleSupervisorExpand(sup.userId)}>
                    <div className="rounded-xl border bg-background hover:bg-muted/30 transition-colors overflow-hidden">
                      <div className="flex items-center justify-between gap-3 px-4 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={sup.avatarUrl || ''} />
                            <AvatarFallback className="text-xs bg-hrms-success/100/10 text-hrms-success">
                              {sup.firstName?.[0]}{sup.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate">{sup.firstName} {sup.lastName}</p>
                            <p className="text-xs text-muted-foreground truncate">{sup.email}</p>
                          </div>
                          {sup.departmentName && (
                            <Badge variant="outline" className="border-blue-200 bg-blue-500/10 text-blue-700 gap-1 shrink-0">
                              <Building className="h-3 w-3" />
                              {sup.departmentName}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1.5 text-xs text-primary border-primary/20 hover:bg-primary/10"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!sup.employeeId) {
                                toast.error('This supervisor has no employee record to attach interns to.');
                                return;
                              }
                              setManagingSupervisor(sup);
                            }}
                          >
                            <Users className="h-3.5 w-3.5" />
                            Manage Interns
                          </Button>
                          {sup.assignedInternCount > 0 ? (
                            <CollapsibleTrigger asChild>
                              <Badge variant="outline" className="border-hrms-success/30 bg-hrms-success/100/10 text-hrms-success gap-1.5 cursor-pointer hover:bg-hrms-success/100/20 transition-colors">
                                <CheckCircle2 className="h-3 w-3" />
                                {sup.assignedInternCount} intern{sup.assignedInternCount !== 1 ? 's' : ''}
                                <ChevronDown className={cn('h-3 w-3 transition-transform', isExpanded && 'rotate-180')} />
                              </Badge>
                            </CollapsibleTrigger>
                          ) : (
                            <Badge variant="outline" className="border-hrms-warning/30 bg-hrms-warning/100/10 text-hrms-warning gap-1.5">
                              <AlertTriangle className="h-3 w-3" />
                              No interns assigned
                            </Badge>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-1.5 text-xs"
                            onClick={() => handleImpersonate(sup)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View As
                          </Button>
                        </div>
                      </div>
                      <CollapsibleContent>
                        {sup.assignedInterns.length > 0 && (
                          <div className="border-t bg-muted/20 px-4 py-3">
                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-2">
                              Assigned Interns
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                              {sup.assignedInterns.map((intern) => (
                                <div
                                  key={intern.id}
                                  className="flex items-center gap-2.5 rounded-lg border bg-background px-3 py-2"
                                >
                                  <Avatar className="h-7 w-7">
                                    <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                                      {intern.firstName?.[0]}{intern.lastName?.[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs font-semibold truncate">{intern.firstName} {intern.lastName}</p>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                      {intern.departmentName ? (
                                        <span className="text-[10px] text-blue-600 font-medium flex items-center gap-0.5">
                                          <Building className="h-2.5 w-2.5" />
                                          {intern.departmentName}
                                        </span>
                                      ) : (
                                        <span className="text-[10px] text-muted-foreground italic">No department</span>
                                      )}
                                      {intern.jobTitle && (
                                        <>
                                          <span className="text-[10px] text-muted-foreground">·</span>
                                          <span className="text-[10px] text-muted-foreground truncate">{intern.jobTitle}</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Full Portal User Directory */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="h-5 w-5 text-primary" />
                Portal User Impersonation
              </CardTitle>
              <CardDescription className="mt-1">
                View the app as any portal user. This is a read-only perspective — no data will be modified.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-56">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Job Title</TableHead>
                <TableHead className="text-center">Assigned Interns</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No matching users found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((u) => (
                  <TableRow
                    key={u.userId}
                    className={isImpersonating && impersonating?.userId === u.userId ? 'bg-hrms-warning/100/5' : ''}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={u.avatarUrl || ''} />
                          <AvatarFallback className="text-xs">
                            {u.firstName?.[0] || 'U'}{u.lastName?.[0] || ''}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{u.firstName} {u.lastName}</p>
                          <p className="text-xs text-muted-foreground">{u.email || u.userId.slice(0, 8) + '...'}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={roleColors[u.role] || roleColors.employee}>
                        {roleLabels[u.role] || u.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {u.departmentName ? (
                        <Badge variant="outline" className="border-blue-200 bg-blue-500/5 text-blue-700 gap-1 text-xs">
                          <Building className="h-3 w-3" />
                          {u.departmentName}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">{u.jobTitle || '—'}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      {u.role === 'supervisor' ? (
                        u.assignedInternCount > 0 ? (
                          <Badge variant="outline" className="border-hrms-success/30 bg-hrms-success/100/10 text-hrms-success">
                            {u.assignedInternCount}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-hrms-warning/30 bg-hrms-warning/100/10 text-hrms-warning">
                            0
                          </Badge>
                        )
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1.5 text-xs hover:bg-hrms-warning/100/10 hover:border-amber-300"
                        onClick={() => handleImpersonate(u)}
                        disabled={!u.employeeId}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View As
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ManageSupervisorInternsModal
        open={!!managingSupervisor}
        onOpenChange={(open) => !open && setManagingSupervisor(null)}
        supervisor={managingSupervisor}
      />
    </div>
  );
}
