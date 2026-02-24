

# Plan: Direct Password Reset with Generated Password

## Overview
Instead of sending a password reset link (which requires the user to click a link and choose a new password), the system will generate a random 8-character password and email it directly to the user. The admin clicks "Reset Password", a new password is generated, updated on the account, and emailed to the employee.

## How It Works

1. Admin clicks the reset password button in User Management
2. A new edge function generates a random 8-character password (uppercase + lowercase + numbers)
3. The function uses the admin API to update the user's password directly
4. The function sends the new password via email using the existing branded email template
5. Admin sees a success message

## Changes

### 1. New Backend Function: `reset-user-password`
Creates a new backend function that:
- Accepts `userId`, `email`, `firstName`, and `lastName`
- Generates a random 8-character password with at least 1 uppercase, 1 lowercase, and 1 number
- Uses the Admin API to update the user's password
- Sends the new password via a branded email using Resend (reusing the company settings and email template pattern from the existing onboarding email function)

### 2. Update `supabase/config.toml`
Add the new function configuration with `verify_jwt = false`.

### 3. Update `UserManagementTab.tsx`
Change `handlePasswordReset` to call the new `reset-user-password` function instead of `supabase.auth.resetPasswordForEmail()`. Pass `userId`, `email`, `firstName`, and `lastName` so the email can be personalized.

## Technical Details

### Password Generation Logic
```text
Characters: A-Z, a-z, 0-9
Length: 8 characters
Guarantee: at least 1 uppercase, 1 lowercase, 1 digit
Example output: "Kd7mRp2x"
```

### Edge Function Flow
```text
1. Receive { userId, email, firstName, lastName }
2. Generate 8-char password
3. supabaseAdmin.auth.admin.updateUserById(userId, { password })
4. Fetch company_settings for branding
5. Send email via Resend with new credentials
6. Return success/error
```

### Email Content
The email will use the same branded template as onboarding emails, showing:
- A greeting to the employee by name
- The new password in a styled credentials box
- A login button linking to the portal
- A reminder to change the password after first login

