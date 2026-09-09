import { supabase } from '@/lib/supabase';
import type { Task, TaskWithEmployee } from '@/types/models';
import type { TaskFormData } from '@/types/forms';
import { calculateDurationInMinutes } from '@/lib/date-utils';
import { hasTaskOverlap } from '@/lib/overlap-validator';
import { auditLogService } from './auditLogService';

export const taskService = {
  /**
   * Fetch tasks for a specific employee with optional date/month filtering
   */
  async getTasksByEmployee(
    employeeId: string,
    options?: {
      date?: string;
      startDate?: string;
      endDate?: string;
      status?: string;
    }
  ): Promise<{ data: Task[]; error: string | null }> {
    try {
      let query = supabase
        .from('tasks')
        .select('*')
        .eq('employee_id', employeeId)
        .order('task_date', { ascending: false })
        .order('time_from', { ascending: true });

      if (options?.date) {
        query = query.eq('task_date', options.date);
      }
      if (options?.startDate) {
        query = query.gte('task_date', options.startDate);
      }
      if (options?.endDate) {
        query = query.lte('task_date', options.endDate);
      }
      if (options?.status) {
        query = query.eq('status', options.status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return { data: data || [], error: null };
    } catch (err: any) {
      return { data: [], error: err.message || 'Failed to fetch tasks' };
    }
  },

  /**
   * Fetch all tasks across employees for Owner portal
   */
  async getAllTasks(options?: {
    employeeId?: string;
    date?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{ data: TaskWithEmployee[]; error: string | null }> {
    try {
      let query = supabase
        .from('tasks')
        .select(`
          *,
          employee:profiles!tasks_employee_id_fkey(name, employee_id, avatar_url)
        `)
        .order('task_date', { ascending: false })
        .order('time_from', { ascending: false });

      if (options?.employeeId) {
        query = query.eq('employee_id', options.employeeId);
      }
      if (options?.date) {
        query = query.eq('task_date', options.date);
      }
      if (options?.startDate) {
        query = query.gte('task_date', options.startDate);
      }
      if (options?.endDate) {
        query = query.lte('task_date', options.endDate);
      }

      const { data, error } = await query;
      if (error) throw error;
      return { data: (data as unknown as TaskWithEmployee[]) || [], error: null };
    } catch (err: any) {
      return { data: [], error: err.message || 'Failed to fetch all tasks' };
    }
  },

  /**
   * Create a new task for an employee.
   * Performs client-side overlap check first, then database insertion (which triggers PostgreSQL overlap trigger).
   */
  async createTask(
    employeeId: string,
    formData: TaskFormData
  ): Promise<{ data: Task | null; error: string | null }> {
    try {
      // 1. Calculate duration automatically
      const durationMinutes = calculateDurationInMinutes(formData.time_from, formData.time_to);
      if (durationMinutes <= 0) {
        return { data: null, error: 'End time must be later than start time' };
      }

      // 2. Overlap validation: fetch existing tasks for that employee and date
      const { data: existingTasks } = await supabase
        .from('tasks')
        .select('id, time_from, time_to')
        .eq('employee_id', employeeId)
        .eq('task_date', formData.task_date);

      if (existingTasks && existingTasks.length > 0) {
        const overlapResult = hasTaskOverlap(
          { time_from: formData.time_from, time_to: formData.time_to },
          existingTasks
        );
        if (overlapResult.hasOverlap) {
          return { data: null, error: overlapResult.errorMessage || 'This task overlaps with an existing task period.' };
        }
      }

      // 3. Insert task record
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          employee_id: employeeId,
          task_date: formData.task_date,
          description: formData.description,
          time_from: formData.time_from,
          time_to: formData.time_to,
          duration_minutes: durationMinutes,
          acceptance_criteria: formData.acceptance_criteria,
          status: formData.status || 'COMPLETED',
        })
        .select()
        .single();

      if (error) throw error;

      await auditLogService.logAction({
        action: 'CREATE_TASK',
        entityType: 'tasks',
        entityId: data.id,
        newValue: {
          task_date: data.task_date,
          time_from: data.time_from,
          time_to: data.time_to,
          duration_minutes: data.duration_minutes,
        },
      });

      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message || 'Failed to create task' };
    }
  },

  /**
   * Update an existing task
   */
  async updateTask(
    taskId: string,
    employeeId: string,
    formData: TaskFormData
  ): Promise<{ data: Task | null; error: string | null }> {
    try {
      const durationMinutes = calculateDurationInMinutes(formData.time_from, formData.time_to);
      if (durationMinutes <= 0) {
        return { data: null, error: 'End time must be later than start time' };
      }

      // Overlap check excluding current task
      const { data: existingTasks } = await supabase
        .from('tasks')
        .select('id, time_from, time_to')
        .eq('employee_id', employeeId)
        .eq('task_date', formData.task_date);

      if (existingTasks && existingTasks.length > 0) {
        const overlapResult = hasTaskOverlap(
          { time_from: formData.time_from, time_to: formData.time_to, excludeTaskId: taskId },
          existingTasks
        );
        if (overlapResult.hasOverlap) {
          return { data: null, error: overlapResult.errorMessage || 'This task overlaps with an existing task period.' };
        }
      }

      const { data, error } = await supabase
        .from('tasks')
        .update({
          task_date: formData.task_date,
          description: formData.description,
          time_from: formData.time_from,
          time_to: formData.time_to,
          duration_minutes: durationMinutes,
          acceptance_criteria: formData.acceptance_criteria,
          status: formData.status,
        })
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;

      await auditLogService.logAction({
        action: 'UPDATE_TASK',
        entityType: 'tasks',
        entityId: taskId,
        newValue: {
          task_date: data.task_date,
          time_from: data.time_from,
          time_to: data.time_to,
          duration_minutes: data.duration_minutes,
        },
      });

      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message || 'Failed to update task' };
    }
  },

  /**
   * Delete a task
   */
  async deleteTask(taskId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', taskId);
      if (error) throw error;
      return { success: true, error: null };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to delete task' };
    }
  },
};
