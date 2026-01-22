import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth, requireEditor } from '@/lib/auth-utils'

// GET /api/companies/[id] - Get company with contacts
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth()
  if (error) return error

  try {
    const { id } = await params
    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        contacts: {
          orderBy: [
            { isPrimary: 'desc' },
            { name: 'asc' },
          ],
        },
        deals: {
          select: {
            id: true,
            title: true,
            stage: true,
            value: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        potentials: {
          select: {
            id: true,
            title: true,
            stage: true,
            estimatedValue: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        projects: {
          select: {
            id: true,
            title: true,
            status: true,
            revenue: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        _count: {
          select: { deals: true, projects: true, potentials: true },
        },
      },
    })

    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(company)
  } catch (error) {
    console.error('Error fetching company:', error)
    return NextResponse.json(
      { error: 'Failed to fetch company' },
      { status: 500 }
    )
  }
}

// PATCH /api/companies/[id] - Partial update
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireEditor()
  if (error) return error

  try {
    const { id } = await params
    const body = await request.json()

    const company = await prisma.company.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.industry !== undefined && { industry: body.industry || null }),
        ...(body.website !== undefined && { website: body.website || null }),
        ...(body.address !== undefined && { address: body.address || null }),
        ...(body.phone !== undefined && { phone: body.phone || null }),
        ...(body.notes !== undefined && { notes: body.notes || null }),
      },
    })

    return NextResponse.json(company)
  } catch (error) {
    console.error('Error updating company:', error)
    return NextResponse.json(
      { error: 'Failed to update company' },
      { status: 500 }
    )
  }
}

// DELETE /api/companies/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireEditor()
  if (error) return error

  try {
    const { id } = await params

    // Check for linked records
    const linkedCount = await prisma.company.findUnique({
      where: { id },
      select: {
        _count: { select: { deals: true, projects: true, potentials: true } },
      },
    })

    if (linkedCount) {
      const total =
        linkedCount._count.deals +
        linkedCount._count.projects +
        linkedCount._count.potentials
      if (total > 0) {
        return NextResponse.json(
          {
            error: `Cannot delete: ${total} linked record${total > 1 ? 's' : ''} exist (deals, projects, or potentials)`,
          },
          { status: 400 }
        )
      }
    }

    await prisma.company.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting company:', error)
    return NextResponse.json(
      { error: 'Failed to delete company' },
      { status: 500 }
    )
  }
}
