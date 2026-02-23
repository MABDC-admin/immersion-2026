-- Admin Employee CRUD Schema & Mock Data Cleanup

-- 1. CLEANUP MOCK DATA (If you have 12 specific mock entries, this will clear the table to start fresh)
-- WARNING: This deletes ALL employees, profiles, and roles to ensure a clean state.
-- TRUNCATE public.employees CASCADE; 
-- TRUNCATE public.profiles CASCADE;
-- TRUNCATE public.user_roles CASCADE;

-- Alternatively, delete by a specific pattern (e.g., '@example.com' or specific names)
DELETE FROM auth.users WHERE email LIKE '%@example.com';
DELETE FROM public.employees WHERE email LIKE '%@example.com';

-- 2. CORE EMPLOYEE TABLES (Ensuring everything is in place for CRUD)

-- Extend employees if needed (e.g., adding bio or other fields)
-- ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS bio TEXT;

-- 3. RLS POLICIES FOR ADMIN CRUD
-- (These targets the existing tables to ensure Admin has full control)

-- Drop existing if we need to refine
-- DROP POLICY IF EXISTS "Only admin or hr can delete employees" ON public.employees;

CREATE POLICY "Admins have full access to employees"
ON public.employees FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins have full access to profiles"
ON public.profiles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins have full access to user_roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 4. UTILITY FUNCTIONS
-- Function to sync profile on email update if needed
CREATE OR REPLACE FUNCTION public.sync_employee_email()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles SET updated_at = now() WHERE user_id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
