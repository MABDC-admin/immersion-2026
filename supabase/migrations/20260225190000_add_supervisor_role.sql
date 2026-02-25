
-- Step 1: Add 'supervisor' to app_role enum
-- This must be committed before it can be used in functions or policies
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'supervisor';
