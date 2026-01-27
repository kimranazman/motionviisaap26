'use client'

import { Search, X, Calendar } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { TASK_STATUS_OPTIONS, TASK_PRIORITY_OPTIONS } from '@/lib/task-utils'

export type DueDateFilter = 'all' | 'overdue' | 'today' | 'this-week' | 'this-month' | 'no-date'

interface TaskFilterBarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  selectedAssignee: string | null
  onAssigneeChange: (assignee: string | null) => void
  selectedProject: string | null
  onProjectChange: (projectId: string | null) => void
  projects: { id: string; title: string }[]
  selectedStatus: string | null
  onStatusChange: (status: string | null) => void
  selectedPriority: string | null
  onPriorityChange: (priority: string | null) => void
  selectedDueDate: DueDateFilter
  onDueDateChange: (filter: DueDateFilter) => void
}

const TEAM_MEMBERS = [
  { value: 'KHAIRUL', label: 'KH', fullName: 'Khairul' },
  { value: 'AZLAN', label: 'AZ', fullName: 'Azlan' },
  { value: 'IZYANI', label: 'IZ', fullName: 'Izyani' },
]

const TEAM_COLORS: Record<string, string> = {
  KHAIRUL: 'bg-blue-600',
  AZLAN: 'bg-green-600',
  IZYANI: 'bg-purple-600',
}

const DUE_DATE_OPTIONS = [
  { value: 'all', label: 'All Dates' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'today', label: 'Due Today' },
  { value: 'this-week', label: 'This Week' },
  { value: 'this-month', label: 'This Month' },
  { value: 'no-date', label: 'No Date' },
]

export function TaskFilterBar({
  searchQuery,
  onSearchChange,
  selectedAssignee,
  onAssigneeChange,
  selectedProject,
  onProjectChange,
  projects,
  selectedStatus,
  onStatusChange,
  selectedPriority,
  onPriorityChange,
  selectedDueDate,
  onDueDateChange,
}: TaskFilterBarProps) {
  const hasActiveFilters =
    searchQuery ||
    selectedAssignee ||
    selectedProject ||
    selectedStatus ||
    selectedPriority ||
    selectedDueDate !== 'all'

  const clearFilters = () => {
    onSearchChange('')
    onAssigneeChange(null)
    onProjectChange(null)
    onStatusChange(null)
    onPriorityChange(null)
    onDueDateChange('all')
  }

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3',
        'bg-white/70 backdrop-blur-xl border border-gray-200/50 rounded-2xl shadow-sm',
        'overflow-x-auto',
        'md:overflow-visible'
      )}
    >
      {/* Search Input */}
      <div className="relative flex-1 max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search tasks..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 h-9 bg-white/60 border-gray-200/50 rounded-xl focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      {/* Separator */}
      <div className="hidden md:block h-6 w-px bg-gray-200" />

      {/* Assignee Person Pills */}
      <div className="flex items-center gap-1 p-1 bg-gray-100/80 rounded-xl">
        <button
          onClick={() => onAssigneeChange(null)}
          className={cn(
            'px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200',
            selectedAssignee === null
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          )}
        >
          All
        </button>
        {TEAM_MEMBERS.map((member) => (
          <button
            key={member.value}
            onClick={() =>
              onAssigneeChange(selectedAssignee === member.value ? null : member.value)
            }
            className={cn(
              'px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-1.5',
              selectedAssignee === member.value
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            <span
              className={cn('w-2 h-2 rounded-full', TEAM_COLORS[member.value])}
            />
            {member.label}
          </button>
        ))}
      </div>

      {/* Separator */}
      <div className="hidden md:block h-6 w-px bg-gray-200" />

      {/* Project Dropdown */}
      <Select
        value={selectedProject || 'all'}
        onValueChange={(value) => onProjectChange(value === 'all' ? null : value)}
      >
        <SelectTrigger className="w-[140px] h-9 bg-white/60 border-gray-200/50 rounded-xl">
          <SelectValue placeholder="Project" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Projects</SelectItem>
          {projects.map((project) => (
            <SelectItem key={project.id} value={project.id}>
              {project.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Status Dropdown */}
      <Select
        value={selectedStatus || 'all'}
        onValueChange={(value) => onStatusChange(value === 'all' ? null : value)}
      >
        <SelectTrigger className="w-[130px] h-9 bg-white/60 border-gray-200/50 rounded-xl">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          {TASK_STATUS_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Priority Dropdown */}
      <Select
        value={selectedPriority || 'all'}
        onValueChange={(value) => onPriorityChange(value === 'all' ? null : value)}
      >
        <SelectTrigger className="w-[130px] h-9 bg-white/60 border-gray-200/50 rounded-xl">
          <SelectValue placeholder="Priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Priority</SelectItem>
          {TASK_PRIORITY_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Separator */}
      <div className="hidden md:block h-6 w-px bg-gray-200" />

      {/* Due Date Dropdown */}
      <Select
        value={selectedDueDate}
        onValueChange={(value) => onDueDateChange(value as DueDateFilter)}
      >
        <SelectTrigger
          className={cn(
            'w-[140px] h-9 bg-white/60 border-gray-200/50 rounded-xl',
            selectedDueDate === 'overdue' && 'text-red-600 border-red-200'
          )}
        >
          <Calendar className="h-4 w-4 mr-2 text-gray-400" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {DUE_DATE_OPTIONS.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              className={option.value === 'overdue' ? 'text-red-600' : ''}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="h-9 px-3 text-gray-500 hover:text-gray-700 rounded-xl"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
