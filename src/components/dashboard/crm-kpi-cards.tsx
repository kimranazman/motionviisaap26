'use client'

import { Card, CardContent } from '@/components/ui/card'
import { cn, formatCurrency } from '@/lib/utils'
import {
  Target,
  TrendingUp,
  CheckCircle2,
  DollarSign,
} from 'lucide-react'

interface CRMKPICardsProps {
  openPipeline: number
  weightedForecast: number
  winRate: number
  dealCount: number
  totalRevenue: number
  profit: number
}

export function CRMKPICards({ openPipeline, weightedForecast, winRate, dealCount, totalRevenue, profit }: CRMKPICardsProps) {
  const kpis = [
    {
      title: 'Pipeline',
      value: formatCurrency(openPipeline),
      subtitle: `${dealCount} deals`,
      icon: Target,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Forecast',
      value: formatCurrency(weightedForecast),
      subtitle: 'Weighted',
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Win Rate',
      value: `${winRate}%`,
      subtitle: 'Won vs closed',
      icon: CheckCircle2,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Revenue',
      value: formatCurrency(totalRevenue),
      subtitle: 'Completed',
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Profit',
      value: formatCurrency(profit),
      subtitle: 'Net',
      icon: TrendingUp,
      color: profit >= 0 ? 'text-blue-600' : 'text-orange-600',
      bgColor: profit >= 0 ? 'bg-blue-50' : 'bg-orange-50',
    },
  ]

  return (
    <div className="h-full grid grid-cols-5 gap-3">
      {kpis.map((kpi) => (
        <Card key={kpi.title} className="border border-gray-200">
          <CardContent className="p-3 h-full flex items-center">
            <div className="flex items-center gap-2">
              <div className={cn('rounded-md p-1.5 shrink-0', kpi.bgColor)}>
                <kpi.icon className={cn('h-4 w-4', kpi.color)} />
              </div>
              <div className="min-w-0">
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
  )
}
