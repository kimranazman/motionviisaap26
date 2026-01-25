import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth, requireEditor } from '@/lib/auth-utils'
import { ProjectStatus, ActivityEntityType, ActivityAction } from '@prisma/client'

// GET /api/projects/[id] - Get single project with full includes
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth()
  if (error) return error

  try {
    const { id } = await params
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        company: {
          select: { id: true, name: true },
        },
        contact: {
          select: { id: true, name: true },
        },
        sourceDeal: {
          select: { id: true, title: true, value: true },
        },
        sourcePotential: {
          select: { id: true, title: true, estimatedValue: true },
        },
        initiative: {
          select: { id: true, title: true },
        },
        costs: {
          include: {
            category: { select: { id: true, name: true } },
          },
          orderBy: [
            { date: 'desc' },
            { createdAt: 'desc' },
          ],
        },
      },
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Serialize response to convert Decimals to Numbers
    const serialized = {
      ...project,
      revenue: project.revenue ? Number(project.revenue) : null,
      potentialRevenue: project.potentialRevenue ? Number(project.potentialRevenue) : null,
      costs: project.costs.map(cost => ({
        ...cost,
        amount: Number(cost.amount),
      })),
    }

    return NextResponse.json(serialized)
  } catch (error) {
    console.error('Error fetching project:', error)
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    )
  }
}

// PATCH /api/projects/[id] - Update project with title sync to source deal/potential
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireEditor()
  if (error) return error

  try {
    const { id } = await params
    const body = await request.json()
    const userId = session?.user?.id || null

    // Get current project with source links to check for title sync
    const currentProject = await prisma.project.findUnique({
      where: { id },
      include: {
        sourceDeal: { select: { id: true, title: true } },
        sourcePotential: { select: { id: true, title: true } },
      },
    })

    if (!currentProject) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Check if title is changing
    const titleChanged = body.title !== undefined && body.title !== currentProject.title

    // Wrap in transaction for atomic title sync
    const project = await prisma.$transaction(async (tx) => {
      // Update project
      const updatedProject = await tx.project.update({
        where: { id },
        data: {
          ...(body.title !== undefined && { title: body.title }),
          ...(body.description !== undefined && { description: body.description || null }),
          // revenue is NOT updateable via API - only set by AI invoice import
          ...(body.status !== undefined && { status: body.status as ProjectStatus }),
          ...(body.companyId !== undefined && { companyId: body.companyId }),
          ...(body.contactId !== undefined && { contactId: body.contactId || null }),
          ...(body.initiativeId !== undefined && { initiativeId: body.initiativeId || null }),
          ...(body.startDate !== undefined && { startDate: body.startDate ? new Date(body.startDate) : null }),
          ...(body.endDate !== undefined && { endDate: body.endDate ? new Date(body.endDate) : null }),
          ...(body.isArchived !== undefined && { isArchived: body.isArchived }),
        },
        include: {
          company: {
            select: { id: true, name: true },
          },
          contact: {
            select: { id: true, name: true },
          },
          sourceDeal: {
            select: { id: true, title: true },
          },
          sourcePotential: {
            select: { id: true, title: true },
          },
          initiative: {
            select: { id: true, title: true },
          },
        },
      })

      // Sync title to source deal if title changed and deal exists
      if (titleChanged && currentProject.sourceDeal) {
        await tx.deal.update({
          where: { id: currentProject.sourceDeal.id },
          data: { title: body.title },
        })

        // Log activity for deal
        await tx.activityLog.create({
          data: {
            entityType: ActivityEntityType.DEAL,
            entityId: currentProject.sourceDeal.id,
            action: ActivityAction.TITLE_SYNCED,
            field: 'title',
            oldValue: currentProject.sourceDeal.title,
            newValue: body.title,
            userId,
          },
        })
      }

      // Sync title to source potential if title changed and potential exists
      if (titleChanged && currentProject.sourcePotential) {
        await tx.potentialProject.update({
          where: { id: currentProject.sourcePotential.id },
          data: { title: body.title },
        })

        // Log activity for potential
        await tx.activityLog.create({
          data: {
            entityType: ActivityEntityType.POTENTIAL,
            entityId: currentProject.sourcePotential.id,
            action: ActivityAction.TITLE_SYNCED,
            field: 'title',
            oldValue: currentProject.sourcePotential.title,
            newValue: body.title,
            userId,
          },
        })
      }

      return updatedProject
    })

    return NextResponse.json(project)
  } catch (error) {
    console.error('Error updating project:', error)
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    )
  }
}

// DELETE /api/projects/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireEditor()
  if (error) return error

  try {
    const { id } = await params
    await prisma.project.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting project:', error)
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    )
  }
}
