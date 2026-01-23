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
      subtitle: '28 planned for 2026',
      icon: Target,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Completed',
      value: stats.completedCount,
      subtitle: `${stats.completionRate}% completion rate`,
      icon: CheckCircle2,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Upcoming Deadlines',
      value: stats.upcomingDeadlines,
      subtitle: 'In the next 30 days',
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'At Risk',
      value: stats.atRiskCount,
      subtitle: 'Need attention',
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
  ]

  const revenuePercentage = Math.round(
    (stats.revenueProgress / stats.revenueTarget) * 100
  )

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.title} className="border border-gray-200">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-3 md:gap-4">
                <div className={`rounded-lg p-2.5 md:p-3 ${kpi.bgColor}`}>
                  <kpi.icon className={`h-4 w-4 md:h-5 md:w-5 ${kpi.color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs md:text-sm text-gray-500 truncate">{kpi.title}</p>
                  <p className="text-xl md:text-2xl font-semibold text-gray-900">
                    {kpi.value}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{kpi.subtitle}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue Progress Card */}
      <Card className="border border-gray-200">
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg p-2.5 md:p-3 bg-purple-50">
                <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-purple-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs md:text-sm text-gray-500">Revenue Progress</p>
                <p className="text-xl md:text-2xl font-semibold text-gray-900">
                  {formatCurrency(stats.revenueProgress)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs md:text-sm text-gray-500">Target</p>
              <p className="text-base md:text-lg font-medium text-gray-700">
                {formatCurrency(stats.revenueTarget)}
              </p>
            </div>
          </div>
          <Progress value={revenuePercentage} className="h-2" />
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>{revenuePercentage}% achieved</span>
            <span>
              {formatCurrency(stats.revenueTarget - stats.revenueProgress)} remaining
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
