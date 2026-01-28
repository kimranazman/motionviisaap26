'use client'

import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  startOfWeek,
  endOfWeek,
  parseISO,
  startOfDay,
} from 'date-fns'
import { cn } from '@/lib/utils'
import { CalendarDateMarker, type CalendarItem } from './calendar-date-marker'

interface CalendarMonthViewProps {
  currentDate: Date
  items: CalendarItem[]
  onItemClick: (item: CalendarItem) => void
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function CalendarMonthView({
  currentDate,
  items,
  onItemClick
}: CalendarMonthViewProps) {
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart)
  const calendarEnd = endOfWeek(monthEnd)
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

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
      {/* Day Headers */}
      <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
        {DAY_NAMES.map(day => (
          <div
            key={day}
            className="py-2 text-center text-sm font-medium text-gray-500 border-r border-gray-200 last:border-r-0"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7">
        {days.map((day, index) => {
          const dayItems = getItemsForDay(day)
          const isCurrentMonth = isSameMonth(day, currentDate)
          const isToday = isSameDay(day, new Date())
          const maxVisible = 3

          return (
            <div
              key={day.toISOString()}
              className={cn(
                'min-h-[100px] md:min-h-[120px] border-b border-r border-gray-200 p-1',
                (index + 1) % 7 === 0 && 'border-r-0',
                !isCurrentMonth && 'bg-gray-50'
              )}
            >
              {/* Day Number */}
              <div className="flex justify-end mb-1">
                <span
                  className={cn(
                    'text-sm w-6 h-6 flex items-center justify-center rounded-full',
                    isToday && 'bg-blue-600 text-white font-medium',
                    !isToday && !isCurrentMonth && 'text-gray-400',
                    !isToday && isCurrentMonth && 'text-gray-700'
                  )}
                >
                  {format(day, 'd')}
                </span>
              </div>

              {/* Date Markers */}
              <div className="space-y-0.5 overflow-hidden">
                {dayItems.slice(0, maxVisible).map(item => (
                  <CalendarDateMarker
                    key={`${item.entityType}-${item.id}-${item.dateType}`}
                    item={item}
                    size="sm"
                    onClick={onItemClick}
                  />
                ))}

                {dayItems.length > maxVisible && (
                  <span className="text-[10px] text-gray-500 px-1">
                    +{dayItems.length - maxVisible} more
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
