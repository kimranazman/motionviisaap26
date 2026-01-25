import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireEditor } from '@/lib/auth-utils'

// PATCH /api/costs/[id]/normalize - Manually update normalizedItem
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireEditor()
  if (error) return error

  try {
    const { id } = await params
    const body = await request.json()

    if (body.normalizedItem === undefined) {
      return NextResponse.json(
        { error: 'normalizedItem is required' },
        { status: 400 }
      )
    }

    const cost = await prisma.cost.update({
      where: { id },
      data: {
        normalizedItem: body.normalizedItem?.trim() || null,
      },
      select: {
        id: true,
        normalizedItem: true,
      },
    })

    return NextResponse.json(cost)
  } catch (error) {
    console.error('Error updating normalizedItem:', error)
    return NextResponse.json(
      { error: 'Failed to update' },
      { status: 500 }
    )
  }
}
