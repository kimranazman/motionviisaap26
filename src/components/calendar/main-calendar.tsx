'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  format,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  startOfWeek,
  endOfWeek,
} from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  CalendarDays,
  CalendarRange,
} from 'lucide-react'
import { CalendarMonthView } from './calendar-month-view'
import { CalendarWeekView } from './calendar-week-view'
import { CalendarDayView } from './calendar-day-view'
import { type CalendarItem } from './calendar-date-marker'
import { TaskDetailSheet } from '@/components/projects/task-detail-sheet'
import { InitiativeDetailSheet } from '@/components/kanban/initiative-detail-sheet'

type ViewMode = 'day' | 'week' | 'month'

interface Task {
  id: string
  title: string
  description: string | null
  status: 'TODO' | 'IN_PROGRESS' | 'DONE'
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  dueDate: string | null
  assignee: string | null
  projectId: string
  parentId: string | null
}

interface Initiative {
  id: string
  sequenceNumber: number
  title: string
  keyResult: string | { krId: string } | null
  department: string
  status: string
  personInCharge: string | null
  startDate: string
  endDate: string
  position: number
}

interface MainCalendarProps {
  tasks: Array<{
    id: string
    title: string
    dueDate: string | null
    status: string
    projectId: string
  }>
  projects: Array<{
    id: string
    title: string
    startDate: string | null
    endDate: string | null
    status: string
  }>
  initiatives: Array<{
    id: string
    title: string
    startDate: string
    endDate: string
    status: string
    keyResult: string
  }>
}

// Task status that means completed
const COMPLETED_TASK_STATUSES = ['DONE']
// Project status that means completed
const COMPLETED_PROJECT_STATUSES = ['COMPLETED', 'CANCELLED']
// Initiative status that means completed
const COMPLETED_INITIATIVE_STATUSES = ['COMPLETED', 'CANCELLED']

export function MainCalendar({ tasks, projects, initiatives }: MainCalendarProps) {
  const router = useRouter()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<ViewMode>('month')

  // Detail sheet states
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [taskSheetOpen, setTaskSheetOpen] = useState(false)

  const [selectedInitiative, setSelectedInitiative] = useState<Initiative | null>(null)
  const [initiativeSheetOpen, setInitiativeSheetOpen] = useState(false)

  // Transform data into CalendarItems
  const calendarItems: CalendarItem[] = [
    // Tasks (due dates only)
    ...tasks
      .filter(t => t.dueDate)
      .map(t => ({
        id: t.id,
        title: t.title,
        entityType: 'task' as const,
        dateType: 'due' as const,
        date: t.dueDate!,
        status: t.status,
        isCompleted: COMPLETED_TASK_STATUSES.includes(t.status),
        projectId: t.projectId,
      })),

    // Project start dates
    ...projects
      .filter(p => p.startDate)
      .map(p => ({
        id: p.id,
        title: p.title,
        entityType: 'project' as const,
        dateType: 'start' as const,
        date: p.startDate!,
        status: p.status,
        isCompleted: COMPLETED_PROJECT_STATUSES.includes(p.status),
      })),

    // Project end dates
    ...projects
      .filter(p => p.endDate)
      .map(p => ({
        id: p.id,
        title: p.title,
        entityType: 'project' as const,
        dateType: 'end' as const,
        date: p.endDate!,
        status: p.status,
        isCompleted: COMPLETED_PROJECT_STATUSES.includes(p.status),
      })),

    // Initiative start dates
    ...initiatives.map(i => ({
      id: i.id,
      title: i.title,
      entityType: 'initiative' as const,
      dateType: 'start' as const,
      date: i.startDate,
      status: i.status,
      isCompleted: COMPLETED_INITIATIVE_STATUSES.includes(i.status),
    })),

    // Initiative end dates
    ...initiatives.map(i => ({
      id: i.id,
      title: i.title,
      entityType: 'initiative' as const,
      dateType: 'end' as const,
      date: i.endDate,
      status: i.status,
      isCompleted: COMPLETED_INITIATIVE_STATUSES.includes(i.status),
    })),
  ]

  // Navigation handlers
  const goToPrev = () => {
    if (viewMode === 'month') setCurrentDate(subMonths(currentDate, 1))
    else if (viewMode === 'week') setCurrentDate(subWeeks(currentDate, 1))
    else setCurrentDate(subDays(currentDate, 1))
  }

  const goToNext = () => {
    if (viewMode === 'month') setCurrentDate(addMonths(currentDate, 1))
    else if (viewMode === 'week') setCurrentDate(addWeeks(currentDate, 1))
    else setCurrentDate(addDays(currentDate, 1))
  }

  const goToToday = () => setCurrentDate(new Date())

  // Title based on view mode
  const getTitle = () => {
    if (viewMode === 'month') return format(currentDate, 'MMMM yyyy')
    if (viewMode === 'week') {
      const weekStartDate = startOfWeek(currentDate)
      const weekEndDate = endOfWeek(currentDate)
      return `${format(weekStartDate, 'MMM d')} - ${format(weekEndDate, 'MMM d, yyyy')}`
    }
    return format(currentDate, 'EEEE, MMMM d, yyyy')
  }

  // Handle item click - open appropriate detail sheet or navigate
  const handleItemClick = async (item: CalendarItem) => {
    if (item.entityType === 'task') {
      // Fetch full task data
      try {
        const response = await fetch(`/api/projects/${item.projectId}/tasks/${item.id}`)
        if (response.ok) {
          const taskData = await response.json()
          setSelectedTask(taskData)
          setTaskSheetOpen(true)
        }
      } catch (error) {
        console.error('Failed to fetch task:', error)
      }
    } else if (item.entityType === 'project') {
      // Navigate to project page
      router.push(`/projects/${item.id}`)
    } else if (item.entityType === 'initiative') {
      // Fetch full initiative data
      try {
        const response = await fetch(`/api/initiatives/${item.id}`)
        if (response.ok) {
          const initiativeData = await response.json()
          setSelectedInitiative(initiativeData)
          setInitiativeSheetOpen(true)
        }
      } catch (error) {
        console.error('Failed to fetch initiative:', error)
      }
    }
  }

  // Refresh handler (called when sheets update data)
  const handleRefresh = () => {
    // In a full implementation, this would trigger a data refetch
    // For now, just close the sheets
    setTaskSheetOpen(false)
    setInitiativeSheetOpen(false)
  }

  return (
    <>
      <Card className="border border-gray-200">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-lg font-semibold">
              {getTitle()}
            </CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              {/* View Mode Toggle */}
              <div className="flex items-center rounded-lg border border-gray-200 p-0.5">
                <Button
                  variant={viewMode === 'day' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('day')}
                  className="h-7 px-2.5 text-xs"
                >
                  <CalendarIcon className="h-3.5 w-3.5 mr-1" />
                  Day
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
                <Button
                  variant={viewMode === 'month' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('month')}
                  className="h-7 px-2.5 text-xs"
                >
                  <CalendarDays className="h-3.5 w-3.5 mr-1" />
                  Month
                </Button>
              </div>

              <div className="w-px h-6 bg-gray-200" />

              {/* Navigation */}
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
          {viewMode === 'month' && (
            <CalendarMonthView
              currentDate={currentDate}
              items={calendarItems}
              onItemClick={handleItemClick}
            />
          )}
          {viewMode === 'week' && (
            <CalendarWeekView
              currentDate={currentDate}
              items={calendarItems}
              onItemClick={handleItemClick}
            />
          )}
          {viewMode === 'day' && (
            <CalendarDayView
              currentDate={currentDate}
              items={calendarItems}
              onItemClick={handleItemClick}
            />
          )}
        </CardContent>

        {/* Legend */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <span className="text-gray-600 font-medium">Legend:</span>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-blue-500" />
                <span>Task</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-orange-500" />
                <span>Project</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-purple-500" />
                <span>Initiative</span>
              </div>
            </div>
            <div className="w-px h-4 bg-gray-200" />
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-gray-400" />
              <span>Completed</span>
            </div>
            <div className="w-px h-4 bg-gray-200" />
            <div className="flex items-center gap-2 text-gray-500">
              <span><strong>S</strong> = Start</span>
              <span><strong>E</strong> = End</span>
              <span><strong>D</strong> = Due</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Detail Sheets */}
      {selectedTask && (
        <TaskDetailSheet
          task={selectedTask}
          projectId={selectedTask.projectId}
          open={taskSheetOpen}
          onOpenChange={setTaskSheetOpen}
          onTaskUpdate={handleRefresh}
        />
      )}

      {selectedInitiative && (
        <InitiativeDetailSheet
          initiative={selectedInitiative}
          open={initiativeSheetOpen}
          onOpenChange={setInitiativeSheetOpen}
          onUpdate={handleRefresh}
        />
      )}
    </>
  )
}
