import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useJobPostings } from '@/hooks/useRecruitment';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, MapPin, Briefcase, Plus } from 'lucide-react';
import { ApplicationFormModal } from '@/components/recruitment/ApplicationFormModal';

export default function JobPostings() {
    const { data: jobs = [], isLoading } = useJobPostings();
    const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
    const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

    const handleApply = (jobId: string) => {
        setSelectedJobId(jobId);
        setIsApplyModalOpen(true);
    };

    return (
        <MainLayout onAddNew={() => { }}>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Job Postings</h1>
                        <p className="text-muted-foreground">Manage job openings and recruitment status.</p>
                    </div>
                    <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Posting
                    </Button>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : jobs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-96 border-2 border-dashed rounded-lg text-center p-8">
                        <p className="text-muted-foreground mb-4">No job postings found.</p>
                        <Button variant="outline">Create your first job posting</Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {jobs.map((job) => (
                            <Card key={job.id} className="flex flex-col">
                                <CardHeader>
                                    <div className="flex justify-between items-start mb-2">
                                        <Badge variant="secondary" className="bg-hrms-primary/10 text-hrms-primary uppercase text-[10px] font-bold tracking-wider">
                                            {job.status}
                                        </Badge>
                                    </div>
                                    <CardTitle className="text-xl">{job.title}</CardTitle>
                                    <CardDescription className="line-clamp-2">{job.description}</CardDescription>
                                </CardHeader>
                                <CardContent className="flex-grow">
                                    <div className="space-y-2 text-sm text-muted-foreground">
                                        <div className="flex items-center gap-2">
                                            <MapPin className="h-4 w-4" />
                                            <span>Remote / Multiple Locations</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Briefcase className="h-4 w-4" />
                                            <span>Full-time</span>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="border-t pt-4">
                                    <Button className="w-full" variant="outline" onClick={() => handleApply(job.id)}>
                                        Apply Now
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            <ApplicationFormModal
                open={isApplyModalOpen}
                onOpenChange={setIsApplyModalOpen}
            />
        </MainLayout>
    );
}
