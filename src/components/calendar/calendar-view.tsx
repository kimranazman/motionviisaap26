'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  startOfWeek,
  endOfWeek,
  parseISO,
  startOfDay,
} from 'date-fns'
import { ChevronLeft, ChevronRight, Ticket, CalendarDays, CalendarRange } from 'lucide-react'
import {
  getDepartmentColor,
  cn,
} from '@/lib/utils'

interface Initiative {
  id: string
  title: string
  keyResult: string
  department: string
  status: string
  startDate: string
  endDate: string
}

interface EventToAttend {
  id: string
  name: string
  priority: string
  category: string
  eventDate: string
  location: string
  status: string
}

interface CalendarViewProps {
  initiatives: Initiative[]
  events?: EventToAttend[]
}

const PRIORITY_COLORS: Record<string, string> = {
  TIER_1: 'bg-red-500',
  TIER_2: 'bg-orange-500',
  TIER_3: 'bg-yellow-500',
  ENERGY: 'bg-emerald-500',
}

// Parse flexible event date strings and return start/end dates for the month
function parseEventDate(dateStr: string, year: number = 2026): { start: Date | null; end: Date | null } {
  if (!dateStr) return { start: null, end: null }

  const str = dateStr.trim()

  // Handle "TBD" or unknown dates
  if (str.toLowerCase().includes('tbd')) {
    return { start: null, end: null }
  }

  // Month name mapping
  const monthMap: Record<string, number> = {
    jan: 0, january: 0,
    feb: 1, february: 1,
    mar: 2, march: 2,
    apr: 3, april: 3,
    may: 4,
    jun: 5, june: 5,
    jul: 6, july: 6,
    aug: 7, august: 7,
    sep: 8, sept: 8, september: 8,
    oct: 9, october: 9,
    nov: 10, november: 10,
    dec: 11, december: 11,
  }

  // Try parsing patterns:
  // "Jan 6-11, 2026" or "Jan 6-11 2026"
  const rangeMatch = str.match(/([a-zA-Z]+)\s*(\d+)\s*-\s*(\d+),?\s*(\d{4})?/i)
  if (rangeMatch) {
    const month = monthMap[rangeMatch[1].toLowerCase()]
    const startDay = parseInt(rangeMatch[2])
    const endDay = parseInt(rangeMatch[3])
    const eventYear = rangeMatch[4] ? parseInt(rangeMatch[4]) : year
    if (month !== undefined) {
      return {
        start: new Date(eventYear, month, startDay),
        end: new Date(eventYear, month, endDay),
      }
    }
  }

  // "Feb 11, 2026" or "Feb 11 2026"
  const singleDateMatch = str.match(/([a-zA-Z]+)\s*(\d+),?\s*(\d{4})?/i)
  if (singleDateMatch) {
    const month = monthMap[singleDateMatch[1].toLowerCase()]
    const day = parseInt(singleDateMatch[2])
    const eventYear = singleDateMatch[3] ? parseInt(singleDateMatch[3]) : year
    if (month !== undefined) {
      return {
        start: new Date(eventYear, month, day),
        end: new Date(eventYear, month, day),
      }
    }
  }

  // "Sept 2026" (just month and year)
  const monthYearMatch = str.match(/([a-zA-Z]+)\s*(\d{4})/i)
  if (monthYearMatch) {
    const month = monthMap[monthYearMatch[1].toLowerCase()]
    const eventYear = parseInt(monthYearMatch[2])
    if (month !== undefined) {
      // Return the whole month
      return {
        start: new Date(eventYear, month, 1),
        end: new Date(eventYear, month + 1, 0), // Last day of month
      }
    }
  }

  return { start: null, end: null }
}

export function CalendarView({ initiatives, events = [] }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 0, 1)) // Start at Jan 2026
  const [showEvents, setShowEvents] = useState(true)
  const [showInitiatives, setShowInitiatives] = useState(true)
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month')

  // Month view calculations
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart)
  const calendarEnd = endOfWeek(monthEnd)
  const monthDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  // Week view calculations
  const weekStart = startOfWeek(currentDate)
  const weekEnd = endOfWeek(currentDate)
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })

  const getInitiativesForDay = (date: Date) => {
    if (!showInitiatives) return []
    const dayStart = startOfDay(date)
    return initiatives.filter(initiative => {
      const start = startOfDay(parseISO(initiative.startDate))
      const end = startOfDay(parseISO(initiative.endDate))
      return dayStart >= start && dayStart <= end
    })
  }

  const getEventsForDay = (date: Date) => {
    if (!showEvents) return []
    const dayStart = startOfDay(date)
    return events.filter(event => {
      const { start, end } = parseEventDate(event.eventDate)
      if (!start || !end) return false
      return dayStart >= startOfDay(start) && dayStart <= startOfDay(end)
    })
  }

  const goToPrevMonth = () => setCurrentDate(subMonths(currentDate, 1))
  const goToNextMonth = () => setCurrentDate(addMonths(currentDate, 1))
  const goToPrevWeek = () => setCurrentDate(subWeeks(currentDate, 1))
  const goToNextWeek = () => setCurrentDate(addWeeks(currentDate, 1))
  const goToToday = () => setCurrentDate(new Date())

  const goToPrev = viewMode === 'month' ? goToPrevMonth : goToPrevWeek
  const goToNext = viewMode === 'month' ? goToNextMonth : goToNextWeek

  // Title display
  const title = viewMode === 'month'
    ? format(currentDate, 'MMMM yyyy')
    : `${format(weekStart, 'MMM d')} – ${format(weekEnd, 'MMM d, yyyy')}`

  return (
    <Card className="border border-gray-200">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-lg font-semibold">
            {title}
          </CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            {/* View Mode Toggle */}
            <div className="flex items-center rounded-lg border border-gray-200 p-0.5">
              <Button
                variant={viewMode === 'month' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('month')}
                className="h-7 px-2.5 text-xs"
              >
                <CalendarDays className="h-3.5 w-3.5 mr-1" />
                Month
              </Button>
              <Button
                variant={viewMode === 'week' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('week')}
                className="h-7 px-2.5 text-xs"
              >
                <CalendarRange className="h-3.5 w-3.5 mr-1" />
                Week
              </Button>
            </div>
            <div className="w-px h-6 bg-gray-200" />
            <Button
              variant={showInitiatives ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowInitiatives(!showInitiatives)}
            >
              Initiatives
            </Button>
            <Button
              variant={showEvents ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowEvents(!showEvents)}
            >
              <Ticket className="h-4 w-4 mr-1" />
              Events
            </Button>
            <div className="w-px h-6 bg-gray-200 mx-2" />
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
            <Button variant="outline" size="icon" onClick={goToPrev}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={goToNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Day Headers */}
        <div className="grid grid-cols-7 border-b border-gray-200">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div
              key={day}
              className="py-2 text-center text-sm font-medium text-gray-500 border-r border-gray-200 last:border-r-0"
            >
              {day}
            </div>
          ))}
        </div>

        {viewMode === 'month' ? (
          /* Month View Grid */
          <div className="grid grid-cols-7">
            {monthDays.map((day, index) => {
              const dayInitiatives = getInitiativesForDay(day)
              const dayEvents = getEventsForDay(day)
              const isCurrentMonth = isSameMonth(day, currentDate)
              const isToday = isSameDay(day, new Date())
              const totalItems = dayInitiatives.length + dayEvents.length

              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    'min-h-[120px] border-b border-r border-gray-200 p-1',
                    (index + 1) % 7 === 0 && 'border-r-0',
                    !isCurrentMonth && 'bg-gray-50'
                  )}
                >
                  {/* Day Number */}
                  <div className="flex justify-end mb-1">
                    <span
                      className={cn(
                        'text-sm w-6 h-6 flex items-center justify-center rounded-full',
                        isToday && 'bg-blue-600 text-white',
                        !isToday && !isCurrentMonth && 'text-gray-400',
                        !isToday && isCurrentMonth && 'text-gray-700'
                      )}
                    >
                      {format(day, 'd')}
                    </span>
                  </div>

                  {/* Events (shown first with ticket icon) */}
                  <div className="space-y-0.5 overflow-hidden">
                    {dayEvents.slice(0, 2).map(event => {
                      const { start } = parseEventDate(event.eventDate)
                      const isStart = start && isSameDay(startOfDay(day), startOfDay(start))

                      return (
                        <Link
                          key={event.id}
                          href="/events"
                          className={cn(
                            'flex items-center gap-1 text-[10px] px-1 py-0.5 text-white truncate rounded',
                            PRIORITY_COLORS[event.priority]
                          )}
                          title={`${event.name} - ${event.location}`}
                        >
                          <Ticket className="h-2.5 w-2.5 shrink-0" />
                          {isStart ? event.name.substring(0, 15) : ''}
                        </Link>
                      )
                    })}

                    {/* Initiatives */}
                    {dayInitiatives.slice(0, 3 - Math.min(dayEvents.length, 2)).map(initiative => {
                      const isStart = isSameDay(startOfDay(day), startOfDay(parseISO(initiative.startDate)))
                      const isEnd = isSameDay(startOfDay(day), startOfDay(parseISO(initiative.endDate)))

                      return (
                        <Link
                          key={initiative.id}
                          href={`/initiatives/${initiative.id}`}
                          className={cn(
                            'block text-[10px] px-1 py-0.5 text-white truncate',
                            getDepartmentColor(initiative.department),
                            isStart && 'rounded-l',
                            isEnd && 'rounded-r',
                            !isStart && !isEnd && 'mx-0'
                          )}
                          title={`${initiative.keyResult}: ${initiative.title}`}
                        >
                          {isStart ? initiative.keyResult : ''}
                        </Link>
                      )
                    })}

                    {totalItems > 3 && (
                      <span className="text-[10px] text-gray-500 px-1">
                        +{totalItems - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          /* Week View Grid */
          <div className="grid grid-cols-7">
            {weekDays.map((day, index) => {
              const dayInitiatives = getInitiativesForDay(day)
              const dayEvents = getEventsForDay(day)
              const isToday = isSameDay(day, new Date())

              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    'min-h-[400px] border-b border-r border-gray-200 p-2',
                    (index + 1) % 7 === 0 && 'border-r-0',
                    isToday && 'bg-blue-50/50'
                  )}
                >
                  {/* Day Header */}
                  <div className="flex flex-col items-center mb-3">
                    <span
                      className={cn(
                        'text-lg font-semibold w-9 h-9 flex items-center justify-center rounded-full',
                        isToday && 'bg-blue-600 text-white',
                        !isToday && 'text-gray-700'
                      )}
                    >
                      {format(day, 'd')}
                    </span>
                    <span className="text-xs text-gray-500 mt-0.5">
                      {format(day, 'EEE')}
                    </span>
                  </div>

                  {/* All Events - no truncation */}
                  <div className="space-y-1">
                    {dayEvents.map(event => {
                      const { start } = parseEventDate(event.eventDate)
                      const isStart = start && isSameDay(startOfDay(day), startOfDay(start))

                      return (
                        <Link
                          key={event.id}
                          href="/events"
                          className={cn(
                            'flex items-center gap-1 text-xs px-1.5 py-1 text-white rounded',
                            PRIORITY_COLORS[event.priority]
                          )}
                          title={`${event.name} - ${event.location}`}
                        >
                          <Ticket className="h-3 w-3 shrink-0" />
                          <span className="truncate">
                            {isStart ? event.name : ''}
                          </span>
                        </Link>
                      )
                    })}

                    {/* All Initiatives - no truncation */}
                    {dayInitiatives.map(initiative => {
                      const isStart = isSameDay(startOfDay(day), startOfDay(parseISO(initiative.startDate)))
                      const isEnd = isSameDay(startOfDay(day), startOfDay(parseISO(initiative.endDate)))

                      return (
                        <Link
                          key={initiative.id}
                          href={`/initiatives/${initiative.id}`}
                          className={cn(
                            'block text-xs px-1.5 py-1 text-white rounded',
                            getDepartmentColor(initiative.department),
                            isStart && 'rounded-l',
                            isEnd && 'rounded-r',
                            !isStart && !isEnd && 'mx-0'
                          )}
                          title={`${initiative.keyResult}: ${initiative.title}`}
                        >
                          <span className="truncate block">
                            {isStart ? initiative.keyResult : ''}
                          </span>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>

      {/* Legend */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <span className="text-gray-600 font-medium">Legend:</span>

          {/* Department colors */}
          <div className="flex items-center gap-3">
            {[
              { value: 'BIZ_DEV', label: 'Biz Dev' },
              { value: 'OPERATIONS', label: 'Operations' },
              { value: 'FINANCE', label: 'Finance' },
              { value: 'MARKETING', label: 'Marketing' },
            ].map(dept => (
              <div key={dept.value} className="flex items-center gap-1">
                <div className={`w-3 h-3 rounded ${getDepartmentColor(dept.value)}`} />
                <span>{dept.label}</span>
              </div>
            ))}
          </div>

          <div className="w-px h-4 bg-gray-200" />

          {/* Event priority colors */}
          <div className="flex items-center gap-3">
            <Ticket className="h-3 w-3 text-gray-500" />
            {[
              { value: 'TIER_1', label: 'Tier 1' },
              { value: 'TIER_2', label: 'Tier 2' },
              { value: 'TIER_3', label: 'Tier 3' },
              { value: 'ENERGY', label: 'Energy' },
            ].map(priority => (
              <div key={priority.value} className="flex items-center gap-1">
                <div className={`w-3 h-3 rounded ${PRIORITY_COLORS[priority.value]}`} />
                <span>{priority.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  )
}
