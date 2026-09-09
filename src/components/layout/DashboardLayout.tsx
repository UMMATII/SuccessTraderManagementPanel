import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { SupabaseBanner } from '@/components/common/SupabaseBanner';

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Derive title from pathname
  const getTitle = () => {
    const p = location.pathname;
    if (p.includes('/admin/dashboard')) return 'Owner Overview';
    if (p.includes('/admin/employees')) return 'Employee Directory';
    if (p.includes('/admin/attendance')) return 'Attendance Management';
    if (p.includes('/admin/tasks')) return 'Daily Task Records';
    if (p.includes('/admin/performance')) return 'Performance Analytics';
    if (p.includes('/admin/success-points')) return 'Success Points Center';
    if (p.includes('/admin/rankings')) return 'Trader Rankings';
    if (p.includes('/admin/audit-logs')) return 'Security Audit Logs';
    if (p.includes('/admin/settings')) return 'System Settings';

    if (p.includes('/employee/dashboard')) return 'Trader Workspace';
    if (p.includes('/employee/tasks/new')) return 'Log Daily Task';
    if (p.includes('/employee/tasks')) return 'My Tasks & Work Log';
    if (p.includes('/employee/attendance')) return 'My Attendance Record';
    if (p.includes('/employee/performance')) return 'My Performance';
    if (p.includes('/employee/profile')) return 'Trader Profile';
    if (p.includes('/employee/settings')) return 'Preferences & Security';

    return 'Success Trader Panel';
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col">
      <SupabaseBanner />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:pl-64 flex flex-col flex-1 min-w-0">
        <Header
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          title={getTitle()}
        />

        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
