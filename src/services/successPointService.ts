import { supabase } from '@/lib/supabase';
import type { SuccessPoint, SuccessPointWithDetails } from '@/types/models';
import type { AwardPointsFormData } from '@/types/forms';
import { useAuthStore } from '@/store/authStore';
import { auditLogService } from './auditLogService';

export const successPointService = {
  /**
   * Get points awarded to a specific employee
   */
  async getPointsByEmployee(
    employeeId: string,
    options?: {
      startDate?: string;
      endDate?: string;
    }
  ): Promise<{ data: SuccessPointWithDetails[]; error: string | null }> {
    try {
      let query = supabase
        .from('success_points')
        .select(`
          *,
          awarded_by_profile:profiles!success_points_awarded_by_fkey(name),
          task:tasks!success_points_task_id_fkey(description, task_date)
        `)
        .eq('employee_id', employeeId)
        .order('point_date', { ascending: false });

      if (options?.startDate) {
        query = query.gte('point_date', options.startDate);
      }
      if (options?.endDate) {
        query = query.lte('point_date', options.endDate);
      }

      const { data, error } = await query;
      if (error) throw error;
      return { data: (data as unknown as SuccessPointWithDetails[]) || [], error: null };
    } catch (err: any) {
      return { data: [], error: err.message || 'Failed to fetch success points' };
    }
  },

  /**
   * Get all awarded points across the firm (Owner view)
   */
  async getAllPoints(options?: {
    employeeId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{ data: SuccessPointWithDetails[]; error: string | null }> {
    try {
      let query = supabase
        .from('success_points')
        .select(`
          *,
          employee:profiles!success_points_employee_id_fkey(name, employee_id),
          awarded_by_profile:profiles!success_points_awarded_by_fkey(name),
          task:tasks!success_points_task_id_fkey(description, task_date)
        `)
        .order('point_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (options?.employeeId) {
        query = query.eq('employee_id', options.employeeId);
      }
      if (options?.startDate) {
        query = query.gte('point_date', options.startDate);
      }
      if (options?.endDate) {
        query = query.lte('point_date', options.endDate);
      }

      const { data, error } = await query;
      if (error) throw error;
      return { data: (data as unknown as SuccessPointWithDetails[]) || [], error: null };
    } catch (err: any) {
      return { data: [], error: err.message || 'Failed to fetch success points' };
    }
  },

  /**
   * Award Success Points (Owner only)
   */
  async awardPoints(formData: AwardPointsFormData): Promise<{ success: boolean; error: string | null }> {
    try {
      // Robust current user resolution across session, getUser, and auth store
      let userId: string | null = null;

      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session?.user?.id) {
        userId = sessionData.session.user.id;
      } else {
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user?.id) {
          userId = userData.user.id;
        } else {
          const storeUser = useAuthStore.getState().user;
          const storeProfile = useAuthStore.getState().profile;
          userId = storeUser?.id || storeProfile?.id || null;
        }
      }

      if (!userId) {
        throw new Error('You must be logged in to award points. Please sign in with your Owner account.');
      }

      const { data, error } = await supabase
        .from('success_points')
        .insert({
          employee_id: formData.employee_id,
          point_date: formData.point_date,
          points: formData.points,
          reason: formData.reason,
          task_id: formData.task_id || null,
          awarded_by: userId,
        })
        .select()
        .single();

      if (error) {
        // If Supabase RLS rejected due to missing auth.uid() in client preview mode
        if (error.code === '42501' || error.message?.includes('row-level security')) {
          throw new Error('Database RLS authorization denied. Please sign in with your real Supabase Auth Owner account (owner@successtraders.com) rather than preview mode.');
        }
        throw error;
      }

      await auditLogService.logAction({
        action: 'AWARD_SUCCESS_POINTS',
        entityType: 'success_points',
        entityId: data.id,
        newValue: {
          employee_id: formData.employee_id,
          points: formData.points,
          reason: formData.reason,
        },
      });

      return { success: true, error: null };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to award success points' };
    }
  },

  /**
   * Delete or revoke awarded points (Owner only)
   */
  async deletePoints(id: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase.from('success_points').delete().eq('id', id);
      if (error) throw error;
      return { success: true, error: null };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to delete success points' };
    }
  },
};
