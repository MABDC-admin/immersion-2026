-- Migration: intern_uae_profile_fields
-- Add comprehensive employee fields needed for UAE compliance

ALTER TABLE public.employees
ADD COLUMN IF NOT EXISTS emirates_id TEXT,
ADD COLUMN IF NOT EXISTS visa_status TEXT,
ADD COLUMN IF NOT EXISTS visa_number TEXT,
ADD COLUMN IF NOT EXISTS visa_expiry DATE,
ADD COLUMN IF NOT EXISTS passport_number TEXT,
ADD COLUMN IF NOT EXISTS passport_expiry DATE,
ADD COLUMN IF NOT EXISTS uae_address TEXT,
ADD COLUMN IF NOT EXISTS home_country_address TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_uae_name TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_uae_phone TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_home_name TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_home_phone TEXT,
ADD COLUMN IF NOT EXISTS religion TEXT,
ADD COLUMN IF NOT EXISTS nationality TEXT,
ADD COLUMN IF NOT EXISTS marital_status TEXT;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
