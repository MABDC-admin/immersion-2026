import { useMemo, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  BarChart3,
  BookOpen,
  Calendar,
  ChevronRight,
  ClipboardCheck,
  Clock,
  FileText,
  GraduationCap,
  HelpCircle,
  LayoutDashboard,
  ListChecks,
  MessageSquare,
  Shield,
  Sparkles,
  Target,
  TrendingUp,
  User,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { useCurrentEmployee } from '@/hooks/useEmployees';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useChat } from '@/hooks/useChat';
import { Badge } from '@/components/ui/badge';
import { usePendingJournalApprovals } from '@/hooks/useJournal';
import { useSupervisorTasks } from '@/hooks/useTasks';

type NavTone = 'sky' | 'orange' | 'emerald' | 'violet' | 'rose' | 'amber' | 'slate';

interface NavItem {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  subItems?: { title: string; href: string }[];
  adminOnly?: boolean;
  employeeVisible?: boolean;
  badge?: number;
  tone?: NavTone;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const toneClasses: Record<NavTone, string> = {
  sky: 'from-sky-500 to-cyan-500 text-sky-700 bg-sky-50 border-sky-200',
  orange: 'from-orange-500 to-amber-500 text-orange-700 bg-orange-50 border-orange-200',
  emerald: 'from-emerald-500 to-teal-500 text-emerald-700 bg-emerald-50 border-emerald-200',
  violet: 'from-violet-500 to-fuchsia-500 text-violet-700 bg-violet-50 border-violet-200',
  rose: 'from-rose-500 to-pink-500 text-rose-700 bg-rose-50 border-rose-200',
  amber: 'from-amber-500 to-yellow-500 text-amber-700 bg-amber-50 border-amber-200',
  slate: 'from-slate-500 to-slate-700 text-slate-700 bg-slate-50 border-slate-200',
};

const adminSections: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { title: 'Dashboard', icon: LayoutDashboard, href: '/dashboard', employeeVisible: true, tone: 'sky' },
      { title: 'Interns', icon: Users, href: '/employees', tone: 'orange' },
    ],
  },
  {
    title: 'Evaluation & Reports',
    items: [
      { title: 'Evaluation Reports', icon: BarChart3, href: '/reports/evaluations', adminOnly: true, tone: 'violet' },
      { title: 'Work Immersion', icon: Target, href: '/admin/ojt', tone: 'emerald' },
      { title: 'Intern Journals', icon: BookOpen, href: '/admin/employee-journals', tone: 'amber' },
    ],
  },
  {
    title: 'People Operations',
    items: [
      {
        title: 'Leave', icon: Calendar, employeeVisible: true, tone: 'emerald', subItems: [
          { title: 'Leave Requests', href: '/leave/requests' },
          { title: 'Leave Calendar', href: '/leave/calendar' },
        ],
      },
      {
        title: 'Time Attendance', icon: Clock, tone: 'sky', subItems: [
          { title: 'Attendance', href: '/attendance' },
          { title: 'Timesheets', href: '/attendance/timesheets' },
          { title: 'Reports', href: '/attendance/reports' },
          { title: 'Supervisor View', href: '/supervisor/attendance' },
        ],
      },
      {
        title: 'Recruitment', icon: UserPlus, tone: 'rose', subItems: [
          { title: 'Job Postings', href: '/recruitment/jobs' },
          { title: 'Candidates', href: '/recruitment/candidates' },
        ],
      },
      {
        title: 'Performance', icon: TrendingUp, tone: 'orange', subItems: [
          { title: 'Reviews', href: '/performance/reviews' },
          { title: 'Goals', href: '/performance/goals' },
          { title: 'Feedback', href: '/performance/feedback' },
        ],
      },
      {
        title: 'Onboarding', icon: UserCheck, tone: 'amber', subItems: [
          { title: 'New Hires', href: '/onboarding/new-hires' },
          { title: 'Checklists', href: '/onboarding/checklists' },
          { title: 'Documents', href: '/onboarding/documents' },
        ],
      },
      {
        title: 'Training', icon: GraduationCap, employeeVisible: true, tone: 'violet', subItems: [
          { title: 'Courses', href: '/training/courses' },
          { title: 'Enrollments', href: '/training/enrollments' },
          { title: 'Certificates', href: '/training/certificates' },
        ],
      },
    ],
  },
  {
    title: 'Collaboration',
    items: [
      { title: 'Chat', icon: MessageSquare, href: '/chat', tone: 'sky' },
      { title: 'Task Dashboard', icon: ListChecks, href: '/supervisor/tasks', tone: 'orange' },
      { title: 'Admin', icon: Shield, href: '/admin', adminOnly: true, tone: 'slate' },
    ],
  },
];

const employeeSections: NavSection[] = [
  {
    title: 'My Workspace',
    items: [
      { title: 'Dashboard', icon: LayoutDashboard, href: '/dashboard', tone: 'sky' },
      { title: 'My Profile', icon: User, href: '__MY_PROFILE__', tone: 'slate' },
      { title: 'Attendance', icon: Clock, href: '/attendance', tone: 'emerald' },
      { title: 'My Tasks', icon: ListChecks, href: '/my-tasks', tone: 'orange' },
    ],
  },
  {
    title: 'Immersion',
    items: [
      { title: 'Daily Journal', icon: BookOpen, href: '/journal', tone: 'amber' },
      { title: 'My Evaluations', icon: ClipboardCheck, href: '/my-evaluations', tone: 'violet' },
      { title: 'My Documents', icon: FileText, href: '/my-documents', tone: 'rose' },
    ],
  },
  {
    title: 'Growth',
    items: [
      {
        title: 'Leave', icon: Calendar, tone: 'emerald', subItems: [
          { title: 'Leave Requests', href: '/leave/requests' },
          { title: 'Leave Calendar', href: '/leave/calendar' },
        ],
      },
      {
        title: 'Training', icon: GraduationCap, tone: 'violet', subItems: [
          { title: 'Courses', href: '/training/courses' },
          { title: 'Enrollments', href: '/training/enrollments' },
          { title: 'Certificates', href: '/training/certificates' },
        ],
      },
      { title: 'Chat', icon: MessageSquare, href: '/chat', tone: 'sky' },
    ],
  },
];

export function AppSidebar() {
  const location = useLocation();
  const { user, isAdmin, userRole } = useAuth();
  const { data: employee } = useCurrentEmployee(user?.id || '');
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const [openItems, setOpenItems] = useState<string[]>(['Leave', 'Time Attendance']);

  const employeeId = employee?.id || '';
  const isAdminOrHR = isAdmin || userRole === 'hr_manager';
  const isPrincipal = userRole === 'principal';
  const isSupervisor = userRole === 'supervisor';
  const isOversightPortal = isPrincipal || isSupervisor;
  const { useTotalUnreadCount } = useChat();
  const totalUnreadCount = useTotalUnreadCount(employeeId);
  const { data: supervisorTasks = [] } = useSupervisorTasks(isSupervisor ? employeeId : '');
  const { data: pendingJournals = [] } = usePendingJournalApprovals(isSupervisor ? employeeId : '');

  const submittedTaskCount = supervisorTasks.filter((task) => task.status === 'submitted').length;

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

  const navSections = useMemo<NavSection[]>(() => {
    const attachCommonBadges = (sections: NavSection[]) =>
      sections
        .map((section) => ({
          ...section,
          items: section.items
            .filter((item) => !(item.adminOnly && !isAdmin))
            .map((item) => {
              if (item.title === 'Chat') return { ...item, badge: totalUnreadCount };
              if (item.href === '__MY_PROFILE__') {
                return { ...item, href: employeeId ? `/employees/${employeeId}` : '/dashboard' };
              }
              return item;
            }),
        }))
        .filter((section) => section.items.length > 0);

    if (isAdminOrHR) return attachCommonBadges(adminSections);

    if (isOversightPortal) {
      const sections: NavSection[] = [
        {
          title: isPrincipal ? 'Principal Portal' : 'Supervisor Portal',
          items: [
            { title: 'Dashboard', icon: LayoutDashboard, href: '/dashboard', tone: 'sky' },
            { title: 'All Interns', icon: Users, href: '/employees', tone: 'orange' },
          ],
        },
        {
          title: 'Evaluation & Reports',
          items: [
            ...(isSupervisor ? [{ title: 'Evaluations', icon: ClipboardCheck, href: '/evaluations', tone: 'violet' as NavTone }] : []),
            ...(isPrincipal ? [{ title: 'Evaluation Reports', icon: BarChart3, href: '/reports/evaluations', tone: 'violet' as NavTone }] : []),
          ],
        },
        {
          title: 'Daily Work',
          items: [
            ...(isSupervisor ? [{ title: 'Attendance', icon: Clock, href: '/supervisor/attendance', tone: 'emerald' as NavTone }] : []),
            ...(isSupervisor ? [{ title: 'Task Dashboard', icon: ListChecks, href: '/supervisor/tasks', badge: submittedTaskCount, tone: 'orange' as NavTone }] : []),
            { title: 'Intern Journals', icon: BookOpen, href: '/supervisor/journals', badge: isSupervisor ? pendingJournals.length : undefined, tone: 'amber' },
          ],
        },
        {
          title: 'Communication',
          items: [
            { title: 'Chat', icon: MessageSquare, href: '/chat', badge: totalUnreadCount, tone: 'sky' },
            { title: 'My Profile', icon: User, href: employeeId ? `/employees/${employeeId}` : '/dashboard', tone: 'slate' },
          ],
        },
      ];
      return sections.filter((section) => section.items.length > 0);
    }

    return attachCommonBadges(employeeSections);
  }, [
    employeeId,
    isAdmin,
    isAdminOrHR,
    isOversightPortal,
    isPrincipal,
    isSupervisor,
    pendingJournals.length,
    submittedTaskCount,
    totalUnreadCount,
  ]);

  const activePortalLabel = isPrincipal
    ? 'Principal'
    : isSupervisor
      ? 'Supervisor'
      : isAdminOrHR
        ? 'Admin'
        : 'Intern';

  const userInitials = employee
    ? `${employee.first_name[0]}${employee.last_name[0]}`.toUpperCase()
    : user?.email?.substring(0, 2).toUpperCase() || 'U';

  const renderBadge = (badge?: number) => {
    if (!badge || badge <= 0) return null;
    return (
      <Badge className="h-5 min-w-5 rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white shadow-sm">
        {badge > 99 ? '99+' : badge}
      </Badge>
    );
  };

  const renderItem = (item: NavItem) => {
    const active = isGroupActive(item);
    const tone = item.tone || 'sky';

    if (item.subItems) {
      const open = openItems.includes(item.title);
      return (
        <Collapsible open={open} onOpenChange={() => toggleItem(item.title)}>
          <CollapsibleTrigger asChild>
            <SidebarMenuButton
              tooltip={item.title}
              className={cn(
                'h-10 justify-between rounded-lg px-2.5 text-sm font-semibold text-sidebar-foreground/85 hover:bg-white/10 hover:text-white',
                active && 'bg-white/15 text-white shadow-sm'
              )}
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-md border bg-white/95 shadow-sm',
                  toneClasses[tone]
                )}>
                  <item.icon className="h-4 w-4" />
                </span>
                {!collapsed && <span className="truncate">{item.title}</span>}
              </div>
              {!collapsed && <ChevronRight className={cn('h-4 w-4 transition-transform', open && 'rotate-90')} />}
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub className="ml-5 border-l-white/25 py-1">
              {item.subItems.map((subItem) => (
                <SidebarMenuSubItem key={subItem.href}>
                  <SidebarMenuSubButton
                    asChild
                    isActive={isActive(subItem.href)}
                    className="h-8 rounded-md text-sidebar-foreground/75 hover:bg-white/10 hover:text-white data-[active=true]:bg-white/15 data-[active=true]:font-semibold data-[active=true]:text-white"
                  >
                    <Link to={subItem.href}>{subItem.title}</Link>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        </Collapsible>
      );
    }

    return (
      <SidebarMenuButton
        asChild
        isActive={active}
        tooltip={item.title}
        className={cn(
          'h-10 rounded-lg px-2.5 text-sm font-semibold text-sidebar-foreground/85 hover:bg-white/10 hover:text-white data-[active=true]:bg-white data-[active=true]:text-slate-950 data-[active=true]:shadow-md',
          active && 'ring-1 ring-white/25'
        )}
      >
        <Link to={item.href || '/'}>
          <span className={cn(
            'flex h-7 w-7 shrink-0 items-center justify-center rounded-md border bg-white/95 shadow-sm',
            active ? toneClasses[tone] : `${toneClasses[tone]} opacity-95`
          )}>
            <item.icon className="h-4 w-4" />
          </span>
          {!collapsed && (
            <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
              <span className="truncate">{item.title}</span>
              {renderBadge(item.badge)}
            </div>
          )}
          {collapsed && item.badge !== undefined && item.badge > 0 && (
            <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-rose-400 ring-2 ring-sidebar" />
          )}
        </Link>
      </SidebarMenuButton>
    );
  };

  return (
    <Sidebar className="border-r-0 shadow-xl shadow-sky-950/15" collapsible="icon">
      <SidebarHeader className="border-b border-white/10 p-4">
        <Link to="/" className={cn('flex items-center gap-3', collapsed && 'justify-center')}>
          <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white text-primary shadow-lg ring-4 ring-white/10">
            <span className="text-lg font-black tracking-tighter">WI</span>
            <span className="absolute -bottom-2 -right-2 h-5 w-5 rounded-full bg-orange-400" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-lg font-black leading-none tracking-tight text-white">Immersion</span>
                <Sparkles className="h-4 w-4 text-amber-200" />
              </div>
              <div className="mt-1 flex items-center gap-2">
                <span className="rounded-full border border-white/15 bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white/75">
                  {activePortalLabel}
                </span>
              </div>
            </div>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3">
        {navSections.map((section) => (
          <SidebarGroup key={section.title} className="px-1 py-1.5">
            <SidebarGroupLabel className="h-7 px-2 text-[10px] font-black uppercase tracking-[0.22em] text-white/55">
              {section.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1.5">
                {section.items.map((item) => (
                  <SidebarMenuItem key={`${section.title}-${item.title}`}>
                    {renderItem(item)}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-white/10 p-3">
        <div className={cn('flex items-center gap-3 rounded-xl border border-white/10 bg-white/10 p-2', collapsed && 'justify-center border-0 bg-transparent p-0')}>
          <Avatar className="h-10 w-10 ring-2 ring-white/20">
            <AvatarImage src={employee?.avatar_url || ''} />
            <AvatarFallback className="bg-white text-primary">{userInitials}</AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-white">
                {employee ? `${employee.first_name} ${employee.last_name}` : user?.email?.split('@')[0] || 'User'}
              </p>
              <p className="truncate text-xs text-white/65">{user?.email || ''}</p>
            </div>
          )}
        </div>
        {!collapsed && (
          <Link to="/help" className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white">
            <HelpCircle className="h-4 w-4" /> Help
          </Link>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
