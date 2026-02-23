-- LEAVE MANAGEMENT
CREATE TYPE public.leave_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled');
CREATE TABLE public.leave_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
    leave_type TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status leave_status NOT NULL DEFAULT 'pending',
    reason TEXT,
    approved_by UUID REFERENCES public.employees(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TIME & ATTENDANCE
CREATE TABLE public.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    clock_in TIMESTAMPTZ,
    clock_out TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'present',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RECRUITMENT
CREATE TABLE public.job_postings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    department_id UUID REFERENCES public.departments(id),
    location_id UUID REFERENCES public.locations(id),
    status TEXT NOT NULL DEFAULT 'open',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.candidates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES public.job_postings(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    resume_url TEXT,
    status TEXT NOT NULL DEFAULT 'applied',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- PERFORMANCE
CREATE TABLE public.performance_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
    reviewer_id UUID REFERENCES public.employees(id),
    review_date DATE NOT NULL,
    rating INTEGER,
    comments TEXT,
    status TEXT NOT NULL DEFAULT 'scheduled',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ONBOARDING
CREATE TABLE public.onboarding_checklists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'in_progress',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.onboarding_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    checklist_id UUID REFERENCES public.onboarding_checklists(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    due_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TRAINING
CREATE TABLE public.courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    duration TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.course_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
    status TEXT NOT NULL DEFAULT 'enrolled',
    progress INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS and add basic policies (Admin/HR can manage all, Employees can view relevant)
DO $$
DECLARE
    tbl_name TEXT;
BEGIN
    FOR tbl_name IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN (
            'leave_requests', 'attendance', 'job_postings', 'candidates', 
            'performance_reviews', 'onboarding_checklists', 'onboarding_items', 
            'courses', 'course_enrollments'
        )
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl_name);
        EXECUTE format('CREATE POLICY "HR/Admin can manage %I" ON public.%I FOR ALL TO authenticated USING (public.is_admin_or_hr(auth.uid()))', tbl_name, tbl_name);
        -- Specific policies for employees to view their own data
        IF tbl_name IN ('leave_requests', 'attendance', 'performance_reviews', 'onboarding_checklists', 'course_enrollments') THEN
            EXECUTE format('CREATE POLICY "Employees can view their own %I" ON public.%I FOR SELECT TO authenticated USING (employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid()))', tbl_name, tbl_name);
        END IF;
    END LOOP;
END $$;

-- Policy for onboarding items (view via checklist)
CREATE POLICY "Employees can view their own onboarding items" ON public.onboarding_items
FOR SELECT TO authenticated
USING (checklist_id IN (
    SELECT id FROM public.onboarding_checklists 
    WHERE employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
));
