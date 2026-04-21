CREATE TABLE IF NOT EXISTS public.journal_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_id UUID NOT NULL REFERENCES public.intern_journals(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_journal_attachments_journal_created
  ON public.journal_attachments(journal_id, created_at ASC);

ALTER TABLE public.journal_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own journal attachments"
  ON public.journal_attachments FOR SELECT
  USING (
    journal_id IN (
      SELECT id FROM public.intern_journals
      WHERE employee_id IN (
        SELECT id FROM public.employees WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert own journal attachments"
  ON public.journal_attachments FOR INSERT
  WITH CHECK (
    journal_id IN (
      SELECT id FROM public.intern_journals
      WHERE employee_id IN (
        SELECT id FROM public.employees WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete own journal attachments"
  ON public.journal_attachments FOR DELETE
  USING (
    journal_id IN (
      SELECT id FROM public.intern_journals
      WHERE employee_id IN (
        SELECT id FROM public.employees WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Admins can view all journal attachments"
  ON public.journal_attachments FOR SELECT
  USING (public.is_admin_or_hr(auth.uid()));

CREATE POLICY "Admins can insert all journal attachments"
  ON public.journal_attachments FOR INSERT
  WITH CHECK (public.is_admin_or_hr(auth.uid()));

CREATE POLICY "Admins can delete all journal attachments"
  ON public.journal_attachments FOR DELETE
  USING (public.is_admin_or_hr(auth.uid()));

CREATE POLICY "Supervisors can view intern journal attachments"
  ON public.journal_attachments FOR SELECT
  USING (
    journal_id IN (
      SELECT id FROM public.intern_journals
      WHERE employee_id IN (
        SELECT id FROM public.employees WHERE manager_id IN (
          SELECT id FROM public.employees WHERE user_id = auth.uid()
        )
      )
    )
  );

INSERT INTO storage.buckets (id, name, public)
VALUES ('journal-media', 'journal-media', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can view journal media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'journal-media');

CREATE POLICY "Authenticated users can upload journal media"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'journal-media' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete journal media"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'journal-media' AND auth.role() = 'authenticated');
