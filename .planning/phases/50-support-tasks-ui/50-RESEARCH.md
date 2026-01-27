# Phase 50: Support Tasks UI - Research

**Researched:** 2026-01-27
**Domain:** Next.js App Router pages, React client components, Tailwind CSS, Radix UI primitives
**Confidence:** HIGH

## Summary

Phase 50 builds the UI for viewing and filtering 30 support tasks. The scope is entirely frontend: a new page at `/support-tasks`, a category filter, sidebar navigation entry, and clickable KR badges that link to the objectives page. The API endpoint (`GET /api/support-tasks`) already exists from Phase 48 and returns support tasks with included `keyResultLinks` containing `keyResult.id`, `keyResult.krId`, and `keyResult.description`.

The codebase has well-established patterns for exactly this kind of page. The Events page (`/events`) is the closest analog: a server component page that fetches data via Prisma, passes it to a client component (`EventsView`) that handles client-side filtering with `Select` dropdowns and groups items by category. The sidebar (`sidebar.tsx`, `mobile-sidebar.tsx`) uses a simple navigation array pattern. All existing pages use the `Header` component and follow the `bg-gray-50` background convention.

The support tasks page should follow the Events page pattern: server component page fetches all support tasks with KR relations via Prisma, serializes them, and passes to a `SupportTasksView` client component. The client component implements category filtering (4 categories: Design & Creative, Business & Admin, Talenta Ideas, Operations) using a `Select` dropdown, groups tasks by category, and renders each task with `Badge` components for linked KRs. KR badges link to `/objectives` -- since the objectives page currently has no anchor/deep-link mechanism for individual KRs, the simplest approach is to link to `/objectives` (the page auto-expands all KRs by default, so users can find the relevant KR).

**Primary recommendation:** Copy the Events page pattern exactly (server component + client view component with filter). Use `Select` for category filter (matches events-view.tsx pattern). Group tasks by `SupportTaskCategory` enum. Render KR badges as `Link` components pointing to `/objectives`. Add navigation entry to sidebar navigation array between "Initiatives" and "Events to Attend".

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 14.2.28 | App Router pages (server components + client components) | Already used; all pages follow this pattern |
| react | 18.x | Client component state management (useState for filters) | Already used throughout |
| @prisma/client | 6.19.2 | Server-side data fetching in page.tsx | Used by every server component page |
| tailwindcss | 3.4.x | All styling | Only CSS approach in the project |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | 0.562.0 | Icons (ClipboardList or CheckSquare for nav, User for owner, etc.) | All icons in the project use Lucide |
| @radix-ui/react-select | 2.2.6 | Category filter dropdown | Already used in EventsView for priority/category filters |
| class-variance-authority | 0.7.1 | Badge variants | Already used by Badge component |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Select dropdown for filter | Tabs component | Select is the established filter pattern (events-view.tsx uses Select); Tabs could work but would deviate from convention |
| Client-side grouping | Server-side grouping via Prisma | Client-side is simpler for 30 items; matches events-view.tsx approach |
| Link to `/objectives#KR1.1` | Deep link with scroll-to anchor | Objectives page has no anchor mechanism; would require modifying Phase 49 work; just link to `/objectives` |

**Installation:**
```bash
# No new packages needed -- all already installed
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  app/(dashboard)/
    support-tasks/
      page.tsx                    # Server component: fetch data, pass to view
  components/
    support-tasks/
      support-tasks-view.tsx      # Client component: filters + grouped display
  components/layout/
    sidebar.tsx                   # MODIFY: add "Support Tasks" nav item
    mobile-sidebar.tsx            # MODIFY: add "Support Tasks" nav item
```

### Pattern 1: Server Component Page (Data Fetching)
**What:** Server component that fetches data via Prisma, serializes Decimal fields, and passes to a client component.
**When to use:** Every list page in the codebase.
**Example:**
```typescript
// Source: src/app/(dashboard)/events/page.tsx (existing pattern)
export const dynamic = 'force-dynamic'

import { Header } from '@/components/layout/header'
import { SupportTasksView } from '@/components/support-tasks/support-tasks-view'
import prisma from '@/lib/prisma'

async function getSupportTasks() {
  const tasks = await prisma.supportTask.findMany({
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
  return tasks
}

export default async function SupportTasksPage() {
  const tasks = await getSupportTasks()
  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="Support Tasks"
        description="30 recurring operational tasks grouped by category"
      />
      <div className="p-3 md:p-6">
        <SupportTasksView tasks={tasks} />
      </div>
    </div>
  )
}
```

### Pattern 2: Client-Side Filtering (Select Dropdown)
**What:** Client component with `useState` for filter state and client-side `.filter()` on the data array.
**When to use:** Small datasets (30 items) with simple filter criteria.
**Example:**
```typescript
// Source: src/components/events/events-view.tsx (lines 69-78)
const [categoryFilter, setCategoryFilter] = useState<string>('all')

const filteredTasks = tasks.filter(task => {
  if (categoryFilter !== 'all' && task.category !== categoryFilter) return false
  return true
})
```

### Pattern 3: Sidebar Navigation Entry
**What:** Navigation items are defined as arrays at the top of `sidebar.tsx` and `mobile-sidebar.tsx`. The first array contains OKR/initiative views; "Support Tasks" belongs in this section.
**When to use:** Adding any new top-level page.
**Example:**
```typescript
// Source: src/components/layout/sidebar.tsx (lines 25-33)
const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'By Objective', href: '/objectives', icon: Target },
  { name: 'Timeline', href: '/timeline', icon: GanttChart },
  { name: 'Kanban', href: '/kanban', icon: KanbanSquare },
  { name: 'Calendar', href: '/calendar', icon: Calendar },
  { name: 'Initiatives', href: '/initiatives', icon: ListTodo },
  // ADD: Support Tasks here, before Events to Attend
  { name: 'Support Tasks', href: '/support-tasks', icon: ClipboardList },
  { name: 'Events to Attend', href: '/events', icon: Ticket },
]
```

### Pattern 4: Category Grouping Display
**What:** Group items by category enum, render each group as a collapsible section or a Card with a header.
**When to use:** Displaying support tasks grouped by 4 categories.
**Example approach:**
```typescript
// Group tasks by category
const CATEGORY_LABELS: Record<string, string> = {
  DESIGN_CREATIVE: 'Design & Creative',
  BUSINESS_ADMIN: 'Business & Admin',
  TALENTA_IDEAS: 'Talenta Ideas',
  OPERATIONS: 'Operations',
}

const CATEGORY_ORDER = ['DESIGN_CREATIVE', 'BUSINESS_ADMIN', 'TALENTA_IDEAS', 'OPERATIONS']

const grouped = CATEGORY_ORDER
  .map(cat => ({
    category: cat,
    label: CATEGORY_LABELS[cat],
    tasks: filteredTasks.filter(t => t.category === cat),
  }))
  .filter(g => g.tasks.length > 0)
```

### Pattern 5: KR Badge as Link
**What:** Each support task has 1+ linked KRs rendered as clickable badges using Next.js `Link`.
**When to use:** Displaying KR associations on support task cards.
**Example:**
```typescript
// KR badges -- link to objectives page
{task.keyResultLinks.map(link => (
  <Link key={link.keyResult.id} href="/objectives">
    <Badge
      variant="outline"
      className="cursor-pointer hover:bg-blue-50 text-blue-700 border-blue-200 text-xs"
    >
      {link.keyResult.krId}
    </Badge>
  </Link>
))}
```

### Anti-Patterns to Avoid
- **Fetching via API route from server component:** Don't use `fetch('/api/support-tasks')` from the server component. Use Prisma directly (the page.tsx is a server component and has direct database access). This is the established pattern in the codebase.
- **Creating a separate API call for each category:** The 30 support tasks should be fetched once and filtered client-side. Do not create separate API calls per category.
- **Adding URL-based filter state for 30 items:** For such a small dataset, client-side `useState` filtering is simpler and matches the events-view.tsx pattern. Do not use `searchParams` or URL state.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Dropdown filter | Custom dropdown | `Select` from `@/components/ui/select` | Already used in EventsView, consistent UX |
| Category badges | Custom styled spans | `Badge` from `@/components/ui/badge` | Standardized across the app |
| Collapsible groups | Custom show/hide with state | `Collapsible` from `@/components/ui/collapsible` | Already used in ObjectiveGroup, smooth animations |
| Active nav highlighting | Custom comparison logic | Existing `cn()` + `pathname.startsWith()` pattern | Already implemented in sidebar.tsx |
| Priority display | Custom colors | Reuse `TaskPriority` enum mapping | SupportTask.priority reuses the existing TaskPriority enum (LOW/MEDIUM/HIGH) |

**Key insight:** The codebase already has all the UI primitives needed. This phase assembles existing components into a new page, not creating new primitives.

## Common Pitfalls

### Pitfall 1: Forgetting to Update Mobile Sidebar
**What goes wrong:** Support Tasks appears in desktop sidebar but not in mobile sidebar sheet.
**Why it happens:** The navigation arrays are duplicated between `sidebar.tsx` and `mobile-sidebar.tsx`.
**How to avoid:** Update BOTH files when adding the navigation item. The mobile sidebar has a separate `navigation` array at line 27.
**Warning signs:** Testing only on desktop.

### Pitfall 2: Decimal Fields Not Serialized
**What goes wrong:** Next.js cannot serialize Prisma Decimal objects to JSON for client components.
**Why it happens:** SupportTask itself has no Decimal fields, but the included KeyResult does (target, actual, progress, weight). If the page ever includes those fields, they must be serialized.
**How to avoid:** For Phase 50, the API select only needs `id`, `krId`, and `description` from KeyResult -- no Decimal fields. Keep the select narrow.
**Warning signs:** "TypeError: Cannot serialize Decimal" at runtime.

### Pitfall 3: Missing `force-dynamic` Export
**What goes wrong:** Page shows stale data after database changes.
**Why it happens:** Next.js App Router can statically render pages by default.
**How to avoid:** Add `export const dynamic = 'force-dynamic'` at the top of page.tsx (all other data pages in this codebase do this).
**Warning signs:** Data doesn't update until rebuild.

### Pitfall 4: Navigation Active State False Positive
**What goes wrong:** "Support Tasks" nav item shows as active when on `/support-tasks/something` -- or worse, a different path partially matches.
**Why it happens:** `pathname.startsWith('/support-tasks')` is used for active detection.
**How to avoid:** The `/support-tasks` path is unique and doesn't conflict with any existing path. No issue expected.
**Warning signs:** Multiple nav items highlighted simultaneously.

### Pitfall 5: Empty Categories When Filtering
**What goes wrong:** Filtering shows empty category headers with no tasks.
**Why it happens:** Rendering all 4 category groups regardless of whether they contain filtered tasks.
**How to avoid:** Filter out empty groups: `.filter(g => g.tasks.length > 0)`.
**Warning signs:** Empty category sections visible in filtered view.

## Code Examples

Verified patterns from the existing codebase:

### Support Task TypeScript Interface
```typescript
// Derived from Prisma schema (SupportTask model + included relations)
interface SupportTask {
  id: string
  taskId: string        // "ST-001"
  category: string      // SupportTaskCategory enum
  task: string          // Task description
  owner: string         // String, not TeamMember enum
  frequency: string | null  // "Weekly", "Monthly", etc.
  priority: string      // TaskPriority enum: LOW, MEDIUM, HIGH
  notes: string | null
  keyResultLinks: Array<{
    id: string
    keyResult: {
      id: string
      krId: string        // "KR1.1"
      description: string
    }
  }>
  createdAt: string
  updatedAt: string
}
```

### Category Color Mapping
```typescript
// Consistent with codebase color conventions
const CATEGORY_COLORS: Record<string, string> = {
  DESIGN_CREATIVE: 'bg-purple-100 text-purple-800 border-purple-200',
  BUSINESS_ADMIN: 'bg-blue-100 text-blue-800 border-blue-200',
  TALENTA_IDEAS: 'bg-amber-100 text-amber-800 border-amber-200',
  OPERATIONS: 'bg-green-100 text-green-800 border-green-200',
}

const CATEGORY_LABELS: Record<string, string> = {
  DESIGN_CREATIVE: 'Design & Creative',
  BUSINESS_ADMIN: 'Business & Admin',
  TALENTA_IDEAS: 'Talenta Ideas',
  OPERATIONS: 'Operations',
}
```

### Priority Color Mapping
```typescript
// Matches existing TaskPriority usage elsewhere in the codebase
const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-700',
  MEDIUM: 'bg-yellow-100 text-yellow-700',
  HIGH: 'bg-red-100 text-red-700',
}

const PRIORITY_LABELS: Record<string, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
}
```

### Sidebar Navigation Item
```typescript
// Import ClipboardList from lucide-react
import { ClipboardList } from 'lucide-react'

// Add to navigation array (after Initiatives, before Events)
{ name: 'Support Tasks', href: '/support-tasks', icon: ClipboardList },
```

### API Response Shape
```json
// GET /api/support-tasks response (from Phase 48)
[
  {
    "id": "cuid...",
    "taskId": "ST-001",
    "category": "DESIGN_CREATIVE",
    "task": "Create social media content for events",
    "owner": "Izyani",
    "frequency": "Weekly",
    "priority": "HIGH",
    "notes": null,
    "keyResultLinks": [
      {
        "id": "cuid...",
        "supportTaskId": "cuid...",
        "keyResultId": "cuid...",
        "createdAt": "...",
        "keyResult": {
          "id": "cuid...",
          "krId": "KR1.1",
          "description": "Generate RM2.5M revenue from events"
        }
      }
    ],
    "createdAt": "...",
    "updatedAt": "..."
  }
]
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| String keyResult field on Initiative | FK relation to KeyResult model | Phase 46 (v2.0 schema) | KR badges link via `keyResult.krId` not raw strings |
| KPI fields on Initiative | KeyResult model with target/actual/progress | Phase 46 (v2.0 schema) | No KPI display needed on support tasks |
| No support tasks model | SupportTask + SupportTaskKeyResult join table | Phase 46 (v2.0 schema) | Many-to-many KR linking |

**Deprecated/outdated:**
- `initiative.keyResult` (string field): Replaced by `initiative.keyResultId` FK. The objectives view now uses the FK relation.
- `initiative-kpi-utils.ts`: Stubbed out in Phase 48. Not relevant to support tasks.

## Open Questions

Things that couldn't be fully resolved:

1. **KR Badge Deep Linking**
   - What we know: The objectives page (`/objectives`) auto-expands all objectives and KRs by default. There is no anchor/hash mechanism for scrolling to a specific KR.
   - What's unclear: Whether the user expects clicking a KR badge on a support task to scroll to that specific KR on the objectives page.
   - Recommendation: Link KR badges to `/objectives` for now. The page shows all KRs expanded, so the user can visually find the relevant KR. Deep-linking with scroll-to-anchor can be added in a future enhancement if needed. This avoids modifying the objectives page (Phase 49 scope).

2. **Summary Statistics**
   - What we know: The events page has summary cards at the top (total count, category breakdown). It's unclear if the support tasks page needs similar summary cards.
   - What's unclear: Whether the requirements expect summary statistics.
   - Recommendation: Add a simple count display showing "Showing X of 30 tasks" (like events-view.tsx does). Skip dedicated summary cards unless explicitly requested -- 30 items is a small enough dataset that category counts are visible at a glance from the grouped display.

## Sources

### Primary (HIGH confidence)
- `src/app/(dashboard)/events/page.tsx` + `src/components/events/events-view.tsx` -- Primary pattern reference for filtered list page
- `src/components/layout/sidebar.tsx` + `mobile-sidebar.tsx` -- Navigation array structure
- `src/app/api/support-tasks/route.ts` -- API endpoint structure and response shape
- `prisma/schema.prisma` (lines 854-893) -- SupportTask, SupportTaskKeyResult, SupportTaskCategory models
- `src/components/objectives/objective-hierarchy.tsx` -- Objectives page structure for KR linking context
- `src/components/ui/badge.tsx` -- Badge component API
- `src/components/ui/select.tsx` (imported by events-view) -- Select component for filtering
- `src/lib/utils.ts` -- Utility function patterns (cn, formatStatus, color mappings)

### Secondary (MEDIUM confidence)
- Phase 48 RESEARCH.md -- API endpoint documentation and architecture decisions

### Tertiary (LOW confidence)
- None -- all findings verified against actual codebase files

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already in use, no new dependencies
- Architecture: HIGH -- directly modeled on existing events page pattern
- Pitfalls: HIGH -- identified from actual codebase analysis (Decimal serialization, mobile-sidebar duplication, force-dynamic)

**Research date:** 2026-01-27
**Valid until:** 2026-02-27 (stable -- no external dependencies, internal codebase patterns)
