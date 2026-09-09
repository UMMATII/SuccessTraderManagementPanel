import React, { useEffect, useState } from 'react';
import { useAttendanceStore } from '@/store/attendanceStore';
import { useEmployeeStore } from '@/store/employeeStore';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
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
import { formatDate, getCurrentDateString } from '@/lib/date-utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { attendanceUpdateSchema, type AttendanceUpdateFormData } from '@/types/forms';
import { CalendarCheck, Plus, Calendar, Filter, Users } from 'lucide-react';
import { toast } from 'sonner';

export function AttendanceAdminPage() {
  const { allRecords, isLoading, fetchAllAttendance, recordAttendance } = useAttendanceStore();
  const { employees, fetchEmployees } = useEmployeeStore();

  const [recordModalOpen, setRecordModalOpen] = useState(false);
  const [filterEmployeeId, setFilterEmployeeId] = useState('');
  const [filterDate, setFilterDate] = useState(getCurrentDateString());
  const [filterStatus, setFilterStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AttendanceUpdateFormData>({
    resolver: zodResolver(attendanceUpdateSchema),
    defaultValues: {
      attendance_date: getCurrentDateString(),
      status: 'PRESENT',
    },
  });

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    fetchAllAttendance({
      date: filterDate || undefined,
      employeeId: filterEmployeeId || undefined,
      status: (filterStatus as any) || undefined,
    });
  }, [filterDate, filterEmployeeId, filterStatus, fetchAllAttendance]);

  const onRecordSubmit = async (data: AttendanceUpdateFormData) => {
    try {
      setIsSubmitting(true);
      const res = await recordAttendance(data);
      if (res.success) {
        toast.success('Attendance recorded successfully');
        reset();
        setRecordModalOpen(false);
        fetchAllAttendance({ date: filterDate });
      } else {
        toast.error(res.error || 'Failed to record attendance');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const presentCount = allRecords.filter((r) => r.status === 'PRESENT').length;
  const leaveCount = allRecords.filter((r) => r.status === 'LEAVE').length;
  const absentCount = allRecords.filter((r) => r.status === 'ABSENT').length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
            Attendance Administration
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Monitor trader roll calls, manage absence and leave records
          </p>
        </div>

        <Button
          onClick={() => setRecordModalOpen(true)}
          variant="primary"
          size="sm"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Mark Attendance
        </Button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-4 bg-slate-900/60">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Filtered Records</span>
          <p className="text-2xl font-bold text-white mt-1">{allRecords.length}</p>
        </Card>
        <Card className="p-4 bg-slate-900/60">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Present</span>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{presentCount}</p>
        </Card>
        <Card className="p-4 bg-slate-900/60">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">On Leave</span>
          <p className="text-2xl font-bold text-amber-400 mt-1">{leaveCount}</p>
        </Card>
        <Card className="p-4 bg-slate-900/60">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Absent</span>
          <p className="text-2xl font-bold text-rose-400 mt-1">{absentCount}</p>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card className="p-4 bg-slate-900/40">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            label="Specific Date"
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />

          <Select
            label="Filter By Trader"
            options={[
              { value: '', label: 'All Traders' },
              ...employees.map((e) => ({ value: e.id, label: `${e.name} (${e.employee_id})` })),
            ]}
            value={filterEmployeeId}
            onChange={(e) => setFilterEmployeeId(e.target.value)}
          />

          <Select
            label="Filter By Status"
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'PRESENT', label: 'Present' },
              { value: 'ABSENT', label: 'Absent' },
              { value: 'LEAVE', label: 'Leave' },
              { value: 'HOLIDAY', label: 'Holiday' },
            ]}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          />
        </div>
      </Card>

      {/* Attendance Records Table */}
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : allRecords.length === 0 ? (
        <EmptyState
          icon={<CalendarCheck className="w-6 h-6 text-slate-500" />}
          title="No Attendance Records"
          description="No attendance logged matching the selected date and filters."
          action={
            <Button size="sm" variant="outline" onClick={() => setRecordModalOpen(true)}>
              Mark Attendance Now
            </Button>
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Trader</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Check In</TableHead>
              <TableHead>Check Out</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allRecords.map((rec) => (
              <TableRow key={rec.id}>
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-300">
                      {rec.employee?.avatar_url ? (
                        <img src={rec.employee.avatar_url} alt="" className="w-full h-full object-cover rounded-full" />
                      ) : (
                        rec.employee?.name?.charAt(0) || 'U'
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-200">{rec.employee?.name || 'Unknown'}</p>
                      <p className="text-[10px] text-slate-400">{rec.employee?.employee_id || ''}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="whitespace-nowrap font-medium text-slate-200">
                  {formatDate(rec.attendance_date)}
                </TableCell>
                <TableCell>
                  <StatusBadge status={rec.status} />
                </TableCell>
                <TableCell className="text-slate-400">
                  {rec.check_in ? formatDate(rec.check_in, 'p') : '--:--'}
                </TableCell>
                <TableCell className="text-slate-400">
                  {rec.check_out ? formatDate(rec.check_out, 'p') : '--:--'}
                </TableCell>
                <TableCell className="text-slate-400 text-xs">
                  {rec.notes || '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* MARK / UPDATE ATTENDANCE MODAL */}
      <Dialog
        isOpen={recordModalOpen}
        onClose={() => setRecordModalOpen(false)}
        title="Mark Trader Attendance"
        description="Create or update daily attendance status for team members"
      >
        <form onSubmit={handleSubmit(onRecordSubmit)} className="space-y-4">
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
              label="Attendance Date"
              type="date"
              error={errors.attendance_date?.message}
              {...register('attendance_date')}
            />
            <Select
              label="Status"
              options={[
                { value: 'PRESENT', label: 'Present' },
                { value: 'ABSENT', label: 'Absent' },
                { value: 'LEAVE', label: 'Leave' },
                { value: 'HOLIDAY', label: 'Holiday' },
              ]}
              {...register('status')}
            />
          </div>

          <Input
            label="Remarks / Notes (Optional)"
            placeholder="e.g. Approved medical leave, remote trading session..."
            {...register('notes')}
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setRecordModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
            >
              Save Attendance
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
