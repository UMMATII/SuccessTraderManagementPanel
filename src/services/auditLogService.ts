import { supabase } from '@/lib/supabase';
import type { AuditAction, AuditLogWithUser } from '@/types/models';
import type { Json } from '@/types/database.types';
import { useAuthStore } from '@/store/authStore';

export const auditLogService = {
  /**
   * Record an administrative or security audit event in the database
   */
  async logAction(params: {
    action: AuditAction;
    entityType: string;
    entityId?: string | null;
    oldValue?: Json | null;
    newValue?: Json | null;
  }) {
    try {
      let userId: string | null = null;
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session?.user?.id) {
        userId = sessionData.session.user.id;
      } else {
        const { data: userData } = await supabase.auth.getUser();
        userId = userData?.user?.id || useAuthStore.getState().user?.id || useAuthStore.getState().profile?.id || null;
      }

      const { error } = await supabase.from('audit_logs').insert({
        user_id: userId,
        action: params.action,
        entity_type: params.entityType,
        entity_id: params.entityId || null,
        old_value: params.oldValue ?? null,
        new_value: params.newValue ?? null,
      });

      if (error) {
        console.warn('Failed to record audit log:', error.message);
      }
    } catch (err) {
      console.warn('Audit logging exception:', err);
    }
  },

  /**
   * Fetch audit logs for Owner inspection
   */
  async getAuditLogs(options?: {
    limit?: number;
    action?: string;
  }): Promise<{ data: AuditLogWithUser[]; error: string | null }> {
    try {
      let query = supabase
        .from('audit_logs')
        .select(`
          id,
          user_id,
          action,
          entity_type,
          entity_id,
          old_value,
          new_value,
          created_at,
          user:profiles!audit_logs_user_id_fkey(name, employee_id, role)
        `)
        .order('created_at', { ascending: false });

      if (options?.action) {
        query = query.eq('action', options.action);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      } else {
        query = query.limit(100);
      }

      const { data, error } = await query;
      if (error) throw error;

      return { data: (data as unknown as AuditLogWithUser[]) || [], error: null };
    } catch (err: any) {
      return { data: [], error: err.message || 'Failed to fetch audit logs' };
    }
  },
};
