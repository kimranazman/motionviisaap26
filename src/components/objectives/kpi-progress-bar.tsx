'use client'

import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { Pencil, Calculator } from 'lucide-react'

interface KpiProgressBarProps {
  label: string
  percentage: number | null
  displayText: string
  source: 'auto' | 'manual'
  className?: string
}

function getBarColorClass(percentage: number | null): string {
  if (percentage === null) return '[&>div]:bg-gray-300'
  if (percentage >= 80) return '[&>div]:bg-green-500'
  if (percentage >= 50) return '[&>div]:bg-yellow-500'
  return '[&>div]:bg-red-500'
}

function getTextColorClass(percentage: number | null): string {
  if (percentage === null) return 'text-gray-400'
  if (percentage >= 80) return 'text-green-600'
  if (percentage >= 50) return 'text-yellow-600'
  return 'text-red-600'
}

export function KpiProgressBar({
  label,
  percentage,
  displayText,
  source,
  className,
}: KpiProgressBarProps) {
  const isNoData = percentage === null && displayText === 'No data'

  return (
    <div className={cn('mt-1.5 space-y-0.5', className)}>
      <div className="flex items-center gap-1.5 text-xs text-gray-500">
        {source === 'manual' ? (
          <Pencil className="h-3 w-3 shrink-0" />
        ) : (
          <Calculator className="h-3 w-3 shrink-0" />
        )}
        {isNoData ? (
          <span className="text-gray-400">No KPI set</span>
        ) : (
          <span className={getTextColorClass(percentage)}>
            {label !== 'No data' && label !== 'Revenue' ? `${label}: ` : ''}{displayText}
            {percentage !== null && (
              <span className="ml-1">({Math.round(percentage)}%)</span>
            )}
          </span>
        )}
      </div>
      <Progress
        value={percentage !== null ? Math.min(percentage, 100) : 0}
        className={cn('h-1.5', getBarColorClass(percentage))}
      />
    </div>
  )
}
