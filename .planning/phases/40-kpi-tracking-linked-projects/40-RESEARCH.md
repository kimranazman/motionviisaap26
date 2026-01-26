# Phase 40: KPI Tracking & Linked Projects - Research

**Researched:** 2026-01-26
**Domain:** KPI display, auto-calculation, initiative-project data relationships in Next.js/Prisma
**Confidence:** HIGH

## Summary

Phase 40 adds KPI progress visualization and linked project display to the initiative rows in the objectives hierarchy view. The database schema already has all required KPI fields on the Initiative model (kpiLabel, kpiTarget, kpiActual, kpiUnit, kpiManualOverride) and the Project model already links to Initiative via `initiativeId`. The utility file `initiative-kpi-utils.ts` already contains the core `calculateKpi` function with proper null/zero handling.

The primary work is: (1) extending data fetching to include KPI fields and linked projects with revenue/cost aggregation, (2) adding KPI edit fields to the existing initiative detail sheet, (3) building the KPI progress bar display into the initiative row, (4) adding linked projects section to the detail sheet, and (5) adding aggregated KPI totals to KR-level and Objective-level headers.

**Primary recommendation:** Build on existing `initiative-kpi-utils.ts` for calculation logic. Use the existing shadcn/ui Progress component as the base for the color-coded progress bar. Extend the Prisma queries to include linked projects with costs aggregation. No new dependencies needed.

## Standard Stack

The established libraries/tools for this domain:

### Core (Already in Project)
| Library | Purpose | Why Standard |
|---------|---------|--------------|
| Prisma ORM | Database queries, includes for linked projects | Already used throughout; supports nested includes and aggregations |
| shadcn/ui | UI components (Progress, AlertDialog, Dialog, Input, Badge) | Already installed; provides Progress and AlertDialog needed |
| lucide-react | Icons (Pencil, Calculator, FolderOpen, ExternalLink) | Already used across all components |
| @radix-ui/react-progress | Progress bar primitive (via shadcn/ui Progress) | Already installed as shadcn/ui dependency |

### Supporting (Already in Project)
| Library | Purpose | When to Use |
|---------|---------|-------------|
| tailwindcss | Color-coded progress bar styles (green/yellow/red) | Inline className approach matching existing patterns |
| next/navigation | useRouter for project click-through navigation | Already used in objective-hierarchy.tsx |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| shadcn/ui Progress | Custom div-based bar | Progress component already exists, use it with className override for colors |
| AlertDialog for confirmation | window.confirm | AlertDialog matches existing UI patterns (already imported in project) |

**Installation:**
```bash
# No new dependencies needed - zero new npm packages per v1.5 decision
```

## Architecture Patterns

### Recommended Component Structure
```
src/
  components/
    objectives/
      initiative-row.tsx          # MODIFY: add KPI progress bar + project count badge
      key-result-group.tsx        # MODIFY: add aggregated KPI totals in header
      objective-group.tsx         # MODIFY: add aggregated KPI totals in header
      objective-hierarchy.tsx     # MODIFY: expand Initiative type with KPI + project fields
      kpi-progress-bar.tsx        # NEW: reusable KPI progress bar component
      linked-projects-section.tsx # NEW: linked projects list for detail sheet
    kanban/
      initiative-detail-sheet.tsx # MODIFY: add KPI edit fields + linked projects section
  lib/
    initiative-kpi-utils.ts       # EXISTS: calculateKpi already implemented, may need minor extensions
  app/
    (dashboard)/
      objectives/page.tsx         # MODIFY: expand Prisma query to include KPI fields + projects
    api/
      initiatives/
        [id]/route.ts             # MODIFY: include projects with costs in GET response
```

### Pattern 1: Data Flow for KPI Display
**What:** Server-side data fetching includes KPI fields and linked project data, passed down through the component hierarchy.
**When to use:** Always -- the objectives page is a server component that fetches all data upfront.
**Key insight:** The objectives page currently uses a `select` query that only picks specific fields. It must be extended to include KPI fields AND linked projects with revenue/cost data. The `Initiative` interface in `objective-hierarchy.tsx` must be expanded correspondingly.

```typescript
// In objectives/page.tsx - expanded query
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
    position: true,
    // KPI fields (new)
    kpiLabel: true,
    kpiTarget: true,
    kpiActual: true,
    kpiUnit: true,
    kpiManualOverride: true,
    // Linked projects with revenue + cost aggregation (new)
    projects: {
      select: {
        id: true,
        title: true,
        status: true,
        revenue: true,
        startDate: true,
        endDate: true,
        company: {
          select: { id: true, name: true },
        },
        costs: {
          select: { amount: true },
        },
      },
    },
  },
})
```

### Pattern 2: KPI Edit in Detail Sheet (PATCH API)
**What:** The existing initiative detail sheet dialog gets KPI edit fields. When user manually sets kpiActual, set kpiManualOverride to true via the PATCH endpoint.
**When to use:** When user opens an initiative from the hierarchy view.
**Key insight:** The existing PATCH endpoint at `/api/initiatives/[id]/route.ts` handles partial updates. It needs to be extended to support kpiLabel, kpiTarget, kpiActual, kpiUnit, and kpiManualOverride fields. The confirmation dialog for manual override uses the existing AlertDialog component.

```typescript
// Extended PATCH handler in api/initiatives/[id]/route.ts
if (body.kpiLabel !== undefined) {
  updateData.kpiLabel = body.kpiLabel || null
}
if (body.kpiTarget !== undefined) {
  updateData.kpiTarget = body.kpiTarget !== null ? parseFloat(body.kpiTarget) : null
}
if (body.kpiActual !== undefined) {
  updateData.kpiActual = body.kpiActual !== null ? parseFloat(body.kpiActual) : null
}
if (body.kpiUnit !== undefined) {
  updateData.kpiUnit = body.kpiUnit || null
}
if (body.kpiManualOverride !== undefined) {
  updateData.kpiManualOverride = body.kpiManualOverride
}
```

### Pattern 3: Progress Bar Color Coding
**What:** A thin horizontal progress bar below the initiative title, color-coded by percentage.
**When to use:** On every initiative row in the hierarchy view.
**Key insight:** The existing shadcn/ui Progress component uses `bg-primary` for the indicator. For color coding, override the indicator class based on percentage threshold. Use `className` prop on root for height (`h-1.5` for thin bar).

```typescript
// Color selection based on percentage
function getKpiColor(percentage: number | null): string {
  if (percentage === null) return 'bg-gray-300'  // No data state
  if (percentage >= 80) return 'bg-green-500'
  if (percentage >= 50) return 'bg-yellow-500'
  return 'bg-red-500'
}
```

### Pattern 4: Aggregated KPI Totals at Header Level
**What:** KR-level and Objective-level headers show summed KPI targets and actuals from child initiatives.
**When to use:** KPI-05 requirement -- headers aggregate child initiative KPI data.
**Key insight:** Aggregation happens client-side since all data is already loaded. Sum up kpiTarget and kpiActual from child initiatives, compute aggregate percentage. Use the same `calculateKpi` utility for individual initiatives, then sum results at group level.

```typescript
// In initiative-group-utils.ts or computed in component
function aggregateKpiTotals(initiatives: InitiativeWithKpi[]): {
  totalTarget: number
  totalActual: number
  percentage: number | null
} {
  let totalTarget = 0
  let totalActual = 0
  let hasAnyKpi = false

  for (const init of initiatives) {
    const kpi = calculateKpi(init)
    if (kpi.target !== null) {
      totalTarget += kpi.target
      hasAnyKpi = true
    }
    totalActual += kpi.actual
  }

  return {
    totalTarget,
    totalActual,
    percentage: hasAnyKpi && totalTarget > 0
      ? (totalActual / totalTarget) * 100
      : null,
  }
}
```

### Anti-Patterns to Avoid
- **Fetching projects separately per initiative:** Don't make N+1 API calls. Include projects in the initial Prisma query with nested select.
- **Computing costs client-side from individual cost records:** Sum costs server-side during serialization. Don't send the full costs array to the client -- just send the total.
- **Modifying the shadcn/ui Progress component source:** Override styles via className prop, don't edit `src/components/ui/progress.tsx`.
- **Using window.confirm for the manual override dialog:** Use the existing AlertDialog component for consistent UI.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| KPI percentage calculation | Custom math with edge cases | `calculateKpi()` from `initiative-kpi-utils.ts` | Already handles null targets, zero division, manual vs auto modes |
| Progress bar component | Custom div with width animation | shadcn/ui `<Progress>` component | Already installed, handles accessibility, animation built-in |
| Confirmation dialog | `window.confirm()` or custom modal | shadcn/ui `<AlertDialog>` | Consistent with app UI patterns, accessible, already installed |
| Currency formatting | Template literal with toFixed | `formatCurrency()` from `lib/utils.ts` | Already handles MYR formatting with locale |
| Project status badge colors | Custom color mapping | `getProjectStatusColor()` from `lib/project-utils.ts` | Already maps DRAFT/ACTIVE/COMPLETED/CANCELLED |
| Initiative grouping | Custom grouping code | `groupInitiativesByObjective()` from `initiative-group-utils.ts` | Already handles normalize + group logic |

**Key insight:** The `initiative-kpi-utils.ts` file already solves the hardest calculation problems. The main work is wiring data through and building the UI.

## Common Pitfalls

### Pitfall 1: Decimal Serialization from Prisma
**What goes wrong:** Prisma returns `Decimal` objects for kpiTarget, kpiActual, and project revenue/cost amounts. These don't serialize to JSON directly.
**Why it happens:** MySQL Decimal fields become Prisma Decimal objects, not JavaScript numbers.
**How to avoid:** Convert all Decimal fields to Number during serialization in the page's data fetching function, just like the existing pattern in `projects/route.ts`.
**Warning signs:** `[object Object]` appearing instead of numbers, or JSON serialization errors.

```typescript
// Serialization pattern (already used in project routes)
kpiTarget: i.kpiTarget ? Number(i.kpiTarget) : null,
kpiActual: i.kpiActual ? Number(i.kpiActual) : null,
```

### Pitfall 2: Cost Aggregation Performance
**What goes wrong:** Fetching all cost records for all projects of all initiatives in one query can be expensive.
**Why it happens:** N initiatives x M projects x K costs creates a large join.
**How to avoid:** Only select `costs.amount` in the nested query and sum server-side. Don't include cost details (description, category, etc.) -- only the amount is needed for the total. Alternatively, use Prisma's `_sum` aggregation if restructuring the query.
**Warning signs:** Slow page load on the objectives page.

```typescript
// Efficient approach: select only amount, sum in serialization
projects: {
  select: {
    id: true,
    title: true,
    status: true,
    revenue: true,
    startDate: true,
    endDate: true,
    company: { select: { name: true } },
    costs: { select: { amount: true } },  // Minimal cost data
  },
},

// Then in serialization:
const totalCosts = project.costs.reduce(
  (sum, c) => sum + Number(c.amount), 0
)
```

### Pitfall 3: Initiative Type Mismatch Between Components
**What goes wrong:** The `Initiative` interface is defined in `objective-hierarchy.tsx` and imported by multiple components. Expanding it breaks the existing `InitiativeDetailSheet` which expects its own `Initiative` interface (different shape).
**Why it happens:** Multiple components define their own `Initiative` interface with different fields. The hierarchy passes Initiative objects to the detail sheet.
**How to avoid:** Add KPI and project fields as optional to the hierarchy's Initiative interface. The detail sheet will ignore fields it doesn't use. The detail sheet's own interface should also be extended for KPI fields it will edit.
**Warning signs:** TypeScript errors about missing properties, or passing wrong types between components.

### Pitfall 4: Manual Override State Management
**What goes wrong:** User edits kpiActual in the detail sheet but the confirmation dialog flow is complex -- need to track whether user confirmed, and only then set kpiManualOverride to true.
**Why it happens:** Two-step flow: user enters value -> confirmation dialog -> save with override flag.
**How to avoid:** Track the "pending" actual value in local state. Show AlertDialog on value change. On confirm, save both the new actual AND kpiManualOverride=true in a single PATCH. On cancel, revert the input to its previous value.
**Warning signs:** Override flag set without user confirmation, or value saved but flag not set.

### Pitfall 5: Progress Bar for Null/Zero/Over-100% Cases
**What goes wrong:** Division by zero when target is 0, negative percentages, or progress bar overflowing at >100%.
**Why it happens:** Edge cases in data (no target set, actual exceeds target, no linked projects).
**How to avoid:** The existing `calculateKpi` already returns `null` for percentage when target is 0/null. The Progress component already clamps to 0-100 via translateX. For >100%, cap the visual bar at 100% but show the actual percentage text (e.g., "120%").
**Warning signs:** NaN or Infinity in the UI, empty/broken progress bars.

### Pitfall 6: "Revert to Auto" Button Logic
**What goes wrong:** Reverting clears manual override but the old manual kpiActual value remains in the database.
**Why it happens:** kpiManualOverride and kpiActual are separate fields.
**How to avoid:** When reverting, PATCH with `kpiManualOverride: false` AND `kpiActual: null`. This ensures the auto-calculation (from linked project revenue) takes over cleanly.
**Warning signs:** After revert, the old manual value still displays instead of the auto-calculated revenue sum.

## Code Examples

Verified patterns from the existing codebase:

### KPI Calculation (Already Exists)
```typescript
// Source: src/lib/initiative-kpi-utils.ts (lines 50-102)
// Already handles: manual vs auto mode, null targets, zero division, no projects
import { calculateKpi, type InitiativeWithKpiAndProjects } from '@/lib/initiative-kpi-utils'

const kpi = calculateKpi(initiative)
// kpi.percentage -> number | null (null for no-data / zero-target)
// kpi.source -> 'auto' | 'manual'
// kpi.displayText -> "75 / 100 MYR" or "No data" or "RM 50,000 from 3 projects"
```

### Color-Coded Progress Bar (New Component)
```typescript
// New: src/components/objectives/kpi-progress-bar.tsx
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { Pencil, Calculator } from 'lucide-react'

interface KpiProgressBarProps {
  label: string
  percentage: number | null
  displayText: string
  source: 'auto' | 'manual'
}

export function KpiProgressBar({ label, percentage, displayText, source }: KpiProgressBarProps) {
  // Color based on percentage thresholds
  const barColor = percentage === null
    ? 'bg-gray-200'  // No data
    : percentage >= 80
      ? '[&>div]:bg-green-500'
      : percentage >= 50
        ? '[&>div]:bg-yellow-500'
        : '[&>div]:bg-red-500'

  return (
    <div className="mt-1.5 space-y-0.5">
      <div className="flex items-center gap-1.5 text-xs text-gray-500">
        {source === 'manual' ? (
          <Pencil className="h-3 w-3" />
        ) : (
          <Calculator className="h-3 w-3" />
        )}
        <span>{displayText}</span>
      </div>
      <Progress
        value={percentage !== null ? Math.min(percentage, 100) : 0}
        className={cn('h-1.5', barColor)}
      />
    </div>
  )
}
```

### AlertDialog for Manual Override Confirmation
```typescript
// Pattern from existing AlertDialog usage
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

<AlertDialog open={showOverrideConfirm} onOpenChange={setShowOverrideConfirm}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Override auto-calculated value?</AlertDialogTitle>
      <AlertDialogDescription>
        This will set the KPI actual value manually and stop auto-calculation
        from linked project revenue. You can revert to auto-calculation later.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={handleConfirmOverride}>
        Override
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### Linked Project Item Display Pattern
```typescript
// Pattern matching existing project-card.tsx style
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import { formatProjectStatus, getProjectStatusColor } from '@/lib/project-utils'
import { ExternalLink } from 'lucide-react'
import Link from 'next/link'

interface LinkedProject {
  id: string
  title: string
  status: string
  revenue: number | null
  totalCosts: number
  companyName: string | null
  startDate: string | null
  endDate: string | null
}

function LinkedProjectItem({ project }: { project: LinkedProject }) {
  return (
    <Link
      href={`/projects/${project.id}`}
      className="flex items-start justify-between gap-3 p-3 rounded-lg hover:bg-gray-50 transition group"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-gray-900 truncate">
            {project.title}
          </span>
          <ExternalLink className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition shrink-0" />
        </div>
        {project.companyName && (
          <span className="text-xs text-gray-500">{project.companyName}</span>
        )}
      </div>
      <div className="text-right shrink-0">
        <div className="text-sm font-medium">{formatCurrency(project.revenue)}</div>
        <div className="text-xs text-gray-500">Cost: {formatCurrency(project.totalCosts)}</div>
      </div>
    </Link>
  )
}
```

### Extending PATCH API for KPI Fields
```typescript
// Pattern: extend existing PATCH handler in api/initiatives/[id]/route.ts
// Following the exact same pattern as existing status/position/remarks handling
if (body.kpiLabel !== undefined) {
  updateData.kpiLabel = body.kpiLabel || null
}
if (body.kpiTarget !== undefined) {
  updateData.kpiTarget = body.kpiTarget !== null && body.kpiTarget !== ''
    ? parseFloat(String(body.kpiTarget))
    : null
}
if (body.kpiActual !== undefined) {
  updateData.kpiActual = body.kpiActual !== null && body.kpiActual !== ''
    ? parseFloat(String(body.kpiActual))
    : null
}
if (body.kpiUnit !== undefined) {
  updateData.kpiUnit = body.kpiUnit || null
}
if (body.kpiManualOverride !== undefined) {
  updateData.kpiManualOverride = body.kpiManualOverride
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Separate types directory | Each utility defines own interfaces | v1.5 decision | KPI types stay in `initiative-kpi-utils.ts` |
| Tabs on existing page | Separate /objectives route | v1.5 decision | KPI display lives in objectives hierarchy components |
| Sheet component | Dialog component | Already in codebase | Initiative detail uses Dialog, not Sheet |

**Key observations:**
- The initiative detail sheet is a `Dialog` component (not a `Sheet`), despite being named "InitiativeDetailSheet"
- The existing Dialog is 650px max-width, which may need to accommodate the new linked projects section
- `@map("snake_case")` convention is already applied to all KPI fields in the schema
- The `Progress` component uses `translateX` for animation (not width), which works well with the color override approach

## Open Questions

Things that couldn't be fully resolved:

1. **Aggregated KPI when initiatives have different units**
   - What we know: KPI-05 requires KR/Objective headers to show aggregated totals
   - What's unclear: If initiative A has unit "RM" and initiative B has unit "Projects", summing targets makes no semantic sense
   - Recommendation: Only aggregate initiatives that share the same unit, or show "Mixed KPIs" when units differ. Alternatively, show count of initiatives with KPI set (e.g., "3/5 KPIs tracked") rather than summing incompatible units

2. **Cost aggregation strategy for linked projects in page query**
   - What we know: Need total costs per project for the linked projects display
   - What's unclear: Whether fetching all cost.amount values and summing client-side is acceptable for performance, or if a raw SQL aggregate would be better
   - Recommendation: Start with Prisma select costs.amount + client-side sum. Only optimize if performance is an issue (unlikely with small dataset for a 3-person team)

3. **Auto-calculation trigger timing**
   - What we know: KPI-02 says auto-calculate from linked project revenue when manual override is not set
   - What's unclear: Whether auto-calculation happens at page load (display-time) or on data change (write-time)
   - Recommendation: Display-time calculation (compute in the UI from fetched data). The existing `calculateKpi` function already does this. No background job or trigger needed -- the objectives page always fetches fresh data.

## Sources

### Primary (HIGH confidence)
- Prisma schema: `prisma/schema.prisma` -- Initiative model with KPI fields (lines 42-79), Project model with initiativeId (lines 452-494)
- KPI utils: `src/lib/initiative-kpi-utils.ts` -- calculateKpi function with full null/zero handling
- Objectives page: `src/app/(dashboard)/objectives/page.tsx` -- current data fetching pattern
- Initiative detail sheet: `src/components/kanban/initiative-detail-sheet.tsx` -- current editing UI pattern
- Initiative API: `src/app/api/initiatives/[id]/route.ts` -- PATCH endpoint pattern
- shadcn/ui Progress: `src/components/ui/progress.tsx` -- existing progress bar component
- shadcn/ui AlertDialog: `src/components/ui/alert-dialog.tsx` -- confirmation dialog component
- Project utils: `src/lib/project-utils.ts` -- project status colors and formatting
- Utils: `src/lib/utils.ts` -- formatCurrency, calculateProgress, getStatusColor

### Secondary (MEDIUM confidence)
- REQUIREMENTS.md: `.planning/REQUIREMENTS.md` -- KPI-01 through KPI-07, PROJ-01 through PROJ-04, SCHEMA-01
- Phase context: `.planning/phases/40-kpi-tracking-linked-projects/40-CONTEXT.md` -- user decisions on UI design

### Tertiary (LOW confidence)
- None -- all findings verified against codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already in project, no new dependencies
- Architecture: HIGH -- patterns directly derived from existing codebase patterns
- Pitfalls: HIGH -- identified from reading actual code and data flow
- Code examples: HIGH -- patterns extracted from existing files with adaptations

**Research date:** 2026-01-26
**Valid until:** 2026-02-25 (stable -- internal project, no external dependency changes)
