-- Allow supervisors to view attendance of their assigned interns
CREATE POLICY "Supervisors can view their interns attendance"
ON public.attendance
FOR SELECT
USING (
  employee_id IN (
    SELECT e.id FROM employees e
    WHERE e.manager_id IN (
      SELECT emp.id FROM employees emp WHERE emp.user_id = auth.uid()
    )
  )
);