import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { InitiativeStatus } from '@prisma/client'
import { requireEditor } from '@/lib/auth-utils'

// PATCH /api/initiatives/reorder - Reorder initiatives (for Kanban)
export async function PATCH(request: NextRequest) {
  const { error } = await requireEditor()
  if (error) return error

  try {
    const body = await request.json()
    const { updates } = body

    // Updates should be an array of { id, position, status? }
    if (!Array.isArray(updates)) {
      return NextResponse.json(
        { error: 'Updates must be an array' },
        { status: 400 }
      )
    }

    // Use transaction for batch update
    await prisma.$transaction(
      updates.map((update: { id: string; position: number; status?: string }) =>
        prisma.initiative.update({
          where: { id: update.id },
          data: {
            position: update.position,
            ...(update.status && { status: update.status as InitiativeStatus }),
          },
        })
      )
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error reordering initiatives:', error)
    return NextResponse.json(
      { error: 'Failed to reorder initiatives' },
      { status: 500 }
    )
  }
}
