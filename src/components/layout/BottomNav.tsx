import { useLocation, Link } from 'react-router-dom';
import {
    ListChecks, BookOpen, MessageSquare,
    Users, ClipboardCheck, Target, Clock, Home, BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';

interface BottomNavItem {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    to: string;
    tone: string;
}

export function BottomNav() {
    const isMobile = useIsMobile();
    const location = useLocation();
    const { isAdmin, userRole } = useAuth();

    if (!isMobile) return null;

    const isAdminOrHR = isAdmin || userRole === 'hr_manager';
    const isPrincipal = userRole === 'principal';
    const isSupervisor = userRole === 'supervisor';
    const isOversightPortal = isPrincipal || isSupervisor;

    // Keep the shared mobile nav focused and compact.
    const items: BottomNavItem[] = isAdminOrHR
        ? [
            { label: 'Interns', icon: Users, to: '/employees', tone: 'text-orange-600 bg-orange-50' },
            { label: 'Reports', icon: BarChart3, to: '/reports/evaluations', tone: 'text-violet-600 bg-violet-50' },
            { label: 'Journal', icon: BookOpen, to: '/admin/employee-journals', tone: 'text-amber-600 bg-amber-50' },
            { label: 'Immersion', icon: Target, to: '/admin/ojt', tone: 'text-emerald-600 bg-emerald-50' },
            { label: 'Chat', icon: MessageSquare, to: '/chat', tone: 'text-sky-600 bg-sky-50' },
        ]
        : isOversightPortal
            ? [
                { label: 'Home', icon: Home, to: '/dashboard', tone: 'text-sky-600 bg-sky-50' },
                { label: 'Interns', icon: Users, to: '/employees', tone: 'text-orange-600 bg-orange-50' },
                ...(isSupervisor ? [{ label: 'Eval', icon: ClipboardCheck, to: '/evaluations', tone: 'text-violet-600 bg-violet-50' }] : []),
                ...(isPrincipal ? [{ label: 'Reports', icon: BarChart3, to: '/reports/evaluations', tone: 'text-violet-600 bg-violet-50' }] : []),
                ...(isSupervisor ? [{ label: 'Tasks', icon: ListChecks, to: '/supervisor/tasks', tone: 'text-orange-600 bg-orange-50' }] : []),
                ...(isPrincipal ? [{ label: 'Journals', icon: BookOpen, to: '/supervisor/journals', tone: 'text-amber-600 bg-amber-50' }] : []),
                { label: 'Chat', icon: MessageSquare, to: '/chat', tone: 'text-sky-600 bg-sky-50' },
            ]
        : [
            { label: 'Home', icon: Home, to: '/dashboard', tone: 'text-sky-600 bg-sky-50' },
            { label: 'Tasks', icon: ListChecks, to: '/my-tasks', tone: 'text-orange-600 bg-orange-50' },
            { label: 'Journal', icon: BookOpen, to: '/journal', tone: 'text-amber-600 bg-amber-50' },
            { label: 'Attendance', icon: Clock, to: '/attendance', tone: 'text-emerald-600 bg-emerald-50' },
            { label: 'Evaluations', icon: ClipboardCheck, to: '/my-evaluations', tone: 'text-violet-600 bg-violet-50' },
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
                                active ? item.tone : "bg-transparent"
                            )}>
                                <item.icon className={cn("h-5 w-5", active && "drop-shadow-[0_0_6px_rgba(59,130,246,0.22)]")} />
                            </div>
                            <span className="text-[10px] font-semibold leading-none text-center">{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
