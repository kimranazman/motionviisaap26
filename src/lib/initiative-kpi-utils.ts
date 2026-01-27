/**
 * @deprecated KPI fields removed from Initiative in v2.0. Functions return safe defaults.
 * Remove in Phase 52.
 *
 * KPI tracking has moved to the KeyResult model (metricType, target, actual, progress).
 * These stubs prevent runtime crashes in UI components that still import from this file.
 * See: src/lib/kr-progress-utils.ts for the replacement utility.
 */

// ---------------------------------------------------------------------------
// Types (preserved for backward compatibility with importing components)
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
  percentage: number | null
  source: 'auto' | 'manual'
  displayText: string
}

export interface AggregatedKpi {
  totalTarget: number
  totalActual: number
  percentage: number | null
  hasData: boolean
  mixedUnits: boolean
  unit: string
}

// ---------------------------------------------------------------------------
// Stub Functions (return safe defaults)
// ---------------------------------------------------------------------------

/**
 * @deprecated Returns safe default. KPI fields removed from Initiative in v2.0.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function calculateKpi(_initiative: InitiativeWithKpiAndProjects): KpiResult {
  return {
    label: 'N/A',
    target: null,
    actual: 0,
    unit: '',
    percentage: null,
    source: 'manual' as const,
    displayText: 'N/A',
  }
}

/**
 * @deprecated Returns safe default. KPI fields removed from Initiative in v2.0.
 */
export function aggregateKpiTotals(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _initiatives: Array<{
    id: string
    kpiLabel?: string | null
    kpiTarget?: number | null
    kpiActual?: number | null
    kpiUnit?: string | null
    kpiManualOverride?: boolean
    projects?: ProjectForKpi[] | Array<{ id: string; revenue: number | null }>
  }>
): AggregatedKpi {
  return {
    totalTarget: 0,
    totalActual: 0,
    percentage: null,
    hasData: false,
    mixedUnits: false,
    unit: '',
  }
}
