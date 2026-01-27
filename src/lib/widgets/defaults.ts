/**
 * AdminDefaults Management Utilities
 * Singleton pattern for system-wide dashboard defaults
 */

import { prisma } from '@/lib/prisma'
import type { AdminDefaults } from '@prisma/client'
import { UserRole } from '@prisma/client'
import type { DashboardLayout, WidgetRoleRestrictions } from '@/types/dashboard'
import { WIDGET_REGISTRY } from './registry'

/**
 * Singleton ID for AdminDefaults record
 */
export const ADMIN_DEFAULTS_ID = 'singleton'

/**
 * Default dashboard layout with all 8 widgets positioned
 * New users inherit this layout
 */
export const DEFAULT_DASHBOARD_LAYOUT: DashboardLayout = {
  widgets: [
    { id: 'kpi-cards', x: 0, y: 0, w: 12, h: 2 },
    { id: 'status-chart', x: 0, y: 2, w: 6, h: 3 },
    { id: 'department-chart', x: 6, y: 2, w: 6, h: 3 },
    { id: 'team-workload', x: 0, y: 5, w: 6, h: 3 },
    { id: 'recent-initiatives', x: 6, y: 5, w: 6, h: 3 },
    { id: 'crm-kpi-cards', x: 0, y: 8, w: 12, h: 2 },
    { id: 'pipeline-stage-chart', x: 0, y: 10, w: 12, h: 3 },
    { id: 'revenue-target', x: 0, y: 13, w: 6, h: 3 },
  ],
}

/**
 * Generate default widget role restrictions from registry
 * Based on each widget's minRole:
 * - VIEWER -> ['VIEWER', 'EDITOR', 'ADMIN']
 * - EDITOR -> ['EDITOR', 'ADMIN']
 * - ADMIN -> ['ADMIN']
 */
export function getDefaultWidgetRoles(): WidgetRoleRestrictions {
  const roleMap: Record<UserRole, UserRole[]> = {
    [UserRole.VIEWER]: [UserRole.VIEWER, UserRole.EDITOR, UserRole.ADMIN],
    [UserRole.EDITOR]: [UserRole.EDITOR, UserRole.ADMIN],
    [UserRole.ADMIN]: [UserRole.ADMIN],
  }

  const widgetRoles: WidgetRoleRestrictions = {}

  for (const [widgetId, widget] of Object.entries(WIDGET_REGISTRY)) {
    widgetRoles[widgetId] = roleMap[widget.minRole]
  }

  return widgetRoles
}

/**
 * Get or create the AdminDefaults singleton
 * Uses upsert to create if missing, no update if exists
 */
export async function getAdminDefaults(): Promise<{
  dashboardLayout: DashboardLayout
  widgetRoles: WidgetRoleRestrictions
  id: string
  createdAt: Date
  updatedAt: Date
}> {
  const defaults = await prisma.adminDefaults.upsert({
    where: { id: ADMIN_DEFAULTS_ID },
    update: {}, // Don't update if exists
    create: {
      id: ADMIN_DEFAULTS_ID,
      dashboardLayout: DEFAULT_DASHBOARD_LAYOUT as unknown as object,
      widgetRoles: getDefaultWidgetRoles() as unknown as object,
    },
  })

  return {
    id: defaults.id,
    createdAt: defaults.createdAt,
    updatedAt: defaults.updatedAt,
    dashboardLayout: defaults.dashboardLayout as unknown as DashboardLayout,
    widgetRoles: defaults.widgetRoles as unknown as WidgetRoleRestrictions,
  }
}

/**
 * Update AdminDefaults with partial updates
 * Only provided fields are updated
 */
export async function updateAdminDefaults(
  updates: Partial<{
    dashboardLayout: DashboardLayout
    widgetRoles: WidgetRoleRestrictions
  }>
): Promise<AdminDefaults> {
  const data: Record<string, unknown> = {}

  if (updates.dashboardLayout !== undefined) {
    data.dashboardLayout = updates.dashboardLayout as unknown as object
  }

  if (updates.widgetRoles !== undefined) {
    data.widgetRoles = updates.widgetRoles as unknown as object
  }

  return prisma.adminDefaults.update({
    where: { id: ADMIN_DEFAULTS_ID },
    data,
  })
}
