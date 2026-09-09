import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSuccessPointStore } from '@/store/successPointStore';
import { useEmployeeStore } from '@/store/employeeStore';
import { useTaskStore } from '@/store/taskStore';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Dialog } from '@/components/ui/Dialog';
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
import { formatDate, getCurrentDateString } from '@/lib/date-utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { awardPointsSchema, type AwardPointsFormData } from '@/types/forms';
import { Award, Plus, Trash2, Filter } from 'lucide-react';
import { toast } from 'sonner';

export function SuccessPointsAdminPage() {
  const [searchParams] = useSearchParams();
  const defaultEmpId = searchParams.get('employeeId') || '';

  const { allPoints, isLoading, fetchAllPoints, awardPoints, deletePoints } = useSuccessPointStore();
  const { employees, fetchEmployees } = useEmployeeStore();
  const { tasks, fetchEmployeeTasks } = useTaskStore();

  const [awardModalOpen, setAwardModalOpen] = useState(Boolean(defaultEmpId));
  const [filterEmployeeId, setFilterEmployeeId] = useState(defaultEmpId);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<AwardPointsFormData>({
    resolver: zodResolver(awardPointsSchema),
    defaultValues: {
      employee_id: defaultEmpId,
      point_date: getCurrentDateString(),
      points: 10,
      reason: '',
      task_id: '',
    },
  });

  const selectedAwardee = watch('employee_id');

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    fetchAllPoints({ employeeId: filterEmployeeId || undefined });
  }, [filterEmployeeId, fetchAllPoints]);

  useEffect(() => {
    if (selectedAwardee) {
      fetchEmployeeTasks(selectedAwardee);
    }
  }, [selectedAwardee, fetchEmployeeTasks]);

  const onAwardSubmit = async (data: AwardPointsFormData) => {
    try {
      setIsSubmitting(true);
      const res = await awardPoints(data);
      if (res.success) {
        toast.success(`Awarded ${data.points} Success Points!`);
        reset();
        setAwardModalOpen(false);
        fetchAllPoints();
      } else {
        toast.error(res.error || 'Failed to award points');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to revoke these success points?')) return;
    const res = await deletePoints(id);
    if (res.success) {
      toast.success('Points revoked');
      fetchAllPoints({ employeeId: filterEmployeeId || undefined });
    } else {
      toast.error(res.error || 'Failed to revoke points');
    }
  };

  const totalAwarded = allPoints.reduce((acc, p) => acc + Number(p.points), 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
            Success Points Center
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Recognize and award excellence in trade execution, discipline, and risk management
          </p>
        </div>

        <Button
          onClick={() => setAwardModalOpen(true)}
          variant="primary"
          size="sm"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Award Success Points
        </Button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="p-4 bg-slate-900/60">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Total Awards</span>
          <p className="text-2xl font-bold text-white mt-1">{allPoints.length}</p>
        </Card>
        <Card className="p-4 bg-slate-900/60">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Total Points Granted</span>
          <p className="text-2xl font-bold text-amber-400 mt-1">{totalAwarded} pts</p>
        </Card>
        <Card className="p-4 bg-slate-900/60">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Avg Points / Award</span>
          <p className="text-2xl font-bold text-indigo-400 mt-1">
            {allPoints.length > 0 ? (totalAwarded / allPoints.length).toFixed(1) : '0.0'} pts
          </p>
        </Card>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between">
        <div className="w-64">
          <Select
            options={[
              { value: '', label: 'All Traders' },
              ...employees.map((e) => ({ value: e.id, label: `${e.name} (${e.employee_id})` })),
            ]}
            value={filterEmployeeId}
            onChange={(e) => setFilterEmployeeId(e.target.value)}
          />
        </div>
      </div>

      {/* Awards History Table */}
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : allPoints.length === 0 ? (
        <EmptyState
          icon={<Award className="w-6 h-6 text-slate-500" />}
          title="No Success Points Recorded"
          description="No points have been granted yet. Click below to award points to a deserving trader."
          action={
            <Button size="sm" variant="outline" onClick={() => setAwardModalOpen(true)}>
              Award Points Now
            </Button>
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Trader</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Points</TableHead>
              <TableHead>Reason & Justification</TableHead>
              <TableHead>Associated Task</TableHead>
              <TableHead>Awarded By</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allPoints.map((pt) => (
              <TableRow key={pt.id}>
                <TableCell>
                  <div className="font-semibold text-slate-200">
                    {pt.employee?.name || 'Trader'}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {pt.employee?.employee_id}
                  </div>
                </TableCell>
                <TableCell className="whitespace-nowrap font-medium text-slate-300">
                  {formatDate(pt.point_date)}
                </TableCell>
                <TableCell>
                  <span className="font-bold text-amber-400 text-sm">
                    +{pt.points} pts
                  </span>
                </TableCell>
                <TableCell className="max-w-xs text-slate-200 text-xs">
                  {pt.reason}
                </TableCell>
                <TableCell className="max-w-xs text-slate-400 text-xs truncate">
                  {pt.task?.description || 'General Performance'}
                </TableCell>
                <TableCell className="text-slate-400 text-xs">
                  {pt.awarded_by_profile?.name || 'Owner'}
                </TableCell>
                <TableCell className="text-right">
                  <button
                    onClick={() => handleDelete(pt.id)}
                    title="Revoke Points"
                    className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* AWARD SUCCESS POINTS MODAL */}
      <Dialog
        isOpen={awardModalOpen}
        onClose={() => setAwardModalOpen(false)}
        title="Award Success Points"
        description="Grant performance points with justification directly linked to trader audit records"
      >
        <form onSubmit={handleSubmit(onAwardSubmit)} className="space-y-4">
          <Select
            label="Select Trader"
            options={[
              { value: '', label: '-- Choose Trader --' },
              ...employees.map((e) => ({ value: e.id, label: `${e.name} (${e.employee_id})` })),
            ]}
            error={errors.employee_id?.message}
            {...register('employee_id')}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Award Date"
              type="date"
              error={errors.point_date?.message}
              {...register('point_date')}
            />
            <Input
              label="Points Amount"
              type="number"
              min="0"
              step="1"
              error={errors.points?.message}
              {...register('points')}
            />
          </div>

          {selectedAwardee && tasks.length > 0 && (
            <Select
              label="Link to Specific Task (Optional)"
              options={[
                { value: '', label: 'None (General Performance / Conduct)' },
                ...tasks.map((t) => ({
                  value: t.id,
                  label: `${formatDate(t.task_date)}: ${t.description.slice(0, 45)}...`,
                })),
              ]}
              {...register('task_id')}
            />
          )}

          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Reason / Justification
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Exceptional risk discipline during NFP release with zero drawdown."
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
              {...register('reason')}
            />
            {errors.reason && (
              <p className="text-xs text-rose-400 font-medium">{errors.reason.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setAwardModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
            >
              Confirm Award
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
