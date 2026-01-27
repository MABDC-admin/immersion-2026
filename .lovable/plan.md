
# Implementation Plan: Employee CRUD, Profile Detail, File Storage & Dashboard Widgets

## Overview
This plan addresses the full feature set requested:
1. Create new employee modal form with all fields
2. Employee profile detail page with edit capability for HR/Admin
3. Full CRUD operations with avatar photo upload and document storage
4. Fix existing React ref warnings
5. Enhanced dashboard with animated widgets

---

## 1. Database Changes

### Storage Buckets
Create two storage buckets for file management:

```sql
-- Avatar photos bucket (public for display)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);

-- Employee documents bucket (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('employee-documents', 'employee-documents', false);
```

### RLS Policies for Storage

```sql
-- Avatar policies: Allow authenticated users to upload their own, 
-- HR/Admin can manage all
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars' AND is_admin_or_hr(auth.uid()));

CREATE POLICY "Admin/HR can manage avatars"
ON storage.objects FOR UPDATE/DELETE
TO authenticated
USING (bucket_id = 'avatars' AND is_admin_or_hr(auth.uid()));

-- Document policies: Only HR/Admin can access
CREATE POLICY "HR/Admin can view documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'employee-documents' AND is_admin_or_hr(auth.uid()));
```

### New Documents Table

```sql
CREATE TABLE public.employee_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT,
    file_size INTEGER,
    uploaded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: Only HR/Admin can manage documents
ALTER TABLE employee_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "HR/Admin can manage documents"
ON employee_documents FOR ALL
TO authenticated
USING (is_admin_or_hr(auth.uid()));
```

---

## 2. Fix Console Warnings

### Issue
React warnings about function components not supporting refs in `EmployeeGrid` and `EmployeeCard`.

### Solution
Wrap both components with `React.forwardRef()`:

```typescript
// EmployeeCard.tsx
export const EmployeeCard = React.forwardRef<HTMLDivElement, EmployeeCardProps>(
  ({ employee, onQuickAction, onClick }, ref) => {
    // ... component body
  }
);
EmployeeCard.displayName = 'EmployeeCard';

// EmployeeGrid.tsx
export const EmployeeGrid = React.forwardRef<HTMLDivElement, EmployeeGridProps>(
  ({ employees, groupBy, onQuickAction, onEmployeeClick }, ref) => {
    // ... component body
  }
);
EmployeeGrid.displayName = 'EmployeeGrid';
```

---

## 3. New Components Structure

### File: `src/components/employees/CreateEmployeeModal.tsx`
A comprehensive modal form with:
- Personal info: First name, last name, email, phone
- Job info: Job title, department (dropdown), location (dropdown)
- Employment: Hire date (date picker), status, manager (dropdown)
- Avatar upload with preview
- Social links: LinkedIn, Twitter, Slack username
- Address info: Address, city, country

### File: `src/components/employees/EmployeeDetailPage.tsx`
Full profile page featuring:
- Header with avatar, name, status badge
- Contact information section
- Employment details section
- Documents section (upload/download/delete)
- Edit mode toggle for HR/Admin users
- Delete employee button (Admin only)

### File: `src/components/employees/EditEmployeeForm.tsx`
Reusable form component used in both modal and detail page edit mode.

### File: `src/components/employees/DocumentUpload.tsx`
Document management component with:
- Drag and drop upload area
- File type validation
- Upload progress indicator
- Document list with download/delete actions

### File: `src/components/employees/AvatarUpload.tsx`
Avatar upload component with:
- Click to upload or drag and drop
- Image preview
- Crop functionality (optional)
- Upload to Supabase Storage

---

## 4. Enhanced Hooks

### Update `src/hooks/useEmployees.tsx`
Add new hooks for file management:

```typescript
// Upload avatar to storage
export function useUploadAvatar() {
  return useMutation({
    mutationFn: async ({ employeeId, file }: { employeeId: string; file: File }) => {
      const fileExt = file.name.split('.').pop();
      const filePath = `${employeeId}/avatar.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      
      // Update employee record with new avatar URL
      await supabase
        .from('employees')
        .update({ avatar_url: publicUrl })
        .eq('id', employeeId);
      
      return publicUrl;
    }
  });
}

// Document upload
export function useUploadDocument() {
  return useMutation({
    mutationFn: async ({ employeeId, file }: { employeeId: string; file: File }) => {
      const filePath = `${employeeId}/${file.name}`;
      
      const { error } = await supabase.storage
        .from('employee-documents')
        .upload(filePath, file);
      
      if (error) throw error;
      
      // Create document record
      const { data, error: insertError } = await supabase
        .from('employee_documents')
        .insert({
          employee_id: employeeId,
          file_name: file.name,
          file_path: filePath,
          file_type: file.type,
          file_size: file.size,
        })
        .select()
        .single();
      
      if (insertError) throw insertError;
      return data;
    }
  });
}

// Fetch employee documents
export function useEmployeeDocuments(employeeId: string) {
  return useQuery({
    queryKey: ['employee-documents', employeeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employee_documents')
        .select('*')
        .eq('employee_id', employeeId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!employeeId
  });
}

// Delete document
export function useDeleteDocument() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, filePath }: { id: string; filePath: string }) => {
      await supabase.storage.from('employee-documents').remove([filePath]);
      
      const { error } = await supabase
        .from('employee_documents')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-documents'] });
    }
  });
}
```

---

## 5. Route Configuration

Update `App.tsx` to add employee detail route:

```typescript
<Route
  path="/employees/:id"
  element={
    <ProtectedRoute>
      <EmployeeDetail />
    </ProtectedRoute>
  }
/>
```

---

## 6. Enhanced Dashboard with Animations

### Update `tailwind.config.ts` with animations:

```typescript
keyframes: {
  "fade-in": {
    "0%": { opacity: "0", transform: "translateY(10px)" },
    "100%": { opacity: "1", transform: "translateY(0)" }
  },
  "scale-in": {
    "0%": { transform: "scale(0.95)", opacity: "0" },
    "100%": { transform: "scale(1)", opacity: "1" }
  },
  "count-up": {
    "0%": { opacity: "0" },
    "100%": { opacity: "1" }
  },
  "pulse-glow": {
    "0%, 100%": { boxShadow: "0 0 0 0 rgba(33, 150, 243, 0.4)" },
    "50%": { boxShadow: "0 0 0 10px rgba(33, 150, 243, 0)" }
  },
  "slide-in-right": {
    "0%": { transform: "translateX(100%)" },
    "100%": { transform: "translateX(0)" }
  }
},
animation: {
  "fade-in": "fade-in 0.3s ease-out",
  "scale-in": "scale-in 0.2s ease-out",
  "count-up": "count-up 0.5s ease-out",
  "pulse-glow": "pulse-glow 2s infinite",
  "slide-in-right": "slide-in-right 0.3s ease-out"
}
```

### New Dashboard Components:

#### `src/components/dashboard/AnimatedStatCard.tsx`
- Animated number counter effect
- Gradient backgrounds based on stat type
- Hover animations
- Icon with pulse effect

#### `src/components/dashboard/RecentActivityWidget.tsx`
- Real-time activity feed
- Animated list items
- Activity type icons with colors

#### `src/components/dashboard/UpcomingEventsWidget.tsx`
- Birthdays this week
- Work anniversaries
- Leave calendar preview

#### `src/components/dashboard/QuickActionsWidget.tsx`
- Add Employee button
- View Reports
- Manage Departments
- Animated hover states

#### `src/components/dashboard/EmployeeStatusChart.tsx`
- Donut chart showing employee status distribution
- Using recharts library (already installed)
- Animated on load

---

## 7. Updated Dashboard Page

Enhanced with animated widgets:

```typescript
// src/pages/Dashboard.tsx
export default function Dashboard() {
  const { data: employees = [] } = useEmployees();
  const { isAdmin, userRole } = useAuth();

  // Calculate stats with animations
  const stats = useMemo(() => [...], [employees]);

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Animated Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <AnimatedStatCard
              key={stat.title}
              {...stat}
              delay={index * 100}
            />
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <EmployeeStatusChart employees={employees} />
          <DepartmentDistributionChart employees={employees} />
        </div>

        {/* Activity & Events Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <RecentActivityWidget className="lg:col-span-2" />
          <UpcomingEventsWidget />
        </div>

        {/* Quick Actions */}
        <QuickActionsWidget />
      </div>
    </MainLayout>
  );
}
```

---

## 8. Employees Page Updates

### Add Modal Integration:

```typescript
// src/pages/Employees.tsx
const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
const navigate = useNavigate();

const handleAddNew = () => {
  setIsCreateModalOpen(true);
};

const handleEmployeeClick = (employee: Employee) => {
  navigate(`/employees/${employee.id}`);
};

// In render:
<EmployeeGrid
  employees={paginatedEmployees}
  groupBy={groupBy}
  onEmployeeClick={handleEmployeeClick}
/>

<CreateEmployeeModal
  open={isCreateModalOpen}
  onOpenChange={setIsCreateModalOpen}
/>
```

---

## 9. Employee Detail Page Features

### For All Users:
- View full employee profile
- See contact information
- View employment history
- See assigned department and manager

### For HR Manager / Admin:
- Edit employee information
- Upload/delete documents
- Change employee status
- Upload new avatar
- Delete employee (Admin only)

---

## 10. File Structure Summary

```text
src/
├── components/
│   ├── employees/
│   │   ├── EmployeeCard.tsx (updated with forwardRef)
│   │   ├── EmployeeGrid.tsx (updated with forwardRef)
│   │   ├── EmployeeFilters.tsx
│   │   ├── CreateEmployeeModal.tsx (new)
│   │   ├── EditEmployeeForm.tsx (new)
│   │   ├── EmployeeProfileHeader.tsx (new)
│   │   ├── AvatarUpload.tsx (new)
│   │   └── DocumentUpload.tsx (new)
│   └── dashboard/
│       ├── AnimatedStatCard.tsx (new)
│       ├── EmployeeStatusChart.tsx (new)
│       ├── DepartmentDistributionChart.tsx (new)
│       ├── RecentActivityWidget.tsx (new)
│       ├── UpcomingEventsWidget.tsx (new)
│       └── QuickActionsWidget.tsx (new)
├── hooks/
│   └── useEmployees.tsx (updated with file upload hooks)
├── pages/
│   ├── Dashboard.tsx (enhanced)
│   ├── Employees.tsx (updated)
│   └── EmployeeDetail.tsx (new)
└── types/
    └── employee.ts (new - shared types)
```

---

## Technical Notes

### Form Validation
Using Zod schemas for all forms:
```typescript
const employeeFormSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  job_title: z.string().optional(),
  department_id: z.string().uuid().optional(),
  location_id: z.string().uuid().optional(),
  hire_date: z.date(),
  status: z.enum(["active", "inactive", "on_leave", "terminated"]),
});
```

### File Upload Limits
- Avatar: Max 5MB, image types only (jpg, png, webp)
- Documents: Max 10MB, common document types (pdf, doc, docx, xls, xlsx)

### Animation Performance
- Using CSS animations for better performance
- Staggered animations for list items
- Respecting `prefers-reduced-motion` setting

---

## Implementation Order

1. Database migration for storage buckets and documents table
2. Fix React ref warnings in existing components
3. Add animation keyframes to Tailwind config
4. Create shared type definitions
5. Update useEmployees hook with file management
6. Create AvatarUpload and DocumentUpload components
7. Create CreateEmployeeModal
8. Create EmployeeDetail page with edit form
9. Update routes in App.tsx
10. Create dashboard widget components
11. Update Dashboard page with new widgets
12. Update Employees page with modal and navigation
