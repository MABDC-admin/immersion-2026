

## Plan: Supervisor Attendance Module with QR Code Scanning

### Overview
This plan covers four changes:
1. Change TARGET_HOURS from 500 to 80
2. Add a new "Attendance" page for supervisors showing all interns' time clock records
3. Add the "Attendance" link to the supervisor sidebar
4. Add QR code generation for each intern (button + display in dropdown)

---

### 1. Change Target Hours to 80
**File:** `src/components/supervisor/InternsList.tsx`
- Change `const TARGET_HOURS = 500;` to `const TARGET_HOURS = 80;`

---

### 2. New Supervisor Attendance Page

**New file:** `src/pages/attendance/SupervisorAttendance.tsx`

A dedicated page at `/supervisor/attendance` that shows:
- A summary card with total interns and today's attendance count
- A table listing all attendance records for the supervisor's interns (fetched via the existing RLS policy that allows supervisors to view their interns' attendance)
- Filter by intern name and date range
- Each row shows: Intern Name, Date, Clock In, Clock Out, Hours, Status

The page will:
- Use `useAuth` and `useCurrentEmployee` to get the supervisor's employee ID
- Query `employees` where `manager_id = supervisorId` to get intern list
- Query `attendance` table filtered by those intern IDs (RLS already supports this)

---

### 3. Attendance Kiosk Page with QR Scanning

**New file:** `src/pages/attendance/AttendanceKiosk.tsx`

A public-facing kiosk page at `/kiosk/:supervisorId` that:
- Shows the supervisor's name and a QR scanner interface
- When an intern's QR code is scanned, it reads the intern's employee ID from the QR data
- Automatically clocks the intern in or out (clock in if no record today, clock out if already clocked in)
- Shows a confirmation with the intern's name and timestamp
- This page does NOT require authentication -- it uses a backend edge function for the actual clock-in/clock-out

**New edge function:** `supabase/functions/kiosk-clock/index.ts`
- Accepts POST with `{ employeeId, supervisorId }`
- Validates the employee is managed by the supervisor
- Inserts or updates the attendance record using the service role key
- Returns success with clock-in or clock-out status

---

### 4. QR Code Generation

**Install dependency:** `qrcode.react` -- a lightweight React component for rendering QR codes

**Changes to `src/components/supervisor/InternsList.tsx`:**
- Add a "Generate QR" button on each intern card (next to "Evaluate")
- The QR code encodes a JSON string: `{ "employeeId": "<intern-id>", "supervisorId": "<supervisor-id>" }`
- Display the QR code inside the expanded dropdown section as well
- Add a download/print button for the QR code

---

### 5. Sidebar Update

**File:** `src/components/layout/AppSidebar.tsx`

Add "Attendance" to `supervisorNavItems`:
```text
supervisorNavItems = [
  Interns -> /employees/{supervisorId}
  Attendance -> /supervisor/attendance
  Evaluations -> /evaluations
]
```

---

### 6. Route Registration

**File:** `src/App.tsx`

Add routes:
- `/supervisor/attendance` -> `SupervisorAttendance` (protected)
- `/kiosk/:supervisorId` -> `AttendanceKiosk` (public, no auth required)

---

### Technical Details

**Database changes:** None required. The existing `attendance` table and RLS policies already support supervisor viewing intern attendance. The edge function will use the service role key to bypass RLS for kiosk clock-in/out.

**New files:**
- `src/pages/attendance/SupervisorAttendance.tsx` -- supervisor's attendance dashboard
- `src/pages/attendance/AttendanceKiosk.tsx` -- public kiosk page with QR scanner
- `supabase/functions/kiosk-clock/index.ts` -- edge function for unauthenticated clock-in/out

**Modified files:**
- `src/components/supervisor/InternsList.tsx` -- TARGET_HOURS change, QR code button + display
- `src/components/layout/AppSidebar.tsx` -- add Attendance nav item
- `src/App.tsx` -- add new routes

**New dependency:** `qrcode.react` for QR code rendering

