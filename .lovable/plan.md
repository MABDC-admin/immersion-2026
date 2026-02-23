
# Auto-Detect and Apply SQL Migrations from GitHub

## Overview
Create a background system that periodically checks your GitHub repository for new SQL migration files and automatically applies them to the database.

## How It Works

1. A scheduled background function runs every 5 minutes
2. It connects to your GitHub repository via the GitHub API
3. It lists all `.sql` files in the `supabase/migrations/` folder
4. It compares them against a tracking table of already-applied migrations
5. Any new files are downloaded, executed against the database, and logged

## Setup Required

You will need to provide a **GitHub Personal Access Token** so the function can read your repository files. You can create one at GitHub Settings > Developer Settings > Personal Access Tokens > Fine-grained tokens, with read-only access to your repository contents.

You will also need to confirm your **GitHub repository owner and name** (e.g., `myorg/my-repo`).

## Changes

### 1. New Database Table: `applied_migrations`
Tracks which SQL files have already been executed so they are never run twice.
- `id` (uuid, primary key)
- `filename` (text, unique) -- e.g., `20260223090000_dashboard_tables.sql`
- `applied_at` (timestamp) -- when it was executed
- `status` (text) -- `success` or `error`
- `error_message` (text, nullable) -- if it failed, stores the error
- `content_hash` (text) -- SHA hash to detect changes to existing files

### 2. New Database Function: `exec_sql`
A `SECURITY DEFINER` PL/pgSQL function that accepts a SQL string and executes it. This is restricted: only callable by the service role via the edge function, not by regular users. An RLS policy on the `applied_migrations` table ensures only service-role access.

### 3. New Edge Function: `sync-github-migrations`
- Reads `GITHUB_TOKEN`, `GITHUB_OWNER`, and `GITHUB_REPO` from secrets
- Calls the GitHub Contents API to list files in `supabase/migrations/`
- Queries `applied_migrations` to find which are new
- For each new file:
  - Downloads the raw SQL content
  - Calls the `exec_sql` database function to execute it
  - Records the result (success/error) in `applied_migrations`
- Returns a summary of what was applied

### 4. Scheduled Cron Job
A `pg_cron` + `pg_net` scheduled job that calls the edge function every 5 minutes automatically.

### 5. Admin Panel -- Migrations Tab (optional visibility)
Add a simple view in the Admin Panel's "System" tab showing:
- List of applied migrations with status and timestamp
- A manual "Sync Now" button to trigger the function on demand

## Secrets Needed
- **GITHUB_TOKEN** -- A GitHub personal access token with repo read access
- **GITHUB_OWNER** -- Your GitHub username or organization name
- **GITHUB_REPO** -- Your repository name

---

## Technical Details

### Database Migration SQL
```text
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
```

### New File
- **`supabase/functions/sync-github-migrations/index.ts`** -- Edge function that checks GitHub and applies new migrations

### Modified Files
1. **`src/components/admin/MaintenanceTab.tsx`** -- Add migration status list and "Sync Now" button
2. **`supabase/config.toml`** -- Register the new edge function with `verify_jwt = false`

### Cron Job SQL (run via SQL tool, not migration)
```text
-- Enable extensions if not already
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule sync every 5 minutes
SELECT cron.schedule(
  'sync-github-migrations',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://gqsuujvfkgnrhvphdqqr.supabase.co/functions/v1/sync-github-migrations',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdxc3V1anZma2ducmh2cGhkcXFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0OTgwNDIsImV4cCI6MjA4NTA3NDA0Mn0.nMySE5Kyd11MkSzlT3pMXVIvoolu-ClAtRW9RFv8OQU"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
```

### Edge Function Flow
```text
1. Read GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO from env
2. GET https://api.github.com/repos/{owner}/{repo}/contents/supabase/migrations
3. Query applied_migrations for already-applied filenames
4. For each new .sql file:
   a. GET raw content from GitHub
   b. Call supabase.rpc('exec_sql', { query: sqlContent })
   c. INSERT into applied_migrations with status
5. Return JSON summary
```

### Safety Measures
- Migrations are applied in alphabetical order (which matches timestamp order)
- Each file is only applied once (tracked by unique filename)
- Errors are caught per-file so one failure does not block others
- Error messages are stored for debugging
- Content hash detects if a file was modified after being applied
