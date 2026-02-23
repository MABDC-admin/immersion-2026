import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Clock, MessageSquare, GraduationCap, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useCurrentEmployee } from '@/hooks/useEmployees';

export function BottomNav() {
    const location = useLocation();
    const { user } = useAuth();
    const { data: employee } = useCurrentEmployee(user?.id || '');

    const navItems = [
        {
            label: 'Home',
            icon: LayoutDashboard,
            to: '/dashboard',
        },
        {
            label: 'Attendance',
            icon: Clock,
            to: '/attendance',
        },
        {
            label: 'Chat',
            icon: MessageSquare,
            to: '/chat',
        },
        {
            label: 'Training',
            icon: GraduationCap,
            to: '/training/courses',
        },
        {
            label: 'Profile',
            icon: User,
            to: employee ? `/employees/${employee.id}` : '#',
        },
    ];

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 pt-3 bg-background/80 backdrop-blur-lg border-t animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-around max-w-lg mx-auto">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.to ||
                        (item.to !== '/dashboard' && location.pathname.startsWith(item.to));

                    return (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) =>
                                cn(
                                    "flex flex-col items-center gap-1 transition-all duration-200",
                                    isActive ? "text-primary scale-110" : "text-muted-foreground hover:text-foreground"
                                )
                            }
                        >
                            <item.icon className={cn("h-6 w-6", isActive && "drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]")} />
                            <span className="text-[10px] font-medium leading-none">{item.label}</span>
                        </NavLink>
                    );
                })}
            </div>
        </nav>
    );
}
