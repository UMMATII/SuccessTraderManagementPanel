import { create } from 'zustand';
import type { Attendance, AttendanceWithEmployee, AttendanceStatus } from '@/types/models';
import type { AttendanceUpdateFormData } from '@/types/forms';
import { attendanceService } from '@/services/attendanceService';
import { getCurrentDateString } from '@/lib/date-utils';

interface AttendanceState {
  records: Attendance[];
  allRecords: AttendanceWithEmployee[];
  isLoading: boolean;
  error: string | null;
  selectedDate: string;

  setSelectedDate: (date: string) => void;
  fetchEmployeeAttendance: (employeeId: string, startDate?: string, endDate?: string) => Promise<void>;
  fetchAllAttendance: (options?: { date?: string; employeeId?: string; status?: AttendanceStatus }) => Promise<void>;
  recordAttendance: (formData: AttendanceUpdateFormData) => Promise<{ success: boolean; error: string | null }>;
}

export const useAttendanceStore = create<AttendanceState>((set, get) => ({
  records: [],
  allRecords: [],
  isLoading: false,
  error: null,
  selectedDate: getCurrentDateString(),

  setSelectedDate: (date: string) => set({ selectedDate: date }),

  fetchEmployeeAttendance: async (employeeId: string, startDate?: string, endDate?: string) => {
    set({ isLoading: true, error: null });
    const { data, error } = await attendanceService.getAttendanceByEmployee(employeeId, {
      startDate,
      endDate,
    });
    set({ records: data, error, isLoading: false });
  },

  fetchAllAttendance: async (options) => {
    set({ isLoading: true, error: null });
    const { data, error } = await attendanceService.getAllAttendance(options);
    set({ allRecords: data, error, isLoading: false });
  },

  recordAttendance: async (formData) => {
    set({ isLoading: true, error: null });
    const { success, error } = await attendanceService.recordAttendance(formData);
    set({ isLoading: false, error });
    return { success, error };
  },
}));
