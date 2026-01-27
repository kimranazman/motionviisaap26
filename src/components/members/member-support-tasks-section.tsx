'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Clock } from 'lucide-react'
import type { SerializedSupportTask } from '@/components/members/member-detail'

interface MemberSupportTasksSectionProps {
  supportTasks: SerializedSupportTask[]
  memberName: string
}

const CATEGORY_LABELS: Record<string, string> = {
  DESIGN_CREATIVE: 'Design & Creative',
  BUSINESS_ADMIN: 'Business & Admin',
  TALENTA_IDEAS: 'Talenta Ideas',
  OPERATIONS: 'Operations',
}

const CATEGORY_COLORS: Record<string, string> = {
  DESIGN_CREATIVE: 'bg-purple-100 text-purple-800 border-purple-200',
  BUSINESS_ADMIN: 'bg-blue-100 text-blue-800 border-blue-200',
  TALENTA_IDEAS: 'bg-amber-100 text-amber-800 border-amber-200',
  OPERATIONS: 'bg-green-100 text-green-800 border-green-200',
}

const CATEGORY_BORDER_COLORS: Record<string, string> = {
  DESIGN_CREATIVE: 'border-l-purple-500',
  BUSINESS_ADMIN: 'border-l-blue-500',
  TALENTA_IDEAS: 'border-l-amber-500',
  OPERATIONS: 'border-l-green-500',
}

const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-700',
  MEDIUM: 'bg-yellow-100 text-yellow-700',
  HIGH: 'bg-red-100 text-red-700',
}

const PRIORITY_LABELS: Record<string, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
}

export function MemberSupportTasksSection({
  supportTasks,
  memberName,
}: MemberSupportTasksSectionProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <CardTitle>Support Tasks</CardTitle>
          <Badge variant="secondary" className="text-xs">
            {supportTasks.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {supportTasks.length === 0 ? (
          <p className="text-center text-gray-500 py-6">
            No support tasks assigned to {memberName}
          </p>
        ) : (
          <div className="space-y-2">
            {supportTasks.map(st => {
              const isHighPriority = st.priority === 'HIGH'
              return (
                <div
                  key={st.id}
                  className={cn(
                    'p-3 rounded-lg border border-l-4',
                    CATEGORY_BORDER_COLORS[st.category] || 'border-l-gray-500',
                    isHighPriority
                      ? 'border-red-200 bg-red-50/50'
                      : 'border-gray-200'
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs text-gray-400">
                          {st.taskId}
                        </span>
                        <span className="font-medium text-gray-900">
                          {st.task}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <Badge
                          className={cn(
                            'text-xs',
                            CATEGORY_COLORS[st.category]
                          )}
                        >
                          {CATEGORY_LABELS[st.category] || st.category}
                        </Badge>
                        <Badge
                          className={cn(
                            'text-xs',
                            PRIORITY_COLORS[st.priority]
                          )}
                        >
                          {PRIORITY_LABELS[st.priority] || st.priority}
                        </Badge>
                        {st.frequency && (
                          <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                            <Clock className="h-3 w-3" />
                            {st.frequency}
                          </span>
                        )}
                      </div>

                      {st.keyResultLinks.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-gray-100">
                          {st.keyResultLinks.map(link => (
                            <Link key={link.id} href="/objectives">
                              <Badge
                                variant="outline"
                                className="cursor-pointer hover:bg-blue-50 text-blue-700 border-blue-200 text-xs"
                                title={link.keyResult.description}
                              >
                                {link.keyResult.krId}
                              </Badge>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
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
