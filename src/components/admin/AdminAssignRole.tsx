import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Shield } from 'lucide-react';

type AppRole = 'admin' | 'hr_manager' | 'principal' | 'employee';

export function AdminAssignRole() {
  const { isAdmin, user } = useAuth();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<AppRole>('employee');
  const [isLoading, setIsLoading] = useState(false);

  if (!isAdmin) return null;

  const handleAssignRole = async () => {
    if (!email.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    setIsLoading(true);

    try {
      // Check if it's the current user's email
      if (user && user.email === email) {
        // Update own role
        await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', user.id);

        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: user.id, role });

        if (error) throw error;

        toast.success(`Your role has been updated to ${role}!`);
        setOpen(false);
        setEmail('');
        setRole('employee');
        
        // Reload the page to refresh the role
        setTimeout(() => window.location.reload(), 500);
      } else {
        toast.error('To assign roles to other users, please use the admin panel. Currently, you can only update your own role from the client.');
      }
    } catch (error) {
      console.error('Error assigning role:', error);
      toast.error('Failed to assign role');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Shield className="h-4 w-4" />
          Assign Role
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card">
        <DialogHeader>
          <DialogTitle>Assign User Role</DialogTitle>
          <DialogDescription>
            Assign a role to a user. Enter your email to update your own role.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email">User Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as AppRole)}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="hr_manager">HR Manager</SelectItem>
                <SelectItem value="principal">Principal</SelectItem>
                <SelectItem value="employee">Employee</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleAssignRole} disabled={isLoading}>
            {isLoading ? 'Assigning...' : 'Assign Role'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
