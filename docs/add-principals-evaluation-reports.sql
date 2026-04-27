-- Adds evaluation-report access for the two requested principals.
--
-- Confirmed auth accounts:
-- - ramirezmarkjohn@gmail.com
-- - jhaydey0203@gmail.com
--
-- Confirmed working password for both on April 27, 2026:
-- - MABDC@2026
--
-- This script grants the principal role so they can open:
--   /reports/evaluations
--
-- If you also want them represented as employee rows later for profile cards,
-- that can be added separately. It is not required for evaluation report access.

begin;

do $$
declare
  mark_user_id uuid;
  jhaydey_user_id uuid;
begin
  select id into mark_user_id
  from auth.users
  where lower(email) = 'ramirezmarkjohn@gmail.com'
  limit 1;

  select id into jhaydey_user_id
  from auth.users
  where lower(email) = 'jhaydey0203@gmail.com'
  limit 1;

  if mark_user_id is null then
    raise exception 'No auth user found for ramirezmarkjohn@gmail.com';
  end if;

  if jhaydey_user_id is null then
    raise exception 'No auth user found for jhaydey0203@gmail.com';
  end if;

  insert into public.user_roles (user_id, role)
  values
    (mark_user_id, 'principal'::public.app_role),
    (jhaydey_user_id, 'principal'::public.app_role)
  on conflict (user_id, role) do nothing;
end
$$;

commit;

-- Verification
select
  auth_user.email,
  role_record.role
from auth.users as auth_user
join public.user_roles as role_record
  on role_record.user_id = auth_user.id
where lower(auth_user.email) in (
  'ramirezmarkjohn@gmail.com',
  'jhaydey0203@gmail.com'
)
order by auth_user.email, role_record.role;
