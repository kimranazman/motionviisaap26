'use client'

import { useRef } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { getProjectStatusColor, formatProjectStatus } from '@/lib/project-utils'
import { GripVertical, Building2, Calendar, CheckCircle2 } from 'lucide-react'
import { format } from 'date-fns'

export interface ProjectForKanban {
  id: string
  title: string
  status: string
  company: { id: string; name: string } | null
  isInternal?: boolean
  internalEntity?: string | null
  startDate: string | null
  endDate: string | null
  revenue: number | null
  taskCount: number
  taskDoneCount: number
  totalCost: number
}

interface ProjectKanbanCardProps {
  project: ProjectForKanban
  isDragging?: boolean
  onClick?: () => void
}

// Format currency as MYR
function formatMYR(value: number): string {
  return new Intl.NumberFormat('en-MY', {
    style: 'currency',
    currency: 'MYR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function ProjectKanbanCard({ project, isDragging, onClick }: ProjectKanbanCardProps) {
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSorting,
  } = useSortable({ id: project.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

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

  // Get company display text
  const companyDisplay = project.company?.name
    || (project.isInternal && project.internalEntity === 'MOTIONVII' ? 'Motionvii'
    : project.isInternal && project.internalEntity === 'TALENTA' ? 'Talenta'
    : null)

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
          {project.title}
        </div>

        {/* Status Badge */}
        <div className="mb-2">
          <Badge
            variant="secondary"
            className={cn('text-xs', getProjectStatusColor(project.status))}
          >
            {formatProjectStatus(project.status)}
          </Badge>
          {project.isInternal && (
            <Badge
              variant="outline"
              className="ml-1.5 text-xs bg-amber-50 text-amber-700 border-amber-200"
            >
              Internal
            </Badge>
          )}
        </div>

        {/* Company / Entity */}
        {companyDisplay && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
            <Building2 className="h-3.5 w-3.5" />
            <span className="truncate">{companyDisplay}</span>
          </div>
        )}

        {/* Date Range */}
        {(project.startDate || project.endDate) && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
            <Calendar className="h-3.5 w-3.5" />
            <span>
              {project.startDate ? format(new Date(project.startDate), 'MMM d, yyyy') : '?'}
              {' - '}
              {project.endDate ? format(new Date(project.endDate), 'MMM d, yyyy') : '?'}
            </span>
          </div>
        )}

        {/* Task Progress */}
        {project.taskCount > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>
              {project.taskDoneCount}/{project.taskCount} tasks
            </span>
          </div>
        )}

        {/* Revenue / Cost */}
        {(project.revenue !== null && project.revenue > 0) || project.totalCost > 0 ? (
          <div className="flex items-center gap-3 text-xs">
            {project.revenue !== null && project.revenue > 0 && (
              <span className="text-green-600 font-medium">
                {formatMYR(project.revenue)}
              </span>
            )}
            {project.totalCost > 0 && (
              <span className="text-gray-400">
                Cost: {formatMYR(project.totalCost)}
              </span>
            )}
          </div>
        ) : null}
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
