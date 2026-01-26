/**
 * Initiative date intelligence utilities
 *
 * Analyze initiative dates and produce intelligence flags for
 * overdue, ending-soon, late-start, invalid-dates, and long-duration conditions.
 * Used by Initiative views (Phase 40) and Objectives page (Phase 39).
 *
 * NOTE: This is separate from src/lib/date-utils.ts which handles
 * dashboard date range filtering. Different domain, different types.
 */

import { differenceInDays, isPast, isBefore, intervalToDuration } from 'date-fns'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DateFlag =
  | 'overdue'
  | 'ending-soon'
  | 'late-start'
  | 'invalid-dates'
  | 'long-duration'

export interface DateIntelligence {
  durationDays: number
  durationLabel: string
  flags: DateFlag[]
  isOverdue: boolean
  daysUntilEnd: number | null
}

// ---------------------------------------------------------------------------
// Functions
// ---------------------------------------------------------------------------

/**
 * Analyze initiative dates and detect intelligence flags.
 *
 * Flags detected:
 * - invalid-dates: end before start (returns early with durationDays 0)
 * - overdue: end is past AND status not COMPLETED/CANCELLED
 * - ending-soon: end not past, within 14 days, not COMPLETED/CANCELLED
 * - late-start: start is past AND status is NOT_STARTED
 * - long-duration: duration > 180 days
 */
export function analyzeDates(
  startDate: string | Date,
  endDate: string | Date,
  status: string
): DateIntelligence {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const today = new Date()
  const flags: DateFlag[] = []

  // Invalid dates: end before start
  if (isBefore(end, start)) {
    flags.push('invalid-dates')
    return {
      durationDays: 0,
      durationLabel: 'Invalid dates',
      flags,
      isOverdue: false,
      daysUntilEnd: null,
    }
  }

  const durationDays = differenceInDays(end, start)
  const daysUntilEnd = differenceInDays(end, today)

  // Overdue: end date is past and not completed/cancelled
  const isOverdue = isPast(end) && status !== 'COMPLETED' && status !== 'CANCELLED'
  if (isOverdue) {
    flags.push('overdue')
  }

  // Ending soon: within 14 days and not completed/cancelled
  if (
    !isPast(end) &&
    daysUntilEnd <= 14 &&
    status !== 'COMPLETED' &&
    status !== 'CANCELLED'
  ) {
    flags.push('ending-soon')
  }

  // Late start: start date is past but status is NOT_STARTED
  if (isPast(start) && status === 'NOT_STARTED') {
    flags.push('late-start')
  }

  // Long duration: > 180 days
  if (durationDays > 180) {
    flags.push('long-duration')
  }

  // Duration label: "3mo 15d" or "0d"
  const duration = intervalToDuration({ start, end })
  const parts: string[] = []
  if (duration.months) parts.push(`${duration.months}mo`)
  if (duration.days) parts.push(`${duration.days}d`)
  const durationLabel = parts.join(' ') || '0d'

  return {
    durationDays,
    durationLabel,
    flags,
    isOverdue,
    daysUntilEnd: isPast(end) ? null : daysUntilEnd,
  }
}
