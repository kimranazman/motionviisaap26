'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { formatCurrency } from '@/lib/utils'

interface StageData {
  id: string
  name: string
  count: number
  value: number
  color: string
}

interface PipelineStageChartProps {
  data: StageData[]
}

interface TooltipPayload {
  payload: StageData
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload?.length) return null

  const data = payload[0].payload
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-md">
      <p className="font-medium text-gray-900">{data.name}</p>
      <p className="text-sm text-gray-600">{data.count} deals</p>
      <p className="text-sm text-gray-600">{formatCurrency(data.value)}</p>
    </div>
  )
}

export function PipelineStageChart({ data }: PipelineStageChartProps) {
  return (
    <Card className="border border-gray-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium text-gray-900">
          Pipeline by Stage
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 10, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis
                type="number"
                tick={{ fontSize: 10 }}
                tickFormatter={(value) => {
                  if (value >= 1000000) return `${(value/1000000).toFixed(0)}M`
                  if (value >= 1000) return `${(value/1000).toFixed(0)}K`
                  return formatCurrency(value)
                }}
              />
              <YAxis
                dataKey="name"
                type="category"
                tick={{ fontSize: 10 }}
                width={70}
                tickFormatter={(value: string) =>
                  value.length > 12 ? value.slice(0, 10) + '...' : value
                }
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
