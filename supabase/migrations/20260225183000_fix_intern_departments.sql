-- Migration: Auto-assign departments to interns based on job titles
-- This ensures Rome and other interns have their Department correctly displayed.

-- 1. Ensure the departments exist (idempotent)
INSERT INTO public.departments (name, description)
VALUES 
    ('Safety Department', 'Department responsible for occupational health and safety compliance.'),
    ('Accounting Department', 'Department managing financial records and accounting processes.'),
    ('HR Department', 'Human Resources department for personnel management and recruitment.'),
    ('IT Department', 'Information Technology department providing technical support and infrastructure management.')
ON CONFLICT (name) DO NOTHING;

-- 2. Update existing employees who are missing a department_id
-- We match by Job Title patterns

-- Accounting Department
UPDATE public.employees
SET department_id = (SELECT id FROM public.departments WHERE name = 'Accounting Department' LIMIT 1)
WHERE department_id IS NULL 
AND (job_title ILIKE '%Accounting Assistant Intern%' OR job_title ILIKE '%Accounting%Intern%');

-- Safety Department
UPDATE public.employees
SET department_id = (SELECT id FROM public.departments WHERE name = 'Safety Department' LIMIT 1)
WHERE department_id IS NULL 
AND (job_title ILIKE '%Safety Officer Assistant Intern%' OR job_title ILIKE '%Safety%Intern%');

-- HR Department
UPDATE public.employees
SET department_id = (SELECT id FROM public.departments WHERE name = 'HR Department' LIMIT 1)
WHERE department_id IS NULL 
AND (job_title ILIKE '%Human Resource Assistant Intern%' OR job_title ILIKE '%HR%Intern%');

-- IT Department
UPDATE public.employees
SET department_id = (SELECT id FROM public.departments WHERE name = 'IT Department' LIMIT 1)
WHERE department_id IS NULL 
AND (job_title ILIKE '%IT Helpdesk Intern%' OR job_title ILIKE '%IT%Intern%');
