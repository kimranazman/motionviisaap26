# Phase 39: By Objective Hierarchy View - Research

**Researched:** 2026-01-26
**Domain:** Next.js App Router page + client-side expandable hierarchy + view mode navigation
**Confidence:** HIGH

## Summary

Phase 39 builds a new `/objectives` route that displays all 28 initiatives in a three-level expandable hierarchy: Objective > Key Result > Initiative. The Phase 38 utility module `initiative-group-utils.ts` already provides the grouping logic (`groupInitiativesByObjective`), so this phase is purely a UI/routing task. The codebase has established patterns for every aspect: Server Component data fetching (5 existing view pages follow the exact same pattern), client-side expand/collapse state (TaskTree component), collapsible UI primitives (`@radix-ui/react-collapsible` already installed with shadcn/ui wrapper), and sidebar navigation updates.

The two Objective enum values are `OBJ1_SCALE_EVENTS` ("Obj 1: Scale Events") and `OBJ2_BUILD_AI_TRAINING` ("Obj 2: Build AI Training"). With only 2 objectives and ~28 initiatives total, the hierarchy is shallow and lightweight -- no virtualization or pagination needed.

A critical architectural decision (already made) is that the objectives page is a **separate route** (`/objectives`), not tabs on the existing `/initiatives` page. This is correct because: (a) it needs `projects` data that other views don't need (for KPI in Phase 40), (b) it avoids loading DnD-kit and other heavy Kanban dependencies, (c) it follows the existing pattern where each view is a separate route. The view mode toggle (VIEW-06) will use `next/navigation` `useRouter().push()` to navigate between routes, not React state to switch content.

**Primary recommendation:** Create `/objectives` route with Server Component data fetch, a single `ObjectiveHierarchy` client component managing expand/collapse state via `useState<Set<string>>`, and use the existing `Collapsible` shadcn/ui component for expand/collapse behavior. Add `/objectives` to both sidebar and mobile-sidebar navigation. Implement view mode toggle as a pill-style navigation bar that links to the 5 view routes.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js App Router | ^15 | `/objectives` route with Server Component | All 5 existing view pages use this pattern |
| @radix-ui/react-collapsible | ^1.1.12 | Expand/collapse sections | Already installed, shadcn/ui wrapper exists at `src/components/ui/collapsible.tsx` |
| Prisma | ^6.19.2 | Server-side data fetch in page.tsx | Every page.tsx fetches via Prisma directly |
| lucide-react | ^0.562.0 | Icons (ChevronRight, ChevronDown, Target, List, etc.) | Already used throughout the app |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| initiative-group-utils.ts | (local) | `groupInitiativesByObjective()` function | Client-side grouping in ObjectiveHierarchy |
| src/lib/utils.ts | (local) | `formatObjective()`, `formatStatus()`, `getStatusColor()`, `cn()` | Display formatting in all components |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Collapsible (Radix) | Accordion (Radix) | Accordion is single-open-at-a-time by default. Collapsible allows independent open/close per section, which is what we need. Accordion not installed. |
| `useState<Set<string>>` | `useReducer` | Set-based state is simpler for toggle behavior and matches the TaskTree pattern already in the codebase. |
| Router-based view toggle | Tab-based in-page toggle | Each view has different data requirements. Router navigation keeps pages independent and follows existing architecture. |

**Installation:**
```bash
# No new dependencies needed. All libraries already installed.
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  app/(dashboard)/
    objectives/
      page.tsx                          # NEW: Server Component (data fetch + serialize)
  components/
    objectives/                         # NEW: feature directory
      objective-hierarchy.tsx            # Main client component (groups data, manages expand state)
      objective-group.tsx                # Objective-level collapsible section
      key-result-group.tsx               # KR-level collapsible section
      initiative-row.tsx                 # Single initiative row (full text, status badge)
      view-mode-toggle.tsx               # Pill navigation for switching views
  components/layout/
    sidebar.tsx                          # MODIFY: add /objectives nav item
    mobile-sidebar.tsx                   # MODIFY: add /objectives nav item
```

### Pattern 1: Server Component Data Fetch (Established)
**What:** Every view page is a Server Component that fetches data via Prisma, serializes Date/Decimal fields, and passes the result as a prop to a client component.
**When to use:** The `objectives/page.tsx` route.
**Example (from existing `kanban/page.tsx`):**
```typescript
// src/app/(dashboard)/objectives/page.tsx
export const dynamic = 'force-dynamic'

import prisma from '@/lib/prisma'
import { Header } from '@/components/layout/header'
import { ObjectiveHierarchy } from '@/components/objectives/objective-hierarchy'

async function getInitiatives() {
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
    },
  })

  return initiatives.map(i => ({
    ...i,
    startDate: i.startDate.toISOString(),
    endDate: i.endDate.toISOString(),
  }))
}

export default async function ObjectivesPage() {
  const initiatives = await getInitiatives()

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="By Objective"
        description="Initiatives grouped by Objective and Key Result"
      />
      <div className="p-6">
        <ObjectiveHierarchy initialData={initiatives} />
      </div>
    </div>
  )
}
```

### Pattern 2: Expand/Collapse State (From TaskTree)
**What:** Parent component manages a `Set<string>` of expanded section IDs. Toggle function adds/removes from the set. Children receive `isExpanded` prop and `onToggle` callback.
**When to use:** ObjectiveHierarchy managing expand state for Objective and KeyResult sections.
**Example (from existing `task-tree.tsx` lines 26-50):**
```typescript
// In ObjectiveHierarchy (parent client component)
const [expandedObjectives, setExpandedObjectives] = useState<Set<string>>(
  // Default: all expanded (like TaskTree initializes with all IDs)
  new Set(OBJECTIVE_OPTIONS.map(o => o.value))
)
const [expandedKRs, setExpandedKRs] = useState<Set<string>>(
  // Default: all KRs expanded
  new Set(/* derive unique normalized KR values from data */)
)

const toggleObjective = (objective: string) => {
  setExpandedObjectives(prev => {
    const next = new Set(prev)
    if (next.has(objective)) {
      next.delete(objective)
    } else {
      next.add(objective)
    }
    return next
  })
}
```

### Pattern 3: Collapsible Sections (shadcn/ui Collapsible)
**What:** Use the existing `Collapsible`, `CollapsibleTrigger`, `CollapsibleContent` components from shadcn/ui (wrapping `@radix-ui/react-collapsible`).
**When to use:** Each Objective group and each Key Result group.
**Example:**
```typescript
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible'
import { ChevronRight } from 'lucide-react'

<Collapsible open={isExpanded} onOpenChange={() => onToggle(objective)}>
  <CollapsibleTrigger className="flex items-center gap-2 w-full p-3 hover:bg-gray-50">
    <ChevronRight
      className={cn(
        "h-4 w-4 transition-transform",
        isExpanded && "rotate-90"
      )}
    />
    <span className="font-semibold">{formatObjective(objective)}</span>
    <span className="text-sm text-gray-500 ml-2">
      {totalInitiatives} initiative{totalInitiatives !== 1 ? 's' : ''}
    </span>
    {/* Status summary badges */}
  </CollapsibleTrigger>
  <CollapsibleContent>
    {/* Key Result groups or Initiative rows */}
  </CollapsibleContent>
</Collapsible>
```

### Pattern 4: View Mode Toggle as Route Navigation
**What:** A pill-style toggle bar that navigates between the 5 view routes using `next/link` or `useRouter().push()`. NOT a tab content switcher -- each view is a separate route.
**When to use:** Top of the ObjectiveHierarchy component (and later in all view pages).
**Example:**
```typescript
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Target, List, KanbanSquare, GanttChart, Calendar } from 'lucide-react'

const VIEW_MODES = [
  { name: 'By Objective', href: '/objectives', icon: Target },
  { name: 'List', href: '/initiatives', icon: List },
  { name: 'Kanban', href: '/kanban', icon: KanbanSquare },
  { name: 'Timeline', href: '/timeline', icon: GanttChart },
  { name: 'Calendar', href: '/calendar', icon: Calendar },
]

export function ViewModeToggle() {
  const pathname = usePathname()

  return (
    <div className="inline-flex items-center rounded-lg bg-white/70 backdrop-blur-xl border border-gray-200/50 p-1">
      {VIEW_MODES.map(mode => {
        const isActive = pathname === mode.href
        return (
          <Link
            key={mode.href}
            href={mode.href}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-sm font-medium transition-all",
              isActive
                ? "bg-white text-gray-900 shadow"
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            <mode.icon className="h-4 w-4" />
            {mode.name}
          </Link>
        )
      })}
    </div>
  )
}
```

This styling mirrors the KanbanBoard's TabsList appearance (`bg-white/70 backdrop-blur-xl border border-gray-200/50`).

### Anti-Patterns to Avoid
- **Merging views into tabs on one page:** Each view has different data requirements. The Kanban needs DnD-kit, Timeline needs department ordering, Objectives will need project data. Keep them as separate routes. (Architecture research 9.1)
- **Client-side data fetching for initial load:** Do NOT use `useEffect` + `fetch()`. Follow the Server Component pattern used by all 5 existing view pages. (Architecture research 9.3)
- **Using accordion instead of collapsible:** Accordion defaults to single-open. The requirement (VIEW-04) says users can expand/collapse individual sections independently.
- **Resetting expand state on data refresh:** The `useState<Set<string>>` pattern persists across re-renders. Do NOT initialize expand state inside `useMemo` or derive it from data on every render. The TaskTree pattern uses `useEffect` to initialize only when tasks change -- for objectives, initialize once with all sections expanded.
- **Truncating initiative titles:** VIEW-05 requires full text wrapping. Use CSS `whitespace-normal` or no `truncate`/`line-clamp` classes. The existing `initiatives-list.tsx` uses `truncate` on titles (line 184) -- this must NOT be replicated.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Expand/collapse animation | Custom CSS transitions | `@radix-ui/react-collapsible` via shadcn/ui `Collapsible` | Already installed, handles ARIA attributes, keyboard navigation, animation |
| Initiative grouping by objective/KR | Custom grouping logic | `groupInitiativesByObjective()` from `src/lib/initiative-group-utils.ts` | Already built in Phase 38, includes normalization, counts, status summaries |
| Objective enum display names | Inline string mapping | `formatObjective()` from `src/lib/utils.ts` | Already exists: `OBJ1_SCALE_EVENTS` -> "Obj 1: Scale Events" |
| Status display/coloring | Custom badge styles | `formatStatus()` + `getStatusColor()` from `src/lib/utils.ts` | Already used across all existing views |
| Initiative detail on click | Custom modal/dialog | `InitiativeDetailSheet` from `src/components/kanban/initiative-detail-sheet.tsx` | Already a standalone Sheet component that fetches its own data |

**Key insight:** Phase 38 built the grouping utility specifically for this phase. The `groupInitiativesByObjective()` function returns a `GroupedObjective[]` array with nested `GroupedKeyResult[]`, each containing `totalInitiatives`, `completedCount`, `inProgressCount`, and `atRiskCount`. This maps directly to the VIEW-03 requirement for status summaries in section headers.

## Common Pitfalls

### Pitfall 1: Expand State Reset on Re-render
**What goes wrong:** If expand state is derived from data (e.g., `useMemo` that recomputes which sections are expanded), collapsing a section then triggering a re-render (data refresh) reopens everything.
**Why it happens:** React re-runs effects and memos when dependencies change.
**How to avoid:** Use `useState` for expand state, NOT `useMemo`. Initialize once (all expanded by default). The TaskTree pattern uses `useEffect` with tasks dependency, but for objectives the data is static (no inline editing), so `useState` initialization is sufficient.
**Warning signs:** Collapsing a section, then seeing it reopen after any other interaction.

### Pitfall 2: Status Summary Not Matching VIEW-03 Requirement
**What goes wrong:** VIEW-03 says headers show "initiative count and status summary (e.g., '5 On Track, 2 At Risk')". If only total count is shown, the requirement is not met.
**Why it happens:** The `GroupedObjective` interface already has `completedCount`, `inProgressCount`, and `atRiskCount`, but the `GroupedKeyResult` interface only has `totalInitiatives` and `completedCount`.
**How to avoid:** The `GroupedKeyResult` interface from `initiative-group-utils.ts` needs to be extended OR status summary should be computed inline in the component. Current `GroupedKeyResult`:
```typescript
export interface GroupedKeyResult {
  keyResult: string
  initiatives: InitiativeForGrouping[]  // Has full initiative data
  totalInitiatives: number
  completedCount: number
  // Missing: inProgressCount, atRiskCount
}
```
Since `initiatives` array is available, compute status counts inline: `initiatives.filter(i => i.status === 'IN_PROGRESS').length`. This avoids modifying the Phase 38 utility.
**Warning signs:** Key Result headers only showing total count without status breakdown.

### Pitfall 3: Title Truncation Carried Over
**What goes wrong:** The existing `initiatives-list.tsx` (line 184) uses `truncate` CSS class on initiative titles: `<p className="font-medium text-gray-900 truncate">`. If this pattern is copied to the hierarchy view, VIEW-05 (no truncation) fails.
**Why it happens:** Copy-paste from existing components.
**How to avoid:** Explicitly use no truncation: `<p className="font-medium text-gray-900">` (no truncate, no line-clamp). Titles will wrap naturally with `whitespace-normal` (the default). Verify by checking that long titles display fully.
**Warning signs:** Any `truncate`, `line-clamp-*`, `text-ellipsis`, or `overflow-hidden` on initiative title elements.

### Pitfall 4: Missing Navigation Update
**What goes wrong:** The new `/objectives` route works but users can't find it because it's not in the sidebar navigation.
**Why it happens:** Forgetting to update both `sidebar.tsx` AND `mobile-sidebar.tsx`.
**How to avoid:** Update both files. The sidebar navigation array needs a new entry with `{ name: 'By Objective', href: '/objectives', icon: Target }`. Place it as the SECOND item (after Dashboard) since it's the primary strategic view. The `Target` icon is already imported in `sidebar.tsx` (used in the logo section).
**Warning signs:** No way to navigate to `/objectives` except by typing the URL directly.

### Pitfall 5: View Mode Toggle Not Syncing with Route
**What goes wrong:** The view toggle shows the wrong active state, or clicking a toggle doesn't navigate.
**Why it happens:** Using controlled tabs state instead of route-based navigation.
**How to avoid:** Use `usePathname()` from `next/navigation` to determine the active view mode. Use `<Link>` for navigation (prefetching included). Do NOT use `<Tabs>` with `onValueChange` to manage which view is shown -- these are separate routes.
**Warning signs:** Active pill doesn't match the current URL. Or: clicking toggle changes the pill highlight but doesn't load new content.

### Pitfall 6: Key Result Normalization Display
**What goes wrong:** The group header shows "KR11" (the normalized form) instead of "KR1.1" (a human-readable form).
**Why it happens:** `normalizeKeyResult()` removes ALL whitespace and uppercases, turning "KR 1.1" into "KR11". But the normalized form is used as the Map key; the original values are in the initiatives array.
**How to avoid:** Use the normalized string as the grouping key but display the FIRST initiative's original `keyResult` value for the header text. Or format the normalized key for display (e.g., insert dots/spaces).
**Warning signs:** Group headers showing "KR11", "KR12" instead of "KR1.1", "KR1.2".

## Code Examples

### Existing Data Patterns

**Objective enum values** (from `prisma/schema.prisma`):
```
OBJ1_SCALE_EVENTS      -> "Obj 1: Scale Events"
OBJ2_BUILD_AI_TRAINING  -> "Obj 2: Build AI Training"
```

**Initiative status enum values** (from `prisma/schema.prisma`):
```
NOT_STARTED, IN_PROGRESS, ON_HOLD, AT_RISK, COMPLETED, CANCELLED
```

**Status display** (from `src/lib/utils.ts`):
```typescript
formatStatus('IN_PROGRESS')  // "In Progress"
formatStatus('AT_RISK')      // "At Risk"
getStatusColor('IN_PROGRESS')  // "bg-blue-100 text-blue-700"
getStatusColor('AT_RISK')      // "bg-orange-100 text-orange-700"
```

### GroupedObjective Structure (from initiative-group-utils.ts)
```typescript
// Input: flat initiative array
// Output: grouped hierarchy
const grouped: GroupedObjective[] = groupInitiativesByObjective(initiatives)

// Structure:
// [
//   {
//     objective: "OBJ1_SCALE_EVENTS",
//     keyResults: [
//       {
//         keyResult: "KR1.1",  // <-- normalized form
//         initiatives: [...],
//         totalInitiatives: 5,
//         completedCount: 2,
//       },
//       { keyResult: "KR1.2", ... },
//     ],
//     totalInitiatives: 15,
//     completedCount: 5,
//     inProgressCount: 6,
//     atRiskCount: 2,
//   },
//   {
//     objective: "OBJ2_BUILD_AI_TRAINING",
//     ...
//   },
// ]
```

### Status Summary Display for Headers
```typescript
// For Objective headers (data available directly)
function statusSummary(group: GroupedObjective): string {
  const parts: string[] = []
  if (group.inProgressCount > 0) parts.push(`${group.inProgressCount} In Progress`)
  if (group.atRiskCount > 0) parts.push(`${group.atRiskCount} At Risk`)
  if (group.completedCount > 0) parts.push(`${group.completedCount} Completed`)
  return parts.join(', ') || 'No initiatives'
}

// For Key Result headers (compute from initiatives array)
function krStatusSummary(initiatives: InitiativeForGrouping[]) {
  const counts = {
    inProgress: initiatives.filter(i => i.status === 'IN_PROGRESS').length,
    atRisk: initiatives.filter(i => i.status === 'AT_RISK').length,
    completed: initiatives.filter(i => i.status === 'COMPLETED').length,
  }
  const parts: string[] = []
  if (counts.inProgress > 0) parts.push(`${counts.inProgress} In Progress`)
  if (counts.atRisk > 0) parts.push(`${counts.atRisk} At Risk`)
  if (counts.completed > 0) parts.push(`${counts.completed} Completed`)
  return parts.join(', ')
}
```

### Collapsible Usage Pattern
```typescript
// The shadcn/ui Collapsible wraps @radix-ui/react-collapsible
// Already available at: src/components/ui/collapsible.tsx
// Exports: Collapsible, CollapsibleTrigger, CollapsibleContent

import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible'
```

### InitiativeDetailSheet Reuse Pattern
```typescript
// From kanban-board.tsx (lines 184-189, 577-583)
// The sheet component manages its own data fetching
import { InitiativeDetailSheet } from '@/components/kanban/initiative-detail-sheet'

const [selectedInitiative, setSelectedInitiative] = useState<Initiative | null>(null)
const [isSheetOpen, setIsSheetOpen] = useState(false)

const handleInitiativeClick = (initiative: Initiative) => {
  setSelectedInitiative(initiative)
  setIsSheetOpen(true)
}

// In render:
<InitiativeDetailSheet
  initiative={selectedInitiative}
  open={isSheetOpen}
  onOpenChange={setIsSheetOpen}
  onUpdate={handleInitiativeUpdate}
/>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single initiatives list view | 5 separate view routes (List, Kanban, Timeline, Calendar, + Objectives) | v1.5 (now) | Each view is its own route with independent data requirements |
| Flat initiative display | Objective > KR > Initiative hierarchy | v1.5 (now) | Requires grouping utility (already built in Phase 38) |
| Sidebar nav: 4 initiative views | 5 views with `/objectives` as primary | v1.5 (now) | Update sidebar.tsx and mobile-sidebar.tsx |

**Deprecated/outdated:**
- Nothing deprecated. All existing view pages remain unchanged.

## Open Questions

1. **Display of normalized key result text in headers**
   - What we know: `normalizeKeyResult("KR 1.1")` returns `"KR11"` (removes all whitespace). The normalized form is used as the Map key.
   - What's unclear: Should the header display `"KR1.1"` (normalized) or the first initiative's original `keyResult` value (e.g., `"KR 1.1"`)?
   - Recommendation: Display the normalized form `"KR1.1"` since it is clean and consistent. The normalized form from the data IS `"KR1.1"` not `"KR11"` -- re-checking: `"KR 1.1".trim().toUpperCase().replace(/\s+/g, '')` = `"KR1.1"`. This is already readable. No issue.

2. **Mobile responsiveness of hierarchy view**
   - What we know: The hierarchy has 3 levels of indentation. On small screens this could be tight.
   - What's unclear: How much indentation to use on mobile.
   - Recommendation: Use `pl-4` for Objective level, `pl-8` for KR level, `pl-12` for Initiative level on desktop. On mobile, reduce to `pl-2`, `pl-4`, `pl-6` using Tailwind responsive prefixes.

3. **Should the view mode toggle appear on ALL view pages or just objectives?**
   - What we know: VIEW-06 says "User can toggle between view modes." The plan says 39-02 is "View mode toggle integration."
   - What's unclear: Whether the toggle is added to all 5 view pages in this phase or just `/objectives`.
   - Recommendation: Create the `ViewModeToggle` component and add it to the `/objectives` page in 39-01. In 39-02, add it to the other 4 view pages. This keeps the scope manageable.

## Existing Codebase Facts (Critical for Planning)

### Current Navigation Structure
**Sidebar** (`sidebar.tsx` line 24-31): Dashboard, Timeline, Kanban, Calendar, Initiatives, Events
**Mobile Sidebar** (`mobile-sidebar.tsx` line 26-33): Same items
**Mobile Bottom Nav** (`mobile-nav.tsx` line 8-13): Dashboard, Initiatives, CRM, Events (only 4 items)

The `Target` icon is already imported in `sidebar.tsx` (line 13) for the logo. It should be used for the `/objectives` nav item.

### Sidebar Active State Logic
```typescript
const isActive = pathname === item.href ||
  (item.href !== '/' && pathname.startsWith(item.href))
```
The `/objectives` route will correctly highlight since it doesn't clash with any existing route.

### Existing Initiative Interface Fields (Minimum for Hierarchy)
From `initiatives-list.tsx` and `gantt-chart.tsx`, the common fields needed:
```typescript
interface Initiative {
  id: string
  sequenceNumber: number
  title: string
  objective: string     // Required for grouping
  keyResult: string     // Required for sub-grouping
  department: string
  status: string        // Required for status summary
  personInCharge: string | null
  startDate: string
  endDate: string
}
```

### initiative-group-utils.ts Input Interface
```typescript
export interface InitiativeForGrouping {
  id: string
  objective: string
  keyResult: string
  status: string
  title: string
}
```
The page data will have MORE fields than this (department, dates, personInCharge, etc.) which is fine -- TypeScript structural typing allows passing a superset.

### Radix Collapsible API
```
<Collapsible>        - Root: accepts `open`, `onOpenChange`, `defaultOpen`
<CollapsibleTrigger>  - The element that triggers open/close
<CollapsibleContent>  - The content that shows/hides
```
The `open` prop makes it a controlled component (required for external state management via `Set<string>`).

## Sources

### Primary (HIGH confidence)
- `src/app/(dashboard)/initiatives/page.tsx` -- Current initiatives page pattern (37 lines)
- `src/app/(dashboard)/kanban/page.tsx` -- Kanban page pattern with Server Component data fetch (47 lines)
- `src/app/(dashboard)/timeline/page.tsx` -- Timeline page pattern (54 lines)
- `src/app/(dashboard)/calendar/page.tsx` -- Calendar page pattern (61 lines)
- `src/components/initiatives/initiatives-list.tsx` -- Current list view with truncation on line 184 (271 lines)
- `src/components/kanban/kanban-board.tsx` -- Kanban with view toggle and detail sheet reuse (587 lines)
- `src/components/projects/task-tree.tsx` -- Expand/collapse state pattern using `Set<string>` (lines 26-50)
- `src/components/ui/collapsible.tsx` -- shadcn/ui Collapsible wrapper (12 lines)
- `src/components/layout/sidebar.tsx` -- Navigation array and active state logic (173 lines)
- `src/components/layout/mobile-sidebar.tsx` -- Mobile navigation (117 lines)
- `src/components/layout/mobile-nav.tsx` -- Bottom tab bar (47 lines)
- `src/lib/initiative-group-utils.ts` -- Phase 38 grouping utility (92 lines)
- `src/lib/utils.ts` -- `formatObjective()`, `formatStatus()`, `getStatusColor()`, `OBJECTIVE_OPTIONS`
- `prisma/schema.prisma` -- Objective enum (2 values), InitiativeStatus enum (6 values), Initiative model (lines 42-80)
- `package.json` -- `@radix-ui/react-collapsible: ^1.1.12`, `lucide-react: ^0.562.0`

### Secondary (HIGH confidence -- internal research docs)
- `.planning/research/v1.5-ARCHITECTURE.md` -- Component architecture (sections 3.1-3.4), data flow (4.1), navigation (7.1), anti-patterns (9.1-9.4)
- `.planning/ROADMAP.md` -- Phase 39 success criteria, plan structure (39-01, 39-02)
- `.planning/REQUIREMENTS.md` -- VIEW-01 through VIEW-06 requirements

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- All libraries already installed and verified from package.json. Zero new dependencies.
- Architecture: HIGH -- All patterns derived from reading 5+ existing page routes and 10+ component files. The architecture research document (`v1.5-ARCHITECTURE.md`) provides detailed component map.
- Pitfalls: HIGH -- Derived from direct code reading (truncation on line 184, expand state in TaskTree, collapsible API from Radix source).

**Research date:** 2026-01-26
**Valid until:** 2026-02-26 (stable -- no dependency changes expected)
