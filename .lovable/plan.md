

# Plan: Fix Employee Dashboard & User Management

## Changes Overview

### 1. Remove Clock In/Out from Employee Dashboard
Remove the clock in/clock out buttons from the `QuickActions` component and the `EmployeeDashboardView`, keeping only Request Leave, Update Profile, and View Payslip.

**Files to modify:**
- `src/components/profile/QuickActions.tsx` -- Remove `onClockIn`, `onClockOut`, `isClockedIn`, `isClocking` props and the clock in/out button
- `src/components/profile/EmployeeDashboardView.tsx` -- Remove clock in/out related hooks and props passed to `QuickActions`

### 2. Fix "No email found" in User Management
The `profiles` table does not have an `email` column. The `useAllProfiles` hook fetches profiles but never resolves the user's email, so `profile.email` is always undefined.

**Fix:** Join the `employees` table (which has an `email` column) by matching `user_id`, and use the employee email for password resets.

**File to modify:**
- `src/hooks/useAdmin.tsx` -- In `useAllProfiles`, also fetch from `employees` table and map emails to profiles via `user_id`

### 3. Fix Edge Function Build Errors
All 5 errors are `'error' is of type 'unknown'` in catch blocks. Fix by casting to `Error` type.

**Files to modify:**
- `supabase/functions/create-employee-account/index.ts` -- `(error as Error).message`
- `supabase/functions/send-onboarding-email/index.ts` -- `(error as Error).message`
- `supabase/functions/sync-github-migrations/index.ts` -- `(err as Error).message` (3 occurrences)

## Technical Details

### QuickActions simplified props:
```typescript
interface QuickActionsProps {
    onRequestLeave: () => void;
    onUpdateProfile: () => void;
}
```

### Email resolution in useAllProfiles:
```typescript
const { data: employees } = await supabase.from('employees').select('user_id, email');
const emailMap = new Map(employees?.map(e => [e.user_id, e.email]));
return profiles.map(p => ({
  ...p,
  role: roleMap.get(p.user_id) || 'employee',
  email: emailMap.get(p.user_id) || null
}));
```

