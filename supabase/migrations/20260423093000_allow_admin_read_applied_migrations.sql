CREATE POLICY "Admins can view applied migrations"
ON public.applied_migrations
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
