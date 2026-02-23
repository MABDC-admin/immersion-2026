
-- Allow employees to insert their own attendance
CREATE POLICY "Employees can insert their own attendance"
ON public.attendance FOR INSERT
WITH CHECK (
  employee_id IN (
    SELECT id FROM employees WHERE user_id = auth.uid()
  )
);

-- Allow employees to update their own attendance (for clock out)
CREATE POLICY "Employees can update their own attendance"
ON public.attendance FOR UPDATE
USING (
  employee_id IN (
    SELECT id FROM employees WHERE user_id = auth.uid()
  )
);

-- Allow employees to insert their own leave requests
CREATE POLICY "Employees can insert their own leave requests"
ON public.leave_requests FOR INSERT
WITH CHECK (
  employee_id IN (
    SELECT id FROM employees WHERE user_id = auth.uid()
  )
);
