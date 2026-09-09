import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types/models';
import { auditLogService } from './auditLogService';

export const profileService = {
  /**
   * Fetch profile for current authenticated user
   */
  async getCurrentProfile(): Promise<Profile | null> {
    let userId: string | null = null;
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData?.session?.user?.id) {
      userId = sessionData.session.user.id;
    } else {
      const { data: userData } = await supabase.auth.getUser();
      userId = userData?.user?.id || null;
    }

    if (!userId) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching current profile:', error);
      return null;
    }

    return data;
  },

  /**
   * Fetch profile by user ID
   */
  async getProfileById(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile by ID:', error);
      return null;
    }

    return data;
  },

  /**
   * Update permitted profile fields for the current user
   */
  async updateProfile(
    userId: string,
    updates: {
      name?: string;
      avatar_url?: string | null;
      joining_date?: string | null;
    }
  ): Promise<{ data: Profile | null; error: string | null }> {
    try {
      const oldProfile = await this.getProfileById(userId);

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;

      await auditLogService.logAction({
        action: 'UPDATE_EMPLOYEE',
        entityType: 'profiles',
        entityId: userId,
        oldValue: oldProfile ? { name: oldProfile.name, avatar_url: oldProfile.avatar_url } : null,
        newValue: { ...updates },
      });

      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message || 'Failed to update profile' };
    }
  },
};
