/**
 * Services Pricing Excel export utilities
 *
 * Column definitions, row mapping, and workbook builder for XLSX export.
 * Used by GET /api/services-pricing/export.
 */

import * as XLSX from 'xlsx'
import { formatCurrency, formatDate } from '@/lib/utils'

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
  title: string
  company: { id: string; name: string } | null
}

export interface DeliverableForExport {
  id: string
  title: string
  description: string | null
  value: unknown // Prisma Decimal
  project: ProjectForExport
  createdAt: Date
}

// ---------------------------------------------------------------------------
// Column definitions (6 columns)
// ---------------------------------------------------------------------------

export const EXPORT_COLUMNS: ExportColumn[] = [
  { key: 'serviceTitle', header: 'Service Title', wch: 40 },
  { key: 'description', header: 'Description', wch: 50 },
  { key: 'value', header: 'Value', wch: 14 },
  { key: 'project', header: 'Project', wch: 30 },
  { key: 'client', header: 'Client', wch: 25 },
  { key: 'date', header: 'Date', wch: 14 },
]

// ---------------------------------------------------------------------------
// Row mapping
// ---------------------------------------------------------------------------

export function mapServiceToExportRow(
  deliverable: DeliverableForExport
): Record<string, string | number | null> {
  return {
    'Service Title': deliverable.title,
    'Description': deliverable.description || '-',
    'Value':
      deliverable.value !== null ? Number(deliverable.value) : null,
    'Project': deliverable.project.title,
    'Client': deliverable.project.company?.name || '-',
    'Date': formatDate(deliverable.createdAt),
  }
}

// ---------------------------------------------------------------------------
// Workbook builder
// ---------------------------------------------------------------------------

export function buildServicesWorkbook(
  rows: Record<string, string | number | null>[]
): Buffer {
  const header = EXPORT_COLUMNS.map((c) => c.header)
  const ws = XLSX.utils.json_to_sheet(rows, { header })
  ws['!cols'] = EXPORT_COLUMNS.map((c) => ({ wch: c.wch }))

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Services Pricing')

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer
}
