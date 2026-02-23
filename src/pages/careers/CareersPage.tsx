import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Briefcase, MapPin } from 'lucide-react';

export default function CareersPage() {
    const { data: jobs = [], isLoading } = useQuery({
        queryKey: ['public-jobs'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('job_postings')
                .select('*, department:departments(name)')
                .eq('status', 'open')
                .order('created_at', { ascending: false });
            if (error) throw error;
            return data;
        },
    });

    return (
        <div className="min-h-screen bg-background py-8 px-4">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="text-center">
                    <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
                        <span className="text-lg font-bold text-primary-foreground">IM</span>
                    </div>
                    <h1 className="text-3xl font-bold">Career Opportunities</h1>
                    <p className="text-muted-foreground mt-2">M.A Brain Development Center — Join our growing team</p>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                ) : jobs.length === 0 ? (
                    <div className="text-center py-16">
                        <p className="text-muted-foreground">No open positions at the moment. Check back soon!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {jobs.map((job) => (
                            <Card key={job.id} className="flex flex-col">
                                <CardHeader>
                                    <Badge variant="secondary" className="w-fit mb-2">Open</Badge>
                                    <CardTitle>{job.title}</CardTitle>
                                    <CardDescription className="line-clamp-3">{job.description}</CardDescription>
                                </CardHeader>
                                <CardContent className="flex-grow">
                                    <div className="flex gap-4 text-sm text-muted-foreground">
                                        {(job as any).department?.name && (
                                            <span className="flex items-center gap-1"><Briefcase className="h-4 w-4" />{(job as any).department.name}</span>
                                        )}
                                        <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />On-site</span>
                                    </div>
                                </CardContent>
                                <CardFooter className="border-t pt-4">
                                    <Link to={`/careers/${job.id}`} className="w-full">
                                        <Button className="w-full">Apply Now</Button>
                                    </Link>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
