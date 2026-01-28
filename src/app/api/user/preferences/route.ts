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
    detailViewMode: prefs?.detailViewMode ?? 'dialog',
    hiddenNavItems: (prefs?.hiddenNavItems as string[]) ?? [],
    navItemOrder: (prefs?.navItemOrder as Record<string, string[]>) ?? null,
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
  const { dashboardLayout, dateFilter, detailViewMode, hiddenNavItems, navItemOrder } = body as {
    dashboardLayout?: DashboardLayout
    dateFilter?: DateFilter
    detailViewMode?: string
    hiddenNavItems?: string[]
    navItemOrder?: Record<string, string[]>
  }

  // Build update data with only provided fields
  const data: Record<string, unknown> = {}
  if (dashboardLayout !== undefined) {
    data.dashboardLayout = dashboardLayout
  }
  if (dateFilter !== undefined) {
    data.dateFilter = dateFilter
  }
  if (detailViewMode !== undefined) {
    data.detailViewMode = detailViewMode
  }
  if (hiddenNavItems !== undefined) {
    data.hiddenNavItems = hiddenNavItems
  }
  if (navItemOrder !== undefined) {
    data.navItemOrder = navItemOrder
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
