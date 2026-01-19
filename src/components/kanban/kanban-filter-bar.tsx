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

export type DateFilter = 'all' | 'overdue' | 'this-week' | 'this-month' | 'this-quarter' | 'upcoming'

interface KanbanFilterBarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  selectedPerson: string | null
  onPersonChange: (person: string | null) => void
  selectedKeyResult: string | null
  onKeyResultChange: (keyResult: string | null) => void
  keyResults: string[]
  selectedDateFilter: DateFilter
  onDateFilterChange: (filter: DateFilter) => void
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

const DATE_FILTER_OPTIONS = [
  { value: 'all', label: 'All Dates' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'this-week', label: 'This Week' },
  { value: 'this-month', label: 'This Month' },
  { value: 'this-quarter', label: 'This Quarter' },
  { value: 'upcoming', label: 'Upcoming (7 days)' },
]

export function KanbanFilterBar({
  searchQuery,
  onSearchChange,
  selectedPerson,
  onPersonChange,
  selectedKeyResult,
  onKeyResultChange,
  keyResults,
  selectedDateFilter,
  onDateFilterChange,
}: KanbanFilterBarProps) {
  const hasActiveFilters = searchQuery || selectedPerson || selectedKeyResult || selectedDateFilter !== 'all'

  const clearFilters = () => {
    onSearchChange('')
    onPersonChange(null)
    onKeyResultChange(null)
    onDateFilterChange('all')
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-white/70 backdrop-blur-xl border border-gray-200/50 rounded-2xl shadow-sm">
      {/* Search Input */}
      <div className="relative flex-1 max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search initiatives..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 h-9 bg-white/60 border-gray-200/50 rounded-xl focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      {/* Separator */}
      <div className="h-6 w-px bg-gray-200" />

      {/* Person Pills (iOS Segmented Control Style) */}
      <div className="flex items-center gap-1 p-1 bg-gray-100/80 rounded-xl">
        <button
          onClick={() => onPersonChange(null)}
          className={cn(
            'px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200',
            selectedPerson === null
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
              onPersonChange(selectedPerson === member.value ? null : member.value)
            }
            className={cn(
              'px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-1.5',
              selectedPerson === member.value
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            <span
              className={cn(
                'w-2 h-2 rounded-full',
                TEAM_COLORS[member.value]
              )}
            />
            {member.label}
          </button>
        ))}
      </div>

      {/* Separator */}
      <div className="h-6 w-px bg-gray-200" />

      {/* Key Result Dropdown */}
      <Select
        value={selectedKeyResult || 'all'}
        onValueChange={(value) => onKeyResultChange(value === 'all' ? null : value)}
      >
        <SelectTrigger className="w-[120px] h-9 bg-white/60 border-gray-200/50 rounded-xl">
          <SelectValue placeholder="KR" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All KRs</SelectItem>
          {keyResults.map((kr) => (
            <SelectItem key={kr} value={kr}>
              {kr}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Separator */}
      <div className="h-6 w-px bg-gray-200" />

      {/* Date Filter Dropdown */}
      <Select
        value={selectedDateFilter}
        onValueChange={(value) => onDateFilterChange(value as DateFilter)}
      >
        <SelectTrigger className={cn(
          "w-[150px] h-9 bg-white/60 border-gray-200/50 rounded-xl",
          selectedDateFilter === 'overdue' && "text-red-600 border-red-200"
        )}>
          <Calendar className="h-4 w-4 mr-2 text-gray-400" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {DATE_FILTER_OPTIONS.map((option) => (
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
