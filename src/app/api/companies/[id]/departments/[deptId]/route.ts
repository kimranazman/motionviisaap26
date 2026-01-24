import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth, requireEditor } from '@/lib/auth-utils'

// GET /api/companies/[id]/departments/[deptId] - Get single department
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; deptId: string }> }
) {
  const { error } = await requireAuth()
  if (error) return error

  try {
    const { id, deptId } = await params

    const department = await prisma.department.findFirst({
      where: {
        id: deptId,
        companyId: id,
      },
      include: {
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

    return NextResponse.json(department)
  } catch (error) {
    console.error('Error fetching department:', error)
    return NextResponse.json(
      { error: 'Failed to fetch department' },
      { status: 500 }
    )
  }
}

// PATCH /api/companies/[id]/departments/[deptId] - Update department
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; deptId: string }> }
) {
  const { error } = await requireEditor()
  if (error) return error

  try {
    const { id, deptId } = await params
    const body = await request.json()

    // Verify department belongs to company
    const existing = await prisma.department.findFirst({
      where: {
        id: deptId,
        companyId: id,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Department not found' },
        { status: 404 }
      )
    }

    const department = await prisma.department.update({
      where: { id: deptId },
      data: {
        ...(body.name !== undefined && { name: body.name.trim() }),
        ...(body.description !== undefined && {
          description: body.description?.trim() || null,
        }),
      },
      include: {
        _count: {
          select: { contacts: true, deals: true, potentials: true },
        },
      },
    })

    return NextResponse.json(department)
  } catch (error) {
    // Handle unique constraint violation (P2002)
    if (
      error instanceof Error &&
      'code' in error &&
      (error as { code: string }).code === 'P2002'
    ) {
      return NextResponse.json(
        { error: 'Department with this name already exists' },
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

// DELETE /api/companies/[id]/departments/[deptId] - Delete department
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; deptId: string }> }
) {
  const { error } = await requireEditor()
  if (error) return error

  try {
    const { id, deptId } = await params

    // Verify department belongs to company
    const existing = await prisma.department.findFirst({
      where: {
        id: deptId,
        companyId: id,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Department not found' },
        { status: 404 }
      )
    }

    // Use transaction to unlink related records before deleting
    await prisma.$transaction([
      // Set departmentId to null for all linked contacts
      prisma.contact.updateMany({
        where: { departmentId: deptId },
        data: { departmentId: null },
      }),
      // Set departmentId to null for all linked deals
      prisma.deal.updateMany({
        where: { departmentId: deptId },
        data: { departmentId: null },
      }),
      // Set departmentId to null for all linked potentials
      prisma.potentialProject.updateMany({
        where: { departmentId: deptId },
        data: { departmentId: null },
      }),
      // Delete the department
      prisma.department.delete({
        where: { id: deptId },
      }),
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting department:', error)
    return NextResponse.json(
      { error: 'Failed to delete department' },
      { status: 500 }
    )
  }
}
