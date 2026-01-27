import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Edit2, 
  Trash2, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  Building2,
  User,
  Linkedin,
  Twitter,
  MessageSquare,
  Clock
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { 
  useEmployee, 
  useDeleteEmployee,
  useUploadAvatar,
  useEmployeeDocuments,
  useUploadDocument,
  useDeleteDocument,
  useDownloadDocument
} from '@/hooks/useEmployees';
import { AvatarUpload } from '@/components/employees/AvatarUpload';
import { DocumentUpload } from '@/components/employees/DocumentUpload';
import { EditEmployeeModal } from '@/components/employees/EditEmployeeModal';

const statusColors = {
  active: 'bg-hrms-success text-white',
  inactive: 'bg-muted-foreground text-white',
  on_leave: 'bg-hrms-warning text-white',
  terminated: 'bg-destructive text-white',
};

const statusLabels = {
  active: 'Active',
  inactive: 'Inactive',
  on_leave: 'On Leave',
  terminated: 'Terminated',
};

export default function EmployeeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin, userRole } = useAuth();
  const canEdit = isAdmin || userRole === 'hr_manager';

  const { data: employee, isLoading, error } = useEmployee(id || '');
  const deleteEmployee = useDeleteEmployee();
  const uploadAvatar = useUploadAvatar();
  const { data: documents = [] } = useEmployeeDocuments(id || '');
  const uploadDocument = useUploadDocument();
  const deleteDocument = useDeleteDocument();
  const downloadDocument = useDownloadDocument();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </MainLayout>
    );
  }

  if (error || !employee) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-96 gap-4">
          <p className="text-destructive">Employee not found</p>
          <Button onClick={() => navigate('/employees')}>Back to Employees</Button>
        </div>
      </MainLayout>
    );
  }

  const fullName = `${employee.first_name} ${employee.last_name}`;
  const initials = `${employee.first_name[0]}${employee.last_name[0]}`.toUpperCase();

  // Calculate tenure
  const hireDate = new Date(employee.hire_date);
  const now = new Date();
  const years = now.getFullYear() - hireDate.getFullYear();
  const months = now.getMonth() - hireDate.getMonth();
  const totalMonths = years * 12 + months;
  const tenureYears = Math.floor(totalMonths / 12);
  const tenureMonths = totalMonths % 12;
  const tenure = tenureYears > 0 
    ? `${tenureYears} Year${tenureYears !== 1 ? 's' : ''} ${tenureMonths} Month${tenureMonths !== 1 ? 's' : ''}`
    : `${tenureMonths} Month${tenureMonths !== 1 ? 's' : ''}`;

  const handleDelete = async () => {
    await deleteEmployee.mutateAsync(employee.id);
    navigate('/employees');
  };

  const handleAvatarUpload = (file: File) => {
    uploadAvatar.mutate({ employeeId: employee.id, file });
  };

  const handleDocumentUpload = (file: File) => {
    uploadDocument.mutate({ employeeId: employee.id, file });
  };

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate('/employees')} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Employees
          </Button>
          {canEdit && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsEditModalOpen(true)} className="gap-2">
                <Edit2 className="h-4 w-4" />
                Edit
              </Button>
              {isAdmin && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="gap-2">
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Employee</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete {fullName}? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          )}
        </div>

        {/* Profile Header Card */}
        <Card className="overflow-hidden">
          <div className="h-32 bg-primary relative" />
          <CardContent className="relative pb-6">
            <div className="absolute -top-16 left-6">
              {canEdit ? (
                <AvatarUpload
                  currentUrl={employee.avatar_url}
                  initials={initials}
                  onUpload={handleAvatarUpload}
                  isUploading={uploadAvatar.isPending}
                />
              ) : (
                <Avatar className="h-24 w-24 border-4 border-card">
                  <AvatarImage src={employee.avatar_url || ''} alt={fullName} />
                  <AvatarFallback className="text-2xl bg-muted text-foreground">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
            <div className="pt-12 sm:pt-0 sm:pl-32">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold">{fullName}</h1>
                    <Badge className={cn(statusColors[employee.status])}>
                      {statusLabels[employee.status]}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground">{employee.job_title || 'Employee'}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon">
                    <Mail className="h-4 w-4" />
                  </Button>
                  {employee.linkedin_url && (
                    <Button variant="outline" size="icon" asChild>
                      <a href={employee.linkedin_url} target="_blank" rel="noopener noreferrer">
                        <Linkedin className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                  {employee.twitter_url && (
                    <Button variant="outline" size="icon" asChild>
                      <a href={employee.twitter_url} target="_blank" rel="noopener noreferrer">
                        <Twitter className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                  {employee.slack_username && (
                    <Button variant="outline" size="icon">
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="details" className="space-y-4">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            {canEdit && <TabsTrigger value="documents">Documents</TabsTrigger>}
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{employee.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{employee.phone || 'Not provided'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Address</p>
                      <p className="font-medium">
                        {[employee.address, employee.city, employee.country].filter(Boolean).join(', ') || 'Not provided'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Employment Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Employment Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Department</p>
                      <p className="font-medium">{employee.department?.name || 'Not assigned'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Location</p>
                      <p className="font-medium">
                        {employee.location ? `${employee.location.name} (${employee.location.city})` : 'Not assigned'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Manager</p>
                      <p className="font-medium">
                        {employee.manager ? `${employee.manager.first_name} ${employee.manager.last_name}` : 'None'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Hire Date</p>
                      <p className="font-medium">
                        {new Date(employee.hire_date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Tenure</p>
                      <p className="font-medium">{tenure}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {canEdit && (
            <TabsContent value="documents">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Documents</CardTitle>
                </CardHeader>
                <CardContent>
                  <DocumentUpload
                    documents={documents}
                    onUpload={handleDocumentUpload}
                    onDelete={(doc) => deleteDocument.mutate({ 
                      id: doc.id, 
                      filePath: doc.file_path,
                      employeeId: employee.id 
                    })}
                    onDownload={(doc) => downloadDocument.mutate({ 
                      filePath: doc.file_path, 
                      fileName: doc.file_name 
                    })}
                    isUploading={uploadDocument.isPending}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>

      <EditEmployeeModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        employee={employee}
      />
    </MainLayout>
  );
}
