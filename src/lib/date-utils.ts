/**
 * Date utilities for dashboard date range filtering
 */

import {
  subDays,
  startOfMonth,
  startOfQuarter,
  startOfYear,
  format,
} from 'date-fns';
import type { DatePreset, DateFilter } from '@/types/dashboard';

/**
 * Available date presets with display labels
 */
export const DATE_PRESETS: { id: DatePreset; label: string }[] = [
  { id: 'last7days', label: 'Last 7 days' },
  { id: 'last30days', label: 'Last 30 days' },
  { id: 'last90days', label: 'Last 90 days' },
  { id: 'mtd', label: 'Month to date' },
  { id: 'qtd', label: 'Quarter to date' },
  { id: 'ytd', label: 'Year to date' },
  { id: 'custom', label: 'Custom range' },
];

/**
 * Calculate date range from a preset
 */
export function getDateRangeFromPreset(preset: DatePreset): { start: Date; end: Date } {
  const today = new Date();

  switch (preset) {
    case 'last7days':
      return { start: subDays(today, 7), end: today };
    case 'last30days':
      return { start: subDays(today, 30), end: today };
    case 'last90days':
      return { start: subDays(today, 90), end: today };
    case 'mtd':
      return { start: startOfMonth(today), end: today };
    case 'qtd':
      return { start: startOfQuarter(today), end: today };
    case 'ytd':
      return { start: startOfYear(today), end: today };
    case 'custom':
    default:
      // Default to last 30 days as fallback
      return { start: subDays(today, 30), end: today };
  }
}

/**
 * Format a DateFilter for display
 */
export function formatDateRange(filter: DateFilter): string {
  // For presets (excluding custom), return the preset label
  if (filter.preset !== 'custom') {
    const preset = DATE_PRESETS.find(p => p.id === filter.preset);
    return preset?.label ?? 'Select dates';
  }

  // For custom range, format the dates
  if (filter.startDate && filter.endDate) {
    const start = new Date(filter.startDate);
    const end = new Date(filter.endDate);

    // Same year: "Jan 1 - Mar 15, 2026"
    if (start.getFullYear() === end.getFullYear()) {
      return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
    }

    // Different years: "Dec 1, 2025 - Jan 15, 2026"
    return `${format(start, 'MMM d, yyyy')} - ${format(end, 'MMM d, yyyy')}`;
  }

  return 'Select dates';
}

/**
 * Create a DateFilter from a preset or custom dates
 */
export function createDateFilter(
  preset: DatePreset,
  customStart?: Date,
  customEnd?: Date
): DateFilter {
  if (preset === 'custom' && customStart && customEnd) {
    return {
      startDate: customStart.toISOString(),
      endDate: customEnd.toISOString(),
      preset: 'custom',
    };
  }

  const { start, end } = getDateRangeFromPreset(preset);
  return {
    startDate: start.toISOString(),
    endDate: end.toISOString(),
    preset,
  };
}

// Re-export DatePreset type for convenience
export type { DatePreset } from '@/types/dashboard';
