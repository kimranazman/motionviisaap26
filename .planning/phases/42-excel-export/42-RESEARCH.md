# Phase 42: Excel Export - Research

**Researched:** 2026-01-26
**Domain:** Server-side XLSX generation with SheetJS, Next.js API routes
**Confidence:** HIGH

## Summary

This phase adds a single-click Excel export for all initiative data. The codebase already has `xlsx@0.18.5` installed (never used), all formatting utilities in `src/lib/utils.ts`, and KPI calculation utilities in `src/lib/initiative-kpi-utils.ts`. The objectives page (`src/app/(dashboard)/objectives/page.tsx`) already demonstrates the exact Prisma query with linked projects, KPI fields, and revenue/cost aggregation needed for the export.

The implementation requires: (1) a new API route `GET /api/initiatives/export` that queries all initiatives with projects, computes derived fields (duration, % achievement, linked project count, total revenue, total costs), builds an XLSX workbook with SheetJS, and returns a buffer as a downloadable response; (2) an export button added to the initiatives list toolbar.

**Primary recommendation:** Build a server-side API route using `XLSX.utils.json_to_sheet` with explicit column ordering, return the buffer via `new Response()` with proper content-disposition headers, and add a simple download button to the initiatives-list toolbar.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| xlsx (SheetJS CE) | 0.18.5 | XLSX workbook generation | Already installed, export-only usage is safe per prior decision |
| date-fns | (installed) | Duration calculation for export | Already used in initiative-date-utils.ts |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Prisma | (installed) | Database query for initiatives + projects | Fetch all data server-side |
| lucide-react | (installed) | Download icon for export button | UI icon |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| xlsx 0.18.5 | xlsx 0.20.3 (CDN) | 0.20.3 is newer but requires CDN install; prior decision locks to existing 0.18.5 |
| Server-side generation | Client-side generation | Server-side is required (EXPORT-04) for NAS deployment reliability |

**Installation:**
```bash
# No new dependencies needed - xlsx@0.18.5 is already installed
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  app/api/initiatives/export/
    route.ts                    # GET handler: query, transform, generate XLSX, return buffer
  lib/
    initiative-export-utils.ts  # Pure functions: row mapping, column definitions, workbook building
  components/initiatives/
    initiatives-list.tsx        # Add export button to existing toolbar
```

### Pattern 1: Server-Side XLSX Generation in Next.js API Route
**What:** A GET endpoint that queries the database, transforms data, generates an XLSX buffer, and returns it as a file download.
**When to use:** When generating binary files that should work reliably regardless of client environment.
**Example:**
```typescript
// Source: SheetJS docs (https://docs.sheetjs.com/docs/demos/net/server/express/)
import * as XLSX from 'xlsx'

export async function GET(request: NextRequest) {
  const { error } = await requireAuth()
  if (error) return error

  // 1. Query data with Prisma
  const initiatives = await prisma.initiative.findMany({ ... })

  // 2. Transform to flat rows
  const rows = initiatives.map(mapInitiativeToExportRow)

  // 3. Build workbook
  const ws = XLSX.utils.json_to_sheet(rows, { header: COLUMN_ORDER })
  ws['!cols'] = COLUMN_WIDTHS
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Initiatives')

  // 4. Generate buffer and return
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
  const filename = `SAAP_Initiatives_${format(new Date(), 'yyyy-MM-dd')}.xlsx`

  return new Response(buf, {
    status: 200,
    headers: {
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Length': buf.length.toString(),
    },
  })
}
```

### Pattern 2: Client-Side Download Trigger
**What:** A button that fetches the API endpoint and triggers browser download from the response blob.
**When to use:** When the export is generated server-side but triggered from a client component.
**Example:**
```typescript
// Source: Standard browser download pattern
const handleExport = async () => {
  setIsExporting(true)
  try {
    const response = await fetch('/api/initiatives/export')
    if (!response.ok) throw new Error('Export failed')
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = response.headers.get('content-disposition')
      ?.match(/filename="(.+)"/)?.[1] || 'export.xlsx'
    a.click()
    URL.revokeObjectURL(url)
  } catch (err) {
    console.error('Export failed:', err)
  } finally {
    setIsExporting(false)
  }
}
```

### Anti-Patterns to Avoid
- **Streaming from client memory:** Do not generate XLSX client-side; the requirement (EXPORT-04) mandates server-side generation for NAS deployment reliability.
- **Fetching from existing list endpoint:** The existing `GET /api/initiatives` does NOT include projects. The export needs its own query with projects included.
- **Re-implementing formatting functions:** All formatters (`formatStatus`, `formatDepartment`, `formatObjective`, `formatTeamMember`) already exist in `src/lib/utils.ts`. Import and reuse them.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| XLSX generation | Custom XML/ZIP building | `xlsx` package (SheetJS) | Complex binary format with many edge cases |
| Date formatting for display | Custom date string building | `formatDate` from `src/lib/utils.ts` | Already handles en-MY locale |
| Duration calculation | Manual day/month math | `differenceInDays` + `intervalToDuration` from `date-fns` | Already used in `initiative-date-utils.ts` |
| Status/dept/member display names | Inline mapping | `formatStatus`, `formatDepartment`, `formatObjective`, `formatTeamMember` from `src/lib/utils.ts` | Already defined with all enum values |
| KPI % achievement | Manual calculation | `calculateKpi` from `src/lib/initiative-kpi-utils.ts` | Handles manual override, auto-calc, null-safety |
| Revenue/cost aggregation | Manual summing | Existing pattern from `objectives/page.tsx` Prisma query | Already proven with cost aggregation |

**Key insight:** Almost every transformation needed for the export already exists in the codebase. The export utility is primarily a mapping layer that calls existing functions.

## Common Pitfalls

### Pitfall 1: Prisma Decimal Serialization
**What goes wrong:** Prisma returns `Decimal` objects for `kpiTarget`, `kpiActual`, `revenue`, and cost `amount` fields. These cannot be directly serialized or used in arithmetic.
**Why it happens:** Prisma uses `Decimal.js` for `@db.Decimal` fields.
**How to avoid:** Always call `Number()` on Decimal fields before using them. The objectives page already demonstrates this pattern:
```typescript
kpiTarget: i.kpiTarget ? Number(i.kpiTarget) : null,
totalCosts: p.costs.reduce((sum, c) => sum + Number(c.amount), 0),
```
**Warning signs:** `[object Object]` appearing in cells instead of numbers.

### Pitfall 2: Dates Appearing as ISO Strings in Excel
**What goes wrong:** If you pass JavaScript `Date` objects or ISO strings directly to SheetJS, they may appear as raw strings like "2026-01-15T00:00:00.000Z" in Excel.
**Why it happens:** SheetJS CE (Community Edition) has limited date handling. Passing `Date` objects to `json_to_sheet` creates numeric date cells but the default format may not be ideal.
**How to avoid:** Two approaches:
1. Pass pre-formatted strings using `formatDate()` from utils.ts (simplest, guaranteed readable)
2. Pass `Date` objects and set `cellDates: true` in options, then set `z` property for format (more complex)
**Recommendation:** Use approach 1 -- pre-format dates as strings like "15 Jan 2026" which are universally readable and match the app's existing format.

### Pitfall 3: Missing Projects Relation in Query
**What goes wrong:** Export shows 0 for linked projects, revenue, and costs for all initiatives.
**Why it happens:** The existing `GET /api/initiatives` route does NOT include the `projects` relation. Must use a query similar to the objectives page that includes `projects` with `costs`.
**How to avoid:** Copy the query pattern from `src/app/(dashboard)/objectives/page.tsx` which includes `projects` with `revenue`, `costs`, `company`.

### Pitfall 4: SheetJS CE Column Width Not Set
**What goes wrong:** All columns are narrow, making the Excel file unreadable.
**Why it happens:** SheetJS defaults to minimal column widths.
**How to avoid:** Set `ws['!cols']` with explicit `wch` (character width) values for each column.

### Pitfall 5: ESM Import Issues with xlsx
**What goes wrong:** `import * as XLSX from 'xlsx'` may fail or miss features in Node.js ESM context.
**Why it happens:** SheetJS recommends CommonJS for Node.js. Next.js API routes use ESM.
**How to avoid:** Use `import * as XLSX from 'xlsx'`. The `xlsx@0.18.5` package includes both CJS and ESM builds. If ESM import fails, fall back to `const XLSX = require('xlsx')` or use dynamic import. Test this in the API route early.

## Code Examples

### Existing Prisma Query Pattern (from objectives/page.tsx)
```typescript
// Source: src/app/(dashboard)/objectives/page.tsx lines 8-65
const initiatives = await prisma.initiative.findMany({
  orderBy: [
    { objective: 'asc' },
    { keyResult: 'asc' },
    { sequenceNumber: 'asc' },
  ],
  select: {
    id: true,
    sequenceNumber: true,
    title: true,
    objective: true,
    keyResult: true,
    department: true,
    status: true,
    personInCharge: true,
    startDate: true,
    endDate: true,
    // Additional fields needed for export
    monthlyObjective: true,
    weeklyTasks: true,
    remarks: true,
    kpiLabel: true,
    kpiTarget: true,
    kpiActual: true,
    kpiUnit: true,
    kpiManualOverride: true,
    projects: {
      select: {
        id: true,
        title: true,
        status: true,
        revenue: true,
        costs: { select: { amount: true } },
      },
    },
  },
})
```

### Column Mapping (20 Required Columns)
```typescript
// Source: Requirements EXPORT-02
// DB field → Export column mapping
const EXPORT_COLUMNS = [
  { key: 'sequenceNumber',   header: '#',               wch: 5  },
  { key: 'objective',        header: 'Objective',       wch: 25 },
  { key: 'keyResult',        header: 'Key Result',      wch: 10 },
  { key: 'title',            header: 'Title',           wch: 50 },
  { key: 'department',       header: 'Department',      wch: 14 },
  { key: 'status',           header: 'Status',          wch: 14 },
  { key: 'owner',            header: 'Owner',           wch: 12 },
  { key: 'startDate',        header: 'Start Date',      wch: 14 },
  { key: 'endDate',          header: 'End Date',        wch: 14 },
  { key: 'duration',         header: 'Duration',        wch: 10 },
  { key: 'kpiLabel',         header: 'KPI Label',       wch: 20 },
  { key: 'kpiTarget',        header: 'KPI Target',      wch: 14 },
  { key: 'kpiActual',        header: 'KPI Actual',      wch: 14 },
  { key: 'achievement',      header: '% Achievement',   wch: 14 },
  { key: 'linkedProjects',   header: 'Linked Projects', wch: 16 },
  { key: 'totalRevenue',     header: 'Total Revenue',   wch: 16 },
  { key: 'totalCosts',       header: 'Total Costs',     wch: 16 },
  { key: 'monthlyObjective', header: 'Monthly Objective', wch: 40 },
  { key: 'weeklyTasks',      header: 'Weekly Tasks',    wch: 40 },
  { key: 'remarks',          header: 'Remarks',         wch: 30 },
]
```

### Computed Fields Mapping
```typescript
// Source: Existing codebase patterns
import { differenceInDays } from 'date-fns'
import { calculateKpi } from '@/lib/initiative-kpi-utils'
import { formatStatus, formatDepartment, formatObjective, formatTeamMember, formatDate } from '@/lib/utils'

function mapInitiativeToExportRow(initiative) {
  // Duration: computed from startDate/endDate
  const durationDays = differenceInDays(new Date(initiative.endDate), new Date(initiative.startDate))
  const durationLabel = `${durationDays}d`

  // KPI + Achievement: use existing calculateKpi
  const kpi = calculateKpi({
    kpiLabel: initiative.kpiLabel ?? null,
    kpiTarget: initiative.kpiTarget != null ? Number(initiative.kpiTarget) : null,
    kpiActual: initiative.kpiActual != null ? Number(initiative.kpiActual) : null,
    kpiUnit: initiative.kpiUnit ?? null,
    kpiManualOverride: initiative.kpiManualOverride ?? false,
    projects: initiative.projects?.map(p => ({
      id: p.id,
      revenue: p.revenue ? Number(p.revenue) : null,
    })),
  })

  // Linked projects count
  const linkedProjects = initiative.projects?.length ?? 0

  // Revenue: sum of project revenues
  const totalRevenue = (initiative.projects ?? []).reduce(
    (sum, p) => sum + (p.revenue ? Number(p.revenue) : 0), 0
  )

  // Costs: sum of all project costs
  const totalCosts = (initiative.projects ?? []).reduce(
    (sum, p) => sum + p.costs.reduce((s, c) => s + Number(c.amount), 0), 0
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
    'Duration': durationLabel,
    'KPI Label': initiative.kpiLabel || '-',
    'KPI Target': kpi.target,
    'KPI Actual': kpi.actual || null,
    '% Achievement': kpi.percentage != null ? Number(kpi.percentage.toFixed(1)) : null,
    'Linked Projects': linkedProjects,
    'Total Revenue': totalRevenue || null,
    'Total Costs': totalCosts || null,
    'Monthly Objective': initiative.monthlyObjective || '-',
    'Weekly Tasks': initiative.weeklyTasks || '-',
    'Remarks': initiative.remarks || '-',
  }
}
```

### SheetJS Workbook Generation
```typescript
// Source: SheetJS docs (https://docs.sheetjs.com/docs/demos/net/server/)
import * as XLSX from 'xlsx'

function buildWorkbook(rows: Record<string, unknown>[]) {
  const header = EXPORT_COLUMNS.map(c => c.header)
  const ws = XLSX.utils.json_to_sheet(rows, { header })
  ws['!cols'] = EXPORT_COLUMNS.map(c => ({ wch: c.wch }))

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Initiatives')

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
}
```

### API Response Pattern (following existing file route)
```typescript
// Source: Adapted from src/app/api/files/[projectId]/[filename]/route.ts
const filename = `SAAP_Initiatives_${format(new Date(), 'yyyy-MM-dd')}.xlsx`

return new Response(buf, {
  status: 200,
  headers: {
    'Content-Disposition': `attachment; filename="${filename}"`,
    'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'Content-Length': buf.length.toString(),
  },
})
```

### Export Button in Toolbar
```typescript
// Add to initiatives-list.tsx toolbar, beside the "Add Initiative" button
<Button
  variant="outline"
  onClick={handleExport}
  disabled={isExporting}
>
  {isExporting ? (
    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
  ) : (
    <Download className="mr-2 h-4 w-4" />
  )}
  Export
</Button>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| xlsx on npm (0.18.5) | SheetJS CDN (0.20.3) | 2023 | 0.18.5 is last npm version; newer versions only on CDN. 0.18.5 is safe for export-only per prior decision |
| Client-side XLSX gen | Server-side in API route | N/A (architecture choice) | Required for NAS deployment reliability (EXPORT-04) |

**Note on xlsx version:** The `xlsx@0.18.5` on npm is the last published version. SheetJS moved to CDN distribution for newer versions (currently 0.20.3). The prior decision confirms 0.18.5 is acceptable for export-only use. The `XLSX.write` buffer API works identically in both versions.

## Open Questions

1. **Header component extensibility**
   - What we know: The `Header` component (`src/components/layout/header.tsx`) accepts `title` and `description` props only. It does not support custom action buttons.
   - What's unclear: Whether to add the export button to the Header or to the initiatives-list toolbar.
   - Recommendation: Add the export button to the `initiatives-list.tsx` toolbar alongside the "Add Initiative" button. This keeps the export alongside other list actions and avoids modifying the shared Header component. The toolbar already has a flex layout that supports additional buttons.

2. **Which page gets the export button**
   - What we know: There are 5 initiative views (By Objective, List, Kanban, Timeline, Calendar). The requirement says "from the initiatives page."
   - What's unclear: Whether all views should have export or just the List view.
   - Recommendation: Add to the List view (`/initiatives`) first. The export generates the same data regardless of view mode, so the List view (which most closely matches the tabular export format) is the natural home. Can extend to other views later.

3. **Currency format in Excel**
   - What we know: EXPORT-05 requires "currency with 2 decimal places." The existing `formatCurrency` in utils.ts uses `Intl.NumberFormat` with MYR and 0 decimal places.
   - What's unclear: Whether export should use MYR formatting or just plain numbers with 2 decimals.
   - Recommendation: Use plain numbers with 2 decimal places for revenue/costs columns. This allows Excel users to apply their own formatting and do arithmetic. Prefix with nothing; the column header makes it clear.

## Sources

### Primary (HIGH confidence)
- **Codebase analysis** - Direct reading of all relevant source files
  - `prisma/schema.prisma` - Initiative model with all fields
  - `src/app/(dashboard)/objectives/page.tsx` - Exact Prisma query pattern with projects/costs
  - `src/app/api/initiatives/route.ts` - Existing API route pattern
  - `src/app/api/initiatives/[id]/route.ts` - Project serialization pattern with Decimal handling
  - `src/lib/utils.ts` - All formatting functions (formatStatus, formatDepartment, formatObjective, formatTeamMember, formatDate)
  - `src/lib/initiative-kpi-utils.ts` - KPI calculation with calculateKpi function
  - `src/lib/initiative-date-utils.ts` - Duration calculation with date-fns
  - `src/components/initiatives/initiatives-list.tsx` - Current toolbar layout for button placement
  - `src/app/api/files/[projectId]/[filename]/route.ts` - Binary file response pattern

### Secondary (MEDIUM confidence)
- [SheetJS Write Options](https://docs.sheetjs.com/docs/api/write-options/) - XLSX.write API reference
- [SheetJS Array Utilities](https://docs.sheetjs.com/docs/api/utilities/array) - json_to_sheet, column widths
- [SheetJS Server Examples](https://docs.sheetjs.com/docs/demos/net/server/) - Express/Node buffer generation
- [SheetJS Date Handling](https://docs.sheetjs.com/docs/csf/features/dates) - Date cell types and formatting

### Tertiary (LOW confidence)
- [npm xlsx package page](https://www.npmjs.com/package/xlsx) - Version status (confirmed 0.18.5 is last npm release)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - xlsx@0.18.5 is already installed, API confirmed working for export
- Architecture: HIGH - All patterns directly observed in codebase; API route + client download is standard
- Pitfalls: HIGH - Decimal serialization and missing projects relation observed directly in existing code
- Column mapping: HIGH - All 20 columns traced to specific DB fields or computed from existing utility functions

**Research date:** 2026-01-26
**Valid until:** 2026-02-26 (stable; no external dependencies changing)
