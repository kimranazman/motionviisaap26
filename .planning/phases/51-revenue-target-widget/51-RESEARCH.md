# Phase 51: Revenue Target Widget - Research

**Researched:** 2026-01-27
**Domain:** Dashboard widget registration, revenue data fetching, React component patterns
**Confidence:** HIGH

## Summary

Phase 51 adds a new `revenue-target` widget to the existing dashboard widget system. The codebase has a well-established widget pattern with 8 existing widgets: a registry (`src/lib/widgets/registry.ts`), permission system (`permissions.ts`), layout defaults (`defaults.ts`), and a render switch in `dashboard-client.tsx`. The new widget displays RM1,000,000 total revenue target broken down by Events (KR1.1, RM800K) and AI Training (KR2.2, RM200K), using real KeyResult actual values from the database.

The revenue data is already fetched in the dashboard server component (`page.tsx` lines 39-48) -- it queries `prisma.keyResult.findMany({ where: { metricType: 'REVENUE' } })` and computes `revenueTarget` and `revenueProgress` sums. However, the current fetch only returns aggregate totals (summed target + summed actual), not the per-KR breakdown needed by this widget. The server component will need a slightly expanded query to provide per-KR breakdown data (krId, description, target, actual per row).

The widget component itself is a straightforward React presentation component following the same patterns as `kpi-cards.tsx` and `crm-kpi-cards.tsx`. It uses shadcn/ui `Card`, `Progress`, and `formatCurrency` -- all already available in the codebase. No new library dependencies are needed.

**Primary recommendation:** Add the `revenue-target` widget entry to the registry, expand the dashboard server component data fetch to include per-KR revenue breakdown, create the widget component, wire it into the render switch, and add it to the default layout.

## Standard Stack

### Core

No new libraries required. Everything needed is already in the project:

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@radix-ui/react-progress` | (installed) | Progress bar component | Already used by kpi-cards.tsx |
| `lucide-react` | (installed) | Icons (TrendingUp, Target, DollarSign) | Used by all existing widgets |
| shadcn/ui Card | (installed) | Widget card styling | Used by all existing widgets |
| Prisma | (installed) | KeyResult data query | Used by dashboard server component |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@/lib/utils` (`formatCurrency`) | N/A | RM currency formatting | For all monetary display |
| `@/lib/utils` (`cn`) | N/A | Tailwind class merging | For conditional styling |

### Alternatives Considered

None. This phase uses exclusively existing infrastructure.

## Architecture Patterns

### Recommended Project Structure

No new directories needed. All files fit in existing locations:

```
src/
  lib/widgets/
    registry.ts          # ADD entry for 'revenue-target'
    defaults.ts          # ADD to DEFAULT_DASHBOARD_LAYOUT
  components/dashboard/
    revenue-target.tsx   # NEW - widget component
    dashboard-client.tsx # MODIFY - import + render switch case
  app/(dashboard)/
    page.tsx             # MODIFY - expand revenue data fetch
  types/
    dashboard.ts         # MODIFY - add 'saap' category (or use existing 'kri')
```

### Pattern 1: Widget Registration (Registry Entry)

**What:** Every dashboard widget must have an entry in `WIDGET_REGISTRY` in `src/lib/widgets/registry.ts`.
**When to use:** Always -- this is the single source of truth for widget metadata.
**Example:**
```typescript
// Source: src/lib/widgets/registry.ts (existing pattern)
'revenue-target': {
  id: 'revenue-target',
  title: 'Revenue Target',
  description: 'RM1M revenue target with Events and AI Training breakdown',
  defaultSize: { w: 6, h: 3 },
  minRole: UserRole.EDITOR, // Revenue data is sensitive
  category: 'kri',
  dataKey: 'revenueBreakdown',
},
```

### Pattern 2: Data Flow (Server Component -> Client Props)

**What:** Dashboard data flows from server component (`page.tsx`) -> `DashboardClient` props -> individual widget components. Widgets do NOT fetch their own data (except `pending-analysis` which is an exception using client-side fetch).
**When to use:** For any widget that shows data available at page load time.
**How it works:**
1. `page.tsx` (server component) fetches data from Prisma directly
2. Data is serialized and passed as props to `<DashboardClient>`
3. `DashboardClient` passes data to the `renderWidget` callback
4. The `renderWidget` switch renders the correct component with its props

**Example (existing pattern from CRM widgets):**
```typescript
// In page.tsx - fetch with breakdown
const revenueKRs = await prisma.keyResult.findMany({
  where: { metricType: 'REVENUE' },
  select: { krId: true, description: true, target: true, actual: true },
})

// In DashboardClient - render switch
case 'revenue-target':
  return <RevenueTarget breakdown={revenueData.breakdown} />
```

### Pattern 3: Widget Component Structure

**What:** All widget components receive data as props and render within the `WidgetWrapper` card. The component fills `h-full` to respect grid sizing.
**When to use:** Every widget component.
**Example (from kpi-cards.tsx):**
```typescript
// Root div always has h-full to fill the widget wrapper
<div className="h-full flex flex-col">
  {/* Content */}
</div>
```

### Pattern 4: Default Layout Positioning

**What:** New widgets should be added to `DEFAULT_DASHBOARD_LAYOUT` in `defaults.ts` so new users see them.
**When to use:** For every new widget that should appear by default.
**Example:**
```typescript
// Add after pipeline-stage-chart (y=10, h=3 -> next y=13)
{ id: 'revenue-target', x: 0, y: 13, w: 6, h: 3 },
```

### Anti-Patterns to Avoid

- **Client-side data fetch for server-available data:** Do NOT make the revenue-target widget fetch from an API endpoint. The revenue data is already available in the server component; pass it down as props like all other SSR widgets do.
- **Hardcoding revenue targets:** Do NOT hardcode RM800K or RM200K in the widget component. These values come from `KeyResult.target` for `metricType=REVENUE` records. If targets change in the database, the widget should reflect it.
- **Modifying widget types without updating the category union:** If using a new category (e.g., `'saap'`), the `WidgetDefinition.category` type union must be updated in `src/types/dashboard.ts`. However, using the existing `'kri'` category is simpler and appropriate since revenue targets relate to Key Results.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Currency formatting | Custom formatter | `formatCurrency()` from `@/lib/utils` | Already handles MYR, en-MY locale, no decimals |
| Progress bar | Custom div with width% | `<Progress>` from `@/components/ui/progress` | Radix-based, accessible, animated, themed |
| Widget card frame | Custom card wrapper | `WidgetWrapper` provides this automatically | DashboardGrid renders every widget inside WidgetWrapper |
| Role-based visibility | Custom role check | `minRole` in registry + `permissions.ts` system | Existing system handles VIEWER/EDITOR/ADMIN hierarchy |
| Layout positioning | Manual grid math | `addWidgetToLayout()` from layout-utils.ts | Handles y-position calculation, instance IDs |

**Key insight:** The entire widget infrastructure already exists. This phase is 90% following established patterns and 10% creating a new React component.

## Common Pitfalls

### Pitfall 1: Forgetting to Update DashboardClientProps Interface

**What goes wrong:** Adding revenue breakdown data to `page.tsx` but not updating the `DashboardClientProps` interface in `dashboard-client.tsx`. TypeScript will catch this, but it is easy to miss the type definition since it is inline (not a separate file).
**Why it happens:** The props interface is defined directly in `dashboard-client.tsx` (lines 21-63), not in a shared types file.
**How to avoid:** When adding `revenueBreakdown` to the data flow, update all three places: (1) `page.tsx` fetch, (2) `DashboardClientProps` interface, (3) `DashboardClient` component destructuring.
**Warning signs:** TypeScript error on the `<DashboardClient>` JSX element.

### Pitfall 2: Not Adding Widget to Default Layout

**What goes wrong:** Widget exists in registry and render switch, but does not appear for new users because it is missing from `DEFAULT_DASHBOARD_LAYOUT` in `defaults.ts`.
**Why it happens:** Registry and default layout are separate concerns in separate files.
**How to avoid:** Always update both `WIDGET_REGISTRY` (registry.ts) AND `DEFAULT_DASHBOARD_LAYOUT` (defaults.ts).
**Warning signs:** Widget appears in the widget bank but is not on the dashboard by default.

### Pitfall 3: Not Handling Zero/Missing Actual Values

**What goes wrong:** If KR actual values are 0 (default), the percentage calculation divides 0/target correctly but the UI might look wrong (showing 0% without proper formatting).
**Why it happens:** KR actual values default to 0 in the schema (`actual Decimal @default(0)`).
**How to avoid:** Handle 0% gracefully -- show "RM0" and 0% progress bar, not blank or error state.
**Warning signs:** Widget shows empty or broken when no revenue has been recorded yet.

### Pitfall 4: Existing Users Don't See New Widget

**What goes wrong:** Users who already have a saved dashboard layout in UserPreferences will NOT see the new widget automatically. Their saved layout only contains the widgets they had before.
**Why it happens:** The system loads user layout from `UserPreferences.dashboardLayout` if it exists, falling back to `DEFAULT_DASHBOARD_LAYOUT` only for users without saved preferences.
**How to avoid:** This is expected behavior -- users can add the widget from the widget bank. Do NOT force-inject the widget into existing layouts. The widget bank (sidebar sheet) will show the new widget for users to add manually.
**Warning signs:** Not a bug, just expected -- only new users or users who reset layout see it by default.

### Pitfall 5: Category Type Union Not Updated

**What goes wrong:** If you choose a category value not in the `WidgetDefinition.category` union type (`'kri' | 'crm' | 'financials' | 'operations'`), TypeScript will error.
**Why it happens:** The category type is a string union, not an open string.
**How to avoid:** Either use an existing category (`'kri'` is appropriate since this tracks Key Result revenue metrics) or add a new category to both the type definition in `dashboard.ts` AND the `CATEGORY_LABELS` mapping in `widget-bank.tsx`.
**Warning signs:** TypeScript compile error on the registry entry.

## Code Examples

Verified patterns from the existing codebase:

### Revenue Data Fetch (Expanding Current Query)

```typescript
// Source: src/app/(dashboard)/page.tsx lines 39-48 (CURRENT)
const revenueKRs = await prisma.keyResult.findMany({
  where: { metricType: 'REVENUE' },
  select: { target: true, actual: true },
})

// EXPANDED version for Phase 51 (add krId + description for breakdown):
const revenueKRs = await prisma.keyResult.findMany({
  where: { metricType: 'REVENUE' },
  select: { krId: true, description: true, target: true, actual: true },
  orderBy: { krId: 'asc' },
})

// Then compute breakdown:
const revenueBreakdown = revenueKRs.map(kr => ({
  krId: kr.krId,
  description: kr.description,
  target: Number(kr.target),
  actual: Number(kr.actual),
}))
const revenueTarget = revenueBreakdown.reduce((sum, kr) => sum + kr.target, 0)
const revenueProgress = revenueBreakdown.reduce((sum, kr) => sum + kr.actual, 0)
```

### Widget Registry Entry Pattern

```typescript
// Source: src/lib/widgets/registry.ts (follow existing pattern)
'revenue-target': {
  id: 'revenue-target',
  title: 'Revenue Target',
  description: 'RM1M revenue target with Events and AI Training breakdown',
  defaultSize: { w: 6, h: 3 },
  minRole: UserRole.EDITOR,
  category: 'kri',
  dataKey: 'revenueBreakdown',
},
```

### Default Layout Entry Pattern

```typescript
// Source: src/lib/widgets/defaults.ts (add after last entry)
// Current last entry: { id: 'pipeline-stage-chart', x: 0, y: 10, w: 12, h: 3 }
// New entry at y=13:
{ id: 'revenue-target', x: 0, y: 13, w: 6, h: 3 },
```

### Widget Component Pattern (Following kpi-cards.tsx + crm-kpi-cards.tsx)

```typescript
// Source: Pattern derived from src/components/dashboard/kpi-cards.tsx
'use client'

import { Progress } from '@/components/ui/progress'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp } from 'lucide-react'

interface RevenueBreakdownItem {
  krId: string        // "KR1.1", "KR2.2"
  description: string // "Event Revenue", "AI Training Revenue"
  target: number      // 800000, 200000
  actual: number      // current actual value
}

interface RevenueTargetProps {
  breakdown: RevenueBreakdownItem[]
  totalTarget: number   // 1000000
  totalActual: number   // sum of actuals
}

export function RevenueTarget({ breakdown, totalTarget, totalActual }: RevenueTargetProps) {
  const overallPercentage = totalTarget > 0
    ? Math.round((totalActual / totalTarget) * 100)
    : 0

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Overall summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="rounded-md p-1.5 bg-emerald-50">
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Total Revenue</p>
            <p className="text-lg font-semibold">{formatCurrency(totalActual)}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Target</p>
          <p className="text-sm font-medium">{formatCurrency(totalTarget)}</p>
        </div>
      </div>
      <Progress value={overallPercentage} className="h-2" />

      {/* Per-KR breakdown rows */}
      <div className="space-y-3 flex-1">
        {breakdown.map(item => {
          const pct = item.target > 0
            ? Math.round((item.actual / item.target) * 100)
            : 0
          return (
            <div key={item.krId} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">{item.description}</span>
                <span className="text-gray-500">{formatCurrency(item.actual)} / {formatCurrency(item.target)}</span>
              </div>
              <Progress value={pct} className="h-1.5" />
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

### Render Switch Case Pattern

```typescript
// Source: src/components/dashboard/dashboard-client.tsx (follow existing pattern)
case 'revenue-target':
  return (
    <RevenueTarget
      breakdown={revenueData.breakdown}
      totalTarget={revenueData.totalTarget}
      totalActual={revenueData.totalActual}
    />
  )
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hardcoded `revenueTarget = 1000000` + proxy calc | Real KR data query | Phase 48 | Revenue now computed from KeyResult.actual |
| No per-KR breakdown | Per-KR breakdown available via expanded query | Phase 51 (this) | Widget shows Events vs AI Training split |

**Already completed in Phase 48:**
- Dashboard stats route uses real `prisma.keyResult.findMany({ where: { metricType: 'REVENUE' } })`
- Dashboard page.tsx server component does the same query
- Revenue data flows through as `stats.revenueProgress` and `stats.revenueTarget`
- The `kpi-cards.tsx` widget already shows a revenue progress bar (aggregate only, no breakdown)

**Not yet done (Phase 51 scope):**
- Per-KR breakdown data (krId, description per row) -- requires expanding the existing query
- Separate revenue-target widget component -- currently revenue is a small section inside kpi-cards
- Widget registry entry, default layout, and render switch wiring

## Open Questions

1. **Widget category: `'kri'` vs new category**
   - What we know: The WidgetDefinition category type allows `'kri' | 'crm' | 'financials' | 'operations'`. Revenue targets relate to Key Results.
   - What's unclear: Whether this should use a new category like `'saap'` or the existing `'kri'`.
   - Recommendation: Use `'kri'` -- it is the most accurate existing category since revenue targets are Key Result metrics. No type changes needed.

2. **Should the KPI Cards widget still show its inline revenue section?**
   - What we know: `kpi-cards.tsx` (lines 88-113) already shows a revenue progress bar within the KPI overview widget.
   - What's unclear: Whether Phase 51 should remove that section since revenue now has its own dedicated widget.
   - Recommendation: Keep it for now -- the KPI cards show a compact overview, while the new widget shows detailed breakdown. Phase 52 (cleanup) can decide whether to remove the duplicate.

3. **Where to position revenueData in the DashboardClient data flow?**
   - What we know: Dashboard data is split into `dashboardData` (KRI metrics) and `crmData` (sales pipeline). Revenue breakdown is a KRI concern.
   - What's unclear: Whether to add `revenueBreakdown` inside `dashboardData.stats` or as a new top-level prop.
   - Recommendation: Add as a new property inside `dashboardData` (e.g., `dashboardData.revenueBreakdown`) since it is already being computed alongside other KRI data. This avoids a new top-level prop while keeping the data logically grouped.

## Sources

### Primary (HIGH confidence)

All findings are from direct codebase investigation:

- `src/lib/widgets/registry.ts` -- 8 existing widget entries, pattern for new entries
- `src/lib/widgets/defaults.ts` -- DEFAULT_DASHBOARD_LAYOUT with 7 positioned widgets
- `src/lib/widgets/permissions.ts` -- Role-based widget visibility system
- `src/lib/widgets/layout-utils.ts` -- Layout manipulation utilities
- `src/components/dashboard/dashboard-client.tsx` -- DashboardClient with renderWidget switch
- `src/components/dashboard/dashboard-grid.tsx` -- Grid rendering with WidgetWrapper
- `src/components/dashboard/kpi-cards.tsx` -- Existing widget showing revenue (pattern reference)
- `src/components/dashboard/crm-kpi-cards.tsx` -- Existing KPI card widget (pattern reference)
- `src/app/(dashboard)/page.tsx` -- Server component data fetching (lines 39-48 for revenue)
- `src/types/dashboard.ts` -- WidgetDefinition type with category union
- `prisma/schema.prisma` -- KeyResult model (lines 826-851), MetricType enum
- `.planning/phases/48-api-layer-utilities/48-RESEARCH.md` -- Phase 48 research confirming KR1.1 target=800000, KR2.2 target=200000

### Secondary (MEDIUM confidence)

- `.planning/REQUIREMENTS.md` -- UI-REV-01, UI-REV-02 requirement definitions

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new libraries, all existing infrastructure
- Architecture: HIGH -- 8 existing widgets establish a clear, repeatable pattern
- Pitfalls: HIGH -- pitfalls identified from direct codebase analysis of data flow and type system
- Code examples: HIGH -- all derived from existing codebase patterns

**Research date:** 2026-01-27
**Valid until:** 2026-02-27 (stable -- internal project, no external dependency changes)

## Implementation Checklist

For the planner, the complete list of changes needed:

1. **Registry** (`src/lib/widgets/registry.ts`): Add `'revenue-target'` entry
2. **Default Layout** (`src/lib/widgets/defaults.ts`): Add position entry to `DEFAULT_DASHBOARD_LAYOUT`
3. **Dashboard Types** (`src/types/dashboard.ts`): No change needed if using `'kri'` category
4. **Widget Bank Labels** (`src/components/dashboard/widget-bank.tsx`): No change needed (kri category already labeled)
5. **Server Data Fetch** (`src/app/(dashboard)/page.tsx`): Expand revenue query to include `krId` and `description`; pass breakdown to `DashboardClient`
6. **Client Props** (`src/components/dashboard/dashboard-client.tsx`): Update `DashboardClientProps` interface, import `RevenueTarget`, add render switch case
7. **Widget Component** (`src/components/dashboard/revenue-target.tsx`): Create new file -- presentation component
8. **API Route** (`src/app/api/dashboard/stats/route.ts`): Optionally expand to include breakdown (for API consumers, not strictly required for SSR dashboard)

Total: 5-6 files modified, 1 file created, 0 new dependencies.
