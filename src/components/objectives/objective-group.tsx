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
import { calculateObjectiveProgress } from '@/lib/kr-progress-utils'
import { Progress } from '@/components/ui/progress'

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

  // Calculate weighted objective rollup from KR progress data
  // Each GroupedKeyResult contains initiatives with the keyResult relation
  const seenKrIds = new Set<string>()
  const krProgressData: { progress: number; weight: number }[] = []
  for (const kr of group.keyResults) {
    if (kr.keyResultId && !seenKrIds.has(kr.keyResultId)) {
      seenKrIds.add(kr.keyResultId)
      // Get KR metrics from the first initiative's keyResult relation
      const firstWithKR = kr.initiatives.find(
        (i) => (i as Initiative).keyResult != null
      ) as Initiative | undefined
      if (firstWithKR?.keyResult) {
        krProgressData.push({
          progress: firstWithKR.keyResult.progress,
          weight: firstWithKR.keyResult.weight,
        })
      }
    }
  }
  const objectiveProgress = calculateObjectiveProgress(krProgressData)
  const hasProgress = krProgressData.length > 0

  const progressColorClass =
    objectiveProgress >= 80
      ? '[&>div]:bg-green-500'
      : objectiveProgress >= 50
        ? '[&>div]:bg-yellow-500'
        : '[&>div]:bg-red-500'

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
          {hasProgress && (
            <div className="flex items-center gap-2 shrink-0">
              <Progress
                value={objectiveProgress}
                className={cn('h-2 w-20', progressColorClass)}
              />
              <span className={cn(
                'text-xs font-medium',
                objectiveProgress >= 80 ? 'text-green-600' : objectiveProgress >= 50 ? 'text-yellow-600' : 'text-red-600'
              )}>
                {Math.round(objectiveProgress)}%
              </span>
            </div>
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
                key={kr.krId}
                keyResult={kr}
                objectiveKey={group.objective}
                isExpanded={expandedKRs.has(group.objective + ':' + kr.krId)}
                onToggle={() => onToggleKR(group.objective + ':' + kr.krId)}
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
