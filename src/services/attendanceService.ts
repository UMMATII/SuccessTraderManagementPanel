import { supabase } from '@/lib/supabase';
import type { Attendance, AttendanceWithEmployee, AttendanceStatus } from '@/types/models';
import type { AttendanceUpdateFormData } from '@/types/forms';
import { auditLogService } from './auditLogService';

export const attendanceService = {
  /**
   * Get attendance for an employee
   */
  async getAttendanceByEmployee(
    employeeId: string,
    options?: {
      startDate?: string;
      endDate?: string;
    }
  ): Promise<{ data: Attendance[]; error: string | null }> {
    try {
      let query = supabase
        .from('attendance')
        .select('*')
        .eq('employee_id', employeeId)
        .order('attendance_date', { ascending: false });

      if (options?.startDate) {
        query = query.gte('attendance_date', options.startDate);
      }
      if (options?.endDate) {
        query = query.lte('attendance_date', options.endDate);
      }

      const { data, error } = await query;
      if (error) throw error;
      return { data: data || [], error: null };
    } catch (err: any) {
      return { data: [], error: err.message || 'Failed to fetch employee attendance' };
    }
  },

  /**
   * Get all attendance records for Owner portal
   */
  async getAllAttendance(options?: {
    date?: string;
    startDate?: string;
    endDate?: string;
    employeeId?: string;
    status?: AttendanceStatus;
  }): Promise<{ data: AttendanceWithEmployee[]; error: string | null }> {
    try {
      let query = supabase
        .from('attendance')
        .select(`
          *,
          employee:profiles!attendance_employee_id_fkey(name, employee_id, avatar_url)
        `)
        .order('attendance_date', { ascending: false });

      if (options?.date) {
        query = query.eq('attendance_date', options.date);
      }
      if (options?.startDate) {
        query = query.gte('attendance_date', options.startDate);
      }
      if (options?.endDate) {
        query = query.lte('attendance_date', options.endDate);
      }
      if (options?.employeeId) {
        query = query.eq('employee_id', options.employeeId);
      }
      if (options?.status) {
        query = query.eq('status', options.status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return { data: (data as unknown as AttendanceWithEmployee[]) || [], error: null };
    } catch (err: any) {
      return { data: [], error: err.message || 'Failed to fetch attendance' };
    }
  },

  /**
   * Upsert an attendance record (Owner action)
   */
  async recordAttendance(
    formData: AttendanceUpdateFormData
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      // Check existing attendance for audit log
      const { data: existing } = await supabase
        .from('attendance')
        .select('*')
        .eq('employee_id', formData.employee_id)
        .eq('attendance_date', formData.attendance_date)
        .maybeSingle();

      const payload: any = {
        employee_id: formData.employee_id,
        attendance_date: formData.attendance_date,
        status: formData.status,
        notes: formData.notes || null,
      };

      if (formData.check_in) payload.check_in = formData.check_in;
      if (formData.check_out) payload.check_out = formData.check_out;

      const { data, error } = await supabase
        .from('attendance')
        .upsert(payload, { onConflict: 'employee_id, attendance_date' })
        .select()
        .single();

      if (error) throw error;

      await auditLogService.logAction({
        action: existing ? 'UPDATE_ATTENDANCE' : 'CREATE_ATTENDANCE',
        entityType: 'attendance',
        entityId: data?.id,
        oldValue: existing ? { status: existing.status } : null,
        newValue: { status: formData.status, date: formData.attendance_date },
      });

      return { success: true, error: null };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to save attendance' };
    }
  },
};
