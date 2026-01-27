'use client'

import { useState, useMemo, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  formatDepartment,
  formatObjective,
  formatStatus,
  formatTeamMember,
  getDepartmentColor,
  getStatusColor,
  DEPARTMENT_OPTIONS,
} from '@/lib/utils'
import { canEdit } from '@/lib/permissions'
import { useGanttDrag } from '@/hooks/use-gantt-drag'

interface Initiative {
  id: string
  sequenceNumber: number
  title: string
  objective: string
  keyResultId: string | null
  keyResult: { krId: string; description: string } | null
  department: string
  status: string
  personInCharge: string | null
  startDate: string
  endDate: string
}

interface GanttChartProps {
  initiatives: Initiative[]
}

interface TimelineSubGroup {
  key: string
  label: string | null  // null = no sub-header (department mode)
  initiatives: Initiative[]
}

interface TimelineGroup {
  key: string
  label: string
  subGroups: TimelineSubGroup[]
  totalInitiatives: number
}

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

export function GanttChart({ initiatives }: GanttChartProps) {
  const [groupBy, setGroupBy] = useState<'department' | 'objective'>('objective')
  const [filterDepartment, setFilterDepartment] = useState<string>('all')
  const router = useRouter()
  const { data: session } = useSession()
  const userCanEdit = canEdit(session?.user?.role)
  const chartContainerRef = useRef<HTMLDivElement>(null)

  // Drag handler: PATCH API then refresh
  const handleDatesChange = useCallback(async (id: string, startDate: string, endDate: string) => {
    try {
      const res = await fetch(`/api/initiatives/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate, endDate }),
      })
      if (res.ok) {
        router.refresh()
      }
    } catch (err) {
      console.error('Failed to update initiative dates:', err)
    }
  }, [router])

  const { dragState, handleMouseDown, isDragging, hasDragged } = useGanttDrag({
    chartRef: chartContainerRef,
    onDatesChange: handleDatesChange,
  })

  // Filter initiatives
  const filteredInitiatives = useMemo(() => {
    if (filterDepartment === 'all') return initiatives
    return initiatives.filter(i => i.department === filterDepartment)
  }, [initiatives, filterDepartment])

  // Build timeline groups with sub-groups
  const timelineGroups = useMemo(() => {
    const groups: TimelineGroup[] = []

    if (groupBy === 'department') {
      // Department mode: each department is a group with one sub-group (no sub-header)
      const byDept = new Map<string, Initiative[]>()
      for (const initiative of filteredInitiatives) {
        const group = byDept.get(initiative.department) || []
        group.push(initiative)
        byDept.set(initiative.department, group)
      }
      Array.from(byDept.entries()).forEach(([dept, items]) => {
        groups.push({
          key: dept,
          label: formatDepartment(dept),
          subGroups: [{
            key: dept,
            label: null,
            initiatives: items,
          }],
          totalInitiatives: items.length,
        })
      })
    } else {
      // Objective mode: group by objective, sub-group by keyResult
      const byObjective = new Map<string, Initiative[]>()
      for (const initiative of filteredInitiatives) {
        const group = byObjective.get(initiative.objective) || []
        group.push(initiative)
        byObjective.set(initiative.objective, group)
      }
      Array.from(byObjective.entries()).forEach(([objective, items]) => {
        const byKR = new Map<string, Initiative[]>()
        for (const item of items) {
          const krId = item.keyResult?.krId || 'Unlinked'
          const group = byKR.get(krId) || []
          group.push(item)
          byKR.set(krId, group)
        }

        const subGroups = Array.from(byKR.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([krId, krItems]) => {
            // Build sub-header label: "KR1.1 - Description"
            const desc = krItems[0]?.keyResult?.description
            const label = krId === 'Unlinked'
              ? 'Unlinked'
              : desc
                ? `${krId} - ${desc}`
                : krId
            return {
              key: krId,
              label,
              initiatives: krItems,
            }
          })

        groups.push({
          key: objective,
          label: formatObjective(objective),
          subGroups,
          totalInitiatives: items.length,
        })
      })
    }

    return groups
  }, [filteredInitiatives, groupBy])

  // Calculate bar position and width
  const getBarStyle = (startDate: string, endDate: string) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const yearStart = new Date(2026, 0, 1)
    const yearEnd = new Date(2026, 11, 31)

    // Calculate position as percentage of year
    const totalDays = (yearEnd.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24)
    const startDays = Math.max(0, (start.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24))
    const endDays = Math.min(totalDays, (end.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24))

    const left = (startDays / totalDays) * 100
    const width = ((endDays - startDays) / totalDays) * 100

    return {
      left: `${left}%`,
      width: `${Math.max(width, 1)}%`,
    }
  }

  // Use drag state dates when actively dragging, otherwise use initiative dates
  const getBarStyleForInitiative = (initiative: Initiative) => {
    if (dragState && dragState.id === initiative.id) {
      return getBarStyle(
        dragState.currentStart.toISOString(),
        dragState.currentEnd.toISOString(),
      )
    }
    return getBarStyle(initiative.startDate, initiative.endDate)
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Controls */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 shrink-0">Group by:</span>
            <Select value={groupBy} onValueChange={(v) => setGroupBy(v as 'department' | 'objective')}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="department">Department</SelectItem>
                <SelectItem value="objective">Objective</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 shrink-0">Filter:</span>
            <Select value={filterDepartment} onValueChange={setFilterDepartment}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {DEPARTMENT_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs overflow-x-auto pb-1">
          <span className="text-gray-600 shrink-0">Departments:</span>
          {DEPARTMENT_OPTIONS.map(dept => (
            <div key={dept.value} className="flex items-center gap-1 shrink-0">
              <div className={`w-3 h-3 rounded ${getDepartmentColor(dept.value)}`} />
              <span>{dept.label}</span>
            </div>
          ))}
        </div>

        {/* Chart - horizontally scrollable on mobile */}
        <Card className="border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
          <CardContent className="p-0 min-w-[900px]">
            {/* Header with months */}
            <div className="flex border-b border-gray-200 bg-gray-50">
              <div className="w-64 md:w-80 shrink-0 px-3 md:px-4 py-3 font-medium text-sm text-gray-700 border-r border-gray-200">
                Initiative
              </div>
              <div ref={chartContainerRef} className="flex-1 grid grid-cols-12 min-w-[600px]">
                {MONTHS.map((month, index) => (
                  <div
                    key={month}
                    className={`px-1 md:px-2 py-3 text-center text-xs font-medium text-gray-600 ${
                      index < 11 ? 'border-r border-gray-200' : ''
                    }`}
                  >
                    {month}
                  </div>
                ))}
              </div>
            </div>

            {/* Body */}
            <div className={`divide-y divide-gray-200 ${isDragging ? 'select-none' : ''}`}>
              {timelineGroups.map((group) => (
                <div key={group.key}>
                  {/* Group Header (Objective or Department) */}
                  <div className="flex bg-gray-50 border-b border-gray-200">
                    <div className="w-64 md:w-80 shrink-0 px-3 md:px-4 py-2 font-medium text-sm text-gray-700 border-r border-gray-200">
                      {group.label}
                      <span className="ml-2 text-gray-400">({group.totalInitiatives})</span>
                    </div>
                    <div className="flex-1 min-w-[600px]" />
                  </div>

                  {/* Sub-groups */}
                  {group.subGroups.map((subGroup) => (
                    <div key={subGroup.key}>
                      {/* KR Sub-header (only in objective mode when label is not null) */}
                      {subGroup.label !== null && (
                        <div className="flex bg-gray-50/50 border-b border-gray-100">
                          <div className="w-64 md:w-80 shrink-0 pl-6 md:pl-8 pr-3 md:pr-4 py-1.5 text-xs text-gray-600 border-r border-gray-200">
                            {subGroup.label}
                            <span className="ml-2 text-gray-400">({subGroup.initiatives.length})</span>
                          </div>
                          <div className="flex-1 min-w-[600px]" />
                        </div>
                      )}

                      {/* Initiative rows */}
                      {subGroup.initiatives.map((initiative) => {
                        const isBeingDragged = dragState?.id === initiative.id

                        return (
                          <div key={initiative.id} className="flex hover:bg-gray-50">
                            {/* Initiative Name */}
                            <div className="w-64 md:w-80 shrink-0 px-3 md:px-4 py-3 border-r border-gray-200">
                              <Link
                                href={`/initiatives/${initiative.id}`}
                                className="block hover:underline"
                                onClick={(e) => { if (hasDragged) e.preventDefault() }}
                              >
                                <div className="flex items-start gap-2">
                                  <Badge variant="outline" className="text-[10px] shrink-0 mt-0.5">
                                    {initiative.keyResult?.krId || 'Unlinked'}
                                  </Badge>
                                  <span className="text-sm text-gray-900">
                                    {initiative.title}
                                  </span>
                                </div>
                              </Link>
                            </div>

                            {/* Timeline Bar */}
                            <div className="flex-1 relative min-h-[2.5rem] min-w-[600px]">
                              {/* Month grid lines */}
                              <div className="absolute inset-0 grid grid-cols-12">
                                {MONTHS.map((_, index) => (
                                  <div
                                    key={index}
                                    className={`${index < 11 ? 'border-r border-gray-100' : ''}`}
                                  />
                                ))}
                              </div>

                              {/* Bar */}
                              <Tooltip open={isDragging ? false : undefined}>
                                <TooltipTrigger asChild>
                                  <div
                                    className={`absolute top-1/2 -translate-y-1/2 h-6 rounded ${getDepartmentColor(
                                      initiative.department
                                    )} opacity-90 hover:opacity-100 transition-opacity group ${
                                      isBeingDragged ? 'ring-2 ring-blue-400 opacity-100' : ''
                                    }`}
                                    style={getBarStyleForInitiative(initiative)}
                                  >
                                    {/* Drag handles - only for editors */}
                                    {userCanEdit && (
                                      <>
                                        {/* Left resize handle */}
                                        <div
                                          className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize z-10 rounded-l"
                                          onMouseDown={(e) => handleMouseDown(e, initiative.id, 'resize-left', initiative.startDate, initiative.endDate)}
                                        />
                                        {/* Center move area */}
                                        <div
                                          className="absolute inset-0 mx-2 cursor-grab active:cursor-grabbing"
                                          onMouseDown={(e) => handleMouseDown(e, initiative.id, 'move', initiative.startDate, initiative.endDate)}
                                        />
                                        {/* Right resize handle */}
                                        <div
                                          className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize z-10 rounded-r"
                                          onMouseDown={(e) => handleMouseDown(e, initiative.id, 'resize-right', initiative.startDate, initiative.endDate)}
                                        />
                                      </>
                                    )}

                                    {/* Date tooltip during drag */}
                                    {isBeingDragged && dragState && (
                                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-20 pointer-events-none">
                                        {dragState.currentStart.toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })}
                                        {' - '}
                                        {dragState.currentEnd.toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })}
                                      </div>
                                    )}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-xs">
                                  <div className="space-y-1">
                                    <p className="font-medium">{initiative.title}</p>
                                    <div className="flex items-center gap-2 text-xs">
                                      <Badge
                                        variant="secondary"
                                        className={getStatusColor(initiative.status)}
                                      >
                                        {formatStatus(initiative.status)}
                                      </Badge>
                                      <span>{formatTeamMember(initiative.personInCharge)}</span>
                                    </div>
                                    <p className="text-xs text-gray-500">
                                      {new Date(initiative.startDate).toLocaleDateString()} - {new Date(initiative.endDate).toLocaleDateString()}
                                    </p>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </div>
              ))}

              {filteredInitiatives.length === 0 && (
                <div className="p-12 text-center">
                  <p className="text-gray-900 font-medium">No initiatives scheduled</p>
                  {filterDepartment !== 'all' && (
                    <p className="text-sm text-gray-500 mt-1">
                      Try adjusting your filters
                    </p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
          </div>
        </Card>
      </div>
    </TooltipProvider>
  )
}
