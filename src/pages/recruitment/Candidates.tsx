import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useCandidates, useApproveCandidate, useRejectCandidate } from '@/hooks/useRecruitment';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Loader2, CheckCircle, XCircle, UserPlus, Mail, Calendar, FileText, ExternalLink } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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

    const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
    const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);

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

    return (
        <MainLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Candidates</h1>
                    <p className="text-muted-foreground">Manage job applicants and transitions to onboarding.</p>
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
                                {candidates.map((candidate) => {
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
                                                {candidate.resume_url ? (
                                                    <a href={candidate.resume_url} target="_blank" rel="noopener noreferrer">
                                                        <Button variant="ghost" size="sm"><FileText className="h-4 w-4 mr-1" />View CV</Button>
                                                    </a>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">No resume</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={config.variant} className={config.className}>{config.label}</Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-sm">
                                                {format(new Date(candidate.created_at), 'MMM dd, yyyy')}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {candidate.status === 'applied' && (
                                                    <div className="flex justify-end gap-2">
                                                        <Button variant="outline" size="sm" className="text-green-600 hover:text-green-600 hover:bg-green-500/10 border-green-500/20"
                                                            onClick={() => handleApproveClick(candidate)} disabled={approveCandidate.isPending}>
                                                            <UserPlus className="h-4 w-4 mr-2" />Approve
                                                        </Button>
                                                        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20"
                                                            onClick={() => rejectCandidate.mutate(candidate.id)} disabled={rejectCandidate.isPending}>
                                                            <XCircle className="h-4 w-4 mr-2" />Reject
                                                        </Button>
                                                    </div>
                                                )}
                                                {candidate.status === 'approved' && (
                                                    <Badge variant="outline" className="text-green-600">Hired & Onboarding</Badge>
                                                )}
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
        </MainLayout>
    );
}
