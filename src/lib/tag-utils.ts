/**
 * Tag utilities and constants
 */

// Preset color palette for tags
export const TAG_COLORS = [
  '#6B7280', // Gray
  '#EF4444', // Red
  '#F97316', // Orange
  '#EAB308', // Yellow
  '#22C55E', // Green
  '#06B6D4', // Cyan
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
] as const

export type TagColor = (typeof TAG_COLORS)[number]

// Default tag color
export const DEFAULT_TAG_COLOR = '#6B7280'

// Validate hex color format (#RRGGBB)
export function isValidHexColor(color: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(color)
}
