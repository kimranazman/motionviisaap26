import prisma from '@/lib/prisma'
import { ActivityEntityType, ActivityAction } from '@prisma/client'

/**
 * Generic function to create an activity log entry
 */
export async function logActivity({
  entityType,
  entityId,
  action,
  field,
  oldValue,
  newValue,
  userId,
}: {
  entityType: ActivityEntityType
  entityId: string
  action: ActivityAction
  field?: string
  oldValue?: string | null
  newValue?: string | null
  userId?: string | null
}) {
  return prisma.activityLog.create({
    data: {
      entityType,
      entityId,
      action,
      field: field || null,
      oldValue: oldValue || null,
      newValue: newValue || null,
      userId: userId || null,
    },
  })
}

/**
 * Convenience function for logging title sync events
 */
export async function logTitleSync(
  sourceType: 'DEAL' | 'POTENTIAL',
  sourceId: string,
  oldTitle: string,
  newTitle: string,
  userId?: string | null
) {
  const entityType = sourceType === 'DEAL'
    ? ActivityEntityType.DEAL
    : ActivityEntityType.POTENTIAL

  return logActivity({
    entityType,
    entityId: sourceId,
    action: ActivityAction.TITLE_SYNCED,
    field: 'title',
    oldValue: oldTitle,
    newValue: newTitle,
    userId,
  })
}

/**
 * Format activity action enum for human-readable display
 */
export function formatActivityAction(action: string): string {
  const actionMap: Record<string, string> = {
    CREATED: 'created this',
    UPDATED: 'updated this',
    STAGE_CHANGED: 'changed the stage',
    TITLE_SYNCED: 'synced title from project',
    REVENUE_UPDATED: 'updated revenue',
    STATUS_CHANGED: 'changed status',
    CONVERTED: 'converted to project',
  }

  return actionMap[action] || action.toLowerCase().replace(/_/g, ' ')
}
