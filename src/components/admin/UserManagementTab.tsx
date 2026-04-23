import { useState } from 'react';
import { useAllProfiles, useUpdateUserRole, useUpdateProfile, useDeleteUser } from '@/hooks/useAdmin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, KeyRound, Pencil, Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { SupervisorAccessCard } from '@/components/admin/SupervisorAccessCard';

const ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'hr_manager', label: 'HR Manager' },
  { value: 'principal', label: 'Principal' },
  { value: 'supervisor', label: 'Supervisor' },
  { value: 'manager', label: 'Manager' },
  { value: 'payroll_officer', label: 'Payroll Officer' },
  { value: 'employee', label: 'Employee' },
];

const roleColors: Record<string, string> = {
  admin: 'bg-destructive/10 text-destructive border-destructive/20',
  hr_manager: 'bg-primary/10 text-primary border-primary/20',
  principal: 'bg-sky-500/10 text-sky-700 border-sky-500/20',
  supervisor: 'bg-hrms-success/10 text-hrms-success border-hrms-success/20',
  manager: 'bg-accent text-accent-foreground border-accent',
  payroll_officer: 'bg-secondary text-secondary-foreground border-secondary',
  employee: 'bg-muted text-muted-foreground border-muted',
};

export function UserManagementTab() {
  const { data: profiles = [], isLoading } = useAllProfiles();
  const updateRole = useUpdateUserRole();
  const updateProfile = useUpdateProfile();
  const deleteUser = useDeleteUser();
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [editUser, setEditUser] = useState<any>(null);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);

  const handleRoleChange = (userId: string, role: string) => {
    updateRole.mutate({ userId, role });
  };

  const openEdit = (profile: any) => {
    setEditUser(profile);
    setEditFirstName(profile.first_name || '');
    setEditLastName(profile.last_name || '');
  };

  const handleSaveEdit = () => {
    if (!editUser) return;
    updateProfile.mutate({ userId: editUser.user_id, first_name: editFirstName, last_name: editLastName });
    setEditUser(null);
  };

  const handleDelete = () => {
    if (!deleteUserId) return;
    deleteUser.mutate(deleteUserId);
    setDeleteUserId(null);
  };

  const filteredProfiles = profiles.filter(p => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (p.first_name || '').toLowerCase().includes(q) || (p.last_name || '').toLowerCase().includes(q) || (p.email || '').toLowerCase().includes(q);
  });

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
    <>
    <div className="space-y-4">
    <SupervisorAccessCard />

    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <CardTitle>User & Role Management</CardTitle>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search users..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-8" />
          </div>
        </div>
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
            {filteredProfiles.map((profile) => (
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
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" title="Edit user" onClick={() => openEdit(profile)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" title="Send password reset" disabled={resettingId === profile.user_id} onClick={() => handlePasswordReset(profile)}>
                      <KeyRound className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" title="Delete user" className="text-destructive hover:text-destructive" onClick={() => setDeleteUserId(profile.user_id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
    </div>

    <Dialog open={!!editUser} onOpenChange={(open) => !open && setEditUser(null)}>
      <DialogContent>
        <DialogHeader><DialogTitle>Edit User</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>First Name</Label>
            <Input value={editFirstName} onChange={(e) => setEditFirstName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Last Name</Label>
            <Input value={editLastName} onChange={(e) => setEditLastName(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setEditUser(null)}>Cancel</Button>
          <Button onClick={handleSaveEdit} disabled={updateProfile.isPending}>
            {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <AlertDialog open={!!deleteUserId} onOpenChange={(open) => !open && setDeleteUserId(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete User</AlertDialogTitle>
          <AlertDialogDescription>This will remove the user's role and profile. Their employee record will be unlinked but preserved. This action cannot be undone.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
