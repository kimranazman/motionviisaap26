/**
 * Dashboard customization types
 * Used for typing Prisma JSON fields in UserPreferences and AdminDefaults
 */

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
