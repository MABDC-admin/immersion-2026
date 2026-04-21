import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
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
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useUpdateEmployee, useLocations, useDepartments, useSupervisorOptions } from '@/hooks/useEmployees';
import type { EmployeeWithRelations } from '@/types/employee';

const employeeFormSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(100),
  last_name: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email('Invalid email address').max(255),
  phone: z.string().max(20).optional().or(z.literal('')),
  job_title: z.string().max(100).optional().or(z.literal('')),
  department_id: z.string().uuid().optional().or(z.literal('')),
  location_id: z.string().uuid().optional().or(z.literal('')),
  manager_id: z.string().uuid().optional().or(z.literal('')),
  hire_date: z.date(),
  status: z.enum(['active', 'inactive', 'on_leave', 'terminated']),
  linkedin_url: z.string().url().optional().or(z.literal('')),
  twitter_url: z.string().url().optional().or(z.literal('')),
  slack_username: z.string().max(50).optional().or(z.literal('')),
  address: z.string().max(255).optional().or(z.literal('')),
  city: z.string().max(100).optional().or(z.literal('')),
  country: z.string().max(100).optional().or(z.literal('')),
  emirates_id: z.string().max(50).optional().or(z.literal('')),
  visa_status: z.string().max(50).optional().or(z.literal('')),
  visa_number: z.string().max(100).optional().or(z.literal('')),
  visa_expiry: z.date().optional().nullable(),
  passport_number: z.string().max(100).optional().or(z.literal('')),
  passport_expiry: z.date().optional().nullable(),
  uae_address: z.string().max(255).optional().or(z.literal('')),
  home_country_address: z.string().max(255).optional().or(z.literal('')),
  emergency_contact_uae_name: z.string().max(100).optional().or(z.literal('')),
  emergency_contact_uae_phone: z.string().max(50).optional().or(z.literal('')),
  emergency_contact_home_name: z.string().max(100).optional().or(z.literal('')),
  emergency_contact_home_phone: z.string().max(50).optional().or(z.literal('')),
  religion: z.string().max(50).optional().or(z.literal('')),
  nationality: z.string().max(100).optional().or(z.literal('')),
  marital_status: z.string().max(50).optional().or(z.literal('')),
});

type EmployeeFormValues = z.infer<typeof employeeFormSchema>;

interface EditEmployeeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: EmployeeWithRelations | null;
}

export function EditEmployeeModal({ open, onOpenChange, employee }: EditEmployeeModalProps) {
  const updateEmployee = useUpdateEmployee();
  const { data: locations = [] } = useLocations();
  const { data: departments = [] } = useDepartments();
  const { data: supervisors = [] } = useSupervisorOptions();

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      job_title: '',
      department_id: '',
      location_id: '',
      manager_id: '',
      hire_date: new Date(),
      status: 'active',
      linkedin_url: '',
      twitter_url: '',
      slack_username: '',
      address: '',
      city: '',
      country: '',
      emirates_id: '',
      visa_status: '',
      visa_number: '',
      visa_expiry: undefined,
      passport_number: '',
      passport_expiry: undefined,
      uae_address: '',
      home_country_address: '',
      emergency_contact_uae_name: '',
      emergency_contact_uae_phone: '',
      emergency_contact_home_name: '',
      emergency_contact_home_phone: '',
      religion: '',
      nationality: '',
      marital_status: '',
    },
  });

  // Update form values when employee changes
  useEffect(() => {
    if (employee) {
      form.reset({
        first_name: employee.first_name,
        last_name: employee.last_name,
        email: employee.email,
        phone: employee.phone || '',
        job_title: employee.job_title || '',
        department_id: employee.department_id || '',
        location_id: employee.location_id || '',
        manager_id: employee.manager_id || '',
        hire_date: new Date(employee.hire_date),
        status: employee.status,
        linkedin_url: employee.linkedin_url || '',
        twitter_url: employee.twitter_url || '',
        slack_username: employee.slack_username || '',
        address: employee.address || '',
        city: employee.city || '',
        country: employee.country || '',
        emirates_id: employee.emirates_id || '',
        visa_status: employee.visa_status || '',
        visa_number: employee.visa_number || '',
        visa_expiry: employee.visa_expiry ? new Date(employee.visa_expiry) : undefined,
        passport_number: employee.passport_number || '',
        passport_expiry: employee.passport_expiry ? new Date(employee.passport_expiry) : undefined,
        uae_address: employee.uae_address || '',
        home_country_address: employee.home_country_address || '',
        emergency_contact_uae_name: employee.emergency_contact_uae_name || '',
        emergency_contact_uae_phone: employee.emergency_contact_uae_phone || '',
        emergency_contact_home_name: employee.emergency_contact_home_name || '',
        emergency_contact_home_phone: employee.emergency_contact_home_phone || '',
        religion: employee.religion || '',
        nationality: employee.nationality || '',
        marital_status: employee.marital_status || '',
      });
    }
  }, [employee, form]);

  if (!employee) return null;

  const onSubmit = async (values: EmployeeFormValues) => {
    const updateData = {
      id: employee.id,
      first_name: values.first_name,
      last_name: values.last_name,
      email: values.email,
      phone: values.phone || null,
      job_title: values.job_title || null,
      hire_date: format(values.hire_date, 'yyyy-MM-dd'),
      status: values.status,
      department_id: values.department_id || null,
      location_id: values.location_id || null,
      manager_id: values.manager_id || null,
      linkedin_url: values.linkedin_url || null,
      twitter_url: values.twitter_url || null,
      slack_username: values.slack_username || null,
      address: values.address || null,
      city: values.city || null,
      country: values.country || null,
      emirates_id: values.emirates_id || null,
      visa_status: values.visa_status || null,
      visa_number: values.visa_number || null,
      visa_expiry: values.visa_expiry ? format(values.visa_expiry, 'yyyy-MM-dd') : null,
      passport_number: values.passport_number || null,
      passport_expiry: values.passport_expiry ? format(values.passport_expiry, 'yyyy-MM-dd') : null,
      uae_address: values.uae_address || null,
      home_country_address: values.home_country_address || null,
      emergency_contact_uae_name: values.emergency_contact_uae_name || null,
      emergency_contact_uae_phone: values.emergency_contact_uae_phone || null,
      emergency_contact_home_name: values.emergency_contact_home_name || null,
      emergency_contact_home_phone: values.emergency_contact_home_phone || null,
      religion: values.religion || null,
      nationality: values.nationality || null,
      marital_status: values.marital_status || null,
    };

    await updateEmployee.mutateAsync(updateData);
    onOpenChange(false);
  };

  const supervisorOptions = supervisors.filter((supervisor) => supervisor.id !== employee.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Intern</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">Personal Information</h3>
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

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email *</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="john.doe@company.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="+1 234 567 890" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Job Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">Job Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="job_title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Software Engineer" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="department_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {departments.map((dept) => (
                            <SelectItem key={dept.id} value={dept.id}>
                              {dept.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="location_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select location" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {locations.map((loc) => (
                            <SelectItem key={loc.id} value={loc.id}>
                              {loc.name} ({loc.city})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="manager_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Supervisor</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select supervisor" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {supervisorOptions.map((emp) => (
                            <SelectItem key={emp.id} value={emp.id}>
                              {emp.first_name} {emp.last_name}
                              {emp.job_title ? ` • ${emp.job_title}` : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        This controls which supervisor portal can access this intern.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="hire_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Hire Date *</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                'w-full pl-3 text-left font-normal',
                                !field.value && 'text-muted-foreground'
                              )}
                            >
                              {field.value ? format(field.value, 'PPP') : 'Pick a date'}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date > new Date()}
                            initialFocus
                            className="p-3 pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="on_leave">On Leave</SelectItem>
                          <SelectItem value="terminated">Terminated</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Social Links */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">Social Links</h3>
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="linkedin_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>LinkedIn</FormLabel>
                      <FormControl>
                        <Input placeholder="https://linkedin.com/in/..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="twitter_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Twitter</FormLabel>
                      <FormControl>
                        <Input placeholder="https://twitter.com/..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="slack_username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slack Username</FormLabel>
                      <FormControl>
                        <Input placeholder="@username" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Address */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">Address</h3>
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Street Address</FormLabel>
                    <FormControl>
                      <Input placeholder="123 Main St" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="New York" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Input placeholder="USA" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* UAE Compliance & Visas */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">UAE Compliance & Visas</h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="emirates_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Emirates ID</FormLabel>
                      <FormControl>
                        <Input placeholder="784-XXXX-XXXXXXX-X" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="visa_status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Visa Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ''}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="employment">Employment Visa</SelectItem>
                          <SelectItem value="dependent">Dependent Visa</SelectItem>
                          <SelectItem value="tourist">Tourist Visa</SelectItem>
                          <SelectItem value="golden">Golden Visa</SelectItem>
                          <SelectItem value="freelance">Freelance Visa</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="visa_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Visa Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Visa Number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="visa_expiry"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Visa Expiry</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                'w-full pl-3 text-left font-normal',
                                !field.value && 'text-muted-foreground'
                              )}
                            >
                              {field.value ? format(field.value, 'PPP') : 'Pick a date'}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value || undefined}
                            onSelect={field.onChange}
                            initialFocus
                            className="p-3 pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="passport_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Passport Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Passport Number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="passport_expiry"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Passport Expiry</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                'w-full pl-3 text-left font-normal',
                                !field.value && 'text-muted-foreground'
                              )}
                            >
                              {field.value ? format(field.value, 'PPP') : 'Pick a date'}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value || undefined}
                            onSelect={field.onChange}
                            initialFocus
                            className="p-3 pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Extended Addresses */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">Addresses</h3>
              <FormField
                control={form.control}
                name="uae_address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>UAE Address</FormLabel>
                    <FormControl>
                      <Input placeholder="Dubai Marina, Building X, Apt 123" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="home_country_address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Home Country Address</FormLabel>
                    <FormControl>
                      <Input placeholder="Permanent Address in Home Country" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Emergency Contacts */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">Emergency Contacts</h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="emergency_contact_uae_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>UAE Contact Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Local Emergency Contact" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="emergency_contact_uae_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>UAE Contact Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="+97150XXXXXXX" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="emergency_contact_home_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Home Contact Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Home Country Target" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="emergency_contact_home_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Home Contact Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="+1234567890" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Personal Details */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">Personal Details</h3>
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="nationality"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nationality</FormLabel>
                      <FormControl>
                        <Input placeholder="Nationality" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="religion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Religion</FormLabel>
                      <FormControl>
                        <Input placeholder="Religion" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="marital_status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Marital Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ''}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="single">Single</SelectItem>
                          <SelectItem value="married">Married</SelectItem>
                          <SelectItem value="divorced">Divorced</SelectItem>
                          <SelectItem value="widowed">Widowed</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateEmployee.isPending}>
                {updateEmployee.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog >
  );
}
