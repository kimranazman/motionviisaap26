'use client'

import { useDroppable } from '@dnd-kit/core'
import { cn } from '@/lib/utils'

interface ProjectKanbanColumnProps {
  id: string
  title: string
  colorDot: string
  count: number
  children: React.ReactNode
}

export function ProjectKanbanColumn({
  id,
  title,
  colorDot,
  count,
  children,
}: ProjectKanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        // Mobile: 75% viewport width to show adjacent column edges
        'w-[75vw] min-w-[280px] max-w-[320px]',
        // Desktop: fixed width
        'md:w-80 md:min-w-0 md:max-w-none',
        // Shared styles
        'shrink-0 rounded-2xl',
        'bg-gray-50/50 backdrop-blur-sm',
        // Snap alignment for scroll container
        'snap-start',
        isOver && 'ring-2 ring-blue-400/50'
      )}
    >
      {/* Header */}
      <div className="p-4 flex items-center gap-2">
        {/* Color Dot */}
        <div className={cn('w-2 h-2 rounded-full', colorDot)} />

        {/* Title */}
        <h3 className="font-semibold text-gray-900">{title}</h3>

        {/* Count Badge */}
        <span className="ml-auto text-sm text-gray-500 bg-white/60 px-2.5 py-1 rounded-full">
          {count}
        </span>
      </div>

      {/* Cards Container */}
      <div className="p-3 pt-0 space-y-3 min-h-[200px]">
        {children}
      </div>
    </div>
  )
}
