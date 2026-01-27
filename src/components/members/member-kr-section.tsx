'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import {
  getKrStatusColor,
  formatKrStatus,
  getProgressBarColor,
  isItemAtRisk,
} from '@/lib/member-utils'
import type { SerializedKeyResult } from '@/components/members/member-detail'

interface MemberKrSectionProps {
  keyResults: SerializedKeyResult[]
  memberName: string
}

export function MemberKrSection({ keyResults, memberName }: MemberKrSectionProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <CardTitle>Key Results</CardTitle>
          <Badge variant="secondary" className="text-xs">
            {keyResults.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {keyResults.length === 0 ? (
          <p className="text-center text-gray-500 py-6">
            No key results assigned to {memberName}
          </p>
        ) : (
          <div className="space-y-2">
            {keyResults.map(kr => {
              const atRisk = isItemAtRisk(kr.status)
              return (
                <div
                  key={kr.id}
                  className={cn(
                    'p-3 rounded-lg border',
                    atRisk ? 'border-red-200 bg-red-50/50' : 'border-gray-200'
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="font-mono text-xs shrink-0">
                          {kr.krId}
                        </Badge>
                        <span className="font-medium text-gray-900">
                          {kr.description}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        <Progress
                          value={kr.progress}
                          className={cn('h-1.5 w-24', getProgressBarColor(kr.progress))}
                        />
                        <span
                          className={cn(
                            'text-xs font-medium',
                            kr.progress >= 80
                              ? 'text-green-600'
                              : kr.progress >= 50
                                ? 'text-yellow-600'
                                : 'text-red-600'
                          )}
                        >
                          {Math.round(kr.progress)}%
                        </span>
                        <span className="text-xs text-gray-600">
                          {kr.actual}/{kr.target} {kr.unit}
                        </span>
                        <span className="text-xs text-gray-400">
                          {kr.deadline}
                        </span>
                      </div>
                    </div>

                    <Badge
                      className={cn(
                        'shrink-0 text-xs',
                        getKrStatusColor(kr.status)
                      )}
                    >
                      {formatKrStatus(kr.status)}
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
