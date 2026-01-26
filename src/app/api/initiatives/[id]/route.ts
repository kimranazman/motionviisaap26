import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { requireAuth, requireEditor } from '@/lib/auth-utils'

// GET /api/initiatives/[id] - Get single initiative
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth()
  if (error) return error

  try {
    const { id } = await params
    const initiative = await prisma.initiative.findUnique({
      where: { id },
      include: {
        comments: {
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
      },
    })

    if (!initiative) {
      return NextResponse.json(
        { error: 'Initiative not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(initiative)
  } catch (error) {
    console.error('Error fetching initiative:', error)
    return NextResponse.json(
      { error: 'Failed to fetch initiative' },
      { status: 500 }
    )
  }
}

// PUT /api/initiatives/[id] - Update initiative
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireEditor()
  if (error) return error

  try {
    const { id } = await params
    const body = await request.json()

    const initiative = await prisma.initiative.update({
      where: { id },
      data: {
        objective: body.objective,
        keyResult: body.keyResult,
        department: body.department,
        title: body.title,
        monthlyObjective: body.monthlyObjective || null,
        weeklyTasks: body.weeklyTasks || null,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        endDate: body.endDate ? new Date(body.endDate) : undefined,
        resourcesFinancial: body.resourcesFinancial,
        resourcesNonFinancial: body.resourcesNonFinancial || null,
        personInCharge: body.personInCharge || null,
        accountable: body.accountable || null,
        status: body.status,
        remarks: body.remarks || null,
      },
    })

    return NextResponse.json(initiative)
  } catch (error) {
    console.error('Error updating initiative:', error)
    return NextResponse.json(
      { error: 'Failed to update initiative' },
      { status: 500 }
    )
  }
}

// PATCH /api/initiatives/[id] - Partial update (status, position)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireEditor()
  if (error) return error

  try {
    const { id } = await params
    const body = await request.json()

    const updateData: Prisma.InitiativeUpdateInput = {}

    if (body.status !== undefined) {
      updateData.status = body.status
    }

    if (body.position !== undefined) {
      updateData.position = body.position
    }

    if (body.remarks !== undefined) {
      updateData.remarks = body.remarks
    }

    if (body.personInCharge !== undefined) {
      updateData.personInCharge = body.personInCharge
    }

    // KPI fields
    if (body.kpiLabel !== undefined) {
      updateData.kpiLabel = body.kpiLabel || null
    }
    if (body.kpiTarget !== undefined) {
      updateData.kpiTarget = body.kpiTarget !== null && body.kpiTarget !== ''
        ? parseFloat(String(body.kpiTarget))
        : null
    }
    if (body.kpiActual !== undefined) {
      updateData.kpiActual = body.kpiActual !== null && body.kpiActual !== ''
        ? parseFloat(String(body.kpiActual))
        : null
    }
    if (body.kpiUnit !== undefined) {
      updateData.kpiUnit = body.kpiUnit || null
    }
    if (body.kpiManualOverride !== undefined) {
      updateData.kpiManualOverride = body.kpiManualOverride
    }

    const initiative = await prisma.initiative.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(initiative)
  } catch (error) {
    console.error('Error patching initiative:', error)
    return NextResponse.json(
      { error: 'Failed to update initiative' },
      { status: 500 }
    )
  }
}

// DELETE /api/initiatives/[id] - Delete initiative
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireEditor()
  if (error) return error

  try {
    const { id } = await params
    await prisma.initiative.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting initiative:', error)
    return NextResponse.json(
      { error: 'Failed to delete initiative' },
      { status: 500 }
    )
  }
}
