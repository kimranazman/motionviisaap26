'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu'
import { cn, STATUS_OPTIONS, TEAM_MEMBER_OPTIONS, getStatusColor } from '@/lib/utils'
import { MoreHorizontal, Eye, RefreshCw, UserPlus } from 'lucide-react'

interface Initiative {
  id: string
  sequenceNumber: number
  title: string
  keyResult: string
  department: string
  status: string
  personInCharge: string | null
  startDate: string
  endDate: string
  position: number
}

interface KanbanCardProps {
  item: Initiative
  isDragging?: boolean
  onClick?: () => void
  onStatusChange?: (id: string, status: string) => Promise<void>
  onReassign?: (id: string, personInCharge: string | null) => Promise<void>
  canEdit?: boolean
}

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

// Department bottom border colors (Apple subtle accent)
const DEPARTMENT_BORDER_BOTTOM: Record<string, string> = {
  BIZ_DEV: 'border-b-purple-400',
  OPERATIONS: 'border-b-blue-400',
  FINANCE: 'border-b-green-400',
  MARKETING: 'border-b-orange-400',
}

export function KanbanCard({ item, isDragging, onClick, onStatusChange, onReassign, canEdit = true }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSorting,
  } = useSortable({
    id: item.id,
    disabled: !canEdit
  })

  // Only attach drag listeners when user can edit
  const dragListeners = canEdit ? listeners : {}

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const endDate = new Date(item.endDate)
  const isOverdue = endDate < new Date() && item.status !== 'COMPLETED'

  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onClick) {
      onClick()
    } else {
      window.location.href = `/initiatives/${item.id}`
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...dragListeners}
      className={cn(
        'group relative bg-white rounded-2xl border-0 shadow-apple',
        'hover:shadow-apple-hover hover:scale-[1.02]',
        'transition-all duration-200 ease-out',
        canEdit && 'cursor-grab active:cursor-grabbing touch-none',
        !canEdit && 'cursor-default',
        'border-b-2',
        DEPARTMENT_BORDER_BOTTOM[item.department] || 'border-b-gray-300',
        (isDragging || isSorting) && 'opacity-60 shadow-xl scale-105 rotate-1'
      )}
    >
      {/* Card Content */}
      <div className="p-4">
        {/* Header with title and quick actions */}
        <div className="flex items-start justify-between gap-2 mb-3">
          {/* Title - Primary focus */}
          <div
            className="text-sm font-medium text-gray-900 hover:text-blue-600 line-clamp-2 cursor-pointer flex-1 min-h-[44px] flex items-start"
            onClick={handleViewDetails}
            onPointerDown={(e) => e.stopPropagation()}
          >
            {item.title}
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
                    // Mobile: always visible
                    // Desktop: visible on hover
                    "md:opacity-0 md:group-hover:opacity-100",
                    "focus:opacity-100",
                    "transition-opacity"
                  )}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-4 w-4 text-gray-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem
                  onClick={handleViewDetails}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger onPointerDown={(e) => e.stopPropagation()}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Change Status
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuRadioGroup
                      value={item.status}
                      onValueChange={(value) => onStatusChange?.(item.id, value)}
                    >
                      {STATUS_OPTIONS.map((option) => (
                        <DropdownMenuRadioItem
                          key={option.value}
                          value={option.value}
                          onPointerDown={(e) => e.stopPropagation()}
                        >
                          <Badge className={cn('ml-2', getStatusColor(option.value))}>
                            {option.label}
                          </Badge>
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger onPointerDown={(e) => e.stopPropagation()}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Reassign
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuRadioGroup
                      value={item.personInCharge || ''}
                      onValueChange={(value) => onReassign?.(item.id, value || null)}
                    >
                      <DropdownMenuRadioItem
                        value=""
                        onPointerDown={(e) => e.stopPropagation()}
                      >
                        Unassigned
                      </DropdownMenuRadioItem>
                      {TEAM_MEMBER_OPTIONS.map((option) => (
                        <DropdownMenuRadioItem
                          key={option.value}
                          value={option.value}
                          onPointerDown={(e) => e.stopPropagation()}
                        >
                          {option.label}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Footer - Secondary info */}
        <div className="flex items-center justify-between">
          {/* Left: KR Badge + Date */}
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Badge
              variant="secondary"
              className="text-[10px] px-1.5 py-0 h-5 bg-gray-100 text-gray-600 font-medium"
            >
              {item.keyResult}
            </Badge>
            <span className="text-gray-300">·</span>
            <span className={cn(isOverdue && 'text-red-500 font-medium')}>
              {endDate.toLocaleDateString('en-MY', {
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>

          {/* Right: Avatar */}
          {item.personInCharge && (
            <Avatar className="h-6 w-6">
              <AvatarFallback
                className={cn(
                  'text-[10px] text-white font-medium',
                  TEAM_COLORS[item.personInCharge] || 'bg-gray-400'
                )}
              >
                {TEAM_INITIALS[item.personInCharge] || '??'}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      </div>
    </div>
  )
}
