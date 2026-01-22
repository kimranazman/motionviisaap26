import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { PotentialStage, ProjectStatus } from '@prisma/client'
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

    // Get current potential projects to check for stage changes and for project creation
    const potentialIds = updates.map((u: { id: string }) => u.id)
    const currentPotentials = await prisma.potentialProject.findMany({
      where: { id: { in: potentialIds } },
      select: {
        id: true,
        stage: true,
        title: true,
        description: true,
        estimatedValue: true,
        companyId: true,
        contactId: true,
        projectId: true,
      },
    })
    const currentPotentialMap = new Map(currentPotentials.map(p => [p.id, p]))

    // Track if a project was created
    let projectCreated: { id: string; title: string } | undefined

    // Use interactive transaction for sequential operations (project creation + potential update)
    await prisma.$transaction(async (tx) => {
      for (const update of updates as { id: string; position: number; stage?: string }[]) {
        const currentPotential = currentPotentialMap.get(update.id)
        if (!currentPotential) continue

        const stageIsChanging = update.stage && currentPotential.stage !== update.stage
        const isMovingToConfirmed = update.stage === 'CONFIRMED' && currentPotential.stage !== 'CONFIRMED'
        const needsProjectCreation = isMovingToConfirmed && !currentPotential.projectId

        if (needsProjectCreation) {
          // Create a new project linked to this potential
          const project = await tx.project.create({
            data: {
              title: currentPotential.title,
              description: currentPotential.description,
              revenue: currentPotential.estimatedValue,
              status: ProjectStatus.DRAFT,
              companyId: currentPotential.companyId,
              contactId: currentPotential.contactId,
            },
          })

          // Update potential project with position, stage, and link to new project
          await tx.potentialProject.update({
            where: { id: update.id },
            data: {
              position: update.position,
              stage: 'CONFIRMED',
              stageChangedAt: new Date(),
              projectId: project.id,
            },
          })

          projectCreated = { id: project.id, title: project.title }
        } else {
          // Standard update (no project creation needed)
          await tx.potentialProject.update({
            where: { id: update.id },
            data: {
              position: update.position,
              ...(update.stage && { stage: update.stage as PotentialStage }),
              ...(stageIsChanging && { stageChangedAt: new Date() }),
            },
          })
        }
      }
    })

    return NextResponse.json({ success: true, projectCreated })
  } catch (error) {
    console.error('Error reordering potential projects:', error)
    return NextResponse.json(
      { error: 'Failed to reorder potential projects' },
      { status: 500 }
    )
  }
}
