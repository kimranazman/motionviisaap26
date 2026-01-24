import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth, requireEditor } from '@/lib/auth-utils'
import { PotentialStage } from '@prisma/client'

// GET /api/potential-projects/[id] - Get single potential project with company and contact
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth()
  if (error) return error

  try {
    const { id } = await params
    const potentialProject = await prisma.potentialProject.findUnique({
      where: { id },
      include: {
        company: {
          select: { id: true, name: true },
        },
        contact: {
          select: { id: true, name: true },
        },
        project: {
          select: {
            id: true,
            title: true,
            revenue: true,
            potentialRevenue: true,
          },
        },
      },
    })

    if (!potentialProject) {
      return NextResponse.json(
        { error: 'Potential project not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(potentialProject)
  } catch (error) {
    console.error('Error fetching potential project:', error)
    return NextResponse.json(
      { error: 'Failed to fetch potential project' },
      { status: 500 }
    )
  }
}

// PATCH /api/potential-projects/[id] - Update potential project
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireEditor()
  if (error) return error

  try {
    const { id } = await params
    const body = await request.json()

    // Check if stage is changing
    let stageUpdate = {}
    if (body.stage !== undefined) {
      const currentProject = await prisma.potentialProject.findUnique({
        where: { id },
        select: { stage: true },
      })
      if (currentProject && currentProject.stage !== body.stage) {
        stageUpdate = { stageChangedAt: new Date() }
      }
    }

    const potentialProject = await prisma.potentialProject.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.description !== undefined && { description: body.description || null }),
        ...(body.estimatedValue !== undefined && { estimatedValue: body.estimatedValue ? parseFloat(body.estimatedValue) : null }),
        ...(body.companyId !== undefined && { companyId: body.companyId }),
        ...(body.departmentId !== undefined && { departmentId: body.departmentId || null }),
        ...(body.contactId !== undefined && { contactId: body.contactId || null }),
        ...(body.stage !== undefined && { stage: body.stage as PotentialStage }),
        ...(body.isArchived !== undefined && { isArchived: body.isArchived }),
        ...stageUpdate,
      },
      include: {
        company: {
          select: { id: true, name: true },
        },
        department: {
          select: { id: true, name: true },
        },
        contact: {
          select: { id: true, name: true },
        },
        project: {
          select: {
            id: true,
            title: true,
            revenue: true,
            potentialRevenue: true,
          },
        },
      },
    })

    return NextResponse.json(potentialProject)
  } catch (error) {
    console.error('Error updating potential project:', error)
    return NextResponse.json(
      { error: 'Failed to update potential project' },
      { status: 500 }
    )
  }
}

// DELETE /api/potential-projects/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireEditor()
  if (error) return error

  try {
    const { id } = await params
    await prisma.potentialProject.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting potential project:', error)
    return NextResponse.json(
      { error: 'Failed to delete potential project' },
      { status: 500 }
    )
  }
}
