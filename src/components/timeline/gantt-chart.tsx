'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
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
  formatStatus,
  formatTeamMember,
  getDepartmentColor,
  getStatusColor,
  DEPARTMENT_OPTIONS,
} from '@/lib/utils'

interface Initiative {
  id: string
  sequenceNumber: number
  title: string
  objective: string
  keyResult: string
  department: string
  status: string
  personInCharge: string | null
  startDate: string
  endDate: string
}

interface GanttChartProps {
  initiatives: Initiative[]
}

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

export function GanttChart({ initiatives }: GanttChartProps) {
  const [groupBy, setGroupBy] = useState<'department' | 'objective'>('department')
  const [filterDepartment, setFilterDepartment] = useState<string>('all')

  // Filter initiatives
  const filteredInitiatives = useMemo(() => {
    if (filterDepartment === 'all') return initiatives
    return initiatives.filter(i => i.department === filterDepartment)
  }, [initiatives, filterDepartment])

  // Group initiatives
  const groupedInitiatives = useMemo(() => {
    const groups: Record<string, Initiative[]> = {}

    filteredInitiatives.forEach(initiative => {
      const key = groupBy === 'department'
        ? initiative.department
        : initiative.objective
      if (!groups[key]) groups[key] = []
      groups[key].push(initiative)
    })

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
              <div className="flex-1 grid grid-cols-12 min-w-[600px]">
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
            <div className="divide-y divide-gray-200">
              {Object.entries(groupedInitiatives).map(([groupKey, items]) => (
                <div key={groupKey}>
                  {/* Group Header */}
                  <div className="flex bg-gray-50 border-b border-gray-200">
                    <div className="w-64 md:w-80 shrink-0 px-3 md:px-4 py-2 font-medium text-sm text-gray-700 border-r border-gray-200">
                      {groupBy === 'department'
                        ? formatDepartment(groupKey)
                        : groupKey === 'OBJ1_SCALE_EVENTS'
                          ? 'Obj 1: Scale Events'
                          : 'Obj 2: Build AI Training'}
                      <span className="ml-2 text-gray-400">({items.length})</span>
                    </div>
                    <div className="flex-1 min-w-[600px]" />
                  </div>

                  {/* Group Items */}
                  {items.map((initiative) => (
                    <div key={initiative.id} className="flex hover:bg-gray-50">
                      {/* Initiative Name */}
                      <div className="w-64 md:w-80 shrink-0 px-3 md:px-4 py-3 border-r border-gray-200">
                        <Link
                          href={`/initiatives/${initiative.id}`}
                          className="block hover:underline"
                        >
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px] shrink-0">
                              {initiative.keyResult}
                            </Badge>
                            <span className="text-sm text-gray-900 truncate max-w-[160px] md:max-w-[220px]">
                              {initiative.title}
                            </span>
                          </div>
                        </Link>
                      </div>

                      {/* Timeline Bar */}
                      <div className="flex-1 relative py-2 min-w-[600px]">
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
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className={`absolute top-1/2 -translate-y-1/2 h-6 rounded ${getDepartmentColor(
                                initiative.department
                              )} opacity-90 hover:opacity-100 cursor-pointer transition-opacity`}
                              style={getBarStyle(initiative.startDate, initiative.endDate)}
                            />
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
                  ))}
                </div>
              ))}

              {filteredInitiatives.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  No initiatives found
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
