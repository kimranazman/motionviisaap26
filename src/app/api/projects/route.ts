import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth, requireEditor } from '@/lib/auth-utils'
import { ProjectStatus } from '@prisma/client'

// GET /api/projects - List all projects with company and contact
export async function GET() {
  const { error } = await requireAuth()
  if (error) return error

  try {
    const projects = await prisma.project.findMany({
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

    return NextResponse.json(projects)
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

    if (!body.companyId || typeof body.companyId !== 'string') {
      return NextResponse.json(
        { error: 'Company is required' },
        { status: 400 }
      )
    }

    const project = await prisma.project.create({
      data: {
        title: body.title.trim(),
        description: body.description || null,
        revenue: body.revenue ? parseFloat(body.revenue) : null,
        status: ProjectStatus.DRAFT,
        companyId: body.companyId,
        contactId: body.contactId || null,
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
