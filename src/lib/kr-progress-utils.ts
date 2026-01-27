/**
 * Key Result progress calculation utilities
 *
 * Calculate weighted objective rollup from KeyResult progress and weight values.
 * Used by OKR Hierarchy UI (Phase 49) for objective-level progress display.
 */

export interface KeyResultForProgress {
  progress: number  // 0-100
  weight: number    // any positive number (will be normalized)
}

/**
 * Calculate weighted objective rollup.
 * Formula: Sum(KR_progress_i * KR_weight_i) / Sum(KR_weight_i)
 *
 * Handles:
 * - Empty array: returns 0
 * - Zero total weight: returns 0
 * - Missing/falsy weights: defaults to 1
 * - Result clamped to 0-100
 */
export function calculateObjectiveProgress(
  keyResults: KeyResultForProgress[]
): number {
  if (keyResults.length === 0) return 0

  const totalWeight = keyResults.reduce(
    (sum, kr) => sum + (kr.weight || 1), 0
  )
  if (totalWeight === 0) return 0

  const weightedSum = keyResults.reduce(
    (sum, kr) => sum + (Number(kr.progress) * (kr.weight || 1)), 0
  )

  return Math.max(0, Math.min(100, weightedSum / totalWeight))
}
