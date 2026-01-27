'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn, formatDate } from '@/lib/utils'
import { formatTaskStatus, getTaskStatusColor, formatTaskPriority, getTaskPriorityColor } from '@/lib/task-utils'
import type { TaskStatus, TaskPriority } from '@prisma/client'
import { shouldHighlightRed } from '@/lib/member-utils'
import type { SerializedTask } from '@/components/members/member-detail'

interface MemberTasksSectionProps {
  tasks: SerializedTask[]
  memberName: string
}

export function MemberTasksSection({ tasks, memberName }: MemberTasksSectionProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <CardTitle>Tasks</CardTitle>
          <Badge variant="secondary" className="text-xs">
            {tasks.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <p className="text-center text-gray-500 py-6">
            No tasks assigned to {memberName}
          </p>
        ) : (
          <div className="space-y-2">
            {tasks.map(task => {
              const highlight = shouldHighlightRed(task.status, task.dueDate)
              return (
                <div
                  key={task.id}
                  className={cn(
                    'p-3 rounded-lg border',
                    highlight
                      ? 'border-red-200 bg-red-50/50'
                      : 'border-gray-200'
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-gray-900">
                        {task.title}
                      </span>

                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <Badge
                          variant="secondary"
                          className="bg-blue-50 text-blue-700 text-xs"
                        >
                          {task.project.title}
                        </Badge>
                        <Badge
                          className={cn(
                            'text-xs',
                            getTaskPriorityColor(task.priority as TaskPriority)
                          )}
                        >
                          {formatTaskPriority(task.priority as TaskPriority)}
                        </Badge>
                        {task.dueDate && (
                          <span className="text-xs text-gray-500">
                            Due {formatDate(task.dueDate)}
                          </span>
                        )}
                      </div>
                    </div>

                    <Badge
                      className={cn(
                        'shrink-0 text-xs',
                        getTaskStatusColor(task.status as TaskStatus)
                      )}
                    >
                      {formatTaskStatus(task.status as TaskStatus)}
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
