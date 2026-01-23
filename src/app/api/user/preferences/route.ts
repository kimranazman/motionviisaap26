/**
 * User Preferences API
 * Manages user-specific dashboard preferences (layout, date filter)
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import type { DashboardLayout, DateFilter } from '@/types/dashboard'

/**
 * GET /api/user/preferences
 * Returns the user's dashboard preferences (layout, date filter)
 */
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const prefs = await prisma.userPreferences.findUnique({
    where: { userId: session.user.id },
  })

  return NextResponse.json({
    dashboardLayout: prefs?.dashboardLayout ?? null,
    dateFilter: prefs?.dateFilter ?? null,
  })
}

/**
 * PATCH /api/user/preferences
 * Updates the user's dashboard preferences
 * Only provided fields are updated
 */
export async function PATCH(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { dashboardLayout, dateFilter } = body as {
    dashboardLayout?: DashboardLayout
    dateFilter?: DateFilter
  }

  // Build update data with only provided fields
  const data: Record<string, unknown> = {}
  if (dashboardLayout !== undefined) {
    data.dashboardLayout = dashboardLayout
  }
  if (dateFilter !== undefined) {
    data.dateFilter = dateFilter
  }

  // Upsert: create if not exists, update if exists
  await prisma.userPreferences.upsert({
    where: { userId: session.user.id },
    update: data,
    create: {
      userId: session.user.id,
      ...data,
    },
  })

  return NextResponse.json({ success: true })
}
