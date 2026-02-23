-- Employee Profile Enhancements

-- 1. LEAVE BALANCES
CREATE TABLE public.leave_balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
    leave_type TEXT NOT NULL,
    total_days DECIMAL(5,2) NOT NULL DEFAULT 0,
    used_days DECIMAL(5,2) NOT NULL DEFAULT 0,
    remaining_days DECIMAL(5,2) GENERATED ALWAYS AS (total_days - used_days) STORED,
    year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(employee_id, leave_type, year)
);

-- 2. ANNOUNCEMENTS
CREATE TABLE public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'general', -- 'general', 'policy', 'event', 'holiday'
    author_id UUID REFERENCES public.employees(id),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. ENABLE RLS
ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- 4. RLS POLICIES
-- Leave Balances: Employees can view their own, HR/Admin manage all
CREATE POLICY "Employees can view their own leave balances" ON public.leave_balances
FOR SELECT TO authenticated
USING (employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid()));

CREATE POLICY "HR/Admin can manage leave balances" ON public.leave_balances
FOR ALL TO authenticated
USING (public.is_admin_or_hr(auth.uid()));

-- Announcements: Everyone view active, HR/Admin manage all
CREATE POLICY "Announcements are viewable by authenticated users" ON public.announcements
FOR SELECT TO authenticated
USING (is_active = true);

CREATE POLICY "HR/Admin can manage announcements" ON public.announcements
FOR ALL TO authenticated
USING (public.is_admin_or_hr(auth.uid()));

-- 5. SEED INITIAL DATA (Optional - can be done via UI/Admin)
-- We'll add some default leave balances for existing employees if needed, 
-- but usually this is handled by an onboarding function.
