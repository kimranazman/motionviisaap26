import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireEditor } from '@/lib/auth-utils'

// PATCH /api/projects/[id]/deliverables/[deliverableId] - Update deliverable
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; deliverableId: string }> }
) {
  const { error } = await requireEditor()
  if (error) return error

  try {
    const { id: projectId, deliverableId } = await params
    const body = await request.json()

    // Verify deliverable exists and belongs to project
    const existingDeliverable = await prisma.deliverable.findFirst({
      where: { id: deliverableId, projectId },
    })

    if (!existingDeliverable) {
      return NextResponse.json(
        { error: 'Deliverable not found' },
        { status: 404 }
      )
    }

    // Build update data
    const updateData: {
      title?: string
      description?: string | null
      value?: number | null
    } = {}

    if (body.title !== undefined) {
      if (!body.title?.trim()) {
        return NextResponse.json(
          { error: 'Title is required' },
          { status: 400 }
        )
      }
      updateData.title = body.title.trim()
    }
    if (body.description !== undefined) {
      updateData.description = body.description?.trim() || null
    }
    if (body.value !== undefined) {
      updateData.value = body.value ? parseFloat(body.value) : null
    }

    const deliverable = await prisma.deliverable.update({
      where: { id: deliverableId },
      data: updateData,
    })

    // Convert Decimal value to Number
    return NextResponse.json({
      ...deliverable,
      value: deliverable.value ? Number(deliverable.value) : null,
    })
  } catch (error) {
    console.error('Error updating deliverable:', error)
    return NextResponse.json(
      { error: 'Failed to update deliverable' },
      { status: 500 }
    )
  }
}

// DELETE /api/projects/[id]/deliverables/[deliverableId] - Delete deliverable
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; deliverableId: string }> }
) {
  const { error } = await requireEditor()
  if (error) return error

  try {
    const { id: projectId, deliverableId } = await params

    // Verify deliverable exists and belongs to project
    const existingDeliverable = await prisma.deliverable.findFirst({
      where: { id: deliverableId, projectId },
    })

    if (!existingDeliverable) {
      return NextResponse.json(
        { error: 'Deliverable not found' },
        { status: 404 }
      )
    }

    await prisma.deliverable.delete({
      where: { id: deliverableId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting deliverable:', error)
    return NextResponse.json(
      { error: 'Failed to delete deliverable' },
      { status: 500 }
    )
  }
}
