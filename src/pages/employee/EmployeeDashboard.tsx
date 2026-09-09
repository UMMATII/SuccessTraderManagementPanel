import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useAnalyticsStore } from '@/store/analyticsStore';
import { useTaskStore } from '@/store/taskStore';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { WorkingHoursChart } from '@/components/charts/WorkingHoursChart';
import { PerformanceTrendChart } from '@/components/charts/PerformanceTrendChart';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/Table';
import { formatDate, formatTime, formatMinutesToHours, getCurrentDateString } from '@/lib/date-utils';
import {
  ClipboardList,
  Clock,
  Award,
  Trophy,
  CheckCircle2,
  PlusCircle,
  ArrowRight,
} from 'lucide-react';

export function EmployeeDashboard() {
  const { profile } = useAuthStore();
  const {
    employeeKPIs,
    dailyChartData,
    isLoading,
    fetchEmployeeDashboard,
    fetchDailyChart,
  } = useAnalyticsStore();
  const { tasks, fetchEmployeeTasks } = useTaskStore();

  const today = getCurrentDateString();

  useEffect(() => {
    if (profile?.id) {
      const curYear = new Date().getFullYear();
      const curMonth = new Date().getMonth() + 1;
      fetchEmployeeDashboard(profile.id, curYear, curMonth);
      fetchEmployeeTasks(profile.id, today);

      const startDate = new Date(curYear, curMonth - 1, 1).toISOString().split('T')[0];
      const endDate = new Date(curYear, curMonth, 0).toISOString().split('T')[0];
      fetchDailyChart(profile.id, startDate, endDate);
    }
  }, [profile?.id, fetchEmployeeDashboard, fetchEmployeeTasks, fetchDailyChart, today]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
            Welcome, {profile?.name || 'Trader'}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            ID: <span className="font-mono text-emerald-400">{profile?.employee_id}</span> • Trading Desk Session Active
          </p>
        </div>

        <Link to="/employee/tasks/new">
          <Button variant="primary" size="sm" className="shadow-lg shadow-emerald-950/40">
            <PlusCircle className="w-4 h-4 mr-1.5" />
            Log Daily Task
          </Button>
        </Link>
      </div>

      {/* 6 KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Today's Tasks */}
        <Card className="p-4 bg-slate-900/60">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-semibold uppercase tracking-wider">Today's Tasks</span>
            <CheckCircle2 className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-1">
            {isLoading ? '--' : employeeKPIs?.todayTasksCount ?? 0}
          </p>
          <span className="text-[10px] text-slate-500">Logged today</span>
        </Card>

        {/* Today's Working Time */}
        <Card className="p-4 bg-slate-900/60">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-semibold uppercase tracking-wider">Today Time</span>
            <Clock className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400 mt-1">
            {isLoading ? '--' : formatMinutesToHours(employeeKPIs?.todayWorkingMinutes || 0)}
          </p>
          <span className="text-[10px] text-slate-500">Valid duration</span>
        </Card>

        {/* Monthly Tasks */}
        <Card className="p-4 bg-slate-900/60">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-semibold uppercase tracking-wider">Monthly Tasks</span>
            <ClipboardList className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-bold text-indigo-400 mt-1">
            {isLoading ? '--' : employeeKPIs?.monthlyTasksCount ?? 0}
          </p>
          <span className="text-[10px] text-slate-500">Completed this month</span>
        </Card>

        {/* Monthly Working Hours */}
        <Card className="p-4 bg-slate-900/60">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-semibold uppercase tracking-wider">Monthly Hours</span>
            <Clock className="w-4 h-4 text-violet-400" />
          </div>
          <p className="text-2xl font-bold text-violet-400 mt-1">
            {isLoading ? '--' : `${employeeKPIs?.monthlyWorkingHours ?? 0}h`}
          </p>
          <span className="text-[10px] text-slate-500">Cumulative time</span>
        </Card>

        {/* Success Points */}
        <Card className="p-4 bg-slate-900/60">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-semibold uppercase tracking-wider">Success Points</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-amber-400 mt-1">
            {isLoading ? '--' : employeeKPIs?.monthlySuccessPoints ?? 0}
          </p>
          <span className="text-[10px] text-slate-500">Awarded this month</span>
        </Card>

        {/* Current Rank */}
        <Card className="p-4 bg-slate-900/60">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-semibold uppercase tracking-wider">Current Rank</span>
            <Trophy className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-amber-400 mt-1">
            {isLoading ? '--' : `#${employeeKPIs?.currentRank ?? '--'}`}
          </p>
          <span className="text-[10px] text-slate-500">Firm Leaderboard</span>
        </Card>
      </div>

      {/* Today's Tasks Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base">Today's Work Log</CardTitle>
            <p className="text-xs text-slate-400 mt-0.5">Tasks submitted for today ({formatDate(today)})</p>
          </div>
          <Link to="/employee/tasks" className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1">
            All Tasks History
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              <p>No tasks logged yet today.</p>
              <Link to="/employee/tasks/new" className="inline-block mt-3">
                <Button size="sm" variant="outline">
                  Log First Task of the Day
                </Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time Interval</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Acceptance Criteria</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="whitespace-nowrap font-medium text-slate-200">
                      {formatTime(t.time_from)} - {formatTime(t.time_to)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap font-semibold text-emerald-400">
                      {t.duration_minutes} min
                    </TableCell>
                    <TableCell className="max-w-xs text-slate-300">
                      {t.description}
                    </TableCell>
                    <TableCell className="max-w-xs text-slate-400 text-xs">
                      {t.acceptance_criteria}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={t.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Performance Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">My Daily Working Hours & Task Output</CardTitle>
        </CardHeader>
        <CardContent>
          <PerformanceTrendChart data={dailyChartData} />
        </CardContent>
      </Card>
    </div>
  );
}
