-- 1) Rubric columns
alter table public.intern_evaluations
  add column if not exists attendance_arrives_on_time smallint,
  add column if not exists attendance_absence_communication smallint,
  add column if not exists attendance_schedule_adherence smallint,
  add column if not exists attendance_meeting_deadline_punctuality smallint,
  add column if not exists attitude_positive_towards_work smallint,
  add column if not exists attitude_willingness_to_learn smallint,
  add column if not exists attitude_initiative_in_tasks smallint,
  add column if not exists attitude_resilience_under_pressure smallint,
  add column if not exists ethics_task_reliability smallint,
  add column if not exists ethics_professional_behavior smallint,
  add column if not exists ethics_confidentiality smallint,
  add column if not exists ethics_accountability_for_mistakes smallint,
  add column if not exists quality_accuracy_thoroughness smallint,
  add column if not exists quality_creativity_problem_solving smallint,
  add column if not exists quality_meeting_project_goals smallint,
  add column if not exists quality_initiative_new_tasks smallint,
  add column if not exists teamwork_team_communication smallint,
  add column if not exists teamwork_supportiveness smallint,
  add column if not exists teamwork_flexibility_adaptability smallint,
  add column if not exists teamwork_conflict_resolution smallint,
  add column if not exists supervisor_comments text,
  add column if not exists submitted_at timestamptz,
  add column if not exists finalized_at timestamptz;

-- 2) Range checks (1..5) – idempotent
do $$
declare
  cols text[] := array[
    'attendance_arrives_on_time','attendance_absence_communication','attendance_schedule_adherence','attendance_meeting_deadline_punctuality',
    'attitude_positive_towards_work','attitude_willingness_to_learn','attitude_initiative_in_tasks','attitude_resilience_under_pressure',
    'ethics_task_reliability','ethics_professional_behavior','ethics_confidentiality','ethics_accountability_for_mistakes',
    'quality_accuracy_thoroughness','quality_creativity_problem_solving','quality_meeting_project_goals','quality_initiative_new_tasks',
    'teamwork_team_communication','teamwork_supportiveness','teamwork_flexibility_adaptability','teamwork_conflict_resolution'
  ];
  c text;
  cname text;
begin
  foreach c in array cols loop
    cname := 'intern_evaluations_' || c || '_chk';
    if not exists (select 1 from pg_constraint where conname = cname) then
      execute format('alter table public.intern_evaluations add constraint %I check (%I between 1 and 5 or %I is null)', cname, c, c);
    end if;
  end loop;
end $$;

-- 3) Generated totals
alter table public.intern_evaluations
  add column if not exists attendance_total smallint
    generated always as (
      coalesce(attendance_arrives_on_time,0)+coalesce(attendance_absence_communication,0)+
      coalesce(attendance_schedule_adherence,0)+coalesce(attendance_meeting_deadline_punctuality,0)
    ) stored,
  add column if not exists attitude_total smallint
    generated always as (
      coalesce(attitude_positive_towards_work,0)+coalesce(attitude_willingness_to_learn,0)+
      coalesce(attitude_initiative_in_tasks,0)+coalesce(attitude_resilience_under_pressure,0)
    ) stored,
  add column if not exists ethics_total smallint
    generated always as (
      coalesce(ethics_task_reliability,0)+coalesce(ethics_professional_behavior,0)+
      coalesce(ethics_confidentiality,0)+coalesce(ethics_accountability_for_mistakes,0)
    ) stored,
  add column if not exists quality_total smallint
    generated always as (
      coalesce(quality_accuracy_thoroughness,0)+coalesce(quality_creativity_problem_solving,0)+
      coalesce(quality_meeting_project_goals,0)+coalesce(quality_initiative_new_tasks,0)
    ) stored,
  add column if not exists teamwork_total smallint
    generated always as (
      coalesce(teamwork_team_communication,0)+coalesce(teamwork_supportiveness,0)+
      coalesce(teamwork_flexibility_adaptability,0)+coalesce(teamwork_conflict_resolution,0)
    ) stored,
  add column if not exists overall_score smallint
    generated always as (
      coalesce(attendance_arrives_on_time,0)+coalesce(attendance_absence_communication,0)+coalesce(attendance_schedule_adherence,0)+coalesce(attendance_meeting_deadline_punctuality,0)+
      coalesce(attitude_positive_towards_work,0)+coalesce(attitude_willingness_to_learn,0)+coalesce(attitude_initiative_in_tasks,0)+coalesce(attitude_resilience_under_pressure,0)+
      coalesce(ethics_task_reliability,0)+coalesce(ethics_professional_behavior,0)+coalesce(ethics_confidentiality,0)+coalesce(ethics_accountability_for_mistakes,0)+
      coalesce(quality_accuracy_thoroughness,0)+coalesce(quality_creativity_problem_solving,0)+coalesce(quality_meeting_project_goals,0)+coalesce(quality_initiative_new_tasks,0)+
      coalesce(teamwork_team_communication,0)+coalesce(teamwork_supportiveness,0)+coalesce(teamwork_flexibility_adaptability,0)+coalesce(teamwork_conflict_resolution,0)
    ) stored,
  add column if not exists overall_rating numeric(4,2)
    generated always as (
      round(((
        coalesce(attendance_arrives_on_time,0)+coalesce(attendance_absence_communication,0)+coalesce(attendance_schedule_adherence,0)+coalesce(attendance_meeting_deadline_punctuality,0)+
        coalesce(attitude_positive_towards_work,0)+coalesce(attitude_willingness_to_learn,0)+coalesce(attitude_initiative_in_tasks,0)+coalesce(attitude_resilience_under_pressure,0)+
        coalesce(ethics_task_reliability,0)+coalesce(ethics_professional_behavior,0)+coalesce(ethics_confidentiality,0)+coalesce(ethics_accountability_for_mistakes,0)+
        coalesce(quality_accuracy_thoroughness,0)+coalesce(quality_creativity_problem_solving,0)+coalesce(quality_meeting_project_goals,0)+coalesce(quality_initiative_new_tasks,0)+
        coalesce(teamwork_team_communication,0)+coalesce(teamwork_supportiveness,0)+coalesce(teamwork_flexibility_adaptability,0)+coalesce(teamwork_conflict_resolution,0)
      ) / 20.0)::numeric, 2)
    ) stored,
  add column if not exists award_eligible boolean
    generated always as (
      (
        coalesce(attendance_arrives_on_time,0)+coalesce(attendance_absence_communication,0)+coalesce(attendance_schedule_adherence,0)+coalesce(attendance_meeting_deadline_punctuality,0)+
        coalesce(attitude_positive_towards_work,0)+coalesce(attitude_willingness_to_learn,0)+coalesce(attitude_initiative_in_tasks,0)+coalesce(attitude_resilience_under_pressure,0)+
        coalesce(ethics_task_reliability,0)+coalesce(ethics_professional_behavior,0)+coalesce(ethics_confidentiality,0)+coalesce(ethics_accountability_for_mistakes,0)+
        coalesce(quality_accuracy_thoroughness,0)+coalesce(quality_creativity_problem_solving,0)+coalesce(quality_meeting_project_goals,0)+coalesce(quality_initiative_new_tasks,0)+
        coalesce(teamwork_team_communication,0)+coalesce(teamwork_supportiveness,0)+coalesce(teamwork_flexibility_adaptability,0)+coalesce(teamwork_conflict_resolution,0)
      ) >= 90
    ) stored;

-- 4) Status default + check
alter table public.intern_evaluations alter column status set default 'draft';
do $$ begin
  if not exists (select 1 from pg_constraint where conname='intern_evaluations_status_chk') then
    alter table public.intern_evaluations
      add constraint intern_evaluations_status_chk check (status in ('draft','submitted','finalized'));
  end if;
end $$;

-- 5) Indexes
create unique index if not exists intern_evaluations_unique_period
  on public.intern_evaluations (evaluator_id, intern_id, evaluation_period_start, evaluation_period_end);
create index if not exists intern_evaluations_evaluator_idx
  on public.intern_evaluations (evaluator_id, status, evaluation_date desc);
create index if not exists intern_evaluations_intern_idx
  on public.intern_evaluations (intern_id, status, evaluation_date desc);

-- 6) Reporting views (security_invoker so RLS still applies)
create or replace view public.evaluation_reports_v1
with (security_invoker = true) as
select
  ie.id, ie.intern_id, ie.evaluator_id as supervisor_id,
  ie.evaluation_date, ie.evaluation_period_start, ie.evaluation_period_end, ie.status,
  ie.attendance_total, ie.attitude_total, ie.ethics_total, ie.quality_total, ie.teamwork_total,
  ie.overall_score, ie.overall_rating, ie.award_eligible,
  intern.first_name || ' ' || intern.last_name as intern_name,
  intern.department_id as intern_department_id,
  dept.name as department_name,
  supervisor.first_name || ' ' || supervisor.last_name as supervisor_name
from public.intern_evaluations ie
join public.employees intern on intern.id = ie.intern_id
left join public.departments dept on dept.id = intern.department_id
join public.employees supervisor on supervisor.id = ie.evaluator_id;

create or replace view public.evaluation_report_summary_v1
with (security_invoker = true) as
select
  evaluation_period_start, evaluation_period_end, status,
  count(*) as evaluation_count,
  round(avg(overall_score)::numeric, 2) as avg_overall_score,
  round(avg(attendance_total)::numeric, 2) as avg_attendance_total,
  round(avg(attitude_total)::numeric, 2) as avg_attitude_total,
  round(avg(ethics_total)::numeric, 2) as avg_ethics_total,
  round(avg(quality_total)::numeric, 2) as avg_quality_total,
  round(avg(teamwork_total)::numeric, 2) as avg_teamwork_total,
  count(*) filter (where award_eligible) as award_eligible_count
from public.intern_evaluations
group by evaluation_period_start, evaluation_period_end, status;

create or replace view public.evaluation_report_by_supervisor_v1
with (security_invoker = true) as
select
  ie.evaluator_id as supervisor_id,
  supervisor.first_name || ' ' || supervisor.last_name as supervisor_name,
  count(*) as evaluation_count,
  round(avg(ie.overall_score)::numeric, 2) as avg_overall_score,
  count(*) filter (where ie.award_eligible) as award_eligible_count
from public.intern_evaluations ie
join public.employees supervisor on supervisor.id = ie.evaluator_id
group by ie.evaluator_id, supervisor.first_name, supervisor.last_name;

-- 7) RLS
alter table public.intern_evaluations enable row level security;

drop policy if exists "supervisors can insert evaluations for assigned interns" on public.intern_evaluations;
create policy "supervisors can insert evaluations for assigned interns"
on public.intern_evaluations for insert to authenticated
with check (
  exists (
    select 1 from public.employees supervisor
    join public.employees intern on intern.id = intern_evaluations.intern_id
    where supervisor.user_id = auth.uid()
      and supervisor.id = intern_evaluations.evaluator_id
      and intern.manager_id = supervisor.id
  )
);

drop policy if exists "supervisors can update their own evaluations for assigned interns" on public.intern_evaluations;
create policy "supervisors can update their own evaluations for assigned interns"
on public.intern_evaluations for update to authenticated
using (
  exists (
    select 1 from public.employees supervisor
    join public.employees intern on intern.id = intern_evaluations.intern_id
    where supervisor.user_id = auth.uid()
      and supervisor.id = intern_evaluations.evaluator_id
      and intern.manager_id = supervisor.id
  )
)
with check (
  exists (
    select 1 from public.employees supervisor
    join public.employees intern on intern.id = intern_evaluations.intern_id
    where supervisor.user_id = auth.uid()
      and supervisor.id = intern_evaluations.evaluator_id
      and intern.manager_id = supervisor.id
  )
);

drop policy if exists "interns can view their submitted evaluations" on public.intern_evaluations;
create policy "interns can view their submitted evaluations"
on public.intern_evaluations for select to authenticated
using (
  exists (select 1 from public.employees e where e.user_id = auth.uid() and e.id = intern_evaluations.intern_id)
  and status in ('submitted','finalized')
);

drop policy if exists "supervisors can view evaluations they authored" on public.intern_evaluations;
create policy "supervisors can view evaluations they authored"
on public.intern_evaluations for select to authenticated
using (
  exists (select 1 from public.employees e where e.user_id = auth.uid() and e.id = intern_evaluations.evaluator_id)
);

drop policy if exists "admin and principal can read all evaluations" on public.intern_evaluations;
create policy "admin and principal can read all evaluations"
on public.intern_evaluations for select to authenticated
using (
  public.has_role(auth.uid(), 'admin')
  or public.has_role(auth.uid(), 'hr_manager')
  or public.has_role(auth.uid(), 'supervisor')
);
