'use client'

import { useState, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
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
import { DealDetailSheet } from './deal-detail-sheet'
import { LostReasonDialog } from './lost-reason-dialog'
import { PipelineMetrics } from './pipeline-metrics'
import { STAGES } from '@/lib/pipeline-utils'
import { canEdit } from '@/lib/permissions'
import { cn } from '@/lib/utils'

interface Deal {
  id: string
  title: string
  description: string | null
  value: number | null
  stage: string
  lostReason?: string | null
  position: number
  company: { id: string; name: string } | null
  contact: { id: string; name: string } | null
}

interface PendingLostDeal {
  deal: Deal
  originalStage: string
  updates: { id: string; position: number; stage: string }[]
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
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [pendingLostDeal, setPendingLostDeal] = useState<PendingLostDeal | null>(null)

  // Track original stage before drag for reverting
  const originalStageRef = useRef<string | null>(null)

  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: { distance: 5 },
  })

  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 250,     // 250ms hold before drag starts
      tolerance: 5,   // 5px movement allowed during delay
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
    const dealId = event.active.id as string
    const deal = deals.find(d => d.id === dealId)
    if (deal) {
      originalStageRef.current = deal.stage
    }
    setActiveId(dealId)
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

    if (!over) {
      // Revert to original stage if dropped outside
      if (originalStageRef.current) {
        setDeals(prev =>
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

    const draggedDealId = active.id as string
    const overId = over.id as string

    const activeDeal = deals.find(d => d.id === draggedDealId)
    if (!activeDeal) {
      originalStageRef.current = null
      return
    }

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
      const oldIndex = stageDeals.findIndex(d => d.id === draggedDealId)
      const newIndex = stageDeals.findIndex(d => d.id === overId)

      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        newStageDeals = arrayMove(stageDeals, oldIndex, newIndex)
      }
    }

    // Build updates with new positions
    const updates = newStageDeals.map((deal, index) => ({
      id: deal.id,
      position: index,
      stage: deal.id === draggedDealId ? finalStageId : deal.stage,
    }))

    // Check if moving to LOST stage
    if (finalStageId === 'LOST' && originalStageRef.current !== 'LOST') {
      // Set pending lost deal and don't complete the move yet
      setPendingLostDeal({
        deal: activeDeal,
        originalStage: originalStageRef.current || activeDeal.stage,
        updates,
      })
      originalStageRef.current = null
      return
    }

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

    originalStageRef.current = null

    // Persist to server
    try {
      const response = await fetch('/api/deals/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      })

      if (!response.ok) {
        console.error('Failed to save reorder:', await response.text())
      } else {
        // Check if a project was created (deal moved to WON)
        const data = await response.json()
        if (data.projectCreated) {
          // TODO: Replace with sonner toast when available
          console.log(`Project created: ${data.projectCreated.title}`)
        }
      }
    } catch (error) {
      console.error('Failed to save reorder:', error)
    }
  }

  const handleLostConfirm = async (reason: string) => {
    if (!pendingLostDeal) return

    const { updates, deal } = pendingLostDeal

    // Add lostReason to the update for the dragged deal
    const updatesWithReason = updates.map(u => ({
      ...u,
      ...(u.id === deal.id ? { lostReason: reason } : {}),
    }))

    // Update local state
    setDeals(prev => {
      const updated = new Map(updatesWithReason.map(u => [u.id, u]))
      return prev.map(d => {
        const update = updated.get(d.id)
        if (update) {
          return {
            ...d,
            position: update.position,
            stage: update.stage,
            ...(d.id === deal.id ? { lostReason: reason } : {}),
          }
        }
        return d
      })
    })

    setPendingLostDeal(null)

    // Persist to server with lostReason
    try {
      const response = await fetch('/api/deals/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates: updatesWithReason }),
      })

      if (!response.ok) {
        console.error('Failed to save reorder:', await response.text())
      } else {
        // Check if a project was created (in case moving to other stages before lost)
        const data = await response.json()
        if (data.projectCreated) {
          // TODO: Replace with sonner toast when available
          console.log(`Project created: ${data.projectCreated.title}`)
        }
      }
    } catch (error) {
      console.error('Failed to save reorder:', error)
    }
  }

  const handleLostCancel = () => {
    if (!pendingLostDeal) return

    // Revert the deal to its original stage
    setDeals(prev =>
      prev.map(d =>
        d.id === pendingLostDeal.deal.id
          ? { ...d, stage: pendingLostDeal.originalStage }
          : d
      )
    )

    setPendingLostDeal(null)
  }

  const handleCardClick = (deal: Deal) => {
    setSelectedDeal(deal)
    setIsSheetOpen(true)
  }

  const handleDealUpdate = (updatedDeal: Deal) => {
    setDeals(prev =>
      prev.map(d => (d.id === updatedDeal.id ? updatedDeal : d))
    )
  }

  const handleDealDelete = (dealId: string) => {
    setDeals(prev => prev.filter(d => d.id !== dealId))
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

      {/* Pipeline Metrics */}
      <PipelineMetrics deals={deals} />

      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className={cn(
          "flex gap-4 pb-4",
          // Mobile: horizontal scroll with snap
          "overflow-x-auto snap-x snap-mandatory overscroll-x-contain",
          // Desktop: standard min-width
          "md:min-w-max md:snap-none"
        )}>
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
                      onClick={() => handleCardClick(deal)}
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

      {/* Deal Detail Sheet */}
      <DealDetailSheet
        deal={selectedDeal}
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        onUpdate={handleDealUpdate}
        onDelete={handleDealDelete}
      />

      {/* Lost Reason Dialog */}
      <LostReasonDialog
        open={pendingLostDeal !== null}
        onConfirm={handleLostConfirm}
        onCancel={handleLostCancel}
      />
    </>
  )
}
