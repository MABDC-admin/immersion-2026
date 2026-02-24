
-- Create intern_evaluations table for DEPED Senior High School Work Immersion evaluations
CREATE TABLE public.intern_evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  intern_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  evaluator_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  evaluation_date date NOT NULL DEFAULT CURRENT_DATE,
  evaluation_period_start date NOT NULL,
  evaluation_period_end date NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  -- DEPED Criteria Scores (1-5 scale)
  attendance_punctuality integer DEFAULT NULL,
  work_quality integer DEFAULT NULL,
  work_quantity integer DEFAULT NULL,
  initiative_creativity integer DEFAULT NULL,
  teamwork_cooperation integer DEFAULT NULL,
  communication_skills integer DEFAULT NULL,
  professionalism integer DEFAULT NULL,
  adaptability integer DEFAULT NULL,
  overall_rating numeric DEFAULT NULL,
  comments text DEFAULT NULL,
  recommendations text DEFAULT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.intern_evaluations ENABLE ROW LEVEL SECURITY;

-- Supervisors can manage evaluations they created
CREATE POLICY "Evaluators can manage their evaluations"
ON public.intern_evaluations
FOR ALL
TO authenticated
USING (
  evaluator_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
)
WITH CHECK (
  evaluator_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
);

-- Admin/HR can manage all evaluations
CREATE POLICY "Admin/HR can manage all evaluations"
ON public.intern_evaluations
FOR ALL
TO authenticated
USING (is_admin_or_hr(auth.uid()))
WITH CHECK (is_admin_or_hr(auth.uid()));

-- Interns can view their own evaluations (read-only)
CREATE POLICY "Interns can view their own evaluations"
ON public.intern_evaluations
FOR SELECT
TO authenticated
USING (
  intern_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
);

-- Trigger for updated_at
CREATE TRIGGER update_intern_evaluations_updated_at
BEFORE UPDATE ON public.intern_evaluations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.intern_evaluations;
