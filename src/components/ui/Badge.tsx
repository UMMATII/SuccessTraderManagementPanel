import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
}

export function Badge({ className, variant = 'neutral', children, ...props }: BadgeProps) {
  const variants = {
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    danger: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    info: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    neutral: 'bg-slate-800 text-slate-300 border-slate-700',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-semibold uppercase tracking-wider',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'ACTIVE':
    case 'PRESENT':
    case 'COMPLETED':
      return <Badge variant="success">{status}</Badge>;
    case 'INACTIVE':
    case 'ABSENT':
      return <Badge variant="danger">{status}</Badge>;
    case 'LEAVE':
      return <Badge variant="warning">{status}</Badge>;
    case 'HOLIDAY':
      return <Badge variant="info">{status}</Badge>;
    default:
      return <Badge variant="neutral">{status}</Badge>;
  }
}
