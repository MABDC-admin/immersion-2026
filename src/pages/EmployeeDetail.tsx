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
  History
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
import { useAttendance, useTodayAttendance, useClockIn, useClockOut } from '@/hooks/useAttendance';
import { useLeaveRequests } from '@/hooks/useLeave';
import { useEnrollments } from '@/hooks/useTraining';
import { useLeaveBalances, useAnnouncements } from '@/hooks/useDashboard';
import { AvatarUpload } from '@/components/employees/AvatarUpload';
import { DocumentUpload } from '@/components/employees/DocumentUpload';
import { EditEmployeeModal } from '@/components/employees/EditEmployeeModal';
import { TodaySummaryCards } from '@/components/profile/TodaySummaryCards';
import { QuickActions } from '@/components/profile/QuickActions';
import { AnnouncementsWidget } from '@/components/profile/AnnouncementsWidget';
import { MyTasksWidget } from '@/components/profile/MyTasksWidget';
import { CalendarPreview } from '@/components/profile/CalendarPreview';
import { CreateLeaveModal } from '@/components/leave/CreateLeaveModal';
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

  // Dashboard Data
  const { data: attendanceHistory = [] } = useAttendance(id);
  const { data: todayAttendance } = useTodayAttendance(id || '');
  const clockIn = useClockIn();
  const clockOut = useClockOut();
  const { data: leaveRequests = [] } = useLeaveRequests(id);
  const { data: leaveBalances = [] } = useLeaveBalances(id || '');
  const { data: enrollments = [] } = useEnrollments(id);
  const { data: announcements = [] } = useAnnouncements();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);

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

  const handleClockIn = () => {
    if (id) clockIn.mutate({ employeeId: id });
  };

  const handleClockOut = () => {
    if (todayAttendance?.id) clockOut.mutate({ id: todayAttendance.id });
  };

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate('/employees')} className="gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to Directory
          </Button>
          {(isAdmin || userRole === 'hr_manager') && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsEditModalOpen(true)} className="gap-2">
                <Edit2 className="h-4 w-4" />
                Admin Edit
              </Button>
              {isAdmin && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="gap-2">
                      <Trash2 className="h-4 w-4" />
                      Archive
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Archive Employee Record</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to archive {fullName}'s record? This will hide them from active lists.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                        Archive
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          )}
        </div>

        {/* Profile Stats Overview */}
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <Card className="w-full md:w-80 shrink-0">
            <CardContent className="pt-6 text-center">
              <div className="flex flex-col items-center">
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
                <h1 className="text-xl font-bold mt-4">{fullName}</h1>
                <p className="text-sm text-muted-foreground">{employee.job_title || 'Employee'}</p>
                <Badge className={cn("mt-2", statusColors[employee.status])}>
                  {statusLabels[employee.status]}
                </Badge>
              </div>
              <div className="mt-6 space-y-3 pt-6 border-t">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span className="truncate">{employee.email}</span>
                </div>
                {employee.phone && (
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{employee.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Building2 className="h-4 w-4" />
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
            <Tabs defaultValue="dashboard" className="space-y-6">
              <TabsList className="w-full justify-start overflow-x-auto h-auto p-1 bg-muted/30">
                <TabsTrigger value="dashboard" className="gap-2">
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </TabsTrigger>
                <TabsTrigger value="profile" className="gap-2">
                  <User className="h-4 w-4" />
                  Profile
                </TabsTrigger>
                <TabsTrigger value="attendance" className="gap-2">
                  <Clock className="h-4 w-4" />
                  Attendance
                </TabsTrigger>
                <TabsTrigger value="leave" className="gap-2">
                  <ClipboardList className="h-4 w-4" />
                  Leave
                </TabsTrigger>
                <TabsTrigger value="training" className="gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Training
                </TabsTrigger>
              </TabsList>

              <TabsContent value="dashboard" className="space-y-6">
                <TodaySummaryCards
                  attendance={todayAttendance}
                  leaveBalances={leaveBalances}
                  enrollments={enrollments}
                />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-6">
                    <QuickActions
                      onClockIn={handleClockIn}
                      onClockOut={handleClockOut}
                      onRequestLeave={() => setIsLeaveModalOpen(true)}
                      onUpdateProfile={() => setIsEditModalOpen(true)}
                      isClockedIn={!!todayAttendance?.clock_in && !todayAttendance?.clock_out}
                      isClocking={clockIn.isPending || clockOut.isPending}
                    />
                    <AnnouncementsWidget announcements={announcements} />
                  </div>
                  <div className="space-y-6">
                    <MyTasksWidget
                      incompleteRequiredCourses={enrollments.filter(e => e.status !== 'completed')}
                    />
                    <CalendarPreview leaveRequests={leaveRequests} />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="profile" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Personal Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
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

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Work Context</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground uppercase font-medium">Job Title</p>
                          <p className="text-sm font-medium">{employee.job_title || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase font-medium">Department</p>
                          <p className="text-sm font-medium">{employee.department?.name || 'Unassigned'}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
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
                      <div className="grid grid-cols-2 gap-4">
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

                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle className="text-lg">Employment Documents</CardTitle>
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

              <TabsContent value="attendance" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Attendance History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {attendanceHistory.map((record) => (
                        <div key={record.id} className="flex items-center justify-between p-3 rounded-md border bg-card">
                          <div className="flex items-center gap-4">
                            <div className="flex flex-col">
                              <span className="text-sm font-semibold">{format(new Date(record.date), 'EEE, MMM d')}</span>
                              <span className="text-xs text-muted-foreground">
                                {record.clock_in ? format(new Date(record.clock_in), 'hh:mm a') : 'Missed'} -
                                {record.clock_out ? format(new Date(record.clock_out), ' hh:mm a') : ' Pending'}
                              </span>
                            </div>
                          </div>
                          <Badge variant="outline" className={record.status === 'present' ? 'text-hrms-success border-hrms-success/20 bg-hrms-success/5' : ''}>
                            {record.status}
                          </Badge>
                        </div>
                      ))}
                      {attendanceHistory.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-8">No attendance records found</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="leave" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-1 space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Leave Balances</CardTitle>
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
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg text-foreground">Recent Requests</CardTitle>
                        <Button variant="outline" size="sm" onClick={() => setIsLeaveModalOpen(true)}>New Request</Button>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {leaveRequests.map((request) => (
                            <div key={request.id} className="flex items-center justify-between p-3 rounded-md border bg-card">
                              <div className="flex flex-col">
                                <span className="text-sm font-semibold">{request.leave_type}</span>
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(request.start_date), 'MMM d')} - {format(new Date(request.end_date), 'MMM d, yyyy')}
                                </span>
                              </div>
                              <Badge variant="outline" className={
                                request.status === 'approved' ? 'text-hrms-success border-hrms-success/20 bg-hrms-success/5' :
                                  request.status === 'pending' ? 'text-hrms-warning border-hrms-warning/20 bg-hrms-warning/5' : ''
                              }>
                                {request.status}
                              </Badge>
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

              <TabsContent value="training" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Enrolled Courses</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {enrollments.map((enr) => (
                        <div key={enr.id} className="p-4 rounded-lg border bg-muted/20 space-y-3">
                          <div className="flex justify-between items-start">
                            <h4 className="font-semibold text-sm">{enr.course?.title}</h4>
                            <Badge className={enr.status === 'completed' ? 'bg-hrms-success' : 'bg-primary'}>
                              {enr.status}
                            </Badge>
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] text-muted-foreground uppercase">
                              <span>Progress</span>
                              <span>{enr.progress || 0}%</span>
                            </div>
                            <div className="w-full bg-muted h-1 rounded-full overflow-hidden">
                              <div
                                className="bg-primary h-full transition-all"
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
    </MainLayout>
  );
}
