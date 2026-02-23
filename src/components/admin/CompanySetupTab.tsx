import { useState, useEffect } from 'react';
import { useCompanySettings, useUpsertCompanySettings, useCreateDepartment, useDeleteDepartment, useCreateLocation, useDeleteLocation } from '@/hooks/useAdmin';
import { useDepartments, useLocations } from '@/hooks/useEmployees';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, Trash2, Save } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

export function CompanySetupTab() {
  const { data: company, isLoading: loadingCompany } = useCompanySettings();
  const upsertCompany = useUpsertCompanySettings();
  const { data: departments = [], isLoading: loadingDepts } = useDepartments();
  const { data: locations = [], isLoading: loadingLocs } = useLocations();
  const createDept = useCreateDepartment();
  const deleteDept = useDeleteDepartment();
  const createLoc = useCreateLocation();
  const deleteLoc = useDeleteLocation();

  const [companyForm, setCompanyForm] = useState({ name: '', address: '', city: '', country: '', tax_id: '', phone: '', email: '' });
  const [showDeptDialog, setShowDeptDialog] = useState(false);
  const [showLocDialog, setShowLocDialog] = useState(false);
  const [deptName, setDeptName] = useState('');
  const [deptDesc, setDeptDesc] = useState('');
  const [locName, setLocName] = useState('');
  const [locCity, setLocCity] = useState('');
  const [locCountry, setLocCountry] = useState('');

  useEffect(() => {
    if (company) {
      setCompanyForm({
        name: company.name || '',
        address: company.address || '',
        city: company.city || '',
        country: company.country || '',
        tax_id: company.tax_id || '',
        phone: company.phone || '',
        email: company.email || '',
      });
    }
  }, [company]);

  const handleSaveCompany = () => {
    upsertCompany.mutate({ id: company?.id, ...companyForm });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Company Profile</CardTitle></CardHeader>
        <CardContent>
          {loadingCompany ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Company Name</Label><Input value={companyForm.name} onChange={e => setCompanyForm(p => ({ ...p, name: e.target.value }))} /></div>
              <div><Label>Email</Label><Input value={companyForm.email} onChange={e => setCompanyForm(p => ({ ...p, email: e.target.value }))} /></div>
              <div><Label>Phone</Label><Input value={companyForm.phone} onChange={e => setCompanyForm(p => ({ ...p, phone: e.target.value }))} /></div>
              <div><Label>Tax ID</Label><Input value={companyForm.tax_id} onChange={e => setCompanyForm(p => ({ ...p, tax_id: e.target.value }))} /></div>
              <div><Label>Address</Label><Input value={companyForm.address} onChange={e => setCompanyForm(p => ({ ...p, address: e.target.value }))} /></div>
              <div><Label>City</Label><Input value={companyForm.city} onChange={e => setCompanyForm(p => ({ ...p, city: e.target.value }))} /></div>
              <div><Label>Country</Label><Input value={companyForm.country} onChange={e => setCompanyForm(p => ({ ...p, country: e.target.value }))} /></div>
              <div className="flex items-end">
                <Button onClick={handleSaveCompany} disabled={upsertCompany.isPending}><Save className="h-4 w-4 mr-1" />Save</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Departments</CardTitle>
          <Button size="sm" onClick={() => setShowDeptDialog(true)}><Plus className="h-4 w-4 mr-1" />Add</Button>
        </CardHeader>
        <CardContent>
          {loadingDepts ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : (
            <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Description</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {departments.map(d => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.name}</TableCell>
                    <TableCell className="text-muted-foreground">{d.description || '-'}</TableCell>
                    <TableCell className="text-right"><Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteDept.mutate(d.id)}><Trash2 className="h-4 w-4" /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Locations</CardTitle>
          <Button size="sm" onClick={() => setShowLocDialog(true)}><Plus className="h-4 w-4 mr-1" />Add</Button>
        </CardHeader>
        <CardContent>
          {loadingLocs ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : (
            <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>City</TableHead><TableHead>Country</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {locations.map(l => (
                  <TableRow key={l.id}>
                    <TableCell className="font-medium">{l.name}</TableCell>
                    <TableCell>{l.city}</TableCell>
                    <TableCell>{l.country}</TableCell>
                    <TableCell className="text-right"><Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteLoc.mutate(l.id)}><Trash2 className="h-4 w-4" /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showDeptDialog} onOpenChange={setShowDeptDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Department</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Name *</Label><Input value={deptName} onChange={e => setDeptName(e.target.value)} /></div>
            <div><Label>Description</Label><Input value={deptDesc} onChange={e => setDeptDesc(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeptDialog(false)}>Cancel</Button>
            <Button onClick={() => { if (!deptName.trim()) return; createDept.mutate({ name: deptName, description: deptDesc || undefined }, { onSuccess: () => { setDeptName(''); setDeptDesc(''); setShowDeptDialog(false); } }); }} disabled={createDept.isPending}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showLocDialog} onOpenChange={setShowLocDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Location</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Name *</Label><Input value={locName} onChange={e => setLocName(e.target.value)} /></div>
            <div><Label>City *</Label><Input value={locCity} onChange={e => setLocCity(e.target.value)} /></div>
            <div><Label>Country *</Label><Input value={locCountry} onChange={e => setLocCountry(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLocDialog(false)}>Cancel</Button>
            <Button onClick={() => { if (!locName.trim() || !locCity.trim() || !locCountry.trim()) return; createLoc.mutate({ name: locName, city: locCity, country: locCountry }, { onSuccess: () => { setLocName(''); setLocCity(''); setLocCountry(''); setShowLocDialog(false); } }); }} disabled={createLoc.isPending}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
