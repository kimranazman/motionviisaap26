import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth, requireEditor } from '@/lib/auth-utils'

// GET /api/suppliers/[id] - Get single supplier with all fields
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth()
  if (error) return error

  try {
    const { id } = await params
    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        _count: {
          select: { costs: true },
        },
      },
    })

    if (!supplier) {
      return NextResponse.json(
        { error: 'Supplier not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(supplier)
  } catch (error) {
    console.error('Error fetching supplier:', error)
    return NextResponse.json(
      { error: 'Failed to fetch supplier' },
      { status: 500 }
    )
  }
}

// PATCH /api/suppliers/[id] - Partial update
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireEditor()
  if (error) return error

  try {
    const { id } = await params
    const body = await request.json()

    const supplier = await prisma.supplier.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.email !== undefined && { email: body.email || null }),
        ...(body.phone !== undefined && { phone: body.phone || null }),
        ...(body.address !== undefined && { address: body.address || null }),
        ...(body.website !== undefined && { website: body.website || null }),
        ...(body.contactPerson !== undefined && { contactPerson: body.contactPerson || null }),
        ...(body.acceptsCredit !== undefined && { acceptsCredit: body.acceptsCredit }),
        ...(body.paymentTerms !== undefined && { paymentTerms: body.paymentTerms || null }),
        ...(body.notes !== undefined && { notes: body.notes || null }),
      },
    })

    return NextResponse.json(supplier)
  } catch (error) {
    console.error('Error updating supplier:', error)
    return NextResponse.json(
      { error: 'Failed to update supplier' },
      { status: 500 }
    )
  }
}

// DELETE /api/suppliers/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireEditor()
  if (error) return error

  try {
    const { id } = await params

    // Check for linked costs
    const supplier = await prisma.supplier.findUnique({
      where: { id },
      select: {
        _count: { select: { costs: true } },
      },
    })

    if (!supplier) {
      return NextResponse.json(
        { error: 'Supplier not found' },
        { status: 404 }
      )
    }

    if (supplier._count.costs > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete: ${supplier._count.costs} cost${supplier._count.costs > 1 ? 's' : ''} linked to this supplier`,
        },
        { status: 400 }
      )
    }

    await prisma.supplier.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting supplier:', error)
    return NextResponse.json(
      { error: 'Failed to delete supplier' },
      { status: 500 }
    )
  }
}
