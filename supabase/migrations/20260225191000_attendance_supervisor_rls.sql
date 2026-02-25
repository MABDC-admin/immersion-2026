
-- Migration: Add Supervisor RLS for attendance
-- Allowing supervisors to view attendance records of their assigned interns

CREATE POLICY "Supervisors can view intern attendance"
ON public.attendance FOR SELECT
TO authenticated
USING (
    employee_id IN (
        SELECT id FROM public.employees WHERE manager_id IN (
            SELECT id FROM public.employees WHERE user_id = auth.uid()
        )
    )
);
