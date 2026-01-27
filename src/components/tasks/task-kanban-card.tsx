'use client'

import { useRef } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { getTaskPriorityColor, formatTaskPriority } from '@/lib/task-utils'
import { GripVertical } from 'lucide-react'
import { format } from 'date-fns'
import type { CrossProjectTask } from './tasks-page-client'

const TEAM_INITIALS: Record<string, string> = {
  KHAIRUL: 'KH',
  AZLAN: 'AZ',
  IZYANI: 'IZ',
}

const TEAM_COLORS: Record<string, string> = {
  KHAIRUL: 'bg-blue-600',
  AZLAN: 'bg-green-600',
  IZYANI: 'bg-purple-600',
}

interface TaskKanbanCardProps {
  task: CrossProjectTask
  isDragging?: boolean
  onClick?: () => void
}

export function TaskKanbanCard({ task, isDragging, onClick }: TaskKanbanCardProps) {
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSorting,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE'

  const openCard = () => {
    if (onClick) {
      onClick()
    }
  }

  // Track touch start for tap detection
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    }
  }

  // Detect tap on touch end (quick touch with minimal movement)
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return

    // Don't open if interacting with controls
    if ((e.target as HTMLElement).closest('button, [role="menu"]')) {
      touchStartRef.current = null
      return
    }

    const touch = e.changedTouches[0]
    const dx = Math.abs(touch.clientX - touchStartRef.current.x)
    const dy = Math.abs(touch.clientY - touchStartRef.current.y)
    const duration = Date.now() - touchStartRef.current.time

    // If quick tap (< 200ms) with minimal movement (< 10px), treat as tap
    if (duration < 200 && dx < 10 && dy < 10) {
      e.preventDefault()
      openCard()
    }

    touchStartRef.current = null
  }

  const handleClick = (e: React.MouseEvent) => {
    // Don't open if interacting with controls
    if ((e.target as HTMLElement).closest('button, [role="menu"]')) {
      return
    }
    openCard()
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={cn(
        'group relative bg-white rounded-2xl border-0 shadow-apple',
        'hover:shadow-apple-hover hover:scale-[1.02]',
        'transition-all duration-200 ease-out select-none',
        (isDragging || isSorting) && 'opacity-60 shadow-xl scale-105 rotate-1'
      )}
    >
      {/* Card Content */}
      <div
        className="p-4 pl-10 md:pl-4 cursor-pointer"
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Title */}
        <div className="text-sm font-medium text-gray-900 line-clamp-2 mb-2">
          {task.title}
        </div>

        {/* Project badge + Due date */}
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
          <Badge
            variant="secondary"
            className="text-[10px] px-1.5 py-0 h-5 bg-blue-50 text-blue-700"
          >
            {task.project.title}
          </Badge>
          {task.dueDate && (
            <>
              <span className="text-gray-300">·</span>
              <span className={cn(isOverdue && 'text-red-500 font-medium')}>
                {format(new Date(task.dueDate), 'MMM d')}
              </span>
            </>
          )}
        </div>

        {/* Priority + Assignee */}
        <div className="flex items-center justify-between">
          <Badge
            variant="outline"
            className={cn('text-xs', getTaskPriorityColor(task.priority))}
          >
            {formatTaskPriority(task.priority)}
          </Badge>
          {task.assignee && (
            <Avatar className="h-6 w-6">
              <AvatarFallback
                className={cn(
                  'text-[10px] text-white font-medium',
                  TEAM_COLORS[task.assignee] || 'bg-gray-400'
                )}
              >
                {TEAM_INITIALS[task.assignee] || '??'}
              </AvatarFallback>
            </Avatar>
          )}
        </div>

        {/* Subtask/comment counts if present */}
        {(task._count.children > 0 || task._count.comments > 0) && (
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
            {task._count.children > 0 && <span>subtasks: {task._count.children}</span>}
            {task._count.comments > 0 && <span>comments: {task._count.comments}</span>}
          </div>
        )}
      </div>

      {/* Drag Handle - visible on mobile, hover on desktop */}
      <div
        {...listeners}
        className={cn(
          'absolute left-0 top-0 bottom-0 w-8 flex items-center justify-center',
          'cursor-grab active:cursor-grabbing touch-none',
          'rounded-l-2xl',
          'bg-gray-50/80 hover:bg-gray-100/80',
          // Mobile: always visible. Desktop: visible on hover
          'md:opacity-0 md:group-hover:opacity-100',
          'transition-opacity'
        )}
      >
        <GripVertical className="h-4 w-4 text-gray-400" />
      </div>
    </div>
  )
}
