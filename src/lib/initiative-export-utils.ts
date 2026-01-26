/**
 * Initiative Excel export utilities
 *
 * Column definitions, row mapping, and workbook builder for XLSX export.
 * Uses calculateKpi from initiative-kpi-utils.ts for KPI achievement.
 * Used by GET /api/initiatives/export (Phase 42).
 */

import * as XLSX from 'xlsx'
import { differenceInDays } from 'date-fns'
import { calculateKpi } from '@/lib/initiative-kpi-utils'
import {
  formatStatus,
  formatDepartment,
  formatObjective,
  formatTeamMember,
  formatDate,
} from '@/lib/utils'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ExportColumn {
  key: string
  header: string
  wch: number
}

interface ProjectForExport {
  id: string
  revenue: unknown // Prisma Decimal
  costs: Array<{ amount: unknown }> // Prisma Decimal
}

export interface InitiativeForExport {
  sequenceNumber: number
  objective: string
  keyResult: string
  title: string
  department: string
  status: string
  personInCharge: string | null
  startDate: Date
  endDate: Date
  kpiLabel: string | null
  kpiTarget: unknown // Prisma Decimal
  kpiActual: unknown // Prisma Decimal
  kpiUnit: string | null
  kpiManualOverride: boolean
  monthlyObjective: string | null
  weeklyTasks: string | null
  remarks: string | null
  projects: ProjectForExport[]
}

// ---------------------------------------------------------------------------
// Column definitions (20 columns, EXPORT-02 order)
// ---------------------------------------------------------------------------

export const EXPORT_COLUMNS: ExportColumn[] = [
  { key: 'sequenceNumber', header: '#', wch: 5 },
  { key: 'objective', header: 'Objective', wch: 25 },
  { key: 'keyResult', header: 'Key Result', wch: 10 },
  { key: 'title', header: 'Title', wch: 50 },
  { key: 'department', header: 'Department', wch: 14 },
  { key: 'status', header: 'Status', wch: 14 },
  { key: 'owner', header: 'Owner', wch: 12 },
  { key: 'startDate', header: 'Start Date', wch: 14 },
  { key: 'endDate', header: 'End Date', wch: 14 },
  { key: 'duration', header: 'Duration', wch: 10 },
  { key: 'kpiLabel', header: 'KPI Label', wch: 20 },
  { key: 'kpiTarget', header: 'KPI Target', wch: 14 },
  { key: 'kpiActual', header: 'KPI Actual', wch: 14 },
  { key: 'achievement', header: '% Achievement', wch: 14 },
  { key: 'linkedProjects', header: 'Linked Projects', wch: 16 },
  { key: 'totalRevenue', header: 'Total Revenue', wch: 16 },
  { key: 'totalCosts', header: 'Total Costs', wch: 16 },
  { key: 'monthlyObjective', header: 'Monthly Objective', wch: 40 },
  { key: 'weeklyTasks', header: 'Weekly Tasks', wch: 40 },
  { key: 'remarks', header: 'Remarks', wch: 30 },
]

// ---------------------------------------------------------------------------
// Row mapping
// ---------------------------------------------------------------------------

export function mapInitiativeToExportRow(
  initiative: InitiativeForExport
): Record<string, string | number | null> {
  // Duration in days
  const durationDays = differenceInDays(
    new Date(initiative.endDate),
    new Date(initiative.startDate)
  )

  // KPI achievement via calculateKpi
  const kpi = calculateKpi({
    kpiLabel: initiative.kpiLabel ?? null,
    kpiTarget:
      initiative.kpiTarget != null ? Number(initiative.kpiTarget) : null,
    kpiActual:
      initiative.kpiActual != null ? Number(initiative.kpiActual) : null,
    kpiUnit: initiative.kpiUnit ?? null,
    kpiManualOverride: initiative.kpiManualOverride ?? false,
    projects: (initiative.projects ?? []).map((p) => ({
      id: p.id,
      revenue: p.revenue != null ? Number(p.revenue) : null,
    })),
  })

  // Linked projects count
  const linkedProjects = initiative.projects?.length ?? 0

  // Revenue: sum of project revenues
  const totalRevenue = (initiative.projects ?? []).reduce(
    (sum, p) => sum + (p.revenue != null ? Number(p.revenue) : 0),
    0
  )

  // Costs: sum of all project costs
  const totalCosts = (initiative.projects ?? []).reduce(
    (sum, p) =>
      sum + p.costs.reduce((s, c) => s + Number(c.amount), 0),
    0
  )

  return {
    '#': initiative.sequenceNumber,
    'Objective': formatObjective(initiative.objective),
    'Key Result': initiative.keyResult,
    'Title': initiative.title,
    'Department': formatDepartment(initiative.department),
    'Status': formatStatus(initiative.status),
    'Owner': formatTeamMember(initiative.personInCharge),
    'Start Date': formatDate(initiative.startDate),
    'End Date': formatDate(initiative.endDate),
    'Duration': `${durationDays}d`,
    'KPI Label': initiative.kpiLabel || '-',
    'KPI Target': kpi.target,
    'KPI Actual': kpi.actual || null,
    '% Achievement':
      kpi.percentage != null
        ? Number(kpi.percentage.toFixed(1))
        : null,
    'Linked Projects': linkedProjects || null,
    'Total Revenue':
      totalRevenue > 0
        ? Number(totalRevenue.toFixed(2))
        : null,
    'Total Costs':
      totalCosts > 0
        ? Number(totalCosts.toFixed(2))
        : null,
    'Monthly Objective': initiative.monthlyObjective || '-',
    'Weekly Tasks': initiative.weeklyTasks || '-',
    'Remarks': initiative.remarks || '-',
  }
}

// ---------------------------------------------------------------------------
// Workbook builder
// ---------------------------------------------------------------------------

export function buildInitiativesWorkbook(
  rows: Record<string, string | number | null>[]
): Buffer {
  const header = EXPORT_COLUMNS.map((c) => c.header)
  const ws = XLSX.utils.json_to_sheet(rows, { header })
  ws['!cols'] = EXPORT_COLUMNS.map((c) => ({ wch: c.wch }))

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Initiatives')

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer
}
