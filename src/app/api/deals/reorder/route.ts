import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { DealStage, ProjectStatus } from '@prisma/client'
import { requireEditor } from '@/lib/auth-utils'

// PATCH /api/deals/reorder - Reorder deals (for Kanban)
export async function PATCH(request: NextRequest) {
  const { error } = await requireEditor()
  if (error) return error

  try {
    const body = await request.json()
    const { updates } = body

    // Updates should be an array of { id, position, stage?, lostReason? }
    if (!Array.isArray(updates)) {
      return NextResponse.json(
        { error: 'Updates must be an array' },
        { status: 400 }
      )
    }

    // Get current deals to check for stage changes and for project creation
    const dealIds = updates.map((u: { id: string }) => u.id)
    const currentDeals = await prisma.deal.findMany({
      where: { id: { in: dealIds } },
      select: {
        id: true,
        stage: true,
        title: true,
        value: true,
        companyId: true,
        contactId: true,
        projectId: true,
      },
    })
    const currentDealMap = new Map(currentDeals.map(d => [d.id, d]))

    // Track if a project was created
    let projectCreated: { id: string; title: string } | undefined

    // Use interactive transaction for sequential operations (project creation + deal update)
    await prisma.$transaction(async (tx) => {
      for (const update of updates as { id: string; position: number; stage?: string; lostReason?: string }[]) {
        const currentDeal = currentDealMap.get(update.id)
        if (!currentDeal) continue

        const stageIsChanging = update.stage && currentDeal.stage !== update.stage
        const isMovingToWon = update.stage === 'WON' && currentDeal.stage !== 'WON'
        const needsProjectCreation = isMovingToWon && !currentDeal.projectId

        if (needsProjectCreation) {
          // Create a new project linked to this deal
          const project = await tx.project.create({
            data: {
              title: currentDeal.title,
              description: null,
              revenue: currentDeal.value,
              status: ProjectStatus.DRAFT,
              companyId: currentDeal.companyId,
              contactId: currentDeal.contactId,
            },
          })

          // Update deal with position, stage, and link to new project
          await tx.deal.update({
            where: { id: update.id },
            data: {
              position: update.position,
              stage: 'WON',
              stageChangedAt: new Date(),
              projectId: project.id,
              ...(update.lostReason !== undefined && { lostReason: update.lostReason || null }),
            },
          })

          projectCreated = { id: project.id, title: project.title }
        } else {
          // Standard update (no project creation needed)
          await tx.deal.update({
            where: { id: update.id },
            data: {
              position: update.position,
              ...(update.stage && { stage: update.stage as DealStage }),
              ...(update.lostReason !== undefined && { lostReason: update.lostReason || null }),
              ...(stageIsChanging && { stageChangedAt: new Date() }),
            },
          })
        }
      }
    })

    return NextResponse.json({ success: true, projectCreated })
  } catch (error) {
    console.error('Error reordering deals:', error)
    return NextResponse.json(
      { error: 'Failed to reorder deals' },
      { status: 500 }
    )
  }
}
