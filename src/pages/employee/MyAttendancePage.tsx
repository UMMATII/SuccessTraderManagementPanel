import React, { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useAttendanceStore } from '@/store/attendanceStore';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
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
import { formatDate } from '@/lib/date-utils';
import { CalendarCheck, Calendar, Info } from 'lucide-react';

export function MyAttendancePage() {
  const { profile } = useAuthStore();
  const { records, isLoading, fetchEmployeeAttendance } = useAttendanceStore();

  useEffect(() => {
    if (profile?.id) {
      fetchEmployeeAttendance(profile.id);
    }
  }, [profile?.id, fetchEmployeeAttendance]);

  const presentDays = records.filter((r) => r.status === 'PRESENT').length;
  const leaveDays = records.filter((r) => r.status === 'LEAVE').length;
  const absentDays = records.filter((r) => r.status === 'ABSENT').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-2 border-b border-slate-800">
        <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <CalendarCheck className="w-6 h-6 text-emerald-400" />
          My Attendance Record
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Review your attendance, check-in timestamps, and approved leave days
        </p>
      </div>

      {/* Info notice about separate duration vs attendance */}
      <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-3 text-xs text-slate-300">
        <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-white">Note on Attendance vs. Tasks:</strong> Official attendance marks desk presence and roll call, while task duration measures focused trade analysis and backtesting time. They are independently tracked and monitored.
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="p-4 bg-slate-900/60">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Days Present</span>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{presentDays}</p>
        </Card>
        <Card className="p-4 bg-slate-900/60">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Approved Leave</span>
          <p className="text-2xl font-bold text-amber-400 mt-1">{leaveDays}</p>
        </Card>
        <Card className="p-4 bg-slate-900/60">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Absent Days</span>
          <p className="text-2xl font-bold text-rose-400 mt-1">{absentDays}</p>
        </Card>
      </div>

      {/* Attendance History Table */}
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : records.length === 0 ? (
        <EmptyState
          icon={<Calendar className="w-6 h-6 text-slate-500" />}
          title="No Attendance Records"
          description="Your attendance has not been recorded for any dates yet."
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Check In Time</TableHead>
              <TableHead>Check Out Time</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium text-slate-200">
                  {formatDate(r.attendance_date)}
                </TableCell>
                <TableCell>
                  <StatusBadge status={r.status} />
                </TableCell>
                <TableCell className="text-slate-400">
                  {r.check_in ? formatDate(r.check_in, 'p') : '--:--'}
                </TableCell>
                <TableCell className="text-slate-400">
                  {r.check_out ? formatDate(r.check_out, 'p') : '--:--'}
                </TableCell>
                <TableCell className="text-slate-400 text-xs">
                  {r.notes || '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
