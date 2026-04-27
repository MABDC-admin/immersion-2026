-- Fix evaluation report visibility for Principal and Admin oversight.
-- Run this in Supabase SQL editor if Evaluation Reports shows no rows
-- even though supervisors have already created evaluations.

DROP POLICY IF EXISTS "Principals can view all evaluations" ON public.intern_evaluations;
CREATE POLICY "Principals can view all evaluations"
ON public.intern_evaluations
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'principal'::public.app_role));

DROP POLICY IF EXISTS "Admin/HR can manage all evaluations" ON public.intern_evaluations;
CREATE POLICY "Admin/HR can manage all evaluations"
ON public.intern_evaluations
FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'hr_manager'::public.app_role)
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'hr_manager'::public.app_role)
);
