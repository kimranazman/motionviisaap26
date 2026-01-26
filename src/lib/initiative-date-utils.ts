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
  daysOverdue: number | null
}

export interface InitiativeForOverlap {
  id: string
  personInCharge: string | null
  startDate: string | Date
  endDate: string | Date
  status: string
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
      daysOverdue: null,
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
    daysOverdue: isOverdue ? differenceInDays(today, end) : null,
  }
}

// ---------------------------------------------------------------------------
// Overlap detection
// ---------------------------------------------------------------------------

function datesOverlap(
  start1: number,
  end1: number,
  start2: number,
  end2: number
): boolean {
  return start1 <= end2 && start2 <= end1
}

/**
 * Detect owner workload overlap across initiatives.
 *
 * Returns a Map where key is initiative ID and value is the count of
 * concurrent active initiatives for that owner (including self).
 * Only active initiatives (not COMPLETED/CANCELLED) with a personInCharge are counted.
 */
export function detectOwnerOverlap(
  initiatives: InitiativeForOverlap[]
): Map<string, number> {
  const result = new Map<string, number>()

  // Filter to active initiatives with a person assigned
  const active = initiatives.filter(
    i =>
      i.personInCharge &&
      i.status !== 'COMPLETED' &&
      i.status !== 'CANCELLED'
  )

  // Group by personInCharge for efficiency
  const byOwner = new Map<string, InitiativeForOverlap[]>()
  for (const init of active) {
    const owner = init.personInCharge!
    const list = byOwner.get(owner) ?? []
    list.push(init)
    byOwner.set(owner, list)
  }

  // For each group, count overlapping initiatives per initiative
  byOwner.forEach(group => {
    // Pre-compute timestamps
    const timestamps = group.map((init: InitiativeForOverlap) => ({
      id: init.id,
      start: new Date(init.startDate).getTime(),
      end: new Date(init.endDate).getTime(),
    }))

    for (let i = 0; i < timestamps.length; i++) {
      let count = 1 // include self
      for (let j = 0; j < timestamps.length; j++) {
        if (i === j) continue
        if (
          datesOverlap(
            timestamps[i].start,
            timestamps[i].end,
            timestamps[j].start,
            timestamps[j].end
          )
        ) {
          count++
        }
      }
      result.set(timestamps[i].id, count)
    }
  })

  return result
}

// ---------------------------------------------------------------------------
// Timeline suggestions
// ---------------------------------------------------------------------------

/**
 * Generate human-readable timeline suggestions based on flags and overlap.
 */
export function generateTimelineSuggestions(
  flags: DateFlag[],
  durationDays: number,
  overlapCount: number
): string[] {
  const suggestions: string[] = []

  if (flags.includes('overdue')) {
    suggestions.push(
      'Consider extending the end date or marking as completed/cancelled'
    )
  }
  if (flags.includes('late-start')) {
    suggestions.push(
      'Initiative has not started despite start date passing. Update status or adjust start date'
    )
  }
  if (flags.includes('long-duration')) {
    suggestions.push(
      `Duration is ${durationDays} days. Consider breaking into smaller initiatives`
    )
  }
  if (flags.includes('invalid-dates')) {
    suggestions.push('End date is before start date. Correct the date range')
  }
  if (overlapCount > 3) {
    suggestions.push(
      `Owner has ${overlapCount} concurrent initiatives. Consider redistributing workload`
    )
  }

  return suggestions
}
