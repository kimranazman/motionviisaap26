import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth, requireEditor } from '@/lib/auth-utils'

// GET /api/contacts - List all contacts (with optional company/department filter)
export async function GET(request: NextRequest) {
  const { error } = await requireAuth()
  if (error) return error

  try {
    const searchParams = request.nextUrl.searchParams
    const companyId = searchParams.get('companyId')
    const departmentId = searchParams.get('departmentId')

    const where: Record<string, unknown> = {}
    if (companyId) where.companyId = companyId
    if (departmentId) where.departmentId = departmentId

    const contacts = await prisma.contact.findMany({
      where,
      include: {
        company: { select: { id: true, name: true } },
        department: { select: { id: true, name: true } },
        _count: {
          select: { deals: true, potentials: true, projects: true },
        },
      },
      orderBy: [{ company: { name: 'asc' } }, { name: 'asc' }],
    })

    return NextResponse.json(contacts)
  } catch (error) {
    console.error('Error fetching contacts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch contacts' },
      { status: 500 }
    )
  }
}

// POST /api/contacts - Create a contact
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
        { error: 'Name is required' },
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

    // Validate departmentId if provided
    if (body.departmentId) {
      const department = await prisma.department.findFirst({
        where: {
          id: body.departmentId,
          companyId: body.companyId,
        },
      })

      if (!department) {
        return NextResponse.json(
          { error: 'Department not found or belongs to different company' },
          { status: 400 }
        )
      }
    }

    // Check if this will be the first contact (auto-set isPrimary)
    const existingContacts = await prisma.contact.count({
      where: { companyId: body.companyId },
    })

    const contact = await prisma.contact.create({
      data: {
        companyId: body.companyId,
        name: body.name.trim(),
        email: body.email?.trim() || null,
        phone: body.phone?.trim() || null,
        role: body.role?.trim() || null,
        departmentId: body.departmentId || null,
        isPrimary: existingContacts === 0, // First contact is primary
      },
      include: {
        company: { select: { id: true, name: true } },
        department: { select: { id: true, name: true } },
        _count: {
          select: { deals: true, potentials: true, projects: true },
        },
      },
    })

    return NextResponse.json(contact, { status: 201 })
  } catch (error) {
    console.error('Error creating contact:', error)
    return NextResponse.json(
      { error: 'Failed to create contact' },
      { status: 500 }
    )
  }
}
