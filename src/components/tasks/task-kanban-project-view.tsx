'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
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
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { ProjectTasksSection } from './project-tasks-section'
import { TaskKanbanCard } from './task-kanban-card'
import type { CrossProjectTask } from './tasks-page-client'

const STATUS_IDS = ['TODO', 'IN_PROGRESS', 'DONE']

interface TaskKanbanProjectViewProps {
  tasks: CrossProjectTask[]
  onTaskClick: (task: CrossProjectTask) => void
  onTasksChange: (tasks: CrossProjectTask[]) => void
}

export function TaskKanbanProjectView({
  tasks,
  onTaskClick,
  onTasksChange,
}: TaskKanbanProjectViewProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set())
  const [initialized, setInitialized] = useState(false)

  // Get all project IDs from tasks
  const projectIds = useMemo(() => {
    const ids = new Set<string>()
    tasks.forEach(t => {
      if (t.projectId) {
        ids.add(t.projectId)
      }
    })
    // Add 'no-project' if there are orphan tasks
    if (tasks.some(t => !t.projectId)) {
      ids.add('no-project')
    }
    return ids
  }, [tasks])

  // Auto-expand all projects on initial load
  useEffect(() => {
    if (!initialized && projectIds.size > 0) {
      setExpandedProjects(new Set(projectIds))
      setInitialized(true)
    }
  }, [projectIds, initialized])

  // Group tasks by project
  const tasksByProject = useMemo(() => {
    const groups = new Map<string, { title: string; tasks: CrossProjectTask[] }>()

    tasks.forEach(task => {
      const key = task.projectId || 'no-project'
      const title = task.project?.title || 'No Project'

      if (!groups.has(key)) {
        groups.set(key, { title, tasks: [] })
      }
      groups.get(key)!.tasks.push(task)
    })

    // Sort by project title (alphabetically), but keep "No Project" at the end
    return Array.from(groups.entries())
      .sort((a, b) => {
        if (a[0] === 'no-project') return 1
        if (b[0] === 'no-project') return -1
        return a[1].title.localeCompare(b[1].title)
      })
  }, [tasks])

  // Build list of all valid column IDs for collision detection
  const allColumnIds = useMemo(() => {
    const ids: string[] = []
    tasksByProject.forEach(([projectId]) => {
      STATUS_IDS.forEach(status => {
        ids.push(`${projectId}:${status}`)
      })
    })
    return ids
  }, [tasksByProject])

  // Sensors (same pattern as task-kanban-view.tsx)
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
      collision => allColumnIds.includes(collision.id as string)
    )

    if (columnCollision) {
      return [columnCollision]
    }

    const rectCollisions = rectIntersection(args)
    const itemCollision = rectCollisions.find(
      collision => !allColumnIds.includes(collision.id as string)
    )

    if (itemCollision) {
      return [itemCollision]
    }

    return rectCollisions.length > 0 ? [rectCollisions[0]] : []
  }, [allColumnIds])

  const getActiveTask = () => {
    if (!activeId) return null
    return tasks.find(t => t.id === activeId) || null
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const draggedId = active.id as string
    const overId = over.id as string

    const activeTask = tasks.find(t => t.id === draggedId)
    if (!activeTask) return

    // Parse target column ID to get status
    let targetStatus: string | null = null

    if (allColumnIds.includes(overId)) {
      // Dropped on a column - parse the status from composite ID
      const parts = overId.split(':')
      targetStatus = parts[parts.length - 1] // Status is always last part
    } else {
      // Dropped on another task - get that task's status
      const overTask = tasks.find(t => t.id === overId)
      if (overTask) {
        targetStatus = overTask.status
      }
    }

    if (targetStatus && activeTask.status !== targetStatus) {
      // Optimistic status update during drag
      const updatedTasks = tasks.map(t =>
        t.id === draggedId ? { ...t, status: targetStatus as CrossProjectTask['status'] } : t
      )
      onTasksChange(updatedTasks)
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const draggedId = active.id as string
    const overId = over.id as string

    const task = tasks.find(t => t.id === draggedId)
    if (!task) return

    // Determine the final status
    let finalStatus: string

    if (allColumnIds.includes(overId)) {
      const parts = overId.split(':')
      finalStatus = parts[parts.length - 1]
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

  const toggleProject = (projectId: string) => {
    setExpandedProjects(prev => {
      const next = new Set(prev)
      if (next.has(projectId)) {
        next.delete(projectId)
      } else {
        next.add(projectId)
      }
      return next
    })
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
      <div className="space-y-4">
        {tasksByProject.map(([projectId, group]) => (
          <ProjectTasksSection
            key={projectId}
            projectId={projectId === 'no-project' ? null : projectId}
            projectTitle={group.title}
            tasks={group.tasks}
            isExpanded={expandedProjects.has(projectId)}
            onToggle={() => toggleProject(projectId)}
            onTaskClick={onTaskClick}
          />
        ))}

        {tasksByProject.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No tasks to display
          </div>
        )}
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
