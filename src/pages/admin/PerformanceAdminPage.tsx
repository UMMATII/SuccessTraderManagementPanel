import React, { useEffect, useState } from 'react';
import { useAnalyticsStore } from '@/store/analyticsStore';
import { useEmployeeStore } from '@/store/employeeStore';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { WorkingHoursChart } from '@/components/charts/WorkingHoursChart';
import { SuccessPointsChart } from '@/components/charts/SuccessPointsChart';
import { PerformanceTrendChart } from '@/components/charts/PerformanceTrendChart';
import { getMonthYearOptions } from '@/lib/date-utils';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/Table';
import { TrendingUp, Award, Clock, CalendarCheck, CheckCircle } from 'lucide-react';

export function PerformanceAdminPage() {
  const {
    leaderboard,
    dailyChartData,
    isLoading,
    selectedYear,
    selectedMonth,
    setSelectedMonthYear,
    fetchLeaderboard,
    fetchDailyChart,
  } = useAnalyticsStore();

  const { employees, fetchEmployees } = useEmployeeStore();
  const [selectedTraderId, setSelectedTraderId] = useState('');

  const { years, months } = getMonthYearOptions();

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    fetchLeaderboard(selectedYear, selectedMonth);
    const startDate = new Date(selectedYear, selectedMonth - 1, 1).toISOString().split('T')[0];
    const endDate = new Date(selectedYear, selectedMonth, 0).toISOString().split('T')[0];
    fetchDailyChart(selectedTraderId || null, startDate, endDate);
  }, [selectedYear, selectedMonth, selectedTraderId, fetchLeaderboard, fetchDailyChart]);

  const filteredLeaderboard = selectedTraderId
    ? leaderboard.filter((item) => item.employee_id === selectedTraderId)
    : leaderboard;

  const totalPoints = filteredLeaderboard.reduce((acc, i) => acc + i.success_points, 0);
  const totalTasks = filteredLeaderboard.reduce((acc, i) => acc + i.completed_tasks, 0);
  const totalHours = filteredLeaderboard.reduce((acc, i) => acc + i.working_hours, 0);

  return (
    <div className="space-y-6">
      {/* Top Header & Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
            Performance Analytics
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Deep-dive metrics across trading activity, working duration, and success benchmarks
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="w-40">
            <Select
              options={[
                { value: '', label: 'All Traders' },
                ...employees.map((e) => ({ value: e.id, label: e.name })),
              ]}
              value={selectedTraderId}
              onChange={(e) => setSelectedTraderId(e.target.value)}
            />
          </div>
          <div className="w-32">
            <Select
              options={months.map((m) => ({ value: m.value, label: m.label }))}
              value={selectedMonth}
              onChange={(e) => setSelectedMonthYear(selectedYear, Number(e.target.value))}
            />
          </div>
          <div className="w-24">
            <Select
              options={years.map((y) => ({ value: y, label: String(y) }))}
              value={selectedYear}
              onChange={(e) => setSelectedMonthYear(Number(e.target.value), selectedMonth)}
            />
          </div>
        </div>
      </div>

      {/* Aggregate KPI Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-slate-900/60">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-semibold uppercase tracking-wider">Total Tasks Completed</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{totalTasks}</p>
        </Card>

        <Card className="p-4 bg-slate-900/60">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-semibold uppercase tracking-wider">Total Working Hours</span>
            <Clock className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-2xl font-bold text-sky-400 mt-1">{totalHours.toFixed(1)}h</p>
        </Card>

        <Card className="p-4 bg-slate-900/60">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-semibold uppercase tracking-wider">Total Success Points</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-amber-400 mt-1">{totalPoints} pts</p>
        </Card>
      </div>

      {/* Daily Performance Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Daily Execution & Volume Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <PerformanceTrendChart data={dailyChartData} />
          )}
        </CardContent>
      </Card>

      {/* Comparative Trader Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Trader Benchmark Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>Trader</TableHead>
                <TableHead>Completed Tasks</TableHead>
                <TableHead>Working Hours</TableHead>
                <TableHead>Success Points</TableHead>
                <TableHead>Attendance Days</TableHead>
                <TableHead>Avg Points / Day</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeaderboard.map((item) => {
                const avgPts = item.attendance_present_days > 0
                  ? (item.success_points / item.attendance_present_days).toFixed(1)
                  : '0.0';
                return (
                  <TableRow key={item.employee_id}>
                    <TableCell className="font-bold text-amber-400">#{item.rank}</TableCell>
                    <TableCell>
                      <div className="font-semibold text-slate-200">{item.employee_name}</div>
                      <div className="text-[10px] text-slate-400">{item.employee_code}</div>
                    </TableCell>
                    <TableCell className="font-semibold text-slate-200">{item.completed_tasks}</TableCell>
                    <TableCell className="text-emerald-400 font-semibold">{item.working_hours}h</TableCell>
                    <TableCell className="font-bold text-amber-400">{item.success_points} pts</TableCell>
                    <TableCell className="text-slate-300">{item.attendance_present_days} days</TableCell>
                    <TableCell className="text-slate-400">{avgPts} pts/day</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
