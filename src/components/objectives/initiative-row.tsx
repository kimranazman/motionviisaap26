'use client'

import {
  formatStatus,
  getStatusColor,
  formatDepartment,
  formatTeamMember,
  formatDateRange,
  cn,
} from '@/lib/utils'
import { FolderOpen } from 'lucide-react'
import type { Initiative } from '@/components/objectives/objective-hierarchy'
import { KpiProgressBar } from '@/components/objectives/kpi-progress-bar'
import { calculateKpi, type InitiativeWithKpiAndProjects } from '@/lib/initiative-kpi-utils'
import { DateBadges } from '@/components/objectives/date-badges'

interface InitiativeRowProps {
  initiative: Initiative
  onClick: () => void
  overlapCount: number
}

export function InitiativeRow({ initiative, onClick, overlapCount }: InitiativeRowProps) {
  // Build KPI data from initiative (fields are optional)
  const kpiInput: InitiativeWithKpiAndProjects = {
    kpiLabel: initiative.kpiLabel ?? null,
    kpiTarget: initiative.kpiTarget ?? null,
    kpiActual: initiative.kpiActual ?? null,
    kpiUnit: initiative.kpiUnit ?? null,
    kpiManualOverride: initiative.kpiManualOverride ?? false,
    projects: initiative.projects?.map(p => ({ id: p.id, revenue: p.revenue })),
  }
  const kpi = calculateKpi(kpiInput)

  return (
    <div
      onClick={onClick}
      className="flex items-start gap-3 p-2 md:p-3 rounded-lg cursor-pointer hover:bg-blue-50/50 transition"
    >
      {/* Sequence number badge */}
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs font-medium text-gray-600">
        {initiative.sequenceNumber}
      </span>

      {/* Center content */}
      <div className="flex-1 min-w-0">
        {/* Title - CRITICAL: NO truncation, full text wrapping */}
        <p className="font-medium text-gray-900">
          {initiative.title}
        </p>

        {/* Date intelligence badges */}
        <DateBadges
          startDate={initiative.startDate}
          endDate={initiative.endDate}
          status={initiative.status}
          overlapCount={overlapCount}
        />

        {/* KPI Progress Bar */}
        <KpiProgressBar
          label={kpi.label}
          percentage={kpi.percentage}
          displayText={kpi.displayText}
          source={kpi.source}
        />

        {/* Metadata row */}
        <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-gray-500">
          <span className="inline-flex items-center rounded bg-gray-100 px-1.5 py-0.5 text-gray-600">
            {formatDepartment(initiative.department)}
          </span>
          <span>{formatTeamMember(initiative.personInCharge)}</span>
          <span>{formatDateRange(initiative.startDate, initiative.endDate)}</span>
          {initiative.projects && initiative.projects.length > 0 && (
            <span className="inline-flex items-center gap-1 text-blue-600">
              <FolderOpen className="h-3 w-3" />
              {initiative.projects.length} project{initiative.projects.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Status badge */}
      <span
        className={cn(
          'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium shrink-0',
          getStatusColor(initiative.status)
        )}
      >
        {formatStatus(initiative.status)}
      </span>
    </div>
  )
}
