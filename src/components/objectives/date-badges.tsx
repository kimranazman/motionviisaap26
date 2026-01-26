'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { analyzeDates, type DateFlag } from '@/lib/initiative-date-utils'
import { AlertTriangle, Clock, AlertCircle, Info, Users } from 'lucide-react'

interface DateBadgesProps {
  startDate: string
  endDate: string
  status: string
  overlapCount: number
}

const FLAG_CONFIG: Record<
  DateFlag,
  {
    colorClass: string
    icon: typeof AlertTriangle
    label: (data: { daysOverdue: number | null; daysUntilEnd: number | null; durationDays: number }) => string
  }
> = {
  overdue: {
    colorClass: 'bg-red-100 text-red-700 border-red-200',
    icon: AlertTriangle,
    label: (d) => `${d.daysOverdue}d overdue`,
  },
  'ending-soon': {
    colorClass: 'bg-orange-100 text-orange-700 border-orange-200',
    icon: Clock,
    label: (d) => `Ends in ${d.daysUntilEnd}d`,
  },
  'late-start': {
    colorClass: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    icon: Clock,
    label: () => 'Late start',
  },
  'invalid-dates': {
    colorClass: 'bg-red-100 text-red-700 border-red-200',
    icon: AlertCircle,
    label: () => 'Invalid dates',
  },
  'long-duration': {
    colorClass: 'bg-gray-100 text-gray-600 border-gray-200',
    icon: Info,
    label: (d) => `${d.durationDays}d span`,
  },
}

export function DateBadges({ startDate, endDate, status, overlapCount }: DateBadgesProps) {
  const intelligence = analyzeDates(startDate, endDate, status)
  const { flags, daysOverdue, daysUntilEnd, durationDays } = intelligence

  const showOverlap = overlapCount > 3
  if (flags.length === 0 && !showOverlap) return null

  const labelData = { daysOverdue, daysUntilEnd, durationDays }

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {flags.map(flag => {
        const config = FLAG_CONFIG[flag]
        const Icon = config.icon
        return (
          <Badge
            key={flag}
            variant="outline"
            className={cn(config.colorClass, 'text-[11px] py-0 px-1.5 gap-1')}
          >
            <Icon className="h-3 w-3" />
            {config.label(labelData)}
          </Badge>
        )
      })}
      {showOverlap && (
        <Badge
          variant="outline"
          className={cn('bg-orange-100 text-orange-700 border-orange-200', 'text-[11px] py-0 px-1.5 gap-1')}
        >
          <Users className="h-3 w-3" />
          Workload: {overlapCount} concurrent
        </Badge>
      )}
    </div>
  )
}
