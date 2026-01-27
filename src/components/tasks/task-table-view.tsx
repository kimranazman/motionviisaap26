'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ChevronUp, ChevronDown, MessageSquare, ListTree } from 'lucide-react'
import {
  getTaskStatusColor,
  getTaskPriorityColor,
  formatTaskStatus,
  formatTaskPriority,
} from '@/lib/task-utils'
import { formatTeamMember, formatDate, cn } from '@/lib/utils'
import type { CrossProjectTask } from './tasks-page-client'

type SortField = 'title' | 'project' | 'status' | 'priority' | 'assignee' | 'dueDate'
type SortDirection = 'asc' | 'desc'

const STATUS_ORDER: Record<string, number> = { TODO: 0, IN_PROGRESS: 1, DONE: 2 }
const PRIORITY_ORDER: Record<string, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 }

interface TaskTableViewProps {
  tasks: CrossProjectTask[]
  onTaskClick: (task: CrossProjectTask) => void
}

export function TaskTableView({ tasks, onTaskClick }: TaskTableViewProps) {
  const [sortField, setSortField] = useState<SortField>('dueDate')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      const dir = sortDirection === 'asc' ? 1 : -1

      switch (sortField) {
        case 'title':
          return dir * a.title.localeCompare(b.title)

        case 'project':
          return dir * a.project.title.localeCompare(b.project.title)

        case 'status':
          return dir * ((STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99))

        case 'priority':
          return dir * ((PRIORITY_ORDER[a.priority] ?? 99) - (PRIORITY_ORDER[b.priority] ?? 99))

        case 'assignee': {
          const aVal = a.assignee || ''
          const bVal = b.assignee || ''
          // Nulls sort last for asc, first for desc
          if (!a.assignee && !b.assignee) return 0
          if (!a.assignee) return dir
          if (!b.assignee) return -dir
          return dir * aVal.localeCompare(bVal)
        }

        case 'dueDate': {
          // Nulls sort last for asc, first for desc
          if (!a.dueDate && !b.dueDate) return 0
          if (!a.dueDate) return dir
          if (!b.dueDate) return -dir
          return dir * (new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
        }

        default:
          return 0
      }
    })
  }, [tasks, sortField, sortDirection])

  function SortableHeader({ label, field }: { label: string; field: SortField }) {
    const isActive = sortField === field
    return (
      <TableHead
        className="cursor-pointer select-none hover:bg-gray-50 transition-colors"
        onClick={() => toggleSort(field)}
      >
        <div className="flex items-center gap-1">
          {label}
          {isActive &&
            (sortDirection === 'asc' ? (
              <ChevronUp className="h-3.5 w-3.5 text-gray-600" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-gray-600" />
            ))}
        </div>
      </TableHead>
    )
  }

  // Check if a due date is overdue
  function isOverdue(dueDate: string | null, status: string): boolean {
    if (!dueDate || status === 'DONE') return false
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return new Date(dueDate) < today
  }

  return (
    <Card className="border border-gray-200">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHeader label="Title" field="title" />
              <SortableHeader label="Project" field="project" />
              <SortableHeader label="Status" field="status" />
              <SortableHeader label="Priority" field="priority" />
              <SortableHeader label="Assignee" field="assignee" />
              <SortableHeader label="Due Date" field="dueDate" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedTasks.map((task) => (
              <TableRow
                key={task.id}
                className="group cursor-pointer hover:bg-gray-50"
                onClick={() => onTaskClick(task)}
              >
                {/* Title */}
                <TableCell>
                  <div>
                    <p className="font-medium text-gray-900">{task.title}</p>
                    {/* Mobile-only: inline badges */}
                    <div className="flex items-center gap-2 mt-1 md:hidden">
                      <Badge
                        variant="secondary"
                        className="text-xs bg-blue-50 text-blue-700"
                      >
                        {task.project.title}
                      </Badge>
                      <Badge
                        variant="secondary"
                        className={cn('text-xs', getTaskStatusColor(task.status))}
                      >
                        {formatTaskStatus(task.status)}
                      </Badge>
                    </div>
                    {/* Subtask and comment counts */}
                    <div className="flex items-center gap-3 mt-1">
                      {task._count.children > 0 && (
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <ListTree className="h-3 w-3" />
                          {task._count.children}
                        </span>
                      )}
                      {task._count.comments > 0 && (
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {task._count.comments}
                        </span>
                      )}
                    </div>
                  </div>
                </TableCell>

                {/* Project */}
                <TableCell className="hidden md:table-cell">
                  <Badge
                    variant="secondary"
                    className="text-xs bg-blue-50 text-blue-700"
                  >
                    {task.project.title}
                  </Badge>
                </TableCell>

                {/* Status */}
                <TableCell className="hidden md:table-cell">
                  <Badge
                    variant="secondary"
                    className={getTaskStatusColor(task.status)}
                  >
                    {formatTaskStatus(task.status)}
                  </Badge>
                </TableCell>

                {/* Priority */}
                <TableCell className="hidden md:table-cell">
                  <Badge
                    variant="outline"
                    className={getTaskPriorityColor(task.priority)}
                  >
                    {formatTaskPriority(task.priority)}
                  </Badge>
                </TableCell>

                {/* Assignee */}
                <TableCell className="hidden md:table-cell">
                  <span className="text-sm text-gray-600">
                    {formatTeamMember(task.assignee)}
                  </span>
                </TableCell>

                {/* Due Date */}
                <TableCell className="hidden md:table-cell">
                  <span
                    className={cn(
                      'text-sm',
                      isOverdue(task.dueDate, task.status)
                        ? 'text-red-500 font-medium'
                        : 'text-gray-500'
                    )}
                  >
                    {formatDate(task.dueDate)}
                  </span>
                </TableCell>
              </TableRow>
            ))}

            {sortedTasks.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <p className="text-gray-500">No tasks found</p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
