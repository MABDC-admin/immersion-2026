import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';

export interface ImpersonationTarget {
  userId: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

interface ImpersonationContextType {
  /** The user currently being impersonated, or null */
  impersonating: ImpersonationTarget | null;
  /** Whether impersonation mode is active */
  isImpersonating: boolean;
  /** Start impersonating a user (admin only) */
  startImpersonation: (target: ImpersonationTarget) => void;
  /** Stop impersonating and return to admin view */
  stopImpersonation: () => void;
  /** The effective role — impersonated role if active, otherwise real role */
  effectiveRole: string | null;
  /** The effective user ID — impersonated user if active, otherwise real user */
  effectiveUserId: string | null;
  /** The effective employee ID — impersonated employee if active, otherwise real employee */
  effectiveEmployeeId: string | null;
}

const ImpersonationContext = createContext<ImpersonationContextType | undefined>(undefined);

export function ImpersonationProvider({ children }: { children: ReactNode }) {
  const { isAdmin, user, userRole } = useAuth();
  const [impersonating, setImpersonating] = useState<ImpersonationTarget | null>(null);

  const startImpersonation = useCallback(
    (target: ImpersonationTarget) => {
      if (!isAdmin) return;
      setImpersonating(target);
    },
    [isAdmin]
  );

  const stopImpersonation = useCallback(() => {
    setImpersonating(null);
  }, []);

  const isImpersonating = !!impersonating;
  const effectiveRole = impersonating ? impersonating.role : userRole;
  const effectiveUserId = impersonating ? impersonating.userId : user?.id ?? null;
  const effectiveEmployeeId = impersonating ? impersonating.employeeId : null;

  return (
    <ImpersonationContext.Provider
      value={{
        impersonating,
        isImpersonating,
        startImpersonation,
        stopImpersonation,
        effectiveRole,
        effectiveUserId,
        effectiveEmployeeId,
      }}
    >
      {children}
    </ImpersonationContext.Provider>
  );
}

export function useImpersonation() {
  const context = useContext(ImpersonationContext);
  if (context === undefined) {
    throw new Error('useImpersonation must be used within an ImpersonationProvider');
  }
  return context;
}
