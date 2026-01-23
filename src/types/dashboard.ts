/**
 * Dashboard customization types
 * Used for typing Prisma JSON fields in UserPreferences and AdminDefaults
 */

import { UserRole } from '@prisma/client'

export interface WidgetConfig {
  id: string;       // Widget type identifier (e.g., 'revenue', 'pipeline')
  x: number;        // Grid position X
  y: number;        // Grid position Y
  w: number;        // Width in grid units
  h: number;        // Height in grid units
}

export interface DashboardLayout {
  widgets: WidgetConfig[];
}

export interface DateFilter {
  startDate: string | null;  // ISO date string
  endDate: string | null;    // ISO date string
  preset?: 'thisMonth' | 'lastMonth' | 'thisQuarter' | 'thisYear' | 'custom';
}

export interface WidgetRoleRestrictions {
  [widgetId: string]: string[];  // widgetId -> array of allowed role names
}

/**
 * Widget definition for the registry
 * Defines metadata and access control for each widget type
 */
export interface WidgetDefinition {
  id: string;                          // Widget type identifier
  title: string;                       // Display name
  description: string;                 // What the widget shows
  defaultSize: { w: number; h: number };  // Grid dimensions
  minRole: UserRole;                   // Minimum role required to view
  category: 'kri' | 'crm' | 'financials';  // Widget grouping
  dataKey?: string;                    // Optional key for data fetching
}

/**
 * Admin dashboard settings
 * Returned by AdminDefaults singleton
 */
export interface AdminDashboardSettings {
  dashboardLayout: DashboardLayout;
  widgetRoles: WidgetRoleRestrictions;
}
