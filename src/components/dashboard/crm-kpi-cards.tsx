'use client'

import { Card, CardContent } from '@/components/ui/card'
import { cn, formatCurrency } from '@/lib/utils'
import {
  Target,
  TrendingUp,
  CheckCircle2,
  Briefcase,
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
      title: 'Open Pipeline',
      value: formatCurrency(openPipeline),
      subtitle: `${dealCount} deals`,
      icon: Target,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Weighted Forecast',
      value: formatCurrency(weightedForecast),
      subtitle: 'Probability-adjusted',
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
      title: 'Total Deals',
      value: dealCount,
      subtitle: 'In pipeline',
      icon: Briefcase,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
    },
    {
      title: 'Revenue',
      value: formatCurrency(totalRevenue),
      subtitle: 'Completed projects',
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Profit',
      value: formatCurrency(profit),
      subtitle: 'Revenue minus costs',
      icon: TrendingUp,
      color: profit >= 0 ? 'text-blue-600' : 'text-orange-600',
      bgColor: profit >= 0 ? 'bg-blue-50' : 'bg-orange-50',
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {kpis.map((kpi) => (
        <Card key={kpi.title} className="border border-gray-200">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center gap-3 md:gap-4">
              <div className={cn('rounded-lg p-2.5 md:p-3', kpi.bgColor)}>
                <kpi.icon className={cn('h-4 w-4 md:h-5 md:w-5', kpi.color)} />
              </div>
              <div className="min-w-0">
                <p className="text-xs md:text-sm text-gray-500 truncate">{kpi.title}</p>
                <p className="text-xl md:text-2xl font-semibold text-gray-900">
                  {kpi.value}
                </p>
                <p className="text-xs text-gray-400">{kpi.subtitle}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
