'use client'

import {
  format,
  eachDayOfInterval,
  isSameDay,
  startOfWeek,
  endOfWeek,
  parseISO,
  startOfDay,
} from 'date-fns'
import { cn } from '@/lib/utils'
import { CalendarDateMarker, type CalendarItem } from './calendar-date-marker'

interface CalendarWeekViewProps {
  currentDate: Date
  items: CalendarItem[]
  onItemClick: (item: CalendarItem) => void
}

export function CalendarWeekView({
  currentDate,
  items,
  onItemClick
}: CalendarWeekViewProps) {
  const weekStart = startOfWeek(currentDate)
  const weekEnd = endOfWeek(currentDate)
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd })

  // Group items by date
  const getItemsForDay = (date: Date): CalendarItem[] => {
    const dayStart = startOfDay(date)
    return items.filter(item => {
      const itemDate = startOfDay(parseISO(item.date))
      return isSameDay(itemDate, dayStart)
    })
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Week Grid */}
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const dayItems = getItemsForDay(day)
          const isToday = isSameDay(day, new Date())

          return (
            <div
              key={day.toISOString()}
              className={cn(
                'min-h-[350px] md:min-h-[400px] border-r border-gray-200 last:border-r-0',
                isToday && 'bg-blue-50/50'
              )}
            >
              {/* Day Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 p-2 text-center">
                <div className="text-xs text-gray-500 uppercase">
                  {format(day, 'EEE')}
                </div>
                <div
                  className={cn(
                    'text-lg font-semibold w-9 h-9 mx-auto flex items-center justify-center rounded-full mt-1',
                    isToday && 'bg-blue-600 text-white',
                    !isToday && 'text-gray-700'
                  )}
                >
                  {format(day, 'd')}
                </div>
              </div>

              {/* Day Content */}
              <div className="p-2 space-y-1.5 overflow-y-auto max-h-[300px] md:max-h-[340px]">
                {dayItems.length === 0 ? (
                  <div className="text-xs text-gray-400 text-center py-4">
                    No items
                  </div>
                ) : (
                  dayItems.map(item => (
                    <CalendarDateMarker
                      key={`${item.entityType}-${item.id}-${item.dateType}`}
                      item={item}
                      size="md"
                      onClick={onItemClick}
                    />
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
