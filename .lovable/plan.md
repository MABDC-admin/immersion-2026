

# Implementation Plan: Job Postings, Public Application, Email Integration, Admin Panel & Module Completion

## Overview
This plan covers:
1. Fix the build error in the edge function
2. Seed 4 job postings for the specified intern positions
3. Create a public job application page with unique links and CV upload
4. Set up the RESEND_API_KEY secret for email sending
5. Fix the email utility to use the proper Supabase client
6. Add an Admin page for user/employee creation
7. Complete all stub modules with full CRUD functionality

---

## 1. Fix Edge Function Build Error

The `send-onboarding-email` function uses `npm:resend` which fails in Deno. Fix by using the esm.sh CDN import instead:

```typescript
// Change from:
import { Resend } from "npm:resend";
// To:
import { Resend } from "https://esm.sh/resend@4.5.1";
```

Also update CORS headers to include all required Supabase client headers.

---

## 2. Add RESEND_API_KEY Secret

The Resend API key (`re_P1SztNRy_...`) is currently only in `.env` but NOT configured as a backend secret. It needs to be added as a secret so the edge function can access it via `Deno.env.get("RESEND_API_KEY")`.

---

## 3. Database Changes

### Storage Bucket for Resumes
Create a `resumes` storage bucket (public) for candidate CV uploads:

```sql
INSERT INTO storage.buckets (id, name, public) VALUES ('resumes', 'resumes', true);

-- Allow anyone to upload (public application)
CREATE POLICY "Anyone can upload resumes"
ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'resumes');

-- Allow authenticated users to view
CREATE POLICY "Authenticated can view resumes"  
ON storage.objects FOR SELECT USING (bucket_id = 'resumes');
```

### Update Candidates RLS for Public Applications
Add an INSERT policy allowing unauthenticated users to submit applications:

```sql
CREATE POLICY "Anyone can submit applications"
ON candidates FOR INSERT WITH CHECK (true);
```

### Update Job Postings RLS for Public Viewing
Add a SELECT policy for unauthenticated viewing of open job postings:

```sql
CREATE POLICY "Anyone can view open job postings"
ON job_postings FOR SELECT USING (status = 'open');
```

---

## 4. Seed Job Postings

Insert 4 job postings linked to existing departments:
- **Safety Officer Assistant Intern** -- Safety Department
- **Accounting Assistant Intern** -- Accounting Department
- **Human Resource Assistant Intern** -- HR Department
- **IT Helpdesk Intern** -- IT Department

Each with a description, status = 'open', and linked department_id.

---

## 5. Public Job Application Page

### New Route: `/careers/:jobId`
A public page (no authentication required) that:
- Shows job details (title, description, department)
- Has an application form: first name, last name, email, CV upload
- Uploads CV to the `resumes` storage bucket
- Creates a candidate record with `resume_url` pointing to the uploaded file
- Shows a success confirmation after submission

### Unique Application Links
Each job posting will have a shareable link like:
`/careers/{job-id}`

The Jobs page will display a "Copy Link" button for each posting so admins can share application links.

### Update App.tsx Routes
Add the public `/careers/:jobId` route OUTSIDE the ProtectedRoute wrapper.

---

## 6. Fix Email Utility

Update `src/lib/email.ts` to use the proper Supabase client import instead of `(window as any).supabase`:

```typescript
import { supabase } from '@/integrations/supabase/client';

export const sendOnboardingEmail = async (...) => {
  const { data, error } = await supabase.functions.invoke('send-onboarding-email', {
    body: { ... }
  });
};
```

---

## 7. Admin Page for User/Employee Management

### New Route: `/admin`
Admin-only page with tabs:
- **User Management**: View all registered users, assign roles (admin/hr_manager/employee)
- **Create Employee Account**: Form to create new employees directly (uses existing CreateEmployeeModal)
- **Department Management**: CRUD for departments
- **Location Management**: CRUD for locations

### Sidebar Update
Add "Admin" menu item (visible only to admin role users) in the sidebar.

---

## 8. Complete All Stub Modules

### Leave Calendar (`/leave/calendar`)
- Visual calendar showing approved leaves across the organization
- Color-coded by leave type
- Month/week navigation

### Timesheets (`/attendance/timesheets`)
- Weekly timesheet view per employee
- Total hours calculation
- Editable entries for HR/Admin

### New Hires (`/onboarding/new-hires`)
- List of recently hired employees (last 90 days)
- Quick access to their onboarding checklists
- Status indicators

### Onboarding Documents (`/onboarding/documents`)
- Document templates and required documents list
- Track which documents each new hire has submitted
- Integration with existing employee documents

### Recruitment Interviews (`/recruitment/interviews`)
- Currently points to Jobs page -- give it its own view
- Interview scheduling with date/time
- Notes and feedback capture

### Performance Goals (`/performance/goals`)
- Goal setting interface
- Progress tracking
- Link to performance reviews

### Training Enrollments (`/training/enrollments`)
- View all enrollments across courses
- Progress tracking per employee
- Completion certificates

### Training Certificates (`/training/certificates`)
- List of completed training with certificates
- Download/view certificate details

---

## 9. Updated Hooks

### `useRecruitment.tsx` Updates
- Add `useCreateJobPosting` mutation
- Add `useUpdateJobPosting` mutation
- Add `useDeleteJobPosting` mutation
- Add `useUploadResume` for CV uploads

### `useTraining.tsx` Updates
- Add `useCreateEnrollment` mutation
- Add `useUpdateEnrollmentProgress` mutation
- Add `useDeleteCourse` mutation

### `usePerformance.tsx` Updates
- Add `useUpdatePerformanceReview` mutation
- Add `useDeletePerformanceReview` mutation

### `useOnboarding.tsx` Updates
- Add `useCreateOnboardingItem` mutation
- Add `useDeleteOnboardingItem` mutation

### `useAttendance.tsx` Updates
- Add `useUpdateAttendance` mutation for timesheet edits

### New `useAdmin.tsx` Hook
- `useAllUsers` - fetch all profiles with roles
- `useUpdateUserRole` - change user roles
- `useDepartments` and `useLocations` - CRUD for departments/locations

---

## 10. File Changes Summary

### New Files
- `src/pages/careers/PublicJobApplication.tsx` - Public application page
- `src/pages/admin/AdminPanel.tsx` - Admin management page
- `src/hooks/useAdmin.tsx` - Admin hooks
- Updated stub pages with full implementations

### Modified Files
- `supabase/functions/send-onboarding-email/index.ts` - Fix Resend import
- `src/lib/email.ts` - Fix Supabase client usage
- `src/App.tsx` - Add new routes (public careers, admin)
- `src/components/layout/AppSidebar.tsx` - Add Admin menu
- `src/hooks/useRecruitment.tsx` - Add CRUD mutations
- `src/hooks/useTraining.tsx` - Add mutations
- `src/hooks/usePerformance.tsx` - Add mutations
- `src/hooks/useOnboarding.tsx` - Add mutations
- `src/hooks/useAttendance.tsx` - Add mutations
- `src/pages/recruitment/Jobs.tsx` - Add create posting modal, copy link
- `src/pages/recruitment/Candidates.tsx` - Show resume download link
- All stub pages completed with functionality

### Database Changes
- New `resumes` storage bucket
- Updated RLS policies for public job applications
- Seed 4 job postings

---

## Implementation Order

1. Add RESEND_API_KEY as a backend secret
2. Fix edge function (Resend import + CORS headers)
3. Fix `src/lib/email.ts` client usage
4. Database migration (resumes bucket, RLS policies, seed job postings)
5. Create public job application page with CV upload
6. Update Jobs page with create posting + copy link
7. Update Candidates page with resume viewing
8. Create Admin panel page
9. Complete all stub module pages
10. Update all hooks with missing CRUD operations
11. Update routes and sidebar navigation

