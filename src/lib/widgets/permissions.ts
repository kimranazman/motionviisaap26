/**
 * Widget Permission Utilities
 * Role-based access control for dashboard widgets
 */

import { UserRole } from '@prisma/client'
import { WIDGET_REGISTRY } from './registry'
import type { WidgetDefinition, WidgetRoleRestrictions } from '@/types/dashboard'

/**
 * Role hierarchy: lower index = less permissions
 * VIEWER (0) < EDITOR (1) < ADMIN (2)
 */
const ROLE_HIERARCHY: UserRole[] = [UserRole.VIEWER, UserRole.EDITOR, UserRole.ADMIN]

/**
 * Get the numeric level of a role in the hierarchy
 * Higher number = more permissions
 */
export function getRoleLevel(role: UserRole): number {
  return ROLE_HIERARCHY.indexOf(role)
}

/**
 * Check if a user role meets the minimum required role
 * @param userRole - The user's current role
 * @param requiredRole - The minimum role required
 * @returns true if userRole >= requiredRole in hierarchy
 */
export function hasMinimumRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return getRoleLevel(userRole) >= getRoleLevel(requiredRole)
}

/**
 * Check if a user can view a specific widget
 * Admin overrides (widgetRoles) take precedence over registry defaults
 * @param widgetId - The widget to check
 * @param userRole - The user's role
 * @param widgetRoles - Optional admin overrides for widget visibility
 * @returns true if user can view the widget
 */
export function canViewWidget(
  widgetId: string,
  userRole: UserRole,
  widgetRoles?: WidgetRoleRestrictions
): boolean {
  // Check admin override first (takes precedence)
  if (widgetRoles && widgetRoles[widgetId]) {
    return widgetRoles[widgetId].includes(userRole)
  }

  // Fall back to registry default minRole
  const widget = WIDGET_REGISTRY[widgetId]
  if (!widget) {
    return false // Widget not found in registry
  }

  return hasMinimumRole(userRole, widget.minRole)
}

/**
 * Filter an array of widget IDs to only those the user can view
 * @param widgetIds - Array of widget IDs to filter
 * @param userRole - The user's role
 * @param widgetRoles - Optional admin overrides
 * @returns Filtered array of widget IDs user can view
 */
export function filterWidgetsByRole(
  widgetIds: string[],
  userRole: UserRole,
  widgetRoles?: WidgetRoleRestrictions
): string[] {
  return widgetIds.filter((widgetId) => canViewWidget(widgetId, userRole, widgetRoles))
}

/**
 * Get all widget definitions the user can view
 * @param userRole - The user's role
 * @param widgetRoles - Optional admin overrides
 * @returns Array of WidgetDefinition objects user can see
 */
export function getVisibleWidgets(
  userRole: UserRole,
  widgetRoles?: WidgetRoleRestrictions
): WidgetDefinition[] {
  return Object.values(WIDGET_REGISTRY).filter((widget) =>
    canViewWidget(widget.id, userRole, widgetRoles)
  )
}
