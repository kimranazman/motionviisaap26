# Phase 41: Date Intelligence - Research

**Researched:** 2026-01-26
**Domain:** Date intelligence badge rendering, owner overlap detection, timeline suggestion UI
**Confidence:** HIGH

## Summary

Phase 41 consumes the `analyzeDates()` function from `src/lib/initiative-date-utils.ts` (created in Phase 38) and renders date intelligence badges inline within the initiative rows of the By Objective hierarchy view (built in Phase 39). The utility already handles all five date flags (overdue, ending-soon, late-start, invalid-dates, long-duration) with the exact logic specified in requirements DATE-01 through DATE-05. The remaining work is: (1) a new `DateBadges` component that maps flags to colored badges, (2) integrating that component into the existing `InitiativeRow`, (3) extending `initiative-date-utils.ts` with an owner overlap detection function (DATE-06) that counts concurrent active initiatives per `personInCharge`, (4) adding an `OwnerOverlapBadge` component, and (5) a timeline suggestions section in the `InitiativeDetailSheet` (DATE-08).

The Initiative model stores `personInCharge` as an optional `TeamMember` enum (KHAIRUL, AZLAN, IZYANI). The schema already has an index on `personInCharge`, and the objectives page already fetches `personInCharge`, `startDate`, `endDate`, and `status` for every initiative. Owner overlap detection can be computed client-side from the existing `initialData` prop (all initiatives are already loaded) -- no new API endpoint is needed. The team has only 3 members, and the total initiative count is small (seeded from an Excel sheet), making client-side computation trivially fast.

The shadcn/ui `Badge` component (with `variant="outline"`) and `Tooltip` components are already installed. The `ConfidenceBadge` in `src/components/ai/confidence-badge.tsx` provides a proven pattern for color-coded badges with custom className overrides.

**Primary recommendation:** Create a `DateBadges` component that calls `analyzeDates()` and renders color-coded inline badges, a `detectOwnerOverlap()` utility function, and a timeline suggestions section in the detail sheet. All data is already available -- no schema changes, no new API endpoints, no new dependencies.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| date-fns | ^4.1.0 | Already used by `initiative-date-utils.ts` for `differenceInDays`, `isPast`, `isBefore`, `intervalToDuration` | Already installed, used in 9 source files |
| shadcn/ui Badge | N/A | Colored badge rendering with `variant="outline"` + custom className | Already installed at `src/components/ui/badge.tsx` |
| shadcn/ui Tooltip | N/A | Hover tooltip for badge details (e.g., exact dates, suggestion text) | Already installed at `src/components/ui/tooltip.tsx` |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | ^0.469.0 | Icons for badge type indicators (AlertTriangle, Clock, AlertCircle, Info, Users) | Already installed, used across all components |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Client-side overlap detection | Server-side SQL query | With only 3 team members and ~30 initiatives, client-side is trivially fast. Server-side adds unnecessary API complexity. |
| Inline span badges | shadcn/ui Badge component | Badge component adds consistent rounded-md styling. Use Badge for consistency with existing codebase pattern (ConfidenceBadge). |
| Separate date intelligence page | Inline badges in hierarchy | Requirements DATE-07 explicitly specifies "inline in the By Objective hierarchy view per initiative row." |

## Architecture Patterns

### Recommended Project Structure
```
src/
  lib/
    initiative-date-utils.ts     # EXISTING: analyzeDates() -- flags detection (Phase 38)
                                 # ADD: detectOwnerOverlap() function
                                 # ADD: generateTimelineSuggestions() function
  components/
    objectives/
      initiative-row.tsx          # MODIFY: add DateBadges after title
      date-badges.tsx             # NEW: renders flag badges from DateIntelligence
      owner-overlap-badge.tsx     # NEW: renders workload badge from overlap count
      timeline-suggestions.tsx    # NEW: renders suggestions in detail sheet
    kanban/
      initiative-detail-sheet.tsx # MODIFY: add TimelineSuggestions section
```

### Pattern 1: Flag-to-Badge Mapping (Color-Coded Inline Badges)
**What:** Map each `DateFlag` to a specific color scheme and label format. The badge array renders horizontally inline with the initiative title.
**When to use:** Every initiative row in the objectives hierarchy view.
**Example (following ConfidenceBadge pattern):**
```typescript
// src/components/objectives/date-badges.tsx
const FLAG_CONFIG: Record<DateFlag, { color: string; icon: LucideIcon; label: (di: DateIntelligence) => string }> = {
  'overdue': {
    color: 'bg-red-100 text-red-700 border-red-200',
    icon: AlertTriangle,
    label: (di) => `${Math.abs(di.daysUntilEnd ?? differenceInDays(new Date(), new Date()))} days overdue`,
  },
  'ending-soon': {
    color: 'bg-orange-100 text-orange-700 border-orange-200',
    icon: Clock,
    label: (di) => `Ends in ${di.daysUntilEnd} days`,
  },
  'late-start': {
    color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    icon: Clock,
    label: () => 'Late start',
  },
  'invalid-dates': {
    color: 'bg-red-100 text-red-700 border-red-200',
    icon: AlertCircle,
    label: () => 'Invalid dates',
  },
  'long-duration': {
    color: 'bg-gray-100 text-gray-600 border-gray-200',
    icon: Info,
    label: (di) => `${di.durationDays} days`,
  },
}
```

### Pattern 2: Owner Overlap Detection (Client-Side Computation)
**What:** Given all initiatives, group by `personInCharge`, filter to active/concurrent ones, count overlaps. Return overlap count per initiative.
**When to use:** Called once at the ObjectiveHierarchy level, passed down via a Map to each InitiativeRow.
**Example:**
```typescript
// In initiative-date-utils.ts
export function detectOwnerOverlap(
  initiatives: Array<{ id: string; personInCharge: string | null; startDate: string | Date; endDate: string | Date; status: string }>
): Map<string, number> {
  // For each initiative, count how many other initiatives by the same personInCharge
  // have overlapping date ranges AND are active (not COMPLETED/CANCELLED)
  const result = new Map<string, number>()
  const active = initiatives.filter(i =>
    i.personInCharge && i.status !== 'COMPLETED' && i.status !== 'CANCELLED'
  )

  for (const init of active) {
    const concurrent = active.filter(other =>
      other.id !== init.id &&
      other.personInCharge === init.personInCharge &&
      datesOverlap(init.startDate, init.endDate, other.startDate, other.endDate)
    )
    result.set(init.id, concurrent.length + 1) // +1 includes self
  }

  return result
}
```

### Pattern 3: Timeline Suggestions (Detail Sheet Section)
**What:** Based on detected flags, generate human-readable suggestions for timeline adjustments (DATE-08).
**When to use:** Displayed in the InitiativeDetailSheet when an initiative has date issues.
**Example:**
```typescript
// In initiative-date-utils.ts
export function generateTimelineSuggestions(
  flags: DateFlag[],
  durationDays: number,
  overlapCount: number
): string[] {
  const suggestions: string[] = []
  if (flags.includes('overdue')) {
    suggestions.push('Consider extending the end date or marking as completed/cancelled')
  }
  if (flags.includes('late-start')) {
    suggestions.push('Initiative has not started despite start date passing. Update status to In Progress or adjust start date')
  }
  if (flags.includes('long-duration')) {
    suggestions.push(`Duration is ${durationDays} days. Consider breaking into smaller initiatives`)
  }
  if (flags.includes('invalid-dates')) {
    suggestions.push('End date is before start date. Correct the date range')
  }
  if (overlapCount > 3) {
    suggestions.push(`Owner has ${overlapCount} concurrent initiatives. Consider redistributing workload`)
  }
  return suggestions
}
```

### Anti-Patterns to Avoid
- **Fetching initiatives per-badge for overlap:** All initiative data is already loaded by the objectives page. Do NOT make separate API calls for overlap detection. Compute from the existing `initialData` array.
- **Modifying the Prisma schema:** No new fields are needed. All date intelligence is computed at render time from existing `startDate`, `endDate`, `status`, and `personInCharge` fields.
- **Putting date logic in components:** Keep all computation in `initiative-date-utils.ts`. Components only call utility functions and render results.
- **Adding new npm packages:** Per the prior decision, zero new dependencies for v1.5.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Date difference calculation | Manual `(end - start) / 86400000` | `differenceInDays` from date-fns | Already used in `initiative-date-utils.ts`, handles DST edge cases |
| Date overlap detection | Complex manual comparison | Helper using `start1 <= end2 && start2 <= end1` pattern | Standard interval overlap formula, but still delegate date parsing to date-fns |
| Color-coded badge rendering | Custom div with inline styles | shadcn/ui `Badge` with `variant="outline"` + className override | Consistent with `ConfidenceBadge` pattern in codebase |
| Tooltip for badge details | Custom hover state | shadcn/ui `Tooltip` component | Already installed, accessible, handles positioning |
| "Days overdue" calculation | `Math.floor((now - end) / msPerDay)` | `differenceInDays(new Date(), endDate)` from date-fns | Already imported in the utility file |

**Key insight:** The `analyzeDates()` function already exists and computes all five date flags. This phase is primarily about RENDERING those flags as badges and EXTENDING the utility with two new functions (overlap detection, timeline suggestions).

## Common Pitfalls

### Pitfall 1: Overdue Days Calculation Sign
**What goes wrong:** `daysUntilEnd` from `analyzeDates()` is `null` when `isPast(end)`. For overdue badges, you need the number of days PAST the end date, which is `Math.abs(differenceInDays(endDate, today))` or equivalently `differenceInDays(today, endDate)`.
**Why it happens:** The existing utility returns `null` for `daysUntilEnd` when overdue (by design). The badge component needs to compute the overdue days itself.
**How to avoid:** Either: (1) compute `Math.abs(differenceInDays(new Date(endDate), new Date()))` in the badge component, or (2) extend `DateIntelligence` to include `daysOverdue: number | null`.
**Warning signs:** Badge shows "null days overdue" or "NaN days overdue".

### Pitfall 2: Overlap Detection Performance with Large Dataset
**What goes wrong:** O(n^2) comparison for overlap detection.
**Why it happens:** Comparing each initiative against all others.
**How to avoid:** With only ~30 initiatives and 3 team members, O(n^2) is negligible. Group by `personInCharge` first to reduce comparisons to within-group only. This brings it to O(n * k) where k is the max initiatives per person.
**Warning signs:** Not a real concern for this dataset size.

### Pitfall 3: Badge Wrapping on Mobile
**What goes wrong:** Multiple badges on a narrow screen push content off-screen or create ugly wrapping.
**Why it happens:** Initiative rows already have title, KPI bar, metadata row, and status badge.
**How to avoid:** Use `flex-wrap` for the badge container. On mobile, badges should wrap below the title naturally. Keep badge text very concise (e.g., "5d overdue" not "5 days overdue").
**Warning signs:** Horizontal scrolling in initiative rows.

### Pitfall 4: Date Badges on Completed/Cancelled Initiatives
**What goes wrong:** Showing "overdue" or "ending-soon" badges on completed initiatives is misleading.
**Why it happens:** Forgetting that `analyzeDates()` already filters out COMPLETED and CANCELLED for overdue/ending-soon flags, but NOT for long-duration or invalid-dates.
**How to avoid:** `analyzeDates()` already handles this correctly. Trust the utility function -- it only returns `overdue` and `ending-soon` flags when status is not COMPLETED/CANCELLED. The `long-duration` and `invalid-dates` flags intentionally show regardless of status (they indicate structural issues).
**Warning signs:** None if using `analyzeDates()` as-is.

### Pitfall 5: Tooltip Provider Missing
**What goes wrong:** Tooltips don't appear because `TooltipProvider` is not in the component tree.
**Why it happens:** Radix tooltip requires a `TooltipProvider` ancestor.
**How to avoid:** Either wrap the badge container in `TooltipProvider` or add it once at a higher level (layout or ObjectiveHierarchy). Check if it's already in the component tree.
**Warning signs:** Tooltip hover does nothing.

### Pitfall 6: Overlap Count Off-by-One
**What goes wrong:** Overlap count shows "2 concurrent" when someone has 3 concurrent initiatives.
**Why it happens:** Counting only OTHER overlapping initiatives, forgetting to include the current one.
**How to avoid:** The overlap count should include the initiative itself. If person has 4 concurrent initiatives, each shows "Workload: 4 concurrent". Threshold is >3 per DATE-06.
**Warning signs:** Badge shows "Workload: 3 concurrent" when person actually has 4.

## Code Examples

### Existing analyzeDates() Function (ALREADY IMPLEMENTED)
```typescript
// src/lib/initiative-date-utils.ts (lines 47-112) -- Phase 38 output
// This function already exists and handles DATE-01 through DATE-05 flag detection
export function analyzeDates(
  startDate: string | Date,
  endDate: string | Date,
  status: string
): DateIntelligence {
  // Returns: { durationDays, durationLabel, flags, isOverdue, daysUntilEnd }
  // Flags: 'overdue' | 'ending-soon' | 'late-start' | 'invalid-dates' | 'long-duration'
}
```

### Date Badge Color Configuration
```typescript
// src/components/objectives/date-badges.tsx
import { Badge } from '@/components/ui/badge'
import { analyzeDates, type DateFlag, type DateIntelligence } from '@/lib/initiative-date-utils'
import { differenceInDays } from 'date-fns'
import { AlertTriangle, Clock, AlertCircle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

const FLAG_CONFIG = {
  'overdue': {
    color: 'bg-red-100 text-red-700 border-red-200 hover:bg-red-100',
    icon: AlertTriangle,
  },
  'ending-soon': {
    color: 'bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-100',
    icon: Clock,
  },
  'late-start': {
    color: 'bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-100',
    icon: Clock,
  },
  'invalid-dates': {
    color: 'bg-red-100 text-red-700 border-red-200 hover:bg-red-100',
    icon: AlertCircle,
  },
  'long-duration': {
    color: 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-100',
    icon: Info,
  },
} as const

function getBadgeLabel(flag: DateFlag, intelligence: DateIntelligence, endDate: string): string {
  switch (flag) {
    case 'overdue': {
      const daysOverdue = differenceInDays(new Date(), new Date(endDate))
      return `${daysOverdue}d overdue`
    }
    case 'ending-soon':
      return `Ends in ${intelligence.daysUntilEnd}d`
    case 'late-start':
      return 'Late start'
    case 'invalid-dates':
      return 'Invalid dates'
    case 'long-duration':
      return `${intelligence.durationDays}d span`
  }
}
```

### InitiativeRow Integration Point
```typescript
// src/components/objectives/initiative-row.tsx -- WHERE badges go
// Current structure (lines 33-84):
<div className="flex items-start gap-3 p-2 md:p-3 ...">
  {/* Sequence number badge */}
  <span>...</span>

  {/* Center content */}
  <div className="flex-1 min-w-0">
    {/* Title */}
    <p className="font-medium text-gray-900">{initiative.title}</p>

    {/* >>> DATE BADGES GO HERE <<< */}
    {/* <DateBadges startDate={...} endDate={...} status={...} overlapCount={...} /> */}

    {/* KPI Progress Bar */}
    <KpiProgressBar ... />

    {/* Metadata row */}
    <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-gray-500">...</div>
  </div>

  {/* Status badge */}
  <span>...</span>
</div>
```

### Owner Overlap Detection
```typescript
// Add to src/lib/initiative-date-utils.ts

interface InitiativeForOverlap {
  id: string
  personInCharge: string | null
  startDate: string | Date
  endDate: string | Date
  status: string
}

function datesOverlap(
  start1: string | Date, end1: string | Date,
  start2: string | Date, end2: string | Date,
): boolean {
  const s1 = new Date(start1).getTime()
  const e1 = new Date(end1).getTime()
  const s2 = new Date(start2).getTime()
  const e2 = new Date(end2).getTime()
  return s1 <= e2 && s2 <= e1
}

export function detectOwnerOverlap(
  initiatives: InitiativeForOverlap[]
): Map<string, number> {
  const result = new Map<string, number>()
  const active = initiatives.filter(i =>
    i.personInCharge &&
    i.status !== 'COMPLETED' &&
    i.status !== 'CANCELLED'
  )

  // Group by personInCharge for efficiency
  const byOwner = new Map<string, InitiativeForOverlap[]>()
  for (const init of active) {
    const group = byOwner.get(init.personInCharge!) || []
    group.push(init)
    byOwner.set(init.personInCharge!, group)
  }

  // For each initiative, count concurrent within same owner group
  for (const [, group] of byOwner) {
    for (const init of group) {
      const concurrent = group.filter(other =>
        other.id !== init.id &&
        datesOverlap(init.startDate, init.endDate, other.startDate, other.endDate)
      ).length + 1 // +1 to include self
      result.set(init.id, concurrent)
    }
  }

  return result
}
```

### ObjectiveHierarchy Integration (Overlap Map)
```typescript
// src/components/objectives/objective-hierarchy.tsx
// Compute overlap map once at top level, pass through component tree
import { detectOwnerOverlap } from '@/lib/initiative-date-utils'

export function ObjectiveHierarchy({ initialData }: ObjectiveHierarchyProps) {
  // Compute overlap counts once for all initiatives
  const overlapMap = useMemo(() => detectOwnerOverlap(initialData), [initialData])

  // Pass overlapMap down through ObjectiveGroup -> KeyResultGroup -> InitiativeRow
  // Each InitiativeRow gets: overlapCount={overlapMap.get(initiative.id) ?? 0}
}
```

### Timeline Suggestions in Detail Sheet
```typescript
// src/components/objectives/timeline-suggestions.tsx
import { type DateFlag } from '@/lib/initiative-date-utils'
import { Lightbulb } from 'lucide-react'

interface TimelineSuggestionsProps {
  flags: DateFlag[]
  durationDays: number
  overlapCount: number
}

// Render as a yellow/amber info box after the date section in InitiativeDetailSheet
// Only shows when there are actionable suggestions (flags.length > 0 || overlapCount > 3)
```

## Existing Infrastructure Summary

### What Already Exists (Do NOT Rebuild)
| Component/Utility | Location | What It Provides |
|---|---|---|
| `analyzeDates()` | `src/lib/initiative-date-utils.ts` | All 5 date flags: overdue, ending-soon, late-start, invalid-dates, long-duration |
| `Badge` component | `src/components/ui/badge.tsx` | Styled badge with variant + className override |
| `Tooltip` components | `src/components/ui/tooltip.tsx` | Radix tooltip with provider, trigger, content |
| `ConfidenceBadge` | `src/components/ai/confidence-badge.tsx` | Pattern for color-coded badges with config object |
| `InitiativeRow` | `src/components/objectives/initiative-row.tsx` | Row component where badges will be inserted |
| `InitiativeDetailSheet` | `src/components/kanban/initiative-detail-sheet.tsx` | Dialog sheet where timeline suggestions will appear |
| `ObjectiveHierarchy` | `src/components/objectives/objective-hierarchy.tsx` | Top-level component with `initialData` prop (all initiatives) |
| Objectives page | `src/app/(dashboard)/objectives/page.tsx` | Server component fetching all initiatives with dates, status, personInCharge |

### What Must Be Created
| Component/Utility | Location | Purpose |
|---|---|---|
| `DateBadges` | `src/components/objectives/date-badges.tsx` | Renders date flag badges inline |
| `OwnerOverlapBadge` | Part of `DateBadges` or separate component | Renders "Workload: X concurrent" badge |
| `TimelineSuggestions` | `src/components/objectives/timeline-suggestions.tsx` | Renders suggestions in detail sheet |
| `detectOwnerOverlap()` | `src/lib/initiative-date-utils.ts` | Computes concurrent initiative count per owner |
| `generateTimelineSuggestions()` | `src/lib/initiative-date-utils.ts` | Generates human-readable adjustment suggestions |

### Data Flow (No New APIs Needed)
```
Objectives page (server)
  -> prisma.initiative.findMany() [already fetches startDate, endDate, status, personInCharge]
  -> serializes to JSON
  -> ObjectiveHierarchy (client)
    -> detectOwnerOverlap(initialData) [compute once, returns Map<id, count>]
    -> ObjectiveGroup -> KeyResultGroup -> InitiativeRow
      -> analyzeDates(startDate, endDate, status) [per-row computation]
      -> <DateBadges flags={...} overlapCount={overlapMap.get(id)} />
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| No date intelligence | `analyzeDates()` utility created | Phase 38 (Jan 2026) | Foundation function exists but not yet consumed by UI |
| Date range display only | Date flags with colored badges | Phase 41 (this phase) | Visual intelligence for initiative health |

## Open Questions

1. **Badge placement: below title or in metadata row?**
   - Below title (between title and KPI bar) is more prominent and matches the visual hierarchy
   - In metadata row (alongside department/person/dates) is more compact
   - Recommendation: Between title and KPI bar for maximum visibility. Date intelligence is the primary purpose of this phase.

2. **Overdue days: compute in component or extend utility?**
   - Current `analyzeDates()` returns `daysUntilEnd: null` for overdue items
   - Option A: Badge component computes `differenceInDays(new Date(), new Date(endDate))` directly
   - Option B: Extend `DateIntelligence` type with `daysOverdue: number | null`
   - Recommendation: Option B (extend the utility). Cleaner separation of concerns. The utility should provide all data the UI needs.

3. **TooltipProvider placement**
   - Need to verify if `TooltipProvider` is already in the app tree (layout.tsx or providers.tsx)
   - If not, add it once in `ObjectiveHierarchy` wrapping the content
   - Recommendation: Check at implementation time; if missing, wrap at ObjectiveHierarchy level

## Sources

### Primary (HIGH confidence)
- `src/lib/initiative-date-utils.ts` -- Existing analyzeDates() function (113 lines)
- `src/lib/initiative-group-utils.ts` -- Grouping utility types and functions (92 lines)
- `src/components/objectives/initiative-row.tsx` -- Current row layout (86 lines)
- `src/components/objectives/objective-hierarchy.tsx` -- Top-level component with Initiative type and initialData (136 lines)
- `src/components/objectives/key-result-group.tsx` -- KR group rendering (106 lines)
- `src/app/(dashboard)/objectives/page.tsx` -- Server data fetching (83 lines)
- `src/components/kanban/initiative-detail-sheet.tsx` -- Detail sheet for timeline suggestions (695 lines)
- `prisma/schema.prisma` -- Initiative model: personInCharge as TeamMember? enum, startDate/endDate as DateTime, status as InitiativeStatus enum
- `src/components/ui/badge.tsx` -- Badge with variant/className props (37 lines)
- `src/components/ui/tooltip.tsx` -- Tooltip with provider/trigger/content (33 lines)
- `src/components/ai/confidence-badge.tsx` -- Color-coded badge pattern (40 lines)

### Secondary (HIGH confidence -- internal research)
- `.planning/phases/38-schema-utilities-foundation/38-RESEARCH.md` -- Phase 38 research establishing utility patterns and date-fns usage

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- All libraries already installed, all patterns established in prior phases
- Architecture: HIGH -- All insertion points identified from reading actual source files, data flow verified
- Pitfalls: HIGH -- Derived from reading utility function return types and component prop interfaces
- Owner overlap: HIGH -- personInCharge field verified as TeamMember? enum, index confirmed in schema

**Research date:** 2026-01-26
**Valid until:** 2026-02-26 (stable -- no dependency changes expected, all infrastructure from Phase 38-40 is in place)
