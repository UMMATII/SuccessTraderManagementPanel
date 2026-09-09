import React, { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useAnalyticsStore } from '@/store/analyticsStore';
import { useSuccessPointStore } from '@/store/successPointStore';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { PerformanceTrendChart } from '@/components/charts/PerformanceTrendChart';
import { SuccessPointsChart } from '@/components/charts/SuccessPointsChart';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/Table';
import { formatDate } from '@/lib/date-utils';
import { TrendingUp, Award, Clock, Trophy, CheckCircle2 } from 'lucide-react';

export function MyPerformancePage() {
  const { profile } = useAuthStore();
  const {
    employeeKPIs,
    dailyChartData,
    fetchEmployeeDashboard,
    fetchDailyChart,
  } = useAnalyticsStore();
  const { points, fetchEmployeePoints } = useSuccessPointStore();

  useEffect(() => {
    if (profile?.id) {
      const curYear = new Date().getFullYear();
      const curMonth = new Date().getMonth() + 1;
      fetchEmployeeDashboard(profile.id, curYear, curMonth);
      fetchEmployeePoints(profile.id);

      const startDate = new Date(curYear, curMonth - 1, 1).toISOString().split('T')[0];
      const endDate = new Date(curYear, curMonth, 0).toISOString().split('T')[0];
      fetchDailyChart(profile.id, startDate, endDate);
    }
  }, [profile?.id, fetchEmployeeDashboard, fetchEmployeePoints, fetchDailyChart]);

  const pointsChartData = points.slice(0, 10).reverse().map((pt) => ({
    name: formatDate(pt.point_date, 'MMM d'),
    points: Number(pt.points),
  }));

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="pb-2 border-b border-slate-800">
        <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-emerald-400" />
          My Trader Performance Analytics
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Your personal metrics, leaderboard standing, and awarded success points
        </p>
      </div>

      {/* 5 Key Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card className="p-4 bg-slate-900/60">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Current Rank</span>
          <p className="text-2xl font-bold text-amber-400 mt-1">#{employeeKPIs?.currentRank ?? '--'}</p>
          <span className="text-[10px] text-slate-500">Firm Leaderboard</span>
        </Card>

        <Card className="p-4 bg-slate-900/60">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Monthly Tasks</span>
          <p className="text-2xl font-bold text-slate-100 mt-1">{employeeKPIs?.monthlyTasksCount ?? 0}</p>
          <span className="text-[10px] text-slate-500">Completed Sessions</span>
        </Card>

        <Card className="p-4 bg-slate-900/60">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Working Hours</span>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{employeeKPIs?.monthlyWorkingHours ?? 0}h</p>
          <span className="text-[10px] text-slate-500">Duration Sum</span>
        </Card>

        <Card className="p-4 bg-slate-900/60">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Success Points</span>
          <p className="text-2xl font-bold text-amber-400 mt-1">{employeeKPIs?.monthlySuccessPoints ?? 0}</p>
          <span className="text-[10px] text-slate-500">Awarded Points</span>
        </Card>

        <Card className="p-4 bg-slate-900/60">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Standing</span>
          <p className="text-2xl font-bold text-sky-400 mt-1">Active</p>
          <span className="text-[10px] text-slate-500">Account Good Status</span>
        </Card>
      </div>

      {/* Daily Performance Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Daily Hours & Task Output</CardTitle>
        </CardHeader>
        <CardContent>
          <PerformanceTrendChart data={dailyChartData} />
        </CardContent>
      </Card>

      {/* Success Points Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Success Points Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <SuccessPointsChart data={pointsChartData} />
          </CardContent>
        </Card>

        {/* Recent Points Log */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              Awarded Success Points History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {points.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No success points awarded yet</p>
            ) : (
              <div className="divide-y divide-slate-800">
                {points.slice(0, 5).map((pt) => (
                  <div key={pt.id} className="py-2.5 flex items-start justify-between text-xs">
                    <div>
                      <p className="font-semibold text-slate-200">{pt.reason}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {formatDate(pt.point_date)} • Awarded by {pt.awarded_by_profile?.name || 'Owner'}
                      </p>
                    </div>
                    <span className="font-bold text-amber-400 text-sm shrink-0 ml-3">
                      +{pt.points} pts
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
