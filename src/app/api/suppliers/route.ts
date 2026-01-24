import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth, requireEditor } from '@/lib/auth-utils'

// GET /api/suppliers - List all suppliers with cost counts
export async function GET(request: NextRequest) {
  const { error } = await requireAuth()
  if (error) return error

  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search')

    const suppliers = await prisma.supplier.findMany({
      where: search ? { name: { contains: search } } : {},
      include: {
        _count: {
          select: { costs: true },
        },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(suppliers)
  } catch (error) {
    console.error('Error fetching suppliers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch suppliers' },
      { status: 500 }
    )
  }
}

// POST /api/suppliers - Create new supplier
export async function POST(request: NextRequest) {
  const { error } = await requireEditor()
  if (error) return error

  try {
    const body = await request.json()

    if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
      return NextResponse.json(
        { error: 'Supplier name is required' },
        { status: 400 }
      )
    }

    const supplier = await prisma.supplier.create({
      data: {
        name: body.name.trim(),
        email: body.email || null,
        phone: body.phone || null,
        address: body.address || null,
        website: body.website || null,
        contactPerson: body.contactPerson || null,
        acceptsCredit: body.acceptsCredit ?? false,
        paymentTerms: body.paymentTerms || null,
        notes: body.notes || null,
      },
      include: {
        _count: {
          select: { costs: true },
        },
      },
    })

    return NextResponse.json(supplier, { status: 201 })
  } catch (error) {
    console.error('Error creating supplier:', error)
    return NextResponse.json(
      { error: 'Failed to create supplier' },
      { status: 500 }
    )
  }
}
