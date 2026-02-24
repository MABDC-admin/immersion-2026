import { useState } from 'react';
import { useAllProfiles, useUpdateUserRole } from '@/hooks/useAdmin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, KeyRound, UserX, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'hr_manager', label: 'HR Manager' },
  { value: 'manager', label: 'Manager' },
  { value: 'payroll_officer', label: 'Payroll Officer' },
  { value: 'employee', label: 'Employee' },
];

const roleColors: Record<string, string> = {
  admin: 'bg-destructive/10 text-destructive border-destructive/20',
  hr_manager: 'bg-primary/10 text-primary border-primary/20',
  manager: 'bg-accent text-accent-foreground border-accent',
  payroll_officer: 'bg-secondary text-secondary-foreground border-secondary',
  employee: 'bg-muted text-muted-foreground border-muted',
};

export function UserManagementTab() {
  const { data: profiles = [], isLoading } = useAllProfiles();
  const updateRole = useUpdateUserRole();
  const [resettingId, setResettingId] = useState<string | null>(null);

  const handleRoleChange = (userId: string, role: string) => {
    updateRole.mutate({ userId, role });
  };

  const handlePasswordReset = async (profile: any) => {
    const email = profile.email;
    if (!email) {
      toast.error('No email found for this user');
      return;
    }
    setResettingId(profile.user_id);
    try {
      const { data, error } = await supabase.functions.invoke('reset-user-password', {
        body: {
          userId: profile.user_id,
          email,
          firstName: profile.first_name || '',
          lastName: profile.last_name || '',
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(`New password sent to ${email}`);
    } catch (e: any) {
      toast.error(e.message || 'Failed to reset password');
    } finally {
      setResettingId(null);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>User & Role Management</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Current Role</TableHead>
              <TableHead>Change Role</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {profiles.map((profile) => (
              <TableRow key={profile.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">{(profile.first_name?.[0] || 'U')}{(profile.last_name?.[0] || '')}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-foreground">{profile.first_name || ''} {profile.last_name || ''}</p>
                      <p className="text-xs text-muted-foreground">{profile.email || profile.user_id.slice(0, 8) + '...'}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={roleColors[profile.role || 'employee']}>
                    {ROLES.find(r => r.value === profile.role)?.label || 'Employee'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Select value={profile.role || 'employee'} onValueChange={(val) => handleRoleChange(profile.user_id, val)}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map(r => (
                        <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Send password reset"
                    disabled={resettingId === profile.user_id}
                    onClick={() => handlePasswordReset(profile)}
                  >
                    <KeyRound className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
