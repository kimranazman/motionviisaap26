import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth, requireEditor } from '@/lib/auth-utils'

// GET /api/projects/[id]/costs - List costs for project
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

    const costs = await prisma.cost.findMany({
      where: { projectId: id },
      include: {
        category: { select: { id: true, name: true } },
        supplier: { select: { id: true, name: true } },
      },
      orderBy: [
        { date: 'desc' },
        { createdAt: 'desc' },
      ],
    })

    // Convert Decimal amounts to Number
    const serializedCosts = costs.map(cost => ({
      ...cost,
      amount: Number(cost.amount),
    }))

    return NextResponse.json(serializedCosts)
  } catch (error) {
    console.error('Error fetching costs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch costs' },
      { status: 500 }
    )
  }
}

// POST /api/projects/[id]/costs - Create cost
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
    if (!body.description?.trim()) {
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 }
      )
    }
    if (body.amount === undefined || body.amount === null || isNaN(parseFloat(body.amount))) {
      return NextResponse.json(
        { error: 'Valid amount is required' },
        { status: 400 }
      )
    }
    if (!body.categoryId) {
      return NextResponse.json(
        { error: 'Category is required' },
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

    // Verify category exists and is active
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

    const cost = await prisma.cost.create({
      data: {
        projectId: id,
        description: body.description.trim(),
        amount: parseFloat(body.amount),
        categoryId: body.categoryId,
        date: body.date ? new Date(body.date) : new Date(),
        supplierId: body.supplierId || null,
      },
      include: {
        category: { select: { id: true, name: true } },
        supplier: { select: { id: true, name: true } },
      },
    })

    // Convert Decimal amount to Number
    return NextResponse.json({
      ...cost,
      amount: Number(cost.amount),
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating cost:', error)
    return NextResponse.json(
      { error: 'Failed to create cost' },
      { status: 500 }
    )
  }
}
