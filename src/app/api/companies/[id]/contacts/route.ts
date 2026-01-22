import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth, requireEditor } from '@/lib/auth-utils'

// GET /api/companies/[id]/contacts - List contacts for company
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth()
  if (error) return error

  try {
    const { id } = await params

    // Verify company exists
    const company = await prisma.company.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      )
    }

    const contacts = await prisma.contact.findMany({
      where: { companyId: id },
      orderBy: [
        { isPrimary: 'desc' },
        { name: 'asc' },
      ],
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

// POST /api/companies/[id]/contacts - Create contact
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireEditor()
  if (error) return error

  try {
    const { id } = await params
    const body = await request.json()

    // Validate name is required
    if (!body.name || !body.name.trim()) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    // Verify company exists
    const company = await prisma.company.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      )
    }

    // Check if this will be the first contact (auto-set isPrimary)
    const existingContacts = await prisma.contact.count({
      where: { companyId: id },
    })

    const contact = await prisma.contact.create({
      data: {
        companyId: id,
        name: body.name.trim(),
        email: body.email?.trim() || null,
        phone: body.phone?.trim() || null,
        role: body.role?.trim() || null,
        isPrimary: existingContacts === 0, // First contact is primary
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
