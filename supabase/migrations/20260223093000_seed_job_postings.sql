-- Seed new intern positions into job_postings and ensure departments exist

-- 1. Ensure Departments Exist and have Unique Constraint
ALTER TABLE public.departments ADD CONSTRAINT departments_name_key UNIQUE (name);

INSERT INTO public.departments (name, description)
VALUES 
    ('Safety Department', 'Department responsible for occupational health and safety compliance.'),
    ('Accounting Department', 'Department managing financial records and accounting processes.'),
    ('HR Department', 'Human Resources department for personnel management and recruitment.'),
    ('IT Department', 'Information Technology department providing technical support and infrastructure management.')
ON CONFLICT (name) DO NOTHING;

-- 2. Insert Job Postings (Internships)
-- Note: We use subqueries to get the department_id based on the names inserted above.
INSERT INTO public.job_postings (title, description, department_id, status)
VALUES 
    (
        'Safety Officer Assistant Intern', 
        'Assisting the Safety Officer in monitoring safety protocols and maintaining compliance records.',
        (SELECT id FROM public.departments WHERE name = 'Safety Department' LIMIT 1),
        'open'
    ),
    (
        'Accounting Assistant Intern',
        'Supporting the accounting team with data entry, reconciliation, and financial reporting tasks.',
        (SELECT id FROM public.departments WHERE name = 'Accounting Department' LIMIT 1),
        'open'
    ),
    (
        'Human Resource Assistant Intern',
        'Assisting the HR team with recruitment, onboarding, and employee records management.',
        (SELECT id FROM public.departments WHERE name = 'HR Department' LIMIT 1),
        'open'
    ),
    (
        'IT Helpdesk Intern',
        'Providing technical support to staff, troubleshooting hardware/software issues, and maintaining IT assets.',
        (SELECT id FROM public.departments WHERE name = 'IT Department' LIMIT 1),
        'open'
    );
