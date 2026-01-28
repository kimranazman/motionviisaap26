import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { EventPriority, EventCategory, EventStatus } from '@prisma/client'
import { requireAuth, requireEditor } from '@/lib/auth-utils'

export async function GET(request: Request) {
  const { error } = await requireAuth()
  if (error) return error

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

// POST /api/events-to-attend - Create new event
export async function POST(request: NextRequest) {
  const { error } = await requireEditor()
  if (error) return error

  try {
    const body = await request.json()

    // Validate required fields
    const requiredFields = ['name', 'priority', 'category', 'eventDate', 'location'] as const
    for (const field of requiredFields) {
      if (!body[field] || (typeof body[field] === 'string' && !body[field].trim())) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        )
      }
    }

    const event = await prisma.eventToAttend.create({
      data: {
        name: body.name.trim(),
        priority: body.priority as EventPriority,
        category: body.category as EventCategory,
        eventDate: body.eventDate.trim(),
        location: body.location.trim(),
        estimatedCost: body.estimatedCost ?? null,
        whyAttend: body.whyAttend || null,
        targetCompanies: body.targetCompanies || null,
        actionRequired: body.actionRequired || null,
        status: (body.status as EventStatus) || 'PLANNED',
        remarks: body.remarks || null,
      },
    })

    return NextResponse.json(event, { status: 201 })
  } catch (error) {
    console.error('Error creating event:', error)
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  const { error } = await requireEditor()
  if (error) return error

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
