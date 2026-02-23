
# Remove Mock Employees and Build Comprehensive Admin Panel

## 1. Remove Mock Employees from Database

Delete the 12 mock/test employees from the database, keeping only the 5 real supervisors (@mabdc.com emails):

Employees to **delete**: John Doe, Alex Smith, Aelexa Cary, Steve John, David Maxy, Beeron Allay, Hawell Doe, Nevine Otaza, Annul Rexi, Valado John, Max Kevine, Romman Ley

Employees to **keep**: Dennis Sotto, Sheila Mae Dadula, Glorie Ann Espinosa, Eulogio Dadula, Myranel Plaza

---

## 2. Comprehensive Admin Panel

Rebuild the Admin Panel (`/admin`) with 9 tabbed sections covering the full list of requested features. Only users with the `admin` role can access this page.

### Tab 1: User and Role Management
- Table of all registered users with name, email, current role
- Role assignment dropdown (Admin, HR Manager, Employee, plus new roles: Payroll Officer, Manager)
- Deactivate/reactivate user accounts
- Password reset button (triggers password reset email)
- Create new user form

### Tab 2: Company and Organization Setup
- Company profile form (name, logo, address, tax info) -- stored in a new `company_settings` table
- Department CRUD (existing functionality, enhanced with supervisor assignment)
- Job position management
- Reporting hierarchy configuration (manager assignment per employee)
- Branch/location management (existing functionality)

### Tab 3: Employee Data Oversight
- Full employee directory with admin controls
- Approve/reject profile update requests
- Import/export employee data (CSV)
- Set employment status (active, resigned, terminated)
- Bulk actions

### Tab 4: Payroll Configuration
- Salary structure definitions (new `salary_structures` table)
- Allowances and deductions configuration (new `payroll_components` table)
- Tax rules setup
- Pay grade management (new `pay_grades` table)
- Payroll cycle settings

### Tab 5: Attendance and Leave Settings
- Work schedule configuration (new `work_schedules` table)
- Leave type definitions (new `leave_types` table)
- Leave policy settings (accrual rates, carry-over limits)
- Override/approve leave requests
- Holiday calendar management (leverages existing `events` table)

### Tab 6: Reports and Analytics
- Company-wide dashboards:
  - Employee summary (headcount, department distribution, turnover)
  - Attendance reports (punctuality, absences)
  - Leave utilization rates
- Export to PDF/CSV

### Tab 7: Workflow and Approval Management
- Approval chain configuration (new `approval_workflows` table)
- Notification settings
- Escalation rules

### Tab 8: Security and Compliance
- Password policy settings
- Audit log viewer (leverages existing `activities` table)
- Data retention settings display
- Session management

### Tab 9: System Maintenance
- Database backup info/status
- System health indicators
- Clear cache / reset options

---

## 3. Database Changes

### New Tables

```text
company_settings
  id, name, logo_url, address, city, country, tax_id,
  phone, email, created_at, updated_at

leave_types
  id, name, days_per_year, carry_over, is_paid, created_at

work_schedules
  id, name, start_time, end_time, days_of_week, created_at

pay_grades
  id, name, min_salary, max_salary, currency, created_at

salary_structures
  id, employee_id, pay_grade_id, base_salary,
  allowances (jsonb), deductions (jsonb), created_at

approval_workflows
  id, name, module, steps (jsonb), created_at

audit_logs
  id, user_id, action, entity_type, entity_id,
  details (jsonb), created_at
```

All tables will have RLS policies restricting management to admin role only, with read access for authenticated users where appropriate.

### Updated Roles Enum
Extend `app_role` enum to include additional roles:
- `payroll_officer`
- `manager`

---

## 4. Sidebar Navigation Update

Replace the single "Admin" link with an expandable admin section containing sub-items for each tab, or keep it as a single link that opens the tabbed admin panel. The admin menu item remains visible only to admin-role users.

---

## 5. File Changes Summary

### New Files
- Multiple sub-components for admin tabs (e.g., `src/components/admin/UserManagementTab.tsx`, `CompanySetupTab.tsx`, etc.)

### Modified Files
- `src/pages/admin/AdminPanel.tsx` -- Complete rewrite with 9 tabs
- `src/hooks/useAdmin.tsx` -- Add hooks for new tables
- `src/components/layout/AppSidebar.tsx` -- Minor update if needed

### Database
- Migration with new tables and RLS policies
- Data deletion of 12 mock employees

---

## 6. Implementation Order

1. Delete mock employees from database
2. Create database migration for new tables
3. Extend role enum
4. Build admin tab components one by one
5. Rewrite AdminPanel.tsx with all 9 tabs
6. Update useAdmin.tsx with new hooks
7. Test admin panel access and functionality
