import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useCandidates, useApproveCandidate, useRejectCandidate, useCreateCandidate, useUpdateCandidate, useDeleteCandidate, useJobPostings } from '@/hooks/useRecruitment';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Loader2, UserPlus, XCircle, Mail, FileText, Sparkles, Plus, Pencil, Trash2, Search } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const statusConfig = {
    applied: { label: 'Applied', variant: 'outline' as const, className: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' },
    screening: { label: 'Screening', variant: 'secondary' as const, className: '' },
    interviewing: { label: 'Interviewing', variant: 'default' as const, className: 'bg-primary/10 text-primary border-primary/20' },
    approved: { label: 'Approved', variant: 'default' as const, className: 'bg-green-500/10 text-green-600 border-green-500/20' },
    rejected: { label: 'Rejected', variant: 'destructive' as const, className: 'bg-destructive/10 text-destructive border-destructive/20' },
};

export default function Candidates() {
    const { data: candidates = [], isLoading } = useCandidates();
    const approveCandidate = useApproveCandidate();
    const rejectCandidate = useRejectCandidate();
    const createCandidate = useCreateCandidate();
    const updateCandidate = useUpdateCandidate();
    const deleteCandidate = useDeleteCandidate();
    const { data: jobs = [] } = useJobPostings();

    const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
    const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [formData, setFormData] = useState({ first_name: '', last_name: '', email: '', job_id: '' as string | null, resume_url: '' as string | null });

    const handleApproveClick = (candidate: any) => {
        setSelectedCandidate(candidate);
        setIsApproveDialogOpen(true);
    };

    const handleConfirmApprove = async () => {
        if (!selectedCandidate) return;
        await approveCandidate.mutateAsync({ candidate: selectedCandidate, startDate });
        setIsApproveDialogOpen(false);
        setSelectedCandidate(null);
    };

    const openCreate = () => {
        setFormData({ first_name: '', last_name: '', email: '', job_id: null, resume_url: null });
        setIsCreateOpen(true);
    };

    const openEdit = (c: any) => {
        setSelectedCandidate(c);
        setFormData({ first_name: c.first_name, last_name: c.last_name, email: c.email, job_id: c.job_id, resume_url: c.resume_url });
        setIsEditOpen(true);
    };

    const handleCreate = () => {
        createCandidate.mutate(formData as any, { onSuccess: () => setIsCreateOpen(false) });
    };

    const handleEdit = () => {
        if (!selectedCandidate) return;
        updateCandidate.mutate({ id: selectedCandidate.id, ...formData } as any, { onSuccess: () => { setIsEditOpen(false); setSelectedCandidate(null); } });
    };

    const handleDelete = () => {
        if (!deleteId) return;
        deleteCandidate.mutate(deleteId, { onSuccess: () => setDeleteId(null) });
    };

    const filtered = candidates.filter(c => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return c.first_name.toLowerCase().includes(q) || c.last_name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
    });

    return (
        <MainLayout>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Candidates</h1>
                        <p className="text-muted-foreground">Manage job applicants and transitions to onboarding.</p>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <div className="relative flex-1 sm:w-56">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-8" />
                        </div>
                        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-1" />Add</Button>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                ) : candidates.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-96 border-2 border-dashed rounded-lg text-center p-8">
                        <p className="text-muted-foreground">No candidates found.</p>
                    </div>
                ) : (
                    <div className="border rounded-lg overflow-hidden bg-card">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Candidate</TableHead>
                                    <TableHead>Applied For</TableHead>
                                    <TableHead>Resume</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Applied On</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.map((candidate) => {
                                    const config = statusConfig[candidate.status as keyof typeof statusConfig] || statusConfig.applied;
                                    return (
                                        <TableRow key={candidate.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarFallback>{candidate.first_name[0]}{candidate.last_name[0]}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{candidate.first_name} {candidate.last_name}</span>
                                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                            <Mail className="h-3 w-3" /> {candidate.email}
                                                        </span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>{candidate.job?.title || 'General Application'}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1 items-start">
                                                    {candidate.resume_url ? (
                                                        <a href={candidate.resume_url} target="_blank" rel="noopener noreferrer">
                                                            <Button variant="ghost" size="sm" className="h-8 px-2"><FileText className="h-4 w-4 mr-1" />View CV</Button>
                                                        </a>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground px-2">No resume</span>
                                                    )}
                                                    {candidate.cv_data && (
                                                        <Badge variant="secondary" className="text-[10px] h-5 bg-purple-500/10 text-purple-600 hover:bg-purple-500/20 border-purple-500/20">
                                                            <Sparkles className="h-3 w-3 mr-1" /> AI Parsed
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={config.variant} className={config.className}>{config.label}</Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-sm">
                                                {format(new Date(candidate.created_at), 'MMM dd, yyyy')}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1">
                                                    {candidate.status === 'applied' && (
                                                        <>
                                                            <Button variant="outline" size="sm" className="text-green-600 hover:text-green-600 hover:bg-green-500/10 border-green-500/20"
                                                                onClick={() => handleApproveClick(candidate)} disabled={approveCandidate.isPending}>
                                                                <UserPlus className="h-4 w-4 mr-1" />Approve
                                                            </Button>
                                                            <Button variant="outline" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20"
                                                                onClick={() => rejectCandidate.mutate(candidate.id)} disabled={rejectCandidate.isPending}>
                                                                <XCircle className="h-4 w-4 mr-1" />Reject
                                                            </Button>
                                                        </>
                                                    )}
                                                    {candidate.status === 'approved' && (
                                                        <Badge variant="outline" className="text-green-600 mr-2">Hired</Badge>
                                                    )}
                                                    <Button variant="ghost" size="icon" onClick={() => openEdit(candidate)}><Pencil className="h-4 w-4" /></Button>
                                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setDeleteId(candidate.id)}><Trash2 className="h-4 w-4" /></Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>

            <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Approve Candidate</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                        <p className="text-sm text-muted-foreground">
                            Confirming approval will create an employee record for {selectedCandidate?.first_name} and start their onboarding process. An approval email will be sent automatically.
                        </p>
                        <div className="space-y-2">
                            <Label htmlFor="start_date">Expected Start Date</Label>
                            <Input id="start_date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsApproveDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleConfirmApprove} disabled={approveCandidate.isPending}>
                            {approveCandidate.isPending ? 'Processing...' : 'Confirm & Approve'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Create / Edit Dialog */}
            <Dialog open={isCreateOpen || isEditOpen} onOpenChange={(open) => { if (!open) { setIsCreateOpen(false); setIsEditOpen(false); } }}>
                <DialogContent>
                    <DialogHeader><DialogTitle>{isEditOpen ? 'Edit Candidate' : 'Add Candidate'}</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2"><Label>First Name</Label><Input value={formData.first_name} onChange={(e) => setFormData(p => ({ ...p, first_name: e.target.value }))} /></div>
                            <div className="space-y-2"><Label>Last Name</Label><Input value={formData.last_name} onChange={(e) => setFormData(p => ({ ...p, last_name: e.target.value }))} /></div>
                        </div>
                        <div className="space-y-2"><Label>Email</Label><Input type="email" value={formData.email} onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))} /></div>
                        <div className="space-y-2">
                            <Label>Job Posting</Label>
                            <Select value={formData.job_id || 'none'} onValueChange={(val) => setFormData(p => ({ ...p, job_id: val === 'none' ? null : val }))}>
                                <SelectTrigger><SelectValue placeholder="Select job" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">General Application</SelectItem>
                                    {jobs.map(j => <SelectItem key={j.id} value={j.id}>{j.title}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => { setIsCreateOpen(false); setIsEditOpen(false); }}>Cancel</Button>
                        <Button onClick={isEditOpen ? handleEdit : handleCreate} disabled={createCandidate.isPending || updateCandidate.isPending}>
                            {isEditOpen ? 'Save Changes' : 'Add Candidate'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Candidate</AlertDialogTitle>
                        <AlertDialogDescription>This will permanently remove this candidate record. This cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </MainLayout>
    );
}
