import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth, requireEditor } from '@/lib/auth-utils'

// GET /api/departments - List all departments (with optional company filter)
export async function GET(request: NextRequest) {
  const { error } = await requireAuth()
  if (error) return error

  try {
    const searchParams = request.nextUrl.searchParams
    const companyId = searchParams.get('companyId')

    const departments = await prisma.department.findMany({
      where: companyId ? { companyId } : {},
      include: {
        company: { select: { id: true, name: true } },
        _count: {
          select: { contacts: true, deals: true, potentials: true },
        },
      },
      orderBy: [{ company: { name: 'asc' } }, { name: 'asc' }],
    })

    return NextResponse.json(departments)
  } catch (error) {
    console.error('Error fetching departments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch departments' },
      { status: 500 }
    )
  }
}

// POST /api/departments - Create a department
export async function POST(request: NextRequest) {
  const { error } = await requireEditor()
  if (error) return error

  try {
    const body = await request.json()

    // Validate required fields
    if (!body.companyId) {
      return NextResponse.json(
        { error: 'Company is required' },
        { status: 400 }
      )
    }

    if (!body.name || !body.name.trim()) {
      return NextResponse.json(
        { error: 'Department name is required' },
        { status: 400 }
      )
    }

    // Verify company exists
    const company = await prisma.company.findUnique({
      where: { id: body.companyId },
      select: { id: true },
    })

    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      )
    }

    const department = await prisma.department.create({
      data: {
        companyId: body.companyId,
        name: body.name.trim(),
        description: body.description?.trim() || null,
      },
      include: {
        company: { select: { id: true, name: true } },
        _count: {
          select: { contacts: true, deals: true, potentials: true },
        },
      },
    })

    return NextResponse.json(department, { status: 201 })
  } catch (error) {
    // Handle unique constraint violation (P2002)
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

    console.error('Error creating department:', error)
    return NextResponse.json(
      { error: 'Failed to create department' },
      { status: 500 }
    )
  }
}
