

# Add Company Logo Upload with Email Branding

## Overview
Add a logo upload feature in the Admin Company Setup tab. The uploaded logo will appear on the login page and be embedded in all outgoing emails with a professional, branded HTML template.

## 1. Storage Bucket for Company Logo
Create a new public storage bucket `company-logos` to store the uploaded company logo, with RLS policies allowing admin upload and public read access.

## 2. Admin Company Setup -- Logo Upload
Update `CompanySetupTab.tsx` to include:
- An image preview area showing the current logo (from `company_settings.logo_url`)
- A file input to upload a new logo image
- Upload handler that stores the file in the `company-logos` bucket and saves the public URL to `company_settings.logo_url`

## 3. Login Page Branding
Update `Auth.tsx` to:
- Fetch company settings (name and logo_url) on load
- Replace the hardcoded "IM" box with the actual company logo image when available
- Display the company name dynamically instead of hardcoded "Immersion HRMS"

## 4. Professional Email Templates with Logo
Rewrite the `send-onboarding-email` edge function to:
- Fetch `company_settings` from the database to get the logo URL and company name dynamically
- Use a polished, professional HTML email template with:
  - Company logo header
  - Styled body with proper typography and spacing
  - Professional footer with company name, address, and contact info
- Support multiple email types (onboarding welcome, approval confirmation)
- Use the company name and details from the database instead of hardcoded values

## 5. Email Helper Update
Update `src/lib/email.ts` to pass along any additional context needed (no major changes, the edge function handles template rendering).

---

## Technical Details

### Database Migration
```text
-- Create company-logos storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('company-logos', 'company-logos', true);

-- RLS: Anyone can view logos (public bucket)
CREATE POLICY "Public can view company logos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'company-logos');

-- RLS: Admins can upload/update/delete logos
CREATE POLICY "Admins can manage company logos"
  ON storage.objects FOR ALL
  USING (bucket_id = 'company-logos' AND has_role(auth.uid(), 'admin'));
```

### Files to Create
- None (all changes are to existing files)

### Files to Modify
1. **`src/components/admin/CompanySetupTab.tsx`** -- Add logo upload UI with image preview, file picker, and upload-to-storage logic
2. **`src/pages/Auth.tsx`** -- Fetch company settings and display logo + company name dynamically
3. **`supabase/functions/send-onboarding-email/index.ts`** -- Rewrite with professional HTML email template that fetches company logo and details from the database
4. **`src/hooks/useAdmin.tsx`** -- Minor: ensure `logo_url` is included in company settings upsert

### Edge Function Email Template Design
The email will use inline CSS for maximum compatibility:
- Header: Company logo (centered, max 200px wide)
- Body: Clean white card with proper padding, professional greeting, and content
- Footer: Company name, address, phone, email in muted gray text
- Color scheme: Neutral professional tones matching the app's primary color

### Email Types Supported
- **Onboarding Welcome**: Sent when a new employee is created
- **Approval Confirmation**: Sent when a candidate is approved, includes start date

