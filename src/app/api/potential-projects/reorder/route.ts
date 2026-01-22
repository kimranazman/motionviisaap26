import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { PotentialStage } from '@prisma/client'
import { requireEditor } from '@/lib/auth-utils'

// PATCH /api/potential-projects/reorder - Reorder potential projects (for Kanban)
export async function PATCH(request: NextRequest) {
  const { error } = await requireEditor()
  if (error) return error

  try {
    const body = await request.json()
    const { updates } = body

    // Updates should be an array of { id, position, stage? }
    if (!Array.isArray(updates)) {
      return NextResponse.json(
        { error: 'Updates must be an array' },
        { status: 400 }
      )
    }

    // Get current potential projects to check for stage changes
    const projectIds = updates.map((u: { id: string }) => u.id)
    const currentProjects = await prisma.potentialProject.findMany({
      where: { id: { in: projectIds } },
      select: { id: true, stage: true },
    })
    const currentStageMap = new Map(currentProjects.map(p => [p.id, p.stage]))

    // Use transaction for batch update
    await prisma.$transaction(
      updates.map((update: { id: string; position: number; stage?: string }) => {
        const currentStage = currentStageMap.get(update.id)
        const stageIsChanging = update.stage && currentStage !== update.stage

        return prisma.potentialProject.update({
          where: { id: update.id },
          data: {
            position: update.position,
            ...(update.stage && { stage: update.stage as PotentialStage }),
            ...(stageIsChanging && { stageChangedAt: new Date() }),
          },
        })
      })
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error reordering potential projects:', error)
    return NextResponse.json(
      { error: 'Failed to reorder potential projects' },
      { status: 500 }
    )
  }
}
