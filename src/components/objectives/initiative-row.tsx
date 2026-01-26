'use client'

import {
  formatStatus,
  getStatusColor,
  formatDepartment,
  formatTeamMember,
  formatDateRange,
  cn,
} from '@/lib/utils'
import type { Initiative } from '@/components/objectives/objective-hierarchy'

interface InitiativeRowProps {
  initiative: Initiative
  onClick: () => void
}

export function InitiativeRow({ initiative, onClick }: InitiativeRowProps) {
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

        {/* Metadata row */}
        <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-gray-500">
          <span className="inline-flex items-center rounded bg-gray-100 px-1.5 py-0.5 text-gray-600">
            {formatDepartment(initiative.department)}
          </span>
          <span>{formatTeamMember(initiative.personInCharge)}</span>
          <span>{formatDateRange(initiative.startDate, initiative.endDate)}</span>
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
