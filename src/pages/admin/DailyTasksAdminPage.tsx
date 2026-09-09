import React, { useEffect, useState } from 'react';
import { useTaskStore } from '@/store/taskStore';
import { useEmployeeStore } from '@/store/employeeStore';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
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
import { formatDate, formatTime, getCurrentDateString, formatMinutesToHours } from '@/lib/date-utils';
import { ClipboardList, Search, Clock, CheckCircle2 } from 'lucide-react';

export function DailyTasksAdminPage() {
  const { allTasks, isLoading, fetchAllTasks } = useTaskStore();
  const { employees, fetchEmployees } = useEmployeeStore();

  const [filterDate, setFilterDate] = useState('');
  const [filterEmployeeId, setFilterEmployeeId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    fetchAllTasks({
      date: filterDate || undefined,
      employeeId: filterEmployeeId || undefined,
    });
  }, [filterDate, filterEmployeeId, fetchAllTasks]);

  const filteredTasks = allTasks.filter((t) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.description.toLowerCase().includes(q) ||
      t.acceptance_criteria.toLowerCase().includes(q) ||
      (t.employee?.name && t.employee.name.toLowerCase().includes(q)) ||
      (t.employee?.employee_id && t.employee.employee_id.toLowerCase().includes(q))
    );
  });

  const totalMinutes = filteredTasks.reduce((acc, t) => acc + (t.duration_minutes || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
            Daily Task Log Review
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Examine daily trade analysis, backtesting records, and execution criteria
          </p>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="p-4 bg-slate-900/60">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Total Tasks</span>
          <p className="text-2xl font-bold text-white mt-1">{filteredTasks.length}</p>
        </Card>
        <Card className="p-4 bg-slate-900/60">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Total Working Time</span>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{formatMinutesToHours(totalMinutes)}</p>
        </Card>
        <Card className="p-4 bg-slate-900/60">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Avg Session Duration</span>
          <p className="text-2xl font-bold text-indigo-400 mt-1">
            {filteredTasks.length > 0 ? Math.round(totalMinutes / filteredTasks.length) : 0} min
          </p>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card className="p-4 bg-slate-900/40">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search description, criteria, trader..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <Input
            type="date"
            placeholder="All Dates"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />

          <Select
            options={[
              { value: '', label: 'All Traders' },
              ...employees.map((e) => ({ value: e.id, label: `${e.name} (${e.employee_id})` })),
            ]}
            value={filterEmployeeId}
            onChange={(e) => setFilterEmployeeId(e.target.value)}
          />
        </div>
      </Card>

      {/* Tasks Table */}
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : filteredTasks.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="w-6 h-6 text-slate-500" />}
          title="No Daily Tasks Found"
          description="No tasks match the specified filters or date range."
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Trader</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Time Window</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Task Description</TableHead>
              <TableHead>Acceptance Criteria</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTasks.map((t) => (
              <TableRow key={t.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-300">
                      {t.employee?.avatar_url ? (
                        <img src={t.employee.avatar_url} alt="" className="w-full h-full object-cover rounded-full" />
                      ) : (
                        t.employee?.name?.charAt(0) || 'T'
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-200">{t.employee?.name || 'Trader'}</p>
                      <p className="text-[10px] text-slate-400">{t.employee?.employee_id || ''}</p>
                    </div>
                  </div>
                </TableCell>
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
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
