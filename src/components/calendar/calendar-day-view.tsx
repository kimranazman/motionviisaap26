'use client'

import {
  format,
  isSameDay,
  parseISO,
  startOfDay,
} from 'date-fns'
import { cn } from '@/lib/utils'
import { CalendarDateMarker, type CalendarItem } from './calendar-date-marker'
import { ListTodo, Briefcase, Target } from 'lucide-react'

interface CalendarDayViewProps {
  currentDate: Date
  items: CalendarItem[]
  onItemClick: (item: CalendarItem) => void
}

const ENTITY_ICONS = {
  task: ListTodo,
  project: Briefcase,
  initiative: Target,
}

export function CalendarDayView({
  currentDate,
  items,
  onItemClick
}: CalendarDayViewProps) {
  const isToday = isSameDay(currentDate, new Date())

  // Filter items for the current day
  const dayItems = items.filter(item => {
    const itemDate = startOfDay(parseISO(item.date))
    return isSameDay(itemDate, startOfDay(currentDate))
  })

  // Group items by entity type
  const taskItems = dayItems.filter(item => item.entityType === 'task')
  const projectItems = dayItems.filter(item => item.entityType === 'project')
  const initiativeItems = dayItems.filter(item => item.entityType === 'initiative')

  const renderSection = (
    title: string,
    entityType: 'task' | 'project' | 'initiative',
    sectionItems: CalendarItem[]
  ) => {
    const Icon = ENTITY_ICONS[entityType]

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <Icon className="h-4 w-4" />
          <span>{title}</span>
          <span className="text-gray-400">({sectionItems.length})</span>
        </div>
        {sectionItems.length === 0 ? (
          <div className="text-sm text-gray-400 pl-6">
            No {title.toLowerCase()} for this day
          </div>
        ) : (
          <div className="space-y-1.5 pl-6">
            {sectionItems.map(item => (
              <CalendarDateMarker
                key={`${item.entityType}-${item.id}-${item.dateType}`}
                item={item}
                size="md"
                onClick={onItemClick}
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Day Header */}
      <div className={cn(
        'p-4 border-b border-gray-200 text-center',
        isToday && 'bg-blue-50'
      )}>
        <div className="text-sm text-gray-500 uppercase mb-1">
          {format(currentDate, 'EEEE')}
        </div>
        <div
          className={cn(
            'text-3xl font-bold w-14 h-14 mx-auto flex items-center justify-center rounded-full',
            isToday && 'bg-blue-600 text-white',
            !isToday && 'text-gray-700'
          )}
        >
          {format(currentDate, 'd')}
        </div>
        <div className="text-sm text-gray-500 mt-1">
          {format(currentDate, 'MMMM yyyy')}
        </div>
      </div>

      {/* Day Content */}
      <div className="p-4">
        {dayItems.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 text-sm">
              No items scheduled for this day
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Tasks Section */}
            {renderSection('Tasks', 'task', taskItems)}

            {/* Projects Section */}
            {renderSection('Projects', 'project', projectItems)}

            {/* Initiatives Section */}
            {renderSection('Initiatives', 'initiative', initiativeItems)}
          </div>
        )}
      </div>

      {/* Summary Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex justify-center gap-6 text-xs text-gray-500">
          <span>{taskItems.length} task{taskItems.length !== 1 ? 's' : ''}</span>
          <span>{projectItems.length} project{projectItems.length !== 1 ? 's' : ''}</span>
          <span>{initiativeItems.length} initiative{initiativeItems.length !== 1 ? 's' : ''}</span>
        </div>
      </div>
    </div>
  )
}
