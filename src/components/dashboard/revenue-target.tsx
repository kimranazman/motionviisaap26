'use client'

import { Progress } from '@/components/ui/progress'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp } from 'lucide-react'

export interface RevenueBreakdownItem {
  krId: string
  description: string
  target: number
  actual: number
}

interface RevenueTargetProps {
  breakdown: RevenueBreakdownItem[]
  totalTarget: number
  totalActual: number
}

export function RevenueTarget({ breakdown, totalTarget, totalActual }: RevenueTargetProps) {
  const overallPercentage = totalTarget > 0
    ? Math.round((totalActual / totalTarget) * 100)
    : 0

  if (breakdown.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm">
        No revenue targets configured
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Overall summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="rounded-md p-1.5 bg-emerald-50">
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Total Revenue</p>
            <p className="text-lg font-semibold text-gray-900">
              {formatCurrency(totalActual)}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Target</p>
          <p className="text-sm font-medium text-gray-700">
            {formatCurrency(totalTarget)}
          </p>
        </div>
      </div>

      {/* Overall progress bar */}
      <div>
        <Progress value={overallPercentage} className="h-2" />
        <p className="text-xs text-gray-500 mt-1">{overallPercentage}% of target</p>
      </div>

      {/* Per-KR breakdown rows */}
      <div className="space-y-3 flex-1">
        {breakdown.map(item => {
          const pct = item.target > 0
            ? Math.round((item.actual / item.target) * 100)
            : 0
          return (
            <div key={item.krId} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">{item.description}</span>
                <span className="text-gray-500">
                  {formatCurrency(item.actual)} / {formatCurrency(item.target)}
                </span>
              </div>
              <Progress value={pct} className="h-1.5" />
            </div>
          )
        })}
      </div>
    </div>
  )
}
