import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { EventPriority, EventCategory, EventStatus } from '@prisma/client'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const priority = searchParams.get('priority') as EventPriority | null
    const category = searchParams.get('category') as EventCategory | null
    const status = searchParams.get('status') as EventStatus | null

    const where: {
      priority?: EventPriority
      category?: EventCategory
      status?: EventStatus
    } = {}

    if (priority) where.priority = priority
    if (category) where.category = category
    if (status) where.status = status

    const events = await prisma.eventToAttend.findMany({
      where,
      orderBy: [
        { priority: 'asc' },
        { eventDate: 'asc' },
      ],
    })

    return NextResponse.json(events)
  } catch (error) {
    console.error('Error fetching events:', error)
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, status, remarks } = body

    if (!id) {
      return NextResponse.json({ error: 'Event ID required' }, { status: 400 })
    }

    const updateData: { status?: EventStatus; remarks?: string } = {}
    if (status) updateData.status = status
    if (remarks !== undefined) updateData.remarks = remarks

    const event = await prisma.eventToAttend.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(event)
  } catch (error) {
    console.error('Error updating event:', error)
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 })
  }
}
