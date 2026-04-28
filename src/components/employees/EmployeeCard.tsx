import React from 'react';
import { Mail, Calendar, Clock, User, Linkedin, Twitter, MessageSquare } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { EmployeeWithRelations } from '@/types/employee';

interface EmployeeCardProps {
  employee: EmployeeWithRelations;
  onQuickAction?: (employee: EmployeeWithRelations) => void;
  onClick?: (employee: EmployeeWithRelations) => void;
}

const CARD_ACCENTS = [
  {
    shell: 'border-orange-200 bg-gradient-to-br from-orange-50/90 via-white to-white',
    header: 'from-orange-400/85 via-amber-300/70 to-cyan-300/75',
    avatar: 'border-orange-100 bg-orange-100 text-orange-800',
    icon: 'text-orange-700',
    action: 'border-orange-200 text-orange-800 hover:bg-orange-50',
  },
  {
    shell: 'border-cyan-200 bg-gradient-to-br from-cyan-50/90 via-white to-white',
    header: 'from-cyan-400/85 via-sky-300/70 to-emerald-300/75',
    avatar: 'border-cyan-100 bg-cyan-100 text-cyan-800',
    icon: 'text-cyan-700',
    action: 'border-cyan-200 text-cyan-800 hover:bg-cyan-50',
  },
  {
    shell: 'border-violet-200 bg-gradient-to-br from-violet-50/90 via-white to-white',
    header: 'from-violet-400/85 via-fuchsia-300/70 to-rose-300/75',
    avatar: 'border-violet-100 bg-violet-100 text-violet-800',
    icon: 'text-violet-700',
    action: 'border-violet-200 text-violet-800 hover:bg-violet-50',
  },
  {
    shell: 'border-emerald-200 bg-gradient-to-br from-emerald-50/90 via-white to-white',
    header: 'from-emerald-400/85 via-lime-300/70 to-amber-300/75',
    avatar: 'border-emerald-100 bg-emerald-100 text-emerald-800',
    icon: 'text-emerald-700',
    action: 'border-emerald-200 text-emerald-800 hover:bg-emerald-50',
  },
] as const;

function getCardAccent(id: string) {
  const total = Array.from(id).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return CARD_ACCENTS[total % CARD_ACCENTS.length];
}

export const EmployeeCard = React.forwardRef<HTMLDivElement, EmployeeCardProps>(
  ({ employee, onQuickAction, onClick }, ref) => {
    const initials = `${employee.first_name[0]}${employee.last_name[0]}`.toUpperCase();
    const fullName = `${employee.first_name} ${employee.last_name}`;
    const isOnline = employee.status === 'active';
    const accent = getCardAccent(employee.id);
    
    // Calculate tenure
    const hireDate = new Date(employee.hire_date);
    const now = new Date();
    const years = now.getFullYear() - hireDate.getFullYear();
    const months = now.getMonth() - hireDate.getMonth();
    const totalMonths = years * 12 + months;
    const tenureYears = Math.floor(totalMonths / 12);
    const tenureMonths = totalMonths % 12;
    const tenure = tenureYears > 0 
      ? `${tenureYears} Year${tenureYears !== 1 ? 's' : ''} ${tenureMonths} Month${tenureMonths !== 1 ? 's' : ''}`
      : `${tenureMonths} Month${tenureMonths !== 1 ? 's' : ''}`;

    const formatDate = (date: string) => {
      return new Date(date).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    };

    return (
      <Card 
        ref={ref}
        className={`cursor-pointer overflow-hidden border transition-shadow hover:shadow-lg ${accent.shell}`}
        onClick={() => onClick?.(employee)}
      >
        <div className={`relative h-24 bg-gradient-to-r ${accent.header}`}>
          <div className="absolute inset-0 bg-white/10" />
          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
            <div className="relative">
              <Avatar className={`h-20 w-20 border-4 ${accent.avatar}`}>
                <AvatarImage src={employee.avatar_url || ''} alt={fullName} />
                <AvatarFallback className={`text-lg ${accent.avatar}`}>
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span
                className={cn(
                  'absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-card',
                  isOnline ? 'bg-hrms-online' : 'bg-hrms-offline'
                )}
              />
            </div>
          </div>
        </div>

        <CardContent className="pt-14 pb-4 px-4">
          {/* Name and title */}
          <div className="text-center mb-4">
            <h3 className="font-semibold text-foreground">{fullName}</h3>
            <p className="text-sm font-medium text-orange-700">{employee.job_title || 'Employee'}</p>
          </div>

          {/* Details grid */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-3">
              <User className={`h-4 w-4 flex-shrink-0 ${accent.icon}`} />
              <span className="text-muted-foreground truncate">
                {employee.manager 
                  ? `${employee.manager.first_name} ${employee.manager.last_name}`
                  : fullName}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <Mail className={`h-4 w-4 flex-shrink-0 ${accent.icon}`} />
              <span className="text-muted-foreground truncate">{employee.email}</span>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className={`h-4 w-4 flex-shrink-0 ${accent.icon}`} />
              <span className="text-muted-foreground">{formatDate(employee.hire_date)}</span>
              <Clock className={`ml-auto h-4 w-4 flex-shrink-0 ${accent.icon}`} />
              <span className="text-muted-foreground">{tenure}</span>
            </div>
          </div>

          {/* Social links and action */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t" onClick={(e) => e.stopPropagation()}>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" className={`h-8 w-8 ${accent.action}`}>
                <Mail className="h-4 w-4" />
              </Button>
              {employee.linkedin_url && (
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                  <a href={employee.linkedin_url} target="_blank" rel="noopener noreferrer">
                    <Linkedin className="h-4 w-4" />
                  </a>
                </Button>
              )}
              {employee.twitter_url && (
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                  <a href={employee.twitter_url} target="_blank" rel="noopener noreferrer">
                    <Twitter className="h-4 w-4" />
                  </a>
                </Button>
              )}
              {employee.slack_username && (
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MessageSquare className="h-4 w-4" />
                </Button>
              )}
            </div>
            <Button
              variant="outline"
              size="icon"
              className={`h-8 w-8 rounded-full ${accent.action}`}
              onClick={(e) => {
                e.stopPropagation();
                onQuickAction?.(employee);
              }}
            >
              <span className="sr-only">Quick action</span>
              <MessageSquare className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
);

EmployeeCard.displayName = 'EmployeeCard';
