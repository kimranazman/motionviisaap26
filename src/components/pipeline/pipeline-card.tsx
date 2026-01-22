'use client'

import { useRef } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn, formatCurrency } from '@/lib/utils'
import { Building2, User, MoreHorizontal, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Deal {
  id: string
  title: string
  value: number | null
  company: { id: string; name: string } | null
  contact: { id: string; name: string } | null
}

interface PipelineCardProps {
  deal: Deal
  onClick?: () => void
  isDragging?: boolean
  canEdit?: boolean
}

export function PipelineCard({ deal, onClick, isDragging, canEdit = true }: PipelineCardProps) {
  const mouseDownPos = useRef<{ x: number; y: number } | null>(null)
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSorting,
  } = useSortable({
    id: deal.id,
    disabled: !canEdit,
  })

  const dragListeners = canEdit ? listeners : {}

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  // Track mouse position to distinguish click from drag
  const handleMouseDown = (e: React.MouseEvent) => {
    mouseDownPos.current = { x: e.clientX, y: e.clientY }
  }

  const handleClick = (e: React.MouseEvent) => {
    if (!onClick) return

    // Check if mouse moved significantly (was a drag, not a click)
    if (mouseDownPos.current) {
      const dx = Math.abs(e.clientX - mouseDownPos.current.x)
      const dy = Math.abs(e.clientY - mouseDownPos.current.y)
      if (dx > 5 || dy > 5) {
        // It was a drag, not a click
        mouseDownPos.current = null
        return
      }
    }
    mouseDownPos.current = null
    onClick()
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...dragListeners}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      className={cn(
        'group relative bg-white rounded-2xl border-0 shadow-apple',
        'hover:shadow-apple-hover hover:scale-[1.02]',
        'transition-all duration-200 ease-out',
        canEdit && 'cursor-grab active:cursor-grabbing',
        !canEdit && 'cursor-pointer',
        (isDragging || isSorting) && 'opacity-60 shadow-xl scale-105 rotate-1'
      )}
    >
      {/* Card Content */}
      <div className="p-4">
        {/* Header with title and quick actions */}
        <div className="flex items-start justify-between gap-2 mb-3">
          {/* Title - Primary focus */}
          <div className="text-sm font-medium text-gray-900 line-clamp-2 flex-1 min-h-[44px] flex items-start">
            {deal.title}
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
        {deal.value !== null && (
          <div className="text-sm font-semibold text-green-600 mb-3">
            {formatCurrency(deal.value)}
          </div>
        )}

        {/* Footer - Company & Contact */}
        <div className="flex flex-col gap-1.5 text-xs text-gray-500">
          {deal.company && (
            <div className="flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5" />
              <span className="truncate">{deal.company.name}</span>
            </div>
          )}
          {deal.contact && (
            <div className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" />
              <span className="truncate">{deal.contact.name}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
