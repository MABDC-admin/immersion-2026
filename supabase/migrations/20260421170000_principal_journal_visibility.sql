DROP POLICY IF EXISTS "Principals can view all journal entries" ON public.intern_journals;
CREATE POLICY "Principals can view all journal entries"
ON public.intern_journals
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'principal'::public.app_role));

DROP POLICY IF EXISTS "Principals can view all journal attachments" ON public.journal_attachments;
CREATE POLICY "Principals can view all journal attachments"
ON public.journal_attachments
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'principal'::public.app_role));
