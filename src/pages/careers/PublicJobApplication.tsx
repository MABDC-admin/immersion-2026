import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, CheckCircle, Upload, Briefcase, MapPin, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const applicationSchema = z.object({
    first_name: z.string().min(1, 'First name is required'),
    last_name: z.string().min(1, 'Last name is required'),
    email: z.string().email('Valid email is required'),
});

type ApplicationValues = z.infer<typeof applicationSchema>;

export default function PublicJobApplication() {
    const { jobId } = useParams<{ jobId: string }>();
    const [submitted, setSubmitted] = useState(false);
    const [resumeFile, setResumeFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { data: job, isLoading } = useQuery({
        queryKey: ['public-job', jobId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('job_postings')
                .select('*, department:departments(name)')
                .eq('id', jobId!)
                .eq('status', 'open')
                .maybeSingle();
            if (error) throw error;
            return data;
        },
        enabled: !!jobId,
    });

    const form = useForm<ApplicationValues>({
        resolver: zodResolver(applicationSchema),
        defaultValues: { first_name: '', last_name: '', email: '' },
    });

    const onSubmit = async (values: ApplicationValues) => {
        setIsSubmitting(true);
        try {
            let resumeUrl: string | null = null;

            if (resumeFile) {
                const ext = resumeFile.name.split('.').pop();
                const path = `${Date.now()}_${values.first_name}_${values.last_name}.${ext}`;
                const { error: uploadError } = await supabase.storage
                    .from('resumes')
                    .upload(path, resumeFile);
                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('resumes')
                    .getPublicUrl(path);
                resumeUrl = publicUrl;
            }

            const { error } = await supabase
                .from('candidates')
                .insert({
                    first_name: values.first_name,
                    last_name: values.last_name,
                    email: values.email,
                    job_id: jobId || null,
                    resume_url: resumeUrl,
                });

            if (error) throw error;
            setSubmitted(true);
        } catch (err: any) {
            toast.error(err.message || 'Failed to submit application');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!job) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
                <h1 className="text-2xl font-bold mb-2">Position Not Found</h1>
                <p className="text-muted-foreground mb-4">This job posting may have been closed or doesn't exist.</p>
                <Link to="/careers">
                    <Button variant="outline"><ArrowLeft className="h-4 w-4 mr-2" />Browse Open Positions</Button>
                </Link>
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-4">
                <Card className="max-w-md w-full text-center">
                    <CardContent className="pt-8 pb-8">
                        <CheckCircle className="h-16 w-16 text-primary mx-auto mb-4" />
                        <h2 className="text-2xl font-bold mb-2">Application Submitted!</h2>
                        <p className="text-muted-foreground">Thank you for applying. We'll review your application and get back to you soon.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background py-8 px-4">
            <div className="max-w-2xl mx-auto space-y-6">
                <div className="text-center">
                    <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
                        <span className="text-lg font-bold text-primary-foreground">IM</span>
                    </div>
                    <h1 className="text-sm text-muted-foreground">M.A Brain Development Center</h1>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl">{job.title}</CardTitle>
                        <CardDescription className="space-y-2">
                            <div className="flex items-center gap-4 text-sm">
                                {(job as any).department?.name && (
                                    <span className="flex items-center gap-1">
                                        <Briefcase className="h-4 w-4" />
                                        {(job as any).department.name}
                                    </span>
                                )}
                                <span className="flex items-center gap-1">
                                    <MapPin className="h-4 w-4" />Remote / On-site
                                </span>
                            </div>
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{job.description}</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Apply for this Position</CardTitle>
                        <CardDescription>Fill in your details and upload your CV below.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField control={form.control} name="first_name" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>First Name *</FormLabel>
                                            <FormControl><Input placeholder="John" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="last_name" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Last Name *</FormLabel>
                                            <FormControl><Input placeholder="Doe" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                </div>

                                <FormField control={form.control} name="email" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email *</FormLabel>
                                        <FormControl><Input type="email" placeholder="john@example.com" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />

                                <div className="space-y-2">
                                    <FormLabel>Upload CV / Resume</FormLabel>
                                    <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
                                        onClick={() => document.getElementById('cv-upload')?.click()}>
                                        <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                                        {resumeFile ? (
                                            <p className="text-sm font-medium">{resumeFile.name}</p>
                                        ) : (
                                            <p className="text-sm text-muted-foreground">Click to upload PDF, DOC, or DOCX (Max 10MB)</p>
                                        )}
                                        <input id="cv-upload" type="file" className="hidden"
                                            accept=".pdf,.doc,.docx" onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file && file.size <= 10 * 1024 * 1024) setResumeFile(file);
                                                else if (file) toast.error('File size must be under 10MB');
                                            }} />
                                    </div>
                                </div>

                                <Button type="submit" className="w-full" disabled={isSubmitting}>
                                    {isSubmitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Submitting...</> : 'Submit Application'}
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
