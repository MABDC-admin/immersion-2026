

# Plan: Restructure Supervisor Dashboard + Intern Module + DEPED Evaluation System

## Overview

This plan restructures the Supervisor portal (employee detail page) by removing unnecessary tabs, adding an "Interns" module to display assigned applicants, and creating a comprehensive DEPED Senior High School Immersion Evaluation system with proper database tables.

## Current State

- Supervisors (Sheila Mae, Dennis, Glorie Ann, Eulogio, Myranel) have `job_title: "Supervisor"` but most have `role: "employee"` in `user_roles`
- The `employees` table already has a `manager_id` column, but all values are currently `NULL` -- no supervisor-intern relationships exist yet
- The employee portal (`/employees/:id`) shows tabs: Dashboard, Profile, Attendance, Leave, Training
- Interns (Julian Magboo, Rome Anthony Dadula) exist but aren't linked to supervisors

## Database Changes

### 1. Create `intern_evaluations` table

This table stores DEPED Senior High School Work Immersion evaluation records:

```text
intern_evaluations
-------------------------------
id              (uuid, PK)
intern_id       (uuid, FK -> employees.id)   -- the intern being evaluated
evaluator_id    (uuid, FK -> employees.id)   -- the supervisor evaluating
evaluation_date (date)
evaluation_period_start (date)
evaluation_period_end   (date)
status          (text: draft, submitted, finalized)
-- DEPED Criteria Scores (1-5 scale)
attendance_punctuality    (integer)
work_quality              (integer)
work_quantity             (integer)
initiative_creativity     (integer)
teamwork_cooperation      (integer)
communication_skills      (integer)
professionalism           (integer)
adaptability              (integer)
overall_rating            (numeric, computed average)
comments                  (text)
recommendations           (text)
created_at, updated_at    (timestamps)
```

### 2. RLS Policies for `intern_evaluations`

- Supervisors can manage evaluations for their assigned interns (where `evaluator_id` matches their employee record)
- Admin/HR can manage all evaluations
- Interns can view their own evaluations (read-only)

### 3. Enable Realtime for `intern_evaluations`

For live updates when evaluations are submitted.

## Frontend Changes

### 1. Restructure Supervisor Portal Tabs (`src/pages/EmployeeDetail.tsx`)

Detect if the viewed employee is a Supervisor (by checking `job_title` or role). For Supervisors viewing their own portal:

**Remove:** Dashboard tab, Profile tab content simplification, Attendance tab
**Keep:** Leave tab, Training tab
**Add:** Interns tab (new), Evaluations tab (new)

Tab layout for Supervisors:
```text
[Interns] [Evaluations] [Leave] [Training]
```

Tab layout for Interns (unchanged):
```text
[Dashboard] [Profile] [Leave] [Training]
```

Note: Attendance tab is removed from Intern view as well per the request.

### 2. Create Interns Tab Component (`src/components/supervisor/InternsList.tsx`)

- Query employees where `manager_id` equals the supervisor's employee ID
- Display intern cards with: name, avatar, department, status, quick-evaluate button
- Empty state when no interns are assigned

### 3. Create Evaluation Page (`src/pages/evaluations/Evaluations.tsx`)

A dedicated page at `/evaluations` (also embedded as a tab) with:

- List of all evaluations created by the supervisor
- Filter by intern, date range, status
- Create New Evaluation button

### 4. Create Evaluation Form Component (`src/components/evaluations/EvaluationForm.tsx`)

DEPED Work Immersion evaluation form with:
- Intern selector (from assigned interns)
- Evaluation period date range
- 8 criteria scored on a 1-5 scale with descriptive labels:
  1. Attendance and Punctuality
  2. Quality of Work
  3. Quantity of Work
  4. Initiative and Creativity
  5. Teamwork and Cooperation
  6. Communication Skills
  7. Professionalism and Work Ethics
  8. Adaptability and Flexibility
- Auto-calculated overall rating (average)
- Comments and Recommendations text areas
- Save as Draft / Submit buttons

### 5. Create Evaluation Detail/View Component (`src/components/evaluations/EvaluationDetail.tsx`)

- Read-only view of a completed evaluation
- Print-friendly layout for DEPED submission
- Rating visualization with progress bars

### 6. Create Hook (`src/hooks/useEvaluations.tsx`)

- `useEvaluations(evaluatorId)` -- fetch evaluations by supervisor
- `useInternEvaluations(internId)` -- fetch evaluations for an intern
- `useCreateEvaluation()` -- mutation to create
- `useUpdateEvaluation()` -- mutation to update
- `useAssignedInterns(supervisorId)` -- fetch interns by manager_id

### 7. Update Sidebar (`src/components/layout/AppSidebar.tsx`)

Add "Evaluations" nav item visible to Supervisors (admin-level users):

```text
Evaluations (ClipboardCheck icon) -> /evaluations
```

### 8. Update Routes (`src/App.tsx`)

Add route:
```text
/evaluations -> Protected -> EvaluationsPage
```

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/supervisor/InternsList.tsx` | Interns grid for supervisor portal |
| `src/components/evaluations/EvaluationForm.tsx` | DEPED evaluation form modal |
| `src/components/evaluations/EvaluationDetail.tsx` | Read-only evaluation view |
| `src/pages/evaluations/Evaluations.tsx` | Evaluations list page |
| `src/hooks/useEvaluations.tsx` | Data hooks for evaluations and intern assignment |

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/EmployeeDetail.tsx` | Restructure tabs based on role (Supervisor vs Intern) |
| `src/components/layout/AppSidebar.tsx` | Add Evaluations nav item |
| `src/App.tsx` | Add /evaluations route |

## Technical Details

### Supervisor Detection Logic

```typescript
const isSupervisor = employee?.job_title?.toLowerCase().includes('supervisor');
const isViewingOwnProfile = employee?.user_id === user?.id;
const showSupervisorTabs = isSupervisor && isViewingOwnProfile;
```

### Intern Assignment Query

```typescript
// Fetch interns assigned to a supervisor
const { data: interns } = useQuery({
  queryKey: ['assigned-interns', supervisorId],
  queryFn: async () => {
    const { data } = await supabase
      .from('employees')
      .select('*, department:departments(name)')
      .eq('manager_id', supervisorId);
    return data;
  }
});
```

### Evaluation Scoring

Each criterion is scored 1-5:
- 5 = Outstanding
- 4 = Very Satisfactory  
- 3 = Satisfactory
- 2 = Needs Improvement
- 1 = Poor

Overall rating = average of all 8 criteria scores.

