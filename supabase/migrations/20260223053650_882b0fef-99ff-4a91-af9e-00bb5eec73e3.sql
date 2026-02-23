
-- Create resumes storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('resumes', 'resumes', true);

-- Allow anyone to upload resumes (public application)
CREATE POLICY "Anyone can upload resumes"
ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'resumes');

-- Allow anyone to view resumes (public bucket)
CREATE POLICY "Anyone can view resumes"
ON storage.objects FOR SELECT USING (bucket_id = 'resumes');

-- Allow HR/Admin to delete resumes
CREATE POLICY "HR/Admin can delete resumes"
ON storage.objects FOR DELETE
USING (bucket_id = 'resumes' AND public.is_admin_or_hr(auth.uid()));

-- Allow public to view open job postings (no auth required)
CREATE POLICY "Anyone can view open job postings"
ON public.job_postings FOR SELECT USING (status = 'open');

-- Allow public to submit applications (no auth required)
CREATE POLICY "Anyone can submit applications"
ON public.candidates FOR INSERT WITH CHECK (true);
