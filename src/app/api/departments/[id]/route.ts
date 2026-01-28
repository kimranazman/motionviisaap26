import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth, requireEditor } from '@/lib/auth-utils'

// GET /api/departments/[id] - Get single department with full details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth()
  if (error) return error

  try {
    const { id } = await params

    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        company: { select: { id: true, name: true } },
        contacts: {
          orderBy: [{ isPrimary: 'desc' }, { name: 'asc' }],
          take: 20,
        },
        deals: {
          select: {
            id: true,
            title: true,
            stage: true,
            value: true,
          },
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        potentials: {
          select: {
            id: true,
            title: true,
            stage: true,
            estimatedValue: true,
          },
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { contacts: true, deals: true, potentials: true },
        },
      },
    })

    if (!department) {
      return NextResponse.json(
        { error: 'Department not found' },
        { status: 404 }
      )
    }

    // Convert Decimal values to numbers for JSON serialization
    const serialized = {
      ...department,
      deals: department.deals.map((d) => ({
        ...d,
        value: d.value ? Number(d.value) : null,
      })),
      potentials: department.potentials.map((p) => ({
        ...p,
        estimatedValue: p.estimatedValue ? Number(p.estimatedValue) : null,
      })),
    }

    return NextResponse.json(serialized)
  } catch (error) {
    console.error('Error fetching department:', error)
    return NextResponse.json(
      { error: 'Failed to fetch department' },
      { status: 500 }
    )
  }
}

// PATCH /api/departments/[id] - Update department
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireEditor()
  if (error) return error

  try {
    const { id } = await params
    const body = await request.json()

    const existing = await prisma.department.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Department not found' },
        { status: 404 }
      )
    }

    const data: Record<string, unknown> = {}
    if (body.name !== undefined) data.name = body.name.trim()
    if (body.description !== undefined) data.description = body.description?.trim() || null

    const updated = await prisma.department.update({
      where: { id },
      data,
      include: {
        company: { select: { id: true, name: true } },
        _count: {
          select: { contacts: true, deals: true, potentials: true },
        },
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    if (
      error instanceof Error &&
      'code' in error &&
      (error as { code: string }).code === 'P2002'
    ) {
      return NextResponse.json(
        { error: 'Department with this name already exists for this company' },
        { status: 400 }
      )
    }

    console.error('Error updating department:', error)
    return NextResponse.json(
      { error: 'Failed to update department' },
      { status: 500 }
    )
  }
}

// DELETE /api/departments/[id] - Delete department
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireEditor()
  if (error) return error

  try {
    const { id } = await params

    const existing = await prisma.department.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Department not found' },
        { status: 404 }
      )
    }

    await prisma.department.delete({ where: { id } })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error deleting department:', error)
    return NextResponse.json(
      { error: 'Failed to delete department' },
      { status: 500 }
    )
  }
}
