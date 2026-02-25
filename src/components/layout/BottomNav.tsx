import { useLocation, Link } from 'react-router-dom';
import {
    ListChecks, BookOpen, MessageSquare,
    Users, ClipboardCheck, Target, Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';

interface BottomNavItem {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    to: string;
}

export function BottomNav() {
    const isMobile = useIsMobile();
    const location = useLocation();
    const { isAdmin, userRole } = useAuth();

    if (!isMobile) return null;

    const isAdminOrHR = isAdmin || userRole === 'hr_manager';

    // 4 items only — no Home or Profile (those are in sidebar/header already)
    const items: BottomNavItem[] = isAdminOrHR
        ? [
            { label: 'Employees', icon: Users, to: '/employees' },
            { label: 'Evaluations', icon: ClipboardCheck, to: '/evaluations' },
            { label: 'OJT', icon: Target, to: '/admin/ojt' },
            { label: 'Chat', icon: MessageSquare, to: '/chat' },
        ]
        : [
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
            <div className="flex items-center justify-around max-w-sm mx-auto">
                {items.map((item) => {
                    const active = checkActive(item.to);
                    return (
                        <Link
                            key={item.label}
                            to={item.to}
                            className={cn(
                                "flex flex-col items-center gap-1 py-1.5 px-4 rounded-xl transition-all duration-200",
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
                            <span className="text-[10px] font-semibold leading-none">{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
