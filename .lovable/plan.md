

# Include User Credentials and Login URL in Onboarding Emails

## Overview
Update the onboarding email system so that when emails are sent, they can optionally include the employee's login credentials (username/email and password) and a direct link to the employee portal at `https://immersion.mabdc.com/auth`.

## How It Works

When an employee is created or a candidate is approved, the system will:
1. Create a Supabase Auth account for the employee with a default password
2. Include the credentials (email as username + password) in the onboarding email
3. Include a styled "Login to Portal" button linking to `https://immersion.mabdc.com/auth`

## Changes

### 1. Edge Function (`supabase/functions/send-onboarding-email/index.ts`)
- Add `username` and `password` fields to the `EmailPayload` interface
- Update both email templates (onboarding + approval) to include a credentials box when username/password are provided
- The credentials box will be a styled card showing:
  - **Username**: the employee's email
  - **Password**: the provided password
  - A prominent "Login to Employee Portal" button linking to `https://immersion.mabdc.com/auth`
  - A note advising the employee to change their password after first login
- The login URL `https://immersion.mabdc.com/auth` will be hardcoded in the edge function

### 2. Email Helper (`src/lib/email.ts`)
- Add optional `password` parameter to `sendOnboardingEmail`
- Pass `username` (the employee's email) and `password` to the edge function payload

### 3. Create Employee Modal (`src/components/employees/CreateEmployeeModal.tsx`)
- After creating the employee, create a Supabase Auth account using an edge function (since client-side `signUp` would log out the admin)
- Pass the credentials to `sendOnboardingEmail` so they're included in the welcome email
- Use a default password (e.g., `654321`) or allow admin to specify one

### 4. Candidate Approval (`src/hooks/useRecruitment.tsx`)
- When approving a candidate, create a Supabase Auth account for them via edge function
- Pass credentials to `sendOnboardingEmail` along with the start date

### 5. New Edge Function: `create-employee-account`
- Creates a Supabase Auth user with the given email and password using the Admin API
- Returns the new user ID so it can be linked to the employee record
- This avoids the admin being logged out (which would happen with client-side `signUp`)

---

## Technical Details

### New File
- **`supabase/functions/create-employee-account/index.ts`** -- Edge function that uses the Supabase Admin API to create auth accounts without affecting the current session

### Modified Files
1. **`supabase/functions/send-onboarding-email/index.ts`** -- Add credentials box and login button to email templates
2. **`src/lib/email.ts`** -- Accept and pass `password` parameter
3. **`src/components/employees/CreateEmployeeModal.tsx`** -- Create auth account, send email with credentials
4. **`src/hooks/useRecruitment.tsx`** -- Create auth account on approval, send email with credentials

### Email Credentials Box Design
A styled card within the email body:
- Light blue/gray background
- "Your Login Credentials" heading
- Username and password displayed in monospace font
- A colored "Login to Employee Portal" button
- Security reminder to change password on first login

### Default Password
The system will use `654321` as the default password (matching the convention already used for supervisors). The email will instruct the employee to change it.
