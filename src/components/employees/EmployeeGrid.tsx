import { MapPin } from 'lucide-react';
import { EmployeeCard } from './EmployeeCard';

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  job_title?: string;
  avatar_url?: string;
  hire_date: string;
  status: 'active' | 'inactive' | 'on_leave' | 'terminated';
  location?: {
    id: string;
    city: string;
  };
  manager?: {
    first_name: string;
    last_name: string;
  };
  linkedin_url?: string;
  twitter_url?: string;
  slack_username?: string;
}

interface EmployeeGridProps {
  employees: Employee[];
  groupBy: 'location' | 'department' | 'none';
  onQuickAction?: (employee: Employee) => void;
}

export function EmployeeGrid({ employees, groupBy, onQuickAction }: EmployeeGridProps) {
  if (groupBy === 'none') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {employees.map((employee) => (
          <EmployeeCard
            key={employee.id}
            employee={employee}
            onQuickAction={onQuickAction}
          />
        ))}
      </div>
    );
  }

  // Group employees by location
  const grouped = employees.reduce((acc, employee) => {
    const key = employee.location?.city || 'Unknown';
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(employee);
    return acc;
  }, {} as Record<string, Employee[]>);

  return (
    <div className="space-y-8">
      {Object.entries(grouped).map(([groupName, groupEmployees]) => (
        <div key={groupName}>
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">{groupName}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {groupEmployees.map((employee) => (
              <EmployeeCard
                key={employee.id}
                employee={employee}
                onQuickAction={onQuickAction}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
