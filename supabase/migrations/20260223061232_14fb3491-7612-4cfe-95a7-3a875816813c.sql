
-- Create company-logos storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('company-logos', 'company-logos', true);

-- RLS: Anyone can view logos (public bucket)
CREATE POLICY "Public can view company logos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'company-logos');

-- RLS: Admins can manage company logos
CREATE POLICY "Admins can manage company logos"
  ON storage.objects FOR ALL
  USING (bucket_id = 'company-logos' AND public.has_role(auth.uid(), 'admin'));
