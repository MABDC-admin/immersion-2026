import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { toast } from 'sonner';
import { Shield, Crown } from 'lucide-react';

type AppRole = 'admin' | 'hr_manager' | 'principal' | 'employee';

export function MakeAdminCard() {
  const { user, userRole } = useAuth();
  const [selectedRole, setSelectedRole] = useState<AppRole>('admin');
  const [isLoading, setIsLoading] = useState(false);

  // Only show this card if the user is not already an admin
  if (userRole === 'admin') return null;

  const handleMakeAdmin = async () => {
    if (!user) {
      toast.error('You must be logged in');
      return;
    }

    setIsLoading(true);

    try {
      // Delete existing role first, then insert new one
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', user.id);

      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: user.id, role: selectedRole });

      if (error) throw error;

      toast.success(`Your role has been updated to ${selectedRole}!`);
      
      // Reload to refresh the auth context
      setTimeout(() => window.location.reload(), 500);
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Failed to update role');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Upgrade Your Role</CardTitle>
        </div>
        <CardDescription>
          As per the plan, you can upgrade your role to Admin to access all features.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3">
          <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as AppRole)}>
            <SelectTrigger className="w-40 bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="hr_manager">HR Manager</SelectItem>
              <SelectItem value="principal">Principal</SelectItem>
              <SelectItem value="employee">Employee</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleMakeAdmin} disabled={isLoading} className="gap-2">
            <Shield className="h-4 w-4" />
            {isLoading ? 'Updating...' : 'Update Role'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
