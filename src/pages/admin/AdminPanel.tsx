import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Users, Building, UserCheck, DollarSign, Clock, BarChart3, GitBranch, Lock, Wrench } from 'lucide-react';
import { BookOpen } from 'lucide-react';
import { UserManagementTab } from '@/components/admin/UserManagementTab';
import { CompanySetupTab } from '@/components/admin/CompanySetupTab';
import { EmployeeOversightTab } from '@/components/admin/EmployeeOversightTab';
import { PayrollConfigTab } from '@/components/admin/PayrollConfigTab';
import { AttendanceLeaveTab } from '@/components/admin/AttendanceLeaveTab';
import { ReportsTab } from '@/components/admin/ReportsTab';
import { WorkflowTab } from '@/components/admin/WorkflowTab';
import { SecurityTab } from '@/components/admin/SecurityTab';
import { MaintenanceTab } from '@/components/admin/MaintenanceTab';
import { JournalsTab } from '@/components/admin/JournalsTab';

export default function AdminPanel() {
  const { isAdmin } = useAuth();

  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Shield className="h-6 w-6" />Admin Panel
          </h1>
          <p className="text-muted-foreground">Manage your organization's settings, users, and configurations.</p>
        </div>

        <Tabs defaultValue="users" className="w-full">
          <TabsList className="flex flex-wrap h-auto gap-1">
            <TabsTrigger value="users" className="text-xs"><Users className="h-3.5 w-3.5 mr-1" />Users</TabsTrigger>
            <TabsTrigger value="company" className="text-xs"><Building className="h-3.5 w-3.5 mr-1" />Company</TabsTrigger>
            <TabsTrigger value="employees" className="text-xs"><UserCheck className="h-3.5 w-3.5 mr-1" />Interns</TabsTrigger>
            <TabsTrigger value="payroll" className="text-xs"><DollarSign className="h-3.5 w-3.5 mr-1" />Payroll</TabsTrigger>
            <TabsTrigger value="attendance" className="text-xs"><Clock className="h-3.5 w-3.5 mr-1" />Attendance</TabsTrigger>
            <TabsTrigger value="reports" className="text-xs"><BarChart3 className="h-3.5 w-3.5 mr-1" />Reports</TabsTrigger>
            <TabsTrigger value="workflows" className="text-xs"><GitBranch className="h-3.5 w-3.5 mr-1" />Workflows</TabsTrigger>
            <TabsTrigger value="security" className="text-xs"><Lock className="h-3.5 w-3.5 mr-1" />Security</TabsTrigger>
            <TabsTrigger value="maintenance" className="text-xs"><Wrench className="h-3.5 w-3.5 mr-1" />System</TabsTrigger>
            <TabsTrigger value="journals" className="text-xs"><BookOpen className="h-3.5 w-3.5 mr-1" />Journals</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-4"><UserManagementTab /></TabsContent>
          <TabsContent value="company" className="mt-4"><CompanySetupTab /></TabsContent>
          <TabsContent value="employees" className="mt-4"><EmployeeOversightTab /></TabsContent>
          <TabsContent value="payroll" className="mt-4"><PayrollConfigTab /></TabsContent>
          <TabsContent value="attendance" className="mt-4"><AttendanceLeaveTab /></TabsContent>
          <TabsContent value="reports" className="mt-4"><ReportsTab /></TabsContent>
          <TabsContent value="workflows" className="mt-4"><WorkflowTab /></TabsContent>
          <TabsContent value="security" className="mt-4"><SecurityTab /></TabsContent>
          <TabsContent value="maintenance" className="mt-4"><MaintenanceTab /></TabsContent>
          <TabsContent value="journals" className="mt-4"><JournalsTab /></TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
