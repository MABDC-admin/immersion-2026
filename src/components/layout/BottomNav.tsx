import { useLocation, Link } from 'react-router-dom';
import {
    ListChecks, BookOpen, MessageSquare,
    Users, ClipboardCheck, Target, Clock, Home
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { useCurrentEmployee } from '@/hooks/useEmployees';

interface BottomNavItem {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    to: string;
}

export function BottomNav() {
    const isMobile = useIsMobile();
    const location = useLocation();
    const { user, isAdmin, userRole } = useAuth();
    const { data: employee } = useCurrentEmployee(user?.id || '');

    if (!isMobile) return null;

    const isAdminOrHR = isAdmin || userRole === 'hr_manager';
    const isPrincipal = userRole === 'principal';
    const isSupervisor = userRole === 'supervisor';
    const isOversightPortal = isPrincipal || isSupervisor;

    // Keep the shared mobile nav focused and compact.
    const items: BottomNavItem[] = isAdminOrHR
        ? [
            { label: 'Interns', icon: Users, to: '/employees' },
            { label: 'Evaluations', icon: ClipboardCheck, to: '/evaluations' },
            { label: 'Journal', icon: BookOpen, to: '/admin/employee-journals' },
            { label: 'Work Immersion', icon: Target, to: '/admin/ojt' },
            { label: 'Chat', icon: MessageSquare, to: '/chat' },
        ]
        : isOversightPortal
            ? [
                { label: 'Home', icon: Home, to: '/dashboard' },
                { label: 'Interns', icon: Users, to: '/employees' },
                { label: 'Profile', icon: ClipboardCheck, to: employee ? `/employees/${employee.id}` : '/dashboard' },
            ]
        : [
            { label: 'Home', icon: Home, to: '/dashboard' },
            { label: 'Tasks', icon: ListChecks, to: '/my-tasks' },
            { label: 'Journal', icon: BookOpen, to: '/journal' },
            { label: 'Attendance', icon: Clock, to: '/attendance' },
            { label: 'Evaluations', icon: ClipboardCheck, to: '/my-evaluations' },
        ];

    const checkActive = (href: string) => {
        return location.pathname === href || location.pathname.startsWith(href + '/');
    };

    return (
        <nav
            className="fixed bottom-0 left-0 right-0 z-[9999] px-4 pt-2 bg-background/95 backdrop-blur-xl border-t shadow-[0_-2px_10px_rgba(0,0,0,0.08)]"
            style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 8px)', willChange: 'transform' }}
        >
            <div className="flex items-center justify-around max-w-md mx-auto">
                {items.map((item) => {
                    const active = checkActive(item.to);
                    return (
                        <Link
                            key={item.label}
                            to={item.to}
                            className={cn(
                                "flex min-w-0 flex-1 flex-col items-center gap-1 py-1.5 px-2 rounded-xl transition-all duration-200",
                                active
                                    ? "text-primary"
                                    : "text-muted-foreground active:scale-95"
                            )}
                        >
                            <div className={cn(
                                "p-1.5 rounded-lg transition-colors",
                                active && "bg-primary/10"
                            )}>
                                <item.icon className={cn("h-5 w-5", active && "drop-shadow-[0_0_6px_rgba(59,130,246,0.4)]")} />
                            </div>
                            <span className="text-[10px] font-semibold leading-none text-center">{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
