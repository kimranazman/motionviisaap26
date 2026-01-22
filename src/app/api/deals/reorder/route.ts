import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { DealStage } from '@prisma/client'
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

    // Get current deals to check for stage changes
    const dealIds = updates.map((u: { id: string }) => u.id)
    const currentDeals = await prisma.deal.findMany({
      where: { id: { in: dealIds } },
      select: { id: true, stage: true },
    })
    const currentStageMap = new Map(currentDeals.map(d => [d.id, d.stage]))

    // Use transaction for batch update
    await prisma.$transaction(
      updates.map((update: { id: string; position: number; stage?: string; lostReason?: string }) => {
        const currentStage = currentStageMap.get(update.id)
        const stageIsChanging = update.stage && currentStage !== update.stage

        return prisma.deal.update({
          where: { id: update.id },
          data: {
            position: update.position,
            ...(update.stage && { stage: update.stage as DealStage }),
            ...(update.lostReason !== undefined && { lostReason: update.lostReason || null }),
            ...(stageIsChanging && { stageChangedAt: new Date() }),
          },
        })
      })
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error reordering deals:', error)
    return NextResponse.json(
      { error: 'Failed to reorder deals' },
      { status: 500 }
    )
  }
}
