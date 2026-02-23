import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useJobPostings, useCreateJobPosting } from '@/hooks/useRecruitment';
import { useDepartments } from '@/hooks/useEmployees';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2, MapPin, Briefcase, Plus, Link as LinkIcon, Copy, ExternalLink } from 'lucide-react';
import { ApplicationFormModal } from '@/components/recruitment/ApplicationFormModal';
import { toast } from 'sonner';

export default function JobPostings() {
    const { data: jobs = [], isLoading } = useJobPostings();
    const { data: departments = [] } = useDepartments();
    const createJob = useCreateJobPosting();
    const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [newDeptId, setNewDeptId] = useState('');

    const handleCopyLink = (jobId: string) => {
        const url = `${window.location.origin}/careers/${jobId}`;
        navigator.clipboard.writeText(url);
        toast.success('Application link copied to clipboard!');
    };

    const handleCreateJob = () => {
        if (!newTitle.trim()) return;
        createJob.mutate({
            title: newTitle,
            description: newDesc || null,
            department_id: newDeptId || null,
            location_id: null,
            status: 'open',
        }, {
            onSuccess: () => {
                setNewTitle(''); setNewDesc(''); setNewDeptId('');
                setIsCreateOpen(false);
            },
        });
    };

    return (
        <MainLayout onAddNew={() => setIsCreateOpen(true)}>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Job Postings</h1>
                        <p className="text-muted-foreground">Manage job openings and recruitment status.</p>
                    </div>
                    <Button onClick={() => setIsCreateOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />Create Posting
                    </Button>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : jobs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-96 border-2 border-dashed rounded-lg text-center p-8">
                        <p className="text-muted-foreground mb-4">No job postings found.</p>
                        <Button variant="outline" onClick={() => setIsCreateOpen(true)}>Create your first job posting</Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {jobs.map((job) => (
                            <Card key={job.id} className="flex flex-col">
                                <CardHeader>
                                    <div className="flex justify-between items-start mb-2">
                                        <Badge variant="secondary" className="bg-primary/10 text-primary uppercase text-[10px] font-bold tracking-wider">
                                            {job.status}
                                        </Badge>
                                    </div>
                                    <CardTitle className="text-xl">{job.title}</CardTitle>
                                    <CardDescription className="line-clamp-2">{job.description}</CardDescription>
                                </CardHeader>
                                <CardContent className="flex-grow">
                                    <div className="space-y-2 text-sm text-muted-foreground">
                                        <div className="flex items-center gap-2">
                                            <MapPin className="h-4 w-4" /><span>On-site</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Briefcase className="h-4 w-4" /><span>Full-time / Intern</span>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="border-t pt-4 flex gap-2">
                                    <Button className="flex-1" variant="outline" onClick={() => handleCopyLink(job.id)}>
                                        <Copy className="h-4 w-4 mr-1" />Copy Link
                                    </Button>
                                    <Button size="icon" variant="ghost" asChild>
                                        <a href={`/careers/${job.id}`} target="_blank" rel="noopener noreferrer">
                                            <ExternalLink className="h-4 w-4" />
                                        </a>
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            <ApplicationFormModal open={isApplyModalOpen} onOpenChange={setIsApplyModalOpen} />

            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Create Job Posting</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                        <div><Label>Title *</Label><Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="e.g. Software Engineer" /></div>
                        <div><Label>Description</Label><Textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Job description..." rows={4} /></div>
                        <div>
                            <Label>Department</Label>
                            <Select value={newDeptId} onValueChange={setNewDeptId}>
                                <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                                <SelectContent>
                                    {departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreateJob} disabled={createJob.isPending}>{createJob.isPending ? 'Creating...' : 'Create'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </MainLayout>
    );
}
