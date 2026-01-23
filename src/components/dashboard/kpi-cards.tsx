'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { formatCurrency } from '@/lib/utils'
import {
  Target,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react'

interface KPICardsProps {
  stats: {
    totalInitiatives: number
    completedCount: number
    completionRate: number
    revenueProgress: number
    revenueTarget: number
    upcomingDeadlines: number
    atRiskCount: number
  }
}

export function KPICards({ stats }: KPICardsProps) {
  const kpis = [
    {
      title: 'Total Initiatives',
      value: stats.totalInitiatives,
      subtitle: 'planned for 2026',
      icon: Target,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Completed',
      value: stats.completedCount,
      subtitle: `${stats.completionRate}% rate`,
      icon: CheckCircle2,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Upcoming',
      value: stats.upcomingDeadlines,
      subtitle: 'next 30 days',
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'At Risk',
      value: stats.atRiskCount,
      subtitle: 'need attention',
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
  ]

  const revenuePercentage = Math.round(
    (stats.revenueProgress / stats.revenueTarget) * 100
  )

  return (
    <div className="h-full flex flex-col gap-3">
      {/* KPI Cards - compact row */}
      <div className="grid grid-cols-4 gap-3">
        {kpis.map((kpi) => (
          <Card key={kpi.title} className="border border-gray-200">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className={`rounded-md p-1.5 ${kpi.bgColor}`}>
                  <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-2xl font-semibold text-gray-900 leading-none">
                    {kpi.value}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{kpi.subtitle}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue Progress - compact */}
      <Card className="border border-gray-200 flex-1">
        <CardContent className="p-3 h-full flex flex-col justify-center">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="rounded-md p-1.5 bg-purple-50">
                <TrendingUp className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Revenue Progress</p>
                <p className="text-lg font-semibold text-gray-900 leading-none">
                  {formatCurrency(stats.revenueProgress)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Target</p>
              <p className="text-sm font-medium text-gray-700">
                {formatCurrency(stats.revenueTarget)}
              </p>
            </div>
          </div>
          <Progress value={revenuePercentage} className="h-2" />
        </CardContent>
      </Card>
    </div>
  )
}
