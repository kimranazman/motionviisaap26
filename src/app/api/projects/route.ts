import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth, requireEditor } from '@/lib/auth-utils'
import { ProjectStatus } from '@prisma/client'

// GET /api/projects - List all projects with company and contact
export async function GET(request: NextRequest) {
  const { error } = await requireAuth()
  if (error) return error

  try {
    const { searchParams } = new URL(request.url)
    const showArchived = searchParams.get('showArchived') === 'true'
    const type = searchParams.get('type') // 'client' | 'internal' | 'all' | null

    const projects = await prisma.project.findMany({
      where: {
        ...(showArchived ? {} : { isArchived: false }),
        ...(type === 'client' ? { isInternal: false } : {}),
        ...(type === 'internal' ? { isInternal: true } : {}),
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
      orderBy: { createdAt: 'desc' },
    })

    // Serialize Decimal fields
    const serialized = projects.map(project => ({
      ...project,
      revenue: project.revenue ? Number(project.revenue) : null,
      potentialRevenue: project.potentialRevenue ? Number(project.potentialRevenue) : null,
    }))

    return NextResponse.json(serialized)
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}

// POST /api/projects - Create new project (direct, not from conversion)
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

    const isInternal = body.isInternal === true

    if (isInternal) {
      // Internal project: require internalEntity, no companyId needed
      const validEntities = ['MOTIONVII', 'TALENTA']
      if (!body.internalEntity || !validEntities.includes(body.internalEntity)) {
        return NextResponse.json(
          { error: 'Internal projects require an entity (Motionvii or Talenta)' },
          { status: 400 }
        )
      }
    } else {
      // Client project: require companyId
      if (!body.companyId || typeof body.companyId !== 'string') {
        return NextResponse.json(
          { error: 'Company is required' },
          { status: 400 }
        )
      }
    }

    const project = await prisma.project.create({
      data: {
        title: body.title.trim(),
        description: body.description || null,
        revenue: body.revenue ? parseFloat(body.revenue) : null,
        status: ProjectStatus.DRAFT,
        isInternal,
        internalEntity: isInternal ? body.internalEntity : null,
        companyId: isInternal ? null : body.companyId,
        contactId: isInternal ? null : (body.contactId || null),
        initiativeId: body.initiativeId || null,
      },
      include: {
        company: {
          select: { id: true, name: true },
        },
        contact: {
          select: { id: true, name: true },
        },
        initiative: {
          select: { id: true, title: true },
        },
      },
    })

    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    )
  }
}
