import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireEditor, requireAdmin } from '@/lib/auth-utils'

// Validate hex color format (#RRGGBB)
function isValidHexColor(color: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(color)
}

// PATCH /api/tags/[tagId] - Update tag
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ tagId: string }> }
) {
  const { error } = await requireEditor()
  if (error) return error

  try {
    const { tagId } = await params
    const body = await request.json()

    // Verify tag exists
    const tag = await prisma.tag.findUnique({
      where: { id: tagId },
    })

    if (!tag) {
      return NextResponse.json(
        { error: 'Tag not found' },
        { status: 404 }
      )
    }

    // Build update data
    const updateData: { name?: string; color?: string } = {}

    // Validate and set name if provided
    if (body.name !== undefined) {
      if (!body.name?.trim()) {
        return NextResponse.json(
          { error: 'Name cannot be empty' },
          { status: 400 }
        )
      }

      const name = body.name.trim()

      // Check for duplicate name (case-insensitive) if name is changing
      if (name.toLowerCase() !== tag.name.toLowerCase()) {
        const existing = await prisma.tag.findFirst({
          where: {
            name: {
              equals: name,
              mode: 'insensitive',
            },
            NOT: { id: tagId },
          },
        })

        if (existing) {
          return NextResponse.json(
            { error: 'Tag with this name already exists' },
            { status: 409 }
          )
        }
      }

      updateData.name = name
    }

    // Validate and set color if provided
    if (body.color !== undefined) {
      if (!isValidHexColor(body.color)) {
        return NextResponse.json(
          { error: 'Invalid color format. Use #RRGGBB format.' },
          { status: 400 }
        )
      }
      updateData.color = body.color
    }

    // Nothing to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(tag)
    }

    const updatedTag = await prisma.tag.update({
      where: { id: tagId },
      data: updateData,
    })

    return NextResponse.json(updatedTag)
  } catch (error) {
    console.error('Error updating tag:', error)
    return NextResponse.json(
      { error: 'Failed to update tag' },
      { status: 500 }
    )
  }
}

// DELETE /api/tags/[tagId] - Delete tag
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ tagId: string }> }
) {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    const { tagId } = await params

    // Verify tag exists
    const tag = await prisma.tag.findUnique({
      where: { id: tagId },
    })

    if (!tag) {
      return NextResponse.json(
        { error: 'Tag not found' },
        { status: 404 }
      )
    }

    // Delete tag - TaskTag relations cascade automatically via schema
    await prisma.tag.delete({
      where: { id: tagId },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error deleting tag:', error)
    return NextResponse.json(
      { error: 'Failed to delete tag' },
      { status: 500 }
    )
  }
}
