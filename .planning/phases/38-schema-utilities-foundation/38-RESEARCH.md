# Phase 38: Schema & Utilities Foundation - Research

**Researched:** 2026-01-26
**Domain:** Prisma schema migration + Pure TypeScript utility modules (grouping, KPI, dates)
**Confidence:** HIGH

## Summary

Phase 38 is the foundation for v1.5 Initiative Intelligence & Export. It adds 5 new nullable KPI fields to the Initiative Prisma model and creates 3 pure-function utility modules that all subsequent phases (39-42) consume. The codebase already has established patterns for every aspect of this phase: the `src/lib/` directory contains 15+ utility files following a consistent `{domain}-utils.ts` naming convention, Decimal fields are handled identically across all API routes (`Number(field)` conversion), and `date-fns` v4 is already installed and used in 8 files. No new dependencies are needed.

The research confirms two key clarifications:
1. **kpiUnit field size discrepancy:** REQUIREMENTS.md says VarChar(50), ARCHITECTURE.md says VarChar(20). The requirements document (SCHEMA-01) is the authority: use `@db.VarChar(50)`.
2. **`@map` convention:** The existing Initiative model does NOT use `@map` for camelCase fields (e.g., `keyResult`, `startDate` are stored as-is). However, the architecture research specifies `@map("kpi_label")` etc. for new fields, which is consistent with how OTHER models (Project, Deal, Cost) handle multi-word columns. Follow the architecture research convention.

**Primary recommendation:** One migration adding 5 fields to Initiative, plus 3 new utility files in `src/lib/` using existing codebase conventions. The existing `src/lib/date-utils.ts` handles dashboard date filtering and should NOT be modified -- the new initiative date intelligence goes in a separate `src/lib/initiative-date-utils.ts`.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Prisma | ^6.19.2 | Schema migration, `db push` for additive changes | Already used; `prisma db push` is the established migration method (no migrations/ directory exists) |
| date-fns | ^4.1.0 | Date intelligence: `isPast`, `differenceInDays`, `isBefore`, `intervalToDuration` | Already installed and used in 8 source files |
| TypeScript | ^5 | Type definitions for utility interfaces | Already configured |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @prisma/client | ^6.19.2 | Generated types for Initiative model with new fields | Auto-generated after schema change |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `prisma db push` | `prisma migrate dev` | Project uses `db push` (no migrations/ directory exists). `db push` is simpler for development. Stick with `db push`. |
| Separate utility files | Single large `initiative-utils.ts` | Three focused files are better: each maps to a distinct concern (grouping, KPI, dates) and phases 39-42 import selectively |

## Architecture Patterns

### Recommended Project Structure
```
src/lib/
  initiative-group-utils.ts    # NEW: keyResult normalization, objective grouping
  initiative-kpi-utils.ts      # NEW: KPI calculation with null/zero handling
  initiative-date-utils.ts     # NEW: date flags (overdue, ending-soon, etc.)
  date-utils.ts                # EXISTING: dashboard date range filtering (DO NOT MODIFY)
  utils.ts                     # EXISTING: formatDate, formatStatus, etc. (DO NOT MODIFY)
  cost-utils.ts                # EXISTING: reference pattern for utils convention
  project-utils.ts             # EXISTING: reference pattern for utils convention
  pipeline-utils.ts            # EXISTING: reference pattern for utils convention
```

### Pattern 1: Utility File Convention
**What:** Each domain utility file exports pure functions and type interfaces. No React imports. No side effects. Functions accept plain data and return plain data.
**When to use:** All three new utility files.
**Example (from existing `cost-utils.ts`):**
```typescript
// src/lib/cost-utils.ts -- EXISTING pattern to follow
export function calculateTotalCosts(costs: { amount: number }[]): number {
  return costs.reduce((sum, cost) => sum + Number(cost.amount), 0)
}

export function calculateProfit(revenue: number | null, totalCosts: number): number {
  return (revenue || 0) - totalCosts
}
```

### Pattern 2: Decimal Field Handling
**What:** Prisma `Decimal` fields are serialized to `Number()` in API routes before sending to client. All existing API routes follow this pattern.
**When to use:** kpiTarget, kpiActual fields in any API route or utility function.
**Example (from existing `src/app/api/projects/[id]/route.ts`):**
```typescript
// Every API route converts Decimal to Number for JSON serialization
return NextResponse.json({
  ...project,
  revenue: project.revenue ? Number(project.revenue) : null,
  potentialRevenue: project.potentialRevenue ? Number(project.potentialRevenue) : null,
  costs: project.costs.map(cost => ({
    ...cost,
    amount: Number(cost.amount),
  })),
})
```

### Pattern 3: Schema Field Conventions
**What:** New KPI fields use `@map("snake_case")` for column names and `@db.Type(size)` for column types.
**When to use:** All 5 new fields on Initiative model.
**Example (from architecture research, aligned with REQUIREMENTS.md):**
```prisma
model Initiative {
  // ... existing fields ...

  // KPI fields (v1.5)
  kpiLabel          String?  @map("kpi_label") @db.VarChar(100)
  kpiTarget         Decimal? @map("kpi_target") @db.Decimal(12, 2)
  kpiActual         Decimal? @map("kpi_actual") @db.Decimal(12, 2)
  kpiUnit           String?  @map("kpi_unit") @db.VarChar(50)
  kpiManualOverride Boolean  @default(false) @map("kpi_manual_override")
}
```

### Anti-Patterns to Avoid
- **Modifying existing `src/lib/date-utils.ts`:** This file handles dashboard date range filtering with its own types (`DatePreset`, `DateFilter`). Initiative date intelligence is a completely different concern. Create a new file.
- **Putting utility logic in components:** All date intelligence, KPI calculation, and grouping must be pure functions in `src/lib/`. Components only call these and render results. (Architecture research section 9.4)
- **Creating a KeyResult model:** The existing `keyResult` VarChar(20) field is sufficient. Normalize on read. Do not create a new table. (Architecture research section 9.2)
- **Using `prisma migrate dev`:** The project has no `migrations/` directory and uses `prisma db push`. Do not switch approaches mid-project.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Date duration calculation | Manual day arithmetic | `differenceInDays` from date-fns | Already installed, handles edge cases (DST, leap years) |
| Overdue detection | `new Date() > endDate` | `isPast(endDate)` from date-fns | Handles timezone normalization correctly |
| Duration display | String concatenation | `intervalToDuration` + custom format from date-fns | Returns `{months, days}` object, cleaner than manual math |
| Decimal-to-Number conversion | Custom serializer | `Number(field)` pattern | Established codebase pattern in every API route |
| Progress percentage | Manual division | Existing `calculateProgress` from `src/lib/utils.ts` | Already handles zero-target case (`if (target === 0) return 0`) |

**Key insight:** The `calculateProgress` function in `src/lib/utils.ts` (line 46-49) already handles the zero-target edge case. The KPI utility should reuse this logic pattern but extend it with the specific null-handling rules for initiatives (no projects = "No data", zero target = show absolute value).

## Common Pitfalls

### Pitfall 1: kpiUnit Field Size Inconsistency
**What goes wrong:** REQUIREMENTS.md specifies `VarChar(50)` for kpiUnit. ARCHITECTURE.md specifies `VarChar(20)`. Using the wrong size creates a mismatch that surfaces later.
**Why it happens:** Research documents were produced independently and didn't reconcile.
**How to avoid:** REQUIREMENTS.md is the authority (it was approved by the user). Use `@db.VarChar(50)`.
**Warning signs:** Schema definition uses VarChar(20) instead of VarChar(50).

### Pitfall 2: Modifying Existing date-utils.ts
**What goes wrong:** Adding initiative date logic to the existing `src/lib/date-utils.ts` couples dashboard date filtering with initiative intelligence.
**Why it happens:** Name collision -- both are "date utilities."
**How to avoid:** Create `src/lib/initiative-date-utils.ts` as a separate file. The existing file imports `DatePreset` and `DateFilter` types from `@/types/dashboard` -- completely different domain.
**Warning signs:** Import path includes `@/types/dashboard` in initiative code.

### Pitfall 3: KPI Division by Zero
**What goes wrong:** Computing `(actual / target) * 100` when target is 0 or null produces `Infinity` or `NaN`.
**Why it happens:** Many initiatives will initially have no linked projects and no KPI target set.
**How to avoid:** Follow the null-handling rules from the roadmap:
- No projects: return "No data" indicator (not 0%)
- Zero target: show absolute value only, never divide
- Null revenue: treat as 0 for summing
- All nulls: return "Not configured" state
**Warning signs:** UI shows `NaN%`, `Infinity%`, or `0%` when it should show "No data".

### Pitfall 4: keyResult Normalization Not Aggressive Enough
**What goes wrong:** Normalizing with just `trim().toUpperCase()` misses variations like "KR 1.1" vs "KR1.1" (space between letters and numbers).
**Why it happens:** The roadmap success criteria says `"KR1.1", " kr1.1 ", and "KR 1.1"` must all resolve to the same group. Simple trim+uppercase would NOT handle the "KR 1.1" case (space between KR and 1.1).
**How to avoid:** Normalize by: (1) trim whitespace, (2) uppercase, (3) remove all internal spaces. Result: `value.trim().toUpperCase().replace(/\s+/g, '')`.
**Warning signs:** "KR 1.1" and "KR1.1" appear as separate groups in the hierarchy.

### Pitfall 5: Not Regenerating Prisma Client After Schema Change
**What goes wrong:** After modifying `schema.prisma`, the TypeScript types for Initiative don't include new fields, causing compile errors in utility files.
**Why it happens:** Prisma client must be regenerated after schema changes.
**How to avoid:** Run `npx prisma generate` after `prisma db push`. The existing build script already does this: `"build": "npx prisma generate && next build"`.
**Warning signs:** TypeScript errors like `Property 'kpiLabel' does not exist on type 'Initiative'`.

## Code Examples

### Schema Migration: 5 New Fields
```prisma
// Add these fields to the Initiative model in prisma/schema.prisma
// Place BEFORE the createdAt/updatedAt fields, AFTER the position field

  // KPI fields (v1.5 - Initiative Intelligence)
  kpiLabel          String?  @map("kpi_label") @db.VarChar(100)
  kpiTarget         Decimal? @map("kpi_target") @db.Decimal(12, 2)
  kpiActual         Decimal? @map("kpi_actual") @db.Decimal(12, 2)
  kpiUnit           String?  @map("kpi_unit") @db.VarChar(50)
  kpiManualOverride Boolean  @default(false) @map("kpi_manual_override")
```

### Group Utility: keyResult Normalization
```typescript
// src/lib/initiative-group-utils.ts

/**
 * Normalize a keyResult string for grouping purposes.
 * Handles variations: "KR1.1", " kr1.1 ", "KR 1.1", "kr 1.1" -> "KR1.1"
 */
export function normalizeKeyResult(keyResult: string): string {
  return keyResult.trim().toUpperCase().replace(/\s+/g, '')
}

/**
 * Group initiatives by objective, then by normalized keyResult.
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
```

### KPI Utility: Null/Zero-Safe Calculation
```typescript
// src/lib/initiative-kpi-utils.ts

export interface KpiResult {
  label: string
  target: number | null
  actual: number
  unit: string
  percentage: number | null  // null when target is 0 or no data
  source: 'auto' | 'manual'
  displayText: string        // human-readable: "RM 50,000 / RM 100,000" or "No data"
}

export function calculateKpi(initiative: InitiativeWithKpiAndProjects): KpiResult {
  // Manual override mode
  if (initiative.kpiManualOverride && initiative.kpiLabel) {
    const target = initiative.kpiTarget ? Number(initiative.kpiTarget) : null
    const actual = initiative.kpiActual ? Number(initiative.kpiActual) : 0

    return {
      label: initiative.kpiLabel,
      target,
      actual,
      unit: initiative.kpiUnit || '',
      // CRITICAL: zero target = no division, show null percentage
      percentage: target && target > 0 ? (actual / target) * 100 : null,
      source: 'manual',
      displayText: target
        ? `${actual} / ${target} ${initiative.kpiUnit || ''}`
        : `${actual} ${initiative.kpiUnit || ''}`,
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
```

### Date Utility: Flag Detection
```typescript
// src/lib/initiative-date-utils.ts
import { differenceInDays, isPast, isBefore, intervalToDuration } from 'date-fns'

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
}

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

  // Duration label
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
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `prisma migrate dev` | `prisma db push` | Project inception | No migrations directory exists. All schema changes use `db push`. |
| Inline Initiative type | Per-component `interface` | Current | Each component (form, list, kanban, calendar, gantt) defines its own `Initiative` interface. Utility files will also define their own input interfaces. |
| Single date-utils.ts | Domain-specific date utils | Phase 38 (new) | New `initiative-date-utils.ts` alongside existing `date-utils.ts`. Different concerns, different types. |

**Deprecated/outdated:**
- Nothing relevant deprecated. All dependencies are current versions.

## Open Questions

1. **kpiUnit field size: VarChar(50) vs VarChar(20)**
   - What we know: REQUIREMENTS.md says VarChar(50), ARCHITECTURE.md says VarChar(20). The roadmap phase 38 success criteria says VarChar(50).
   - Recommendation: Use VarChar(50) per REQUIREMENTS.md (the authoritative document). VarChar(50) is more generous and prevents truncation of unit labels like "percentage points" or "events completed".

2. **Where to place TypeScript interfaces for utilities**
   - What we know: The codebase does NOT have a central types directory. Each component defines its own interface inline. The existing `src/lib/date-utils.ts` imports from `@/types/dashboard`. Other utils define types inline.
   - Recommendation: Define interfaces co-located in each utility file (e.g., `InitiativeForGrouping`, `KpiResult`, `DateIntelligence` exported from their respective files). This matches the existing pattern where `date-utils.ts` is the only file importing from a shared types directory.

3. **`late-start` flag: mentioned in success criteria but not in ARCHITECTURE.md date flow**
   - What we know: Success criteria #4 says "late-start" flag. Architecture data flow (section 4.4) mentions overdue, ending-soon, long-duration, invalid-dates but NOT late-start. However, it's in the roadmap Phase 41 requirement DATE-03.
   - Recommendation: Include `late-start` in the date utility since it's in the success criteria. Logic: `isPast(startDate) && status === 'NOT_STARTED'`.

## Existing Codebase Facts (Critical for Planning)

### Initiative Model Position (schema.prisma lines 42-73)
New KPI fields should be placed after `position` (line 59) and before `createdAt` (line 61). This keeps the logical grouping of: core fields > ordering > KPI > timestamps.

### No Migrations Directory
The project uses `prisma db push` exclusively. There is no `prisma/migrations/` directory. The migration step is simply:
```bash
npx prisma db push && npx prisma generate
```

### Existing Initiative Interface Pattern
Components define their own `Initiative` interface with only the fields they need:
- `initiative-form.tsx`: 14 fields (all editable)
- `initiatives-list.tsx`: 10 fields (display only)
- `kanban-board.tsx`: 10 fields + position
- `calendar-view.tsx`: 7 fields
- `gantt-chart.tsx`: 7 fields

New utility files should follow this pattern -- define their own input interfaces with only the fields they need.

### Decimal Conversion Pattern
Every API route that returns Prisma Decimal fields converts them with `Number()`:
```typescript
revenue: project.revenue ? Number(project.revenue) : null
```
The new KPI fields (kpiTarget, kpiActual) must follow this same pattern when served from API routes.

### date-fns Usage (Currently in Codebase)
Functions currently used: `format`, `formatDistanceToNow`, `subDays`, `startOfMonth`, `endOfMonth`, `startOfQuarter`, `startOfYear`, `addMonths`, `subMonths`, `eachDayOfInterval`, `isSameMonth`, `isSameDay`, `startOfWeek`, `endOfWeek`, `parseISO`, `startOfDay`.

Functions needed but NOT yet used: `isPast`, `differenceInDays`, `isBefore`, `intervalToDuration`. These are all available in date-fns v4.1.0 (already installed).

### keyResult Seed Data
From `prisma/seed.ts` line 182: `keyResult: row[2]?.toString() || 'KR${sequenceNumber}'`. The seed imports from Excel column C, storing the raw string value. Current data is consistent (imported from a structured spreadsheet), but the form has no validation to maintain consistency.

## Sources

### Primary (HIGH confidence)
- `prisma/schema.prisma` -- Full Initiative model (lines 42-73), all Decimal field patterns
- `src/lib/date-utils.ts` -- Existing date utility (106 lines, dashboard-specific)
- `src/lib/utils.ts` -- Formatting functions, `calculateProgress` (176 lines)
- `src/lib/cost-utils.ts` -- Utility file pattern (23 lines)
- `src/app/api/initiatives/route.ts` -- API endpoint pattern (104 lines)
- `src/app/api/initiatives/[id]/route.ts` -- PUT/PATCH pattern (161 lines)
- `src/app/api/projects/[id]/route.ts` -- Decimal conversion pattern
- `src/components/initiatives/initiative-form.tsx` -- Form interface (392 lines)
- `package.json` -- date-fns ^4.1.0 confirmed
- `.planning/REQUIREMENTS.md` -- SCHEMA-01 specifies VarChar(50) for kpiUnit

### Secondary (HIGH confidence -- internal research docs)
- `.planning/research/v1.5-ARCHITECTURE.md` -- Utility module design (sections 8.1-8.3), schema fields (section 2), anti-patterns (section 9)
- `.planning/research/v1.5-STACK.md` -- date-fns v4 function inventory, grouping pattern
- `.planning/research/PITFALLS.md` -- keyResult fragility (Pitfall 1), KPI edge cases (Pitfall 2)
- `.planning/ROADMAP.md` -- Phase 38 success criteria, field specifications

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- All libraries already installed and version-confirmed from package.json
- Architecture: HIGH -- All patterns derived from reading actual source files (15+ utility files, 10+ API routes)
- Pitfalls: HIGH -- Derived from codebase analysis + internal research documents (PITFALLS.md)

**Research date:** 2026-01-26
**Valid until:** 2026-02-26 (stable -- no dependency changes expected)
