import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { EmployeeFilters } from '@/components/employees/EmployeeFilters';
import { EmployeeGrid } from '@/components/employees/EmployeeGrid';
import { EmployeeTable } from '@/components/employees/EmployeeTable';
import { CreateEmployeeModal } from '@/components/employees/CreateEmployeeModal';
import { EditEmployeeModal } from '@/components/employees/EditEmployeeModal';
import { useEmployees, useDeleteEmployee, useCurrentEmployee } from '@/hooks/useEmployees';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { EmployeeWithRelations } from '@/types/employee';

const ITEMS_PER_PAGE = 12;

export default function Employees() {
  const navigate = useNavigate();
  const { data: employees = [], isLoading, error } = useEmployees();
  const { user, isAdmin, userRole } = useAuth();
  const { data: viewerEmployee } = useCurrentEmployee(user?.id || '');
  const isSupervisor = userRole === 'supervisor';

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [groupBy, setGroupBy] = useState<'location' | 'department' | 'none'>('location');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeWithRelations | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const deleteEmployee = useDeleteEmployee();

  // Filter employees
  const filteredEmployees = useMemo(() => {
    let result = employees;

    // For supervisors, only show assigned interns (manager_id = viewerEmployee.id)
    if (isSupervisor && viewerEmployee) {
      result = result.filter(emp => emp.manager_id === viewerEmployee.id);
    }

    return result.filter((employee) => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        employee.first_name.toLowerCase().includes(searchLower) ||
        employee.last_name.toLowerCase().includes(searchLower) ||
        employee.email.toLowerCase().includes(searchLower);

      // Status filter
      const matchesStatus =
        statusFilter === 'all' || employee.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [employees, searchQuery, statusFilter, isSupervisor, viewerEmployee]);

  // Pagination
  const totalPages = Math.ceil(filteredEmployees.length / ITEMS_PER_PAGE);
  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleAddNew = () => {
    setIsCreateModalOpen(true);
  };

  const handleEmployeeClick = (employee: EmployeeWithRelations) => {
    navigate(`/employees/${employee.id}`);
  };

  if (error) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-destructive">Error loading employees. Please try again.</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout onAddNew={handleAddNew}>
      <div className="space-y-6">
        <EmployeeFilters
          searchQuery={searchQuery}
          onSearchChange={(value) => {
            setSearchQuery(value);
            setCurrentPage(1);
          }}
          statusFilter={statusFilter}
          onStatusChange={(value) => {
            setStatusFilter(value);
            setCurrentPage(1);
          }}
          groupBy={groupBy}
          onGroupByChange={(value) => setGroupBy(value as 'location' | 'department' | 'none')}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          totalCount={filteredEmployees.length}
        />

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="h-80 bg-muted animate-pulse rounded-lg"
              />
            ))}
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-96 text-center">
            <p className="text-muted-foreground mb-2">No employees found</p>
            <p className="text-sm text-muted-foreground">
              {searchQuery
                ? 'Try adjusting your search or filters'
                : 'Add your first employee to get started'}
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <EmployeeGrid
            employees={paginatedEmployees}
            groupBy={groupBy}
            onEmployeeClick={handleEmployeeClick}
          />
        ) : (
          <EmployeeTable
            employees={paginatedEmployees}
            onEdit={(emp) => {
              setEditingEmployee(emp);
              setIsEditModalOpen(true);
            }}
            onDelete={async (id) => {
              await deleteEmployee.mutateAsync(id);
            }}
            onView={(id) => navigate(`/employees/${id}`)}
          />
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {[...Array(Math.min(5, totalPages))].map((_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}

            {totalPages > 5 && currentPage < totalPages - 2 && (
              <>
                <span className="px-2 text-muted-foreground">...</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage(totalPages)}
                >
                  {totalPages}
                </Button>
              </>
            )}

            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <CreateEmployeeModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
      />

      <EditEmployeeModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        employee={editingEmployee}
      />
    </MainLayout>
  );
}
