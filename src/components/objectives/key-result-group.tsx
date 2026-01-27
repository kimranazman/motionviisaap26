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
import { Progress } from '@/components/ui/progress'

interface KeyResultGroupProps {
  keyResult: GroupedKeyResult
  objectiveKey: string
  isExpanded: boolean
  onToggle: () => void
  onInitiativeClick: (initiative: Initiative) => void
  overlapMap: Map<string, number>
}

function getKrStatusColor(status: string): string {
  switch (status) {
    case 'ON_TRACK': return 'bg-green-100 text-green-700'
    case 'AT_RISK': return 'bg-orange-100 text-orange-700'
    case 'BEHIND': return 'bg-red-100 text-red-700'
    case 'ACHIEVED': return 'bg-emerald-100 text-emerald-700'
    default: return 'bg-gray-100 text-gray-700'
  }
}

function formatKrStatus(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function getProgressBarColor(progress: number): string {
  if (progress >= 80) return '[&>div]:bg-green-500'
  if (progress >= 50) return '[&>div]:bg-yellow-500'
  return '[&>div]:bg-red-500'
}

export function KeyResultGroup({
  keyResult,
  isExpanded,
  onToggle,
  onInitiativeClick,
  overlapMap,
}: KeyResultGroupProps) {
  const inProgressCount = keyResult.initiatives.filter(
    i => i.status === 'IN_PROGRESS'
  ).length
  const atRiskCount = keyResult.initiatives.filter(
    i => i.status === 'AT_RISK'
  ).length

  // Get KR metrics from the first initiative's keyResult relation
  const firstWithKR = keyResult.initiatives.find(
    (i) => (i as Initiative).keyResult != null
  ) as Initiative | undefined
  const krData = firstWithKR?.keyResult || null

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <div className="bg-gray-50/50 rounded-lg border border-gray-100">
        <CollapsibleTrigger className="flex items-start gap-2 w-full p-2 md:p-3 hover:bg-gray-100/50 transition rounded-lg text-left">
          <ChevronRight
            className={cn(
              'h-4 w-4 shrink-0 mt-0.5 transition-transform duration-200 text-gray-400',
              isExpanded && 'rotate-90'
            )}
          />
          <div className="flex-1 min-w-0">
            {/* KR header line: krId + description */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-gray-800">
                {keyResult.krId}
              </span>
              {krData?.description && (
                <span className="text-sm text-gray-600 truncate max-w-[300px]">
                  {krData.description}
                </span>
              )}
              <span className="text-sm text-gray-500 shrink-0">
                {keyResult.totalInitiatives} initiative{keyResult.totalInitiatives !== 1 ? 's' : ''}
              </span>
            </div>

            {/* KR metrics row */}
            {krData && (
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                {/* Target vs Actual */}
                <span className="text-xs text-gray-600">
                  {krData.actual}/{krData.target} {krData.unit}
                </span>
                {/* Progress bar */}
                <Progress
                  value={krData.progress}
                  className={cn('h-1.5 w-24', getProgressBarColor(krData.progress))}
                />
                <span className={cn(
                  'text-xs font-medium',
                  krData.progress >= 80 ? 'text-green-600' : krData.progress >= 50 ? 'text-yellow-600' : 'text-red-600'
                )}>
                  {Math.round(krData.progress)}%
                </span>
                {/* Status badge */}
                <span className={cn(
                  'inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium',
                  getKrStatusColor(krData.status)
                )}>
                  {formatKrStatus(krData.status)}
                </span>
                {/* Owner */}
                <span className="text-xs text-gray-500">
                  {krData.owner}
                </span>
                {/* Deadline */}
                <span className="text-xs text-gray-400">
                  {krData.deadline}
                </span>
              </div>
            )}
          </div>

          {/* Status counts on the right */}
          <div className="flex items-center gap-2 ml-auto text-xs shrink-0">
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
                overlapCount={overlapMap.get(initiative.id) ?? 0}
              />
            ))}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}
