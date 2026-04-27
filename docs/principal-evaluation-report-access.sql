-- Allow principal users to read all intern evaluations for the
-- Admin/Principal Evaluation Reports page.
--
-- Why this is needed:
-- The current intern_evaluations RLS only allows:
-- - evaluators to manage their own evaluations
-- - admin/hr to manage all evaluations
-- - interns to view their own evaluations
--
-- Principal accounts can reach /reports/evaluations in the app,
-- but without this policy the query returns zero rows.

create policy "Principals can view all evaluations"
on public.intern_evaluations
for select
to authenticated
using (
  exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and role = 'principal'::public.app_role
  )
);

-- Optional verification
-- After running the policy, sign in as a principal account and run:
-- select id, intern_id, evaluator_id, overall_score, status
-- from public.intern_evaluations
-- order by created_at desc;
