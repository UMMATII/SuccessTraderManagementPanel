import { supabase } from '@/lib/supabase';
import type {
  EmployeeRankItem,
  OwnerDashboardKPIs,
  EmployeeDashboardKPIs,
} from '@/types/models';

export const analyticsService = {
  /**
   * Calculate organization leaderboard/rankings for a selected month and year
   * Ordering: Success Points (desc), Completed Tasks (desc), Working Hours (desc)
   */
  async getLeaderboard(year: number, month: number): Promise<{ data: EmployeeRankItem[]; error: string | null }> {
    try {
      const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
      const endDate = new Date(year, month, 0).toISOString().split('T')[0];

      // 1. Fetch all active employees
      const { data: employees, error: empErr } = await supabase
        .from('profiles')
        .select('id, employee_id, name, avatar_url, status')
        .eq('role', 'EMPLOYEE')
        .eq('status', 'ACTIVE');

      if (empErr) throw empErr;
      if (!employees || employees.length === 0) return { data: [], error: null };

      // 2. Fetch tasks for that month
      const { data: tasks, error: tasksErr } = await supabase
        .from('tasks')
        .select('employee_id, duration_minutes, status')
        .gte('task_date', startDate)
        .lte('task_date', endDate);

      if (tasksErr) throw tasksErr;

      // 3. Fetch success points for that month
      const { data: points, error: pointsErr } = await supabase
        .from('success_points')
        .select('employee_id, points')
        .gte('point_date', startDate)
        .lte('point_date', endDate);

      if (pointsErr) throw pointsErr;

      // 4. Fetch attendance present count
      const { data: attendance, error: attErr } = await supabase
        .from('attendance')
        .select('employee_id, status')
        .eq('status', 'PRESENT')
        .gte('attendance_date', startDate)
        .lte('attendance_date', endDate);

      if (attErr) throw attErr;

      // Aggregate metrics per employee
      const taskCountMap = new Map<string, number>();
      const completedCountMap = new Map<string, number>();
      const durationMinutesMap = new Map<string, number>();
      tasks?.forEach((t) => {
        taskCountMap.set(t.employee_id, (taskCountMap.get(t.employee_id) || 0) + 1);
        if (t.status === 'COMPLETED') {
          completedCountMap.set(t.employee_id, (completedCountMap.get(t.employee_id) || 0) + 1);
        }
        durationMinutesMap.set(t.employee_id, (durationMinutesMap.get(t.employee_id) || 0) + (t.duration_minutes || 0));
      });

      const pointsMap = new Map<string, number>();
      points?.forEach((p) => {
        pointsMap.set(p.employee_id, (pointsMap.get(p.employee_id) || 0) + Number(p.points));
      });

      const attendanceMap = new Map<string, number>();
      attendance?.forEach((a) => {
        attendanceMap.set(a.employee_id, (attendanceMap.get(a.employee_id) || 0) + 1);
      });

      const leaderboard: EmployeeRankItem[] = employees.map((emp) => {
        const totalMin = durationMinutesMap.get(emp.id) || 0;
        return {
          rank: 0,
          employee_id: emp.id,
          employee_code: emp.employee_id,
          employee_name: emp.name,
          avatar_url: emp.avatar_url,
          tasks_count: taskCountMap.get(emp.id) || 0,
          completed_tasks: completedCountMap.get(emp.id) || 0,
          total_minutes: totalMin,
          working_hours: Number((totalMin / 60).toFixed(1)),
          success_points: pointsMap.get(emp.id) || 0,
          attendance_present_days: attendanceMap.get(emp.id) || 0,
        };
      });

      // Strict ranking sort:
      // 1. Primary: success_points descending
      // 2. Secondary: completed_tasks descending
      // 3. Tertiary: working_hours descending
      leaderboard.sort((a, b) => {
        if (b.success_points !== a.success_points) {
          return b.success_points - a.success_points;
        }
        if (b.completed_tasks !== a.completed_tasks) {
          return b.completed_tasks - a.completed_tasks;
        }
        return b.working_hours - a.working_hours;
      });

      leaderboard.forEach((item, idx) => {
        item.rank = idx + 1;
      });

      return { data: leaderboard, error: null };
    } catch (err: any) {
      console.error('Leaderboard error:', err);
      return { data: [], error: err.message || 'Failed to fetch leaderboard' };
    }
  },

  /**
   * Get KPIs for the Owner dashboard
   */
  async getOwnerKPIs(year: number, month: number): Promise<{ data: OwnerDashboardKPIs; error: string | null }> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
      const endDate = new Date(year, month, 0).toISOString().split('T')[0];

      // 1. Employee counts
      const { data: employees } = await supabase
        .from('profiles')
        .select('id, status')
        .eq('role', 'EMPLOYEE');

      const totalEmployees = employees?.length || 0;
      const activeEmployees = employees?.filter((e) => e.status === 'ACTIVE').length || 0;

      // 2. Today's attendance
      const { data: todayAttendance } = await supabase
        .from('attendance')
        .select('status')
        .eq('attendance_date', today);

      const todayAttendancePresent = todayAttendance?.filter((a) => a.status === 'PRESENT').length || 0;
      const todayAttendanceTotal = todayAttendance?.length || 0;

      // 3. Today's tasks
      const { count: todayTasksCount } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('task_date', today);

      // 4. Monthly success points
      const { data: points } = await supabase
        .from('success_points')
        .select('points')
        .gte('point_date', startDate)
        .lte('point_date', endDate);

      const monthlySuccessPoints = points?.reduce((sum, p) => sum + Number(p.points), 0) || 0;

      // 5. Average working hours per active employee this month
      const { data: monthTasks } = await supabase
        .from('tasks')
        .select('duration_minutes')
        .gte('task_date', startDate)
        .lte('task_date', endDate);

      const totalMinutes = monthTasks?.reduce((sum, t) => sum + (t.duration_minutes || 0), 0) || 0;
      const totalHours = totalMinutes / 60;
      const averageWorkingHours = activeEmployees > 0 ? Number((totalHours / activeEmployees).toFixed(1)) : 0;

      return {
        data: {
          totalEmployees,
          activeEmployees,
          todayAttendancePresent,
          todayAttendanceTotal,
          todayTasksCount: todayTasksCount || 0,
          monthlySuccessPoints,
          averageWorkingHours,
        },
        error: null,
      };
    } catch (err: any) {
      return {
        data: {
          totalEmployees: 0,
          activeEmployees: 0,
          todayAttendancePresent: 0,
          todayAttendanceTotal: 0,
          todayTasksCount: 0,
          monthlySuccessPoints: 0,
          averageWorkingHours: 0,
        },
        error: err.message || 'Failed to calculate owner KPIs',
      };
    }
  },

  /**
   * Get KPIs for a specific Employee dashboard
   */
  async getEmployeeKPIs(
    employeeId: string,
    year: number,
    month: number
  ): Promise<{ data: EmployeeDashboardKPIs; error: string | null }> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
      const endDate = new Date(year, month, 0).toISOString().split('T')[0];

      // 1. Today's tasks and minutes
      const { data: todayTasks } = await supabase
        .from('tasks')
        .select('duration_minutes')
        .eq('employee_id', employeeId)
        .eq('task_date', today);

      const todayTasksCount = todayTasks?.length || 0;
      const todayWorkingMinutes = todayTasks?.reduce((acc, t) => acc + (t.duration_minutes || 0), 0) || 0;

      // 2. Monthly tasks and minutes
      const { data: monthlyTasks } = await supabase
        .from('tasks')
        .select('duration_minutes')
        .eq('employee_id', employeeId)
        .gte('task_date', startDate)
        .lte('task_date', endDate);

      const monthlyTasksCount = monthlyTasks?.length || 0;
      const totalMonthMin = monthlyTasks?.reduce((acc, t) => acc + (t.duration_minutes || 0), 0) || 0;
      const monthlyWorkingHours = Number((totalMonthMin / 60).toFixed(1));

      // 3. Monthly success points
      const { data: points } = await supabase
        .from('success_points')
        .select('points')
        .eq('employee_id', employeeId)
        .gte('point_date', startDate)
        .lte('point_date', endDate);

      const monthlySuccessPoints = points?.reduce((acc, p) => acc + Number(p.points), 0) || 0;

      // 4. Current Rank
      const leaderboardRes = await this.getLeaderboard(year, month);
      const userRankItem = leaderboardRes.data.find((item) => item.employee_id === employeeId);
      const currentRank = userRankItem ? userRankItem.rank : '--';

      return {
        data: {
          todayTasksCount,
          todayWorkingMinutes,
          monthlyTasksCount,
          monthlyWorkingHours,
          monthlySuccessPoints,
          currentRank,
        },
        error: null,
      };
    } catch (err: any) {
      return {
        data: {
          todayTasksCount: 0,
          todayWorkingMinutes: 0,
          monthlyTasksCount: 0,
          monthlyWorkingHours: 0,
          monthlySuccessPoints: 0,
          currentRank: '--',
        },
        error: err.message || 'Failed to fetch employee KPIs',
      };
    }
  },

  /**
   * Get daily performance breakdown (hours and tasks per day) for charts
   */
  async getDailyPerformanceChart(
    employeeId: string | null,
    startDate: string,
    endDate: string
  ) {
    try {
      let query = supabase
        .from('tasks')
        .select('task_date, duration_minutes, status')
        .gte('task_date', startDate)
        .lte('task_date', endDate)
        .order('task_date', { ascending: true });

      if (employeeId) {
        query = query.eq('employee_id', employeeId);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Group by date
      const dateMap = new Map<string, { date: string; hours: number; tasks: number }>();
      data?.forEach((t) => {
        const current = dateMap.get(t.task_date) || { date: t.task_date, hours: 0, tasks: 0 };
        current.tasks += 1;
        current.hours += Number(((t.duration_minutes || 0) / 60).toFixed(2));
        dateMap.set(t.task_date, current);
      });

      return { data: Array.from(dateMap.values()), error: null };
    } catch (err: any) {
      return { data: [], error: err.message || 'Failed to fetch daily chart data' };
    }
  },
};
