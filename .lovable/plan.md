
# Fix Employee Portal Dashboard and Related Modules

## Problems Identified

### 1. Missing `useCurrentEmployee` hook (Critical)
The Dashboard imports `useCurrentEmployee` from `@/hooks/useEmployees`, but this function does not exist in the file. This means the employee portal cannot resolve the logged-in user's employee record, so `employee` is always `undefined` and the entire `EmployeeDashboardView` receives an empty string as `employeeId`. All data queries (attendance, leave balances, enrollments, announcements) return nothing.

### 2. Attendance page uses `user.id` (auth ID) instead of employee ID
In `src/pages/attendance/Attendance.tsx`, the `useTodayAttendance` and clock-in calls use `user?.id` (the Supabase auth user ID) instead of the employee table ID. These are different values -- the `attendance` table uses `employee_id` (from the `employees` table), not the auth user ID.

### 3. Leave module not scoped to current employee
The Leave Requests page (`src/pages/leave/Requests.tsx`) calls `useLeaveRequests()` without an employee ID, so regular employees see all leave requests (or none due to RLS). There is no employee-scoped view.

### 4. CreateLeaveModal requires manual employee selection
When an employee requests leave from the dashboard, they must manually pick themselves from a dropdown of all employees. It should auto-fill their employee ID.

### 5. Sidebar shows all modules to all roles
The sidebar navigation shows admin-only modules (Recruitment, Performance, Onboarding management) to regular employees. Employees should see a simplified navigation.

---

## Implementation Plan

### Step 1: Add `useCurrentEmployee` hook
Add a new hook to `src/hooks/useEmployees.tsx` that looks up the employee record by `user_id` (the auth UID):

```typescript
export function useCurrentEmployee(userId: string) {
  return useQuery({
    queryKey: ['current-employee', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('*, department:departments(id, name), location:locations(id, name, city, country)')
        .eq('user_id', userId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}
```

### Step 2: Fix Attendance page to use employee ID
Update `src/pages/attendance/Attendance.tsx`:
- Import and use `useCurrentEmployee` to resolve the auth user to an employee record
- Pass `employee.id` (not `user.id`) to `useTodayAttendance` and `useClockIn`
- For regular employees, scope the attendance list to their own records
- For admin/HR, show all records

### Step 3: Fix Leave Requests page for employees
Update `src/pages/leave/Requests.tsx`:
- For regular employees: scope `useLeaveRequests(employee.id)` to show only their own requests, hide the approve/reject actions
- For admin/HR: keep the current view showing all requests with management actions

### Step 4: Auto-fill employee in CreateLeaveModal
Update `src/components/leave/CreateLeaveModal.tsx`:
- Accept an optional `employeeId` prop
- When provided, pre-select that employee and hide the employee dropdown
- When not provided (admin view), keep the current dropdown behavior

### Step 5: Scope sidebar navigation by role
Update `src/components/layout/AppSidebar.tsx`:
- Add an `employeeOnly` flag to nav items employees should see
- For regular employees, show: Dashboard, Leave (Requests + Balance), Time Attendance (their own), Training (their courses)
- Hide from employees: Employee directory management, Recruitment, Onboarding management, Performance management

### Step 6: Enhance EmployeeDashboardView
Update `src/components/profile/EmployeeDashboardView.tsx`:
- Add a welcome message with employee name and job title
- Add a performance summary widget showing latest review rating
- Add onboarding progress if the employee has incomplete checklists
- Link "View Payslip", "View Full Calendar" buttons to their respective routes

### Step 7: Fix RLS for employee self-service
Ensure employees can INSERT their own attendance records and leave requests:
- Add RLS policy on `attendance` table: employees can insert records for their own employee_id
- Add RLS policy on `leave_requests` table: employees can insert their own leave requests

---

## Technical Details

### Files to Create
None (all changes are to existing files)

### Files to Modify
1. **`src/hooks/useEmployees.tsx`** -- Add `useCurrentEmployee` hook
2. **`src/pages/Dashboard.tsx`** -- Already imports it, will work once hook exists
3. **`src/pages/attendance/Attendance.tsx`** -- Use employee ID instead of auth ID, scope by role
4. **`src/pages/leave/Requests.tsx`** -- Scope by role, show employee-specific view
5. **`src/components/leave/CreateLeaveModal.tsx`** -- Accept optional `employeeId` prop for auto-fill
6. **`src/components/layout/AppSidebar.tsx`** -- Filter nav items by role
7. **`src/components/profile/EmployeeDashboardView.tsx`** -- Enhance with more widgets and navigation links

### Database Migrations
```sql
-- Allow employees to insert their own attendance
CREATE POLICY "Employees can insert their own attendance"
ON public.attendance FOR INSERT
WITH CHECK (
  employee_id IN (
    SELECT id FROM employees WHERE user_id = auth.uid()
  )
);

-- Allow employees to update their own attendance (for clock out)
CREATE POLICY "Employees can update their own attendance"
ON public.attendance FOR UPDATE
USING (
  employee_id IN (
    SELECT id FROM employees WHERE user_id = auth.uid()
  )
);

-- Allow employees to insert their own leave requests
CREATE POLICY "Employees can insert their own leave requests"
ON public.leave_requests FOR INSERT
WITH CHECK (
  employee_id IN (
    SELECT id FROM employees WHERE user_id = auth.uid()
  )
);
```
