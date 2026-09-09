import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';

interface PerformanceTrendChartProps {
  data: Array<{ date: string; hours: number; tasks: number }>;
}

export function PerformanceTrendChart({ data }: PerformanceTrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-slate-500">
        No performance records for this interval
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis
            dataKey="date"
            stroke="#64748b"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: '#334155' }}
          />
          <YAxis
            yAxisId="left"
            stroke="#10b981"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: '#334155' }}
            tickFormatter={(v) => `${v}h`}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            stroke="#38bdf8"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: '#334155' }}
            tickFormatter={(v) => `${v}`}
          />
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
            verticalAlign="top"
            align="right"
            iconType="circle"
            formatter={(val) => <span className="text-xs text-slate-300">{val}</span>}
          />
          <Bar
            yAxisId="left"
            dataKey="hours"
            name="Working Hours"
            fill="#10b981"
            radius={[4, 4, 0, 0]}
            maxBarSize={30}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="tasks"
            name="Tasks Count"
            stroke="#38bdf8"
            strokeWidth={2}
            dot={{ r: 3, fill: '#38bdf8' }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
