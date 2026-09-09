import React, { useEffect } from 'react';
import { useAnalyticsStore } from '@/store/analyticsStore';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { WorkingHoursChart } from '@/components/charts/WorkingHoursChart';
import { SuccessPointsChart } from '@/components/charts/SuccessPointsChart';
import { AttendancePieChart } from '@/components/charts/AttendancePieChart';
import { PerformanceTrendChart } from '@/components/charts/PerformanceTrendChart';
import { getMonthYearOptions } from '@/lib/date-utils';
import {
  Users,
  UserCheck,
  CalendarCheck,
  CheckCircle2,
  Award,
  Clock,
  Trophy,
  ArrowUpRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export function AdminDashboard() {
  const {
    ownerKPIs,
    leaderboard,
    dailyChartData,
    isLoading,
    selectedYear,
    selectedMonth,
    setSelectedMonthYear,
    fetchOwnerDashboard,
    fetchDailyChart,
  } = useAnalyticsStore();

  const { years, months } = getMonthYearOptions();

  useEffect(() => {
    fetchOwnerDashboard(selectedYear, selectedMonth);
    const startDate = new Date(selectedYear, selectedMonth - 1, 1).toISOString().split('T')[0];
    const endDate = new Date(selectedYear, selectedMonth, 0).toISOString().split('T')[0];
    fetchDailyChart(null, startDate, endDate);
  }, [selectedYear, selectedMonth, fetchOwnerDashboard, fetchDailyChart]);

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMonthYear(Number(e.target.value), selectedMonth);
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMonthYear(selectedYear, Number(e.target.value));
  };

  // Prepare chart data from leaderboard
  const workingHoursBarData = leaderboard.slice(0, 8).map((item) => ({
    name: item.employee_name.split(' ')[0],
    hours: item.working_hours,
  }));

  const successPointsBarData = leaderboard.slice(0, 8).map((item) => ({
    name: item.employee_name.split(' ')[0],
    points: item.success_points,
  }));

  return (
    <div className="space-y-6">
      {/* Top Bar: Title & Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
            Owner Command Center
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time organizational performance, attendance, and trader productivity
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <div className="w-32">
            <Select
              options={months.map((m) => ({ value: m.value, label: m.label }))}
              value={selectedMonth}
              onChange={handleMonthChange}
            />
          </div>
          <div className="w-24">
            <Select
              options={years.map((y) => ({ value: y, label: String(y) }))}
              value={selectedYear}
              onChange={handleYearChange}
            />
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Employees */}
        <Card className="border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Traders</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2">
            {isLoading ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <p className="text-2xl font-bold text-white">{ownerKPIs?.totalEmployees ?? 0}</p>
            )}
            <p className="text-[10px] text-slate-400 mt-0.5">Registered accounts</p>
          </div>
        </Card>

        {/* Active Employees */}
        <Card className="border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Active</span>
            <UserCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2">
            {isLoading ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <p className="text-2xl font-bold text-emerald-400">{ownerKPIs?.activeEmployees ?? 0}</p>
            )}
            <p className="text-[10px] text-slate-400 mt-0.5">Authorized traders</p>
          </div>
        </Card>

        {/* Today's Attendance */}
        <Card className="border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Today Present</span>
            <CalendarCheck className="w-4 h-4 text-sky-400" />
          </div>
          <div className="mt-2">
            {isLoading ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <p className="text-2xl font-bold text-sky-400">
                {ownerKPIs?.todayAttendancePresent ?? 0}
              </p>
            )}
            <p className="text-[10px] text-slate-400 mt-0.5">Marked present today</p>
          </div>
        </Card>

        {/* Today's Tasks */}
        <Card className="border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Today Tasks</span>
            <CheckCircle2 className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2">
            {isLoading ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <p className="text-2xl font-bold text-indigo-400">
                {ownerKPIs?.todayTasksCount ?? 0}
              </p>
            )}
            <p className="text-[10px] text-slate-400 mt-0.5">Work sessions logged</p>
          </div>
        </Card>

        {/* Monthly Success Points */}
        <Card className="border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Firm Points</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2">
            {isLoading ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <p className="text-2xl font-bold text-amber-400">
                {ownerKPIs?.monthlySuccessPoints ?? 0}
              </p>
            )}
            <p className="text-[10px] text-slate-400 mt-0.5">Points awarded this month</p>
          </div>
        </Card>

        {/* Average Working Hours */}
        <Card className="border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Avg Hours</span>
            <Clock className="w-4 h-4 text-violet-400" />
          </div>
          <div className="mt-2">
            {isLoading ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <p className="text-2xl font-bold text-violet-400">
                {ownerKPIs?.averageWorkingHours ?? 0}h
              </p>
            )}
            <p className="text-[10px] text-slate-400 mt-0.5">Per active trader</p>
          </div>
        </Card>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Working Hours by Trader */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span>Working Hours by Trader (Month-to-Date)</span>
              <span className="text-xs text-slate-400 font-normal">Top Active</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <WorkingHoursChart data={workingHoursBarData} />
            )}
          </CardContent>
        </Card>

        {/* Success Points by Trader */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span>Success Points Distribution</span>
              <span className="text-xs text-slate-400 font-normal">Month-to-Date</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <SuccessPointsChart data={successPointsBarData} />
            )}
          </CardContent>
        </Card>

        {/* Daily Performance Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Daily Firm Performance Trend
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

        {/* Today's Attendance Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Today's Attendance Status Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <AttendancePieChart
                present={ownerKPIs?.todayAttendancePresent || 0}
                absent={Math.max(0, (ownerKPIs?.activeEmployees || 0) - (ownerKPIs?.todayAttendancePresent || 0))}
                leave={0}
                holiday={0}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top 5 Leaderboard Preview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              Monthly Top Traders
            </CardTitle>
            <p className="text-xs text-slate-400 mt-0.5">
              Ranked strictly by Success Points &gt; Tasks &gt; Working Hours
            </p>
          </div>
          <Link
            to="/admin/rankings"
            className="inline-flex items-center text-xs font-semibold text-emerald-400 hover:text-emerald-300"
          >
            Full Leaderboard
            <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
          </Link>
        </CardHeader>
        <CardContent>
          {leaderboard.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center">No active traders found</p>
          ) : (
            <div className="divide-y divide-slate-800">
              {leaderboard.slice(0, 5).map((trader) => (
                <div key={trader.employee_id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className={`w-5 font-bold ${trader.rank === 1 ? 'text-amber-400' : trader.rank === 2 ? 'text-slate-300' : trader.rank === 3 ? 'text-amber-600' : 'text-slate-500'}`}>
                      #{trader.rank}
                    </span>
                    <div className="w-7 h-7 rounded-full bg-slate-800 overflow-hidden flex items-center justify-center text-[10px] font-bold text-slate-300">
                      {trader.avatar_url ? (
                        <img src={trader.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        trader.employee_name.charAt(0)
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-200">{trader.employee_name}</p>
                      <p className="text-[10px] text-slate-400">{trader.employee_code}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-slate-400 text-[10px]">Hours</p>
                      <p className="font-semibold text-slate-200">{trader.working_hours}h</p>
                    </div>
                    <div className="text-right">
                      <p className="text-slate-400 text-[10px]">Tasks</p>
                      <p className="font-semibold text-slate-200">{trader.completed_tasks}</p>
                    </div>
                    <div className="text-right w-16">
                      <p className="text-slate-400 text-[10px]">Points</p>
                      <p className="font-bold text-amber-400">{trader.success_points} pts</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
