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
        keyResult: true,
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
        projects: {
          select: {
            id: true,
            title: true,
            status: true,
            revenue: true,
            startDate: true,
            endDate: true,
            company: { select: { id: true, name: true } },
            costs: { select: { amount: true } },
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

    // Serialize Decimal fields and aggregate project costs
    const serializedProjects = (initiative.projects || []).map(p => ({
      id: p.id,
      title: p.title,
      status: p.status,
      revenue: p.revenue ? Number(p.revenue) : null,
      totalCosts: p.costs.reduce((sum: number, c: { amount: unknown }) => sum + Number(c.amount), 0),
      companyName: p.company?.name || null,
      startDate: p.startDate ? p.startDate.toISOString() : null,
      endDate: p.endDate ? p.endDate.toISOString() : null,
    }))

    return NextResponse.json({
      ...initiative,
      projects: serializedProjects,
    })
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
        keyResultId: body.keyResultId !== undefined ? (body.keyResultId || null) : undefined,
        department: body.department,
        title: body.title,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        endDate: body.endDate ? new Date(body.endDate) : undefined,
        personInCharge: body.personInCharge || null,
        accountable: body.accountable || null,
        status: body.status,
        remarks: body.remarks || null,
        budget: body.budget !== undefined ? body.budget : undefined,
        resources: body.resources !== undefined ? body.resources : undefined,
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

    // Handle date updates with validation
    if (body.startDate !== undefined || body.endDate !== undefined) {
      let newStart: Date | undefined
      let newEnd: Date | undefined

      if (body.startDate !== undefined) {
        newStart = new Date(body.startDate)
        if (isNaN(newStart.getTime())) {
          return NextResponse.json(
            { error: 'Invalid startDate' },
            { status: 400 }
          )
        }
        updateData.startDate = newStart
      }

      if (body.endDate !== undefined) {
        newEnd = new Date(body.endDate)
        if (isNaN(newEnd.getTime())) {
          return NextResponse.json(
            { error: 'Invalid endDate' },
            { status: 400 }
          )
        }
        updateData.endDate = newEnd
      }

      // Validate date ordering
      if (newStart && newEnd) {
        if (newStart >= newEnd) {
          return NextResponse.json(
            { error: 'startDate must be before endDate' },
            { status: 400 }
          )
        }
      } else if (newStart || newEnd) {
        // Only one date provided — fetch the other to validate ordering
        const existing = await prisma.initiative.findUnique({
          where: { id },
          select: { startDate: true, endDate: true },
        })
        if (existing) {
          const effectiveStart = newStart || existing.startDate
          const effectiveEnd = newEnd || existing.endDate
          if (effectiveStart >= effectiveEnd) {
            return NextResponse.json(
              { error: 'startDate must be before endDate' },
              { status: 400 }
            )
          }
        }
      }
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
