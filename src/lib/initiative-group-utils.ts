/**
 * Initiative grouping utilities (v2.0)
 *
 * Group initiatives by objective/keyResult hierarchy using FK relations.
 * Used by the Objectives page (Phase 39+) and export features (Phase 42).
 *
 * v2.0 change: Groups by keyResult FK relation (keyResult.krId) instead of
 * string normalization. The normalizeKeyResult() function has been removed.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface InitiativeForGrouping {
  id: string
  objective: string
  keyResultId: string | null       // FK field (String? in schema)
  keyResult?: { krId: string } | null  // Included relation
  status: string
  title: string
}

export interface GroupedKeyResult {
  keyResultId: string | null
  krId: string                     // Display label ("KR1.1") or "Unlinked"
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
 * Group initiatives by objective, then by keyResult FK relation.
 * KeyResults are sorted naturally (KR1.1 < KR1.2 < KR2.1 via localeCompare).
 * Initiatives without a linked keyResult are grouped under "Unlinked".
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
    // Sub-group by keyResult relation (using krId for display)
    const byKR = new Map<string, InitiativeForGrouping[]>()
    for (const item of items) {
      const krId = item.keyResult?.krId || 'Unlinked'
      const group = byKR.get(krId) || []
      group.push(item)
      byKR.set(krId, group)
    }

    const keyResults = Array.from(byKR.entries())
      .sort(([a], [b]) => a.localeCompare(b)) // Natural sort: KR1.1 < KR1.2 < KR2.1
      .map(([krId, krInitiatives]) => ({
        keyResultId: krInitiatives[0]?.keyResultId || null,
        krId,
        initiatives: krInitiatives,
        totalInitiatives: krInitiatives.length,
        completedCount: krInitiatives.filter(i => i.status === 'COMPLETED').length,
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
