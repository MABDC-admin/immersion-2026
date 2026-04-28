import type { EmployeeWithRelations } from '@/types/employee';

export function getEmployeeDepartmentName(employee: Pick<EmployeeWithRelations, 'department' | 'job_title'>) {
  if (employee.department?.name) return employee.department.name;

  const title = employee.job_title?.toLowerCase() || '';
  if (title.includes('account')) return 'Accounting Department';
  if (title.includes('human resource') || title.includes('hr')) return 'HR Department';
  if (title.includes('it') || title.includes('helpdesk')) return 'IT Department';
  if (title.includes('health') || title.includes('safety')) return 'Health and Safety Department';

  return '🇦🇪';
}
