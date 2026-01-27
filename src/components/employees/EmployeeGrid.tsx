import React from 'react';
import { MapPin } from 'lucide-react';
import { EmployeeCard } from './EmployeeCard';
import type { EmployeeWithRelations } from '@/types/employee';

interface EmployeeGridProps {
  employees: EmployeeWithRelations[];
  groupBy: 'location' | 'department' | 'none';
  onQuickAction?: (employee: EmployeeWithRelations) => void;
  onEmployeeClick?: (employee: EmployeeWithRelations) => void;
}

export const EmployeeGrid = React.forwardRef<HTMLDivElement, EmployeeGridProps>(
  ({ employees, groupBy, onQuickAction, onEmployeeClick }, ref) => {
    if (groupBy === 'none') {
      return (
        <div ref={ref} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {employees.map((employee) => (
            <EmployeeCard
              key={employee.id}
              employee={employee}
              onQuickAction={onQuickAction}
              onClick={onEmployeeClick}
            />
          ))}
        </div>
      );
    }

    // Group employees by location or department
    const grouped = employees.reduce((acc, employee) => {
      let key: string;
      if (groupBy === 'location') {
        key = employee.location?.city || 'Unknown';
      } else {
        key = employee.department?.name || 'Unknown';
      }
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(employee);
      return acc;
    }, {} as Record<string, EmployeeWithRelations[]>);

    return (
      <div ref={ref} className="space-y-8">
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
                  onClick={onEmployeeClick}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }
);

EmployeeGrid.displayName = 'EmployeeGrid';
