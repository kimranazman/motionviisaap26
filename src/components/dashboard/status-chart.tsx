'use client'

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts'
import { formatStatus } from '@/lib/utils'

interface StatusChartProps {
  data: Array<{
    status: string
    count: number
  }>
}

const STATUS_COLORS: Record<string, string> = {
  NOT_STARTED: '#9CA3AF',
  IN_PROGRESS: '#3B82F6',
  ON_HOLD: '#F59E0B',
  AT_RISK: '#F97316',
  COMPLETED: '#22C55E',
  CANCELLED: '#EF4444',
}

export function StatusChart({ data }: StatusChartProps) {
  const chartData = data.map((item) => ({
    name: formatStatus(item.status),
    value: item.count,
    color: STATUS_COLORS[item.status] || '#9CA3AF',
  }))

  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="45%"
            innerRadius={40}
            outerRadius={70}
            paddingAngle={2}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconSize={8}
            formatter={(value) => (
              <span className="text-xs text-gray-600 ml-1">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
