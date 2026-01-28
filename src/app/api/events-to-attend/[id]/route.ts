import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { EventPriority, EventCategory, EventStatus } from '@prisma/client'
import { requireAuth, requireEditor } from '@/lib/auth-utils'

// GET /api/events-to-attend/[id] - Get single event
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth()
  if (error) return error

  try {
    const { id } = await params
    const event = await prisma.eventToAttend.findUnique({
      where: { id },
    })

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      ...event,
      estimatedCost: event.estimatedCost ? Number(event.estimatedCost) : null,
    })
  } catch (error) {
    console.error('Error fetching event:', error)
    return NextResponse.json(
      { error: 'Failed to fetch event' },
      { status: 500 }
    )
  }
}

// PATCH /api/events-to-attend/[id] - Partial update
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireEditor()
  if (error) return error

  try {
    const { id } = await params
    const body = await request.json()

    const event = await prisma.eventToAttend.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.priority !== undefined && { priority: body.priority as EventPriority }),
        ...(body.category !== undefined && { category: body.category as EventCategory }),
        ...(body.eventDate !== undefined && { eventDate: body.eventDate }),
        ...(body.location !== undefined && { location: body.location }),
        ...(body.estimatedCost !== undefined && { estimatedCost: body.estimatedCost }),
        ...(body.whyAttend !== undefined && { whyAttend: body.whyAttend || null }),
        ...(body.targetCompanies !== undefined && { targetCompanies: body.targetCompanies || null }),
        ...(body.actionRequired !== undefined && { actionRequired: body.actionRequired || null }),
        ...(body.status !== undefined && { status: body.status as EventStatus }),
        ...(body.remarks !== undefined && { remarks: body.remarks || null }),
      },
    })

    return NextResponse.json({
      ...event,
      estimatedCost: event.estimatedCost ? Number(event.estimatedCost) : null,
    })
  } catch (error) {
    console.error('Error updating event:', error)
    return NextResponse.json(
      { error: 'Failed to update event' },
      { status: 500 }
    )
  }
}

// DELETE /api/events-to-attend/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireEditor()
  if (error) return error

  try {
    const { id } = await params

    const event = await prisma.eventToAttend.findUnique({
      where: { id },
    })

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    await prisma.eventToAttend.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting event:', error)
    return NextResponse.json(
      { error: 'Failed to delete event' },
      { status: 500 }
    )
  }
}
