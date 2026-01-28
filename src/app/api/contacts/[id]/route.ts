import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth, requireEditor } from '@/lib/auth-utils'

// GET /api/contacts/[id] - Get single contact with full details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth()
  if (error) return error

  try {
    const { id } = await params

    const contact = await prisma.contact.findUnique({
      where: { id },
      include: {
        company: { select: { id: true, name: true } },
        department: { select: { id: true, name: true } },
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
        projects: {
          select: {
            id: true,
            title: true,
            status: true,
            revenue: true,
          },
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!contact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      )
    }

    // Convert Decimal values to numbers for JSON serialization
    const serialized = {
      ...contact,
      deals: contact.deals.map((d) => ({
        ...d,
        value: d.value ? Number(d.value) : null,
      })),
      potentials: contact.potentials.map((p) => ({
        ...p,
        estimatedValue: p.estimatedValue ? Number(p.estimatedValue) : null,
      })),
      projects: contact.projects.map((p) => ({
        ...p,
        revenue: p.revenue ? Number(p.revenue) : null,
      })),
    }

    return NextResponse.json(serialized)
  } catch (error) {
    console.error('Error fetching contact:', error)
    return NextResponse.json(
      { error: 'Failed to fetch contact' },
      { status: 500 }
    )
  }
}

// PATCH /api/contacts/[id] - Update contact fields
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireEditor()
  if (error) return error

  try {
    const { id } = await params
    const body = await request.json()

    const existing = await prisma.contact.findUnique({
      where: { id },
      select: { id: true, companyId: true },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      )
    }

    // If setting as primary, unset others first via transaction
    if (body.isPrimary === true) {
      await prisma.$transaction([
        prisma.contact.updateMany({
          where: { companyId: existing.companyId, isPrimary: true },
          data: { isPrimary: false },
        }),
        prisma.contact.update({
          where: { id },
          data: { isPrimary: true },
        }),
      ])

      const updatedContact = await prisma.contact.findUnique({
        where: { id },
        include: {
          company: { select: { id: true, name: true } },
          department: { select: { id: true, name: true } },
        },
      })

      return NextResponse.json(updatedContact)
    }

    // Regular update for other fields
    const contact = await prisma.contact.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name.trim() }),
        ...(body.email !== undefined && { email: body.email?.trim() || null }),
        ...(body.phone !== undefined && { phone: body.phone?.trim() || null }),
        ...(body.role !== undefined && { role: body.role?.trim() || null }),
        ...(body.departmentId !== undefined && { departmentId: body.departmentId || null }),
        ...(body.isPrimary === false && { isPrimary: false }),
      },
      include: {
        company: { select: { id: true, name: true } },
        department: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json(contact)
  } catch (error) {
    console.error('Error updating contact:', error)
    return NextResponse.json(
      { error: 'Failed to update contact' },
      { status: 500 }
    )
  }
}

// DELETE /api/contacts/[id] - Delete contact
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireEditor()
  if (error) return error

  try {
    const { id } = await params

    const existing = await prisma.contact.findUnique({
      where: { id },
      select: { id: true, companyId: true, isPrimary: true },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      )
    }

    const wasPrimary = existing.isPrimary
    const companyId = existing.companyId

    await prisma.contact.delete({ where: { id } })

    // If deleted contact was primary, assign primary to next contact
    if (wasPrimary) {
      const nextContact = await prisma.contact.findFirst({
        where: { companyId },
        orderBy: { name: 'asc' },
      })

      if (nextContact) {
        await prisma.contact.update({
          where: { id: nextContact.id },
          data: { isPrimary: true },
        })
      }
    }

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error deleting contact:', error)
    return NextResponse.json(
      { error: 'Failed to delete contact' },
      { status: 500 }
    )
  }
}
