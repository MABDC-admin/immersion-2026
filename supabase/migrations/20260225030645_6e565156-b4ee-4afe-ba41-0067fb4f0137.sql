
-- Add attachment_url column to leave_requests table
ALTER TABLE public.leave_requests ADD COLUMN IF NOT EXISTS attachment_url text;

-- Create leave-attachments storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('leave-attachments', 'leave-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for leave-attachments bucket
-- Employees can upload their own leave attachments
CREATE POLICY "Employees can upload leave attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'leave-attachments'
  AND auth.role() = 'authenticated'
);

-- Employees can view their own attachments, HR/Admin can view all
CREATE POLICY "Authenticated users can view leave attachments"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'leave-attachments'
  AND auth.role() = 'authenticated'
);

-- HR/Admin can delete leave attachments
CREATE POLICY "HR Admin can delete leave attachments"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'leave-attachments'
  AND is_admin_or_hr(auth.uid())
);
