import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useTaskStore } from '@/store/taskStore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { taskSchema, type TaskFormData } from '@/types/forms';
import { calculateDurationInMinutes, getCurrentDateString } from '@/lib/date-utils';
import { ArrowLeft, Clock, PlusCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export function NewTaskPage() {
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const { createTask } = useTaskStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [calculatedDuration, setCalculatedDuration] = useState(0);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      task_date: getCurrentDateString(),
      time_from: '09:00',
      time_to: '11:00',
      description: '',
      acceptance_criteria: '',
      status: 'COMPLETED',
    },
  });

  const timeFrom = watch('time_from');
  const timeTo = watch('time_to');

  useEffect(() => {
    if (timeFrom && timeTo) {
      const minutes = calculateDurationInMinutes(timeFrom, timeTo);
      setCalculatedDuration(minutes);
    } else {
      setCalculatedDuration(0);
    }
  }, [timeFrom, timeTo]);

  const onSubmit = async (data: TaskFormData) => {
    if (!profile?.id) return;
    try {
      setIsSubmitting(true);
      const res = await createTask(profile.id, data);
      if (res.success) {
        toast.success('Daily task logged successfully');
        navigate('/employee/tasks');
      } else {
        toast.error(res.error || 'Failed to log task');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Back button */}
      <div>
        <Link
          to="/employee/tasks"
          className="inline-flex items-center text-xs font-semibold text-slate-400 hover:text-emerald-400 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          Back to Tasks Log
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-emerald-400" />
            Log New Trading Task
          </CardTitle>
          <CardDescription>
            Record your daily technical analysis, backtesting session, or trade execution review
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Task Date"
              type="date"
              error={errors.task_date?.message}
              {...register('task_date')}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Time From (Start)"
                type="time"
                error={errors.time_from?.message}
                {...register('time_from')}
              />
              <Input
                label="Time To (End)"
                type="time"
                error={errors.time_to?.message}
                {...register('time_to')}
              />
            </div>

            {/* Live Calculated Duration Badge */}
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-400" />
                Auto-calculated Duration:
              </span>
              <span className="font-bold text-emerald-400 font-mono text-sm">
                {calculatedDuration} minutes ({Number((calculatedDuration / 60).toFixed(1))}h)
              </span>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Task Description
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Backtest London Breakout strategy on GBP/USD with 50 trade sample."
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                {...register('description')}
              />
              {errors.description && (
                <p className="text-xs text-rose-400 font-medium">{errors.description.message}</p>
              )}
            </div>

            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Acceptance Criteria / Deliverables
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Spreadsheet updated with win-rate %, equity curve, and max drawdown."
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                {...register('acceptance_criteria')}
              />
              {errors.acceptance_criteria && (
                <p className="text-xs text-rose-400 font-medium">{errors.acceptance_criteria.message}</p>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <Link to="/employee/tasks">
                <Button type="button" variant="outline" size="sm">
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isSubmitting}
              >
                Submit Daily Task
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
