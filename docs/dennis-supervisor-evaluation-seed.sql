-- Seed Dennis as an active supervisor evaluator using the auth account
-- created for `dennis@mabdc.org`.
--
-- Current assumptions verified from live data on April 27, 2026:
-- - Dennis auth user id: e5a64dc4-e408-497d-82ac-e68d999cf40f
-- - Dennis employee row id: cedbc4e5-46f3-44bd-aaa5-7fea38900ebc
-- - Selected unassigned intern: Aimee Charlize Hilado
--   employee id: bd712056-5db3-4e7e-b4ae-a9f972adba4d
--
-- Login after running:
--   email: dennis@mabdc.org
--   password: 654321

begin;

-- 1) Link the created Dennis auth account to the existing Dennis supervisor employee row.
update public.employees
set user_id = 'e5a64dc4-e408-497d-82ac-e68d999cf40f'
where id = 'cedbc4e5-46f3-44bd-aaa5-7fea38900ebc';

-- 2) Ensure Dennis has the supervisor role in addition to the default employee role.
insert into public.user_roles (user_id, role)
values ('e5a64dc4-e408-497d-82ac-e68d999cf40f', 'supervisor')
on conflict (user_id, role) do nothing;

-- 3) Assign one currently unassigned intern to Dennis so the evaluation page has someone to evaluate.
update public.employees
set manager_id = 'cedbc4e5-46f3-44bd-aaa5-7fea38900ebc'
where id = 'bd712056-5db3-4e7e-b4ae-a9f972adba4d'
  and manager_id is null;

-- 4) Create a draft evaluation Dennis can open and complete.
-- This uses the rubric-era columns. Leave scores null so Dennis can enter them himself.
insert into public.intern_evaluations (
  intern_id,
  evaluator_id,
  evaluation_date,
  evaluation_period_start,
  evaluation_period_end,
  status,
  comments,
  recommendations,
  supervisor_comments,
  submitted_at,
  finalized_at,
  attendance_arrives_on_time,
  attendance_absence_communication,
  attendance_schedule_adherence,
  attendance_meeting_deadline_punctuality,
  attitude_positive_towards_work,
  attitude_willingness_to_learn,
  attitude_initiative_in_tasks,
  attitude_resilience_under_pressure,
  ethics_task_reliability,
  ethics_professional_behavior,
  ethics_confidentiality,
  ethics_accountability_for_mistakes,
  quality_accuracy_thoroughness,
  quality_creativity_problem_solving,
  quality_meeting_project_goals,
  quality_initiative_new_tasks,
  teamwork_team_communication,
  teamwork_supportiveness,
  teamwork_flexibility_adaptability,
  teamwork_conflict_resolution
)
select
  'bd712056-5db3-4e7e-b4ae-a9f972adba4d',
  'cedbc4e5-46f3-44bd-aaa5-7fea38900ebc',
  date '2026-04-27',
  date '2026-04-01',
  date '2026-04-30',
  'draft',
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null
where not exists (
  select 1
  from public.intern_evaluations
  where intern_id = 'bd712056-5db3-4e7e-b4ae-a9f972adba4d'
    and evaluator_id = 'cedbc4e5-46f3-44bd-aaa5-7fea38900ebc'
    and evaluation_period_start = date '2026-04-01'
    and evaluation_period_end = date '2026-04-30'
);

commit;

-- Optional verification
select
  e.id,
  e.first_name,
  e.last_name,
  e.email,
  e.user_id,
  ur.role
from public.employees e
left join public.user_roles ur
  on ur.user_id = e.user_id
where e.id = 'cedbc4e5-46f3-44bd-aaa5-7fea38900ebc';

select
  id,
  first_name,
  last_name,
  manager_id
from public.employees
where id = 'bd712056-5db3-4e7e-b4ae-a9f972adba4d';

select
  id,
  intern_id,
  evaluator_id,
  status,
  evaluation_period_start,
  evaluation_period_end
from public.intern_evaluations
where intern_id = 'bd712056-5db3-4e7e-b4ae-a9f972adba4d'
  and evaluator_id = 'cedbc4e5-46f3-44bd-aaa5-7fea38900ebc'
order by created_at desc;
