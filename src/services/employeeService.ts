import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database.types';
import type { Profile, ProfileWithStats } from '@/types/models';
import type { CreateEmployeeFormData, EditEmployeeFormData } from '@/types/forms';
import { auditLogService } from './auditLogService';

export const employeeService = {
  /**
   * Fetch all employees for Owner portal with today's activity and month-to-date metrics
   */
  async getEmployees(): Promise<{ data: ProfileWithStats[]; error: string | null }> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
      const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0];

      // 1. Fetch profiles of role EMPLOYEE
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'EMPLOYEE')
        .order('employee_id', { ascending: true });

      if (profilesError) throw profilesError;
      if (!profiles || profiles.length === 0) return { data: [], error: null };

      // 2. Fetch today's attendance
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('employee_id, status')
        .eq('attendance_date', today);

      const attendanceMap = new Map<string, any>();
      attendanceData?.forEach((att) => attendanceMap.set(att.employee_id, att.status));

      // 3. Fetch today's tasks count
      const { data: todayTasks } = await supabase
        .from('tasks')
        .select('employee_id')
        .eq('task_date', today);

      const todayTasksMap = new Map<string, number>();
      todayTasks?.forEach((t) => {
        todayTasksMap.set(t.employee_id, (todayTasksMap.get(t.employee_id) || 0) + 1);
      });

      // 4. Fetch monthly success points
      const { data: pointsData } = await supabase
        .from('success_points')
        .select('employee_id, points')
        .gte('point_date', startOfMonth)
        .lte('point_date', endOfMonth);

      const pointsMap = new Map<string, number>();
      pointsData?.forEach((sp) => {
        pointsMap.set(sp.employee_id, (pointsMap.get(sp.employee_id) || 0) + Number(sp.points));
      });

      // 5. Fetch monthly working hours from tasks
      const { data: monthlyTasks } = await supabase
        .from('tasks')
        .select('employee_id, duration_minutes')
        .gte('task_date', startOfMonth)
        .lte('task_date', endOfMonth);

      const minutesMap = new Map<string, number>();
      monthlyTasks?.forEach((t) => {
        minutesMap.set(t.employee_id, (minutesMap.get(t.employee_id) || 0) + (t.duration_minutes || 0));
      });

      // Combine into ProfileWithStats
      const result: ProfileWithStats[] = profiles.map((p) => {
        const todayAttendance = attendanceMap.get(p.id) || 'NOT_MARKED';
        const todayTasksCount = todayTasksMap.get(p.id) || 0;
        const monthlyPoints = pointsMap.get(p.id) || 0;
        const totalMinutes = minutesMap.get(p.id) || 0;
        const monthlyWorkingHours = Number((totalMinutes / 60).toFixed(1));

        return {
          ...p,
          todayAttendance,
          todayTasksCount,
          monthlyPoints,
          monthlyWorkingHours,
        };
      });

      // Compute rank based on monthly points descending, then working hours
      result.sort((a, b) => {
        if ((b.monthlyPoints || 0) !== (a.monthlyPoints || 0)) {
          return (b.monthlyPoints || 0) - (a.monthlyPoints || 0);
        }
        return (b.monthlyWorkingHours || 0) - (a.monthlyWorkingHours || 0);
      });

      result.forEach((item, index) => {
        item.rank = index + 1;
      });

      return { data: result, error: null };
    } catch (err: any) {
      console.error('Error in getEmployees:', err);
      return { data: [], error: err.message || 'Failed to fetch employees' };
    }
  },

  /**
   * Get complete employee details by ID including overview stats
   */
  async getEmployeeById(id: string): Promise<{ data: Profile | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message || 'Failed to fetch employee' };
    }
  },

  /**
   * Create an employee account without modifying or replacing the Admin's session.
   * Uses an isolated, in-memory Supabase client (persistSession: false, no storage)
   * so that the newly created Employee credentials never touch localStorage or trigger
   * onAuthStateChange on the main Admin client.
   * Requires NO service role key.
   */
  async createEmployee(payload: CreateEmployeeFormData): Promise<{ success: boolean; error: string | null }> {
    try {
      // 1. Verify current Admin session exists
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session?.user) {
        return {
          success: false,
          error: 'Administrator authentication required. Please sign in again.',
        };
      }

      // 2. Check if employee_id is already assigned
      const { data: existingEmp } = await supabase
        .from('profiles')
        .select('id')
        .eq('employee_id', payload.employee_id)
        .maybeSingle();

      if (existingEmp) {
        return {
          success: false,
          error: `Employee ID "${payload.employee_id}" is already assigned.`,
        };
      }

      // 3. Create an isolated in-memory client using public anon key (NO service role key needed)
      // persistSession: false and no-op storage ensures the Admin's session is never touched!
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

      const isolatedClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
          storage: {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          },
        },
      });

      // 4. Register the new employee account via isolated client
      const { data: authData, error: authError } = await isolatedClient.auth.signUp({
        email: payload.email,
        password: payload.temporaryPassword,
        options: {
          data: {
            employee_id: payload.employee_id,
            name: payload.name,
            role: 'EMPLOYEE',
            joining_date: payload.joining_date,
          },
        },
      });

      if (authError) {
        const errMsg = authError.message || '';
        if (errMsg.toLowerCase().includes('already') || errMsg.toLowerCase().includes('registered')) {
          return { success: false, error: 'An account with this email already exists.' };
        }
        return { success: false, error: authError.message };
      }

      if (authData.user) {
        // 5. Ensure profile row exists via the authenticated Admin client
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: authData.user.id,
            employee_id: payload.employee_id,
            name: payload.name,
            role: 'EMPLOYEE',
            status: payload.status,
            joining_date: payload.joining_date,
          });

        if (profileError) {
          console.warn('Profile upsert note:', profileError.message);
        }

        // 6. Record audit log under Admin's account
        await auditLogService.logAction({
          action: 'CREATE_EMPLOYEE',
          entityType: 'profiles',
          entityId: authData.user.id,
          newValue: {
            employee_id: payload.employee_id,
            name: payload.name,
            email: payload.email,
            status: payload.status,
          },
        });
      }

      // Admin's browser session in the main client is completely preserved
      return { success: true, error: null };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to create employee' };
    }
  },

  /**
   * Update employee details (Owner operation)
   */
  async updateEmployee(
    id: string,
    updates: EditEmployeeFormData
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      const { data: oldProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      const { error } = await supabase
        .from('profiles')
        .update({
          name: updates.name,
          joining_date: updates.joining_date || null,
          status: updates.status,
          avatar_url: updates.avatar_url || null,
        })
        .eq('id', id);

      if (error) throw error;

      await auditLogService.logAction({
        action: 'UPDATE_EMPLOYEE',
        entityType: 'profiles',
        entityId: id,
        oldValue: oldProfile ? { name: oldProfile.name, status: oldProfile.status } : null,
        newValue: { ...updates },
      });

      return { success: true, error: null };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to update employee' };
    }
  },

  /**
   * Toggle employee active / inactive status
   */
  async toggleEmployeeStatus(
    id: string,
    newStatus: 'ACTIVE' | 'INACTIVE'
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      await auditLogService.logAction({
        action: newStatus === 'ACTIVE' ? 'ACTIVATE_EMPLOYEE' : 'DEACTIVATE_EMPLOYEE',
        entityType: 'profiles',
        entityId: id,
        newValue: { status: newStatus },
      });

      return { success: true, error: null };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to change employee status' };
    }
  },

  /**
   * Reset employee password by triggering password reset email
   */
  async sendEmployeePasswordReset(email: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;

      await auditLogService.logAction({
        action: 'RESET_PASSWORD',
        entityType: 'auth.users',
        newValue: { email },
      });

      return { success: true, error: null };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to send password reset' };
    }
  },
};
