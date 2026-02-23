

# Add Safety Department Job Posting & Supervisors

## 1. Create Safety Department
A new "Safety Department" needs to be added (separate from the existing "Health and Safety Department").

## 2. Create Job Posting
Insert a new "Safety Officer Assistant Intern" job posting linked to the new Safety Department, with status `open`.

## 3. Add 5 Supervisors as Employees
Insert the following employees with job title "Supervisor" and linked to their respective departments:

| Name | Department |
|------|-----------|
| Dennis P. Sotto | IT Department |
| Sheila Mae P. Dadula | Accounting Department |
| Glorie Ann I. Espinosa | Health and Safety Department |
| Eulogio E. Dadula | Safety Department (new) |
| Myranel D. Plaza | HR Department |

All will be set as `active` employees with today's hire date. These supervisors will be responsible for onboarding new employees in their respective departments.

## Technical Details

### Database Operations
- **INSERT** into `departments`: Create "Safety Department"
- **INSERT** into `job_postings`: "Safety Officer Assistant Intern" linked to the new Safety Department
- **INSERT** into `employees`: 5 supervisor records with department assignments

### Department ID Mapping
- IT Department: `69ebd61e-be75-4a75-bb1b-1971e863e455`
- Accounting Department: `9d8854e0-015b-4624-9a5a-45326f0ee17f`
- Health and Safety Department: `f37766ba-2a1b-44db-aeb8-40f4fb9a09df`
- HR Department: `9142d381-9ffa-46e2-b681-b9339d3f219b`
- Safety Department: (will be created)

No code file changes needed -- this is purely data insertion.

