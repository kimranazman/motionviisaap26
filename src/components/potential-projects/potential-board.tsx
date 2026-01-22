'use client'

import { useState, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
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
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PotentialColumn } from './potential-column'
import { PotentialCard } from './potential-card'
import { PotentialFormModal } from './potential-form-modal'
import { PotentialDetailSheet } from './potential-detail-sheet'
import { PotentialMetrics } from './potential-metrics'
import { POTENTIAL_STAGES } from '@/lib/potential-utils'
import { canEdit } from '@/lib/permissions'

interface PotentialProject {
  id: string
  title: string
  description: string | null
  estimatedValue: number | null
  stage: string
  position: number
  company: { id: string; name: string } | null
  contact: { id: string; name: string } | null
}

interface PotentialBoardProps {
  initialData: PotentialProject[]
}

const STAGE_IDS: string[] = POTENTIAL_STAGES.map(s => s.id)

export function PotentialBoard({ initialData }: PotentialBoardProps) {
  const { data: session } = useSession()
  const userCanEdit = canEdit(session?.user?.role)

  const [projects, setProjects] = useState(initialData)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState<PotentialProject | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  // Track original stage before drag for reverting
  const originalStageRef = useRef<string | null>(null)

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
      collision => STAGE_IDS.includes(collision.id as string)
    )

    if (columnCollision) {
      return [columnCollision]
    }

    const rectCollisions = rectIntersection(args)
    const itemCollision = rectCollisions.find(
      collision => !STAGE_IDS.includes(collision.id as string)
    )

    if (itemCollision) {
      return [itemCollision]
    }

    return rectCollisions.length > 0 ? [rectCollisions[0]] : []
  }, [])

  const getStageProjects = (stageId: string) => {
    return projects
      .filter(p => p.stage === stageId)
      .sort((a, b) => a.position - b.position)
  }

  const getStageTotalValue = (stageId: string) => {
    return projects
      .filter(p => p.stage === stageId)
      .reduce((sum, p) => sum + (p.estimatedValue || 0), 0)
  }

  const getActiveItem = () => {
    if (!activeId) return null
    return projects.find(p => p.id === activeId)
  }

  const handleDragStart = (event: DragStartEvent) => {
    const projectId = event.active.id as string
    const project = projects.find(p => p.id === projectId)
    if (project) {
      originalStageRef.current = project.stage
    }
    setActiveId(projectId)
  }

  const handleCreateSuccess = (newProject: PotentialProject) => {
    setProjects((prev) => [...prev, newProject])
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    const activeProject = projects.find(p => p.id === activeId)
    if (!activeProject) return

    let targetStageId: string | null = null

    if (STAGE_IDS.includes(overId)) {
      targetStageId = overId
    } else {
      const overProject = projects.find(p => p.id === overId)
      if (overProject) {
        targetStageId = overProject.stage
      }
    }

    if (targetStageId && activeProject.stage !== targetStageId) {
      setProjects(prev =>
        prev.map(item =>
          item.id === activeId ? { ...item, stage: targetStageId! } : item
        )
      )
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) {
      // Revert to original stage if dropped outside
      if (originalStageRef.current) {
        setProjects(prev =>
          prev.map(item =>
            item.id === active.id
              ? { ...item, stage: originalStageRef.current! }
              : item
          )
        )
      }
      originalStageRef.current = null
      return
    }

    const draggedProjectId = active.id as string
    const overId = over.id as string

    const activeProject = projects.find(p => p.id === draggedProjectId)
    if (!activeProject) {
      originalStageRef.current = null
      return
    }

    // Determine the final stage
    let finalStageId: string
    if (STAGE_IDS.includes(overId)) {
      finalStageId = overId
    } else {
      const overProject = projects.find(p => p.id === overId)
      finalStageId = overProject ? overProject.stage : activeProject.stage
    }

    // Get current items in the target stage
    const stageProjects = projects
      .filter(p => p.stage === finalStageId)
      .sort((a, b) => a.position - b.position)

    // Calculate new positions
    let newStageProjects = [...stageProjects]

    // If dropping on another item, reorder
    if (!STAGE_IDS.includes(overId)) {
      const oldIndex = stageProjects.findIndex(p => p.id === draggedProjectId)
      const newIndex = stageProjects.findIndex(p => p.id === overId)

      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        newStageProjects = arrayMove(stageProjects, oldIndex, newIndex)
      }
    }

    // Build updates with new positions
    const updates = newStageProjects.map((project, index) => ({
      id: project.id,
      position: index,
      stage: project.id === draggedProjectId ? finalStageId : project.stage,
    }))

    // Update local state with final positions
    setProjects(prev => {
      const updated = new Map(updates.map(u => [u.id, u]))
      return prev.map(project => {
        const update = updated.get(project.id)
        if (update) {
          return { ...project, position: update.position, stage: update.stage }
        }
        return project
      })
    })

    originalStageRef.current = null

    // Persist to server
    try {
      const response = await fetch('/api/potential-projects/reorder', {
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

  const handleCardClick = (project: PotentialProject) => {
    setSelectedProject(project)
    setIsSheetOpen(true)
  }

  const handleProjectUpdate = (updatedProject: PotentialProject) => {
    setProjects(prev =>
      prev.map(p => (p.id === updatedProject.id ? updatedProject : p))
    )
  }

  const handleProjectDelete = (projectId: string) => {
    setProjects(prev => prev.filter(p => p.id !== projectId))
  }

  return (
    <>
      {/* Header with Add Project button */}
      <div className="flex justify-between items-center mb-4">
        <div /> {/* Spacer for alignment */}
        {userCanEdit && (
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Project
          </Button>
        )}
      </div>

      {/* Potential Metrics */}
      <PotentialMetrics projects={projects} />

      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 min-w-max pb-4 overflow-x-auto">
          {POTENTIAL_STAGES.map(stage => {
            const stageProjects = getStageProjects(stage.id)
            const totalValue = getStageTotalValue(stage.id)
            return (
              <PotentialColumn
                key={stage.id}
                id={stage.id}
                title={stage.title}
                colorDot={stage.colorDot}
                count={stageProjects.length}
                totalValue={totalValue}
              >
                <SortableContext
                  items={stageProjects.map(p => p.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {stageProjects.map(project => (
                    <PotentialCard
                      key={project.id}
                      project={project}
                      canEdit={userCanEdit}
                      onClick={() => handleCardClick(project)}
                    />
                  ))}
                </SortableContext>
              </PotentialColumn>
            )
          })}
        </div>

        <DragOverlay>
          {activeId ? (
            <PotentialCard
              project={getActiveItem()!}
              isDragging
              canEdit={userCanEdit}
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Create Project Modal */}
      <PotentialFormModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onSuccess={handleCreateSuccess}
      />

      {/* Project Detail Sheet */}
      <PotentialDetailSheet
        project={selectedProject}
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        onUpdate={handleProjectUpdate}
        onDelete={handleProjectDelete}
      />
    </>
  )
}
