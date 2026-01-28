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
import { ProjectKanbanColumn } from './project-kanban-column'
import { ProjectKanbanCard, type ProjectForKanban } from './project-kanban-card'
import { cn } from '@/lib/utils'

const PROJECT_COLUMNS = [
  { id: 'DRAFT', title: 'Draft', colorDot: 'bg-gray-400' },
  { id: 'ACTIVE', title: 'Active', colorDot: 'bg-blue-500' },
  { id: 'COMPLETED', title: 'Completed', colorDot: 'bg-green-500' },
  { id: 'CANCELLED', title: 'Cancelled', colorDot: 'bg-red-400' },
]
const COLUMN_IDS = PROJECT_COLUMNS.map(c => c.id)

interface ProjectsKanbanBoardProps {
  projects: ProjectForKanban[]
  onProjectClick: (project: ProjectForKanban) => void
  onProjectsChange: (projects: ProjectForKanban[]) => void
}

export function ProjectsKanbanBoard({
  projects,
  onProjectClick,
  onProjectsChange,
}: ProjectsKanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  // Sensors configuration (same pattern as task-kanban-view.tsx)
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

  const getColumnProjects = (columnId: string) => {
    return projects.filter(p => p.status === columnId)
  }

  const getActiveProject = () => {
    if (!activeId) return null
    return projects.find(p => p.id === activeId) || null
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

    const activeProject = projects.find(p => p.id === draggedId)
    if (!activeProject) return

    let targetColumnId: string | null = null

    if (COLUMN_IDS.includes(overId)) {
      targetColumnId = overId
    } else {
      const overProject = projects.find(p => p.id === overId)
      if (overProject) {
        targetColumnId = overProject.status
      }
    }

    if (targetColumnId && activeProject.status !== targetColumnId) {
      // Optimistic status update during drag
      const updatedProjects = projects.map(p =>
        p.id === draggedId ? { ...p, status: targetColumnId as string } : p
      )
      onProjectsChange(updatedProjects)
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    setIsDragging(false)

    if (!over) return

    const draggedId = active.id as string
    const overId = over.id as string

    const project = projects.find(p => p.id === draggedId)
    if (!project) return

    // Determine the final column
    let finalStatus: string
    if (COLUMN_IDS.includes(overId)) {
      finalStatus = overId
    } else {
      const overProject = projects.find(p => p.id === overId)
      finalStatus = overProject ? overProject.status : project.status
    }

    // Ensure final state is correct
    if (project.status !== finalStatus) {
      const updatedProjects = projects.map(p =>
        p.id === draggedId ? { ...p, status: finalStatus } : p
      )
      onProjectsChange(updatedProjects)
    }

    // Persist via PATCH API
    try {
      await fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: finalStatus }),
      })
    } catch (error) {
      console.error('Failed to update project status:', error)
    }
  }

  const activeProject = getActiveProject()

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
        {PROJECT_COLUMNS.map(column => {
          const columnProjects = getColumnProjects(column.id)
          return (
            <ProjectKanbanColumn
              key={column.id}
              id={column.id}
              title={column.title}
              colorDot={column.colorDot}
              count={columnProjects.length}
            >
              <SortableContext
                items={columnProjects.map(p => p.id)}
                strategy={verticalListSortingStrategy}
              >
                {columnProjects.map(project => (
                  <ProjectKanbanCard
                    key={project.id}
                    project={project}
                    onClick={() => onProjectClick(project)}
                  />
                ))}
              </SortableContext>
            </ProjectKanbanColumn>
          )
        })}
      </div>

      <DragOverlay>
        {activeProject ? (
          <ProjectKanbanCard
            project={activeProject}
            isDragging
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
