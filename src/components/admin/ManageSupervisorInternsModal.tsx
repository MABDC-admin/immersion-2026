import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Search, Users, Shield } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface ManageSupervisorInternsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supervisor: any | null;
}

export function ManageSupervisorInternsModal({
  open,
  onOpenChange,
  supervisor,
}: ManageSupervisorInternsModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInternIds, setSelectedInternIds] = useState<Set<string>>(new Set());

  // Fetch all employees that could be interns
  const { data: employees = [], isLoading } = useQuery({
    queryKey: ['manage-interns-employees'],
    queryFn: async () => {
      // In a real scenario, you might filter by 'job_title' ilike '%intern%' or a specific intern role.
      // We will fetch everyone and let the admin choose, but we will highlight current assignments.
      const { data, error } = await supabase
        .from('employees')
        .select('id, first_name, last_name, email, job_title, manager_id, department:departments(name)')
        .order('first_name');
      if (error) throw error;
      return data || [];
    },
    enabled: open,
  });

  // Fetch user_roles to filter out other supervisors/admins from the list
  const { data: roles = [] } = useQuery({
    queryKey: ['manage-interns-roles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('user_roles').select('user_id, role');
      if (error) throw error;
      return data || [];
    },
    enabled: open,
  });

  // Pre-fill selected interns when modal opens
  useEffect(() => {
    if (open && supervisor && employees.length > 0) {
      const currentlyAssigned = employees
        .filter((emp) => emp.manager_id === supervisor.employeeId)
        .map((emp) => emp.id);
      setSelectedInternIds(new Set(currentlyAssigned));
    }
  }, [open, supervisor, employees]);

  const internCandidates = useMemo(() => {
    // Only show employees that are NOT supervisors/admins/principals (keep it safe)
    // Actually, simple heuristic: just show everyone, but admins know who interns are.
    // Let's filter out people who are known supervisors.
    
    // For safety, let's just let them select anyone, but default to sorting unassigned or currently assigned first.
    return employees.filter((emp) => {
      if (emp.id === supervisor?.employeeId) return false; // cannot assign to self
      
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          emp.first_name.toLowerCase().includes(q) ||
          emp.last_name.toLowerCase().includes(q) ||
          emp.email.toLowerCase().includes(q)
        );
      }
      return true;
    }).sort((a, b) => {
      // Sort currently assigned first
      const aAssigned = selectedInternIds.has(a.id) ? -1 : 1;
      const bAssigned = selectedInternIds.has(b.id) ? -1 : 1;
      if (aAssigned !== bAssigned) return aAssigned - bAssigned;
      
      // Then sort unassigned
      const aHasManager = a.manager_id ? 1 : -1;
      const bHasManager = b.manager_id ? 1 : -1;
      if (aHasManager !== bHasManager) return aHasManager - bHasManager;
      
      return a.first_name.localeCompare(b.first_name);
    });
  }, [employees, searchQuery, supervisor, selectedInternIds]);

  const assignMutation = useMutation({
    mutationFn: async () => {
      if (!supervisor?.employeeId) throw new Error("Supervisor has no employee ID");

      // 1. Get current assigned
      const currentlyAssigned = employees
        .filter((emp) => emp.manager_id === supervisor.employeeId)
        .map((emp) => emp.id);

      // 2. Find who to add and who to remove
      const toAdd = Array.from(selectedInternIds).filter(id => !currentlyAssigned.includes(id));
      const toRemove = currentlyAssigned.filter(id => !selectedInternIds.has(id));

      const promises = [];

      // Add new assignments
      if (toAdd.length > 0) {
        promises.push(
          supabase
            .from('employees')
            .update({ manager_id: supervisor.employeeId })
            .in('id', toAdd)
        );
      }

      // Remove unassigned (set manager_id to null)
      if (toRemove.length > 0) {
        promises.push(
          supabase
            .from('employees')
            .update({ manager_id: null })
            .in('id', toRemove)
        );
      }

      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['impersonation-portal-users'] });
      queryClient.invalidateQueries({ queryKey: ['manage-interns-employees'] });
      toast({ title: 'Intern assignments updated successfully' });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Error updating assignments',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleToggle = (empId: string) => {
    setSelectedInternIds((prev) => {
      const next = new Set(prev);
      if (next.has(empId)) next.delete(empId);
      else next.add(empId);
      return next;
    });
  };

  const handleSelectAll = () => {
    const unassignedOrMine = internCandidates
      .filter(emp => !emp.manager_id || emp.manager_id === supervisor?.employeeId)
      .map(emp => emp.id);
    
    // Add them to current selection
    setSelectedInternIds(prev => {
      const next = new Set(prev);
      unassignedOrMine.forEach(id => next.add(id));
      return next;
    });
  };

  if (!supervisor) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Manage Interns for {supervisor.firstName} {supervisor.lastName}
          </DialogTitle>
          <DialogDescription>
            Select which interns should report directly to this supervisor.
          </DialogDescription>
        </DialogHeader>

        <div className="relative flex-1 min-h-0 flex flex-col gap-4 mt-2">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex items-center justify-between px-1">
            <p className="text-sm text-muted-foreground">
              Selected: <span className="font-bold text-foreground">{selectedInternIds.size}</span> interns
            </p>
            <Button variant="link" size="sm" className="h-auto p-0" onClick={handleSelectAll}>
              Select Unassigned
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto border rounded-md">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : internCandidates.length === 0 ? (
              <div className="text-center py-12 text-sm text-muted-foreground">
                No interns found matching your search.
              </div>
            ) : (
              <div className="divide-y">
                {internCandidates.map((emp) => {
                  const isSelected = selectedInternIds.has(emp.id);
                  const isAssignedToOther = emp.manager_id && emp.manager_id !== supervisor.employeeId;

                  return (
                    <div
                      key={emp.id}
                      className={cn(
                        "flex items-center gap-3 p-3 transition-colors cursor-pointer hover:bg-muted/50",
                        isSelected && "bg-primary/5"
                      )}
                      onClick={() => handleToggle(emp.id)}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleToggle(emp.id)}
                        className="data-[state=checked]:bg-primary"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                          {emp.first_name?.[0]}{emp.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium leading-none mb-1">
                          {emp.first_name} {emp.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {emp.job_title || 'Employee'} • {emp.department?.name || 'No Dept'}
                        </p>
                      </div>
                      
                      {isAssignedToOther && !isSelected && (
                        <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-200 bg-amber-50">
                          Assigned to someone else
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="mt-4 border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => assignMutation.mutate()}
            disabled={assignMutation.isPending}
          >
            {assignMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Assignments
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
