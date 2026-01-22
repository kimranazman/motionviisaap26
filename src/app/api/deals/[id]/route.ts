import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth, requireEditor } from '@/lib/auth-utils'
import { DealStage } from '@prisma/client'

// GET /api/deals/[id] - Get single deal with company and contact
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth()
  if (error) return error

  try {
    const { id } = await params
    const deal = await prisma.deal.findUnique({
      where: { id },
      include: {
        company: {
          select: { id: true, name: true },
        },
        contact: {
          select: { id: true, name: true },
        },
      },
    })

    if (!deal) {
      return NextResponse.json(
        { error: 'Deal not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(deal)
  } catch (error) {
    console.error('Error fetching deal:', error)
    return NextResponse.json(
      { error: 'Failed to fetch deal' },
      { status: 500 }
    )
  }
}

// PATCH /api/deals/[id] - Update deal
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireEditor()
  if (error) return error

  try {
    const { id } = await params
    const body = await request.json()

    // Check if stage is changing
    let stageUpdate = {}
    if (body.stage !== undefined) {
      const currentDeal = await prisma.deal.findUnique({
        where: { id },
        select: { stage: true },
      })
      if (currentDeal && currentDeal.stage !== body.stage) {
        stageUpdate = { stageChangedAt: new Date() }
      }
    }

    const deal = await prisma.deal.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.description !== undefined && { description: body.description || null }),
        ...(body.value !== undefined && { value: body.value ? parseFloat(body.value) : null }),
        ...(body.companyId !== undefined && { companyId: body.companyId }),
        ...(body.contactId !== undefined && { contactId: body.contactId || null }),
        ...(body.stage !== undefined && { stage: body.stage as DealStage }),
        ...(body.lostReason !== undefined && { lostReason: body.lostReason || null }),
        ...stageUpdate,
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

    return NextResponse.json(deal)
  } catch (error) {
    console.error('Error updating deal:', error)
    return NextResponse.json(
      { error: 'Failed to update deal' },
      { status: 500 }
    )
  }
}

// DELETE /api/deals/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireEditor()
  if (error) return error

  try {
    const { id } = await params
    await prisma.deal.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting deal:', error)
    return NextResponse.json(
      { error: 'Failed to delete deal' },
      { status: 500 }
    )
  }
}
