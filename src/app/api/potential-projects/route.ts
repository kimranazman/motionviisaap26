import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth, requireEditor } from '@/lib/auth-utils'
import { PotentialStage } from '@prisma/client'

// GET /api/potential-projects - List all potential projects with company, contact, and project
export async function GET(request: NextRequest) {
  const { error } = await requireAuth()
  if (error) return error

  try {
    const { searchParams } = new URL(request.url)
    const showArchived = searchParams.get('showArchived') === 'true'

    const potentialProjects = await prisma.potentialProject.findMany({
      where: {
        ...(showArchived ? {} : { isArchived: false }),
      },
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
            status: true,
            costs: {
              select: { amount: true },
            },
          },
        },
      },
      orderBy: [
        { stage: 'asc' },
        { position: 'asc' },
      ],
    })

    // Serialize Decimal fields
    const serialized = potentialProjects.map(pp => ({
      ...pp,
      estimatedValue: pp.estimatedValue ? Number(pp.estimatedValue) : null,
      project: pp.project ? {
        id: pp.project.id,
        title: pp.project.title,
        revenue: pp.project.revenue ? Number(pp.project.revenue) : null,
        potentialRevenue: pp.project.potentialRevenue ? Number(pp.project.potentialRevenue) : null,
        status: pp.project.status,
        totalCosts: pp.project.costs.reduce((sum, c) => sum + Number(c.amount), 0),
      } : null,
    }))

    return NextResponse.json(serialized)
  } catch (error) {
    console.error('Error fetching potential projects:', error)
    return NextResponse.json(
      { error: 'Failed to fetch potential projects' },
      { status: 500 }
    )
  }
}

// POST /api/potential-projects - Create new potential project
export async function POST(request: NextRequest) {
  const { error } = await requireEditor()
  if (error) return error

  try {
    const body = await request.json()

    // Validate required fields
    if (!body.title || typeof body.title !== 'string' || !body.title.trim()) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    if (!body.companyId || typeof body.companyId !== 'string') {
      return NextResponse.json(
        { error: 'Company is required' },
        { status: 400 }
      )
    }

    // Get next position in POTENTIAL stage
    const maxPosition = await prisma.potentialProject.aggregate({
      where: { stage: PotentialStage.POTENTIAL },
      _max: { position: true },
    })
    const nextPosition = (maxPosition._max.position ?? -1) + 1

    const potentialProject = await prisma.potentialProject.create({
      data: {
        title: body.title.trim(),
        description: body.description || null,
        estimatedValue: body.estimatedValue ? parseFloat(body.estimatedValue) : null,
        companyId: body.companyId,
        departmentId: body.departmentId || null,
        contactId: body.contactId || null,
        stage: PotentialStage.POTENTIAL,
        position: nextPosition,
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

    return NextResponse.json(potentialProject, { status: 201 })
  } catch (error) {
    console.error('Error creating potential project:', error)
    return NextResponse.json(
      { error: 'Failed to create potential project' },
      { status: 500 }
    )
  }
}
