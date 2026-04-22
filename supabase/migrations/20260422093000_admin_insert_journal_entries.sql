CREATE POLICY "Admins can insert journal entries"
ON public.intern_journals
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin_or_hr(auth.uid()));
