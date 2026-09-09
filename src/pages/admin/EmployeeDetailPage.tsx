import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { employeeService } from '@/services/employeeService';
import { taskService } from '@/services/taskService';
import { attendanceService } from '@/services/attendanceService';
import { successPointService } from '@/services/successPointService';
import { analyticsService } from '@/services/analyticsService';
import type { Profile, Task, Attendance, SuccessPointWithDetails, EmployeeDashboardKPIs } from '@/types/models';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
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
import { formatDate, formatTime } from '@/lib/date-utils';
import {
  ArrowLeft,
  CalendarCheck,
  ClipboardList,
  Award,
  Clock,
  Trophy,
  User,
  Plus,
} from 'lucide-react';

export function EmployeeDetailPage() {
  const { employeeId } = useParams<{ employeeId: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [points, setPoints] = useState<SuccessPointWithDetails[]>([]);
  const [kpis, setKpis] = useState<EmployeeDashboardKPIs | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'attendance' | 'points'>('overview');

  useEffect(() => {
    if (!employeeId) return;

    const loadData = async () => {
      try {
        setIsLoading(true);
        const [profRes, taskRes, attRes, ptRes, kpiRes] = await Promise.all([
          employeeService.getEmployeeById(employeeId),
          taskService.getTasksByEmployee(employeeId),
          attendanceService.getAttendanceByEmployee(employeeId),
          successPointService.getPointsByEmployee(employeeId),
          analyticsService.getEmployeeKPIs(employeeId, new Date().getFullYear(), new Date().getMonth() + 1),
        ]);

        setProfile(profRes.data);
        setTasks(taskRes.data);
        setAttendance(attRes.data);
        setPoints(ptRes.data);
        setKpis(kpiRes.data);
      } catch (err) {
        console.error('Error loading employee details:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [employeeId]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-slate-400">Employee record not found.</p>
        <Link to="/admin/employees" className="inline-block mt-4">
          <Button size="sm" variant="outline">
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Back to Directory
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Navigation */}
      <div>
        <Link
          to="/admin/employees"
          className="inline-flex items-center text-xs font-semibold text-slate-400 hover:text-emerald-400 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          Back to Trader Directory
        </Link>
      </div>

      {/* Header Profile Card */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-emerald-500/40 overflow-hidden flex items-center justify-center text-xl font-bold text-white shadow-lg shadow-emerald-950/40">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                profile.name.charAt(0)
              )}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-white">{profile.name}</h1>
                <StatusBadge status={profile.status} />
              </div>
              <p className="text-xs text-slate-400 mt-1">
                ID: <span className="font-mono text-emerald-400">{profile.employee_id}</span> • Joined {formatDate(profile.joining_date)}
              </p>
            </div>
          </div>

          <Link to={`/admin/success-points?employeeId=${profile.id}`}>
            <Button size="sm" variant="primary">
              <Award className="w-4 h-4 mr-1.5" />
              Award Success Points
            </Button>
          </Link>
        </div>
      </Card>

      {/* 5 Top Metrics for Employee */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card className="p-4 bg-slate-900/60">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Current Rank</span>
          <p className="text-2xl font-bold text-amber-400 mt-1">#{kpis?.currentRank ?? '--'}</p>
          <span className="text-[10px] text-slate-500">Firm Leaderboard</span>
        </Card>

        <Card className="p-4 bg-slate-900/60">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Tasks Done</span>
          <p className="text-2xl font-bold text-slate-100 mt-1">{kpis?.monthlyTasksCount ?? 0}</p>
          <span className="text-[10px] text-slate-500">This Month</span>
        </Card>

        <Card className="p-4 bg-slate-900/60">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Working Hours</span>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{kpis?.monthlyWorkingHours ?? 0}h</p>
          <span className="text-[10px] text-slate-500">Duration Sum</span>
        </Card>

        <Card className="p-4 bg-slate-900/60">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Success Points</span>
          <p className="text-2xl font-bold text-amber-400 mt-1">{kpis?.monthlySuccessPoints ?? 0}</p>
          <span className="text-[10px] text-slate-500">This Month</span>
        </Card>

        <Card className="p-4 bg-slate-900/60">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Attendance Days</span>
          <p className="text-2xl font-bold text-sky-400 mt-1">{attendance.filter(a => a.status === 'PRESENT').length}</p>
          <span className="text-[10px] text-slate-500">Total Recorded</span>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-4 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 border-b-2 transition-colors ${activeTab === 'overview' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
        >
          Overview & Tasks ({tasks.length})
        </button>
        <button
          onClick={() => setActiveTab('attendance')}
          className={`pb-3 border-b-2 transition-colors ${activeTab === 'attendance' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
        >
          Attendance Log ({attendance.length})
        </button>
        <button
          onClick={() => setActiveTab('points')}
          className={`pb-3 border-b-2 transition-colors ${activeTab === 'points' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
        >
          Success Points History ({points.length})
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Time Window</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Task Description</TableHead>
                <TableHead>Acceptance Criteria</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-slate-500">
                    No task sessions logged by this trader
                  </TableCell>
                </TableRow>
              ) : (
                tasks.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="whitespace-nowrap font-medium text-slate-200">
                      {formatDate(t.task_date)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-slate-400">
                      {formatTime(t.time_from)} - {formatTime(t.time_to)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap font-semibold text-emerald-400">
                      {t.duration_minutes} min
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-slate-300">
                      {t.description}
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-slate-400">
                      {t.acceptance_criteria}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={t.status} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {activeTab === 'attendance' && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Check In</TableHead>
              <TableHead>Check Out</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {attendance.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6 text-slate-500">
                  No attendance history
                </TableCell>
              </TableRow>
            ) : (
              attendance.map((att) => (
                <TableRow key={att.id}>
                  <TableCell className="font-medium text-slate-200">{formatDate(att.attendance_date)}</TableCell>
                  <TableCell><StatusBadge status={att.status} /></TableCell>
                  <TableCell className="text-slate-400">{att.check_in ? formatDate(att.check_in, 'p') : '--'}</TableCell>
                  <TableCell className="text-slate-400">{att.check_out ? formatDate(att.check_out, 'p') : '--'}</TableCell>
                  <TableCell className="text-slate-400">{att.notes || '—'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}

      {activeTab === 'points' && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Points Awarded</TableHead>
              <TableHead>Reason / Justification</TableHead>
              <TableHead>Awarded By</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {points.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-6 text-slate-500">
                  No success points awarded yet
                </TableCell>
              </TableRow>
            ) : (
              points.map((pt) => (
                <TableRow key={pt.id}>
                  <TableCell className="font-medium text-slate-200">{formatDate(pt.point_date)}</TableCell>
                  <TableCell className="font-bold text-amber-400">+{pt.points} pts</TableCell>
                  <TableCell className="text-slate-300">{pt.reason}</TableCell>
                  <TableCell className="text-slate-400">{pt.awarded_by_profile?.name || 'Owner'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
