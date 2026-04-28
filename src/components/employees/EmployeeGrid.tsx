import React from 'react';
import { EmployeeCard } from './EmployeeCard';
import type { EmployeeWithRelations } from '@/types/employee';

interface EmployeeGridProps {
  employees: EmployeeWithRelations[];
  onQuickAction?: (employee: EmployeeWithRelations) => void;
  onEmployeeClick?: (employee: EmployeeWithRelations) => void;
}

export const EmployeeGrid = React.forwardRef<HTMLDivElement, EmployeeGridProps>(
  ({ employees, onQuickAction, onEmployeeClick }, ref) => {
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
);

EmployeeGrid.displayName = 'EmployeeGrid';
