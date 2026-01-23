'use client'

import * as React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type View = 'days' | 'months' | 'years'

interface DatePickerCalendarProps {
  selected?: Date
  onSelect: (date: Date | undefined) => void
  fromYear?: number
  toYear?: number
}

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
]

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

export function DatePickerCalendar({
  selected,
  onSelect,
  fromYear = 2020,
  toYear = 2035,
}: DatePickerCalendarProps) {
  const [view, setView] = React.useState<View>('days')
  const [viewDate, setViewDate] = React.useState(() => selected || new Date())
  const [yearRangeStart, setYearRangeStart] = React.useState(() => {
    const year = (selected || new Date()).getFullYear()
    return Math.floor(year / 12) * 12
  })

  const currentMonth = viewDate.getMonth()
  const currentYear = viewDate.getFullYear()

  // Get days in month
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate()
  }

  // Get first day of month (0 = Sunday)
  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay()
  }

  // Navigate months
  const prevMonth = () => {
    setViewDate(new Date(currentYear, currentMonth - 1, 1))
  }

  const nextMonth = () => {
    setViewDate(new Date(currentYear, currentMonth + 1, 1))
  }

  // Navigate year ranges
  const prevYearRange = () => {
    setYearRangeStart(prev => Math.max(fromYear, prev - 12))
  }

  const nextYearRange = () => {
    setYearRangeStart(prev => Math.min(toYear - 11, prev + 12))
  }

  // Select day
  const handleDayClick = (day: number) => {
    const newDate = new Date(currentYear, currentMonth, day)
    onSelect(newDate)
  }

  // Select month
  const handleMonthClick = (monthIndex: number) => {
    setViewDate(new Date(currentYear, monthIndex, 1))
    setView('days')
  }

  // Select year
  const handleYearClick = (year: number) => {
    setViewDate(new Date(year, currentMonth, 1))
    setView('months')
  }

  // Check if date is selected
  const isSelected = (day: number) => {
    if (!selected) return false
    return (
      selected.getDate() === day &&
      selected.getMonth() === currentMonth &&
      selected.getFullYear() === currentYear
    )
  }

  // Check if date is today
  const isToday = (day: number) => {
    const today = new Date()
    return (
      today.getDate() === day &&
      today.getMonth() === currentMonth &&
      today.getFullYear() === currentYear
    )
  }

  // Generate calendar days
  const renderDays = () => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth)
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth)
    const days: React.ReactNode[] = []

    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-9 w-9" />)
    }

    // Days of month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(
        <Button
          key={day}
          variant="ghost"
          size="sm"
          className={cn(
            'h-9 w-9 p-0 font-normal',
            isSelected(day) && 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground',
            isToday(day) && !isSelected(day) && 'bg-accent text-accent-foreground'
          )}
          onClick={() => handleDayClick(day)}
        >
          {day}
        </Button>
      )
    }

    return days
  }

  // Generate years grid (12 years at a time)
  const renderYears = () => {
    const years: React.ReactNode[] = []
    for (let i = 0; i < 12; i++) {
      const year = yearRangeStart + i
      if (year < fromYear || year > toYear) {
        years.push(<div key={year} className="h-10" />)
        continue
      }
      const isCurrentYear = year === currentYear
      const isSelectedYear = selected && year === selected.getFullYear()
      years.push(
        <Button
          key={year}
          variant="ghost"
          size="sm"
          className={cn(
            'h-10 w-full font-normal',
            isSelectedYear && 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground',
            isCurrentYear && !isSelectedYear && 'bg-accent text-accent-foreground'
          )}
          onClick={() => handleYearClick(year)}
        >
          {year}
        </Button>
      )
    }
    return years
  }

  // Generate months grid
  const renderMonths = () => {
    return MONTHS.map((month, index) => {
      const isCurrentMonth = index === currentMonth
      const isSelectedMonth = selected &&
        index === selected.getMonth() &&
        currentYear === selected.getFullYear()
      return (
        <Button
          key={month}
          variant="ghost"
          size="sm"
          className={cn(
            'h-10 w-full font-normal',
            isSelectedMonth && 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground',
            isCurrentMonth && !isSelectedMonth && 'bg-accent text-accent-foreground'
          )}
          onClick={() => handleMonthClick(index)}
        >
          {month}
        </Button>
      )
    })
  }

  return (
    <div className="p-3 w-[280px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => {
            if (view === 'days') prevMonth()
            else if (view === 'years') prevYearRange()
          }}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex gap-1">
          {view === 'days' && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 font-medium"
                onClick={() => setView('months')}
              >
                {MONTHS[currentMonth]}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 font-medium"
                onClick={() => {
                  setYearRangeStart(Math.floor(currentYear / 12) * 12)
                  setView('years')
                }}
              >
                {currentYear}
              </Button>
            </>
          )}
          {view === 'months' && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 font-medium"
              onClick={() => {
                setYearRangeStart(Math.floor(currentYear / 12) * 12)
                setView('years')
              }}
            >
              {currentYear}
            </Button>
          )}
          {view === 'years' && (
            <span className="text-sm font-medium py-1">
              {yearRangeStart} - {Math.min(yearRangeStart + 11, toYear)}
            </span>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => {
            if (view === 'days') nextMonth()
            else if (view === 'years') nextYearRange()
          }}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Days View */}
      {view === 'days' && (
        <>
          <div className="grid grid-cols-7 mb-1">
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                className="h-9 w-9 flex items-center justify-center text-xs text-muted-foreground font-medium"
              >
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">{renderDays()}</div>
        </>
      )}

      {/* Months View */}
      {view === 'months' && (
        <div className="grid grid-cols-3 gap-1">{renderMonths()}</div>
      )}

      {/* Years View */}
      {view === 'years' && (
        <div className="grid grid-cols-3 gap-1">{renderYears()}</div>
      )}
    </div>
  )
}
