import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth, requireEditor } from '@/lib/auth-utils'

// GET /api/key-results/[id] - Get single key result with initiatives and support tasks
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth()
  if (error) return error

  try {
    const { id } = await params

    const keyResult = await prisma.keyResult.findUnique({
      where: { id },
      include: {
        initiatives: {
          select: {
            id: true,
            sequenceNumber: true,
            title: true,
            status: true,
            department: true,
            personInCharge: true,
            startDate: true,
            endDate: true,
            budget: true,
            resources: true,
          },
          orderBy: { sequenceNumber: 'asc' },
        },
        supportTaskLinks: {
          include: {
            supportTask: {
              select: {
                id: true,
                taskId: true,
                task: true,
                category: true,
                owner: true,
              },
            },
          },
        },
      },
    })

    if (!keyResult) {
      return NextResponse.json(
        { error: 'Key result not found' },
        { status: 404 }
      )
    }

    // Serialize Decimal fields and dates
    const serialized = {
      ...keyResult,
      target: Number(keyResult.target),
      actual: Number(keyResult.actual),
      progress: Number(keyResult.progress),
      weight: Number(keyResult.weight),
      initiatives: keyResult.initiatives.map((init) => ({
        ...init,
        startDate: init.startDate.toISOString(),
        endDate: init.endDate.toISOString(),
      })),
      // Flatten supportTaskLinks to supportTasks array
      supportTasks: keyResult.supportTaskLinks.map((link) => link.supportTask),
      supportTaskLinks: undefined,
    }

    return NextResponse.json(serialized)
  } catch (error) {
    console.error('Error fetching key result:', error)
    return NextResponse.json(
      { error: 'Failed to fetch key result' },
      { status: 500 }
    )
  }
}

// PATCH /api/key-results/[id] - Update key result fields
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireEditor()
  if (error) return error

  try {
    const { id } = await params
    const body = await request.json()

    // Build update data - only include fields present in body
    const updateData: Record<string, unknown> = {}

    if (body.actual !== undefined) {
      updateData.actual = parseFloat(String(body.actual))
    }
    if (body.progress !== undefined) {
      updateData.progress = parseFloat(String(body.progress))
    }
    if (body.status !== undefined) {
      updateData.status = body.status
    }

    const keyResult = await prisma.keyResult.update({
      where: { id },
      data: updateData,
    })

    // Serialize Decimal fields
    const serialized = {
      ...keyResult,
      target: Number(keyResult.target),
      actual: Number(keyResult.actual),
      progress: Number(keyResult.progress),
      weight: Number(keyResult.weight),
    }

    return NextResponse.json(serialized)
  } catch (error) {
    console.error('Error updating key result:', error)
    return NextResponse.json(
      { error: 'Failed to update key result' },
      { status: 500 }
    )
  }
}
