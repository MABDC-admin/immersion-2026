-- Create storage buckets for avatars and documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('employee-documents', 'employee-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Avatar storage policies
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "HR/Admin can upload avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars' AND is_admin_or_hr(auth.uid()));

CREATE POLICY "HR/Admin can update avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars' AND is_admin_or_hr(auth.uid()));

CREATE POLICY "HR/Admin can delete avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars' AND is_admin_or_hr(auth.uid()));

-- Document storage policies
CREATE POLICY "HR/Admin can view documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'employee-documents' AND is_admin_or_hr(auth.uid()));

CREATE POLICY "HR/Admin can upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'employee-documents' AND is_admin_or_hr(auth.uid()));

CREATE POLICY "HR/Admin can update documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'employee-documents' AND is_admin_or_hr(auth.uid()));

CREATE POLICY "HR/Admin can delete documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'employee-documents' AND is_admin_or_hr(auth.uid()));

-- Create employee_documents table
CREATE TABLE public.employee_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT,
    file_size INTEGER,
    uploaded_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on employee_documents
ALTER TABLE public.employee_documents ENABLE ROW LEVEL SECURITY;

-- RLS policies for employee_documents
CREATE POLICY "HR/Admin can view employee documents"
ON public.employee_documents FOR SELECT
TO authenticated
USING (is_admin_or_hr(auth.uid()));

CREATE POLICY "HR/Admin can insert employee documents"
ON public.employee_documents FOR INSERT
TO authenticated
WITH CHECK (is_admin_or_hr(auth.uid()));

CREATE POLICY "HR/Admin can update employee documents"
ON public.employee_documents FOR UPDATE
TO authenticated
USING (is_admin_or_hr(auth.uid()));

CREATE POLICY "HR/Admin can delete employee documents"
ON public.employee_documents FOR DELETE
TO authenticated
USING (is_admin_or_hr(auth.uid()));