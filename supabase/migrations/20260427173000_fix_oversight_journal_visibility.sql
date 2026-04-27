DROP POLICY IF EXISTS "Supervisors can view intern journals" ON public.intern_journals;
CREATE POLICY "Supervisors can view intern journals"
ON public.intern_journals
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'principal'::public.app_role)
  OR employee_id IN (
    SELECT intern.id
    FROM public.employees AS intern
    WHERE intern.manager_id IN (
      SELECT supervisor.id
      FROM public.employees AS supervisor
      WHERE supervisor.user_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "Supervisors can add notes to intern journals" ON public.intern_journals;
CREATE POLICY "Supervisors can add notes to intern journals"
ON public.intern_journals
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'principal'::public.app_role)
  OR employee_id IN (
    SELECT intern.id
    FROM public.employees AS intern
    WHERE intern.manager_id IN (
      SELECT supervisor.id
      FROM public.employees AS supervisor
      WHERE supervisor.user_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "Supervisors can view intern journal attachments" ON public.journal_attachments;
CREATE POLICY "Supervisors can view intern journal attachments"
ON public.journal_attachments
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'principal'::public.app_role)
  OR journal_id IN (
    SELECT journal.id
    FROM public.intern_journals AS journal
    WHERE journal.employee_id IN (
      SELECT intern.id
      FROM public.employees AS intern
      WHERE intern.manager_id IN (
        SELECT supervisor.id
        FROM public.employees AS supervisor
        WHERE supervisor.user_id = auth.uid()
      )
    )
  )
);
