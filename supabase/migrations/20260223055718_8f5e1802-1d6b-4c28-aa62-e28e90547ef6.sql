
-- Extend app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'payroll_officer';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'manager';

-- Company Settings
CREATE TABLE public.company_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT '',
  logo_url text,
  address text,
  city text,
  country text,
  tax_id text,
  phone text,
  email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Company settings viewable by authenticated" ON public.company_settings FOR SELECT USING (true);
CREATE POLICY "Company settings managed by admin" ON public.company_settings FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Leave Types
CREATE TABLE public.leave_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  days_per_year integer NOT NULL DEFAULT 0,
  carry_over boolean NOT NULL DEFAULT false,
  is_paid boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.leave_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leave types viewable by authenticated" ON public.leave_types FOR SELECT USING (true);
CREATE POLICY "Leave types managed by admin" ON public.leave_types FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Work Schedules
CREATE TABLE public.work_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  start_time time NOT NULL DEFAULT '08:00',
  end_time time NOT NULL DEFAULT '17:00',
  days_of_week text[] NOT NULL DEFAULT '{Monday,Tuesday,Wednesday,Thursday,Friday}',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.work_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Work schedules viewable by authenticated" ON public.work_schedules FOR SELECT USING (true);
CREATE POLICY "Work schedules managed by admin" ON public.work_schedules FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Pay Grades
CREATE TABLE public.pay_grades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  min_salary numeric NOT NULL DEFAULT 0,
  max_salary numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'PHP',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.pay_grades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pay grades viewable by authenticated" ON public.pay_grades FOR SELECT USING (true);
CREATE POLICY "Pay grades managed by admin" ON public.pay_grades FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Salary Structures
CREATE TABLE public.salary_structures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
  pay_grade_id uuid REFERENCES public.pay_grades(id) ON DELETE SET NULL,
  base_salary numeric NOT NULL DEFAULT 0,
  allowances jsonb DEFAULT '{}',
  deductions jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.salary_structures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Salary structures viewable by admin/hr" ON public.salary_structures FOR SELECT USING (is_admin_or_hr(auth.uid()));
CREATE POLICY "Salary structures managed by admin" ON public.salary_structures FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Approval Workflows
CREATE TABLE public.approval_workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  module text NOT NULL,
  steps jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.approval_workflows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Workflows viewable by authenticated" ON public.approval_workflows FOR SELECT USING (true);
CREATE POLICY "Workflows managed by admin" ON public.approval_workflows FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Audit Logs
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  action text NOT NULL,
  entity_type text,
  entity_id text,
  details jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Audit logs viewable by admin" ON public.audit_logs FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Audit logs managed by admin" ON public.audit_logs FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for company_settings updated_at
CREATE TRIGGER update_company_settings_updated_at
  BEFORE UPDATE ON public.company_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
