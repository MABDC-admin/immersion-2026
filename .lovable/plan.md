

# Plan: Restructure Application Roles and Dashboards

## Overview

This plan restructures the dashboard experience by creating separate, clean views for Admin/Supervisor users vs. Intern/Employee users. It removes unnecessary widgets from the Admin dashboard, cleans up intern portals, and treats Supervisor as Admin-level access.

## Changes

### 1. Role Management - Treat Supervisor as Admin (`src/hooks/useAuth.tsx`)

- Add `'manager'` (Supervisor) to the `isAdmin` check so Supervisors get Admin-level privileges
- Change: `const isAdmin = userRole === 'admin' || userRole === 'manager';`
- This gives Supervisors full access to manage assistant interns and all admin features

### 2. Redesign Admin Dashboard (`src/pages/Dashboard.tsx`)

Remove from Admin view:
- `AdminAssignRole` component (the "Assign Role" button at the top)
- `EmployeeDashboardView` (which contains leave balance, quick actions with "Request Leave", "My Tasks", "Schedule Preview")
- `QuickActionsWidget` (the bottom quick actions grid)
- `MakeAdminCard`
- `TutorialDialog` (not relevant for admin)

Keep for Admin view (clean organizational overview):
- Animated stat cards (Total Employees, Active, New Hires, On Leave)
- Employee Status Chart
- Department Distribution Chart
- Recent Activity Widget
- Upcoming Events Widget

Add for Admin view:
- A clean welcome header with role badge
- Quick navigation buttons to Admin Panel, Employees, Recruitment, Onboarding

### 3. Clean Up Intern/Employee Dashboard (`src/pages/Dashboard.tsx`)

For regular employees (interns), show only:
- Welcome card (already exists in `EmployeeDashboardView`)
- `TodaySummaryCards` (Leave Balance + Active Training)
- `QuickActions` (Request Leave, Update Profile, View Payslip)
- `AnnouncementsWidget`
- `View Leave Calendar` link

Remove from Intern view:
- `MakeAdminCard` (the "Upgrade Your Role" card) -- remove entirely
- `AdminAssignRole`
- `MyTasksWidget` (currently empty/non-functional)
- `CalendarPreview` (Schedule Preview)

### 4. Remove Leave Balance and Request Leave from Supervisor/Admin View

Since Supervisors get Admin-level access, they will see the Admin dashboard which already does not show leave balance or request leave. The `EmployeeDashboardView` (containing those widgets) will only render for non-admin roles.

### 5. Sidebar Cleanup (`src/components/layout/AppSidebar.tsx`)

- Remove "Time Attendance" from the sidebar for employees (keep only for admin/HR)
- Ensure Supervisors (managers) see all admin sidebar items since they now have admin-level access
- Remove the `Leave Balance` sub-item from the Leave menu for admin/supervisor users

### 6. Remove Unnecessary Components

- Remove `MakeAdminCard` usage entirely from Dashboard (security concern -- allows self-role-upgrade)
- Remove `AdminAssignRole` from Dashboard (duplicates Admin Panel functionality)

## Files to Modify

| File | Change |
|------|--------|
| `src/hooks/useAuth.tsx` | Add manager to isAdmin check |
| `src/pages/Dashboard.tsx` | Split into Admin vs Employee views, remove unnecessary widgets |
| `src/components/profile/EmployeeDashboardView.tsx` | Remove MyTasksWidget and CalendarPreview |
| `src/components/layout/AppSidebar.tsx` | Adjust sidebar visibility for supervisor=admin, clean up nav items |

## Technical Details

### Dashboard.tsx restructured layout:

```text
Admin/Supervisor View:
+---------------------------+
| Welcome, [Name] (Admin)   |
+---------------------------+
| [Stats Grid - 4 cards]    |
+---------------------------+
| [Status Chart] [Dept Chart]|
+---------------------------+
| [Recent Activity] [Events] |
+---------------------------+

Employee/Intern View:
+---------------------------+
| Welcome, [Name]           |
+---------------------------+
| [Leave Balance] [Training] |
+---------------------------+
| [Request Leave] [Profile]  |
| [View Payslip]             |
+---------------------------+
| [View Leave Calendar]      |
+---------------------------+
| [Announcements]            |
+---------------------------+
```

### Auth role mapping:
```text
Before: isAdmin = userRole === 'admin'
After:  isAdmin = userRole === 'admin' || userRole === 'manager'
```

This means Supervisors (role: manager) automatically get:
- Admin Panel access
- All sidebar navigation items
- Organizational Overview dashboard
- No leave balance / request leave in their dashboard

