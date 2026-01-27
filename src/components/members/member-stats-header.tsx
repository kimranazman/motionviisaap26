'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { LucideIcon } from 'lucide-react'

interface StatItem {
  label: string
  count: number
  icon: LucideIcon
  breakdown: Array<{ status: string; label: string; count: number }>
}

interface MemberStatsHeaderProps {
  stats: StatItem[]
}

export function MemberStatsHeader({ stats }: MemberStatsHeaderProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map(stat => {
        const Icon = stat.icon
        return (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <Icon className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-500">{stat.label}</span>
              </div>
              <div className="text-2xl font-bold">{stat.count}</div>
              {stat.breakdown.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {stat.breakdown.map(b => (
                    <Badge
                      key={b.status}
                      variant="secondary"
                      className="text-xs"
                    >
                      {b.count} {b.label}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
