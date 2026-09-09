import { create } from 'zustand';
import type { SuccessPointWithDetails } from '@/types/models';
import type { AwardPointsFormData } from '@/types/forms';
import { successPointService } from '@/services/successPointService';

interface SuccessPointState {
  points: SuccessPointWithDetails[];
  allPoints: SuccessPointWithDetails[];
  isLoading: boolean;
  error: string | null;

  fetchEmployeePoints: (employeeId: string) => Promise<void>;
  fetchAllPoints: (options?: { employeeId?: string }) => Promise<void>;
  awardPoints: (formData: AwardPointsFormData) => Promise<{ success: boolean; error: string | null }>;
  deletePoints: (id: string) => Promise<{ success: boolean; error: string | null }>;
}

export const useSuccessPointStore = create<SuccessPointState>((set) => ({
  points: [],
  allPoints: [],
  isLoading: false,
  error: null,

  fetchEmployeePoints: async (employeeId: string) => {
    set({ isLoading: true, error: null });
    const { data, error } = await successPointService.getPointsByEmployee(employeeId);
    set({ points: data, error, isLoading: false });
  },

  fetchAllPoints: async (options) => {
    set({ isLoading: true, error: null });
    const { data, error } = await successPointService.getAllPoints(options);
    set({ allPoints: data, error, isLoading: false });
  },

  awardPoints: async (formData) => {
    set({ isLoading: true, error: null });
    const { success, error } = await successPointService.awardPoints(formData);
    set({ isLoading: false, error });
    return { success, error };
  },

  deletePoints: async (id) => {
    set({ isLoading: true, error: null });
    const { success, error } = await successPointService.deletePoints(id);
    set({ isLoading: false, error });
    return { success, error };
  },
}));
