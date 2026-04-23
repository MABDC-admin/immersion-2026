import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import EmployeeDetail from "./pages/EmployeeDetail";
import Chat from "./pages/Chat";
import NotFound from "./pages/NotFound";

// HR Modules
import LeaveRequests from "./pages/leave/Requests";
import LeaveCalendar from "./pages/leave/Calendar";
import Attendance from "./pages/attendance/Attendance";
import Timesheets from "./pages/attendance/Timesheets";
import SupervisorAttendance from "./pages/attendance/SupervisorAttendance";
import AttendanceKiosk from "./pages/attendance/AttendanceKiosk";
import JobPostings from "./pages/recruitment/Jobs";
import Candidates from "./pages/recruitment/Candidates";
import PerformanceReviews from "./pages/performance/Reviews";
import NewHires from "./pages/onboarding/NewHires";
import Checklists from "./pages/onboarding/Checklists";
import OnboardingDocuments from "./pages/onboarding/Documents";
import Courses from "./pages/training/Courses";
import Journal from "./pages/journal/Journal";
import MyEvaluations from "./pages/evaluations/MyEvaluations";
import MyDocuments from "./pages/documents/MyDocuments";

// Public pages
import CareersPage from "./pages/careers/CareersPage";
import PublicJobApplication from "./pages/careers/PublicJobApplication";

// Admin
import AdminPanel from "./pages/admin/AdminPanel";
import OjtManagement from "./pages/admin/OjtManagement";
import EmployeeJournals from "./pages/admin/EmployeeJournals";

// Supervisor
import TaskDashboard from "./pages/supervisor/TaskDashboard";
import SupervisorJournalsView from "./pages/supervisor/SupervisorJournalsView";

// Intern
import MyTasks from "./pages/intern/MyTasks";

// Evaluations
import EvaluationsPage from "./pages/evaluations/Evaluations";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/auth" element={<Auth />} />
            <Route path="/careers" element={<CareersPage />} />
            <Route path="/careers/:jobId" element={<PublicJobApplication />} />
            <Route path="/kiosk/:supervisorId" element={<AttendanceKiosk />} />

            <Route path="/" element={<ProtectedRoute><Navigate to="/dashboard" replace /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/employees" element={<ProtectedRoute><Employees /></ProtectedRoute>} />
            <Route path="/employees/:id" element={<ProtectedRoute><EmployeeDetail /></ProtectedRoute>} />
            <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />

            {/* Profile & Navigation */}
            <Route path="/profile" element={<ProtectedRoute><Navigate to="/dashboard" replace /></ProtectedRoute>} />

            {/* Leave Module */}
            <Route path="/leave/requests" element={<ProtectedRoute><LeaveRequests /></ProtectedRoute>} />
            <Route path="/leave/balance" element={<ProtectedRoute><LeaveRequests /></ProtectedRoute>} />
            <Route path="/leave/calendar" element={<ProtectedRoute><LeaveCalendar /></ProtectedRoute>} />

            {/* Attendance Module */}
            <Route path="/attendance" element={<ProtectedRoute><Attendance /></ProtectedRoute>} />
            <Route path="/attendance/timesheets" element={<ProtectedRoute><Timesheets /></ProtectedRoute>} />
            <Route path="/attendance/reports" element={<ProtectedRoute><Attendance /></ProtectedRoute>} />
            <Route path="/supervisor/attendance" element={<ProtectedRoute><SupervisorAttendance /></ProtectedRoute>} />

            {/* Recruitment Module */}
            <Route path="/recruitment/jobs" element={<ProtectedRoute><JobPostings /></ProtectedRoute>} />
            <Route path="/recruitment/candidates" element={<ProtectedRoute><Candidates /></ProtectedRoute>} />

            {/* Performance Module */}
            <Route path="/performance/reviews" element={<ProtectedRoute><PerformanceReviews /></ProtectedRoute>} />
            <Route path="/performance/goals" element={<ProtectedRoute><PerformanceReviews /></ProtectedRoute>} />
            <Route path="/performance/feedback" element={<ProtectedRoute><PerformanceReviews /></ProtectedRoute>} />

            {/* Onboarding Module */}
            <Route path="/onboarding/new-hires" element={<ProtectedRoute><NewHires /></ProtectedRoute>} />
            <Route path="/onboarding/checklists" element={<ProtectedRoute><Checklists /></ProtectedRoute>} />
            <Route path="/onboarding/documents" element={<ProtectedRoute><OnboardingDocuments /></ProtectedRoute>} />

            {/* Training Module */}
            <Route path="/training/courses" element={<ProtectedRoute><Courses /></ProtectedRoute>} />
            <Route path="/training/enrollments" element={<ProtectedRoute><Courses /></ProtectedRoute>} />
            <Route path="/training/certificates" element={<ProtectedRoute><Courses /></ProtectedRoute>} />

            {/* Admin */}
            <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />

            {/* New Intern Modules */}
            <Route path="/journal" element={<ProtectedRoute><Journal /></ProtectedRoute>} />
            <Route path="/journal/:internId" element={<ProtectedRoute><Journal /></ProtectedRoute>} />
            <Route path="/my-evaluations" element={<ProtectedRoute><MyEvaluations /></ProtectedRoute>} />
            <Route path="/my-documents" element={<ProtectedRoute><MyDocuments /></ProtectedRoute>} />

            {/* Evaluations */}
            <Route path="/evaluations" element={<ProtectedRoute><EvaluationsPage /></ProtectedRoute>} />

            {/* Admin OJT + Supervisor Tasks + Intern Tasks */}
            <Route path="/admin/ojt" element={<ProtectedRoute><OjtManagement /></ProtectedRoute>} />
            <Route path="/admin/employee-journals" element={<ProtectedRoute><EmployeeJournals /></ProtectedRoute>} />
            <Route
              path="/supervisor/tasks"
              element={
                <ProtectedRoute allowedRoles={['admin', 'hr_manager', 'supervisor']}>
                  <TaskDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/supervisor/journals"
              element={
                <ProtectedRoute allowedRoles={['admin', 'hr_manager', 'supervisor']}>
                  <SupervisorJournalsView />
                </ProtectedRoute>
              }
            />
            <Route path="/my-tasks" element={<ProtectedRoute><MyTasks /></ProtectedRoute>} />

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
