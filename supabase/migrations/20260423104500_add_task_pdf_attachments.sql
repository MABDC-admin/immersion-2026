ALTER TABLE public.intern_tasks
  ADD COLUMN IF NOT EXISTS task_attachment_name TEXT,
  ADD COLUMN IF NOT EXISTS task_attachment_path TEXT;
