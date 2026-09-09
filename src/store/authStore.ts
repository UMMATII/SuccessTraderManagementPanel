import { create } from 'zustand';
import type { User, Session } from '@supabase/supabase-js';
import type { Profile, UserRole } from '@/types/models';
import { authService } from '@/services/authService';
import { profileService } from '@/services/profileService';
import { isSupabaseConfigured } from '@/lib/supabase';

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  role: UserRole | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  clearError: () => void;
  // Fallback demo switcher for local inspection if Supabase credentials are pending
  setDemoProfile: (demoRole: UserRole) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  profile: null,
  role: null,
  isLoading: true,
  isInitialized: false,
  error: null,

  initialize: async () => {
    try {
      set({ isLoading: true, error: null });

      if (!isSupabaseConfigured()) {
        // Standby mode if Supabase env credentials are not set yet
        set({ isLoading: false, isInitialized: true });
        return;
      }

      const session = await authService.getSession();
      if (session) {
        const profile = await profileService.getCurrentProfile();
        set({
          session,
          user: session.user,
          profile,
          role: profile?.role || null,
        });
      }

      // Listen to auth changes
      authService.onAuthStateChange(async (updatedSession) => {
        if (updatedSession) {
          const profile = await profileService.getCurrentProfile();
          set({
            session: updatedSession,
            user: updatedSession.user,
            profile,
            role: profile?.role || null,
          });
        } else {
          set({ session: null, user: null, profile: null, role: null });
        }
      });
    } catch (err: any) {
      console.error('Auth initialization error:', err);
      set({ error: err.message || 'Authentication error' });
    } finally {
      set({ isLoading: false, isInitialized: true });
    }
  },

  signIn: async (email: string, password: string): Promise<boolean> => {
    try {
      set({ isLoading: true, error: null });
      const data = await authService.signIn(email, password);
      if (data.session) {
        const profile = await profileService.getCurrentProfile();
        set({
          session: data.session,
          user: data.user,
          profile,
          role: profile?.role || null,
          isLoading: false,
        });
        return true;
      }
      return false;
    } catch (err: any) {
      set({ error: err.message || 'Invalid credentials or login failed', isLoading: false });
      return false;
    }
  },

  signOut: async () => {
    try {
      set({ isLoading: true });
      if (isSupabaseConfigured()) {
        await authService.signOut();
      }
      set({
        session: null,
        user: null,
        profile: null,
        role: null,
        isLoading: false,
      });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  refreshProfile: async () => {
    const profile = await profileService.getCurrentProfile();
    set({ profile, role: profile?.role || null });
  },

  clearError: () => set({ error: null }),

  setDemoProfile: (demoRole: UserRole) => {
    const demoProfile: Profile = {
      id: demoRole === 'OWNER' ? '11111111-1111-1111-1111-111111111111' : '22222222-2222-2222-2222-222222222222',
      employee_id: demoRole === 'OWNER' ? 'OWNER-001' : 'EMP-101',
      name: demoRole === 'OWNER' ? 'Zayn Khan (Owner)' : 'Tariq Al-Mansoor',
      role: demoRole,
      status: 'ACTIVE',
      joining_date: '2025-01-01',
      avatar_url: demoRole === 'OWNER'
        ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
        : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    set({
      user: { id: demoProfile.id, email: `${demoProfile.employee_id.toLowerCase()}@successtraders.com` } as any,
      profile: demoProfile,
      role: demoRole,
      error: null,
    });
  },
}));
