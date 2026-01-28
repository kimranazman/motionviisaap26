# Phase 68: Sidebar Fixes & Quick Wins - Research

**Researched:** 2026-01-28
**Domain:** Next.js client-side state management, Prisma aggregation, React UI patterns
**Confidence:** HIGH (all findings from direct codebase inspection)

## Summary

This phase addresses three independent bug-fix/improvement areas: (1) sidebar nav visibility bugs, (2) inaccurate dashboard revenue KPI, and (3) blocked task CRUD on completed projects. All three are codebase-level fixes requiring no new packages.

The sidebar issues center on `use-nav-visibility.ts` which has an `autoReveal` function that re-shows hidden items on every pathname change. The settings page fires individual PATCH calls per toggle (fire-and-forget, no save button). The revenue bug is in `getCRMDashboardData()` which only aggregates the `revenue` field for COMPLETED projects, ignoring `potentialRevenue` and ACTIVE projects. The task-on-completed-projects issue is a **non-bug** -- there is NO status-based guard anywhere in the codebase; tasks already work on completed projects. The requirement description suggests it is blocked, but code inspection shows no blocking code.

**Primary recommendation:** Remove autoReveal entirely, add batch save with dirty detection to settings page, fix the Prisma aggregate query for revenue, and verify task CRUD already works on completed projects (likely just needs testing confirmation).

## Standard Stack

No new libraries needed. All work uses existing codebase tools.

### Core (already in project)
| Library | Purpose | Used For |
|---------|---------|----------|
| React (hooks) | State management | `useNavVisibility`, settings page local state |
| Next.js App Router | Routing, server components | Dashboard page (server), settings page (client) |
| Prisma | Database queries | Revenue aggregation query fix |
| sonner (toast) | Toast notifications | Already imported in `app/layout.tsx` via `<Toaster>` |

### Key Existing Patterns
| Pattern | Where Used | Relevant To |
|---------|-----------|-------------|
| `toast()` from sonner | `project-detail-sheet.tsx` (line 43, 778, etc.) | SIDE-05: Toast on settings save |
| Fire-and-forget PATCH | `use-nav-visibility.ts` (line 57, 89) | SIDE-02: Replace with batch save |
| `ALWAYS_VISIBLE_HREFS` | `nav-config.ts` (line 91) | SIDE-01: Preserved after autoReveal removal |
| `isVisible` callback | `use-nav-visibility.ts` (line 34) | Sidebar and mobile sidebar filtering |

## Architecture Patterns

### Current Sidebar Visibility Flow
```
Settings page
  -> toggleItem(href) [per item, immediate PATCH]
  -> setHiddenItems(local state)
  -> PATCH /api/user/preferences { hiddenNavItems: [...] }

Sidebar component
  -> useNavVisibility() hook
  -> useEffect on pathname -> autoReveal(pathname) [BUG: re-shows hidden items]
  -> isVisible(href) filters nav items

Mobile Sidebar
  -> Same useNavVisibility() hook
  -> NO autoReveal call (mobile sidebar does NOT call autoReveal)
```

### Target Sidebar Visibility Flow (after fix)
```
Settings page
  -> local state tracks toggles (not persisted until Save)
  -> dirty detection: compare local state vs persisted state
  -> Save button appears when dirty
  -> On Save: single PATCH /api/user/preferences { hiddenNavItems: [...] }
  -> Toast "Settings saved"
  -> Update hook state to match persisted state

Sidebar component
  -> useNavVisibility() hook (autoReveal REMOVED)
  -> isVisible(href) filters nav items
  -> No useEffect on pathname for auto-reveal

Mobile Sidebar
  -> Same hook, unchanged behavior
```

### Current Revenue Flow
```
getCRMDashboardData() in src/app/(dashboard)/page.tsx
  -> prisma.project.aggregate({ where: { status: 'COMPLETED' }, _sum: { revenue: true } })
  -> Only sums `revenue` field
  -> Only includes COMPLETED projects
  -> potentialRevenue ignored entirely
  -> ACTIVE projects ignored entirely
```

### Target Revenue Flow
```
getCRMDashboardData()
  -> prisma.project.findMany({
       where: { status: { in: ['ACTIVE', 'COMPLETED'] } },
       select: { revenue: true, potentialRevenue: true }
     })
  -> Per-project: revenue ?? potentialRevenue ?? 0
  -> Sum across all qualifying projects
  -> No double-counting (coalesce, not sum both)
  -> Profit = totalRevenue - totalCosts
```

### Anti-Patterns to Avoid
- **Fire-and-forget PATCH per toggle:** Current pattern causes race conditions. Replace with batch save.
- **`startsWith` matching for auto-reveal:** This was the root cause of the bug. Sub-paths like `/projects/123` match `/projects` and re-show hidden nav items.
- **Aggregate-level coalesce:** Prisma does not support SQL COALESCE in `_sum`. Must fetch individual project rows and compute in JS.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Toast notifications | Custom notification system | `toast()` from sonner (already installed) | Already integrated in `app/layout.tsx` with `<Toaster>` |
| Dirty detection | Complex deep-equal library | Simple array comparison (sort + JSON.stringify) | Hidden items is a simple string array |
| Revenue coalesce | Raw SQL | JS-level `??` after Prisma findMany | Prisma aggregate does not support COALESCE; findMany + JS is idiomatic |

## Common Pitfalls

### Pitfall 1: Shared Hook Instance Between Settings and Sidebar
**What goes wrong:** Both `settings/page.tsx` and `sidebar.tsx` call `useNavVisibility()`. If settings page modifies the hook's state and saves, the sidebar needs to reflect changes immediately.
**Why it happens:** Each component gets its own hook instance. The hook fetches from API on mount but doesn't have a shared state mechanism.
**How to avoid:** After save in settings, call the preferences API to persist, then update the hook's local state. The sidebar will re-render because the hook's state changed. Since both are client components on the same page, they share the same React tree and both call the hook independently -- BUT they each fetch on mount independently. The settings page should expose a way to update the persisted state that the sidebar can pick up on next render/navigation.
**Warning signs:** Sidebar does not update after saving settings without a page reload.
**Recommendation:** Refactor the hook to support: (1) removing autoReveal, (2) exposing `setHiddenItems` for batch save, or (3) having the settings page use its own local state separate from the hook, then after PATCH success, update the hook's state directly. The simplest approach: add a `saveHiddenItems(items: string[])` function to the hook that PATCHes and updates local state atomically.

### Pitfall 2: Revenue Query Cannot Use Prisma Aggregate for Coalesce
**What goes wrong:** Trying to sum `revenue ?? potentialRevenue` at the database level with Prisma aggregate.
**Why it happens:** Prisma `_sum` works on individual columns, not expressions. There is no COALESCE support in Prisma aggregate.
**How to avoid:** Use `findMany` to get both fields per project, then compute in JS: `projects.reduce((sum, p) => sum + (Number(p.revenue) || Number(p.potentialRevenue) || 0), 0)`.
**Warning signs:** Getting separate sums of revenue and potentialRevenue (double-counting projects that have both).

### Pitfall 3: Settings Page Currently Has No Save Button
**What goes wrong:** Each toggle immediately fires a PATCH, which is the existing behavior users expect. Adding a Save button changes the UX contract.
**Why it happens:** The current hook's `toggleItem` function PATCHes on every toggle.
**How to avoid:** Settings page should maintain its own local copy of `hiddenItems`. Toggles modify local state only. Save button does the PATCH. Need to clearly separate "local editing state" from "persisted state".
**Implementation note:** The settings page currently destructures `{ isVisible, toggleItem }` from the hook. After refactoring, it should work with local state and only sync to the hook on save.

### Pitfall 4: Task CRUD on Completed Projects May Already Work
**What goes wrong:** Assuming there is a bug to fix when there may not be one.
**Why it happens:** The requirement says "User can create tasks on projects with COMPLETED status" implying it is currently broken.
**How to verify:** The task API routes (`POST /api/projects/[id]/tasks` and `PATCH /api/projects/[id]/tasks/[taskId]`) only check `requireEditor()` for role-based auth. They do NOT check project status. The `TaskTree`, `TaskForm`, and `TaskDetailSheet` components do not receive or check project status. The `ProjectDetailSheet` passes `project.id` to `TaskTree` but does not pass status or any read-only flag.
**Conclusion:** Task CRUD on completed projects is NOT blocked by code. Either (a) it already works and this requirement is about verification, or (b) the blocking happens somewhere not found. Recommend testing manually before writing fix code.

### Pitfall 5: Mobile Sidebar Does Not Call autoReveal
**What goes wrong:** Forgetting that mobile sidebar has different behavior.
**Why it happens:** Desktop sidebar has `useEffect(() => { autoReveal(pathname) }, [pathname])` but mobile sidebar does NOT. Mobile sidebar already behaves correctly.
**How to avoid:** When removing autoReveal from desktop sidebar, just remove the useEffect. Mobile sidebar needs no changes.

## Code Examples

### Current autoReveal Bug (to be removed)
```typescript
// src/components/layout/sidebar.tsx (lines 18-23)
const { isVisible, autoReveal } = useNavVisibility()

// This useEffect is the BUG - remove it entirely
useEffect(() => {
  autoReveal(pathname)
}, [pathname, autoReveal])
```

### Current toggleItem (fire-and-forget, to be replaced)
```typescript
// src/lib/hooks/use-nav-visibility.ts (lines 48-67)
const toggleItem = useCallback(
  (href: string) => {
    if (isAlwaysVisible(href)) return
    setHiddenItems((prev) => {
      const isHidden = prev.includes(href)
      const next = isHidden ? prev.filter((h) => h !== href) : [...prev, href]
      // Fire-and-forget PATCH - RACE CONDITION
      fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hiddenNavItems: next }),
      }).catch(console.error)
      return next
    })
  },
  []
)
```

### Current Revenue Query (to be fixed)
```typescript
// src/app/(dashboard)/page.tsx (lines 182-186)
const revenueResult = await prisma.project.aggregate({
  where: { status: 'COMPLETED' },
  _sum: { revenue: true }
})
const totalRevenue = Number(revenueResult._sum.revenue) || 0
```

### Target Revenue Query Pattern
```typescript
// Fetch both fields for ACTIVE + COMPLETED projects
const projects = await prisma.project.findMany({
  where: { status: { in: ['ACTIVE', 'COMPLETED'] } },
  select: { revenue: true, potentialRevenue: true },
})

// Per-project coalesce: prefer actual, fall back to potential
const totalRevenue = projects.reduce((sum, p) => {
  const projectRevenue = Number(p.revenue) || Number(p.potentialRevenue) || 0
  return sum + projectRevenue
}, 0)
```

### Toast Usage (existing pattern)
```typescript
// src/components/projects/project-detail-sheet.tsx (line 43, 894)
import { toast } from 'sonner'
toast.success('Project archived')
toast.error('Failed to update archive status')
```

### Settings Page Save Button Pattern
```typescript
// Pattern for dirty detection
const isDirty = JSON.stringify([...localHiddenItems].sort()) !==
                JSON.stringify([...persistedHiddenItems].sort())

// Save handler
const handleSave = async () => {
  const response = await fetch('/api/user/preferences', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hiddenNavItems: localHiddenItems }),
  })
  if (response.ok) {
    toast.success('Settings saved')
    // Update persisted state to match local
  }
}
```

## Files That Need Changes

### SIDE (Sidebar Bug Fixes)

| File | Change | Requirements |
|------|--------|-------------|
| `src/lib/hooks/use-nav-visibility.ts` | Remove `autoReveal` function entirely. Remove `lastRevealedRef`. Add `saveHiddenItems()` for batch persist. Optionally remove fire-and-forget from `toggleItem` (settings page will handle saving). | SIDE-01, SIDE-02, SIDE-04 |
| `src/components/layout/sidebar.tsx` | Remove `autoReveal` import and `useEffect` that calls it (lines 18-23). Only import `isVisible` from hook. | SIDE-01 |
| `src/app/(dashboard)/settings/page.tsx` | Add local state for editing hidden items. Add dirty detection. Add Save button (conditionally shown). Add toast import and call on save. Stop using `toggleItem` directly (use local state). | SIDE-02, SIDE-03, SIDE-04, SIDE-05 |

**Files that do NOT need changes for SIDE:**
- `src/components/layout/mobile-sidebar.tsx` - Does not call autoReveal, already correct
- `src/components/layout/nav-group.tsx` - Pure rendering, no visibility logic
- `src/lib/nav-config.ts` - Static config, no changes needed
- `src/app/api/user/preferences/route.ts` - API already supports batch `hiddenNavItems` PATCH

### REV (Revenue Accuracy)

| File | Change | Requirements |
|------|--------|-------------|
| `src/app/(dashboard)/page.tsx` | In `getCRMDashboardData()`: Replace aggregate query (lines 182-186) with `findMany` for ACTIVE + COMPLETED projects. Compute per-project `revenue ?? potentialRevenue`. Update `totalRevenue` and `profit` calculations. | REV-01, REV-02, REV-03, REV-04 |

**Files that do NOT need changes for REV:**
- `src/components/dashboard/crm-kpi-cards.tsx` - Pure display component, receives props
- `src/components/dashboard/dashboard-client.tsx` - Just passes crmData through
- `src/lib/cost-utils.ts` - Utility functions, unchanged

### TASK (Task on Completed Projects)

| File | Change | Requirements |
|------|--------|-------------|
| **LIKELY NO CODE CHANGES** | Task APIs and UI components have NO status-based guards. Testing should confirm task CRUD works on completed projects. | TASK-01, TASK-02, TASK-03 |

**Investigation findings:**
- `POST /api/projects/[id]/tasks` (route.ts): Only checks `requireEditor()`, verifies project exists. Does NOT check project status.
- `PATCH /api/projects/[id]/tasks/[taskId]` (route.ts): Only checks `requireEditor()`, verifies task exists. Does NOT check project status.
- `TaskTree` component: Receives `projectId` and `tasks`, no status prop.
- `TaskForm` component: Posts to API with projectId, no status check.
- `TaskDetailSheet`: Creates subtasks and edits tasks, no status check.
- `TaskTreeNode`: Edit/delete/add subtask actions, no status guard.
- `ProjectDetailSheet`: Renders `<TaskTree>` without any status-based disabled prop.
- `tasks-page-client.tsx`: "Add Task" dialog lets user select any project from `allProjects` (which includes ALL projects, no status filter).
- `permissions.ts`: `canEdit()` only checks user role (ADMIN or EDITOR), not project status.

**Conclusion:** There is no code blocking task CRUD on completed projects. This requirement group may need only manual verification, or the issue may be in a part of the codebase not yet examined (e.g., a middleware or UI element not found). Recommend manual testing first.

## State of the Art

| Current Approach | Issue | Fix |
|-----------------|-------|-----|
| Per-toggle fire-and-forget PATCH | Race conditions, no undo | Batch save with Save button |
| autoReveal on pathname change | Re-shows hidden items on sub-path navigation | Remove autoReveal entirely |
| `aggregate _sum revenue` for COMPLETED only | Misses potentialRevenue and ACTIVE projects | `findMany` with JS coalesce |
| No status-based task guard | N/A (not actually blocked) | Verify with testing |

## Open Questions

1. **Is task CRUD on completed projects actually broken?**
   - What we know: No status-based guard exists in API routes, UI components, or permissions
   - What's unclear: The requirement implies it is broken. Possibly the issue is that the tasks PAGE only shows projects with existing tasks in its filter dropdown, or some other subtle UX issue
   - Recommendation: Manual testing before writing any code. If it works, document as "verified, no code change needed"

2. **Should the hook still support individual toggleItem with persist?**
   - What we know: Settings page will use batch save. But other consumers might want immediate toggle.
   - What's unclear: Are there other consumers of toggleItem besides settings page?
   - Recommendation: Keep toggleItem for local state changes (no PATCH), add separate saveHiddenItems for persist. Settings page uses both.

3. **Total costs in profit calculation scope**
   - What we know: Current code uses `prisma.cost.aggregate({ _sum: { amount: true } })` which sums ALL costs across ALL projects
   - What's unclear: Should costs also be filtered to ACTIVE + COMPLETED projects only?
   - Recommendation: For consistency, filter costs to the same project set. But this is a separate concern from the requirements which only mention revenue. Follow requirements literally: just fix revenue, profit follows.

## Sources

### Primary (HIGH confidence)
All findings from direct codebase inspection of the files listed above.

| File | What Was Checked |
|------|------------------|
| `src/lib/hooks/use-nav-visibility.ts` | Full hook: autoReveal, toggleItem, isVisible, fire-and-forget PATCH |
| `src/components/layout/sidebar.tsx` | autoReveal useEffect, isVisible usage |
| `src/components/layout/mobile-sidebar.tsx` | Confirmed NO autoReveal call |
| `src/app/(dashboard)/settings/page.tsx` | Full settings page: toggle UI, no save button |
| `src/app/(dashboard)/page.tsx` | Full dashboard: getCRMDashboardData revenue query |
| `src/components/dashboard/crm-kpi-cards.tsx` | Props interface, display only |
| `src/app/api/user/preferences/route.ts` | PATCH handler: supports hiddenNavItems batch |
| `src/app/api/projects/[id]/tasks/route.ts` | POST handler: no status check |
| `src/app/api/projects/[id]/tasks/[taskId]/route.ts` | PATCH/DELETE handlers: no status check |
| `src/components/projects/task-tree.tsx` | No status prop or guard |
| `src/components/projects/task-form.tsx` | No status check |
| `src/components/projects/task-detail-sheet.tsx` | No status check |
| `src/components/projects/task-tree-node.tsx` | No status guard on add/edit/delete |
| `src/components/projects/project-detail-sheet.tsx` | TaskTree rendered without status context |
| `src/components/tasks/tasks-page-client.tsx` | All projects available for task creation |
| `src/lib/permissions.ts` | canEdit checks role only, not status |
| `src/lib/task-utils.ts` | Utility functions, no status logic |
| `src/lib/nav-config.ts` | ALWAYS_VISIBLE_HREFS, isAlwaysVisible |
| `src/lib/cost-utils.ts` | calculateProfit, calculateTotalCosts |
| `prisma/schema.prisma` | Project model: revenue, potentialRevenue, status fields |
| `src/app/layout.tsx` | Confirmed `<Toaster>` from sonner is mounted |

## Metadata

**Confidence breakdown:**
- Sidebar fixes: HIGH - Read every relevant file, traced full data flow
- Revenue fix: HIGH - Read the exact query and understand the Prisma limitation
- Task on completed: HIGH - Exhaustively searched all task-related files for status guards, found none
- Toast integration: HIGH - Confirmed sonner is already set up and used elsewhere

**Research date:** 2026-01-28
**Valid until:** 2026-03-28 (stable codebase, no external dependency changes)
