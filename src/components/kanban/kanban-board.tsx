'use client'

import { useState, useCallback, useMemo } from 'react'
import {
  DndContext,
  DragOverlay,
  pointerWithin,
  rectIntersection,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  CollisionDetection,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { KanbanColumn } from './kanban-column'
import { KanbanCard } from './kanban-card'
import { KanbanFilterBar, type DateFilter } from './kanban-filter-bar'
import { KanbanSwimlaneView } from './kanban-swimlane-view'
import { InitiativeDetailSheet } from './initiative-detail-sheet'
import { LayoutGrid, Users } from 'lucide-react'

// Date filter helper functions
function getStartOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust for Monday start
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function getEndOfWeek(date: Date): Date {
  const start = getStartOfWeek(date)
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  end.setHours(23, 59, 59, 999)
  return end
}

function getStartOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function getEndOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999)
}

function getStartOfQuarter(date: Date): Date {
  const quarter = Math.floor(date.getMonth() / 3)
  return new Date(date.getFullYear(), quarter * 3, 1)
}

function getEndOfQuarter(date: Date): Date {
  const quarter = Math.floor(date.getMonth() / 3)
  return new Date(date.getFullYear(), quarter * 3 + 3, 0, 23, 59, 59, 999)
}

function matchesDateFilter(initiative: { endDate: string; status: string }, filter: DateFilter): boolean {
  if (filter === 'all') return true

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const endDate = new Date(initiative.endDate)

  // Don't filter completed/cancelled items by date
  if (initiative.status === 'COMPLETED' || initiative.status === 'CANCELLED') {
    return filter !== 'overdue' // Show completed items except in overdue filter
  }

  switch (filter) {
    case 'overdue':
      return endDate < today
    case 'this-week': {
      const weekStart = getStartOfWeek(today)
      const weekEnd = getEndOfWeek(today)
      return endDate >= weekStart && endDate <= weekEnd
    }
    case 'this-month': {
      const monthStart = getStartOfMonth(today)
      const monthEnd = getEndOfMonth(today)
      return endDate >= monthStart && endDate <= monthEnd
    }
    case 'this-quarter': {
      const quarterStart = getStartOfQuarter(today)
      const quarterEnd = getEndOfQuarter(today)
      return endDate >= quarterStart && endDate <= quarterEnd
    }
    case 'upcoming': {
      const nextWeek = new Date(today)
      nextWeek.setDate(nextWeek.getDate() + 7)
      return endDate >= today && endDate <= nextWeek
    }
    default:
      return true
  }
}

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

interface KanbanBoardProps {
  initialData: Initiative[]
}

// Consolidated columns (6 → 4)
const COLUMNS = [
  {
    id: 'TO_DO',
    title: 'To Do',
    colorDot: 'bg-gray-400',
    statuses: ['NOT_STARTED']
  },
  {
    id: 'IN_PROGRESS',
    title: 'In Progress',
    colorDot: 'bg-blue-500',
    statuses: ['IN_PROGRESS']
  },
  {
    id: 'NEEDS_ATTENTION',
    title: 'Needs Attention',
    colorDot: 'bg-amber-500',
    statuses: ['ON_HOLD', 'AT_RISK']
  },
  {
    id: 'DONE',
    title: 'Done',
    colorDot: 'bg-green-500',
    statuses: ['COMPLETED', 'CANCELLED']
  },
]

const COLUMN_IDS = COLUMNS.map(c => c.id)

// Map from column ID to the primary status for that column (used when dropping)
const COLUMN_TO_STATUS: Record<string, string> = {
  'TO_DO': 'NOT_STARTED',
  'IN_PROGRESS': 'IN_PROGRESS',
  'NEEDS_ATTENTION': 'ON_HOLD',
  'DONE': 'COMPLETED',
}

// Map from status to column ID
const STATUS_TO_COLUMN: Record<string, string> = {
  'NOT_STARTED': 'TO_DO',
  'IN_PROGRESS': 'IN_PROGRESS',
  'ON_HOLD': 'NEEDS_ATTENTION',
  'AT_RISK': 'NEEDS_ATTENTION',
  'COMPLETED': 'DONE',
  'CANCELLED': 'DONE',
}

type ViewMode = 'board' | 'by-person'

export function KanbanBoard({ initialData }: KanbanBoardProps) {
  const [initiatives, setInitiatives] = useState(initialData)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('board')
  const [selectedInitiative, setSelectedInitiative] = useState<Initiative | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  // Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null)
  const [selectedKeyResult, setSelectedKeyResult] = useState<string | null>(null)
  const [selectedDateFilter, setSelectedDateFilter] = useState<DateFilter>('all')

  // Extract unique key results for filter dropdown
  const keyResults = useMemo(() => {
    const krSet = new Set(initiatives.map(i => i.keyResult))
    return Array.from(krSet).sort()
  }, [initiatives])

  // Filter initiatives
  const filteredInitiatives = useMemo(() => {
    return initiatives.filter(initiative => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        if (!initiative.title.toLowerCase().includes(query)) {
          return false
        }
      }

      // Person filter
      if (selectedPerson && initiative.personInCharge !== selectedPerson) {
        return false
      }

      // Key Result filter
      if (selectedKeyResult && initiative.keyResult !== selectedKeyResult) {
        return false
      }

      // Date filter
      if (!matchesDateFilter(initiative, selectedDateFilter)) {
        return false
      }

      return true
    })
  }, [initiatives, searchQuery, selectedPerson, selectedKeyResult, selectedDateFilter])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Custom collision detection that prioritizes columns
  const collisionDetection: CollisionDetection = useCallback((args) => {
    const pointerCollisions = pointerWithin(args)
    const columnCollision = pointerCollisions.find(
      collision => COLUMN_IDS.includes(collision.id as string)
    )

    if (columnCollision) {
      return [columnCollision]
    }

    const rectCollisions = rectIntersection(args)
    const itemCollision = rectCollisions.find(
      collision => !COLUMN_IDS.includes(collision.id as string)
    )

    if (itemCollision) {
      return [itemCollision]
    }

    return rectCollisions.length > 0 ? [rectCollisions[0]] : []
  }, [])

  const getColumnItems = (column: typeof COLUMNS[0]) => {
    return filteredInitiatives
      .filter(i => column.statuses.includes(i.status))
      .sort((a, b) => a.position - b.position)
  }

  const getActiveItem = () => {
    if (!activeId) return null
    return initiatives.find(i => i.id === activeId)
  }

  const handleCardClick = (item: Initiative) => {
    setSelectedInitiative(item)
    setIsSheetOpen(true)
  }

  const handleInitiativeUpdate = (updated: Initiative) => {
    setInitiatives(prev =>
      prev.map(item => (item.id === updated.id ? { ...item, ...updated } : item))
    )
    setSelectedInitiative(updated)
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    const activeItem = initiatives.find(i => i.id === activeId)
    if (!activeItem) return

    let targetColumnId: string | null = null

    if (COLUMN_IDS.includes(overId)) {
      targetColumnId = overId
    } else {
      const overItem = initiatives.find(i => i.id === overId)
      if (overItem) {
        targetColumnId = STATUS_TO_COLUMN[overItem.status]
      }
    }

    if (targetColumnId) {
      const currentColumnId = STATUS_TO_COLUMN[activeItem.status]
      if (currentColumnId !== targetColumnId) {
        const newStatus = COLUMN_TO_STATUS[targetColumnId]
        setInitiatives(prev =>
          prev.map(item =>
            item.id === activeId ? { ...item, status: newStatus } : item
          )
        )
      }
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    const activeItem = initiatives.find(i => i.id === activeId)
    if (!activeItem) return

    // Determine the final column
    let finalColumnId: string
    if (COLUMN_IDS.includes(overId)) {
      finalColumnId = overId
    } else {
      const overItem = initiatives.find(i => i.id === overId)
      finalColumnId = overItem
        ? STATUS_TO_COLUMN[overItem.status]
        : STATUS_TO_COLUMN[activeItem.status]
    }

    const finalStatus = COLUMN_TO_STATUS[finalColumnId]
    const column = COLUMNS.find(c => c.id === finalColumnId)!

    // Get current items in the target column
    const columnItems = initiatives
      .filter(i => column.statuses.includes(i.status))
      .sort((a, b) => a.position - b.position)

    // Calculate new positions
    let newColumnItems = [...columnItems]

    // If dropping on another item, reorder
    if (!COLUMN_IDS.includes(overId)) {
      const oldIndex = columnItems.findIndex(i => i.id === activeId)
      const newIndex = columnItems.findIndex(i => i.id === overId)

      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        newColumnItems = arrayMove(columnItems, oldIndex, newIndex)
      }
    }

    // Build updates with new positions
    const updates = newColumnItems.map((item, index) => ({
      id: item.id,
      position: index,
      status: item.id === activeId ? finalStatus : item.status,
    }))

    // Update local state with final positions
    setInitiatives(prev => {
      const updated = new Map(updates.map(u => [u.id, u]))
      return prev.map(item => {
        const update = updated.get(item.id)
        if (update) {
          return { ...item, position: update.position, status: update.status }
        }
        return item
      })
    })

    // Persist to server
    try {
      const response = await fetch('/api/initiatives/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      })

      if (!response.ok) {
        console.error('Failed to save reorder:', await response.text())
      }
    } catch (error) {
      console.error('Failed to save reorder:', error)
    }
  }

  return (
    <div className="space-y-4">
      {/* Filter Bar and View Toggle */}
      <div className="flex items-center justify-between gap-4">
        <KanbanFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedPerson={selectedPerson}
          onPersonChange={setSelectedPerson}
          selectedKeyResult={selectedKeyResult}
          onKeyResultChange={setSelectedKeyResult}
          keyResults={keyResults}
          selectedDateFilter={selectedDateFilter}
          onDateFilterChange={setSelectedDateFilter}
        />

        {/* View Toggle */}
        <Tabs
          value={viewMode}
          onValueChange={(v) => setViewMode(v as ViewMode)}
          className="shrink-0"
        >
          <TabsList className="bg-white/70 backdrop-blur-xl border border-gray-200/50">
            <TabsTrigger value="board" className="gap-1.5 data-[state=active]:bg-white">
              <LayoutGrid className="h-4 w-4" />
              Board
            </TabsTrigger>
            <TabsTrigger value="by-person" className="gap-1.5 data-[state=active]:bg-white">
              <Users className="h-4 w-4" />
              By Person
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Board View */}
      {viewMode === 'board' && (
        <DndContext
          sensors={sensors}
          collisionDetection={collisionDetection}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 min-w-max pb-4">
            {COLUMNS.map(column => {
              const items = getColumnItems(column)
              return (
                <KanbanColumn
                  key={column.id}
                  id={column.id}
                  title={column.title}
                  colorDot={column.colorDot}
                  count={items.length}
                >
                  <SortableContext
                    items={items.map(i => i.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {items.map(item => (
                      <KanbanCard
                        key={item.id}
                        item={item}
                        onClick={() => handleCardClick(item)}
                      />
                    ))}
                  </SortableContext>
                </KanbanColumn>
              )
            })}
          </div>

          <DragOverlay>
            {activeId ? (
              <KanbanCard item={getActiveItem()!} isDragging />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* By Person View */}
      {viewMode === 'by-person' && (
        <KanbanSwimlaneView
          initiatives={filteredInitiatives}
          onCardClick={handleCardClick}
        />
      )}

      {/* Initiative Detail Sheet */}
      <InitiativeDetailSheet
        initiative={selectedInitiative}
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        onUpdate={handleInitiativeUpdate}
      />
    </div>
  )
}
