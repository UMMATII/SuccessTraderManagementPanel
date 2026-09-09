import { create } from 'zustand';
import type { EmployeeRankItem, OwnerDashboardKPIs, EmployeeDashboardKPIs } from '@/types/models';
import { analyticsService } from '@/services/analyticsService';

interface AnalyticsState {
  leaderboard: EmployeeRankItem[];
  ownerKPIs: OwnerDashboardKPIs | null;
  employeeKPIs: EmployeeDashboardKPIs | null;
  dailyChartData: Array<{ date: string; hours: number; tasks: number }>;
  isLoading: boolean;
  error: string | null;
  selectedYear: number;
  selectedMonth: number;

  setSelectedMonthYear: (year: number, month: number) => void;
  fetchLeaderboard: (year?: number, month?: number) => Promise<void>;
  fetchOwnerDashboard: (year?: number, month?: number) => Promise<void>;
  fetchEmployeeDashboard: (employeeId: string, year?: number, month?: number) => Promise<void>;
  fetchDailyChart: (employeeId: string | null, startDate: string, endDate: string) => Promise<void>;
}

export const useAnalyticsStore = create<AnalyticsState>((set, get) => ({
  leaderboard: [],
  ownerKPIs: null,
  employeeKPIs: null,
  dailyChartData: [],
  isLoading: false,
  error: null,
  selectedYear: new Date().getFullYear(),
  selectedMonth: new Date().getMonth() + 1,

  setSelectedMonthYear: (year, month) => {
    set({ selectedYear: year, selectedMonth: month });
  },

  fetchLeaderboard: async (year, month) => {
    const y = year || get().selectedYear;
    const m = month || get().selectedMonth;
    set({ isLoading: true, error: null });
    const { data, error } = await analyticsService.getLeaderboard(y, m);
    set({ leaderboard: data, error, isLoading: false });
  },

  fetchOwnerDashboard: async (year, month) => {
    const y = year || get().selectedYear;
    const m = month || get().selectedMonth;
    set({ isLoading: true, error: null });
    const { data: kpis, error: kpiErr } = await analyticsService.getOwnerKPIs(y, m);
    const { data: leaderboard } = await analyticsService.getLeaderboard(y, m);
    set({ ownerKPIs: kpis, leaderboard, error: kpiErr, isLoading: false });
  },

  fetchEmployeeDashboard: async (employeeId, year, month) => {
    const y = year || get().selectedYear;
    const m = month || get().selectedMonth;
    set({ isLoading: true, error: null });
    const { data, error } = await analyticsService.getEmployeeKPIs(employeeId, y, m);
    set({ employeeKPIs: data, error, isLoading: false });
  },

  fetchDailyChart: async (employeeId, startDate, endDate) => {
    const { data, error } = await analyticsService.getDailyPerformanceChart(employeeId, startDate, endDate);
    set({ dailyChartData: data, error });
  },
}));
