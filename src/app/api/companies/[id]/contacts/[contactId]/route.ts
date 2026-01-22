import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireEditor } from '@/lib/auth-utils'

// PATCH /api/companies/[id]/contacts/[contactId] - Update contact
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; contactId: string }> }
) {
  const { error } = await requireEditor()
  if (error) return error

  try {
    const { id: companyId, contactId } = await params
    const body = await request.json()

    // Verify contact exists and belongs to company
    const existingContact = await prisma.contact.findFirst({
      where: { id: contactId, companyId },
    })

    if (!existingContact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      )
    }

    // If setting as primary, unset others first via transaction
    if (body.isPrimary === true) {
      await prisma.$transaction([
        prisma.contact.updateMany({
          where: { companyId, isPrimary: true },
          data: { isPrimary: false },
        }),
        prisma.contact.update({
          where: { id: contactId },
          data: { isPrimary: true },
        }),
      ])

      // Fetch and return the updated contact
      const updatedContact = await prisma.contact.findUnique({
        where: { id: contactId },
      })

      return NextResponse.json(updatedContact)
    }

    // Regular update for other fields
    const contact = await prisma.contact.update({
      where: { id: contactId },
      data: {
        ...(body.name !== undefined && { name: body.name.trim() }),
        ...(body.email !== undefined && { email: body.email?.trim() || null }),
        ...(body.phone !== undefined && { phone: body.phone?.trim() || null }),
        ...(body.role !== undefined && { role: body.role?.trim() || null }),
        ...(body.isPrimary === false && { isPrimary: false }),
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

// DELETE /api/companies/[id]/contacts/[contactId] - Delete contact
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; contactId: string }> }
) {
  const { error } = await requireEditor()
  if (error) return error

  try {
    const { id: companyId, contactId } = await params

    // Verify contact exists and belongs to company
    const existingContact = await prisma.contact.findFirst({
      where: { id: contactId, companyId },
    })

    if (!existingContact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      )
    }

    const wasPrimary = existingContact.isPrimary

    // Delete the contact
    await prisma.contact.delete({
      where: { id: contactId },
    })

    // If deleted contact was primary, assign primary to next contact (by name order)
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

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting contact:', error)
    return NextResponse.json(
      { error: 'Failed to delete contact' },
      { status: 500 }
    )
  }
}
