import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/hooks/useAuth';
import { useAllProfiles, useUpdateUserRole, useCreateDepartment, useDeleteDepartment, useCreateLocation, useDeleteLocation } from '@/hooks/useAdmin';
import { useDepartments, useLocations } from '@/hooks/useEmployees';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, Plus, Trash2, Shield, Users, Building, MapPin } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

export default function AdminPanel() {
    const { isAdmin } = useAuth();
    const { data: profiles = [], isLoading: loadingProfiles } = useAllProfiles();
    const updateRole = useUpdateUserRole();
    const { data: departments = [], isLoading: loadingDepts } = useDepartments();
    const { data: locations = [], isLoading: loadingLocs } = useLocations();
    const createDept = useCreateDepartment();
    const deleteDept = useDeleteDepartment();
    const createLoc = useCreateLocation();
    const deleteLoc = useDeleteLocation();

    const [deptName, setDeptName] = useState('');
    const [deptDesc, setDeptDesc] = useState('');
    const [locName, setLocName] = useState('');
    const [locCity, setLocCity] = useState('');
    const [locCountry, setLocCountry] = useState('');
    const [showDeptDialog, setShowDeptDialog] = useState(false);
    const [showLocDialog, setShowLocDialog] = useState(false);

    if (!isAdmin) return <Navigate to="/dashboard" replace />;

    const handleRoleChange = (userId: string, role: string) => {
        updateRole.mutate({ userId, role });
    };

    const handleCreateDept = () => {
        if (!deptName.trim()) return;
        createDept.mutate({ name: deptName, description: deptDesc || undefined }, {
            onSuccess: () => { setDeptName(''); setDeptDesc(''); setShowDeptDialog(false); }
        });
    };

    const handleCreateLoc = () => {
        if (!locName.trim() || !locCity.trim() || !locCountry.trim()) return;
        createLoc.mutate({ name: locName, city: locCity, country: locCountry }, {
            onSuccess: () => { setLocName(''); setLocCity(''); setLocCountry(''); setShowLocDialog(false); }
        });
    };

    const roleColors: Record<string, string> = {
        admin: 'bg-destructive/10 text-destructive border-destructive/20',
        hr_manager: 'bg-primary/10 text-primary border-primary/20',
        employee: 'bg-muted text-muted-foreground border-muted',
    };

    return (
        <MainLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><Shield className="h-6 w-6" />Admin Panel</h1>
                    <p className="text-muted-foreground">Manage users, roles, departments, and locations.</p>
                </div>

                <Tabs defaultValue="users">
                    <TabsList>
                        <TabsTrigger value="users"><Users className="h-4 w-4 mr-1" />Users & Roles</TabsTrigger>
                        <TabsTrigger value="departments"><Building className="h-4 w-4 mr-1" />Departments</TabsTrigger>
                        <TabsTrigger value="locations"><MapPin className="h-4 w-4 mr-1" />Locations</TabsTrigger>
                    </TabsList>

                    <TabsContent value="users" className="mt-4">
                        <Card>
                            <CardHeader><CardTitle>User Management</CardTitle></CardHeader>
                            <CardContent>
                                {loadingProfiles ? (
                                    <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>User</TableHead>
                                                <TableHead>Current Role</TableHead>
                                                <TableHead>Change Role</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {profiles.map((profile) => (
                                                <TableRow key={profile.id}>
                                                    <TableCell>
                                                        <div className="flex items-center gap-3">
                                                            <Avatar className="h-8 w-8">
                                                                <AvatarFallback>{(profile.first_name?.[0] || 'U')}{(profile.last_name?.[0] || '')}</AvatarFallback>
                                                            </Avatar>
                                                            <div>
                                                                <p className="font-medium">{profile.first_name || ''} {profile.last_name || ''}</p>
                                                                <p className="text-xs text-muted-foreground">{profile.user_id.slice(0, 8)}...</p>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className={roleColors[profile.role || 'employee']}>
                                                            {profile.role || 'employee'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Select value={profile.role || 'employee'} onValueChange={(val) => handleRoleChange(profile.user_id, val)}>
                                                            <SelectTrigger className="w-40">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="admin">Admin</SelectItem>
                                                                <SelectItem value="hr_manager">HR Manager</SelectItem>
                                                                <SelectItem value="employee">Employee</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="departments" className="mt-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>Departments</CardTitle>
                                <Button size="sm" onClick={() => setShowDeptDialog(true)}><Plus className="h-4 w-4 mr-1" />Add</Button>
                            </CardHeader>
                            <CardContent>
                                {loadingDepts ? (
                                    <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Name</TableHead>
                                                <TableHead>Description</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {departments.map((dept) => (
                                                <TableRow key={dept.id}>
                                                    <TableCell className="font-medium">{dept.name}</TableCell>
                                                    <TableCell className="text-muted-foreground">{dept.description || '-'}</TableCell>
                                                    <TableCell className="text-right">
                                                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteDept.mutate(dept.id)}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="locations" className="mt-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>Locations</CardTitle>
                                <Button size="sm" onClick={() => setShowLocDialog(true)}><Plus className="h-4 w-4 mr-1" />Add</Button>
                            </CardHeader>
                            <CardContent>
                                {loadingLocs ? (
                                    <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Name</TableHead>
                                                <TableHead>City</TableHead>
                                                <TableHead>Country</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {locations.map((loc) => (
                                                <TableRow key={loc.id}>
                                                    <TableCell className="font-medium">{loc.name}</TableCell>
                                                    <TableCell>{loc.city}</TableCell>
                                                    <TableCell>{loc.country}</TableCell>
                                                    <TableCell className="text-right">
                                                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteLoc.mutate(loc.id)}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>

            <Dialog open={showDeptDialog} onOpenChange={setShowDeptDialog}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Add Department</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                        <div><Label>Name *</Label><Input value={deptName} onChange={(e) => setDeptName(e.target.value)} /></div>
                        <div><Label>Description</Label><Input value={deptDesc} onChange={(e) => setDeptDesc(e.target.value)} /></div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeptDialog(false)}>Cancel</Button>
                        <Button onClick={handleCreateDept} disabled={createDept.isPending}>Create</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={showLocDialog} onOpenChange={setShowLocDialog}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Add Location</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                        <div><Label>Name *</Label><Input value={locName} onChange={(e) => setLocName(e.target.value)} /></div>
                        <div><Label>City *</Label><Input value={locCity} onChange={(e) => setLocCity(e.target.value)} /></div>
                        <div><Label>Country *</Label><Input value={locCountry} onChange={(e) => setLocCountry(e.target.value)} /></div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowLocDialog(false)}>Cancel</Button>
                        <Button onClick={handleCreateLoc} disabled={createLoc.isPending}>Create</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </MainLayout>
    );
}
