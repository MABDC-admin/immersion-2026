import { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Paperclip, X } from 'lucide-react';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
    Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
    Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useCreateLeaveRequest } from '@/hooks/useLeave';
import { useEmployees } from '@/hooks/useEmployees';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const leaveFormSchema = z.object({
    employee_id: z.string().uuid('Please select an employee'),
    leave_type: z.string().min(1, 'Leave type is required'),
    start_date: z.date(),
    end_date: z.date(),
    reason: z.string().max(500).optional(),
}).refine((data) => data.end_date >= data.start_date, {
    message: "End date cannot be before start date",
    path: ["end_date"],
});

type LeaveFormValues = z.infer<typeof leaveFormSchema>;

interface CreateLeaveModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    employeeId?: string;
}

export function CreateLeaveModal({ open, onOpenChange, employeeId }: CreateLeaveModalProps) {
    const createLeave = useCreateLeaveRequest();
    const { data: employees = [] } = useEmployees();
    const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const form = useForm<LeaveFormValues>({
        resolver: zodResolver(leaveFormSchema),
        defaultValues: {
            employee_id: employeeId || '',
            leave_type: 'Annual Leave',
            start_date: new Date(),
            end_date: new Date(),
            reason: '',
        },
    });

    useEffect(() => {
        if (employeeId) {
            form.setValue('employee_id', employeeId);
        }
    }, [employeeId, form]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error('File size must be less than 5MB');
                return;
            }
            setAttachmentFile(file);
        }
    };

    const uploadAttachment = async (employeeId: string): Promise<string | undefined> => {
        if (!attachmentFile) return undefined;
        setUploading(true);
        try {
            const fileExt = attachmentFile.name.split('.').pop();
            const filePath = `${employeeId}/${Date.now()}.${fileExt}`;
            const { error } = await supabase.storage
                .from('leave-attachments')
                .upload(filePath, attachmentFile);
            if (error) throw error;
            const { data: urlData } = supabase.storage
                .from('leave-attachments')
                .getPublicUrl(filePath);
            return urlData.publicUrl;
        } catch (err: any) {
            toast.error('Failed to upload attachment');
            return undefined;
        } finally {
            setUploading(false);
        }
    };

    const onSubmit = async (values: LeaveFormValues) => {
        const attachmentUrl = await uploadAttachment(values.employee_id);
        await createLeave.mutateAsync({
            employee_id: values.employee_id,
            leave_type: values.leave_type,
            start_date: format(values.start_date, 'yyyy-MM-dd'),
            end_date: format(values.end_date, 'yyyy-MM-dd'),
            reason: values.reason || undefined,
            attachment_url: attachmentUrl,
        });
        form.reset({ employee_id: employeeId || '', leave_type: 'Annual Leave', start_date: new Date(), end_date: new Date(), reason: '' });
        setAttachmentFile(null);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Request Leave</DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        {!employeeId && (
                            <FormField
                                control={form.control}
                                name="employee_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Intern *</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select employee" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {employees.map((emp) => (
                                                    <SelectItem key={emp.id} value={emp.id}>
                                                        {emp.first_name} {emp.last_name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        <FormField
                            control={form.control}
                            name="leave_type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Leave Type *</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select type" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="Annual Leave">Annual Leave</SelectItem>
                                            <SelectItem value="Local Leave">Local Leave</SelectItem>
                                            <SelectItem value="LOP">LOP (Loss of Pay)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="start_date"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Start Date *</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button variant="outline" className={cn('w-full pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}>
                                                        {field.value ? format(field.value, 'PPP') : 'Pick a date'}
                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="end_date"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>End Date *</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button variant="outline" className={cn('w-full pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}>
                                                        {field.value ? format(field.value, 'PPP') : 'Pick a date'}
                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="reason"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Reason</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Explain the reason for your leave..." className="resize-none" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Attachment Upload */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Attachment</label>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                className="hidden"
                            />
                            {attachmentFile ? (
                                <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
                                    <Paperclip className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm truncate flex-1">{attachmentFile.name}</span>
                                    <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => setAttachmentFile(null)}>
                                        <X className="h-3 w-3" />
                                    </Button>
                                </div>
                            ) : (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="w-full"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <Paperclip className="h-4 w-4 mr-2" />
                                    Attach supporting document
                                </Button>
                            )}
                            <p className="text-xs text-muted-foreground">PDF, JPG, PNG, DOC (max 5MB)</p>
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                            <Button type="submit" disabled={createLeave.isPending || uploading}>
                                {createLeave.isPending || uploading ? 'Submitting...' : 'Submit Request'}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
