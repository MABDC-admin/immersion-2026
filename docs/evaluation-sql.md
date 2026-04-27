# Evaluation SQL

This document collects the SQL discussed for the supervisor rubric evaluation flow, the admin/principal reporting layer, and row-level access rules.

## Assumptions

- `public.employees.user_id` links to `auth.users.id`
- `public.employees.manager_id` points to the supervisor's `public.employees.id`
- `public.employees.role` contains values like `admin`, `principal`, and `supervisor`
- `public.departments.id` is referenced by `public.employees.department_id`

## 1) Rubric Schema Migration

This reshapes `public.intern_evaluations` to match the PDF rubric:

- 5 categories
- 4 scored items per category
- each score is `1..5`
- category totals out of `20`
- overall score out of `100`
- `award_eligible` when `overall_score >= 90`

```sql
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

alter table public.intern_evaluations
  add constraint intern_evaluations_attendance_arrives_on_time_chk
    check (attendance_arrives_on_time between 1 and 5 or attendance_arrives_on_time is null),
  add constraint intern_evaluations_attendance_absence_communication_chk
    check (attendance_absence_communication between 1 and 5 or attendance_absence_communication is null),
  add constraint intern_evaluations_attendance_schedule_adherence_chk
    check (attendance_schedule_adherence between 1 and 5 or attendance_schedule_adherence is null),
  add constraint intern_evaluations_attendance_meeting_deadline_punctuality_chk
    check (attendance_meeting_deadline_punctuality between 1 and 5 or attendance_meeting_deadline_punctuality is null),

  add constraint intern_evaluations_attitude_positive_towards_work_chk
    check (attitude_positive_towards_work between 1 and 5 or attitude_positive_towards_work is null),
  add constraint intern_evaluations_attitude_willingness_to_learn_chk
    check (attitude_willingness_to_learn between 1 and 5 or attitude_willingness_to_learn is null),
  add constraint intern_evaluations_attitude_initiative_in_tasks_chk
    check (attitude_initiative_in_tasks between 1 and 5 or attitude_initiative_in_tasks is null),
  add constraint intern_evaluations_attitude_resilience_under_pressure_chk
    check (attitude_resilience_under_pressure between 1 and 5 or attitude_resilience_under_pressure is null),

  add constraint intern_evaluations_ethics_task_reliability_chk
    check (ethics_task_reliability between 1 and 5 or ethics_task_reliability is null),
  add constraint intern_evaluations_ethics_professional_behavior_chk
    check (ethics_professional_behavior between 1 and 5 or ethics_professional_behavior is null),
  add constraint intern_evaluations_ethics_confidentiality_chk
    check (ethics_confidentiality between 1 and 5 or ethics_confidentiality is null),
  add constraint intern_evaluations_ethics_accountability_for_mistakes_chk
    check (ethics_accountability_for_mistakes between 1 and 5 or ethics_accountability_for_mistakes is null),

  add constraint intern_evaluations_quality_accuracy_thoroughness_chk
    check (quality_accuracy_thoroughness between 1 and 5 or quality_accuracy_thoroughness is null),
  add constraint intern_evaluations_quality_creativity_problem_solving_chk
    check (quality_creativity_problem_solving between 1 and 5 or quality_creativity_problem_solving is null),
  add constraint intern_evaluations_quality_meeting_project_goals_chk
    check (quality_meeting_project_goals between 1 and 5 or quality_meeting_project_goals is null),
  add constraint intern_evaluations_quality_initiative_new_tasks_chk
    check (quality_initiative_new_tasks between 1 and 5 or quality_initiative_new_tasks is null),

  add constraint intern_evaluations_teamwork_team_communication_chk
    check (teamwork_team_communication between 1 and 5 or teamwork_team_communication is null),
  add constraint intern_evaluations_teamwork_supportiveness_chk
    check (teamwork_supportiveness between 1 and 5 or teamwork_supportiveness is null),
  add constraint intern_evaluations_teamwork_flexibility_adaptability_chk
    check (teamwork_flexibility_adaptability between 1 and 5 or teamwork_flexibility_adaptability is null),
  add constraint intern_evaluations_teamwork_conflict_resolution_chk
    check (teamwork_conflict_resolution between 1 and 5 or teamwork_conflict_resolution is null);

alter table public.intern_evaluations
  add column if not exists attendance_total smallint
    generated always as (
      coalesce(attendance_arrives_on_time, 0) +
      coalesce(attendance_absence_communication, 0) +
      coalesce(attendance_schedule_adherence, 0) +
      coalesce(attendance_meeting_deadline_punctuality, 0)
    ) stored,
  add column if not exists attitude_total smallint
    generated always as (
      coalesce(attitude_positive_towards_work, 0) +
      coalesce(attitude_willingness_to_learn, 0) +
      coalesce(attitude_initiative_in_tasks, 0) +
      coalesce(attitude_resilience_under_pressure, 0)
    ) stored,
  add column if not exists ethics_total smallint
    generated always as (
      coalesce(ethics_task_reliability, 0) +
      coalesce(ethics_professional_behavior, 0) +
      coalesce(ethics_confidentiality, 0) +
      coalesce(ethics_accountability_for_mistakes, 0)
    ) stored,
  add column if not exists quality_total smallint
    generated always as (
      coalesce(quality_accuracy_thoroughness, 0) +
      coalesce(quality_creativity_problem_solving, 0) +
      coalesce(quality_meeting_project_goals, 0) +
      coalesce(quality_initiative_new_tasks, 0)
    ) stored,
  add column if not exists teamwork_total smallint
    generated always as (
      coalesce(teamwork_team_communication, 0) +
      coalesce(teamwork_supportiveness, 0) +
      coalesce(teamwork_flexibility_adaptability, 0) +
      coalesce(teamwork_conflict_resolution, 0)
    ) stored,
  add column if not exists overall_score smallint
    generated always as (
      coalesce(attendance_total, 0) +
      coalesce(attitude_total, 0) +
      coalesce(ethics_total, 0) +
      coalesce(quality_total, 0) +
      coalesce(teamwork_total, 0)
    ) stored,
  add column if not exists overall_rating numeric(4,2)
    generated always as (
      round(((
        coalesce(attendance_total, 0) +
        coalesce(attitude_total, 0) +
        coalesce(ethics_total, 0) +
        coalesce(quality_total, 0) +
        coalesce(teamwork_total, 0)
      ) / 20.0)::numeric, 2)
    ) stored,
  add column if not exists award_eligible boolean
    generated always as (
      (
        coalesce(attendance_total, 0) +
        coalesce(attitude_total, 0) +
        coalesce(ethics_total, 0) +
        coalesce(quality_total, 0) +
        coalesce(teamwork_total, 0)
      ) >= 90
    ) stored;

alter table public.intern_evaluations
  alter column status set default 'draft';

alter table public.intern_evaluations
  add constraint intern_evaluations_status_chk
    check (status in ('draft', 'submitted', 'finalized'));

create unique index if not exists intern_evaluations_unique_period
on public.intern_evaluations (
  evaluator_id,
  intern_id,
  evaluation_period_start,
  evaluation_period_end
);

create index if not exists intern_evaluations_evaluator_idx
  on public.intern_evaluations (evaluator_id, status, evaluation_date desc);

create index if not exists intern_evaluations_intern_idx
  on public.intern_evaluations (intern_id, status, evaluation_date desc);
```

## 2) Reporting Views for Admin and Principal

These views support dedicated read-only reporting for admin and principal users.

### Base reporting view

```sql
create or replace view public.evaluation_reports_v1 as
select
  ie.id,
  ie.intern_id,
  ie.evaluator_id as supervisor_id,
  ie.evaluation_date,
  ie.evaluation_period_start,
  ie.evaluation_period_end,
  ie.status,

  ie.attendance_total,
  ie.attitude_total,
  ie.ethics_total,
  ie.quality_total,
  ie.teamwork_total,
  ie.overall_score,
  ie.overall_rating,
  ie.award_eligible,

  intern.first_name || ' ' || intern.last_name as intern_name,
  intern.department_id as intern_department_id,

  dept.name as department_name,

  supervisor.first_name || ' ' || supervisor.last_name as supervisor_name
from public.intern_evaluations ie
join public.employees intern
  on intern.id = ie.intern_id
left join public.departments dept
  on dept.id = intern.department_id
join public.employees supervisor
  on supervisor.id = ie.evaluator_id;
```

### Period summary view

```sql
create or replace view public.evaluation_report_summary_v1 as
select
  evaluation_period_start,
  evaluation_period_end,
  status,
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
```

### Supervisor summary view

```sql
create or replace view public.evaluation_report_by_supervisor_v1 as
select
  ie.evaluator_id as supervisor_id,
  supervisor.first_name || ' ' || supervisor.last_name as supervisor_name,
  count(*) as evaluation_count,
  round(avg(ie.overall_score)::numeric, 2) as avg_overall_score,
  count(*) filter (where ie.award_eligible) as award_eligible_count
from public.intern_evaluations ie
join public.employees supervisor
  on supervisor.id = ie.evaluator_id
group by ie.evaluator_id, supervisor.first_name, supervisor.last_name;
```

## 3) RLS Policies

These policies enforce:

- supervisors can author evaluations only for assigned interns
- interns can view their own submitted/finalized evaluations
- admin and principal can read all evaluations for reporting

```sql
alter table public.intern_evaluations enable row level security;

create policy "supervisors can insert evaluations for assigned interns"
on public.intern_evaluations
for insert
to authenticated
with check (
  exists (
    select 1
    from public.employees supervisor
    join public.employees intern
      on intern.id = intern_evaluations.intern_id
    where supervisor.user_id = auth.uid()
      and supervisor.id = intern_evaluations.evaluator_id
      and intern.manager_id = supervisor.id
  )
);

create policy "supervisors can update their own evaluations for assigned interns"
on public.intern_evaluations
for update
to authenticated
using (
  exists (
    select 1
    from public.employees supervisor
    join public.employees intern
      on intern.id = intern_evaluations.intern_id
    where supervisor.user_id = auth.uid()
      and supervisor.id = intern_evaluations.evaluator_id
      and intern.manager_id = supervisor.id
  )
)
with check (
  exists (
    select 1
    from public.employees supervisor
    join public.employees intern
      on intern.id = intern_evaluations.intern_id
    where supervisor.user_id = auth.uid()
      and supervisor.id = intern_evaluations.evaluator_id
      and intern.manager_id = supervisor.id
  )
);

create policy "interns can view their submitted evaluations"
on public.intern_evaluations
for select
to authenticated
using (
  exists (
    select 1
    from public.employees e
    where e.user_id = auth.uid()
      and e.id = intern_evaluations.intern_id
  )
  and status in ('submitted', 'finalized')
);

create policy "supervisors can view evaluations they authored"
on public.intern_evaluations
for select
to authenticated
using (
  exists (
    select 1
    from public.employees e
    where e.user_id = auth.uid()
      and e.id = intern_evaluations.evaluator_id
  )
);

create policy "admin and principal can read all evaluations"
on public.intern_evaluations
for select
to authenticated
using (
  exists (
    select 1
    from public.employees e
    where e.user_id = auth.uid()
      and e.role in ('admin', 'principal')
  )
);
```

## 4) Suggested Rollout Order

Run these in order:

1. Rubric schema migration
2. Reporting views
3. RLS policies

If your current table already has legacy evaluation columns that you plan to retire, do that in a later cleanup migration after the frontend has been updated.
