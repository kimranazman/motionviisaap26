import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireEditor } from '@/lib/auth-utils'

// PATCH /api/projects/[id]/costs/[costId] - Update cost
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; costId: string }> }
) {
  const { error } = await requireEditor()
  if (error) return error

  try {
    const { id: projectId, costId } = await params
    const body = await request.json()

    // Verify cost exists and belongs to project
    const existingCost = await prisma.cost.findFirst({
      where: { id: costId, projectId },
    })

    if (!existingCost) {
      return NextResponse.json(
        { error: 'Cost not found' },
        { status: 404 }
      )
    }

    // If changing category, verify new category is valid
    if (body.categoryId && body.categoryId !== existingCost.categoryId) {
      const category = await prisma.costCategory.findUnique({
        where: { id: body.categoryId },
        select: { id: true, isActive: true },
      })

      if (!category || !category.isActive) {
        return NextResponse.json(
          { error: 'Invalid category' },
          { status: 400 }
        )
      }
    }

    // Build update data
    const updateData: {
      description?: string
      amount?: number
      categoryId?: string
      date?: Date
      supplierId?: string | null
      quantity?: number | null
      unitPrice?: number | null
    } = {}

    if (body.description !== undefined) {
      updateData.description = body.description.trim()
    }
    if (body.amount !== undefined) {
      updateData.amount = parseFloat(body.amount)
    }
    if (body.categoryId !== undefined) {
      updateData.categoryId = body.categoryId
    }
    if (body.date !== undefined) {
      updateData.date = new Date(body.date)
    }
    if (body.supplierId !== undefined) {
      updateData.supplierId = body.supplierId || null
    }
    if (body.quantity !== undefined) {
      updateData.quantity = body.quantity !== null ? parseFloat(body.quantity) : null
    }
    if (body.unitPrice !== undefined) {
      updateData.unitPrice = body.unitPrice !== null ? parseFloat(body.unitPrice) : null
    }

    const cost = await prisma.cost.update({
      where: { id: costId },
      data: updateData,
      include: {
        category: { select: { id: true, name: true } },
        supplier: { select: { id: true, name: true } },
      },
    })

    // Convert Decimal amounts to Number
    return NextResponse.json({
      ...cost,
      amount: Number(cost.amount),
      quantity: cost.quantity !== null ? Number(cost.quantity) : null,
      unitPrice: cost.unitPrice !== null ? Number(cost.unitPrice) : null,
    })
  } catch (error) {
    console.error('Error updating cost:', error)
    return NextResponse.json(
      { error: 'Failed to update cost' },
      { status: 500 }
    )
  }
}

// DELETE /api/projects/[id]/costs/[costId] - Delete cost
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; costId: string }> }
) {
  const { error } = await requireEditor()
  if (error) return error

  try {
    const { id: projectId, costId } = await params

    // Verify cost exists and belongs to project
    const existingCost = await prisma.cost.findFirst({
      where: { id: costId, projectId },
    })

    if (!existingCost) {
      return NextResponse.json(
        { error: 'Cost not found' },
        { status: 404 }
      )
    }

    await prisma.cost.delete({
      where: { id: costId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting cost:', error)
    return NextResponse.json(
      { error: 'Failed to delete cost' },
      { status: 500 }
    )
  }
}
