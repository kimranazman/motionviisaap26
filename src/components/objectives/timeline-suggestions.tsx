'use client'

import { Lightbulb } from 'lucide-react'
import {
  analyzeDates,
  detectOwnerOverlap,
  generateTimelineSuggestions,
} from '@/lib/initiative-date-utils'

interface TimelineSuggestionsProps {
  startDate: string | Date
  endDate: string | Date
  status: string
  allInitiatives: Array<{
    id: string
    personInCharge: string | null
    startDate: string | Date
    endDate: string | Date
    status: string
  }>
  currentInitiativeId: string
}

export function TimelineSuggestions({
  startDate,
  endDate,
  status,
  allInitiatives,
  currentInitiativeId,
}: TimelineSuggestionsProps) {
  const { flags, durationDays } = analyzeDates(startDate, endDate, status)

  const overlapMap = detectOwnerOverlap(allInitiatives)
  const overlapCount = overlapMap.get(currentInitiativeId) ?? 0

  const suggestions = generateTimelineSuggestions(flags, durationDays, overlapCount)

  if (suggestions.length === 0) return null

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-2">
      <h4 className="text-sm font-medium text-amber-800 flex items-center gap-1.5">
        <Lightbulb className="h-4 w-4" />
        Timeline Suggestions
      </h4>
      <ul className="space-y-1">
        {suggestions.map((suggestion, i) => (
          <li key={i} className="text-sm text-amber-700 flex items-start gap-2">
            <span className="shrink-0 mt-0.5">&#8226;</span>
            <span>{suggestion}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
