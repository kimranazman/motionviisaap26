'use client'

import { useMemo } from 'react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface Initiative {
  id: string
  sequenceNumber: number
  title: string
  keyResult: string
  department: string
  status: string
  personInCharge: string | null
  startDate: string
  endDate: string
  position: number
}

interface KanbanSwimlaneViewProps {
  initiatives: Initiative[]
  onCardClick?: (item: Initiative) => void
}

const TEAM_MEMBERS = [
  { value: 'KHAIRUL', label: 'Khairul' },
  { value: 'AZLAN', label: 'Azlan' },
  { value: 'IZYANI', label: 'Izyani' },
]

const TEAM_INITIALS: Record<string, string> = {
  KHAIRUL: 'KH',
  AZLAN: 'AZ',
  IZYANI: 'IZ',
}

const TEAM_COLORS: Record<string, string> = {
  KHAIRUL: 'bg-blue-600',
  AZLAN: 'bg-green-600',
  IZYANI: 'bg-purple-600',
}

// Consolidated status columns for swimlane view
const SWIMLANE_COLUMNS = [
  { id: 'TO_DO', title: 'To Do', statuses: ['NOT_STARTED'], colorDot: 'bg-gray-400' },
  { id: 'IN_PROGRESS', title: 'In Progress', statuses: ['IN_PROGRESS'], colorDot: 'bg-blue-500' },
  { id: 'NEEDS_ATTENTION', title: 'Needs Attention', statuses: ['ON_HOLD', 'AT_RISK'], colorDot: 'bg-amber-500' },
  { id: 'DONE', title: 'Done', statuses: ['COMPLETED', 'CANCELLED'], colorDot: 'bg-green-500' },
]

// Department bottom border colors
const DEPARTMENT_BORDER_BOTTOM: Record<string, string> = {
  BIZ_DEV: 'border-b-purple-400',
  OPERATIONS: 'border-b-blue-400',
  FINANCE: 'border-b-green-400',
  MARKETING: 'border-b-orange-400',
}

function SwimlaneCard({
  item,
  onClick,
}: {
  item: Initiative
  onClick?: () => void
}) {
  const endDate = new Date(item.endDate)
  const isOverdue = endDate < new Date() && item.status !== 'COMPLETED'

  const handleClick = () => {
    if (onClick) {
      onClick()
    } else {
      window.location.href = `/initiatives/${item.id}`
    }
  }

  return (
    <div
      className={cn(
        'bg-white rounded-xl shadow-apple p-3 cursor-pointer',
        'hover:shadow-apple-hover hover:scale-[1.01] transition-all duration-200',
        'border-b-2',
        DEPARTMENT_BORDER_BOTTOM[item.department] || 'border-b-gray-300'
      )}
      onClick={handleClick}
    >
      <div className="text-xs font-medium text-gray-900 line-clamp-2 mb-2">
        {item.title}
      </div>
      <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
        <Badge
          variant="secondary"
          className="text-[9px] px-1 py-0 h-4 bg-gray-100 text-gray-600"
        >
          {item.keyResult}
        </Badge>
        <span className="text-gray-300">·</span>
        <span className={cn(isOverdue && 'text-red-500')}>
          {endDate.toLocaleDateString('en-MY', { month: 'short', day: 'numeric' })}
        </span>
      </div>
    </div>
  )
}

function PersonSwimlane({
  person,
  initiatives,
  onCardClick,
}: {
  person: { value: string; label: string }
  initiatives: Initiative[]
  onCardClick?: (item: Initiative) => void
}) {
  const getColumnItems = (statuses: string[]) =>
    initiatives.filter((i) => statuses.includes(i.status)).sort((a, b) => a.position - b.position)

  return (
    <div className="bg-white/40 backdrop-blur-sm rounded-2xl p-4 border border-gray-200/30">
      {/* Person Header */}
      <div className="flex items-center gap-3 mb-4">
        <Avatar className="h-8 w-8">
          <AvatarFallback
            className={cn('text-xs text-white font-medium', TEAM_COLORS[person.value])}
          >
            {TEAM_INITIALS[person.value]}
          </AvatarFallback>
        </Avatar>
        <h3 className="font-semibold text-gray-900">{person.label}</h3>
        <span className="text-sm text-gray-400">
          {initiatives.length} initiative{initiatives.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Status Columns */}
      <div className="grid grid-cols-4 gap-3">
        {SWIMLANE_COLUMNS.map((column) => {
          const items = getColumnItems(column.statuses)
          return (
            <div key={column.id} className="min-h-[100px]">
              {/* Column Header */}
              <div className="flex items-center gap-1.5 mb-2 px-1">
                <div className={cn('w-1.5 h-1.5 rounded-full', column.colorDot)} />
                <span className="text-xs font-medium text-gray-500">{column.title}</span>
                <span className="text-xs text-gray-400">({items.length})</span>
              </div>

              {/* Cards */}
              <div className="space-y-2">
                {items.map((item) => (
                  <SwimlaneCard
                    key={item.id}
                    item={item}
                    onClick={() => onCardClick?.(item)}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function KanbanSwimlaneView({ initiatives, onCardClick }: KanbanSwimlaneViewProps) {
  // Group initiatives by person
  const groupedByPerson = useMemo(() => {
    const groups: Record<string, Initiative[]> = {}

    // Initialize groups for all team members
    TEAM_MEMBERS.forEach((member) => {
      groups[member.value] = []
    })
    groups['UNASSIGNED'] = []

    // Group initiatives
    initiatives.forEach((initiative) => {
      const person = initiative.personInCharge || 'UNASSIGNED'
      if (!groups[person]) {
        groups[person] = []
      }
      groups[person].push(initiative)
    })

    return groups
  }, [initiatives])

  const unassignedInitiatives = groupedByPerson['UNASSIGNED'] || []

  return (
    <div className="space-y-4">
      {/* Team Member Swimlanes */}
      {TEAM_MEMBERS.map((member) => {
        const memberInitiatives = groupedByPerson[member.value] || []
        if (memberInitiatives.length === 0) return null

        return (
          <PersonSwimlane
            key={member.value}
            person={member}
            initiatives={memberInitiatives}
            onCardClick={onCardClick}
          />
        )
      })}

      {/* Unassigned Swimlane */}
      {unassignedInitiatives.length > 0 && (
        <div className="bg-gray-100/50 backdrop-blur-sm rounded-2xl p-4 border border-gray-200/30">
          <div className="flex items-center gap-3 mb-4">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs text-white font-medium bg-gray-400">
                ??
              </AvatarFallback>
            </Avatar>
            <h3 className="font-semibold text-gray-500">Unassigned</h3>
            <span className="text-sm text-gray-400">
              {unassignedInitiatives.length} initiative
              {unassignedInitiatives.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-3">
            {SWIMLANE_COLUMNS.map((column) => {
              const items = unassignedInitiatives
                .filter((i) => column.statuses.includes(i.status))
                .sort((a, b) => a.position - b.position)
              return (
                <div key={column.id} className="min-h-[100px]">
                  <div className="flex items-center gap-1.5 mb-2 px-1">
                    <div className={cn('w-1.5 h-1.5 rounded-full', column.colorDot)} />
                    <span className="text-xs font-medium text-gray-500">{column.title}</span>
                    <span className="text-xs text-gray-400">({items.length})</span>
                  </div>
                  <div className="space-y-2">
                    {items.map((item) => (
                      <SwimlaneCard
                        key={item.id}
                        item={item}
                        onClick={() => onCardClick?.(item)}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
