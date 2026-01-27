---
phase: 55
plan: 01
subsystem: cross-project-task-view
tags: [tasks, table-view, filtering, sorting, cross-project]
depends_on:
  requires: []
  provides: ["/tasks page", "cross-project task table view", "6-filter filter bar", "view preference persistence"]
  affects: ["55-02 (kanban view)"]
tech-stack:
  added: []
  patterns: ["server component data fetch with client filtering", "sortable table headers", "localStorage view preference"]
key-files:
  created:
    - src/app/(dashboard)/tasks/page.tsx
    - src/components/tasks/tasks-page-client.tsx
    - src/components/tasks/task-filter-bar.tsx
    - src/components/tasks/task-table-view.tsx
  modified: []
decisions:
  - id: D55-01
    decision: "Use server component Prisma fetch (no API route) for initial task data"
    reason: "Follows established pattern from kanban/page.tsx; avoids unnecessary API route"
  - id: D55-02
    decision: "Use router.refresh() for data refresh after detail sheet saves"
    reason: "No GET /api/tasks route exists; router.refresh() re-runs server component cleanly"
  - id: D55-03
    decision: "Pass parentId: null to TaskDetailSheet for cross-project tasks"
    reason: "TaskDetailSheet requires parentId prop; all cross-project tasks are root tasks"
metrics:
  duration: "3 min"
  completed: "2026-01-28"
---

# Phase 55 Plan 01: Cross-Project Task Table View Summary

**One-liner:** Server-rendered /tasks page with 6-filter client shell, sortable table columns, detail sheet integration, and Table/Kanban view switcher with localStorage persistence.

## What Was Built

### Server Page (`src/app/(dashboard)/tasks/page.tsx`)
- Server component with `force-dynamic` fetching all root tasks (`parentId: null`) with project context
- Parallel fetch of tasks and projects (only projects that have tasks)
- Date serialization for client component consumption
- Renders Header + TasksPageClient

### Client Shell (`src/components/tasks/tasks-page-client.tsx`)
- Manages all filter state: search, assignee, project, status, priority, due date range
- `useMemo` filtering chain applying all 6 filters
- `matchesDueDateFilter` helper handles: all, overdue, today, this-week, this-month, no-date
- View mode toggle (table/kanban) with localStorage persistence via `tasks-view-preference` key
- SSR-safe localStorage read in useEffect
- Detail sheet integration: click task row -> opens TaskDetailSheet with correct projectId
- `router.refresh()` on task update to re-fetch server data

### Filter Bar (`src/components/tasks/task-filter-bar.tsx`)
- Apple glass style: `bg-white/70 backdrop-blur-xl border border-gray-200/50 rounded-2xl`
- Search input with Search icon
- Assignee person pills (All, KH, AZ, IZ) with color dots (blue, green, purple)
- Project dropdown (dynamically populated from projects with tasks)
- Status dropdown (To Do, In Progress, Done)
- Priority dropdown (Low, Medium, High)
- Due Date dropdown with Calendar icon (All Dates, Overdue, Due Today, This Week, This Month, No Date)
- Clear filters X button (shown when any filter active)
- Mobile: horizontal scroll for filter bar

### Table View (`src/components/tasks/task-table-view.tsx`)
- 6 sortable columns: Title, Project, Status, Priority, Assignee, Due Date
- Click column header to sort ascending/descending with chevron indicators
- Sort handles null values correctly (nulls sort last for asc, first for desc)
- Status sort order: TODO -> IN_PROGRESS -> DONE
- Priority sort order: HIGH -> MEDIUM -> LOW
- Project badge (blue-50 bg) on each row
- Status badge with color coding per task-utils
- Priority badge with outline and color coding
- Overdue dates highlighted in red (`text-red-500 font-medium`) when task is not DONE
- Subtask count (ListTree icon) and comment count (MessageSquare icon) indicators
- Responsive: mobile shows only Title column with inline project/status badges
- Empty state: "No tasks found" centered

## Task Commits

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Server page, client shell, and filter bar | a90563f | page.tsx, tasks-page-client.tsx, task-filter-bar.tsx |
| 2 | Table view with sortable columns and detail sheet | f44b59d | task-table-view.tsx |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added parentId: null to TaskDetailSheet task prop**
- **Found during:** Task 1
- **Issue:** TaskDetailSheet's Task interface requires `parentId` field, which CrossProjectTask did not include
- **Fix:** Spread task with `{ ...selectedTask, parentId: null }` when passing to TaskDetailSheet
- **Files modified:** src/components/tasks/tasks-page-client.tsx
- **Commit:** a90563f

## Decisions Made

| ID | Decision | Reason |
|----|----------|--------|
| D55-01 | Server component Prisma fetch (no API route) | Follows kanban/page.tsx pattern |
| D55-02 | router.refresh() for data refresh | No GET /api/tasks route needed |
| D55-03 | Pass parentId: null to TaskDetailSheet | Type compatibility for root tasks |

## Verification Results

1. `npx tsc --noEmit` -- PASS (no errors)
2. /tasks page structure -- Server component fetches root tasks with project context
3. Sortable columns -- All 6 columns have sort toggle with null handling
4. Filter bar -- 6 filters: search, assignee pills, project/status/priority/due-date dropdowns
5. Combined filters -- useMemo chains all filters sequentially
6. Detail sheet -- TaskDetailSheet receives task with parentId + correct projectId
7. View switcher -- Table/Kanban tabs with localStorage persistence
8. Kanban placeholder -- "Coming soon" with KanbanSquare icon
9. Mobile -- Filter bar scrollable, table collapses to title + inline badges

## Next Phase Readiness

Plan 55-02 can build the kanban view by:
- Replacing the kanban placeholder in `tasks-page-client.tsx`
- Creating `task-kanban-view.tsx` with dnd-kit
- Reusing the same `CrossProjectTask` type and `filteredTasks` from the client shell
- Using existing PATCH `/api/projects/[id]/tasks/[taskId]` for status changes
