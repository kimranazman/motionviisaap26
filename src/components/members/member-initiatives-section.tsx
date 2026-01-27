'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn, formatStatus, getStatusColor, formatDepartment, formatDateRange } from '@/lib/utils'
import { shouldHighlightRed } from '@/lib/member-utils'
import type { SerializedInitiative } from '@/components/members/member-detail'

interface MemberInitiativesSectionProps {
  initiatives: SerializedInitiative[]
  memberName: string
}

export function MemberInitiativesSection({
  initiatives,
  memberName,
}: MemberInitiativesSectionProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <CardTitle>Initiatives (Person In Charge)</CardTitle>
          <Badge variant="secondary" className="text-xs">
            {initiatives.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {initiatives.length === 0 ? (
          <p className="text-center text-gray-500 py-6">
            No initiatives assigned to {memberName}
          </p>
        ) : (
          <div className="space-y-2">
            {initiatives.map(initiative => {
              const highlight = shouldHighlightRed(
                initiative.status,
                initiative.endDate
              )
              return (
                <div
                  key={initiative.id}
                  className={cn(
                    'p-3 rounded-lg border',
                    highlight
                      ? 'border-red-200 bg-red-50/50'
                      : 'border-gray-200'
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs font-medium text-gray-600">
                          {initiative.sequenceNumber}
                        </span>
                        <span className="font-medium text-gray-900">
                          {initiative.title}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <Badge
                          variant="secondary"
                          className="text-xs"
                        >
                          {formatDepartment(initiative.department)}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {formatDateRange(initiative.startDate, initiative.endDate)}
                        </span>
                        {initiative.keyResult && (
                          <Badge
                            variant="outline"
                            className="text-blue-700 border-blue-200 text-xs"
                          >
                            {initiative.keyResult.krId}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <Badge
                      className={cn(
                        'shrink-0 text-xs',
                        getStatusColor(initiative.status)
                      )}
                    >
                      {formatStatus(initiative.status)}
                    </Badge>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
