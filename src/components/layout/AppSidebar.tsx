import { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  LayoutDashboard, Users, Calendar, Clock, UserPlus, TrendingUp,
  UserCheck, GraduationCap, HelpCircle, ChevronRight, Shield, User, ClipboardCheck,
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

interface NavItem {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  subItems?: { title: string; href: string }[];
  adminOnly?: boolean;
  employeeVisible?: boolean; // If true, visible to regular employees
}

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
  { title: 'Evaluations', icon: ClipboardCheck, href: '/evaluations', employeeVisible: false },
  { title: 'Admin', icon: Shield, href: '/admin', adminOnly: true },
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

  const filteredItems = [...navItems];

  // If we have an employee record, add "My Portal" to the top
  if (employee) {
    filteredItems.unshift({
      title: 'My Portal',
      icon: User,
      href: `/employees/${employee.id}`,
      employeeVisible: true,
    });
  }

  // For regular employees: only show items marked employeeVisible
  // For admin/HR: show everything except adminOnly (unless admin)
  const finalFilteredItems = filteredItems.filter(item => {
    if (item.adminOnly && !isAdmin) return false;
    if (!isAdminOrHR && !item.employeeVisible) return false;
    return true;
  });

  return (
    <Sidebar className="border-r-0" collapsible="icon">
      <SidebarHeader className="p-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-10 h-10 bg-sidebar-primary rounded-lg flex items-center justify-center">
            <span className="text-lg font-bold text-sidebar-primary-foreground">IM</span>
          </div>
          {!collapsed && <span className="text-xl font-bold text-sidebar-foreground">LOGO</span>}
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
                        {!collapsed && <span>{item.title}</span>}
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
            <AvatarImage src="" />
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
