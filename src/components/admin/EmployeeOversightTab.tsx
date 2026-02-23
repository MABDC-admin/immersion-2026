import { useState } from 'react';
import { useEmployees } from '@/hooks/useEmployees';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Download, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-800 border-green-200',
  inactive: 'bg-muted text-muted-foreground border-muted',
  on_leave: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  terminated: 'bg-destructive/10 text-destructive border-destructive/20',
};

export function EmployeeOversightTab() {
  const { data: employees = [], isLoading } = useEmployees();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleStatusChange = async (id: string, status: string) => {
    setUpdatingId(id);
    const { error } = await supabase.from('employees').update({ status: status as any }).eq('id', id);
    if (error) toast.error(error.message);
    else toast.success('Status updated');
    setUpdatingId(null);
  };

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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Employee Data Oversight</CardTitle>
        <Button size="sm" variant="outline" onClick={exportCSV}><Download className="h-4 w-4 mr-1" />Export CSV</Button>
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.map(emp => (
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
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
