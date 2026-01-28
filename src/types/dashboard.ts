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

/**
 * Extended widget config with instance ID for react-grid-layout
 * Allows duplicate widgets (same id, different i) for comparison views
 */
export interface LayoutWidgetConfig extends WidgetConfig {
  i: string;        // Instance ID (uuid) for react-grid-layout
}

/**
 * Per-breakpoint widget layouts for responsive persistence
 * Each breakpoint can store its own widget positions/sizes
 */
export interface ResponsiveLayouts {
  lg?: WidgetConfig[];
  md?: WidgetConfig[];
  sm?: WidgetConfig[];
  xs?: WidgetConfig[];
  xxs?: WidgetConfig[];
}

export interface DashboardLayout {
  widgets: WidgetConfig[];
  breakpoints?: ResponsiveLayouts;
}

export type DatePreset =
  | 'last7days'
  | 'last30days'
  | 'last90days'
  | 'mtd'      // Month to date
  | 'qtd'      // Quarter to date
  | 'ytd'      // Year to date
  | 'custom';

export interface DateFilter {
  startDate: string | null;  // ISO date string
  endDate: string | null;    // ISO date string
  preset: DatePreset;
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
  category: 'kri' | 'crm' | 'financials' | 'operations';  // Widget grouping
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
