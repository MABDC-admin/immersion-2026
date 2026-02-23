
-- Table to track applied migrations
CREATE TABLE public.applied_migrations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  filename text UNIQUE NOT NULL,
  applied_at timestamptz DEFAULT now(),
  status text NOT NULL DEFAULT 'pending',
  error_message text,
  content_hash text
);

-- RLS: only service role can access
ALTER TABLE public.applied_migrations ENABLE ROW LEVEL SECURITY;

-- No public policies = only service role can read/write

-- Function to execute arbitrary SQL (service role only)
CREATE OR REPLACE FUNCTION public.exec_sql(query text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  EXECUTE query;
END;
$$;

-- Revoke public access, only service role can call
REVOKE ALL ON FUNCTION public.exec_sql(text) FROM PUBLIC;
