import { create } from 'zustand';
import type { Task, TaskWithEmployee } from '@/types/models';
import type { TaskFormData } from '@/types/forms';
import { taskService } from '@/services/taskService';
import { getCurrentDateString } from '@/lib/date-utils';

interface TaskState {
  tasks: Task[];
  allTasks: TaskWithEmployee[];
  isLoading: boolean;
  error: string | null;
  selectedDate: string;

  setSelectedDate: (date: string) => void;
  fetchEmployeeTasks: (employeeId: string, date?: string) => Promise<void>;
  fetchAllTasks: (options?: { date?: string; employeeId?: string }) => Promise<void>;
  createTask: (employeeId: string, formData: TaskFormData) => Promise<{ success: boolean; error: string | null }>;
  updateTask: (taskId: string, employeeId: string, formData: TaskFormData) => Promise<{ success: boolean; error: string | null }>;
  deleteTask: (taskId: string) => Promise<{ success: boolean; error: string | null }>;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  allTasks: [],
  isLoading: false,
  error: null,
  selectedDate: getCurrentDateString(),

  setSelectedDate: (date: string) => set({ selectedDate: date }),

  fetchEmployeeTasks: async (employeeId: string, date?: string) => {
    set({ isLoading: true, error: null });
    const filterDate = date !== undefined ? date : get().selectedDate;
    const { data, error } = await taskService.getTasksByEmployee(employeeId, {
      date: filterDate || undefined,
    });
    set({ tasks: data, error, isLoading: false });
  },

  fetchAllTasks: async (options) => {
    set({ isLoading: true, error: null });
    const { data, error } = await taskService.getAllTasks(options);
    set({ allTasks: data, error, isLoading: false });
  },

  createTask: async (employeeId: string, formData: TaskFormData) => {
    set({ isLoading: true, error: null });
    const { data, error } = await taskService.createTask(employeeId, formData);
    set({ isLoading: false, error });

    if (data) {
      await get().fetchEmployeeTasks(employeeId);
      return { success: true, error: null };
    }
    return { success: false, error };
  },

  updateTask: async (taskId: string, employeeId: string, formData: TaskFormData) => {
    set({ isLoading: true, error: null });
    const { data, error } = await taskService.updateTask(taskId, employeeId, formData);
    set({ isLoading: false, error });

    if (data) {
      await get().fetchEmployeeTasks(employeeId);
      return { success: true, error: null };
    }
    return { success: false, error };
  },

  deleteTask: async (taskId: string) => {
    set({ isLoading: true, error: null });
    const { success, error } = await taskService.deleteTask(taskId);
    set({ isLoading: false, error });
    return { success, error };
  },
}));
