'use client'

import { useState, useCallback } from 'react'
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
import { PipelineColumn } from './pipeline-column'
import { PipelineCard } from './pipeline-card'
import { DealFormModal } from './deal-form-modal'
import { STAGES } from '@/lib/pipeline-utils'
import { canEdit } from '@/lib/permissions'

interface Deal {
  id: string
  title: string
  description: string | null
  value: number | null
  stage: string
  position: number
  company: { id: string; name: string } | null
  contact: { id: string; name: string } | null
}

interface PipelineBoardProps {
  initialData: Deal[]
}

const STAGE_IDS: string[] = STAGES.map(s => s.id)

export function PipelineBoard({ initialData }: PipelineBoardProps) {
  const { data: session } = useSession()
  const userCanEdit = canEdit(session?.user?.role)

  const [deals, setDeals] = useState(initialData)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

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

  const getStageDeals = (stageId: string) => {
    return deals
      .filter(d => d.stage === stageId)
      .sort((a, b) => a.position - b.position)
  }

  const getStageTotalValue = (stageId: string) => {
    return deals
      .filter(d => d.stage === stageId)
      .reduce((sum, d) => sum + (d.value || 0), 0)
  }

  const getActiveItem = () => {
    if (!activeId) return null
    return deals.find(d => d.id === activeId)
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleCreateSuccess = (newDeal: Deal) => {
    setDeals((prev) => [...prev, newDeal])
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    const activeDeal = deals.find(d => d.id === activeId)
    if (!activeDeal) return

    let targetStageId: string | null = null

    if (STAGE_IDS.includes(overId)) {
      targetStageId = overId
    } else {
      const overDeal = deals.find(d => d.id === overId)
      if (overDeal) {
        targetStageId = overDeal.stage
      }
    }

    if (targetStageId && activeDeal.stage !== targetStageId) {
      setDeals(prev =>
        prev.map(item =>
          item.id === activeId ? { ...item, stage: targetStageId! } : item
        )
      )
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    const activeDeal = deals.find(d => d.id === activeId)
    if (!activeDeal) return

    // Determine the final stage
    let finalStageId: string
    if (STAGE_IDS.includes(overId)) {
      finalStageId = overId
    } else {
      const overDeal = deals.find(d => d.id === overId)
      finalStageId = overDeal ? overDeal.stage : activeDeal.stage
    }

    // Get current items in the target stage
    const stageDeals = deals
      .filter(d => d.stage === finalStageId)
      .sort((a, b) => a.position - b.position)

    // Calculate new positions
    let newStageDeals = [...stageDeals]

    // If dropping on another item, reorder
    if (!STAGE_IDS.includes(overId)) {
      const oldIndex = stageDeals.findIndex(d => d.id === activeId)
      const newIndex = stageDeals.findIndex(d => d.id === overId)

      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        newStageDeals = arrayMove(stageDeals, oldIndex, newIndex)
      }
    }

    // Build updates with new positions
    const updates = newStageDeals.map((deal, index) => ({
      id: deal.id,
      position: index,
      stage: deal.id === activeId ? finalStageId : deal.stage,
    }))

    // Update local state with final positions
    setDeals(prev => {
      const updated = new Map(updates.map(u => [u.id, u]))
      return prev.map(deal => {
        const update = updated.get(deal.id)
        if (update) {
          return { ...deal, position: update.position, stage: update.stage }
        }
        return deal
      })
    })

    // Persist to server
    try {
      const response = await fetch('/api/deals/reorder', {
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
    <>
      {/* Header with Add Deal button */}
      <div className="flex justify-between items-center mb-4">
        <div /> {/* Spacer for alignment */}
        {userCanEdit && (
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Deal
          </Button>
        )}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 min-w-max pb-4 overflow-x-auto">
        {STAGES.map(stage => {
          const stageDeals = getStageDeals(stage.id)
          const totalValue = getStageTotalValue(stage.id)
          return (
            <PipelineColumn
              key={stage.id}
              id={stage.id}
              title={stage.title}
              colorDot={stage.colorDot}
              count={stageDeals.length}
              totalValue={totalValue}
            >
              <SortableContext
                items={stageDeals.map(d => d.id)}
                strategy={verticalListSortingStrategy}
              >
                {stageDeals.map(deal => (
                  <PipelineCard
                    key={deal.id}
                    deal={deal}
                    canEdit={userCanEdit}
                  />
                ))}
              </SortableContext>
            </PipelineColumn>
          )
        })}
      </div>

      <DragOverlay>
        {activeId ? (
          <PipelineCard
            deal={getActiveItem()!}
            isDragging
            canEdit={userCanEdit}
          />
        ) : null}
      </DragOverlay>
    </DndContext>

      {/* Create Deal Modal */}
      <DealFormModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onSuccess={handleCreateSuccess}
      />
    </>
  )
}
