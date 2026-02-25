
-- Step 2: Update get_user_role function to include supervisor in the priority list
-- This can only be run AFTER Step 1 has been committed
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
      WHEN 'supervisor' THEN 3
      WHEN 'manager' THEN 4
      WHEN 'employee' THEN 5
      WHEN 'payroll_officer' THEN 6
    END
  LIMIT 1
$$;
