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

const TOP_PERFORMER_STYLES = [
  {
    card: 'border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50',
    badge: 'border-amber-200 bg-amber-100 text-amber-800',
    avatar: 'border-amber-200 bg-amber-100 text-amber-800',
    score: 'text-amber-700',
    button: 'border-amber-200 bg-white text-amber-800 hover:bg-amber-50',
  },
  {
    card: 'border-violet-200 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50',
    badge: 'border-violet-200 bg-violet-100 text-violet-800',
    avatar: 'border-violet-200 bg-violet-100 text-violet-800',
    score: 'text-violet-700',
    button: 'border-violet-200 bg-white text-violet-800 hover:bg-violet-50',
  },
  {
    card: 'border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-cyan-50',
    badge: 'border-emerald-200 bg-emerald-100 text-emerald-800',
    avatar: 'border-emerald-200 bg-emerald-100 text-emerald-800',
    score: 'text-emerald-700',
    button: 'border-emerald-200 bg-white text-emerald-800 hover:bg-emerald-50',
  },
] as const;

function getRankAccent(index: number) {
  return TOP_PERFORMER_STYLES[index] || TOP_PERFORMER_STYLES[2];
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
        <div className="rounded-3xl border border-orange-200 bg-gradient-to-r from-orange-50 via-white to-cyan-50 p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Evaluation Reports</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Ranked oversight view for Admin and Principal. Intern evaluation results are sorted from highest to lowest score.
              </p>
            </div>
            <Badge variant="outline" className="w-fit border-cyan-200 bg-cyan-50 text-cyan-800">Admin & Principal View</Badge>
          </div>
        </div>

        <Card className="border-violet-200 bg-gradient-to-r from-violet-50/80 via-white to-amber-50/80">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
              <div className="space-y-2 rounded-2xl border border-cyan-100 bg-cyan-50/60 p-3">
                <label className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Period Start</label>
                <Input type="date" value={periodStart} onChange={(event) => setPeriodStart(event.target.value)} />
              </div>
              <div className="space-y-2 rounded-2xl border border-cyan-100 bg-cyan-50/60 p-3">
                <label className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Period End</label>
                <Input type="date" value={periodEnd} onChange={(event) => setPeriodEnd(event.target.value)} />
              </div>
              <div className="space-y-2 rounded-2xl border border-violet-100 bg-violet-50/60 p-3">
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
              <div className="space-y-2 rounded-2xl border border-amber-100 bg-amber-50/60 p-3">
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
              <div className="space-y-2 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-3">
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
              <div className="space-y-2 rounded-2xl border border-rose-100 bg-rose-50/60 p-3">
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
            <Card className="border-amber-200 bg-gradient-to-br from-amber-50/70 via-white to-violet-50/70 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle>Top Performing Interns</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3">
                  {topPerformers.length === 0 ? (
                    <div className="col-span-full rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                      No ranked evaluation records yet.
                    </div>
                  ) : (
                    topPerformers.map((row, index) => {
                      const accent = getRankAccent(index);

                      return (
                      <div key={row.id} className={`rounded-2xl border p-4 shadow-sm ${accent.card}`}>
                        <div className="mb-4 flex items-center justify-between">
                          <Badge variant="outline" className={`gap-1 ${accent.badge}`}>
                            <Medal className="h-3 w-3" />
                            Rank #{index + 1}
                          </Badge>
                          {row.award_eligible && <Badge className="bg-award text-black">Award Eligible</Badge>}
                        </div>
                        <div className="flex items-center gap-3">
                          <Avatar className={`h-12 w-12 border ${accent.avatar}`}>
                            <AvatarImage src={row.intern?.avatar_url || ''} />
                            <AvatarFallback className={accent.avatar}>
                              {getInitials(row.intern_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">{row.intern_name}</p>
                            <p className="truncate text-xs text-muted-foreground">{row.department_name}</p>
                          </div>
                        </div>
                        <div className="mt-5 flex items-end gap-2">
                          <span className={`text-4xl font-black leading-none ${accent.score}`}>{row.overall_score ?? 0}</span>
                          <span className="pb-1 text-sm font-medium text-muted-foreground">/ 100</span>
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">Supervisor: {row.supervisor_name}</p>
                        <Button
                          variant="outline"
                          size="sm"
                          className={`mt-4 h-8 w-full gap-1.5 text-xs ${accent.button}`}
                          onClick={() => setViewEvaluation(row)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View Evaluation
                        </Button>
                      </div>
                      );
                    })
                  )}
              </CardContent>
            </Card>

            <Card className="border-cyan-200 bg-gradient-to-br from-cyan-50/60 via-white to-rose-50/50 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Intern Ranking</CardTitle>
                <Badge variant="secondary" className="bg-cyan-100 text-cyan-800">{sortedRows.length} records</Badge>
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
                        <tr className="border-b border-cyan-100 text-left text-muted-foreground">
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
                        {sortedRows.map((row, index) => {
                          const accent = getRankAccent(index % TOP_PERFORMER_STYLES.length);

                          return (
                          <tr key={row.id} className="border-b border-cyan-100 bg-white/70 transition-colors hover:bg-white last:border-b-0">
                            <td className="py-4 pr-4">
                              <div className={`flex w-fit items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${accent.badge}`}>
                                #{index + 1}
                                {index === 0 ? <ArrowUp className="h-3.5 w-3.5 text-hrms-success" /> : null}
                                {index === sortedRows.length - 1 ? <ArrowDown className="h-3.5 w-3.5 text-destructive" /> : null}
                              </div>
                            </td>
                            <td className="py-4 pr-4">
                              <div className="flex items-center gap-3">
                                <Avatar className={`h-10 w-10 border ${accent.avatar}`}>
                                  <AvatarImage src={row.intern?.avatar_url || ''} />
                                  <AvatarFallback className={accent.avatar}>
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
                              <div className={`font-semibold ${accent.score}`}>{row.overall_score ?? 0} / 100</div>
                            </td>
                            <td className="py-4 pr-4">
                              <Badge variant="outline" className="border-violet-200 bg-violet-50 text-violet-800">{row.status}</Badge>
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
                                className={`h-8 gap-1.5 text-xs ${accent.button}`}
                                onClick={() => setViewEvaluation(row)}
                              >
                                <Eye className="h-3.5 w-3.5" />
                                View Full Evaluation
                              </Button>
                            </td>
                          </tr>
                          );
                        })}
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
