'use client'

import { cn } from '@/lib/utils'
import { Circle } from 'lucide-react'

export type EntityType = 'task' | 'project' | 'initiative'
export type DateType = 'start' | 'end' | 'due'

export interface CalendarItem {
  id: string
  title: string
  entityType: EntityType
  dateType: DateType
  date: string  // ISO string
  status: string
  isCompleted: boolean
  projectId?: string  // For tasks
}

interface CalendarDateMarkerProps {
  item: CalendarItem
  size?: 'sm' | 'md'
  onClick?: (item: CalendarItem) => void
}

// Entity type colors (when not completed)
const ENTITY_COLORS: Record<EntityType, string> = {
  task: 'bg-blue-500',
  project: 'bg-orange-500',
  initiative: 'bg-purple-500',
}

// Completed/done items use grey
const COMPLETED_COLOR = 'bg-gray-400'

// Date type indicators
const DATE_TYPE_LABELS: Record<DateType, string> = {
  start: 'S',
  end: 'E',
  due: 'D',
}

export function CalendarDateMarker({
  item,
  size = 'sm',
  onClick
}: CalendarDateMarkerProps) {
  const bgColor = item.isCompleted ? COMPLETED_COLOR : ENTITY_COLORS[item.entityType]

  const handleClick = () => {
    if (onClick) {
      onClick(item)
    }
  }

  if (size === 'sm') {
    // Small dot marker (for month view)
    return (
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          'group flex items-center gap-1 px-1 py-0.5 rounded text-[10px] text-white truncate max-w-full',
          bgColor,
          'hover:opacity-80 transition-opacity cursor-pointer'
        )}
        title={`${item.title} (${item.entityType} ${item.dateType})`}
      >
        <span className="font-medium shrink-0">{DATE_TYPE_LABELS[item.dateType]}</span>
        <span className="truncate">{item.title}</span>
      </button>
    )
  }

  // Medium marker (for week/day view)
  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'group flex items-center gap-1.5 px-2 py-1 rounded text-xs text-white max-w-full',
        bgColor,
        'hover:opacity-80 transition-opacity cursor-pointer'
      )}
      title={`${item.title} (${item.entityType} ${item.dateType})`}
    >
      <Circle className="h-2 w-2 shrink-0 fill-current" />
      <span className="font-medium shrink-0 uppercase">{item.dateType}</span>
      <span className="truncate">{item.title}</span>
    </button>
  )
}

// Helper to get entity type color class
export function getEntityColor(entityType: EntityType, isCompleted: boolean): string {
  return isCompleted ? COMPLETED_COLOR : ENTITY_COLORS[entityType]
}

// Helper to format entity type for display
export function formatEntityType(entityType: EntityType): string {
  return entityType.charAt(0).toUpperCase() + entityType.slice(1)
}
