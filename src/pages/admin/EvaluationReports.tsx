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

  const { rows, summary, isLoading } = useEvaluationReports(filters);
  const { data: employees = [] } = useEmployees();
  const { rows: selectedSupervisorRows } = useEvaluationReports(
    supervisorId === 'all' ? {} : { supervisorId }
  );

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

  const selectedSupervisor = useMemo(
    () => supervisorOptions.find((option) => option.id === supervisorId) || null,
    [supervisorId, supervisorOptions]
  );

  const selectedSupervisorInterns = useMemo(
    () =>
      supervisorId === 'all'
        ? []
        : employees
            .filter((employee) => employee.manager_id === supervisorId)
            .sort((a, b) => `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`)),
    [employees, supervisorId]
  );

  const selectedSupervisorCoverage = useMemo(() => {
    if (supervisorId === 'all') {
      return {
        evaluatedCount: 0,
        missingCount: 0,
        internCards: [],
      };
    }

    const latestEvaluationByIntern = new Map<string, (typeof selectedSupervisorRows)[number]>();

    for (const row of selectedSupervisorRows) {
      const current = latestEvaluationByIntern.get(row.intern_id);
      if (!current) {
        latestEvaluationByIntern.set(row.intern_id, row);
        continue;
      }

      const currentDate = new Date(current.evaluation_date || current.created_at).getTime();
      const rowDate = new Date(row.evaluation_date || row.created_at).getTime();
      if (rowDate > currentDate) {
        latestEvaluationByIntern.set(row.intern_id, row);
      }
    }

    const internCards = selectedSupervisorInterns.map((intern) => {
      const latestEvaluation = latestEvaluationByIntern.get(intern.id) || null;
      return {
        intern,
        latestEvaluation,
        hasEvaluation: Boolean(latestEvaluation),
      };
    });

    const evaluatedCount = internCards.filter((card) => card.hasEvaluation).length;
    const missingCount = internCards.length - evaluatedCount;

    return {
      evaluatedCount,
      missingCount,
      internCards,
    };
  }, [selectedSupervisorInterns, selectedSupervisorRows, supervisorId]);

  const categoryAverageData = [
    { category: 'Attendance', value: summary.categoryAverages.attendance },
    { category: 'Attitude', value: summary.categoryAverages.attitude },
    { category: 'Ethics', value: summary.categoryAverages.ethics },
    { category: 'Quality', value: summary.categoryAverages.quality },
    { category: 'Teamwork', value: summary.categoryAverages.teamwork },
  ];

  const topPerformers = sortedRows.slice(0, 3);
  const needsAttention = [...sortedRows]
    .filter((row) => (row.overall_score ?? 0) < 75)
    .slice(0, 5);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="rounded-3xl border border-orange-200/70 bg-gradient-to-r from-orange-500/12 via-background to-background p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Evaluation Reports</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Ranked oversight view for Admin and Principal. Intern evaluation results are sorted from highest to lowest score.
              </p>
            </div>
            <Badge variant="outline" className="w-fit border-orange-200 bg-white/80">Admin & Principal View</Badge>
          </div>
        </div>

        <Card className="border-orange-200/70 bg-orange-50/40">
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

        {selectedSupervisor && (
          <Card className="border-sky-200/70 bg-sky-50/40 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-2">
                  <CardTitle className="text-base">Assigned Intern Coverage</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Quickly see who already has a supervisor evaluation on file, who still needs one, and open the exact completed rubric for review.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="w-fit border-sky-200 bg-white/80">
                    {selectedSupervisor.name} • {selectedSupervisor.assignedInternCount} assigned
                  </Badge>
                  <Badge className="gap-1 bg-emerald-600/90">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {selectedSupervisorCoverage.evaluatedCount} evaluated
                  </Badge>
                  <Badge variant="secondary" className="gap-1 bg-amber-100 text-amber-900 hover:bg-amber-100">
                    <FileWarning className="h-3.5 w-3.5" />
                    {selectedSupervisorCoverage.missingCount} missing
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {selectedSupervisorInterns.length === 0 ? (
                <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
                  No assigned interns were found for this supervisor.
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {selectedSupervisorCoverage.internCards.map(({ intern, latestEvaluation, hasEvaluation }) => (
                    <div
                      key={intern.id}
                      className={`rounded-2xl border p-4 shadow-sm transition-colors ${
                        hasEvaluation
                          ? 'border-emerald-200 bg-white'
                          : 'border-amber-200 bg-amber-50/60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <Avatar className="h-11 w-11 border border-slate-200">
                            <AvatarImage src={intern.avatar_url || ''} />
                            <AvatarFallback className="bg-primary/10 font-semibold text-primary">
                              {getInitials(`${intern.first_name} ${intern.last_name}`)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">{intern.first_name} {intern.last_name}</p>
                            <p className="truncate text-xs text-muted-foreground">{intern.job_title || 'Intern'}</p>
                            <p className="truncate text-xs text-muted-foreground">{intern.department?.name || 'Unassigned Department'}</p>
                          </div>
                        </div>
                        {hasEvaluation ? (
                          <div className="shrink-0 text-right">
                            <p className="text-2xl font-black leading-none text-slate-900">{latestEvaluation?.overall_score ?? 0}</p>
                            <p className="text-[11px] text-muted-foreground">/ 100</p>
                          </div>
                        ) : (
                          <Badge variant="secondary" className="shrink-0 bg-amber-100 text-amber-900 hover:bg-amber-100">
                            Missing
                          </Badge>
                        )}
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {hasEvaluation ? (
                          <>
                            <Badge className="gap-1 bg-emerald-600/90">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              {latestEvaluation?.status === 'draft' ? 'Draft saved' : 'Evaluation on file'}
                            </Badge>
                            {latestEvaluation?.award_eligible ? (
                              <Badge className="bg-amber-500 text-black">
                                <Trophy className="mr-1 h-3 w-3" />
                                Award Eligible
                              </Badge>
                            ) : null}
                          </>
                        ) : (
                          <Badge variant="secondary" className="gap-1 bg-amber-100 text-amber-900 hover:bg-amber-100">
                            <Clock3 className="h-3.5 w-3.5" />
                            No evaluation yet
                          </Badge>
                        )}
                      </div>

                      <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                        {hasEvaluation ? (
                          <>
                            <p>
                              Latest status: <span className="font-medium text-foreground capitalize">{latestEvaluation?.status || 'draft'}</span>
                            </p>
                            <p>
                              Evaluation period: <span className="font-medium text-foreground">{latestEvaluation?.evaluation_period_start} to {latestEvaluation?.evaluation_period_end}</span>
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-2 h-8 gap-1.5 bg-white text-xs"
                              onClick={() => latestEvaluation && setViewEvaluation(latestEvaluation)}
                            >
                              <Eye className="h-3.5 w-3.5" />
                              View Full Evaluation
                            </Button>
                          </>
                        ) : (
                          <p>
                            This assigned intern does not have any supervisor evaluation record yet.
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard title="Evaluations" value={summary.evaluationCount} icon={ClipboardCheck} />
          <MetricCard title="Average Score" value={summary.averageOverallScore.toFixed(2)} suffix="/100" icon={BarChart3} />
          <MetricCard title="Award Eligible" value={summary.awardEligibleCount} icon={Award} />
          <MetricCard title="Supervisors" value={summary.supervisorBreakdown.length} icon={Users} />
        </div>

        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
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
                          {row.award_eligible && <Badge className="bg-amber-500 text-black">Award Eligible</Badge>}
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
                          View Exact Answers
                        </Button>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle>Needs Attention</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {needsAttention.length === 0 ? (
                    <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                      No low-score evaluations in the current report view.
                    </div>
                  ) : (
                    needsAttention.map((row) => (
                      <div key={row.id} className="flex items-center justify-between gap-3 rounded-2xl border bg-white p-4">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{row.intern_name}</p>
                          <p className="truncate text-xs text-muted-foreground">{row.supervisor_name} • {row.department_name}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-destructive">{row.overall_score ?? 0}</p>
                          <p className="text-[11px] text-muted-foreground">/ 100</p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2 h-7 gap-1.5 bg-white text-[11px]"
                            onClick={() => setViewEvaluation(row)}
                          >
                            <Eye className="h-3 w-3" />
                            View
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <Card className="border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle>Average Score by Supervisor</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer className="h-[300px] w-full" config={chartConfig}>
                    <BarChart data={summary.supervisorBreakdown.slice(0, 8)}>
                      <CartesianGrid vertical={false} />
                      <XAxis dataKey="supervisorName" tickLine={false} axisLine={false} interval={0} angle={-20} textAnchor="end" height={70} />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="averageScore" fill="var(--color-averageScore)" radius={8} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle>Score Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer className="h-[300px] w-full" config={chartConfig}>
                    <PieChart>
                      <ChartTooltip content={<ChartTooltipContent nameKey="label" />} />
                      <Pie data={summary.scoreBands} dataKey="value" nameKey="label" outerRadius={100}>
                        {summary.scoreBands.map((entry, index) => (
                          <Cell key={entry.label} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ChartContainer>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {summary.scoreBands.map((entry, index) => (
                      <Badge key={entry.label} variant="outline" className="gap-2">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
                        {entry.label}: {entry.value}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle>Category Averages</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer className="h-[280px] w-full" config={chartConfig}>
                  <BarChart data={categoryAverageData}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="category" tickLine={false} axisLine={false} />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="value" fill="var(--color-value)" radius={8} />
                  </BarChart>
                </ChartContainer>
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
                                {index === 0 ? <ArrowUp className="h-3.5 w-3.5 text-emerald-600" /> : null}
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
                                <Badge className="bg-amber-500 text-black"><Trophy className="mr-1 h-3 w-3" />Eligible</Badge>
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

function MetricCard({
  title,
  value,
  icon: Icon,
  suffix,
}: {
  title: string;
  value: string | number;
  icon: typeof ClipboardCheck;
  suffix?: string;
}) {
  return (
    <Card className="border-l-4 border-l-primary shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{title}</p>
            <p className="mt-2 text-2xl font-black">
              {value}
              {suffix && <span className="text-sm font-medium text-muted-foreground"> {suffix}</span>}
            </p>
          </div>
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </CardContent>
    </Card>
  );
}
