import { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  LayoutDashboard, Users, Calendar, Clock, UserPlus, TrendingUp,
  UserCheck, GraduationCap, HelpCircle, ChevronRight, Shield, User, ClipboardCheck,
  BookOpen, FileText, MessageSquare, ListChecks, Target,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub,
  SidebarMenuSubButton, SidebarMenuSubItem, SidebarHeader, useSidebar,
} from '@/components/ui/sidebar';
import { useCurrentEmployee } from '@/hooks/useEmployees';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useChat } from '@/hooks/useChat';
import { Badge } from '@/components/ui/badge';

interface NavItem {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  className?: string;
  href?: string;
  subItems?: { title: string; href: string }[];
  adminOnly?: boolean;
  employeeVisible?: boolean;
  badge?: number;
}

// Full nav for Admin / HR
const navItems: NavItem[] = [
  { title: 'Dashboard', icon: LayoutDashboard, href: '/dashboard', employeeVisible: true },
  { title: 'Employee', icon: Users, href: '/employees' },
  {
    title: 'Leave', icon: Calendar, employeeVisible: true, subItems: [
      { title: 'Leave Requests', href: '/leave/requests' },
      { title: 'Leave Calendar', href: '/leave/calendar' },
    ],
  },
  {
    title: 'Time Attendance', icon: Clock, subItems: [
      { title: 'Attendance', href: '/attendance' },
      { title: 'Timesheets', href: '/attendance/timesheets' },
      { title: 'Reports', href: '/attendance/reports' },
      { title: 'Supervisor View', href: '/supervisor/attendance' },
    ],
  },
  {
    title: 'Recruitment', icon: UserPlus, subItems: [
      { title: 'Job Postings', href: '/recruitment/jobs' },
      { title: 'Candidates', href: '/recruitment/candidates' },
    ],
  },
  {
    title: 'Performance', icon: TrendingUp, subItems: [
      { title: 'Reviews', href: '/performance/reviews' },
      { title: 'Goals', href: '/performance/goals' },
      { title: 'Feedback', href: '/performance/feedback' },
    ],
  },
  {
    title: 'Onboarding', icon: UserCheck, subItems: [
      { title: 'New Hires', href: '/onboarding/new-hires' },
      { title: 'Checklists', href: '/onboarding/checklists' },
      { title: 'Documents', href: '/onboarding/documents' },
    ],
  },
  {
    title: 'Training', icon: GraduationCap, employeeVisible: true, subItems: [
      { title: 'Courses', href: '/training/courses' },
      { title: 'Enrollments', href: '/training/enrollments' },
      { title: 'Certificates', href: '/training/certificates' },
    ],
  },
  { title: 'Evaluations', icon: ClipboardCheck, href: '/evaluations' },
  { title: 'Work Immersion', icon: Target, href: '/admin/ojt' },
  { title: 'Chat', icon: MessageSquare, href: '/chat' },
  { title: 'Task Dashboard', icon: ListChecks, href: '/supervisor/tasks' },
  { title: 'Admin', icon: Shield, href: '/admin', adminOnly: true },
];

// Intern / Employee nav — full access to relevant modules
const employeeNavItems: NavItem[] = [
  { title: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { title: 'My Profile', icon: User, href: '__MY_PROFILE__' },
  { title: 'Attendance', icon: Clock, href: '/attendance' },
  { title: 'Daily Journal', icon: BookOpen, href: '/journal' },
  { title: 'My Evaluations', icon: ClipboardCheck, href: '/my-evaluations' },
  { title: 'Onboarding', icon: UserCheck, href: '/onboarding/checklists' },
  { title: 'My Documents', icon: FileText, href: '/my-documents' },
  {
    title: 'Leave', icon: Calendar, subItems: [
      { title: 'Leave Requests', href: '/leave/requests' },
      { title: 'Leave Calendar', href: '/leave/calendar' },
    ],
  },
  {
    title: 'Training', icon: GraduationCap, subItems: [
      { title: 'Courses', href: '/training/courses' },
      { title: 'Enrollments', href: '/training/enrollments' },
      { title: 'Certificates', href: '/training/certificates' },
    ],
  },
  { title: 'Chat', icon: MessageSquare, href: '/chat' },
  { title: 'My Tasks', icon: ListChecks, href: '/my-tasks' },
];

export function AppSidebar() {
  const location = useLocation();
  const { user, isAdmin, userRole } = useAuth();
  const { data: employee } = useCurrentEmployee(user?.id || '');
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const [openItems, setOpenItems] = useState<string[]>(['Employee']);

  const toggleItem = (title: string) => {
    setOpenItems((prev) =>
      prev.includes(title) ? prev.filter((item) => item !== title) : [...prev, title]
    );
  };

  const isActive = (href?: string) => {
    if (!href) return false;
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  const isGroupActive = (item: NavItem) => {
    if (item.href) return isActive(item.href);
    return item.subItems?.some((sub) => isActive(sub.href));
  };

  const userInitials = employee
    ? `${employee.first_name[0]}${employee.last_name[0]}`.toUpperCase()
    : user?.email?.substring(0, 2).toUpperCase() || 'U';

  const isAdminOrHR = isAdmin || userRole === 'hr_manager';
  const isSupervisor = userRole === 'supervisor';

  const { useTotalUnreadCount } = useChat();
  const totalUnreadCount = useTotalUnreadCount(employee?.id || '');

  // Build final nav items based on role
  const finalFilteredItems = (() => {
    if (isAdminOrHR) {
      // Admin/HR see the full admin sidebar
      return [...navItems].filter(item => {
        if (item.adminOnly && !isAdmin) return false;
        return true;
      }).map(item => {
        if (item.title === 'Chat') {
          return { ...item, badge: totalUnreadCount };
        }
        return item;
      });
    }

    if (isSupervisor) {
      // Chat is now second item
      const supervisorSpecificItems = [
        { title: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
        { title: 'Chat', icon: MessageSquare, href: '/chat', badge: totalUnreadCount },
        { title: 'Interns', icon: Users, href: '/employees' },
        { title: 'Evaluations', icon: ClipboardCheck, href: '/evaluations' },
        { title: 'Daily Journal', icon: BookOpen, href: '/supervisor/journals' },
        { title: 'Attendance', icon: Clock, href: '/supervisor/attendance' },
        { title: 'Tasks', icon: ListChecks, href: '/supervisor/tasks' },
      ];

      // Personal Tools for Supervisor
      const personalTools = [
        {
          title: 'My Workspace', icon: User, subItems: [
            { title: 'My Profile', href: employee ? `/employees/${employee.id}` : '/profile' },
            { title: 'My Journal', href: '/journal' },
            { title: 'My Attendance', href: '/attendance' },
            { title: 'My Documents', href: '/my-documents' },
            { title: 'Leave Requests', href: '/leave/requests' },
          ]
        }
      ];

      return [...supervisorSpecificItems, ...personalTools];
    }

    // Employees / Interns see the employee-focused sidebar
    return employeeNavItems.map(item => {
      let updatedItem = { ...item };
      if (item.title === 'Chat') {
        updatedItem.badge = totalUnreadCount;
      }
      if (item.href === '__MY_PROFILE__' && employee) {
        updatedItem.href = `/employees/${employee.id}`;
      }
      return updatedItem;
    });
  })();

  return (
    <Sidebar className="border-r-0" collapsible="icon">
      <SidebarHeader className="p-4">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-sidebar-primary rounded-xl flex items-center justify-center shadow-lg ring-4 ring-sidebar-primary/10">
            <span className="text-lg font-black text-sidebar-primary-foreground tracking-tighter">WI</span>
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-none">
              <span className="text-lg font-bold text-sidebar-foreground tracking-tight">Work</span>
              <span className="text-xs font-medium text-sidebar-foreground/60 uppercase tracking-widest">Immersion</span>
            </div>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {finalFilteredItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {item.subItems ? (
                    <Collapsible open={openItems.includes(item.title)} onOpenChange={() => toggleItem(item.title)}>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton className={cn('w-full justify-between', isGroupActive(item) && 'bg-sidebar-accent text-sidebar-accent-foreground')}>
                          <div className="flex items-center gap-3">
                            <item.icon className="h-5 w-5" />
                            {!collapsed && <span>{item.title}</span>}
                          </div>
                          {!collapsed && <ChevronRight className={cn('h-4 w-4 transition-transform', openItems.includes(item.title) && 'rotate-90')} />}
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.subItems.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.href}>
                              <SidebarMenuSubButton asChild isActive={isActive(subItem.href)}>
                                <Link to={subItem.href}>{subItem.title}</Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </Collapsible>
                  ) : (
                    <SidebarMenuButton asChild isActive={isActive(item.href)} className={cn(isActive(item.href) && 'bg-sidebar-accent text-sidebar-accent-foreground')}>
                      <Link to={item.href || '/'}>
                        <item.icon className="h-5 w-5" />
                        {!collapsed && (
                          <div className="flex items-center justify-between flex-1">
                            <span>{item.title}</span>
                            {item.badge !== undefined && item.badge > 0 && (
                              <Badge variant="destructive" className="h-4 min-w-[16px] px-1 text-[10px] flex items-center justify-center rounded-full ml-auto">
                                {item.badge > 99 ? '99+' : item.badge}
                              </Badge>
                            )}
                          </div>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={employee?.avatar_url || ''} />
            <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground">{userInitials}</AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {employee ? `${employee.first_name} ${employee.last_name}` : user?.email?.split('@')[0] || 'User'}
              </p>
              <p className="text-xs text-sidebar-foreground/70 truncate">{user?.email || ''}</p>
            </div>
          )}
        </div>
        {!collapsed && (
          <Link to="/help" className="flex items-center gap-2 mt-4 text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground">
            <HelpCircle className="h-4 w-4" />Help
          </Link>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
