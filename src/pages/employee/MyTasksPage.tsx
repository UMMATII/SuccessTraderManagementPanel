import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useTaskStore } from '@/store/taskStore';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Dialog } from '@/components/ui/Dialog';
import { StatusBadge } from '@/components/ui/Badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/Table';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDate, formatTime, formatMinutesToHours } from '@/lib/date-utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { taskSchema, type TaskFormData } from '@/types/forms';
import type { Task } from '@/types/models';
import { ClipboardList, Plus, Search, Edit2, Trash2, Calendar } from 'lucide-react';
import { toast } from 'sonner';

export function MyTasksPage() {
  const { profile } = useAuthStore();
  const { tasks, isLoading, fetchEmployeeTasks, updateTask, deleteTask } = useTaskStore();

  const [dateFilter, setDateFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
  });

  useEffect(() => {
    if (profile?.id) {
      fetchEmployeeTasks(profile.id, dateFilter || undefined);
    }
  }, [profile?.id, dateFilter, fetchEmployeeTasks]);

  const openEdit = (task: Task) => {
    setSelectedTask(task);
    setValue('task_date', task.task_date);
    setValue('time_from', task.time_from.slice(0, 5));
    setValue('time_to', task.time_to.slice(0, 5));
    setValue('description', task.description);
    setValue('acceptance_criteria', task.acceptance_criteria);
    setValue('status', task.status);
    setEditModalOpen(true);
  };

  const onEditSubmit = async (data: TaskFormData) => {
    if (!selectedTask || !profile?.id) return;
    try {
      setIsSubmitting(true);
      const res = await updateTask(selectedTask.id, profile.id, data);
      if (res.success) {
        toast.success('Task updated successfully');
        setEditModalOpen(false);
        fetchEmployeeTasks(profile.id, dateFilter || undefined);
      } else {
        toast.error(res.error || 'Failed to update task');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    const res = await deleteTask(id);
    if (res.success) {
      toast.success('Task deleted');
      if (profile?.id) fetchEmployeeTasks(profile.id, dateFilter || undefined);
    } else {
      toast.error(res.error || 'Failed to delete task');
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.description.toLowerCase().includes(q) ||
      t.acceptance_criteria.toLowerCase().includes(q)
    );
  });

  const totalMinutes = filteredTasks.reduce((acc, t) => acc + (t.duration_minutes || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
            My Daily Tasks Log
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Your personal record of market analysis, backtesting, and execution sessions
          </p>
        </div>

        <Link to="/employee/tasks/new">
          <Button variant="primary" size="sm">
            <Plus className="w-4 h-4 mr-1.5" />
            Log New Task
          </Button>
        </Link>
      </div>

      {/* Summary KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="p-4 bg-slate-900/60">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Logged Sessions</span>
          <p className="text-2xl font-bold text-white mt-1">{filteredTasks.length}</p>
        </Card>
        <Card className="p-4 bg-slate-900/60">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Working Duration</span>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{formatMinutesToHours(totalMinutes)}</p>
        </Card>
        <Card className="p-4 bg-slate-900/60">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Average Session</span>
          <p className="text-2xl font-bold text-indigo-400 mt-1">
            {filteredTasks.length > 0 ? Math.round(totalMinutes / filteredTasks.length) : 0} min
          </p>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card className="p-4 bg-slate-900/40">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search descriptions and acceptance criteria..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <Input
            type="date"
            placeholder="All Dates"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
        </div>
      </Card>

      {/* Task Table */}
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : filteredTasks.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="w-6 h-6 text-slate-500" />}
          title="No Tasks Found"
          description="No tasks recorded for this period. Click below to add a task."
          action={
            <Link to="/employee/tasks/new">
              <Button size="sm" variant="outline">
                Add Task Now
              </Button>
            </Link>
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Time Window</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Acceptance Criteria</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTasks.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="whitespace-nowrap font-medium text-slate-200">
                  {formatDate(t.task_date)}
                </TableCell>
                <TableCell className="whitespace-nowrap text-slate-400">
                  {formatTime(t.time_from)} - {formatTime(t.time_to)}
                </TableCell>
                <TableCell className="whitespace-nowrap font-semibold text-emerald-400">
                  {t.duration_minutes} min
                </TableCell>
                <TableCell className="max-w-xs text-slate-200">
                  <p className="line-clamp-2">{t.description}</p>
                </TableCell>
                <TableCell className="max-w-xs text-slate-400 text-xs">
                  <p className="line-clamp-2">{t.acceptance_criteria}</p>
                </TableCell>
                <TableCell>
                  <StatusBadge status={t.status} />
                </TableCell>
                <TableCell className="text-right">
                  <div className="inline-flex items-center gap-1">
                    <button
                      onClick={() => openEdit(t)}
                      title="Edit Task"
                      className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(t.id)}
                      title="Delete Task"
                      className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* EDIT TASK MODAL */}
      <Dialog
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Task"
        description="Update task details and time intervals"
      >
        <form onSubmit={handleSubmit(onEditSubmit)} className="space-y-4">
          <Input
            label="Date"
            type="date"
            error={errors.task_date?.message}
            {...register('task_date')}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Time From"
              type="time"
              error={errors.time_from?.message}
              {...register('time_from')}
            />
            <Input
              label="Time To"
              type="time"
              error={errors.time_to?.message}
              {...register('time_to')}
            />
          </div>

          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Description
            </label>
            <textarea
              rows={3}
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              {...register('description')}
            />
            {errors.description && (
              <p className="text-xs text-rose-400 font-medium">{errors.description.message}</p>
            )}
          </div>

          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Acceptance Criteria
            </label>
            <textarea
              rows={3}
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              {...register('acceptance_criteria')}
            />
            {errors.acceptance_criteria && (
              <p className="text-xs text-rose-400 font-medium">{errors.acceptance_criteria.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEditModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
