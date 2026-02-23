-- Add tutorial completion flag to employees table
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS has_completed_tutorial BOOLEAN DEFAULT FALSE;

-- Ensure RLS allows users to update their own flag
CREATE POLICY "Users can update their own tutorial status" ON public.employees
FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
