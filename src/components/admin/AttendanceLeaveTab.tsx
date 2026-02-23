import { useState } from 'react';
import { useLeaveTypes, useCreateLeaveType, useDeleteLeaveType, useWorkSchedules, useCreateWorkSchedule, useDeleteWorkSchedule } from '@/hooks/useAdmin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

export function AttendanceLeaveTab() {
  const { data: leaveTypes = [], isLoading: loadingLT } = useLeaveTypes();
  const createLT = useCreateLeaveType();
  const deleteLT = useDeleteLeaveType();
  const { data: schedules = [], isLoading: loadingSch } = useWorkSchedules();
  const createSch = useCreateWorkSchedule();
  const deleteSch = useDeleteWorkSchedule();

  const [showLTDialog, setShowLTDialog] = useState(false);
  const [ltForm, setLtForm] = useState({ name: '', days_per_year: '0', carry_over: false, is_paid: true });
  const [showSchDialog, setShowSchDialog] = useState(false);
  const [schForm, setSchForm] = useState({ name: '', start_time: '08:00', end_time: '17:00' });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Leave Types</CardTitle>
          <Button size="sm" onClick={() => setShowLTDialog(true)}><Plus className="h-4 w-4 mr-1" />Add</Button>
        </CardHeader>
        <CardContent>
          {loadingLT ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : (
            <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Days/Year</TableHead><TableHead>Carry Over</TableHead><TableHead>Paid</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {leaveTypes.map(lt => (
                  <TableRow key={lt.id}>
                    <TableCell className="font-medium">{lt.name}</TableCell>
                    <TableCell>{lt.days_per_year}</TableCell>
                    <TableCell><Badge variant="outline">{lt.carry_over ? 'Yes' : 'No'}</Badge></TableCell>
                    <TableCell><Badge variant="outline">{lt.is_paid ? 'Paid' : 'Unpaid'}</Badge></TableCell>
                    <TableCell className="text-right"><Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteLT.mutate(lt.id)}><Trash2 className="h-4 w-4" /></Button></TableCell>
                  </TableRow>
                ))}
                {leaveTypes.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No leave types configured</TableCell></TableRow>}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Work Schedules</CardTitle>
          <Button size="sm" onClick={() => setShowSchDialog(true)}><Plus className="h-4 w-4 mr-1" />Add</Button>
        </CardHeader>
        <CardContent>
          {loadingSch ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : (
            <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Start</TableHead><TableHead>End</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {schedules.map(s => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>{s.start_time}</TableCell>
                    <TableCell>{s.end_time}</TableCell>
                    <TableCell className="text-right"><Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteSch.mutate(s.id)}><Trash2 className="h-4 w-4" /></Button></TableCell>
                  </TableRow>
                ))}
                {schedules.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No schedules configured</TableCell></TableRow>}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showLTDialog} onOpenChange={setShowLTDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Leave Type</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Name *</Label><Input value={ltForm.name} onChange={e => setLtForm(p => ({ ...p, name: e.target.value }))} /></div>
            <div><Label>Days Per Year</Label><Input type="number" value={ltForm.days_per_year} onChange={e => setLtForm(p => ({ ...p, days_per_year: e.target.value }))} /></div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2"><Switch checked={ltForm.carry_over} onCheckedChange={v => setLtForm(p => ({ ...p, carry_over: v }))} /><Label>Carry Over</Label></div>
              <div className="flex items-center gap-2"><Switch checked={ltForm.is_paid} onCheckedChange={v => setLtForm(p => ({ ...p, is_paid: v }))} /><Label>Paid</Label></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLTDialog(false)}>Cancel</Button>
            <Button onClick={() => { if (!ltForm.name.trim()) return; createLT.mutate({ name: ltForm.name, days_per_year: Number(ltForm.days_per_year), carry_over: ltForm.carry_over, is_paid: ltForm.is_paid }, { onSuccess: () => { setLtForm({ name: '', days_per_year: '0', carry_over: false, is_paid: true }); setShowLTDialog(false); } }); }} disabled={createLT.isPending}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showSchDialog} onOpenChange={setShowSchDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Work Schedule</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Name *</Label><Input value={schForm.name} onChange={e => setSchForm(p => ({ ...p, name: e.target.value }))} /></div>
            <div><Label>Start Time</Label><Input type="time" value={schForm.start_time} onChange={e => setSchForm(p => ({ ...p, start_time: e.target.value }))} /></div>
            <div><Label>End Time</Label><Input type="time" value={schForm.end_time} onChange={e => setSchForm(p => ({ ...p, end_time: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSchDialog(false)}>Cancel</Button>
            <Button onClick={() => { if (!schForm.name.trim()) return; createSch.mutate({ name: schForm.name, start_time: schForm.start_time, end_time: schForm.end_time }, { onSuccess: () => { setSchForm({ name: '', start_time: '08:00', end_time: '17:00' }); setShowSchDialog(false); } }); }} disabled={createSch.isPending}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
