import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';

// Public Auth Pages
import { LoginPage } from '@/pages/auth/LoginPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage';

// Owner Pages
import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import { EmployeesPage } from '@/pages/admin/EmployeesPage';
import { EmployeeDetailPage } from '@/pages/admin/EmployeeDetailPage';
import { AttendanceAdminPage } from '@/pages/admin/AttendanceAdminPage';
import { DailyTasksAdminPage } from '@/pages/admin/DailyTasksAdminPage';
import { PerformanceAdminPage } from '@/pages/admin/PerformanceAdminPage';
import { SuccessPointsAdminPage } from '@/pages/admin/SuccessPointsAdminPage';
import { RankingsAdminPage } from '@/pages/admin/RankingsAdminPage';
import { AuditLogsAdminPage } from '@/pages/admin/AuditLogsAdminPage';
import { SettingsAdminPage } from '@/pages/admin/SettingsAdminPage';

// Employee Pages
import { EmployeeDashboard } from '@/pages/employee/EmployeeDashboard';
import { MyTasksPage } from '@/pages/employee/MyTasksPage';
import { NewTaskPage } from '@/pages/employee/NewTaskPage';
import { MyAttendancePage } from '@/pages/employee/MyAttendancePage';
import { MyPerformancePage } from '@/pages/employee/MyPerformancePage';
import { MyProfilePage } from '@/pages/employee/MyProfilePage';
import { EmployeeSettingsPage } from '@/pages/employee/EmployeeSettingsPage';

function RootRedirect() {
  const { role, user, profile } = useAuthStore();

  if (user || profile) {
    if (role === 'OWNER') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to="/employee/dashboard" replace />;
  }

  return <Navigate to="/login" replace />;
}

export function App() {
  const { initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Authentication Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* OWNER PORTAL (Protected to role OWNER) */}
        <Route element={<ProtectedRoute allowedRoles={['OWNER']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/employees" element={<EmployeesPage />} />
            <Route path="/admin/employees/:employeeId" element={<EmployeeDetailPage />} />
            <Route path="/admin/attendance" element={<AttendanceAdminPage />} />
            <Route path="/admin/tasks" element={<DailyTasksAdminPage />} />
            <Route path="/admin/performance" element={<PerformanceAdminPage />} />
            <Route path="/admin/success-points" element={<SuccessPointsAdminPage />} />
            <Route path="/admin/rankings" element={<RankingsAdminPage />} />
            <Route path="/admin/audit-logs" element={<AuditLogsAdminPage />} />
            <Route path="/admin/settings" element={<SettingsAdminPage />} />
          </Route>
        </Route>

        {/* EMPLOYEE PORTAL (Protected to role EMPLOYEE) */}
        <Route element={<ProtectedRoute allowedRoles={['EMPLOYEE']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/employee/dashboard" element={<EmployeeDashboard />} />
            <Route path="/employee/tasks" element={<MyTasksPage />} />
            <Route path="/employee/tasks/new" element={<NewTaskPage />} />
            <Route path="/employee/attendance" element={<MyAttendancePage />} />
            <Route path="/employee/performance" element={<MyPerformancePage />} />
            <Route path="/employee/profile" element={<MyProfilePage />} />
            <Route path="/employee/settings" element={<EmployeeSettingsPage />} />
          </Route>
        </Route>

        {/* Default Route Redirection */}
        <Route path="/" element={<RootRedirect />} />
        <Route path="*" element={<RootRedirect />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
