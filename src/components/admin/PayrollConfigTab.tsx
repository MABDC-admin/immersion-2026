import { useState } from 'react';
import { usePayGrades, useCreatePayGrade, useDeletePayGrade } from '@/hooks/useAdmin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

export function PayrollConfigTab() {
  const { data: payGrades = [], isLoading } = usePayGrades();
  const createGrade = useCreatePayGrade();
  const deleteGrade = useDeletePayGrade();
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({ name: '', min_salary: '', max_salary: '', currency: 'PHP' });

  const handleCreate = () => {
    if (!form.name.trim()) return;
    createGrade.mutate(
      { name: form.name, min_salary: Number(form.min_salary) || 0, max_salary: Number(form.max_salary) || 0, currency: form.currency },
      { onSuccess: () => { setForm({ name: '', min_salary: '', max_salary: '', currency: 'PHP' }); setShowDialog(false); } }
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Pay Grades</CardTitle>
          <Button size="sm" onClick={() => setShowDialog(true)}><Plus className="h-4 w-4 mr-1" />Add Pay Grade</Button>
        </CardHeader>
        <CardContent>
          {isLoading ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : (
            <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Min Salary</TableHead><TableHead>Max Salary</TableHead><TableHead>Currency</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {payGrades.map(g => (
                  <TableRow key={g.id}>
                    <TableCell className="font-medium">{g.name}</TableCell>
                    <TableCell>{Number(g.min_salary).toLocaleString()}</TableCell>
                    <TableCell>{Number(g.max_salary).toLocaleString()}</TableCell>
                    <TableCell>{g.currency}</TableCell>
                    <TableCell className="text-right"><Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteGrade.mutate(g.id)}><Trash2 className="h-4 w-4" /></Button></TableCell>
                  </TableRow>
                ))}
                {payGrades.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No pay grades configured</TableCell></TableRow>}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Pay Grade</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Name *</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
            <div><Label>Min Salary</Label><Input type="number" value={form.min_salary} onChange={e => setForm(p => ({ ...p, min_salary: e.target.value }))} /></div>
            <div><Label>Max Salary</Label><Input type="number" value={form.max_salary} onChange={e => setForm(p => ({ ...p, max_salary: e.target.value }))} /></div>
            <div><Label>Currency</Label><Input value={form.currency} onChange={e => setForm(p => ({ ...p, currency: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={createGrade.isPending}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
