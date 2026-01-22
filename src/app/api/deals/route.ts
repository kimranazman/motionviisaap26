import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth, requireEditor } from '@/lib/auth-utils'
import { DealStage } from '@prisma/client'

// GET /api/deals - List all deals with company and contact
export async function GET(_request: NextRequest) {
  const { error } = await requireAuth()
  if (error) return error

  try {
    const deals = await prisma.deal.findMany({
      include: {
        company: {
          select: { id: true, name: true },
        },
        contact: {
          select: { id: true, name: true },
        },
      },
      orderBy: [
        { stage: 'asc' },
        { position: 'asc' },
      ],
    })

    return NextResponse.json(deals)
  } catch (error) {
    console.error('Error fetching deals:', error)
    return NextResponse.json(
      { error: 'Failed to fetch deals' },
      { status: 500 }
    )
  }
}

// POST /api/deals - Create new deal
export async function POST(request: NextRequest) {
  const { error } = await requireEditor()
  if (error) return error

  try {
    const body = await request.json()

    // Validate required fields
    if (!body.title || typeof body.title !== 'string' || !body.title.trim()) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    if (!body.companyId || typeof body.companyId !== 'string') {
      return NextResponse.json(
        { error: 'Company is required' },
        { status: 400 }
      )
    }

    // Get next position in LEAD stage
    const maxPosition = await prisma.deal.aggregate({
      where: { stage: DealStage.LEAD },
      _max: { position: true },
    })
    const nextPosition = (maxPosition._max.position ?? -1) + 1

    const deal = await prisma.deal.create({
      data: {
        title: body.title.trim(),
        description: body.description || null,
        value: body.value ? parseFloat(body.value) : null,
        companyId: body.companyId,
        contactId: body.contactId || null,
        stage: DealStage.LEAD,
        position: nextPosition,
      },
      include: {
        company: {
          select: { id: true, name: true },
        },
        contact: {
          select: { id: true, name: true },
        },
      },
    })

    return NextResponse.json(deal, { status: 201 })
  } catch (error) {
    console.error('Error creating deal:', error)
    return NextResponse.json(
      { error: 'Failed to create deal' },
      { status: 500 }
    )
  }
}
