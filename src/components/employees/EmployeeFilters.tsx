import { Search, LayoutGrid, List } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface EmployeeFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  totalCount: number;
}

export function EmployeeFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  viewMode,
  onViewModeChange,
  totalCount,
}: EmployeeFiltersProps) {
  return (
    <div className="mb-6 flex flex-col items-start justify-between gap-4 rounded-3xl border border-violet-200 bg-gradient-to-r from-violet-50/80 via-white to-amber-50/80 p-4 shadow-sm sm:flex-row sm:items-center">
      <div className="flex items-center gap-2 text-muted-foreground">
        <span className="rounded-2xl border border-orange-200 bg-orange-50 px-4 py-2 text-lg font-semibold text-orange-900">
          {totalCount} Interns
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-700" />
          <Input
            placeholder="Search by name"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-48 border-cyan-200 bg-cyan-50/50 pl-10 focus-visible:ring-cyan-500"
          />
        </div>

        <Select value={statusFilter} onValueChange={onStatusChange}>
          <SelectTrigger className="w-36 border-emerald-200 bg-emerald-50/60 focus:ring-emerald-500">
            <SelectValue placeholder="All Interns" />
          </SelectTrigger>
          <SelectContent className="bg-popover">
            <SelectItem value="all">All Interns</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="on_leave">On Leave</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex overflow-hidden rounded-md border border-violet-200 bg-white">
          <Button
            variant="ghost"
            size="icon"
            className={`h-9 w-9 rounded-none ${viewMode === 'list' ? 'bg-violet-100 text-violet-800 hover:bg-violet-100' : 'hover:bg-violet-50'}`}
            onClick={() => onViewModeChange('list')}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={`h-9 w-9 rounded-none ${viewMode === 'grid' ? 'bg-violet-100 text-violet-800 hover:bg-violet-100' : 'hover:bg-violet-50'}`}
            onClick={() => onViewModeChange('grid')}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
