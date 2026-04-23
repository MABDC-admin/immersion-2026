import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

type AppRole = 'admin' | 'hr_manager' | 'principal' | 'employee' | 'manager' | 'payroll_officer' | 'supervisor';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'admin' | 'hr_manager' | 'employee';
  allowedRoles?: AppRole[];
}

export function ProtectedRoute({ children, requiredRole, allowedRoles }: ProtectedRouteProps) {
  const location = useLocation();
  const { user, isLoading, userRole, isAdmin, isHrManager } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Check role requirements
  if (requiredRole) {
    if (requiredRole === 'admin' && !isAdmin) {
      return <Navigate to="/" replace />;
    }
    if (requiredRole === 'hr_manager' && !isAdmin && !isHrManager) {
      return <Navigate to="/" replace />;
    }
  }

  if (allowedRoles && (!userRole || !allowedRoles.includes(userRole))) {
    return <Navigate to="/dashboard" replace />;
  }

  if (userRole === 'principal') {
    const principalAllowed =
      location.pathname === '/' ||
      location.pathname === '/dashboard' ||
      location.pathname === '/employees' ||
      location.pathname.startsWith('/employees/');

    if (!principalAllowed) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
}
