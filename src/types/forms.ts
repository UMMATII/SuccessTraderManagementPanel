import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  confirmPassword: z.string().min(6, 'Password confirmation is required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export const createEmployeeSchema = z.object({
  employee_id: z.string().min(2, 'Employee ID must be at least 2 characters'),
  name: z.string().min(2, 'Full name is required'),
  email: z.string().email('Valid email is required'),
  temporaryPassword: z.string().min(8, 'Temporary password must be at least 8 characters long'),
  joining_date: z.string().min(1, 'Joining date is required'),
  status: z.enum(['ACTIVE', 'INACTIVE']),
});

export type CreateEmployeeFormData = z.infer<typeof createEmployeeSchema>;

export const editEmployeeSchema = z.object({
  name: z.string().min(2, 'Full name is required'),
  joining_date: z.string().optional().nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE']),
  avatar_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
});

export type EditEmployeeFormData = z.infer<typeof editEmployeeSchema>;

export const taskSchema = z.object({
  task_date: z.string().min(1, 'Date is required'),
  description: z.string().min(5, 'Task description must be at least 5 characters'),
  time_from: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/, 'Valid start time required (HH:mm)'),
  time_to: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/, 'Valid end time required (HH:mm)'),
  acceptance_criteria: z.string().min(5, 'Acceptance criteria is required'),
  status: z.string(),
}).refine((data) => {
  if (!data.time_from || !data.time_to) return true;
  return data.time_to > data.time_from;
}, {
  message: 'End time must be later than start time',
  path: ['time_to'],
});

export type TaskFormData = z.infer<typeof taskSchema>;

export const awardPointsSchema = z.object({
  employee_id: z.string().uuid('Please select an employee'),
  point_date: z.string().min(1, 'Date is required'),
  task_id: z.string().uuid().optional().nullable().or(z.literal('')),
  points: z.coerce.number().min(0, 'Points must be 0 or greater'),
  reason: z.string().min(5, 'Reason must be at least 5 characters long'),
});

export type AwardPointsFormData = z.infer<typeof awardPointsSchema>;

export const attendanceUpdateSchema = z.object({
  employee_id: z.string().uuid(),
  attendance_date: z.string().min(1, 'Date is required'),
  status: z.enum(['PRESENT', 'ABSENT', 'LEAVE', 'HOLIDAY']),
  check_in: z.string().optional().nullable(),
  check_out: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type AttendanceUpdateFormData = z.infer<typeof attendanceUpdateSchema>;
