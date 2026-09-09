import type { Database, UserRole, UserStatus, AttendanceStatus, TaskStatus } from './database.types';

export type { UserRole, UserStatus, AttendanceStatus, TaskStatus };

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Task = Database['public']['Tables']['tasks']['Row'];
export type Attendance = Database['public']['Tables']['attendance']['Row'];
export type SuccessPoint = Database['public']['Tables']['success_points']['Row'];
export type AuditLog = Database['public']['Tables']['audit_logs']['Row'];

export interface ProfileWithStats extends Profile {
  todayAttendance?: AttendanceStatus | 'NOT_MARKED';
  todayTasksCount?: number;
  monthlyPoints?: number;
  monthlyWorkingHours?: number;
  rank?: number;
}

export interface TaskWithEmployee extends Task {
  employee?: {
    name: string;
    employee_id: string;
    avatar_url: string | null;
  };
}

export interface AttendanceWithEmployee extends Attendance {
  employee?: {
    name: string;
    employee_id: string;
    avatar_url: string | null;
  };
}

export interface SuccessPointWithDetails extends SuccessPoint {
  employee?: {
    name: string;
    employee_id: string;
  };
  awarded_by_profile?: {
    name: string;
  };
  task?: {
    description: string;
    task_date: string;
  };
}

export interface AuditLogWithUser extends AuditLog {
  user?: {
    name: string;
    employee_id: string;
    role: UserRole;
  };
}

export interface EmployeeRankItem {
  rank: number;
  employee_id: string;
  employee_code: string;
  employee_name: string;
  avatar_url: string | null;
  tasks_count: number;
  completed_tasks: number;
  working_hours: number;
  total_minutes: number;
  success_points: number;
  attendance_present_days: number;
}

export interface OwnerDashboardKPIs {
  totalEmployees: number;
  activeEmployees: number;
  todayAttendancePresent: number;
  todayAttendanceTotal: number;
  todayTasksCount: number;
  monthlySuccessPoints: number;
  averageWorkingHours: number;
}

export interface EmployeeDashboardKPIs {
  todayTasksCount: number;
  todayWorkingMinutes: number;
  monthlyTasksCount: number;
  monthlyWorkingHours: number;
  monthlySuccessPoints: number;
  currentRank: number | string;
}

export type AuditAction =
  | 'CREATE_EMPLOYEE'
  | 'UPDATE_EMPLOYEE'
  | 'ACTIVATE_EMPLOYEE'
  | 'DEACTIVATE_EMPLOYEE'
  | 'RESET_PASSWORD'
  | 'CREATE_TASK'
  | 'UPDATE_TASK'
  | 'CREATE_ATTENDANCE'
  | 'UPDATE_ATTENDANCE'
  | 'AWARD_SUCCESS_POINTS';
