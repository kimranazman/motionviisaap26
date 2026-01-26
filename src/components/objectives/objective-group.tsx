'use client'

import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible'
import { ChevronRight } from 'lucide-react'
import { formatObjective, cn } from '@/lib/utils'
import { KeyResultGroup } from '@/components/objectives/key-result-group'
import type { GroupedObjective } from '@/lib/initiative-group-utils'
import type { Initiative } from '@/components/objectives/objective-hierarchy'
import { aggregateKpiTotals } from '@/lib/initiative-kpi-utils'

interface ObjectiveGroupProps {
  group: GroupedObjective
  isExpanded: boolean
  expandedKRs: Set<string>
  onToggleObjective: () => void
  onToggleKR: (key: string) => void
  onInitiativeClick: (initiative: Initiative) => void
  overlapMap: Map<string, number>
}

export function ObjectiveGroup({
  group,
  isExpanded,
  expandedKRs,
  onToggleObjective,
  onToggleKR,
  onInitiativeClick,
  overlapMap,
}: ObjectiveGroupProps) {
  const otherCount =
    group.totalInitiatives -
    group.completedCount -
    group.inProgressCount -
    group.atRiskCount

  // Aggregate KPI from all initiatives across all KRs
  const allInitiatives = group.keyResults.flatMap(kr => kr.initiatives)
  const kpiAgg = aggregateKpiTotals(allInitiatives)
  const kpiColorClass = kpiAgg.percentage !== null
    ? kpiAgg.percentage >= 80
      ? 'text-green-600'
      : kpiAgg.percentage >= 50
        ? 'text-yellow-600'
        : 'text-red-600'
    : ''

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggleObjective}>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <CollapsibleTrigger className="flex items-center gap-3 w-full p-3 md:p-4 hover:bg-gray-50 transition rounded-xl text-left">
          <ChevronRight
            className={cn(
              'h-5 w-5 shrink-0 transition-transform duration-200 text-gray-400',
              isExpanded && 'rotate-90'
            )}
          />
          <span className="font-semibold text-lg text-gray-900">
            {formatObjective(group.objective)}
          </span>
          <span className="text-sm text-gray-500 shrink-0">
            {group.totalInitiatives} initiative{group.totalInitiatives !== 1 ? 's' : ''}
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
          <div className="flex flex-wrap items-center gap-1.5 ml-auto">
            {group.inProgressCount > 0 && (
              <span className="inline-flex items-center rounded-full bg-blue-100 text-blue-700 px-2 py-0.5 text-xs font-medium">
                {group.inProgressCount} In Progress
              </span>
            )}
            {group.atRiskCount > 0 && (
              <span className="inline-flex items-center rounded-full bg-orange-100 text-orange-700 px-2 py-0.5 text-xs font-medium">
                {group.atRiskCount} At Risk
              </span>
            )}
            {group.completedCount > 0 && (
              <span className="inline-flex items-center rounded-full bg-green-100 text-green-700 px-2 py-0.5 text-xs font-medium">
                {group.completedCount} Completed
              </span>
            )}
            {otherCount > 0 && (
              <span className="inline-flex items-center rounded-full bg-gray-100 text-gray-700 px-2 py-0.5 text-xs font-medium">
                {otherCount} Other
              </span>
            )}
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="pl-2 md:pl-4 pr-3 md:pr-4 pb-3 md:pb-4 space-y-2">
            {group.keyResults.map(kr => (
              <KeyResultGroup
                key={kr.keyResult}
                keyResult={kr}
                objectiveKey={group.objective}
                isExpanded={expandedKRs.has(group.objective + ':' + kr.keyResult)}
                onToggle={() => onToggleKR(group.objective + ':' + kr.keyResult)}
                onInitiativeClick={onInitiativeClick}
                overlapMap={overlapMap}
              />
            ))}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}
