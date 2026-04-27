import { useImpersonation } from '@/hooks/useImpersonation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, X } from 'lucide-react';

const roleColors: Record<string, string> = {
  admin: 'bg-red-500/20 text-red-200 border-red-400/30',
  hr_manager: 'bg-blue-500/20 text-blue-200 border-blue-400/30',
  principal: 'bg-sky-500/20 text-sky-200 border-sky-400/30',
  supervisor: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30',
  manager: 'bg-amber-500/20 text-amber-200 border-amber-400/30',
  payroll_officer: 'bg-purple-500/20 text-purple-200 border-purple-400/30',
  employee: 'bg-gray-500/20 text-gray-200 border-gray-400/30',
};

const roleLabels: Record<string, string> = {
  admin: 'Admin',
  hr_manager: 'HR Manager',
  principal: 'Principal',
  supervisor: 'Supervisor',
  manager: 'Manager',
  payroll_officer: 'Payroll Officer',
  employee: 'Employee',
};

export function ImpersonationBar() {
  const { impersonating, isImpersonating, stopImpersonation } = useImpersonation();

  if (!isImpersonating || !impersonating) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 text-white shadow-lg">
      <div className="flex items-center justify-between px-4 py-2.5 max-w-screen-2xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1">
            <Eye className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Impersonating</span>
          </div>
          <span className="text-sm font-semibold">
            {impersonating.firstName} {impersonating.lastName}
          </span>
          <span className="text-xs text-white/70">({impersonating.email})</span>
          <Badge variant="outline" className={roleColors[impersonating.role] || roleColors.employee}>
            {roleLabels[impersonating.role] || impersonating.role}
          </Badge>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="text-white hover:bg-white/20 gap-2 font-bold"
          onClick={stopImpersonation}
        >
          <X className="h-4 w-4" />
          Stop Impersonation
        </Button>
      </div>
    </div>
  );
}
