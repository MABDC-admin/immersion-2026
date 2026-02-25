-- Migration: intern_journals table for daily OJT activity logging
-- Apply this in your Supabase SQL editor or Lovable dashboard

CREATE TABLE IF NOT EXISTS public.intern_journals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  activities TEXT NOT NULL,
  learnings TEXT,
  challenges TEXT,
  supervisor_notes TEXT,
  hours_worked NUMERIC(4,1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(employee_id, entry_date)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_intern_journals_employee_date
  ON public.intern_journals(employee_id, entry_date DESC);

-- RLS
ALTER TABLE public.intern_journals ENABLE ROW LEVEL SECURITY;

-- Interns can read/write their own journal entries
CREATE POLICY "Users can view own journal entries"
  ON public.intern_journals FOR SELECT
  USING (
    employee_id IN (
      SELECT id FROM public.employees WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own journal entries"
  ON public.intern_journals FOR INSERT
  WITH CHECK (
    employee_id IN (
      SELECT id FROM public.employees WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own journal entries"
  ON public.intern_journals FOR UPDATE
  USING (
    employee_id IN (
      SELECT id FROM public.employees WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own journal entries"
  ON public.intern_journals FOR DELETE
  USING (
    employee_id IN (
      SELECT id FROM public.employees WHERE user_id = auth.uid()
    )
  );

-- Admins/HR can read all journals
CREATE POLICY "Admins can view all journal entries"
  ON public.intern_journals FOR SELECT
  USING (
    public.is_admin_or_hr(auth.uid())
  );

-- Supervisors can view journals of their assigned interns
CREATE POLICY "Supervisors can view intern journals"
  ON public.intern_journals FOR SELECT
  USING (
    employee_id IN (
      SELECT id FROM public.employees WHERE manager_id IN (
        SELECT id FROM public.employees WHERE user_id = auth.uid()
      )
    )
  );

-- Supervisors can add notes to their interns' journals
CREATE POLICY "Supervisors can add notes to intern journals"
  ON public.intern_journals FOR UPDATE
  USING (
    employee_id IN (
      SELECT id FROM public.employees WHERE manager_id IN (
        SELECT id FROM public.employees WHERE user_id = auth.uid()
      )
    )
  );

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_intern_journals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_intern_journals_updated_at
  BEFORE UPDATE ON public.intern_journals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_intern_journals_updated_at();
