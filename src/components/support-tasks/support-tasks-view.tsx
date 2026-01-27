'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { User, Clock } from 'lucide-react'

interface SupportTaskData {
  id: string
  taskId: string
  category: string
  task: string
  owner: string
  frequency: string | null
  priority: string
  notes: string | null
  keyResultLinks: Array<{
    id: string
    keyResult: {
      id: string
      krId: string
      description: string
    }
  }>
}

interface SupportTasksViewProps {
  tasks: SupportTaskData[]
}

const CATEGORY_LABELS: Record<string, string> = {
  DESIGN_CREATIVE: 'Design & Creative',
  BUSINESS_ADMIN: 'Business & Admin',
  TALENTA_IDEAS: 'Talenta Ideas',
  OPERATIONS: 'Operations',
}

const CATEGORY_ORDER = ['DESIGN_CREATIVE', 'BUSINESS_ADMIN', 'TALENTA_IDEAS', 'OPERATIONS']

const CATEGORY_COLORS: Record<string, string> = {
  DESIGN_CREATIVE: 'bg-purple-100 text-purple-800 border-purple-200',
  BUSINESS_ADMIN: 'bg-blue-100 text-blue-800 border-blue-200',
  TALENTA_IDEAS: 'bg-amber-100 text-amber-800 border-amber-200',
  OPERATIONS: 'bg-green-100 text-green-800 border-green-200',
}

const CATEGORY_BORDER_COLORS: Record<string, string> = {
  DESIGN_CREATIVE: 'border-l-purple-500',
  BUSINESS_ADMIN: 'border-l-blue-500',
  TALENTA_IDEAS: 'border-l-amber-500',
  OPERATIONS: 'border-l-green-500',
}

const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-700',
  MEDIUM: 'bg-yellow-100 text-yellow-700',
  HIGH: 'bg-red-100 text-red-700',
}

const PRIORITY_LABELS: Record<string, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
}

export function SupportTasksView({ tasks }: SupportTasksViewProps) {
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  const filteredTasks = tasks.filter(
    t => categoryFilter === 'all' || t.category === categoryFilter
  )

  const grouped = CATEGORY_ORDER
    .map(cat => ({
      category: cat,
      label: CATEGORY_LABELS[cat],
      tasks: filteredTasks.filter(t => t.category === cat),
    }))
    .filter(g => g.tasks.length > 0)

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-4">
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="DESIGN_CREATIVE">Design & Creative</SelectItem>
            <SelectItem value="BUSINESS_ADMIN">Business & Admin</SelectItem>
            <SelectItem value="TALENTA_IDEAS">Talenta Ideas</SelectItem>
            <SelectItem value="OPERATIONS">Operations</SelectItem>
          </SelectContent>
        </Select>

        {categoryFilter !== 'all' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCategoryFilter('all')}
          >
            Clear filter
          </Button>
        )}

        <div className="ml-auto text-sm text-gray-500">
          Showing {filteredTasks.length} of {tasks.length} tasks
        </div>
      </div>

      {/* Category Groups */}
      {grouped.map(group => (
        <div key={group.category} className="space-y-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-900">
              {group.label}
            </h2>
            <Badge
              className={cn('text-xs', CATEGORY_COLORS[group.category])}
            >
              {group.tasks.length}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {group.tasks.map(task => (
              <Card
                key={task.id}
                className={cn(
                  'border-l-4 hover:shadow-md transition-shadow',
                  CATEGORY_BORDER_COLORS[task.category]
                )}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs text-gray-400 font-mono">
                      {task.taskId}
                    </span>
                    <Badge
                      className={cn(
                        'shrink-0 text-[10px]',
                        PRIORITY_COLORS[task.priority]
                      )}
                    >
                      {PRIORITY_LABELS[task.priority] || task.priority}
                    </Badge>
                  </div>
                  <CardTitle className="text-sm font-medium leading-snug">
                    {task.task}
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-3">
                  {/* Owner & Frequency */}
                  <div className="space-y-1 text-xs text-gray-600">
                    <div className="flex items-center gap-2">
                      <User className="h-3 w-3" />
                      <span>{task.owner}</span>
                    </div>
                    {task.frequency && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        <span>{task.frequency}</span>
                      </div>
                    )}
                  </div>

                  {/* KR Badges */}
                  {task.keyResultLinks.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2 border-t border-gray-100">
                      {task.keyResultLinks.map(link => (
                        <Link key={link.id} href="/objectives">
                          <Badge
                            variant="outline"
                            className="cursor-pointer hover:bg-blue-50 text-blue-700 border-blue-200 text-xs"
                            title={link.keyResult.description}
                          >
                            {link.keyResult.krId}
                          </Badge>
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}

      {/* Empty State */}
      {grouped.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No support tasks found.
        </div>
      )}
    </div>
  )
}
