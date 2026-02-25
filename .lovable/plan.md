

## Comprehensive Leave Management System

### Overview
Rebuild the Leave Requests page (`/leave/requests`) into a full-featured Leave Management system with leave balance cards, tabbed approval workflow, attachment uploads, and email notifications on approve/reject. Also enhance the Leave Calendar page for HR team availability view.

---

### 1. Update Leave Types in the Form

**File:** `src/components/leave/CreateLeaveModal.tsx`

Replace the current hardcoded leave type options with the requested types:
- LOP (Loss of Pay)
- Annual Leave
- Local Leave

Add an attachment upload field using the existing `employee-documents` storage bucket. The form schema will be extended with an optional `attachment` file field.

---

### 2. Create Leave Balance Cards Component

**New file:** `src/components/leave/LeaveBalanceCards.tsx`

Display card-based leave balances per type using data from the existing `leave_balances` table. Each card shows:
- Leave type name
- Remaining days / Total days
- Used days
- A visual progress bar (`Progress` component)
- Color-coded warning when balance is low (e.g., less than 3 days remaining turns amber/red)

---

### 3. Rebuild Leave Requests Page with Tabbed Workflow

**File:** `src/pages/leave/Requests.tsx`

Complete redesign into a modern dashboard layout:

```text
+--------------------------------------------------+
| Leave Management                                  |
+--------------------------------------------------+
| [Balance Card: LOP] [Balance Card: Annual] [...]  |
+--------------------------------------------------+
| [Request Leave Button]                            |
+--------------------------------------------------+
| Tabs: [All] [Pending] [Approved] [Rejected]      |
| +----------------------------------------------+ |
| | Employee | Type | Duration | Status | Actions | |
| +----------------------------------------------+ |
+--------------------------------------------------+
```

- **Employee view**: Shows their own balances + their requests in tabs
- **HR/Admin view**: Shows team-wide overview with quick approve/reject buttons on the Pending tab
- Each tab filters the leave requests by status
- Status badges with color indicators (yellow=pending, green=approved, red=rejected)

---

### 4. Email Notification on Approve/Reject

**File:** `supabase/functions/send-onboarding-email/index.ts`

Extend the existing edge function to handle a new `type: "leave_status"` email. The email will include:
- Employee name
- Leave type and dates
- New status (Approved/Rejected)
- Company branding (reusing existing template)

**File:** `src/hooks/useLeave.tsx`

Update `useUpdateLeaveStatus` mutation to:
1. Update the status in the database
2. Fetch the employee's email from the `employees` table
3. Call the edge function to send the status notification email

---

### 5. Attachment Upload Support

**File:** `src/components/leave/CreateLeaveModal.tsx`

Add a file input field for uploading supporting documents (medical certificates, etc.). Files will be uploaded to a new `leave-attachments` storage bucket.

**Database migration:**
- Add `attachment_url` column (text, nullable) to `leave_requests` table
- Create `leave-attachments` storage bucket (public: false) with appropriate RLS policies

---

### 6. Enhanced Leave Calendar (HR Dashboard)

**File:** `src/pages/leave/Calendar.tsx`

Update the existing calendar to also serve as an HR availability dashboard:
- Add a legend showing leave type colors including the new types (LOP, Local Leave)
- Show team member count available per day
- Keep existing calendar grid layout

---

### Technical Details

**Files to create:**
- `src/components/leave/LeaveBalanceCards.tsx` -- balance cards component

**Files to modify:**
- `src/pages/leave/Requests.tsx` -- full redesign with tabs, balance cards, modern layout
- `src/components/leave/CreateLeaveModal.tsx` -- updated leave types, attachment upload
- `src/hooks/useLeave.tsx` -- add email sending on status update, add leave balance query hook
- `supabase/functions/send-onboarding-email/index.ts` -- add leave status email type
- `src/types/employee.ts` -- add `attachment_url` to `LeaveRequest` and `CreateLeaveRequestInput`
- `src/pages/leave/Calendar.tsx` -- add new leave type colors

**Database migration:**
- Add `attachment_url` column to `leave_requests` table
- Create `leave-attachments` storage bucket with RLS policies for employees to upload and HR/admin to view

**No new dependencies required** -- uses existing UI components (Tabs, Progress, Card, Badge, etc.) and the existing Resend email integration.

