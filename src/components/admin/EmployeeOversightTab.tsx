import { useState } from 'react';
import { useEmployees } from '@/hooks/useEmployees';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Download, Pencil, Trash2, Search, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-800 border-green-200',
  inactive: 'bg-muted text-muted-foreground border-muted',
  on_leave: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  terminated: 'bg-destructive/10 text-destructive border-destructive/20',
};

export function EmployeeOversightTab() {
  const { data: employees = [], isLoading } = useEmployees();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editEmployee, setEditEmployee] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ first_name: '', last_name: '', email: '', job_title: '', hire_date: format(new Date(), 'yyyy-MM-dd') });
  const qc = useQueryClient();

  const handleStatusChange = async (id: string, status: string) => {
    setUpdatingId(id);
    const { error } = await supabase.from('employees').update({ status: status as any }).eq('id', id);
    if (error) toast.error(error.message);
    else toast.success('Status updated');
    setUpdatingId(null);
    qc.invalidateQueries({ queryKey: ['employees'] });
  };

  const openCreate = () => {
    setFormData({ first_name: '', last_name: '', email: '', job_title: '', hire_date: format(new Date(), 'yyyy-MM-dd') });
    setIsCreateOpen(true);
  };

  const openEdit = (emp: any) => {
    setEditEmployee(emp);
    setFormData({ first_name: emp.first_name, last_name: emp.last_name, email: emp.email, job_title: emp.job_title || '', hire_date: emp.hire_date });
  };

  const handleCreate = async () => {
    const { error } = await supabase.from('employees').insert([{ ...formData, status: 'active' as const }]);
    if (error) { toast.error(error.message); return; }
    toast.success('Intern created');
    qc.invalidateQueries({ queryKey: ['employees'] });
    setIsCreateOpen(false);
  };

  const handleSaveEdit = async () => {
    if (!editEmployee) return;
    const { error } = await supabase.from('employees').update(formData).eq('id', editEmployee.id);
    if (error) { toast.error(error.message); return; }
    toast.success('Intern updated');
    qc.invalidateQueries({ queryKey: ['employees'] });
    setEditEmployee(null);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('employees').delete().eq('id', deleteId);
    if (error) { toast.error(error.message); return; }
    toast.success('Intern deleted');
    qc.invalidateQueries({ queryKey: ['employees'] });
    setDeleteId(null);
  };

  const filtered = employees.filter(e => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return e.first_name.toLowerCase().includes(q) || e.last_name.toLowerCase().includes(q) || e.email.toLowerCase().includes(q);
  });

  const exportCSV = () => {
    const headers = ['First Name', 'Last Name', 'Email', 'Job Title', 'Status', 'Hire Date'];
    const rows = employees.map(e => [e.first_name, e.last_name, e.email, e.job_title || '', e.status, e.hire_date]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'employees.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported');
  };

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <>
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Intern / Employee Oversight</CardTitle>
        <div className="flex gap-2">
          <div className="relative w-56">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-8 h-9" />
          </div>
          <Button size="sm" variant="outline" onClick={exportCSV}><Download className="h-4 w-4 mr-1" />CSV</Button>
          <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4 mr-1" />Add</Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Job Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Change Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(emp => (
              <TableRow key={emp.id}>
                <TableCell className="font-medium">{emp.first_name} {emp.last_name}</TableCell>
                <TableCell className="text-muted-foreground">{emp.email}</TableCell>
                <TableCell>{emp.job_title || '-'}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={statusColors[emp.status] || ''}>{emp.status}</Badge>
                </TableCell>
                <TableCell>
                  <Select value={emp.status} onValueChange={(val) => handleStatusChange(emp.id, val)} disabled={updatingId === emp.id}>
                    <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="on_leave">On Leave</SelectItem>
                      <SelectItem value="terminated">Terminated</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(emp)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setDeleteId(emp.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>

    <Dialog open={isCreateOpen || !!editEmployee} onOpenChange={(open) => { if (!open) { setIsCreateOpen(false); setEditEmployee(null); } }}>
      <DialogContent>
        <DialogHeader><DialogTitle>{editEmployee ? 'Edit Intern' : 'Add Intern'}</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2"><Label>First Name</Label><Input value={formData.first_name} onChange={(e) => setFormData(p => ({ ...p, first_name: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Last Name</Label><Input value={formData.last_name} onChange={(e) => setFormData(p => ({ ...p, last_name: e.target.value }))} /></div>
          </div>
          <div className="space-y-2"><Label>Email</Label><Input type="email" value={formData.email} onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))} /></div>
          <div className="space-y-2"><Label>Job Title</Label><Input value={formData.job_title} onChange={(e) => setFormData(p => ({ ...p, job_title: e.target.value }))} /></div>
          <div className="space-y-2"><Label>Hire Date</Label><Input type="date" value={formData.hire_date} onChange={(e) => setFormData(p => ({ ...p, hire_date: e.target.value }))} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { setIsCreateOpen(false); setEditEmployee(null); }}>Cancel</Button>
          <Button onClick={editEmployee ? handleSaveEdit : handleCreate}>
            {editEmployee ? 'Save Changes' : 'Create Intern'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Intern</AlertDialogTitle>
          <AlertDialogDescription>This will permanently remove this intern record and all associated data. This cannot be undone.</AlertDialogDescription>
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
