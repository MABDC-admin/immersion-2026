CREATE POLICY "Admins can update journal entries"
ON public.intern_journals
FOR UPDATE
TO authenticated
USING (is_admin_or_hr(auth.uid()))
WITH CHECK (is_admin_or_hr(auth.uid()));