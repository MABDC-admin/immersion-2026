-- Migration: Add approval status to intern_journals
-- Possible statuses: 'pending', 'approved', 'rejected'

ALTER TABLE public.intern_journals 
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft';

-- Add check constraint for valid statuses
ALTER TABLE public.intern_journals
DROP CONSTRAINT IF EXISTS valid_journal_status;

ALTER TABLE public.intern_journals
ADD CONSTRAINT valid_journal_status 
CHECK (status IN ('draft', 'pending', 'approved', 'rejected'));

-- Update RLS: Supervisors already have UPDATE access via "Supervisors can add notes to intern journals"
-- That policy uses:
-- employee_id IN (
--   SELECT id FROM public.employees WHERE manager_id IN (
--     SELECT id FROM public.employees WHERE user_id = auth.uid()
--   )
-- )
-- This covers status updates too.
