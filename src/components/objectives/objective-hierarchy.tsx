'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { groupInitiativesByObjective } from '@/lib/initiative-group-utils'
import { OBJECTIVE_OPTIONS } from '@/lib/utils'
import { ObjectiveGroup } from '@/components/objectives/objective-group'
import { InitiativeDetailSheet } from '@/components/kanban/initiative-detail-sheet'
import { ViewModeToggle } from '@/components/objectives/view-mode-toggle'
import { detectOwnerOverlap } from '@/lib/initiative-date-utils'

export interface Initiative {
  id: string
  sequenceNumber: number
  title: string
  objective: string
  keyResult: string
  department: string
  status: string
  personInCharge: string | null
  startDate: string
  endDate: string
  position: number
  // KPI fields (optional for backward compat with other views)
  kpiLabel?: string | null
  kpiTarget?: number | null
  kpiActual?: number | null
  kpiUnit?: string | null
  kpiManualOverride?: boolean
  projects?: Array<{
    id: string
    title: string
    status: string
    revenue: number | null
    totalCosts: number
    companyName: string | null
    startDate: string | null
    endDate: string | null
  }>
}

interface ObjectiveHierarchyProps {
  initialData: Initiative[]
}

export function ObjectiveHierarchy({ initialData }: ObjectiveHierarchyProps) {
  const router = useRouter()

  // Expand/collapse state -- all expanded by default, persists across re-renders
  const [expandedObjectives, setExpandedObjectives] = useState<Set<string>>(
    () => new Set(OBJECTIVE_OPTIONS.map(o => o.value))
  )

  const [expandedKRs, setExpandedKRs] = useState<Set<string>>(() => {
    const grouped = groupInitiativesByObjective(initialData)
    const krKeys = new Set<string>()
    grouped.forEach(g =>
      g.keyResults.forEach(kr => krKeys.add(g.objective + ':' + kr.keyResult))
    )
    return krKeys
  })

  // Owner overlap map -- computed once for all initiatives
  const overlapMap = useMemo(() => detectOwnerOverlap(initialData), [initialData])

  // Detail sheet state
  const [selectedInitiative, setSelectedInitiative] = useState<Initiative | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  const toggleObjective = (objective: string) => {
    setExpandedObjectives(prev => {
      const next = new Set(prev)
      if (next.has(objective)) {
        next.delete(objective)
      } else {
        next.add(objective)
      }
      return next
    })
  }

  const toggleKR = (key: string) => {
    setExpandedKRs(prev => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  const handleInitiativeClick = (initiative: Initiative) => {
    setSelectedInitiative(initiative)
    setIsSheetOpen(true)
  }

  const handleInitiativeUpdate = () => {
    router.refresh()
  }

  const grouped = groupInitiativesByObjective(initialData)

  if (initialData.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-500">
        No initiatives found
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <ViewModeToggle />
      </div>
      {grouped.map(group => (
        <ObjectiveGroup
          key={group.objective}
          group={group}
          isExpanded={expandedObjectives.has(group.objective)}
          expandedKRs={expandedKRs}
          onToggleObjective={() => toggleObjective(group.objective)}
          onToggleKR={toggleKR}
          onInitiativeClick={handleInitiativeClick}
          overlapMap={overlapMap}
        />
      ))}

      {/* Initiative Detail Sheet */}
      <InitiativeDetailSheet
        initiative={selectedInitiative}
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        onUpdate={handleInitiativeUpdate}
      />
    </div>
  )
}
