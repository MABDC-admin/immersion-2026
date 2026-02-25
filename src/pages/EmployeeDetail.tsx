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
  Clock,
  LayoutDashboard,
  ClipboardList,
  GraduationCap,
  History,
  Users,
  ClipboardCheck
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
import { useAttendance } from '@/hooks/useAttendance';
import { useLeaveRequests } from '@/hooks/useLeave';
import { useEnrollments } from '@/hooks/useTraining';
import { useLeaveBalances } from '@/hooks/useDashboard';
import { EmployeeDashboardView } from '@/components/profile/EmployeeDashboardView';
import { AvatarUpload } from '@/components/employees/AvatarUpload';
import { DocumentUpload } from '@/components/employees/DocumentUpload';
import { EditEmployeeModal } from '@/components/employees/EditEmployeeModal';
import { CreateLeaveModal } from '@/components/leave/CreateLeaveModal';
import { InternsList } from '@/components/supervisor/InternsList';
import { EvaluationForm } from '@/components/evaluations/EvaluationForm';
import { EvaluationDetail } from '@/components/evaluations/EvaluationDetail';
import { useEvaluations, InternEvaluation } from '@/hooks/useEvaluations';
import { format } from 'date-fns';

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
  const { user, isAdmin, userRole } = useAuth();
  const isOwnProfile = user?.id === id;
  const canEdit = isAdmin || userRole === 'hr_manager' || isOwnProfile;

  const { data: employee, isLoading, error } = useEmployee(id || '');
  const deleteEmployee = useDeleteEmployee();
  const uploadAvatar = useUploadAvatar();
  const { data: documents = [] } = useEmployeeDocuments(id || '');
  const uploadDocument = useUploadDocument();
  const deleteDocument = useDeleteDocument();
  const downloadDocument = useDownloadDocument();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isEvalFormOpen, setIsEvalFormOpen] = useState(false);
  const [preselectedInternId, setPreselectedInternId] = useState<string | null>(null);
  const [selectedEvalView, setSelectedEvalView] = useState<InternEvaluation | null>(null);
  const [selectedEvalEdit, setSelectedEvalEdit] = useState<InternEvaluation | null>(null);

  // Tabs Data
  const { data: attendanceHistory = [] } = useAttendance(id || '');
  const { data: leaveRequests = [] } = useLeaveRequests(id || '');
  const { data: leaveBalances = [] } = useLeaveBalances(id || '');
  const { data: enrollments = [] } = useEnrollments(id || '');

  // Evaluations data (must be before early returns to satisfy React hooks rules)
  const isSupervisorProfile = employee?.job_title?.toLowerCase().includes('supervisor') ?? false;
  const { data: evaluations = [] } = useEvaluations(isSupervisorProfile && isAdmin ? (employee?.id || '') : '');

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


  const handleEvaluateIntern = (internId: string) => {
    setPreselectedInternId(internId);
    setSelectedEvalEdit(null);
    setIsEvalFormOpen(true);
  };

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
      <div className="space-y-6 animate-fade-in max-w-full overflow-x-hidden p-1">
        {/* ===== EMPLOYEE PROFILE VIEW: Profile card + tabs ===== */}
        <>
          {/* Header Actions */}
          <div className="flex items-center justify-between gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="text-muted-foreground hover:text-foreground -ml-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>

            {(isAdmin || userRole === 'hr_manager') && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsEditModalOpen(true)} className="gap-2">
                  <Edit2 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Admin Edit</span>
                  <span className="sm:hidden text-xs">Edit</span>
                </Button>
                {isAdmin && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" className="gap-2">
                        <Trash2 className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Archive</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="w-[90vw] max-w-md rounded-xl">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Archive Record</AlertDialogTitle>
                        <AlertDialogDescription>
                          Archive {fullName}'s record? This will hide them from active lists.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                        <AlertDialogCancel className="rounded-lg mt-0">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90 rounded-lg">
                          Archive
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            )}
          </div>

          {/* Profile Content */}
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            <Card className="w-full lg:w-80 shrink-0 border-l-4 border-l-primary shadow-sm hover:shadow-md transition-all duration-300">
              <CardContent className="pt-8 pb-6 px-5 text-center sm:text-left lg:text-center">
                <div className="flex flex-col items-center sm:items-start lg:items-center">
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
                  <h1 className="text-2xl font-bold mt-4 text-foreground">{fullName}</h1>
                  <p className="text-sm font-semibold text-primary mt-1">{employee.job_title || 'Employee'}</p>
                  <Badge className={cn("mt-3 px-3 py-1 text-[10px] uppercase tracking-wider font-bold rounded-full shadow-sm", statusColors[employee.status])}>
                    {statusLabels[employee.status]}
                  </Badge>
                </div>
                <div className="mt-8 space-y-4 pt-6 border-t border-muted/30">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground justify-center sm:justify-start lg:justify-center">
                    <div className="p-2 rounded-lg bg-primary/5">
                      <Mail className="h-4 w-4 text-primary" />
                    </div>
                    <span className="truncate max-w-[200px]">{employee.email}</span>
                  </div>
                  {employee.phone && (
                    <div className="flex items-center gap-3 text-sm text-muted-foreground justify-center sm:justify-start lg:justify-center">
                      <div className="p-2 rounded-lg bg-primary/5">
                        <Phone className="h-4 w-4 text-primary" />
                      </div>
                      <span>{employee.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-sm text-muted-foreground justify-center sm:justify-start lg:justify-center">
                    <div className="p-2 rounded-lg bg-primary/5">
                      <Building2 className="h-4 w-4 text-primary" />
                    </div>
                    <span>{employee.department?.name || 'Unassigned'}</span>
                  </div>
                </div>
                <div className="mt-6 pt-6 border-t flex justify-center gap-4">
                  {employee.linkedin_url && (
                    <a href={employee.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                      <Linkedin className="h-5 w-5" />
                    </a>
                  )}
                  {employee.twitter_url && (
                    <a href={employee.twitter_url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                      <Twitter className="h-5 w-5" />
                    </a>
                  )}
                  {employee.slack_username && (
                    <div className="text-muted-foreground hover:text-primary cursor-pointer">
                      <MessageSquare className="h-5 w-5" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="flex-1 w-full min-w-0">
              <Tabs defaultValue="dashboard" className="space-y-6 w-full">
                <div className="sticky top-0 z-10 -mx-4 px-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-2 border-b lg:border-none lg:p-0 lg:static overflow-hidden">
                  <TabsList className="w-full justify-start overflow-x-auto h-auto p-1 bg-muted/40 no-scrollbar flex-nowrap scrollbar-hide">
                    <TabsTrigger value="dashboard" className="gap-1.5 min-w-fit px-3 py-1.5 text-[10px] sm:text-xs rounded-lg data-[state=active]:shadow-sm">
                      <LayoutDashboard className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                      Dash
                    </TabsTrigger>
                    <TabsTrigger value="profile" className="gap-1.5 min-w-fit px-3 py-1.5 text-[10px] sm:text-xs rounded-lg data-[state=active]:shadow-sm">
                      <User className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                      Profile
                    </TabsTrigger>
                    <TabsTrigger value="leave" className="gap-1.5 min-w-fit px-3 py-1.5 text-[10px] sm:text-xs rounded-lg data-[state=active]:shadow-sm">
                      <ClipboardList className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                      Leave
                    </TabsTrigger>
                    <TabsTrigger value="training" className="gap-1.5 min-w-fit px-3 py-1.5 text-[10px] sm:text-xs rounded-lg data-[state=active]:shadow-sm">
                      <GraduationCap className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                      Training
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="dashboard" className="space-y-6">
                  <EmployeeDashboardView
                    employeeId={id || ''}
                    onUpdateProfile={() => setIsEditModalOpen(true)}
                  />
                </TabsContent>

                <TabsContent value="profile" className="space-y-6 focus-visible:outline-none">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="border-l-4 border-l-primary shadow-sm">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg font-bold">Personal Details</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground uppercase font-medium">First Name</p>
                            <p className="text-sm font-medium">{employee.first_name}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground uppercase font-medium">Last Name</p>
                            <p className="text-sm font-medium">{employee.last_name}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase font-medium">Email Address</p>
                          <p className="text-sm font-medium">{employee.email}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase font-medium">Residential Address</p>
                          <p className="text-sm font-medium">
                            {[employee.address, employee.city, employee.country].filter(Boolean).join(', ') || 'Not provided'}
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-hrms-warning shadow-sm">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg font-bold">Work Context</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground uppercase font-medium">Job Title</p>
                            <p className="text-sm font-medium">{employee.job_title || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground uppercase font-medium">Department</p>
                            <p className="text-sm font-medium">{employee.department?.name || 'Unassigned'}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground uppercase font-medium">Reporting Manager</p>
                            <p className="text-sm font-medium">
                              {employee.manager ? `${employee.manager.first_name} ${employee.manager.last_name}` : 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground uppercase font-medium">Base Location</p>
                            <p className="text-sm font-medium">
                              {employee.location ? `${employee.location.name} (${employee.location.city})` : 'N/A'}
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground uppercase font-medium">Hire Date</p>
                            <p className="text-sm font-medium">{format(new Date(employee.hire_date), 'MMMM d, yyyy')}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground uppercase font-medium">Current Tenure</p>
                            <p className="text-sm font-medium">{tenure}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="lg:col-span-2 border-l-4 border-l-hrms-success shadow-sm">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg font-bold">Employment Documents</CardTitle>
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
                  </div>
                </TabsContent>

                {/* Shared tabs: Leave & Training */}
                <TabsContent value="leave" className="space-y-6 focus-visible:outline-none">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1 space-y-6">
                      <Card className="border-l-4 border-l-hrms-warning shadow-sm">
                        <CardHeader>
                          <CardTitle className="text-lg font-bold">Leave Balances</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {leaveBalances.map((balance) => (
                            <div key={balance.id} className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span>{balance.leave_type}</span>
                                <span className="font-semibold">{balance.remaining_days} / {balance.total_days} Days</span>
                              </div>
                              <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                                <div
                                  className="bg-primary h-full transition-all"
                                  style={{ width: `${(balance.used_days / balance.total_days) * 100}%` }}
                                />
                              </div>
                            </div>
                          ))}
                          {leaveBalances.length === 0 && (
                            <p className="text-sm text-muted-foreground">No leave balances configured</p>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                    <div className="lg:col-span-2">
                      <Card className="border-l-4 border-l-primary shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-3">
                          <CardTitle className="text-lg font-bold text-foreground">Recent Requests</CardTitle>
                          <Button variant="outline" size="sm" onClick={() => setIsLeaveModalOpen(true)} className="rounded-lg h-8 text-xs">New Request</Button>
                        </CardHeader>
                        <CardContent className="px-3 sm:px-6">
                          <div className="space-y-3">
                            {leaveRequests.map((request) => (
                              <div key={request.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border bg-card gap-2 shadow-sm">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 rounded-lg bg-hrms-warning/5">
                                    <ClipboardList className="h-4 w-4 text-hrms-warning" />
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-sm font-bold">{request.leave_type}</span>
                                    <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">
                                      {format(new Date(request.start_date), 'MMM d')} - {format(new Date(request.end_date), 'MMM d, yyyy')}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto">
                                  <span className="text-[10px] sm:hidden text-muted-foreground font-medium italic">Status:</span>
                                  <Badge variant="outline" className={cn(
                                    "text-[10px] font-bold uppercase px-2 py-0.5 rounded-full",
                                    request.status === 'approved' ? 'text-hrms-success border-hrms-success/20 bg-hrms-success/5' :
                                      request.status === 'pending' ? 'text-hrms-warning border-hrms-warning/20 bg-hrms-warning/5' : 'text-muted-foreground'
                                  )}>
                                    {request.status}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                            {leaveRequests.length === 0 && (
                              <p className="text-sm text-muted-foreground text-center py-8">No leave requests found</p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="training" className="space-y-6 focus-visible:outline-none">
                  <Card className="border-l-4 border-l-primary shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-lg font-bold">Enrolled Courses</CardTitle>
                    </CardHeader>
                    <CardContent className="px-3 sm:px-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {enrollments.map((enr) => (
                          <div key={enr.id} className="p-4 rounded-xl border bg-card shadow-sm space-y-3">
                            <div className="flex justify-between items-start gap-4">
                              <h4 className="font-bold text-sm leading-tight">{enr.course?.title}</h4>
                              <Badge className={cn(
                                "text-[9px] font-bold uppercase px-2 rounded-full shrink-0",
                                enr.status === 'completed' ? 'bg-hrms-success' : 'bg-primary'
                              )}>
                                {enr.status}
                              </Badge>
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between text-[9px] text-muted-foreground font-bold uppercase tracking-wider">
                                <span>Course Progress</span>
                                <span>{enr.progress || 0}%</span>
                              </div>
                              <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden shadow-inner">
                                <div
                                  className="bg-primary h-full transition-all duration-500 rounded-full"
                                  style={{ width: `${enr.progress || 0}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                        {enrollments.length === 0 && (
                          <p className="text-sm text-muted-foreground text-center py-8 col-span-2">Not enrolled in any courses</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* Admin: show Interns list if viewing a supervisor's profile */}
          {isSupervisorProfile && isAdmin && (
            <div className="space-y-6 mt-6">
              <Card className="border-l-4 border-l-primary shadow-sm">
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <CardTitle className="text-lg font-bold">Assigned Interns</CardTitle>
                  <Button variant="outline" size="sm" className="gap-2 text-xs" onClick={() => { setSelectedEvalEdit(null); setPreselectedInternId(null); setIsEvalFormOpen(true); }}>
                    <ClipboardCheck className="h-3.5 w-3.5" />
                    New Evaluation
                  </Button>
                </CardHeader>
                <CardContent>
                  <InternsList supervisorId={employee.id} onEvaluate={handleEvaluateIntern} />
                </CardContent>
              </Card>
            </div>
          )}
        </>
      </div>

      <EditEmployeeModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        employee={employee}
      />

      <CreateLeaveModal
        open={isLeaveModalOpen}
        onOpenChange={setIsLeaveModalOpen}
      />

      {isSupervisorProfile && isAdmin && (
        <>
          <EvaluationForm
            open={isEvalFormOpen}
            onOpenChange={setIsEvalFormOpen}
            evaluatorId={employee.id}
            evaluation={selectedEvalEdit}
            preselectedInternId={preselectedInternId}
          />
          <EvaluationDetail
            open={!!selectedEvalView}
            onOpenChange={() => setSelectedEvalView(null)}
            evaluation={selectedEvalView}
          />
        </>
      )}
    </MainLayout>
  );
}
