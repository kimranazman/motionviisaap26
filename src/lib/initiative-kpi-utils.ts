/**
 * Initiative KPI calculation utilities
 *
 * Calculate KPI metrics with null/zero-safe handling.
 * Supports manual override mode and auto-calculation from linked projects.
 * Used by Initiative detail pages (Phase 40) and export features (Phase 42).
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ProjectForKpi {
  id: string
  revenue: number | null
}

export interface InitiativeWithKpiAndProjects {
  kpiLabel: string | null
  kpiTarget: number | null
  kpiActual: number | null
  kpiUnit: string | null
  kpiManualOverride: boolean
  projects: ProjectForKpi[] | undefined
}

export interface KpiResult {
  label: string
  target: number | null
  actual: number
  unit: string
  percentage: number | null // null when target is 0/null or no data
  source: 'auto' | 'manual'
  displayText: string // human-readable: "RM 50,000 / RM 100,000" or "No data"
}

// ---------------------------------------------------------------------------
// Functions
// ---------------------------------------------------------------------------

/**
 * Calculate KPI metrics for an initiative.
 *
 * Two modes:
 * 1. Manual override (kpiManualOverride true AND kpiLabel set): uses manual values.
 *    CRITICAL: if target is 0 or null, percentage is null (never divide by zero).
 * 2. Auto-calculate: sums revenue from linked projects.
 *    No projects = "No data". Null revenue treated as 0 for summing.
 */
export function calculateKpi(initiative: InitiativeWithKpiAndProjects): KpiResult {
  // Manual override mode
  if (initiative.kpiManualOverride && initiative.kpiLabel) {
    const target = initiative.kpiTarget != null ? Number(initiative.kpiTarget) : null
    const actual = initiative.kpiActual != null ? Number(initiative.kpiActual) : 0

    return {
      label: initiative.kpiLabel,
      target,
      actual,
      unit: initiative.kpiUnit || '',
      // CRITICAL: zero/null target = no division, show null percentage
      percentage: target && target > 0 ? (actual / target) * 100 : null,
      source: 'manual',
      displayText: target
        ? `${actual} / ${target} ${initiative.kpiUnit || ''}`.trim()
        : `${actual} ${initiative.kpiUnit || ''}`.trim(),
    }
  }

  // Auto-calculate from linked projects
  const projects = initiative.projects || []

  // No projects = "No data"
  if (projects.length === 0) {
    return {
      label: 'No data',
      target: null,
      actual: 0,
      unit: '',
      percentage: null,
      source: 'auto',
      displayText: 'No data',
    }
  }

  // Sum revenue, treating null as 0
  const totalRevenue = projects.reduce(
    (sum, p) => sum + (p.revenue != null ? Number(p.revenue) : 0),
    0
  )
  const projectCount = projects.length

  return {
    label: 'Revenue',
    target: null,
    actual: totalRevenue,
    unit: 'RM',
    percentage: null,
    source: 'auto',
    displayText: `RM ${totalRevenue.toLocaleString()} from ${projectCount} project${projectCount !== 1 ? 's' : ''}`,
  }
}
