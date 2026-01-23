'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Cell,
} from 'recharts'
import { formatDepartment } from '@/lib/utils'

interface DepartmentChartProps {
  data: Array<{
    department: string
    count: number
  }>
}

const DEPARTMENT_COLORS: Record<string, string> = {
  BIZ_DEV: '#8B5CF6',
  OPERATIONS: '#3B82F6',
  FINANCE: '#22C55E',
  MARKETING: '#F97316',
}

export function DepartmentChart({ data }: DepartmentChartProps) {
  const chartData = data.map((item) => ({
    name: formatDepartment(item.department),
    value: item.count,
    color: DEPARTMENT_COLORS[item.department] || '#9CA3AF',
    department: item.department,
  }))

  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 10, top: 5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis type="number" tick={{ fontSize: 10 }} />
          <YAxis
            dataKey="name"
            type="category"
            tick={{ fontSize: 10 }}
            width={70}
            tickFormatter={(value: string) =>
              value.length > 10 ? value.slice(0, 8) + '...' : value
            }
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}
            formatter={(value) => [`${value} initiatives`, 'Count']}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
