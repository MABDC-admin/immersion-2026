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
import NotFound from "./pages/NotFound";

// HR Modules
import LeaveRequests from "./pages/leave/Requests";
import LeaveCalendar from "./pages/leave/Calendar";
import Attendance from "./pages/attendance/Attendance";
import Timesheets from "./pages/attendance/Timesheets";
import JobPostings from "./pages/recruitment/Jobs";
import Candidates from "./pages/recruitment/Candidates";
import PerformanceReviews from "./pages/performance/Reviews";
import NewHires from "./pages/onboarding/NewHires";
import Checklists from "./pages/onboarding/Checklists";
import OnboardingDocuments from "./pages/onboarding/Documents";
import Courses from "./pages/training/Courses";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Navigate to="/dashboard" replace />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employees"
              element={
                <ProtectedRoute>
                  <Employees />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employees/:id"
              element={
                <ProtectedRoute>
                  <EmployeeDetail />
                </ProtectedRoute>
              }
            />

            {/* Leave Module */}
            <Route path="/leave/requests" element={<ProtectedRoute><LeaveRequests /></ProtectedRoute>} />
            <Route path="/leave/balance" element={<ProtectedRoute><LeaveRequests /></ProtectedRoute>} />
            <Route path="/leave/calendar" element={<ProtectedRoute><LeaveCalendar /></ProtectedRoute>} />

            {/* Attendance Module */}
            <Route path="/attendance" element={<ProtectedRoute><Attendance /></ProtectedRoute>} />
            <Route path="/attendance/timesheets" element={<ProtectedRoute><Timesheets /></ProtectedRoute>} />
            <Route path="/attendance/reports" element={<ProtectedRoute><Attendance /></ProtectedRoute>} />

            {/* Recruitment Module */}
            <Route path="/recruitment/jobs" element={<ProtectedRoute><JobPostings /></ProtectedRoute>} />
            <Route path="/recruitment/candidates" element={<ProtectedRoute><Candidates /></ProtectedRoute>} />
            <Route path="/recruitment/interviews" element={<ProtectedRoute><JobPostings /></ProtectedRoute>} />

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
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
