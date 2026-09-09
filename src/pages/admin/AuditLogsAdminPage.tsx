import React, { useEffect, useState } from 'react';
import { auditLogService } from '@/services/auditLogService';
import type { AuditLogWithUser } from '@/types/models';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
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
import { formatDate } from '@/lib/date-utils';
import { History, Shield, Filter } from 'lucide-react';

export function AuditLogsAdminPage() {
  const [logs, setLogs] = useState<AuditLogWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');

  const loadLogs = async () => {
    try {
      setIsLoading(true);
      const res = await auditLogService.getAuditLogs({
        action: actionFilter || undefined,
      });
      setLogs(res.data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [actionFilter]);

  const getActionBadge = (action: string) => {
    if (action.includes('AWARD')) return <Badge variant="warning">{action}</Badge>;
    if (action.includes('CREATE')) return <Badge variant="success">{action}</Badge>;
    if (action.includes('ACTIVATE')) return <Badge variant="info">{action}</Badge>;
    if (action.includes('DEACTIVATE')) return <Badge variant="danger">{action}</Badge>;
    return <Badge variant="neutral">{action}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-400" />
            Security & Audit Logs
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Immutable log of administrative modifications, task registrations, and point awards
          </p>
        </div>

        <div className="w-64">
          <Select
            options={[
              { value: '', label: 'All Audited Actions' },
              { value: 'CREATE_EMPLOYEE', label: 'Create Employee' },
              { value: 'UPDATE_EMPLOYEE', label: 'Update Employee' },
              { value: 'ACTIVATE_EMPLOYEE', label: 'Activate Employee' },
              { value: 'DEACTIVATE_EMPLOYEE', label: 'Deactivate Employee' },
              { value: 'RESET_PASSWORD', label: 'Reset Password' },
              { value: 'CREATE_TASK', label: 'Create Task' },
              { value: 'UPDATE_TASK', label: 'Update Task' },
              { value: 'CREATE_ATTENDANCE', label: 'Create Attendance' },
              { value: 'UPDATE_ATTENDANCE', label: 'Update Attendance' },
              { value: 'AWARD_SUCCESS_POINTS', label: 'Award Success Points' },
            ]}
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
          />
        </div>
      </div>

      {/* Logs Table */}
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : logs.length === 0 ? (
        <EmptyState
          icon={<History className="w-6 h-6 text-slate-500" />}
          title="No Audit Entries Found"
          description="No administrative activity has been captured for this filter."
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Change Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="whitespace-nowrap text-xs text-slate-300 font-mono">
                  {formatDate(log.created_at, 'yyyy-MM-dd HH:mm:ss')}
                </TableCell>
                <TableCell>
                  <div className="font-semibold text-slate-200 text-xs">
                    {log.user?.name || 'System / Admin'}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {log.user?.role || 'SYSTEM'}
                  </div>
                </TableCell>
                <TableCell>{getActionBadge(log.action)}</TableCell>
                <TableCell className="text-xs text-slate-400 font-mono">
                  {log.entity_type}
                </TableCell>
                <TableCell className="max-w-md">
                  <div className="bg-slate-900 border border-slate-800 p-2 rounded text-[11px] font-mono text-slate-300 max-h-24 overflow-y-auto">
                    {log.new_value ? JSON.stringify(log.new_value, null, 2) : '—'}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
