CREATE TABLE IF NOT EXISTS public.login_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  user_role public.app_role,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.login_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_login_audit_logs_created_at
  ON public.login_audit_logs (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_login_audit_logs_user_id
  ON public.login_audit_logs (user_id);

DROP POLICY IF EXISTS "Users can create their own login audit logs"
  ON public.login_audit_logs;

CREATE POLICY "Users can create their own login audit logs"
ON public.login_audit_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view login audit logs"
  ON public.login_audit_logs;

CREATE POLICY "Admins can view login audit logs"
ON public.login_audit_logs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));
