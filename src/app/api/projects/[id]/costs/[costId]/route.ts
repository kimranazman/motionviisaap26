import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireEditor } from '@/lib/auth-utils'
import { getEmbedding } from '@/lib/embeddings'

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

    const cost = await prisma.cost.update({
      where: { id: costId },
      data: updateData,
      include: {
        category: { select: { id: true, name: true } },
        supplier: { select: { id: true, name: true } },
      },
    })

    // Fire-and-forget embedding regeneration if description changed or supplier added
    const descriptionChanged = body.description !== undefined && body.description.trim() !== existingCost.description
    const supplierAdded = body.supplierId !== undefined && body.supplierId && !existingCost.supplierId
    if (cost.supplierId && (descriptionChanged || supplierAdded)) {
      generateCostEmbedding(cost.id, cost.description).catch(console.error)
    }

    // Convert Decimal amount to Number
    return NextResponse.json({
      ...cost,
      amount: Number(cost.amount),
    })
  } catch (error) {
    console.error('Error updating cost:', error)
    return NextResponse.json(
      { error: 'Failed to update cost' },
      { status: 500 }
    )
  }
}

// Generate embedding for a cost item (fire-and-forget)
async function generateCostEmbedding(costId: string, description: string) {
  try {
    const embedding = await getEmbedding(description)
    await prisma.cost.update({
      where: { id: costId },
      data: { embedding },
    })
  } catch (error) {
    console.error(`Failed to generate embedding for cost ${costId}:`, error)
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
