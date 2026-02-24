

# Plan: Remove Clock In/Out from Employee Mobile View & Remove Lovable Tagger

## 1. Remove Clock In/Out from Employee Dashboard (Mobile View)

The employee dashboard currently shows attendance-related cards in `TodaySummaryCards.tsx` -- a "Check-in" time card and a "Target Progress" hours card. These will be removed entirely since clock-in/out has been removed from the employee dashboard.

Additionally, the "View Attendance History" quick navigation link will be removed from the dashboard, and the "Attendance" item will be removed from the mobile bottom navigation bar.

### Files to modify:

- **`src/components/profile/TodaySummaryCards.tsx`** -- Remove the "Check-in" card (showing clock-in time) and the "Target Progress" card (showing cumulative hours). Replace with leave balance and training summary cards instead (using the data already passed as props).

- **`src/components/profile/EmployeeDashboardView.tsx`** -- Remove the `useTodayAttendance` and `useAttendance` imports/hooks since they're no longer needed. Remove the `attendance` and `allAttendance` props from `TodaySummaryCards`. Remove the "View Attendance History" quick navigation link card.

- **`src/components/layout/BottomNav.tsx`** -- Remove the "Attendance" nav item (Clock icon, `/attendance` route) from the mobile bottom navigation.

## 2. Remove Lovable Tagger Permanently

The `lovable-tagger` plugin in `vite.config.ts` adds development-time component tagging. It will be removed entirely.

### File to modify:

- **`vite.config.ts`** -- Remove the `import { componentTagger } from "lovable-tagger"` line and remove `mode === "development" && componentTagger()` from the plugins array. Also fix the port from `8081` to `8080`.

## Technical Details

### TodaySummaryCards new content:
The two cards will show:
1. **Leave Balance** -- Total remaining leave days (already available via `leaveBalances` prop)
2. **Active Training** -- Number of in-progress training courses (already available via `enrollments` prop)

### BottomNav updated items:
```text
Home | Chat | Training | Profile
```
(Attendance removed, 4 items instead of 5)

### vite.config.ts plugins:
```typescript
plugins: [react()],
```
