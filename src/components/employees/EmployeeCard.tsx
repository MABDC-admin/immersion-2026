import { Phone, MapPin, Mail, Calendar, Clock, User, Linkedin, Twitter, MessageSquare } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  job_title?: string;
  avatar_url?: string;
  hire_date: string;
  status: 'active' | 'inactive' | 'on_leave' | 'terminated';
  location?: {
    city: string;
  };
  manager?: {
    first_name: string;
    last_name: string;
  };
  linkedin_url?: string;
  twitter_url?: string;
  slack_username?: string;
}

interface EmployeeCardProps {
  employee: Employee;
  onQuickAction?: (employee: Employee) => void;
}

export function EmployeeCard({ employee, onQuickAction }: EmployeeCardProps) {
  const initials = `${employee.first_name[0]}${employee.last_name[0]}`.toUpperCase();
  const fullName = `${employee.first_name} ${employee.last_name}`;
  const isOnline = employee.status === 'active';
  
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
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {/* Blue header band */}
      <div className="h-24 bg-primary relative">
        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
          <div className="relative">
            <Avatar className="h-20 w-20 border-4 border-card">
              <AvatarImage src={employee.avatar_url || ''} alt={fullName} />
              <AvatarFallback className="text-lg bg-muted text-foreground">
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
          <p className="text-sm text-muted-foreground">{employee.job_title || 'Employee'}</p>
        </div>

        {/* Details grid */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-3">
            <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="text-muted-foreground">{employee.phone || 'N/A'}</span>
            <User className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-auto" />
            <span className="text-muted-foreground truncate">
              {employee.manager 
                ? `${employee.manager.first_name} ${employee.manager.last_name}`
                : fullName}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="text-muted-foreground">{employee.location?.city || 'N/A'}</span>
            <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-auto" />
            <span className="text-muted-foreground truncate">{employee.email}</span>
          </div>

          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="text-muted-foreground">{formatDate(employee.hire_date)}</span>
            <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-auto" />
            <span className="text-muted-foreground">{tenure}</span>
          </div>
        </div>

        {/* Social links and action */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8">
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
            className="h-8 w-8 rounded-full border-primary text-primary"
            onClick={() => onQuickAction?.(employee)}
          >
            <span className="sr-only">Quick action</span>
            <MessageSquare className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
