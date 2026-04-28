import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Bell, LogOut, Clock, Calendar, Shield, BookOpen, ListChecks } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/useAuth';
import { useCurrentEmployee } from '@/hooks/useEmployees';
import { useInternTasks, useSupervisorTasks } from '@/hooks/useTasks';
import { usePendingJournalApprovals } from '@/hooks/useJournal';
import { Badge } from '@/components/ui/badge';

interface TopHeaderProps {
  onAddNew?: () => void;
}

export function TopHeader({ onAddNew }: TopHeaderProps) {
  const navigate = useNavigate();
  const { user, signOut, userRole, canManageEmployees } = useAuth();
  const { data: employee } = useCurrentEmployee(user?.id || '');
  const [currentTime, setCurrentTime] = useState(new Date());
  const isPrincipal = userRole === 'principal';
  const isSupervisor = userRole === 'supervisor';
  const isIntern = userRole === 'employee';
  const employeeId = employee?.id || '';
  const { data: internTasks = [] } = useInternTasks(isIntern ? employeeId : '');
  const { data: supervisorTasks = [] } = useSupervisorTasks(isSupervisor ? employeeId : '');
  const { data: pendingJournals = [] } = usePendingJournalApprovals(isSupervisor ? employeeId : '');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const userInitials = user?.email?.substring(0, 2).toUpperCase() || 'U';
  const notifications = useMemo(() => {
    const items: {
      id: string;
      title: string;
      description: string;
      href: string;
      icon: React.ComponentType<{ className?: string }>;
      tone: string;
    }[] = [];

    if (isIntern) {
      const activeTasks = internTasks.filter((task) => !['completed'].includes(task.status));
      const overdueTasks = activeTasks.filter((task) => task.status === 'overdue');
      const submittedTasks = activeTasks.filter((task) => task.status === 'submitted');

      if (overdueTasks.length > 0) {
        items.push({
          id: 'intern-overdue-tasks',
          title: `${overdueTasks.length} overdue task${overdueTasks.length === 1 ? '' : 's'}`,
          description: 'Review your pending task submissions.',
          href: '/my-tasks',
          icon: ListChecks,
          tone: 'border-rose-200 bg-rose-50 text-rose-800',
        });
      }

      if (activeTasks.length - overdueTasks.length > 0) {
        items.push({
          id: 'intern-active-tasks',
          title: `${activeTasks.length - overdueTasks.length} active task${activeTasks.length - overdueTasks.length === 1 ? '' : 's'}`,
          description: submittedTasks.length > 0 ? `${submittedTasks.length} submitted for review.` : 'Open your task dashboard.',
          href: '/my-tasks',
          icon: ListChecks,
          tone: 'border-cyan-200 bg-cyan-50 text-cyan-800',
        });
      }
    }

    if (isSupervisor) {
      const submittedTasks = supervisorTasks.filter((task) => task.status === 'submitted');
      if (submittedTasks.length > 0) {
        items.push({
          id: 'supervisor-submitted-tasks',
          title: `${submittedTasks.length} task submission${submittedTasks.length === 1 ? '' : 's'}`,
          description: 'Intern task submissions need review.',
          href: '/supervisor/tasks',
          icon: ListChecks,
          tone: 'border-violet-200 bg-violet-50 text-violet-800',
        });
      }

      if (pendingJournals.length > 0) {
        items.push({
          id: 'supervisor-pending-journals',
          title: `${pendingJournals.length} journal approval${pendingJournals.length === 1 ? '' : 's'}`,
          description: 'Daily journal entries are waiting.',
          href: '/supervisor/journals',
          icon: BookOpen,
          tone: 'border-amber-200 bg-amber-50 text-amber-800',
        });
      }
    }

    return items;
  }, [internTasks, isIntern, isSupervisor, pendingJournals, supervisorTasks]);

  return (
    <header className="h-16 border-b bg-card flex items-center justify-between px-4 gap-4">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
        {isPrincipal && (
          <div className="hidden lg:flex items-center gap-3 rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sky-900 shadow-sm">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 text-sky-700">
              <Shield className="h-4 w-4" />
            </div>
            <div className="leading-none">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-700">Principal Portal</p>
              <p className="mt-1 text-xs text-sky-900/80">Read-only employee oversight</p>
            </div>
          </div>
        )}
        <div className="hidden md:flex items-center gap-4 px-3 py-1.5 bg-muted/30 rounded-full border border-muted/50">
          <div className="flex items-center gap-2 text-primary">
            <Calendar className="h-4 w-4" />
            <span className="text-xs font-semibold whitespace-nowrap">
              {currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          <div className="h-4 w-[1px] bg-muted/50" />
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span className="text-xs font-medium tabular-nums whitespace-nowrap">
              {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {canManageEmployees && onAddNew && (
          <Button onClick={onAddNew} size="icon" className="rounded-full">
            <Plus className="h-5 w-5" />
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {notifications.length > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-xs text-destructive-foreground">
                  {notifications.length > 9 ? '9+' : notifications.length}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 bg-popover">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                No new notifications
              </div>
            ) : (
              notifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className="cursor-pointer gap-3 p-3"
                  onClick={() => navigate(notification.href)}
                >
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${notification.tone}`}>
                    <notification.icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{notification.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{notification.description}</p>
                  </div>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="h-9 w-9 ring-2 ring-primary/20">
                <AvatarImage src="" />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-popover">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{user?.email}</p>
                <Badge variant="secondary" className="w-fit text-xs capitalize">
                  {userRole?.replace('_', ' ') || 'Employee'}
                </Badge>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => {
              if (employee?.id) {
                navigate(`/employees/${employee.id}`);
              } else {
                navigate('/dashboard');
              }
            }}>
              Profile Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
