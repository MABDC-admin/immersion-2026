CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY
    CASE role
      WHEN 'admin' THEN 1
      WHEN 'hr_manager' THEN 2
      WHEN 'principal' THEN 3
      WHEN 'supervisor' THEN 4
      WHEN 'manager' THEN 5
      WHEN 'employee' THEN 6
      WHEN 'payroll_officer' THEN 7
    END
  LIMIT 1
$$;
