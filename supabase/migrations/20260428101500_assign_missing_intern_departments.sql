-- Assign missing intern departments from job titles.
-- This repairs existing employee rows where department_id is null.

INSERT INTO public.departments (name, description)
VALUES
  ('Accounting Department', 'Department managing financial records and accounting processes.'),
  ('HR Department', 'Human Resources department for personnel management and recruitment.'),
  ('IT Department', 'Information Technology department providing technical support and infrastructure management.'),
  ('Health and Safety Department', 'Department responsible for occupational health and safety compliance.')
ON CONFLICT (name) DO NOTHING;

UPDATE public.employees
SET department_id = (SELECT id FROM public.departments WHERE name = 'Accounting Department' LIMIT 1)
WHERE department_id IS NULL
  AND job_title ILIKE '%account%';

UPDATE public.employees
SET department_id = (SELECT id FROM public.departments WHERE name = 'HR Department' LIMIT 1)
WHERE department_id IS NULL
  AND (
    job_title ILIKE '%human resource%'
    OR job_title ILIKE '%hr%'
  );

UPDATE public.employees
SET department_id = (SELECT id FROM public.departments WHERE name = 'IT Department' LIMIT 1)
WHERE department_id IS NULL
  AND (
    job_title ILIKE '%it%'
    OR job_title ILIKE '%helpdesk%'
  );

UPDATE public.employees
SET department_id = (SELECT id FROM public.departments WHERE name = 'Health and Safety Department' LIMIT 1)
WHERE department_id IS NULL
  AND (
    job_title ILIKE '%health%'
    OR job_title ILIKE '%safety%'
  );
