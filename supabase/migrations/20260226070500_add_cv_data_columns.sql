-- Add cv_data column to candidates table to store extracted JSON from resumes
ALTER TABLE public.candidates 
ADD COLUMN IF NOT EXISTS cv_data JSONB;

-- Add cv_data column to employees table to transfer the data upon onboarding
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS cv_data JSONB;
