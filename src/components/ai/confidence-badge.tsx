'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { type ConfidenceLevel } from '@/types/ai-extraction'

// Color scheme for confidence levels (matching CONTEXT.md decisions)
export const CONFIDENCE_COLORS = {
  HIGH: {
    badge: 'bg-green-100 text-green-700 border-green-200 hover:bg-green-100',
    label: 'High',
  },
  MEDIUM: {
    badge: 'bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-100',
    label: 'Medium',
  },
  LOW: {
    badge: 'bg-red-100 text-red-700 border-red-200 hover:bg-red-100',
    label: 'Low',
  },
} as const

interface ConfidenceBadgeProps {
  confidence: ConfidenceLevel
  className?: string
}

export function ConfidenceBadge({ confidence, className }: ConfidenceBadgeProps) {
  const config = CONFIDENCE_COLORS[confidence]

  return (
    <Badge
      variant="outline"
      className={cn(config.badge, className)}
    >
      {config.label}
    </Badge>
  )
}
