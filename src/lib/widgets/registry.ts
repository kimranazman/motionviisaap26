/**
 * Widget Registry
 * Central source of truth for dashboard widget definitions
 */

import { UserRole } from '@prisma/client'
import type { WidgetDefinition } from '@/types/dashboard'

/**
 * Registry of all dashboard widgets with their metadata
 * Used by permission checking, admin management, and dashboard rendering
 */
export const WIDGET_REGISTRY: Record<string, WidgetDefinition> = {
  'kpi-cards': {
    id: 'kpi-cards',
    title: 'KPI Overview',
    description: 'Initiative statistics and completion metrics',
    defaultSize: { w: 12, h: 2 },
    minRole: UserRole.VIEWER,
    category: 'kri',
    dataKey: 'stats',
  },
  'status-chart': {
    id: 'status-chart',
    title: 'Status Distribution',
    description: 'Initiative status breakdown pie chart',
    defaultSize: { w: 6, h: 3 },
    minRole: UserRole.VIEWER,
    category: 'kri',
    dataKey: 'byStatus',
  },
  'department-chart': {
    id: 'department-chart',
    title: 'By Department',
    description: 'Initiatives grouped by department',
    defaultSize: { w: 6, h: 3 },
    minRole: UserRole.VIEWER,
    category: 'kri',
    dataKey: 'byDepartment',
  },
  'team-workload': {
    id: 'team-workload',
    title: 'Team Workload',
    description: 'Initiative distribution by team member',
    defaultSize: { w: 6, h: 3 },
    minRole: UserRole.VIEWER,
    category: 'kri',
    dataKey: 'byPerson',
  },
  'recent-initiatives': {
    id: 'recent-initiatives',
    title: 'Recent Activity',
    description: 'Recently updated initiatives',
    defaultSize: { w: 6, h: 3 },
    minRole: UserRole.VIEWER,
    category: 'kri',
    dataKey: 'recentInitiatives',
  },
  'crm-kpi-cards': {
    id: 'crm-kpi-cards',
    title: 'Sales KPIs',
    description: 'Pipeline value, forecast, win rate, revenue, profit',
    defaultSize: { w: 12, h: 2 },
    minRole: UserRole.EDITOR, // Revenue/profit sensitive - restrict to Editor+
    category: 'crm',
    dataKey: 'crmStats',
  },
  'pipeline-stage-chart': {
    id: 'pipeline-stage-chart',
    title: 'Pipeline Stages',
    description: 'Deal distribution by pipeline stage',
    defaultSize: { w: 12, h: 3 },
    minRole: UserRole.EDITOR, // Pipeline values sensitive
    category: 'crm',
    dataKey: 'stageData',
  },
}

/**
 * Array of all widget IDs for iteration
 */
export const WIDGET_IDS = Object.keys(WIDGET_REGISTRY) as string[]

/**
 * Re-export WidgetDefinition for convenience
 */
export type { WidgetDefinition } from '@/types/dashboard'
