import { create } from 'zustand';
import type { ProfileWithStats } from '@/types/models';
import { employeeService } from '@/services/employeeService';

interface EmployeeState {
  employees: ProfileWithStats[];
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  statusFilter: 'ALL' | 'ACTIVE' | 'INACTIVE';
  
  fetchEmployees: () => Promise<void>;
  setSearchQuery: (query: string) => void;
  setStatusFilter: (status: 'ALL' | 'ACTIVE' | 'INACTIVE') => void;
  toggleStatus: (id: string, newStatus: 'ACTIVE' | 'INACTIVE') => Promise<boolean>;
}

export const useEmployeeStore = create<EmployeeState>((set, get) => ({
  employees: [],
  isLoading: false,
  error: null,
  searchQuery: '',
  statusFilter: 'ALL',

  fetchEmployees: async () => {
    set({ isLoading: true, error: null });
    const { data, error } = await employeeService.getEmployees();
    set({ employees: data, error, isLoading: false });
  },

  setSearchQuery: (query) => set({ searchQuery: query }),
  setStatusFilter: (status) => set({ statusFilter: status }),

  toggleStatus: async (id, newStatus) => {
    const { success, error } = await employeeService.toggleEmployeeStatus(id, newStatus);
    if (success) {
      await get().fetchEmployees();
      return true;
    }
    set({ error });
    return false;
  },
}));
