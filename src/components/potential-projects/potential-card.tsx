'use client'

import { useRef } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn, formatCurrency } from '@/lib/utils'
import { Building2, User, MoreHorizontal, Eye, GripVertical, ArrowRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface PotentialProject {
  id: string
  title: string
  estimatedValue: number | null
  stage?: string
  isArchived?: boolean
  company: { id: string; name: string } | null
  contact: { id: string; name: string } | null
  project?: {
    id: string
    title: string
    revenue: number | null
    potentialRevenue: number | null
  } | null
}

interface PotentialCardProps {
  project: PotentialProject
  onClick?: () => void
  isDragging?: boolean
  canEdit?: boolean
}

export function PotentialCard({ project, onClick, isDragging, canEdit = true }: PotentialCardProps) {
  const mouseDownPos = useRef<{ x: number; y: number } | null>(null)
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null)
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSorting,
  } = useSortable({
    id: project.id,
    disabled: !canEdit,
  })

  const dragListeners = canEdit ? listeners : {}

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const openCard = () => {
    if (onClick) onClick()
  }

  // Track mouse position to distinguish click from drag
  const handleMouseDown = (e: React.MouseEvent) => {
    mouseDownPos.current = { x: e.clientX, y: e.clientY }
  }

  const handleClick = (e: React.MouseEvent) => {
    if (!onClick) return

    // Don't open if interacting with controls
    if ((e.target as HTMLElement).closest('button, [role="menu"]')) {
      return
    }

    // Check if mouse moved significantly (was a drag, not a click)
    if (mouseDownPos.current) {
      const dx = Math.abs(e.clientX - mouseDownPos.current.x)
      const dy = Math.abs(e.clientY - mouseDownPos.current.y)
      if (dx > 5 || dy > 5) {
        mouseDownPos.current = null
        return
      }
    }
    mouseDownPos.current = null
    onClick()
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

  // Detect tap on touch end
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current || !onClick) return

    if ((e.target as HTMLElement).closest('button, [role="menu"]')) {
      touchStartRef.current = null
      return
    }

    const touch = e.changedTouches[0]
    const dx = Math.abs(touch.clientX - touchStartRef.current.x)
    const dy = Math.abs(touch.clientY - touchStartRef.current.y)
    const duration = Date.now() - touchStartRef.current.time

    if (duration < 200 && dx < 10 && dy < 10) {
      e.preventDefault()
      openCard()
    }

    touchStartRef.current = null
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
      {/* Card Content - Tappable area */}
      <div
        className={cn(
          "p-4 cursor-pointer",
          canEdit && "pl-10 md:pl-4"
        )}
        onMouseDown={handleMouseDown}
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Header with title and quick actions */}
        <div className="flex items-start justify-between gap-2 mb-3">
          {/* Title - Primary focus */}
          <div className="text-sm font-medium text-gray-900 line-clamp-2 flex-1 min-h-[44px] flex items-start">
            {project.title}
          </div>

          {/* Quick Actions - visible on mobile, hover on desktop */}
          {canEdit && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className={cn(
                    "h-8 w-8 -mr-2 -mt-1 shrink-0",
                    "md:opacity-0 md:group-hover:opacity-100",
                    "focus:opacity-100",
                    "transition-opacity"
                  )}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation()
                  }}
                >
                  <MoreHorizontal className="h-4 w-4 text-gray-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    onClick?.()
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Value */}
        {project.estimatedValue !== null && (
          <div className="text-sm font-semibold text-green-600 mb-3">
            {formatCurrency(project.estimatedValue)}
          </div>
        )}

        {/* Conversion Badge */}
        {project.project && project.stage === 'CONFIRMED' && (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-200 text-xs mb-3"
          >
            <ArrowRight className="h-3 w-3 mr-1" />
            {project.project.title}
          </Badge>
        )}

        {/* Footer - Company & Contact */}
        <div className="flex flex-col gap-1.5 text-xs text-gray-500">
          {project.company && (
            <div className="flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5" />
              <span className="truncate">{project.company.name}</span>
            </div>
          )}
          {project.contact && (
            <div className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" />
              <span className="truncate">{project.contact.name}</span>
            </div>
          )}
        </div>
      </div>

      {/* Drag Handle - visible on mobile, hover on desktop */}
      {canEdit && (
        <div
          {...dragListeners}
          className={cn(
            "absolute left-0 top-0 bottom-0 w-8 flex items-center justify-center",
            "cursor-grab active:cursor-grabbing touch-none",
            "rounded-l-2xl",
            "bg-gray-50/80 hover:bg-gray-100/80",
            "md:opacity-0 md:group-hover:opacity-100",
            "transition-opacity"
          )}
        >
          <GripVertical className="h-4 w-4 text-gray-400" />
        </div>
      )}
    </div>
  )
}
