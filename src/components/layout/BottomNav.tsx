import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Clock, MessageSquare, GraduationCap, User } from 'lucide-react';
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
            icon: Home,
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
            to: employee?.id ? `/employees/${employee.id}` : '/profile',
        },
    ];

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-2 pb-6 pt-3 bg-background/80 backdrop-blur-lg border-t animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between max-w-full px-2 mx-auto gap-1">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.to ||
                        (item.to !== '/dashboard' && location.pathname.startsWith(item.to));

                    return (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) =>
                                cn(
                                    "flex flex-col items-center gap-1.5 transition-all duration-200 flex-1 min-w-0",
                                    isActive ? "text-primary scale-105" : "text-muted-foreground hover:text-foreground"
                                )
                            }
                        >
                            <item.icon className={cn("h-5 w-5", isActive && "drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]")} />
                            <span className="text-[9px] font-semibold leading-none truncate w-full text-center">{item.label}</span>
                        </NavLink>
                    );
                })}
            </div>
        </nav>
    );
}
