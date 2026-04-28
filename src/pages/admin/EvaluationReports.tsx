import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Eye, Filter, Medal, Trophy } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { EvaluationDetail } from '@/components/evaluations/EvaluationDetail';
import { isSupervisorLikeEmployee, useEmployees } from '@/hooks/useEmployees';
import { InternEvaluation, useEvaluationReports } from '@/hooks/useEvaluations';

function getInitials(name: string) {
  const [first = 'I', second = 'N'] = name.trim().split(/\s+/);
  return `${first[0] || 'I'}${second[0] || ''}`.toUpperCase();
}

export default function EvaluationReports() {
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [status, setStatus] = useState('all');
  const [awardEligible, setAwardEligible] = useState<'all' | 'yes' | 'no'>('all');
  const [departmentName, setDepartmentName] = useState('all');
  const [supervisorId, setSupervisorId] = useState('all');
  const [viewEvaluation, setViewEvaluation] = useState<InternEvaluation | null>(null);

  const filters = {
    periodStart: periodStart || undefined,
    periodEnd: periodEnd || undefined,
    status,
    awardEligible,
    departmentName,
    supervisorId: supervisorId === 'all' ? undefined : supervisorId,
  };

  const { rows, isLoading } = useEvaluationReports(filters);
  const { data: employees = [] } = useEmployees();

  const sortedRows = useMemo(
    () =>
      [...rows].sort((a, b) => {
        const scoreDelta = (b.overall_score ?? 0) - (a.overall_score ?? 0);
        if (scoreDelta !== 0) return scoreDelta;
        return new Date(b.evaluation_date).getTime() - new Date(a.evaluation_date).getTime();
      }),
    [rows]
  );

  const supervisorOptions = useMemo(() => {
    const assignedInternCounts = new Map<string, number>();

    for (const employee of employees) {
      if (!employee.manager_id) continue;
      assignedInternCounts.set(employee.manager_id, (assignedInternCounts.get(employee.manager_id) || 0) + 1);
    }

    const supervisorIds = new Set(
      employees
        .filter((employee) => (assignedInternCounts.get(employee.id) || 0) > 0)
        .map((employee) => employee.id)
    );

    return employees
      .filter((employee) => isSupervisorLikeEmployee(employee, supervisorIds))
      .map((employee) => ({
        id: employee.id,
        name: `${employee.first_name} ${employee.last_name}`,
        assignedInternCount: assignedInternCounts.get(employee.id) || 0,
      }))
      .filter((employee) => employee.assignedInternCount > 0)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [employees]);
  const departmentOptions = useMemo(
    () => Array.from(new Set(rows.map((row) => row.department_name))).sort(),
    [rows]
  );

  const topPerformers = sortedRows.slice(0, 3);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="rounded-3xl border border-intern-border/70 bg-gradient-to-r from-intern/15 via-background to-background p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Evaluation Reports</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Ranked oversight view for Admin and Principal. Intern evaluation results are sorted from highest to lowest score.
              </p>
            </div>
            <Badge variant="outline" className="w-fit border-intern-border bg-white/80">Admin & Principal View</Badge>
          </div>
        </div>

        <Card className="border-intern-border/70 bg-intern-soft/40">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Period Start</label>
                <Input type="date" value={periodStart} onChange={(event) => setPeriodStart(event.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Period End</label>
                <Input type="date" value={periodEnd} onChange={(event) => setPeriodEnd(event.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Status</label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="finalized">Finalized</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Award</label>
                <Select value={awardEligible} onValueChange={(value: 'all' | 'yes' | 'no') => setAwardEligible(value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="yes">Eligible</SelectItem>
                    <SelectItem value="no">Not Eligible</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Department</label>
                <Select value={departmentName} onValueChange={setDepartmentName}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departmentOptions.map((option) => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Supervisor</label>
                <Select value={supervisorId} onValueChange={setSupervisorId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Supervisors</SelectItem>
                    {supervisorOptions.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.name} ({option.assignedInternCount})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <>
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle>Top Performing Interns</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3">
                  {topPerformers.length === 0 ? (
                    <div className="col-span-full rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                      No ranked evaluation records yet.
                    </div>
                  ) : (
                    topPerformers.map((row, index) => (
                      <div key={row.id} className="rounded-2xl border bg-gradient-to-br from-white to-slate-50 p-4 shadow-sm">
                        <div className="mb-4 flex items-center justify-between">
                          <Badge variant="outline" className="gap-1">
                            <Medal className="h-3 w-3" />
                            Rank #{index + 1}
                          </Badge>
                          {row.award_eligible && <Badge className="bg-award text-black">Award Eligible</Badge>}
                        </div>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12 border border-slate-200">
                            <AvatarImage src={row.intern?.avatar_url || ''} />
                            <AvatarFallback className="bg-primary/10 font-semibold text-primary">
                              {getInitials(row.intern_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">{row.intern_name}</p>
                            <p className="truncate text-xs text-muted-foreground">{row.department_name}</p>
                          </div>
                        </div>
                        <div className="mt-5 flex items-end gap-2">
                          <span className="text-4xl font-black leading-none text-slate-900">{row.overall_score ?? 0}</span>
                          <span className="pb-1 text-sm font-medium text-muted-foreground">/ 100</span>
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">Supervisor: {row.supervisor_name}</p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-4 h-8 w-full gap-1.5 bg-white text-xs"
                          onClick={() => setViewEvaluation(row)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View Evaluation
                        </Button>
                      </div>
                    ))
                  )}
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Intern Ranking</CardTitle>
                <Badge variant="secondary">{sortedRows.length} records</Badge>
              </CardHeader>
              <CardContent>
                {sortedRows.length === 0 ? (
                  <div className="flex h-40 flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
                    <Filter className="h-5 w-5" />
                    No evaluations matched the current filters.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[980px] text-sm">
                      <thead>
                        <tr className="border-b text-left text-muted-foreground">
                          <th className="pb-3 font-medium">Rank</th>
                          <th className="pb-3 font-medium">Intern</th>
                          <th className="pb-3 font-medium">Supervisor</th>
                          <th className="pb-3 font-medium">Department</th>
                          <th className="pb-3 font-medium">Score</th>
                          <th className="pb-3 font-medium">Status</th>
                          <th className="pb-3 font-medium">Award</th>
                          <th className="pb-3 font-medium">Period</th>
                          <th className="pb-3 font-medium">Form</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedRows.map((row, index) => (
                          <tr key={row.id} className="border-b last:border-b-0">
                            <td className="py-4 pr-4">
                              <div className="flex items-center gap-2 font-semibold">
                                #{index + 1}
                                {index === 0 ? <ArrowUp className="h-3.5 w-3.5 text-hrms-success" /> : null}
                                {index === sortedRows.length - 1 ? <ArrowDown className="h-3.5 w-3.5 text-destructive" /> : null}
                              </div>
                            </td>
                            <td className="py-4 pr-4">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10 border border-slate-200">
                                  <AvatarImage src={row.intern?.avatar_url || ''} />
                                  <AvatarFallback className="bg-primary/10 font-semibold text-primary">
                                    {getInitials(row.intern_name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium">{row.intern_name}</div>
                                  <div className="text-xs text-muted-foreground">{row.intern?.id || 'Intern record'}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 pr-4">{row.supervisor_name}</td>
                            <td className="py-4 pr-4">{row.department_name}</td>
                            <td className="py-4 pr-4">
                              <div className="font-semibold">{row.overall_score ?? 0} / 100</div>
                            </td>
                            <td className="py-4 pr-4">
                              <Badge variant="outline">{row.status}</Badge>
                            </td>
                            <td className="py-4 pr-4">
                              {row.award_eligible ? (
                                <Badge className="bg-award text-black"><Trophy className="mr-1 h-3 w-3" />Eligible</Badge>
                              ) : (
                                <Badge variant="secondary">No</Badge>
                              )}
                            </td>
                            <td className="py-4">
                              <div className="text-xs text-muted-foreground">
                                {row.evaluation_period_start} to {row.evaluation_period_end}
                              </div>
                            </td>
                            <td className="py-4 pl-4">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 gap-1.5 bg-white text-xs"
                                onClick={() => setViewEvaluation(row)}
                              >
                                <Eye className="h-3.5 w-3.5" />
                                View Full Evaluation
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <EvaluationDetail
        open={!!viewEvaluation}
        onOpenChange={() => setViewEvaluation(null)}
        evaluation={viewEvaluation}
      />
    </MainLayout>
  );
}
