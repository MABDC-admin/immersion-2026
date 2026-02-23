import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useCreateCandidate, useJobPostings } from '@/hooks/useRecruitment';

const applicationFormSchema = z.object({
    first_name: z.string().min(1, 'First name is required').max(100),
    last_name: z.string().min(1, 'Last name is required').max(100),
    email: z.string().email('Invalid email address').max(255),
    job_id: z.string().uuid().optional().or(z.literal('')),
});

type ApplicationFormValues = z.infer<typeof applicationFormSchema>;

interface ApplicationFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ApplicationFormModal({ open, onOpenChange }: ApplicationFormModalProps) {
    const createCandidate = useCreateCandidate();
    const { data: jobs = [] } = useJobPostings();

    const form = useForm<ApplicationFormValues>({
        resolver: zodResolver(applicationFormSchema),
        defaultValues: {
            first_name: '',
            last_name: '',
            email: '',
            job_id: '',
        },
    });

    const onSubmit = async (values: ApplicationFormValues) => {
        await createCandidate.mutateAsync({
            first_name: values.first_name,
            last_name: values.last_name,
            email: values.email,
            job_id: values.job_id || null,
            resume_url: null, // Placeholder for now
        });
        form.reset();
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Job Application</DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="first_name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>First Name *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="John" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="last_name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Last Name *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Doe" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email *</FormLabel>
                                    <FormControl>
                                        <Input type="email" placeholder="john.doe@example.com" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="job_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Position (Optional)</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select position" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {jobs.map((job) => (
                                                <SelectItem key={job.id} value={job.id}>
                                                    {job.title}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-end gap-3 pt-4">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={createCandidate.isPending}>
                                {createCandidate.isPending ? 'Submitting...' : 'Apply Now'}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
