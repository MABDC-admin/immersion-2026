

# Immersion HRMS Application Plan

## Overview
A comprehensive Human Resource Management System with an employee directory as the central feature, complete with role-based access control, real-time chat, and full HR module functionality.

---

## 1. Authentication & Security Foundation

### Login & Access System
- Clean login page matching the blue-themed design
- Email/password authentication through Supabase
- Password reset functionality via email
- Session management with automatic token refresh

### Role-Based Access Control (RBAC)
- **Admin**: Full system access, user management, role assignment
- **HR Manager**: Manage employees, leave approvals, recruitment, training
- **Employee**: View directory, self-service features, view own data

### Initial Admin Setup
- You'll sign up normally with sottodennis@gmail.com
- A special admin assignment tool will be available to grant admin privileges

---

## 2. Core Layout & Navigation

### Sidebar Navigation (as shown in reference)
- Company logo at top
- Dashboard
- Employee (with sub-menu)
- Leave (expandable)
- Time Attendance (expandable)
- Recruitment (expandable)
- Performance (expandable)
- Onboarding (expandable)
- Training (expandable)
- Current user profile at bottom with Help link

### Top Header Bar
- Filter/settings toggle
- Global search bar
- Add new (context-sensitive)
- Notifications bell with badge
- User profile avatar

---

## 3. Employee Directory Module (Main Feature)

### Employee List View
- Grid and list view toggle
- Employee count display ("250 Employees")
- Search by name
- Filter by department, status, location
- Group by location (New York, Melbourne, etc.)
- Pagination with page numbers

### Employee Cards
- Avatar with online/offline status indicator
- Name and job title
- Phone number
- Contact person
- Location
- Email address
- Join date
- Tenure display (e.g., "5 Years 3 Months")
- Social media links (Email, LinkedIn, Twitter, Slack)
- Quick action button

### Employee Management (Admin/HR)
- Add new employee form
- Edit employee details
- Deactivate/archive employees
- Bulk import via CSV

---

## 4. Dashboard Module
- Overview widgets showing key metrics
- Employee statistics (total, new hires, departures)
- Leave requests pending
- Upcoming events/birthdays
- Quick action cards

---

## 5. Leave Management Module
- Leave request form
- Leave balance display
- Calendar view of team leaves
- Approval workflow (for HR/Admin)
- Leave types (vacation, sick, personal, etc.)
- Leave history

---

## 6. Time & Attendance Module
- Check-in/check-out functionality
- Attendance calendar
- Work hours summary
- Overtime tracking
- Attendance reports

---

## 7. Recruitment Module
- Job postings management
- Candidate tracking
- Interview scheduling
- Hiring pipeline view
- Offer letter management

---

## 8. Performance Module
- Performance review cycles
- Goal setting and tracking
- Feedback collection
- Rating systems
- Performance reports

---

## 9. Onboarding Module
- New hire checklist
- Document collection
- Training assignment
- Mentor assignment
- Progress tracking

---

## 10. Training Module
- Training course catalog
- Enrollment management
- Completion tracking
- Certificate management
- Training calendar

---

## 11. Real-Time Chat System
- Chat button with unread count (shown as "CHAT (128)")
- Direct messaging between employees
- Group conversations
- Real-time message updates using Supabase Realtime
- Message notifications

---

## 12. Database Structure

### Core Tables
- **profiles**: Extended user information
- **user_roles**: Role assignments (admin, hr_manager, employee)
- **employees**: Complete employee records
- **departments**: Department structure
- **locations**: Office locations

### Module-Specific Tables
- Leave requests, leave types, leave balances
- Attendance records
- Job postings, candidates, interviews
- Performance reviews, goals
- Onboarding tasks
- Training courses, enrollments
- Chat messages, conversations

---

## 13. Design System
- **Primary Color**: Blue (#2196F3 or similar)
- **Card Design**: White cards with blue header bands
- **Avatar Styling**: Circular with online status indicators
- **Clean, professional typography**
- **Responsive layout for all screen sizes**

---

## Implementation Approach
We'll build this in phases:
1. **Phase 1**: Authentication, RBAC, core layout, and Employee Directory
2. **Phase 2**: Dashboard and Leave Management
3. **Phase 3**: Time Attendance and Recruitment
4. **Phase 4**: Performance and Onboarding
5. **Phase 5**: Training and Chat System

This ensures you have a working application quickly while we add more features progressively.

