/**
 * Initiative grouping utilities
 *
 * Normalize keyResult strings and group initiatives by objective/keyResult hierarchy.
 * Used by the Objectives page (Phase 39) and export features (Phase 42).
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface InitiativeForGrouping {
  id: string
  objective: string
  keyResult: string
  status: string
  title: string
}

export interface GroupedKeyResult {
  keyResult: string
  initiatives: InitiativeForGrouping[]
  totalInitiatives: number
  completedCount: number
}

export interface GroupedObjective {
  objective: string
  keyResults: GroupedKeyResult[]
  totalInitiatives: number
  completedCount: number
  inProgressCount: number
  atRiskCount: number
}

// ---------------------------------------------------------------------------
// Functions
// ---------------------------------------------------------------------------

/**
 * Normalize a keyResult string for grouping purposes.
 * Handles variations: "KR1.1", " kr1.1 ", "KR 1.1", "kr 1.1" -> "KR1.1"
 */
export function normalizeKeyResult(keyResult: string): string {
  return keyResult.trim().toUpperCase().replace(/\s+/g, '')
}

/**
 * Group initiatives by objective, then by normalized keyResult.
 * KeyResults are sorted naturally (KR1.1 < KR1.2 < KR2.1 via localeCompare).
 */
export function groupInitiativesByObjective(
  initiatives: InitiativeForGrouping[]
): GroupedObjective[] {
  // Group by objective enum
  const byObjective = new Map<string, InitiativeForGrouping[]>()
  for (const initiative of initiatives) {
    const group = byObjective.get(initiative.objective) || []
    group.push(initiative)
    byObjective.set(initiative.objective, group)
  }

  return Array.from(byObjective.entries()).map(([objective, items]) => {
    // Sub-group by normalized keyResult
    const byKeyResult = new Map<string, InitiativeForGrouping[]>()
    for (const item of items) {
      const normalizedKR = normalizeKeyResult(item.keyResult)
      const group = byKeyResult.get(normalizedKR) || []
      group.push(item)
      byKeyResult.set(normalizedKR, group)
    }

    const keyResults = Array.from(byKeyResult.entries())
      .sort(([a], [b]) => a.localeCompare(b)) // Natural sort: KR1.1 < KR1.2 < KR2.1
      .map(([keyResult, initiatives]) => ({
        keyResult,
        initiatives,
        totalInitiatives: initiatives.length,
        completedCount: initiatives.filter(i => i.status === 'COMPLETED').length,
      }))

    return {
      objective,
      keyResults,
      totalInitiatives: items.length,
      completedCount: items.filter(i => i.status === 'COMPLETED').length,
      inProgressCount: items.filter(i => i.status === 'IN_PROGRESS').length,
      atRiskCount: items.filter(i => i.status === 'AT_RISK').length,
    }
  })
}
