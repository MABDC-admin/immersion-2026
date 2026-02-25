-- Migration: intern_ojt_overrides + intern_tasks + task-submissions bucket
-- Apply this in your Supabase SQL editor

-- ============================================================
-- 1. OJT Overrides — admin manual adjustments
-- ============================================================
CREATE TABLE IF NOT EXISTS public.intern_ojt_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intern_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE SET NULL,
  override_type TEXT NOT NULL CHECK (override_type IN ('hours_adjustment','status_change','progress_override')),
  hours_value NUMERIC(6,1) DEFAULT 0,
  progress_pct NUMERIC(5,2),
  completion_status TEXT CHECK (completion_status IN ('in_progress','completed','extended','withdrawn')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ojt_overrides_intern ON public.intern_ojt_overrides(intern_id, created_at DESC);

ALTER TABLE public.intern_ojt_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage OJT overrides"
  ON public.intern_ojt_overrides FOR ALL
  USING (public.is_admin_or_hr(auth.uid()));

CREATE POLICY "Interns can view own overrides"
  ON public.intern_ojt_overrides FOR SELECT
  USING (intern_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid()));

-- ============================================================
-- 2. Intern Tasks — supervisor task assignment
-- ============================================================
CREATE TABLE IF NOT EXISTS public.intern_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supervisor_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  intern_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','submitted','completed','overdue')),
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  submission_notes TEXT,
  submission_file_path TEXT,
  supervisor_feedback TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_intern_tasks_supervisor ON public.intern_tasks(supervisor_id, created_at DESC);
CREATE INDEX idx_intern_tasks_intern ON public.intern_tasks(intern_id, status);

ALTER TABLE public.intern_tasks ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can manage all tasks"
  ON public.intern_tasks FOR ALL
  USING (public.is_admin_or_hr(auth.uid()));

-- Supervisors can manage tasks they created
CREATE POLICY "Supervisors can view own tasks"
  ON public.intern_tasks FOR SELECT
  USING (supervisor_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid()));

CREATE POLICY "Supervisors can create tasks"
  ON public.intern_tasks FOR INSERT
  WITH CHECK (supervisor_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid()));

CREATE POLICY "Supervisors can update own tasks"
  ON public.intern_tasks FOR UPDATE
  USING (supervisor_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid()));

CREATE POLICY "Supervisors can delete own tasks"
  ON public.intern_tasks FOR DELETE
  USING (supervisor_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid()));

-- Interns can view and submit their tasks
CREATE POLICY "Interns can view assigned tasks"
  ON public.intern_tasks FOR SELECT
  USING (intern_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid()));

CREATE POLICY "Interns can update own tasks (submit)"
  ON public.intern_tasks FOR UPDATE
  USING (intern_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid()));

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_intern_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_intern_tasks_updated_at
  BEFORE UPDATE ON public.intern_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_intern_tasks_updated_at();

-- ============================================================
-- 3. Storage bucket for task submissions
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('task-submissions', 'task-submissions', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Interns can upload task submissions"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'task-submissions');

CREATE POLICY "Authenticated users can view task submissions"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'task-submissions');

CREATE POLICY "Admins can delete task submissions"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'task-submissions' AND public.is_admin_or_hr(auth.uid()));
