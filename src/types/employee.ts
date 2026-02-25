export interface Employee {
  id: string;
  user_id?: string;
  employee_id?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  job_title?: string;
  department_id?: string;
  location_id?: string;
  manager_id?: string;
  hire_date: string;
  status: 'active' | 'inactive' | 'on_leave' | 'terminated';
  avatar_url?: string;
  address?: string;
  city?: string;
  country?: string;
  linkedin_url?: string;
  twitter_url?: string;
  slack_username?: string;
  has_completed_tutorial?: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmployeeWithRelations extends Employee {
  location?: {
    id: string;
    name: string;
    city: string;
    country: string;
  } | null;
  department?: {
    id: string;
    name: string;
  } | null;
  manager?: {
    id: string;
    first_name: string;
    last_name: string;
  } | null;
}

export interface EmployeeDocument {
  id: string;
  employee_id: string;
  file_name: string;
  file_path: string;
  file_type?: string;
  file_size?: number;
  uploaded_by?: string;
  created_at: string;
}

export type EmployeeStatus = 'active' | 'inactive' | 'on_leave' | 'terminated';

export interface CreateEmployeeInput {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  job_title?: string;
  department_id?: string;
  location_id?: string;
  manager_id?: string;
  hire_date: string;
  status: EmployeeStatus;
  avatar_url?: string;
  address?: string;
  city?: string;
  country?: string;
  linkedin_url?: string;
  twitter_url?: string;
  slack_username?: string;
}

export interface Activity {
  id: string;
  type: 'join' | 'leave' | 'update' | 'status';
  message: string;
  user_id?: string;
  created_at: string;
}

export interface Event {
  id: string;
  type: 'birthday' | 'anniversary' | 'holiday';
  title: string;
  date: string;
  created_at: string;
}

export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface LeaveRequest {
  id: string;
  employee_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  status: LeaveStatus;
  reason?: string;
  attachment_url?: string;
  approved_by?: string;
  created_at: string;
  employee?: {
    first_name: string;
    last_name: string;
    avatar_url?: string;
    email?: string;
  };
}

export interface CreateLeaveRequestInput {
  employee_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason?: string;
  attachment_url?: string;
}

export interface LeaveBalance {
  id: string;
  employee_id: string;
  leave_type: string;
  total_days: number;
  used_days: number;
  remaining_days: number;
  year: number;
}
