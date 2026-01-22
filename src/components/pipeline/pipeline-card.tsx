'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn, formatCurrency } from '@/lib/utils'
import { Building2, User } from 'lucide-react'

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

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...dragListeners}
      onClick={onClick}
      className={cn(
        'group relative bg-white rounded-2xl border-0 shadow-apple',
        'hover:shadow-apple-hover hover:scale-[1.02]',
        'transition-all duration-200 ease-out',
        canEdit && 'cursor-grab active:cursor-grabbing touch-none',
        !canEdit && 'cursor-default',
        onClick && 'cursor-pointer',
        (isDragging || isSorting) && 'opacity-60 shadow-xl scale-105 rotate-1'
      )}
    >
      {/* Card Content */}
      <div className="p-4">
        {/* Title - Primary focus */}
        <div className="text-sm font-medium text-gray-900 line-clamp-2 mb-3">
          {deal.title}
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
