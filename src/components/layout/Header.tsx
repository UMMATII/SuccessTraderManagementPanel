import React from 'react';
import { Menu, Bell, Clock, Calendar, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/date-utils';

interface HeaderProps {
  onToggleSidebar: () => void;
  title?: string;
}

export function Header({ onToggleSidebar, title }: HeaderProps) {
  const { profile, role } = useAuthStore();
  const today = formatDate(new Date().toISOString(), 'EEEE, MMMM d, yyyy');

  return (
    <header className="sticky top-0 z-30 h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>
        {title && (
          <h2 className="text-base font-bold text-slate-100 hidden sm:block">
            {title}
          </h2>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Date Indicator */}
        <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 bg-slate-950/60 border border-slate-800/80 px-3 py-1.5 rounded-lg">
          <Calendar className="w-3.5 h-3.5 text-emerald-400" />
          <span>{today}</span>
        </div>

        {/* Role Badge */}
        <Badge
          variant={role === 'OWNER' ? 'success' : 'info'}
          className="gap-1.5 py-1 px-2.5"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          {role}
        </Badge>
      </div>
    </header>
  );
}
