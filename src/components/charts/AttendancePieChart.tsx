import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts';

interface AttendancePieChartProps {
  present: number;
  absent: number;
  leave: number;
  holiday: number;
}

export function AttendancePieChart({ present, absent, leave, holiday }: AttendancePieChartProps) {
  const data = [
    { name: 'Present', value: present, color: '#10b981' },
    { name: 'Leave', value: leave, color: '#f59e0b' },
    { name: 'Absent', value: absent, color: '#f43f5e' },
    { name: 'Holiday', value: holiday, color: '#38bdf8' },
  ].filter((d) => d.value > 0);

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-slate-500">
        No attendance records found for chart
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip
            contentStyle={{
              backgroundColor: '#0f172a',
              borderColor: '#334155',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#f8fafc',
            }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            formatter={(val) => <span className="text-xs text-slate-300 ml-1">{val}</span>}
          />
          <Pie
            data={data}
            innerRadius={50}
            outerRadius={80}
            paddingAngle={4}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} stroke="#0f172a" strokeWidth={2} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
