# Phase 48: API Layer + Utilities - Research

**Researched:** 2026-01-27
**Domain:** Next.js App Router API routes (CRUD endpoints), Prisma ORM queries, TypeScript utility functions for OKR hierarchy
**Confidence:** HIGH

## Summary

Phase 48 builds the API endpoints and utility functions needed to serve the v2.0 OKR data model created in Phase 46 (schema) and populated in Phase 47 (seed). This includes: new CRUD endpoints for KeyResult and SupportTask models, updates to existing Initiative endpoints (remove KPI fields, add keyResultId FK), rewriting dashboard stats to compute real revenue from KeyResult actual values, and rewriting grouping/calculation utilities to use FK relations instead of string matching.

The codebase already has 50+ API route files following a consistent pattern: Next.js App Router `route.ts` files using `NextRequest`/`NextResponse`, Prisma ORM for database operations, and `requireAuth()`/`requireEditor()` for authentication. New endpoints follow these exact same patterns. The critical changes are in the **existing** files -- the Initiative endpoints reference removed fields (kpiLabel, kpiTarget, monthlyObjective, weeklyTasks, keyResult-as-string) that no longer exist in the schema after Phase 46. These references will cause TypeScript/runtime errors until updated.

The utility rewrite is the most architecturally significant change. `initiative-group-utils.ts` currently groups by string normalization (`normalizeKeyResult("KR1.1")`); it must be rewritten to group by the FK relation (`initiative.keyResult.krId`). `initiative-kpi-utils.ts` references removed KPI fields and should be replaced by a KR progress calculation utility. Both utilities are imported by 5 component files that will need updates in a later UI phase.

**Primary recommendation:** Follow the existing codebase API patterns exactly (auth guards, Prisma includes, Decimal-to-Number serialization). Create new route files for key-results and support-tasks. Update existing initiative and dashboard routes to remove stale field references and use the new relational model. Rewrite grouping utils to use `keyResult.krId` from included relations. Keep utility interfaces backward-compatible where possible to minimize UI breakage in Phase 49+.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 15.x | App Router API routes (`route.ts`) | Already used; all 50+ API routes follow this pattern |
| @prisma/client | 6.19.2 | Database queries (findMany, create, update, delete, aggregate, groupBy) | Only ORM in the project |
| next-auth | 5.x | Authentication via `requireAuth()` / `requireEditor()` helpers | Already used by every API route |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @prisma/client (Decimal) | 6.19.2 | Decimal fields (target, actual, progress, weight) must be serialized to Number | Every response that includes Decimal fields |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Individual route files | Route groups or middleware | Codebase convention is individual route.ts files; don't change |
| Raw SQL for dashboard stats | Prisma groupBy + aggregate | Prisma aggregate/groupBy already used in dashboard; keep consistent |
| Zod validation | Manual body parsing | No validation library in project; manual parsing is the convention |

**Installation:**
```bash
# No new packages needed -- all already installed
```

## Architecture Patterns

### Recommended Project Structure
```
src/app/api/
  key-results/
    route.ts               # GET (list), no POST needed initially
    [id]/
      route.ts             # GET (single), PATCH (update actual/progress/status)
  support-tasks/
    route.ts               # GET (list with category filter)
  initiatives/
    route.ts               # EXISTING -- update POST to use keyResultId
    [id]/
      route.ts             # EXISTING -- update PUT/PATCH to remove KPI fields, add budget/resources
  dashboard/
    stats/
      route.ts             # EXISTING -- update revenue calculation
src/lib/
  initiative-group-utils.ts   # EXISTING -- rewrite for FK-based grouping
  initiative-kpi-utils.ts     # EXISTING -- remove or replace with kr-progress-utils.ts
```

### Pattern 1: API Route Structure (Codebase Convention)
**What:** Every API route follows the same structure: import auth helpers, parse request, query Prisma, serialize Decimals, return NextResponse.json().
**When to use:** Every new or modified API route.
**Example:**
```typescript
// Source: src/app/api/suppliers/route.ts (lines 1-32) -- existing pattern
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth, requireEditor } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  const { error } = await requireAuth()
  if (error) return error

  try {
    const searchParams = request.nextUrl.searchParams
    // ... parse params
    const data = await prisma.model.findMany({ /* query */ })
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching:', error)
    return NextResponse.json(
      { error: 'Failed to fetch' },
      { status: 500 }
    )
  }
}
```

### Pattern 2: Single Resource Route (GET/PATCH/DELETE by ID)
**What:** Dynamic route `[id]/route.ts` with params extracted via `{ params }: { params: Promise<{ id: string }> }`.
**When to use:** Every single-resource endpoint.
**Example:**
```typescript
// Source: src/app/api/suppliers/[id]/route.ts (lines 6-9) -- existing pattern
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth()
  if (error) return error
  const { id } = await params
  // ...
}
```

### Pattern 3: Decimal Serialization
**What:** Prisma returns Decimal objects that must be converted to Number for JSON responses.
**When to use:** Every response containing Decimal fields (target, actual, progress, weight on KeyResult; budget is String so no conversion needed).
**Example:**
```typescript
// Source: src/app/api/initiatives/[id]/route.ts (lines 55-64)
// Serialize Decimal fields
const serialized = {
  ...keyResult,
  target: Number(keyResult.target),
  actual: Number(keyResult.actual),
  progress: Number(keyResult.progress),
  weight: Number(keyResult.weight),
}
```

### Pattern 4: Include with _count for List Endpoints
**What:** Use Prisma `include: { _count: { select: { ... } } }` to get related record counts.
**When to use:** List endpoints where counts are needed (e.g., KeyResult list with initiative counts).
**Example:**
```typescript
// Source: src/app/api/suppliers/route.ts (lines 14-22) -- existing pattern
const keyResults = await prisma.keyResult.findMany({
  include: {
    _count: {
      select: { initiatives: true, supportTaskLinks: true },
    },
  },
  orderBy: [{ objective: 'asc' }, { krId: 'asc' }],
})
```

### Pattern 5: Query Param Filtering
**What:** Filter via `request.nextUrl.searchParams.get('param')` and build Prisma where clause.
**When to use:** SupportTask list endpoint with category filter (API-02).
**Example:**
```typescript
// Source: src/app/api/initiatives/route.ts (lines 12-44) -- existing pattern
const category = searchParams.get('category')
const where: Prisma.SupportTaskWhereInput = {}
if (category) {
  where.category = category as SupportTaskCategory
}
```

### Anti-Patterns to Avoid
- **Referencing removed schema fields:** The Initiative model no longer has `kpiLabel`, `kpiTarget`, `kpiActual`, `kpiUnit`, `kpiManualOverride`, `monthlyObjective`, `weeklyTasks`, or `keyResult` (string). Any API route that references these will crash at runtime. Phase 46 removed them from the schema.
- **Not serializing Decimals:** Prisma Decimal objects cannot be JSON-serialized directly. Always convert with `Number()`. KeyResult has 4 Decimal fields (target, actual, progress, weight).
- **Hardcoding revenue target:** The dashboard currently hardcodes `revenueTarget = 1000000`. This must be computed from KeyResult records with `metricType = REVENUE`.
- **Grouping by string fields:** The old `normalizeKeyResult()` groups by string. The new grouping must use the FK relation `initiative.keyResultId` or the included `keyResult.krId`.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Authentication guards | Custom JWT validation | `requireAuth()` / `requireEditor()` from `@/lib/auth-utils` | Already handles session checking, role verification, and returns proper 401/403 responses |
| Decimal serialization | Custom serializer | `Number(prismaDecimalValue)` | Built-in JavaScript Number constructor handles Prisma Decimal; every existing route uses this pattern |
| Revenue aggregation | Custom SQL query | `prisma.keyResult.findMany({ where: { metricType: 'REVENUE' } })` then sum in JS | Prisma can do `aggregate({ _sum })` but there are only 2 REVENUE KRs; simple JS sum is fine |
| Weighted progress calculation | Complex formula from scratch | `Sum(KR_progress * KR_weight) / Sum(KR_weight)` with null-safe handling | Standard weighted average; clamp to 0-100 |
| Error handling | Custom error middleware | try/catch with `console.error` + `NextResponse.json({ error }, { status: 500 })` | Every route in the codebase follows this exact error handling pattern |

**Key insight:** The codebase has 50+ API routes following identical patterns. Phase 48 creates 2 new route files and modifies 4 existing ones. The patterns are well-established and should be followed exactly.

## Common Pitfalls

### Pitfall 1: Existing Initiative Routes Reference Removed Schema Fields
**What goes wrong:** After Phase 46, the Initiative model no longer has `kpiLabel`, `kpiTarget`, `kpiActual`, `kpiUnit`, `kpiManualOverride`, `monthlyObjective`, `weeklyTasks`, or `keyResult` (string field). But the existing API routes still reference these fields:
- `src/app/api/initiatives/route.ts` line 40-41: searches `monthlyObjective` and `weeklyTasks`
- `src/app/api/initiatives/route.ts` line 79: writes `body.keyResult` (string)
- `src/app/api/initiatives/route.ts` lines 82-83: writes `monthlyObjective`, `weeklyTasks`
- `src/app/api/initiatives/[id]/route.ts` lines 69-70: serializes `kpiTarget`, `kpiActual`
- `src/app/api/initiatives/[id]/route.ts` line 98: writes `body.keyResult` (string)
- `src/app/api/initiatives/[id]/route.ts` lines 101-102: writes `monthlyObjective`, `weeklyTasks`
- `src/app/api/initiatives/[id]/route.ts` lines 155-173: handles KPI PATCH fields
- `src/app/api/initiatives/search/route.ts` lines 26-27: searches `monthlyObjective`, `weeklyTasks`
- `src/app/api/initiatives/export/route.ts` lines 19, 27, 34-38, 40-41: selects removed fields

**Why it happens:** Phase 46 changed the schema but did not update the consuming code (intentionally deferred to Phase 48).
**How to avoid:** Remove ALL references to removed fields. Replace `keyResult: body.keyResult` (string) with `keyResultId: body.keyResultId` (FK). Remove KPI field handling from PATCH. Remove monthlyObjective/weeklyTasks from search filters.
**Warning signs:** TypeScript compilation errors or runtime Prisma errors like "Unknown arg `kpiLabel` in data.kpiLabel".

### Pitfall 2: Dashboard Revenue Uses Hardcoded Proxy Calculation
**What goes wrong:** Both `src/app/(dashboard)/page.tsx` (lines 41-44) and `src/app/api/dashboard/stats/route.ts` (lines 41-44) compute revenue as:
```typescript
const revenueTarget = 1000000  // HARDCODED
const revenueProgress = Math.round((completedCount / totalInitiatives) * revenueTarget)
```
This is a meaningless proxy (ratio of completed initiatives * $1M). The v2.0 model has real revenue data on KeyResult.actual for metricType=REVENUE records. KR1.1 has target=800000 and KR2.2 has target=200000, totaling exactly RM 1,000,000.
**Why it happens:** Pre-v2.0, there was no structured revenue tracking; the proxy was a rough estimate.
**How to avoid:** Query `prisma.keyResult.findMany({ where: { metricType: 'REVENUE' }, select: { target: true, actual: true } })` and sum target/actual. This gives real values from the seeded data.
**Warning signs:** Revenue shows RM 0 if no initiatives are completed, even though KR actual values exist.

### Pitfall 3: Grouping Utility Expects String `keyResult` Field That No Longer Exists
**What goes wrong:** `initiative-group-utils.ts` defines `InitiativeForGrouping` with `keyResult: string` (line 15) and groups by `normalizeKeyResult(item.keyResult)` (line 67). After Phase 46, Initiative no longer has a `keyResult` string field -- it has `keyResultId` (FK) and `keyResult` (relation to KeyResult model). The grouping function will get `undefined` for `item.keyResult` since the field doesn't exist.
**Why it happens:** The utility was built for the flat string-based model (Phase 39).
**How to avoid:** Rewrite the grouping to either:
  - (a) Accept initiatives with an included `keyResult: { krId, ... }` relation and group by `item.keyResult.krId`
  - (b) Query from the KeyResult side (`prisma.keyResult.findMany({ include: { initiatives } })`) so data arrives pre-grouped
**Warning signs:** Objectives page shows all initiatives in a single "undefined" group.

### Pitfall 4: initiative-kpi-utils.ts References Removed Fields, Still Imported by 4 Files
**What goes wrong:** `initiative-kpi-utils.ts` defines types like `InitiativeWithKpiAndProjects` with fields `kpiLabel`, `kpiTarget`, `kpiActual`, `kpiUnit`, `kpiManualOverride` -- all removed from Initiative. This file is still imported by:
  - `initiative-export-utils.ts` (calculateKpi import)
  - `initiative-row.tsx` (calculateKpi + type import)
  - `key-result-group.tsx` (aggregateKpiTotals import)
  - `objective-group.tsx` (aggregateKpiTotals import)
**Why it happens:** KPI fields moved from Initiative to KeyResult model.
**How to avoid:** Per UTIL-02, remove or replace this file. But note: the 4 component files that import it are UI components updated in a later phase (not Phase 48). The safest approach is to either:
  - (a) Keep the file but export stub/no-op functions that return sensible defaults
  - (b) Remove the file entirely and accept that the UI components will have compile errors until Phase 49
**Warning signs:** Build failures in components that import from this file.

### Pitfall 5: Export Route Selects Removed Fields
**What goes wrong:** `src/app/api/initiatives/export/route.ts` selects `keyResult`, `kpiLabel`, `kpiTarget`, `kpiActual`, `kpiUnit`, `kpiManualOverride`, `monthlyObjective`, `weeklyTasks` -- all removed from the schema. The export will crash.
**Why it happens:** Export route was built for v1.5 initiative structure.
**How to avoid:** Update the export route to select only existing fields. The export column definitions in `initiative-export-utils.ts` also need updating but that's a larger change that may be deferred.
**Warning signs:** Export endpoint returns 500 error.

### Pitfall 6: Weight Validation for Objective Progress Rollup
**What goes wrong:** UTIL-03 requires `Objective Progress = Sum(KR_progress * KR_weight)` where weights should sum to 1.0 per objective. But the seed data stores weights as raw Decimal values (the column header says "Weight" but actual values from Excel may not sum to 1.0 per objective). If weights are stored as arbitrary numbers (like 40, 30, 30), the formula must normalize: `Sum(progress * weight) / Sum(weight)`.
**Why it happens:** Excel may use absolute weights (adding to 100) rather than fractional weights (adding to 1.0).
**How to avoid:** Use the normalized formula: `Sum(KR_progress_i * KR_weight_i) / Sum(KR_weight_i)`. This handles both cases correctly. If all weights are equal (default), result is simple average. Clamp output to 0-100.
**Warning signs:** Objective progress exceeds 100% or shows absurdly small values.

## Code Examples

Verified patterns from the existing codebase:

### KeyResult List Endpoint (GET /api/key-results)
```typescript
// New file: src/app/api/key-results/route.ts
// Pattern from: src/app/api/suppliers/route.ts
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  const { error } = await requireAuth()
  if (error) return error

  try {
    const keyResults = await prisma.keyResult.findMany({
      include: {
        _count: {
          select: { initiatives: true },
        },
      },
      orderBy: [{ objective: 'asc' }, { krId: 'asc' }],
    })

    // Serialize Decimal fields
    const serialized = keyResults.map(kr => ({
      ...kr,
      target: Number(kr.target),
      actual: Number(kr.actual),
      progress: Number(kr.progress),
      weight: Number(kr.weight),
    }))

    return NextResponse.json(serialized)
  } catch (error) {
    console.error('Error fetching key results:', error)
    return NextResponse.json(
      { error: 'Failed to fetch key results' },
      { status: 500 }
    )
  }
}
```

### KeyResult Detail Endpoint (GET /api/key-results/[id])
```typescript
// New file: src/app/api/key-results/[id]/route.ts
// Pattern from: src/app/api/suppliers/[id]/route.ts
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth()
  if (error) return error

  try {
    const { id } = await params
    const keyResult = await prisma.keyResult.findUnique({
      where: { id },
      include: {
        initiatives: {
          orderBy: { sequenceNumber: 'asc' },
          select: {
            id: true,
            sequenceNumber: true,
            title: true,
            status: true,
            department: true,
            personInCharge: true,
            startDate: true,
            endDate: true,
            budget: true,
            resources: true,
          },
        },
        supportTaskLinks: {
          include: {
            supportTask: {
              select: {
                id: true,
                taskId: true,
                task: true,
                category: true,
                owner: true,
              },
            },
          },
        },
      },
    })

    if (!keyResult) {
      return NextResponse.json(
        { error: 'Key result not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      ...keyResult,
      target: Number(keyResult.target),
      actual: Number(keyResult.actual),
      progress: Number(keyResult.progress),
      weight: Number(keyResult.weight),
      initiatives: keyResult.initiatives.map(i => ({
        ...i,
        startDate: i.startDate.toISOString(),
        endDate: i.endDate.toISOString(),
      })),
    })
  } catch (error) {
    console.error('Error fetching key result:', error)
    return NextResponse.json(
      { error: 'Failed to fetch key result' },
      { status: 500 }
    )
  }
}
```

### KeyResult PATCH (Update actual/progress/status)
```typescript
// In: src/app/api/key-results/[id]/route.ts
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireEditor()
  if (error) return error

  try {
    const { id } = await params
    const body = await request.json()
    const updateData: Prisma.KeyResultUpdateInput = {}

    if (body.actual !== undefined) {
      updateData.actual = parseFloat(String(body.actual))
    }
    if (body.progress !== undefined) {
      updateData.progress = parseFloat(String(body.progress))
    }
    if (body.status !== undefined) {
      updateData.status = body.status
    }

    const keyResult = await prisma.keyResult.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      ...keyResult,
      target: Number(keyResult.target),
      actual: Number(keyResult.actual),
      progress: Number(keyResult.progress),
      weight: Number(keyResult.weight),
    })
  } catch (error) {
    console.error('Error updating key result:', error)
    return NextResponse.json(
      { error: 'Failed to update key result' },
      { status: 500 }
    )
  }
}
```

### SupportTask List with Category Filter (GET /api/support-tasks)
```typescript
// New file: src/app/api/support-tasks/route.ts
// Pattern from: src/app/api/initiatives/route.ts (filter pattern)
export async function GET(request: NextRequest) {
  const { error } = await requireAuth()
  if (error) return error

  try {
    const category = request.nextUrl.searchParams.get('category')
    const where: Prisma.SupportTaskWhereInput = {}
    if (category) {
      where.category = category as SupportTaskCategory
    }

    const tasks = await prisma.supportTask.findMany({
      where,
      include: {
        keyResultLinks: {
          include: {
            keyResult: {
              select: { id: true, krId: true, description: true },
            },
          },
        },
      },
      orderBy: [{ category: 'asc' }, { taskId: 'asc' }],
    })

    return NextResponse.json(tasks)
  } catch (error) {
    console.error('Error fetching support tasks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch support tasks' },
      { status: 500 }
    )
  }
}
```

### Updated Dashboard Stats (Revenue from KeyResult)
```typescript
// In: src/app/api/dashboard/stats/route.ts
// Replace hardcoded proxy with real KR revenue data
const revenueKRs = await prisma.keyResult.findMany({
  where: { metricType: 'REVENUE' },
  select: { target: true, actual: true },
})
const revenueTarget = revenueKRs.reduce(
  (sum, kr) => sum + Number(kr.target), 0
)
const revenueProgress = revenueKRs.reduce(
  (sum, kr) => sum + Number(kr.actual), 0
)
```

### Rewritten Grouping Utility (FK-Based)
```typescript
// In: src/lib/initiative-group-utils.ts
// REWRITTEN for v2.0 -- group by KeyResult relation instead of string

export interface InitiativeForGrouping {
  id: string
  objective: string
  keyResultId: string | null
  keyResult?: { krId: string } | null  // Included relation
  status: string
  title: string
}

export interface GroupedKeyResult {
  keyResultId: string
  krId: string               // Display label ("KR1.1")
  initiatives: InitiativeForGrouping[]
  totalInitiatives: number
  completedCount: number
}

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
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([krId, initiatives]) => ({
        keyResultId: initiatives[0]?.keyResultId || '',
        krId,
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

### KR Progress Calculation Utility (UTIL-03)
```typescript
// New: src/lib/kr-progress-utils.ts (or add to initiative-group-utils.ts)

export interface KeyResultForProgress {
  progress: number  // 0-100
  weight: number    // any positive number
}

/**
 * Calculate weighted objective rollup.
 * Formula: Sum(KR_progress_i * KR_weight_i) / Sum(KR_weight_i)
 * Handles: zero weights (returns 0), missing weights (default to 1).
 * Output is clamped to 0-100.
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
```

### Updated Initiative POST (keyResultId Instead of keyResult String)
```typescript
// In: src/app/api/initiatives/route.ts POST handler
// BEFORE: keyResult: body.keyResult,  // string
// AFTER:
const initiative = await prisma.initiative.create({
  data: {
    sequenceNumber: nextSeq,
    objective: body.objective,
    keyResultId: body.keyResultId || null,  // FK instead of string
    department: body.department,
    title: body.title,
    startDate: new Date(body.startDate),
    endDate: new Date(body.endDate),
    resourcesFinancial: body.resourcesFinancial || null,
    resourcesNonFinancial: body.resourcesNonFinancial || null,
    budget: body.budget || null,
    resources: body.resources || null,
    personInCharge: body.personInCharge || null,
    accountable: body.accountable || null,
    status: body.status || 'NOT_STARTED',
    remarks: body.remarks || null,
    position: nextSeq,
  },
})
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `keyResult: body.keyResult` (string POST/PUT) | `keyResultId: body.keyResultId` (FK) | Phase 48 | Initiative create/update uses FK; form must send keyResultId |
| KPI fields on Initiative PATCH | No KPI fields (removed from schema) | Phase 48 | PATCH handler simplified; KPI tracking moves to KeyResult PATCH |
| `revenueProgress = (completed/total) * 1M` | `revenueProgress = Sum(KR.actual WHERE metricType=REVENUE)` | Phase 48 | Real revenue tracking from KeyResult model |
| `normalizeKeyResult(item.keyResult)` string grouping | Group by `item.keyResult.krId` FK relation | Phase 48 | Grouping is exact (no normalization ambiguity) |
| `aggregateKpiTotals()` from initiative KPI fields | KR metrics displayed directly from KeyResult model | Phase 48 | No more initiative-level KPI aggregation |
| `calculateKpi()` for each initiative | Not needed (KPI on KR level, not initiative) | Phase 48 | Replaced by `calculateObjectiveProgress()` for weighted rollup |

**Deprecated/outdated:**
- `initiative-kpi-utils.ts`: Entire file (calculateKpi, aggregateKpiTotals, types) -- KPI fields removed from Initiative
- `normalizeKeyResult()` in initiative-group-utils.ts: String normalization no longer needed; FK gives exact grouping
- Dashboard `revenueTarget = 1000000` hardcode: Replaced by sum of REVENUE-type KR targets
- Initiative search on `monthlyObjective`/`weeklyTasks`: Fields removed from schema

## Files Requiring Changes

### New Files to Create
| File | Purpose |
|------|---------|
| `src/app/api/key-results/route.ts` | GET list all KRs with initiative counts |
| `src/app/api/key-results/[id]/route.ts` | GET single KR, PATCH update actual/progress/status |
| `src/app/api/support-tasks/route.ts` | GET list support tasks with category filter |

### Existing Files to Modify
| File | Changes Required |
|------|-----------------|
| `src/app/api/initiatives/route.ts` | POST: `keyResult` string -> `keyResultId` FK; remove `monthlyObjective`/`weeklyTasks` from create and search |
| `src/app/api/initiatives/[id]/route.ts` | GET: remove kpiTarget/kpiActual serialization, add keyResult include; PUT: `keyResult` -> `keyResultId`, remove monthlyObjective/weeklyTasks, add budget/resources; PATCH: remove all KPI field handling |
| `src/app/api/initiatives/search/route.ts` | Remove `monthlyObjective`/`weeklyTasks` from search OR filter |
| `src/app/api/initiatives/export/route.ts` | Remove `keyResult` string sort, KPI field selects, monthlyObjective/weeklyTasks selects |
| `src/app/api/dashboard/stats/route.ts` | Replace hardcoded revenue proxy with KeyResult aggregate |
| `src/app/(dashboard)/page.tsx` | Same revenue calculation fix as dashboard stats API |
| `src/lib/initiative-group-utils.ts` | Rewrite for FK-based grouping |
| `src/lib/initiative-kpi-utils.ts` | Remove or replace (UTIL-02) |

### Files That Import Changed Utilities (UI -- affected but deferred to Phase 49+)
| File | Impact |
|------|--------|
| `src/components/objectives/objective-hierarchy.tsx` | Imports groupInitiativesByObjective; Initiative type has `keyResult: string` |
| `src/components/objectives/key-result-group.tsx` | Imports GroupedKeyResult type, aggregateKpiTotals |
| `src/components/objectives/objective-group.tsx` | Imports GroupedObjective type, aggregateKpiTotals |
| `src/components/objectives/initiative-row.tsx` | Imports calculateKpi, InitiativeWithKpiAndProjects type |
| `src/app/(dashboard)/objectives/page.tsx` | Server query selects removed fields |
| `src/lib/initiative-export-utils.ts` | Imports calculateKpi, references removed fields |

## Transition Strategy for H3 (Grouping Breakage)

Per the pitfall warning "H3: normalize at API layer during transition", the grouping utility change must be handled carefully because 3 component files import from it. Two strategies:

**Strategy A (Recommended): Update utility interface to accept both shapes.**
- The rewritten `InitiativeForGrouping` accepts `keyResult?: { krId: string } | null` (new shape from included relation)
- Add a `keyResultId` field to the interface
- The grouping function uses `item.keyResult?.krId` for the new shape
- Components that still pass the old shape will see "Unlinked" group temporarily until updated in Phase 49

**Strategy B: Keep old function, add new one alongside.**
- Keep `groupInitiativesByObjective()` as-is for backward compatibility
- Add `groupInitiativesByKeyResult()` that works with the new data shape
- Components migrate at their own pace

**Recommendation: Strategy A.** The old shape (string `keyResult` field) literally does not exist in the schema anymore, so no consumer can produce it. All consumers will need to query the included relation, making Strategy B unnecessary.

## Open Questions

Things that could not be fully resolved:

1. **How to handle initiative-export-utils.ts**
   - What we know: It imports `calculateKpi` from initiative-kpi-utils and references removed fields (keyResult string, KPI fields, monthlyObjective, weeklyTasks).
   - What's unclear: Should it be fully rewritten in Phase 48 (export is API layer) or deferred? The export route at `/api/initiatives/export` will crash until fixed.
   - Recommendation: Minimally fix the export route to not reference removed fields. Full export redesign (with KR-level metrics columns) can be Phase 49+. For now, remove KPI columns and use `keyResult: { select: { krId: true } }` include.

2. **Dashboard page.tsx vs dashboard stats API**
   - What we know: Both `page.tsx` (server component) and `/api/dashboard/stats/route.ts` have the same hardcoded revenue proxy calculation. They are duplicated code.
   - What's unclear: Should Phase 48 update both, or just the API and let the page use the API?
   - Recommendation: Update both. The page.tsx uses server-side Prisma directly (not the API). Both need the same fix. The component `kpi-cards.tsx` consumes `stats.revenueProgress` and `stats.revenueTarget` -- these field names can be kept but with real values.

3. **initiative-kpi-utils.ts removal timing**
   - What we know: 4 UI components import from this file. Removing it breaks them.
   - What's unclear: Should we remove it and let Phase 49 fix components, or keep it as a stub?
   - Recommendation: Per UTIL-02, remove or replace. Best approach: export stub functions that return safe defaults (e.g., `calculateKpi` returns `{ label: 'N/A', target: null, actual: 0, unit: '', percentage: null, source: 'manual', displayText: 'N/A' }`). This prevents runtime crashes in UI components while clearly signaling that the real data is now on KeyResult.

## Sources

### Primary (HIGH confidence)
- `/Users/khairul/Documents/MyDev/Work/Motionvii/saap2026v2/prisma/schema.prisma` -- Full v2.0 schema (894 lines), verified Phase 46 changes applied: KeyResult, SupportTask, SupportTaskKeyResult models present; Initiative KPI/string fields removed
- `/Users/khairul/Documents/MyDev/Work/Motionvii/saap2026v2/src/app/api/initiatives/route.ts` -- Current initiative list/create route (105 lines), references removed fields
- `/Users/khairul/Documents/MyDev/Work/Motionvii/saap2026v2/src/app/api/initiatives/[id]/route.ts` -- Current initiative detail/update route (213 lines), references removed KPI fields
- `/Users/khairul/Documents/MyDev/Work/Motionvii/saap2026v2/src/app/api/dashboard/stats/route.ts` -- Current dashboard stats (108 lines), hardcoded revenue proxy
- `/Users/khairul/Documents/MyDev/Work/Motionvii/saap2026v2/src/app/(dashboard)/page.tsx` -- Dashboard page server component (302 lines), duplicated revenue proxy
- `/Users/khairul/Documents/MyDev/Work/Motionvii/saap2026v2/src/lib/initiative-group-utils.ts` -- Current grouping utility (92 lines), string-based grouping
- `/Users/khairul/Documents/MyDev/Work/Motionvii/saap2026v2/src/lib/initiative-kpi-utils.ts` -- Current KPI utility (173 lines), references removed fields
- `/Users/khairul/Documents/MyDev/Work/Motionvii/saap2026v2/src/lib/initiative-export-utils.ts` -- Current export utility (177 lines), references removed fields
- `/Users/khairul/Documents/MyDev/Work/Motionvii/saap2026v2/src/app/api/suppliers/route.ts` -- Reference API pattern for new endpoints
- `/Users/khairul/Documents/MyDev/Work/Motionvii/saap2026v2/src/app/api/suppliers/[id]/route.ts` -- Reference single-resource pattern
- `/Users/khairul/Documents/MyDev/Work/Motionvii/saap2026v2/src/lib/auth-utils.ts` -- Auth guard utilities (requireAuth, requireEditor)
- `/Users/khairul/Documents/MyDev/Work/Motionvii/saap2026v2/.planning/phases/46-schema-migration/46-VERIFICATION.md` -- Confirms schema changes applied (8/8 verified)
- `/Users/khairul/Documents/MyDev/Work/Motionvii/saap2026v2/.planning/phases/47-seed-script-rewrite/47-VERIFICATION.md` -- Confirms seed data available (8/8 verified)
- `/Users/khairul/Documents/MyDev/Work/Motionvii/saap2026v2/.planning/research/v2.0-ARCHITECTURE.md` -- Architecture plan with query patterns, component hierarchy, file change list
- `/Users/khairul/Documents/MyDev/Work/Motionvii/saap2026v2/.planning/research/v2.0-PITFALLS.md` -- Pitfall catalog (C1-C4, H1-H5, M1-M5) informing this phase

### Secondary (MEDIUM confidence)
- Component files consuming the utilities (objective-hierarchy.tsx, key-result-group.tsx, objective-group.tsx, initiative-row.tsx) -- analyzed for import dependencies

### Tertiary (LOW confidence)
- None -- all findings from direct codebase analysis

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- No new packages; all patterns verified from 50+ existing API routes
- Architecture: HIGH -- File structure, auth patterns, Prisma query patterns, serialization all verified from existing code
- Pitfalls: HIGH -- All 6 pitfalls identified from direct comparison of current code vs current schema (removed fields verified absent)
- Code examples: HIGH -- All examples follow verified codebase patterns with correct Prisma types

**Research date:** 2026-01-27
**Valid until:** 2026-02-27 (30 days -- API patterns stable; Prisma schema locked from Phase 46)
