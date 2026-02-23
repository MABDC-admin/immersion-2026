import { useState } from 'react';
import { useApprovalWorkflows, useCreateWorkflow, useDeleteWorkflow } from '@/hooks/useAdmin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

export function WorkflowTab() {
  const { data: workflows = [], isLoading } = useApprovalWorkflows();
  const createWf = useCreateWorkflow();
  const deleteWf = useDeleteWorkflow();
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({ name: '', module: 'leave' });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Approval Workflows</CardTitle>
        <Button size="sm" onClick={() => setShowDialog(true)}><Plus className="h-4 w-4 mr-1" />Add Workflow</Button>
      </CardHeader>
      <CardContent>
        {isLoading ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : (
          <Table>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Module</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {workflows.map(w => (
                <TableRow key={w.id}>
                  <TableCell className="font-medium">{w.name}</TableCell>
                  <TableCell><Badge variant="outline">{w.module}</Badge></TableCell>
                  <TableCell className="text-right"><Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteWf.mutate(w.id)}><Trash2 className="h-4 w-4" /></Button></TableCell>
                </TableRow>
              ))}
              {workflows.length === 0 && <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">No workflows configured</TableCell></TableRow>}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Approval Workflow</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Name *</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
            <div>
              <Label>Module</Label>
              <Select value={form.module} onValueChange={v => setForm(p => ({ ...p, module: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="leave">Leave</SelectItem>
                  <SelectItem value="attendance">Attendance</SelectItem>
                  <SelectItem value="payroll">Payroll</SelectItem>
                  <SelectItem value="recruitment">Recruitment</SelectItem>
                  <SelectItem value="onboarding">Onboarding</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={() => { if (!form.name.trim()) return; createWf.mutate({ name: form.name, module: form.module }, { onSuccess: () => { setForm({ name: '', module: 'leave' }); setShowDialog(false); } }); }} disabled={createWf.isPending}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
