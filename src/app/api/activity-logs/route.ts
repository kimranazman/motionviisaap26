import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-utils'
import { ActivityEntityType } from '@prisma/client'

// Valid entity types for validation
const VALID_ENTITY_TYPES = Object.values(ActivityEntityType)

// GET /api/activity-logs?entityType=DEAL&entityId=xxx&limit=20
export async function GET(request: NextRequest) {
  const { error } = await requireAuth()
  if (error) return error

  try {
    const { searchParams } = new URL(request.url)
    const entityType = searchParams.get('entityType')
    const entityId = searchParams.get('entityId')
    const limitParam = searchParams.get('limit')

    // Validate required parameters
    if (!entityType || !entityId) {
      return NextResponse.json(
        { error: 'entityType and entityId are required' },
        { status: 400 }
      )
    }

    // Validate entityType is a valid enum value
    if (!VALID_ENTITY_TYPES.includes(entityType as ActivityEntityType)) {
      return NextResponse.json(
        { error: `Invalid entityType. Must be one of: ${VALID_ENTITY_TYPES.join(', ')}` },
        { status: 400 }
      )
    }

    const limit = limitParam ? parseInt(limitParam, 10) : 20

    const logs = await prisma.activityLog.findMany({
      where: {
        entityType: entityType as ActivityEntityType,
        entityId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    // Format response
    const response = logs.map(log => ({
      id: log.id,
      action: log.action,
      field: log.field,
      oldValue: log.oldValue,
      newValue: log.newValue,
      createdAt: log.createdAt.toISOString(),
      user: log.user
        ? {
            id: log.user.id,
            name: log.user.name,
            image: log.user.image,
          }
        : null,
    }))

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching activity logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activity logs' },
      { status: 500 }
    )
  }
}
