'use client'

import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { InitiativeRow } from '@/components/objectives/initiative-row'
import type { GroupedKeyResult } from '@/lib/initiative-group-utils'
import type { Initiative } from '@/components/objectives/objective-hierarchy'
import { aggregateKpiTotals } from '@/lib/initiative-kpi-utils'

interface KeyResultGroupProps {
  keyResult: GroupedKeyResult
  objectiveKey: string
  isExpanded: boolean
  onToggle: () => void
  onInitiativeClick: (initiative: Initiative) => void
}

export function KeyResultGroup({
  keyResult,
  isExpanded,
  onToggle,
  onInitiativeClick,
}: KeyResultGroupProps) {
  const inProgressCount = keyResult.initiatives.filter(
    i => i.status === 'IN_PROGRESS'
  ).length
  const atRiskCount = keyResult.initiatives.filter(
    i => i.status === 'AT_RISK'
  ).length

  // Aggregated KPI totals for the header
  const kpiAgg = aggregateKpiTotals(keyResult.initiatives)
  const kpiColorClass = kpiAgg.percentage !== null
    ? kpiAgg.percentage >= 80
      ? 'text-green-600'
      : kpiAgg.percentage >= 50
        ? 'text-yellow-600'
        : 'text-red-600'
    : ''

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <div className="bg-gray-50/50 rounded-lg border border-gray-100">
        <CollapsibleTrigger className="flex items-center gap-2 w-full p-2 md:p-3 hover:bg-gray-100/50 transition rounded-lg text-left">
          <ChevronRight
            className={cn(
              'h-4 w-4 shrink-0 transition-transform duration-200 text-gray-400',
              isExpanded && 'rotate-90'
            )}
          />
          <span className="font-medium text-gray-800">
            {keyResult.keyResult}
          </span>
          <span className="text-sm text-gray-500 shrink-0">
            {keyResult.totalInitiatives} initiative{keyResult.totalInitiatives !== 1 ? 's' : ''}
          </span>
          {kpiAgg.hasData && (
            <span className={cn('text-xs shrink-0', kpiColorClass)}>
              {kpiAgg.mixedUnits
                ? 'Mixed KPIs'
                : kpiAgg.percentage !== null
                  ? `KPI: ${Math.round(kpiAgg.totalActual)}/${Math.round(kpiAgg.totalTarget)} ${kpiAgg.unit} (${Math.round(kpiAgg.percentage)}%)`
                  : `KPI: ${Math.round(kpiAgg.totalActual)} ${kpiAgg.unit}`
              }
            </span>
          )}
          <div className="flex items-center gap-2 ml-auto text-xs">
            {inProgressCount > 0 && (
              <span className="text-blue-600">
                {inProgressCount} In Progress
              </span>
            )}
            {atRiskCount > 0 && (
              <span className="text-orange-600">
                {atRiskCount} At Risk
              </span>
            )}
            {keyResult.completedCount > 0 && (
              <span className="text-green-600">
                {keyResult.completedCount} Completed
              </span>
            )}
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="pl-2 md:pl-6 pr-2 md:pr-3 pb-2 md:pb-3 space-y-1">
            {keyResult.initiatives.map(initiative => (
              <InitiativeRow
                key={initiative.id}
                initiative={initiative as Initiative}
                onClick={() => onInitiativeClick(initiative as Initiative)}
              />
            ))}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}
