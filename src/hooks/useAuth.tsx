import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type AppRole = 'admin' | 'hr_manager' | 'principal' | 'employee' | 'manager' | 'payroll_officer' | 'supervisor';
const ROLE_PRIORITY: AppRole[] = ['admin', 'hr_manager', 'principal', 'supervisor', 'manager', 'payroll_officer', 'employee'];

function resolvePrimaryRole(roles: string[]) {
  return ROLE_PRIORITY.find((role) => roles.includes(role)) ?? null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: AppRole | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isHrManager: boolean;
  isPrincipal: boolean;
  isManager: boolean;
  isSupervisor: boolean;
  canManageEmployees: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<AppRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching user role:', error);
        return null;
      }

      const roles = (data || []).map((record) => record.role).filter(Boolean) as string[];
      return resolvePrimaryRole(roles);
    } catch (error) {
      console.error('Error in fetchUserRole:', error);
      return null;
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        // Defer role fetching to avoid deadlock
        if (session?.user) {
          setTimeout(() => {
            fetchUserRole(session.user.id).then(setUserRole);
          }, 0);
        } else {
          setUserRole(null);
        }

        if (event === 'SIGNED_OUT') {
          setUserRole(null);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchUserRole(session.user.id).then((role) => {
          setUserRole(role);
          setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUserRole(null);
  };

  const isAdmin = userRole === 'admin';
  const isHrManager = userRole === 'hr_manager';
  const isPrincipal = userRole === 'principal';
  const isManager = userRole === 'manager';
  const isSupervisor = userRole === 'supervisor';
  const canManageEmployees = isAdmin || isHrManager;

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        userRole,
        isLoading,
        signIn,
        signUp,
        signOut,
        isAdmin,
        isHrManager,
        isPrincipal,
        isManager,
        isSupervisor,
        canManageEmployees,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
