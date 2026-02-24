-- Add tutorial completion flag to employees table
ALTER TABLE public.employees
ADD COLUMN IF NOT EXISTS has_completed_tutorial BOOLEAN DEFAULT FALSE;
