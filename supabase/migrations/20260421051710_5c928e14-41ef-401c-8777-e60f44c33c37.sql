CREATE POLICY "Admins can delete journal entries"
ON public.intern_journals
FOR DELETE
TO authenticated
USING (is_admin_or_hr(auth.uid()));