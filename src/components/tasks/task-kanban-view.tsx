'use client'

import { useState, useCallback } from 'react'
import {
  DndContext,
  DragOverlay,
  pointerWithin,
  rectIntersection,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  CollisionDetection,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { TaskKanbanColumn } from './task-kanban-column'
import { TaskKanbanCard } from './task-kanban-card'
import { cn } from '@/lib/utils'
import type { CrossProjectTask } from './tasks-page-client'

const TASK_COLUMNS = [
  { id: 'TODO', title: 'To Do', colorDot: 'bg-gray-400' },
  { id: 'IN_PROGRESS', title: 'In Progress', colorDot: 'bg-blue-500' },
  { id: 'DONE', title: 'Done', colorDot: 'bg-green-500' },
]
const COLUMN_IDS = TASK_COLUMNS.map(c => c.id)

interface TaskKanbanViewProps {
  tasks: CrossProjectTask[]
  onTaskClick: (task: CrossProjectTask) => void
  onTasksChange: (tasks: CrossProjectTask[]) => void
}

export function TaskKanbanView({ tasks, onTaskClick, onTasksChange }: TaskKanbanViewProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  // Sensors (same pattern as kanban-board.tsx)
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: { distance: 5 },
  })
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 250,
      tolerance: 5,
    },
  })
  const keyboardSensor = useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates,
  })
  const sensors = useSensors(mouseSensor, touchSensor, keyboardSensor)

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

  const getColumnTasks = (columnId: string) => {
    return tasks.filter(t => t.status === columnId)
  }

  const getActiveTask = () => {
    if (!activeId) return null
    return tasks.find(t => t.id === activeId) || null
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
    setIsDragging(true)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const draggedId = active.id as string
    const overId = over.id as string

    const activeTask = tasks.find(t => t.id === draggedId)
    if (!activeTask) return

    let targetColumnId: string | null = null

    if (COLUMN_IDS.includes(overId)) {
      targetColumnId = overId
    } else {
      const overTask = tasks.find(t => t.id === overId)
      if (overTask) {
        targetColumnId = overTask.status
      }
    }

    if (targetColumnId && activeTask.status !== targetColumnId) {
      // Optimistic status update during drag
      const updatedTasks = tasks.map(t =>
        t.id === draggedId ? { ...t, status: targetColumnId as CrossProjectTask['status'] } : t
      )
      onTasksChange(updatedTasks)
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    setIsDragging(false)

    if (!over) return

    const draggedId = active.id as string
    const overId = over.id as string

    const task = tasks.find(t => t.id === draggedId)
    if (!task) return

    // Determine the final column
    let finalStatus: string
    if (COLUMN_IDS.includes(overId)) {
      finalStatus = overId
    } else {
      const overTask = tasks.find(t => t.id === overId)
      finalStatus = overTask ? overTask.status : task.status
    }

    // Ensure final state is correct
    if (task.status !== finalStatus) {
      const updatedTasks = tasks.map(t =>
        t.id === draggedId ? { ...t, status: finalStatus as CrossProjectTask['status'] } : t
      )
      onTasksChange(updatedTasks)
    }

    // Persist via the project-scoped API
    // Find the original task to check if status actually changed from what's persisted
    try {
      await fetch(`/api/projects/${task.projectId}/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: finalStatus }),
      })
    } catch (error) {
      console.error('Failed to update task status:', error)
    }
  }

  const activeTask = getActiveTask()

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      autoScroll={{
        threshold: { x: 0.1, y: 0.1 },
        acceleration: 5,
        interval: 10,
      }}
    >
      <div
        className={cn(
          'flex gap-4 pb-4 pl-1',
          // Mobile: horizontal scroll with snap (disabled during drag)
          'overflow-x-auto scroll-pl-1',
          !isDragging && 'snap-x snap-mandatory',
          // Smooth scrolling for iOS
          '[&::-webkit-scrollbar]:hidden [-webkit-overflow-scrolling:touch]',
          // Desktop: standard min-width, no snap
          'md:min-w-max md:snap-none md:pl-0 md:scroll-pl-0'
        )}
      >
        {TASK_COLUMNS.map(column => {
          const columnTasks = getColumnTasks(column.id)
          return (
            <TaskKanbanColumn
              key={column.id}
              id={column.id}
              title={column.title}
              colorDot={column.colorDot}
              count={columnTasks.length}
            >
              <SortableContext
                items={columnTasks.map(t => t.id)}
                strategy={verticalListSortingStrategy}
              >
                {columnTasks.map(task => (
                  <TaskKanbanCard
                    key={task.id}
                    task={task}
                    onClick={() => onTaskClick(task)}
                  />
                ))}
              </SortableContext>
            </TaskKanbanColumn>
          )
        })}
      </div>

      <DragOverlay>
        {activeTask ? (
          <TaskKanbanCard
            task={activeTask}
            isDragging
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
