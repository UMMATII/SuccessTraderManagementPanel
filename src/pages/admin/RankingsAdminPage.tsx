import React, { useEffect } from 'react';
import { useAnalyticsStore } from '@/store/analyticsStore';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
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
import { getMonthYearOptions } from '@/lib/date-utils';
import { Trophy, Medal, Award, Flame, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export function RankingsAdminPage() {
  const {
    leaderboard,
    isLoading,
    selectedYear,
    selectedMonth,
    setSelectedMonthYear,
    fetchLeaderboard,
  } = useAnalyticsStore();

  const { years, months } = getMonthYearOptions();

  useEffect(() => {
    fetchLeaderboard(selectedYear, selectedMonth);
  }, [selectedYear, selectedMonth, fetchLeaderboard]);

  const topThree = leaderboard.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Top Header & Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-400" />
            Success Trader Leaderboard
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Official monthly ranking based on Points &gt; Tasks &gt; Working Hours
          </p>
        </div>

        <div className="flex items-center gap-2">
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

      {/* Top 3 Podium Cards */}
      {topThree.length >= 3 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Rank 2 (Silver) */}
          <Card className="order-2 md:order-1 border-slate-700 bg-gradient-to-b from-slate-900 to-slate-950 p-5 text-center relative overflow-hidden">
            <div className="w-12 h-12 mx-auto rounded-full bg-slate-800 border-2 border-slate-400 flex items-center justify-center mb-3">
              <Medal className="w-6 h-6 text-slate-300" />
            </div>
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">#2 Runner-Up</span>
            <h3 className="text-base font-bold text-white mt-1">{topThree[1].employee_name}</h3>
            <p className="text-xs text-slate-400">{topThree[1].employee_code}</p>

            <div className="mt-4 pt-4 border-t border-slate-800 flex justify-around text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block">Points</span>
                <span className="font-bold text-amber-400 text-sm">{topThree[1].success_points}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Tasks</span>
                <span className="font-bold text-slate-200 text-sm">{topThree[1].completed_tasks}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Hours</span>
                <span className="font-bold text-emerald-400 text-sm">{topThree[1].working_hours}h</span>
              </div>
            </div>
          </Card>

          {/* Rank 1 (Gold) */}
          <Card className="order-1 md:order-2 border-amber-500/50 bg-gradient-to-b from-amber-950/30 via-slate-900 to-slate-950 p-6 text-center relative overflow-hidden shadow-xl shadow-amber-950/20">
            <div className="w-14 h-14 mx-auto rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center mb-3">
              <Trophy className="w-7 h-7 text-amber-400" />
            </div>
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest flex items-center justify-center gap-1">
              <Flame className="w-3.5 h-3.5" />
              #1 Top Trader
            </span>
            <h3 className="text-lg font-bold text-white mt-1">{topThree[0].employee_name}</h3>
            <p className="text-xs text-amber-300/70">{topThree[0].employee_code}</p>

            <div className="mt-4 pt-4 border-t border-amber-500/20 flex justify-around text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block">Points</span>
                <span className="font-bold text-amber-400 text-base">{topThree[0].success_points}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Tasks</span>
                <span className="font-bold text-slate-200 text-base">{topThree[0].completed_tasks}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Hours</span>
                <span className="font-bold text-emerald-400 text-base">{topThree[0].working_hours}h</span>
              </div>
            </div>
          </Card>

          {/* Rank 3 (Bronze) */}
          <Card className="order-3 md:order-3 border-amber-900/60 bg-gradient-to-b from-slate-900 to-slate-950 p-5 text-center relative overflow-hidden">
            <div className="w-12 h-12 mx-auto rounded-full bg-amber-950/40 border-2 border-amber-600 flex items-center justify-center mb-3">
              <Medal className="w-6 h-6 text-amber-600" />
            </div>
            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">#3 Podium</span>
            <h3 className="text-base font-bold text-white mt-1">{topThree[2].employee_name}</h3>
            <p className="text-xs text-slate-400">{topThree[2].employee_code}</p>

            <div className="mt-4 pt-4 border-t border-slate-800 flex justify-around text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block">Points</span>
                <span className="font-bold text-amber-400 text-sm">{topThree[2].success_points}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Tasks</span>
                <span className="font-bold text-slate-200 text-sm">{topThree[2].completed_tasks}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Hours</span>
                <span className="font-bold text-emerald-400 text-sm">{topThree[2].working_hours}h</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Full Leaderboard Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Complete Standings Table</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : leaderboard.length === 0 ? (
            <EmptyState
              icon={<Trophy className="w-6 h-6 text-slate-500" />}
              title="No Ranking Data"
              description="No active traders or performance activity logged for this month."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16 text-center">Rank</TableHead>
                  <TableHead>Trader</TableHead>
                  <TableHead>Completed Tasks</TableHead>
                  <TableHead>Working Hours</TableHead>
                  <TableHead>Success Points</TableHead>
                  <TableHead>Attendance (Present)</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaderboard.map((item) => (
                  <TableRow key={item.employee_id}>
                    <TableCell className="text-center font-bold">
                      {item.rank === 1 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 text-xs">
                          1
                        </span>
                      ) : item.rank === 2 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-300/20 text-slate-300 text-xs">
                          2
                        </span>
                      ) : item.rank === 3 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-700/20 text-amber-600 text-xs">
                          3
                        </span>
                      ) : (
                        <span className="text-slate-500 text-xs">#{item.rank}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center text-xs font-bold text-slate-300">
                          {item.avatar_url ? (
                            <img src={item.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            item.employee_name.charAt(0)
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-200">{item.employee_name}</p>
                          <p className="text-[10px] text-slate-400">{item.employee_code}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold text-slate-200">
                      {item.completed_tasks}
                    </TableCell>
                    <TableCell className="text-emerald-400 font-semibold">
                      {item.working_hours}h
                    </TableCell>
                    <TableCell className="font-bold text-amber-400">
                      {item.success_points} pts
                    </TableCell>
                    <TableCell className="text-slate-300">
                      {item.attendance_present_days} days
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        to={`/admin/employees/${item.employee_id}`}
                        className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1"
                      >
                        Profile
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
