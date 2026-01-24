import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth, requireEditor } from '@/lib/auth-utils'

// GET /api/projects/[id]/deliverables - List deliverables for project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth()
  if (error) return error

  try {
    const { id } = await params

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    const deliverables = await prisma.deliverable.findMany({
      where: { projectId: id },
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'desc' },
      ],
    })

    // Convert Decimal values to Number
    return NextResponse.json(deliverables.map(d => ({
      ...d,
      value: d.value ? Number(d.value) : null,
    })))
  } catch (error) {
    console.error('Error fetching deliverables:', error)
    return NextResponse.json(
      { error: 'Failed to fetch deliverables' },
      { status: 500 }
    )
  }
}

// POST /api/projects/[id]/deliverables - Create deliverable
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireEditor()
  if (error) return error

  try {
    const { id } = await params
    const body = await request.json()

    // Validate required fields
    if (!body.title?.trim()) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Get next sortOrder
    const maxSortOrder = await prisma.deliverable.aggregate({
      where: { projectId: id },
      _max: { sortOrder: true },
    })
    const nextSortOrder = (maxSortOrder._max.sortOrder ?? -1) + 1

    const deliverable = await prisma.deliverable.create({
      data: {
        projectId: id,
        title: body.title.trim(),
        description: body.description?.trim() || null,
        value: body.value ? parseFloat(body.value) : null,
        sortOrder: nextSortOrder,
        aiExtracted: body.aiExtracted ?? false,
      },
    })

    return NextResponse.json({
      ...deliverable,
      value: deliverable.value ? Number(deliverable.value) : null,
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating deliverable:', error)
    return NextResponse.json(
      { error: 'Failed to create deliverable' },
      { status: 500 }
    )
  }
}
