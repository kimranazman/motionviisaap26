# Phase 55: Cross-Project Task View - Research

**Researched:** 2026-01-27
**Domain:** Cross-project task aggregation with table/kanban views, filtering, sorting, drag-and-drop
**Confidence:** HIGH

## Summary

This phase creates a `/tasks` page that aggregates tasks from ALL projects into a single view with table and kanban display modes. The page needs a new API endpoint (`/api/tasks`) that fetches tasks across all projects with their project names, plus client-side filtering, sorting, and drag-and-drop status changes.

The codebase already has every building block needed:
- **Task model** with `TaskStatus` (TODO, IN_PROGRESS, DONE), `TaskPriority` (LOW, MEDIUM, HIGH), `TeamMember` assignee, subtasks, comments
- **dnd-kit** kanban pattern used 3 times (initiatives, pipeline, potential-projects) with identical DndContext/SortableContext/DragOverlay structure
- **Table pattern** from initiatives-list with shadcn/ui Table components, search + filter toolbar
- **DetailView/Sheet** system for opening task details (TaskDetailSheet already exists)
- **Filter bar pattern** from KanbanFilterBar (search, person pills, dropdown filters)
- **Nav config** already has `{ name: 'Tasks', href: '/tasks', icon: ListChecks }` in `topLevelItems`

**Primary recommendation:** Build the `/tasks` page by composing existing patterns. Create one new API route (`GET /api/tasks`), one new page, and several new components that closely mirror the kanban-board and initiatives-list patterns already in the codebase.

## Standard Stack

The project already has everything needed. No new dependencies required.

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@dnd-kit/core` | 6.3.1 | Drag-and-drop framework | Already used in 3 kanban boards |
| `@dnd-kit/sortable` | 10.0.0 | Sortable within columns | Already used with verticalListSortingStrategy |
| `@dnd-kit/utilities` | 3.2.2 | CSS.Transform utility | Already used for card transforms |
| `@prisma/client` | 6.19.2 | Database access | Only ORM in the project |
| `date-fns` | 4.1.0 | Date formatting/comparison | Already used for date operations |
| `lucide-react` | 0.562.0 | Icons | Project standard |
| `sonner` | 2.0.7 | Toast notifications | Already installed |

### Supporting (Already Installed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@radix-ui/react-tabs` | 1.1.13 | View switcher (Table/Kanban) | Toggle between views |
| `@radix-ui/react-select` | 2.2.6 | Filter dropdowns | Project, status, priority, assignee filters |
| `@radix-ui/react-popover` | 1.1.15 | Date picker popover | Due date range filter |
| shadcn/ui `Table` | local | Table view | Already in `src/components/ui/table.tsx` |
| shadcn/ui `Badge` | local | Status/priority/project badges | Already used extensively |

### No New Dependencies Needed
The project does NOT use TanStack Table or any table library. Tables are hand-built with shadcn/ui Table components and client-side filtering/sorting via `useMemo`. This is the established pattern -- use it.

**Installation:**
```bash
# Nothing to install -- all dependencies already present
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  app/
    (dashboard)/
      tasks/
        page.tsx                    # Server component: fetch tasks, render TasksPageClient
    api/
      tasks/
        route.ts                    # GET /api/tasks - cross-project task list
        [taskId]/
          route.ts                  # PATCH /api/tasks/[taskId] - update task status (simplified)
  components/
    tasks/                          # NEW directory for cross-project task components
      tasks-page-client.tsx         # Client component: state, filters, view switching
      task-table-view.tsx           # Table view with sortable columns
      task-kanban-view.tsx          # Kanban view with dnd-kit (3 columns)
      task-kanban-card.tsx          # Task card for kanban (shows project badge)
      task-kanban-column.tsx        # Kanban column (reuse pattern from kanban-column.tsx)
      task-filter-bar.tsx           # Filter bar: search, assignee, project, status, priority, due date
```

### Pattern 1: Server Component Page + Client Component Body
**What:** The page.tsx fetches initial data server-side and passes it to a client component.
**When to use:** All data-fetching pages in this project.
**Example:**
```typescript
// src/app/(dashboard)/tasks/page.tsx
// Source: Existing pattern from src/app/(dashboard)/kanban/page.tsx
export const dynamic = 'force-dynamic'

import prisma from '@/lib/prisma'
import { Header } from '@/components/layout/header'
import { TasksPageClient } from '@/components/tasks/tasks-page-client'

async function getAllTasks() {
  const tasks = await prisma.task.findMany({
    where: { parentId: null }, // Only root tasks for cross-project view
    include: {
      project: {
        select: { id: true, title: true }
      },
      _count: {
        select: { children: true, comments: true }
      },
    },
    orderBy: [
      { createdAt: 'desc' },
    ],
  })

  return tasks.map(t => ({
    ...t,
    dueDate: t.dueDate?.toISOString() || null,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  }))
}

async function getProjects() {
  // Only projects that have tasks
  const projects = await prisma.project.findMany({
    where: { tasks: { some: {} } },
    select: { id: true, title: true },
    orderBy: { title: 'asc' },
  })
  return projects
}
```

### Pattern 2: Client-Side Filtering with useMemo
**What:** All filtering and sorting happens client-side via `useMemo`, no server round-trips.
**When to use:** This is the established pattern (see initiatives-list.tsx, kanban-board.tsx).
**Example:**
```typescript
// Source: Existing pattern from src/components/initiatives/initiatives-list.tsx
const filteredTasks = useMemo(() => {
  return tasks.filter(task => {
    if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
    if (assigneeFilter && task.assignee !== assigneeFilter) return false
    if (projectFilter && task.project.id !== projectFilter) return false
    if (statusFilter && task.status !== statusFilter) return false
    if (priorityFilter && task.priority !== priorityFilter) return false
    // Due date range filter
    if (dueDateFilter && !matchesDueDateFilter(task, dueDateFilter)) return false
    return true
  })
}, [tasks, searchQuery, assigneeFilter, projectFilter, statusFilter, priorityFilter, dueDateFilter])
```

### Pattern 3: dnd-kit Kanban with Status Change
**What:** Three-column kanban (TODO, IN_PROGRESS, DONE) with drag to change status.
**When to use:** The kanban view. Simplified from the initiative kanban (4 columns, reorder API) because tasks just need status change (no position ordering in cross-project view).
**Example:**
```typescript
// Source: Existing pattern from src/components/kanban/kanban-board.tsx
const TASK_COLUMNS = [
  { id: 'TODO', title: 'To Do', colorDot: 'bg-gray-400' },
  { id: 'IN_PROGRESS', title: 'In Progress', colorDot: 'bg-blue-500' },
  { id: 'DONE', title: 'Done', colorDot: 'bg-green-500' },
]

// On drag end, update task status via PATCH
const handleDragEnd = async (event: DragEndEvent) => {
  // ... determine target column ...
  // Optimistic update
  setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t))
  // Persist - use project-scoped API since that's what exists
  await fetch(`/api/projects/${task.projectId}/tasks/${task.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: newStatus }),
  })
}
```

### Pattern 4: Sortable Table with Column Headers
**What:** Click column header to sort ascending/descending. Pure client-side.
**When to use:** Table view. The initiative list does NOT have sorting -- this is NEW functionality but straightforward.
**Example:**
```typescript
type SortField = 'title' | 'project' | 'status' | 'priority' | 'assignee' | 'dueDate'
type SortDirection = 'asc' | 'desc'

const [sortField, setSortField] = useState<SortField>('dueDate')
const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

const toggleSort = (field: SortField) => {
  if (sortField === field) {
    setSortDirection(d => d === 'asc' ? 'desc' : 'asc')
  } else {
    setSortField(field)
    setSortDirection('asc')
  }
}

const sortedTasks = useMemo(() => {
  return [...filteredTasks].sort((a, b) => {
    const dir = sortDirection === 'asc' ? 1 : -1
    switch (sortField) {
      case 'title': return dir * a.title.localeCompare(b.title)
      case 'project': return dir * a.project.title.localeCompare(b.project.title)
      case 'status': return dir * statusOrder[a.status] - statusOrder[b.status]
      // ... etc
    }
  })
}, [filteredTasks, sortField, sortDirection])
```

### Pattern 5: View Preference in localStorage
**What:** Save selected view (table/kanban) to localStorage, restore on mount.
**When to use:** View switcher persistence (TASK-15).
**Example:**
```typescript
// Source: Pattern from src/lib/hooks/use-nav-collapse-state.ts
const STORAGE_KEY = 'tasks-view-preference'

const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table')

// Load preference on mount (SSR-safe)
useEffect(() => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'table' || stored === 'kanban') {
      setViewMode(stored)
    }
  } catch { /* ignore */ }
}, [])

// Persist on change
const handleViewChange = (mode: 'table' | 'kanban') => {
  setViewMode(mode)
  try { localStorage.setItem(STORAGE_KEY, mode) } catch { /* ignore */ }
}
```

### Anti-Patterns to Avoid
- **Do NOT create a new cross-project task API for status updates.** The existing `PATCH /api/projects/[id]/tasks/[taskId]` works fine. Each task knows its `projectId`, so the client can construct the correct URL.
- **Do NOT use TanStack Table.** The project has never used it. Simple `useMemo` sorting/filtering with shadcn Table is the established pattern.
- **Do NOT fetch subtasks in the cross-project view.** Only root tasks (`parentId: null`) should appear. Subtasks are visible in the detail sheet.
- **Do NOT build server-side filtering.** This project consistently uses client-side filtering with initial data passed from server components.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Drag-and-drop kanban | Custom drag events | `@dnd-kit/core` + `@dnd-kit/sortable` | Already used identically in 3 places |
| Task status/priority badges | Custom styled spans | `getTaskStatusColor()`, `getTaskPriorityColor()` from `src/lib/task-utils.ts` | Consistent colors |
| Team member display | Custom formatting | `formatTeamMember()`, `TEAM_MEMBER_OPTIONS` from `src/lib/utils.ts` | Already standardized |
| Date formatting | Custom date logic | `formatDate()` from `src/lib/utils.ts` and `date-fns` | Already used everywhere |
| Detail sheet/dialog | Custom modal | `<DetailView>` from `src/components/ui/detail-view.tsx` | Supports dialog/drawer modes |
| Task detail content | New detail component | `<TaskDetailSheet>` from `src/components/projects/task-detail-sheet.tsx` | Already built with full task editing |
| Task comments | Custom comments | `<TaskComments>` from `src/components/projects/task-comments.tsx` | Already built |
| Filter bar styling | Custom design | Copy pattern from `KanbanFilterBar` in `src/components/kanban/kanban-filter-bar.tsx` | Apple-style glass UI |
| Table component | Custom table | shadcn `Table` from `src/components/ui/table.tsx` | Standard UI component |

**Key insight:** Nearly every UI element needed already exists somewhere in the codebase. The main work is composing existing patterns into a new page layout and creating the cross-project API query.

## Common Pitfalls

### Pitfall 1: Task Status Update API Path
**What goes wrong:** The task update API is project-scoped (`/api/projects/[id]/tasks/[taskId]`). In the cross-project view, you need the projectId for each task.
**Why it happens:** The API was designed for project-context usage.
**How to avoid:** Ensure the cross-project query includes `projectId` on each task object. When updating status (drag-and-drop or in detail sheet), construct the URL using `task.projectId`. Do NOT create a new `/api/tasks/[taskId]` route unless absolutely necessary.
**Warning signs:** 404 errors on status update because projectId is missing.

### Pitfall 2: Including Subtasks in Cross-Project View
**What goes wrong:** If you don't filter to `parentId: null`, subtasks appear as independent rows/cards alongside their parents, creating a confusing duplicate view.
**Why it happens:** Tasks with parentId are stored flat in the database.
**How to avoid:** Always filter `where: { parentId: null }` in the cross-project query. Subtasks are visible through the detail sheet's task info.
**Warning signs:** Task count is much higher than expected; nested tasks appear as top-level items.

### Pitfall 3: localStorage Hydration Mismatch (View Preference)
**What goes wrong:** SSR renders default view (table), but localStorage has saved "kanban", causing a flash of wrong content.
**Why it happens:** localStorage is not available during SSR.
**How to avoid:** Use the same SSR-safe pattern from `use-nav-collapse-state.ts`: initialize with default state, read localStorage in `useEffect`, update state. Accept the brief flash or suppress rendering until hydrated.
**Warning signs:** Hydration warning in console, content flicker on page load.

### Pitfall 4: Stale Data After Drag-and-Drop
**What goes wrong:** After dragging a task to change its status, the local state updates but the original server data is stale.
**Why it happens:** Optimistic update only changes local state; if the API call fails, there's no rollback.
**How to avoid:** Follow the existing pattern: optimistic update with error logging. The kanban-board.tsx and pipeline-board.tsx both do optimistic updates without rollback. Keep it consistent.
**Warning signs:** Task appears in new column but reverts on page refresh.

### Pitfall 5: Missing Project Context in Detail Sheet
**What goes wrong:** The existing `TaskDetailSheet` requires a `projectId` prop because it calls `/api/projects/${projectId}/tasks/${task.id}`. In cross-project view, the projectId must come from the task data.
**Why it happens:** TaskDetailSheet was built for single-project context.
**How to avoid:** Pass `task.projectId` (from the task's project relation) as the `projectId` prop to TaskDetailSheet. The component will work unchanged.
**Warning signs:** Wrong projectId passed, 404 errors in detail sheet.

### Pitfall 6: Sorting by Due Date with Null Values
**What goes wrong:** Tasks without due dates cause sorting errors or inconsistent ordering.
**Why it happens:** `null` comparisons in JavaScript are tricky.
**How to avoid:** Explicitly handle null due dates in sort comparisons. Push null dates to end for ascending sort, beginning for descending.
**Warning signs:** NaN comparisons, tasks randomly jumping in sort order.

## Code Examples

### Cross-Project Task Query (Server-Side)
```typescript
// Source: Pattern from src/app/(dashboard)/kanban/page.tsx
// For: src/app/(dashboard)/tasks/page.tsx

const tasks = await prisma.task.findMany({
  where: {
    parentId: null, // Root tasks only
  },
  include: {
    project: {
      select: {
        id: true,
        title: true,
      },
    },
    _count: {
      select: {
        children: true,
        comments: true,
      },
    },
  },
  orderBy: { createdAt: 'desc' },
})

// Serialize dates for client component
return tasks.map(t => ({
  id: t.id,
  title: t.title,
  description: t.description,
  status: t.status,
  priority: t.priority,
  dueDate: t.dueDate?.toISOString() || null,
  assignee: t.assignee,
  projectId: t.projectId,
  project: t.project,
  _count: t._count,
  createdAt: t.createdAt.toISOString(),
  updatedAt: t.updatedAt.toISOString(),
}))
```

### View Switcher with Tabs
```typescript
// Source: Pattern from src/components/kanban/kanban-board.tsx view toggle

<Tabs value={viewMode} onValueChange={handleViewChange}>
  <TabsList className="bg-white/70 backdrop-blur-xl border border-gray-200/50">
    <TabsTrigger value="table" className="gap-1.5 data-[state=active]:bg-white">
      <TableIcon className="h-4 w-4" />
      Table
    </TabsTrigger>
    <TabsTrigger value="kanban" className="gap-1.5 data-[state=active]:bg-white">
      <KanbanSquare className="h-4 w-4" />
      Kanban
    </TabsTrigger>
  </TabsList>
</Tabs>
```

### Sortable Table Header
```typescript
// NEW pattern for this phase (not in codebase yet)

function SortableHeader({ label, field, currentSort, currentDirection, onSort }: {
  label: string
  field: SortField
  currentSort: SortField
  currentDirection: SortDirection
  onSort: (field: SortField) => void
}) {
  const isActive = currentSort === field
  return (
    <TableHead
      className="cursor-pointer select-none hover:bg-gray-50"
      onClick={() => onSort(field)}
    >
      <div className="flex items-center gap-1">
        {label}
        {isActive && (
          currentDirection === 'asc'
            ? <ChevronUp className="h-4 w-4" />
            : <ChevronDown className="h-4 w-4" />
        )}
      </div>
    </TableHead>
  )
}
```

### Task Kanban Card with Project Badge
```typescript
// NEW component, combining patterns from:
// - src/components/kanban/kanban-card.tsx (drag handle, layout)
// - src/components/projects/task-card.tsx (task display)

<div className="p-4">
  <div className="flex items-start justify-between gap-2 mb-2">
    <span className="text-sm font-medium text-gray-900 line-clamp-2">
      {task.title}
    </span>
  </div>

  <div className="flex items-center gap-2 text-xs text-gray-500">
    {/* Project badge -- key differentiator from single-project task card */}
    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 bg-blue-50 text-blue-700">
      {task.project.title}
    </Badge>

    {task.dueDate && (
      <>
        <span className="text-gray-300">.</span>
        <span className={cn(isOverdue && 'text-red-500 font-medium')}>
          {format(new Date(task.dueDate), 'MMM d')}
        </span>
      </>
    )}
  </div>

  {/* Priority + Assignee */}
  <div className="flex items-center justify-between mt-2">
    <Badge variant="outline" className={cn('text-xs', getTaskPriorityColor(task.priority))}>
      {formatTaskPriority(task.priority)}
    </Badge>
    {task.assignee && (
      <Avatar className="h-6 w-6">
        <AvatarFallback className={cn('text-[10px] text-white', TEAM_COLORS[task.assignee])}>
          {TEAM_INITIALS[task.assignee]}
        </AvatarFallback>
      </Avatar>
    )}
  </div>
</div>
```

### Due Date Range Filter Logic
```typescript
// Source: Pattern from src/components/kanban/kanban-board.tsx matchesDateFilter

type DueDateFilter = 'all' | 'overdue' | 'today' | 'this-week' | 'this-month' | 'no-date'

function matchesDueDateFilter(task: { dueDate: string | null; status: string }, filter: DueDateFilter): boolean {
  if (filter === 'all') return true
  if (filter === 'no-date') return task.dueDate === null

  if (!task.dueDate) return false
  const dueDate = new Date(task.dueDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  switch (filter) {
    case 'overdue':
      return dueDate < today && task.status !== 'DONE'
    case 'today':
      return dueDate.toDateString() === today.toDateString()
    case 'this-week': {
      const weekEnd = new Date(today)
      weekEnd.setDate(weekEnd.getDate() + (7 - weekEnd.getDay()))
      return dueDate >= today && dueDate <= weekEnd
    }
    case 'this-month': {
      const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0)
      return dueDate >= today && dueDate <= monthEnd
    }
    default: return true
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Per-project task views only | Cross-project aggregation | Phase 55 (this phase) | New capability |
| No table view for tasks | Table + Kanban dual views | Phase 55 (this phase) | New capability |

**No deprecated patterns to worry about.** The project's patterns are internally consistent and current.

## Key Design Decisions

### 1. API Strategy: New API vs. Reuse Existing
**Decision: Create a lightweight GET-only `/api/tasks` route for fetching.** For mutations (status updates), reuse the existing project-scoped `PATCH /api/projects/[id]/tasks/[taskId]` endpoint. This avoids duplicating mutation logic while providing an efficient cross-project query.

**Alternative considered:** Creating a full CRUD `/api/tasks/[taskId]` route. Rejected because the existing project-scoped API works fine, and the cross-project view only needs to change status via drag-and-drop (which the existing PATCH handles).

### 2. Data Loading: Server-Side Initial Load
**Decision: Server component fetches all tasks, passes to client component.** This is the established pattern (kanban page, initiatives page). No pagination needed -- task counts are manageable (likely < 500 total).

### 3. Kanban Simplification
**Decision: No position/reorder tracking in cross-project kanban.** The initiative kanban has `position` fields and a `/reorder` API. For cross-project task kanban, dragging only changes status (TODO -> IN_PROGRESS -> DONE). No need for custom ordering within columns. Within a column, tasks are sorted by the same sort criteria as the table view.

### 4. Only Root Tasks in Cross-Project View
**Decision: Filter to `parentId: null`.** Subtasks appear when viewing a task's detail sheet, not as independent items in the cross-project list. This prevents overwhelming the view and avoids confusing duplicate entries.

## Open Questions

1. **Refresh strategy after status change**
   - What we know: The kanban-board and pipeline-board both use optimistic updates without full data refresh. The initiatives-list does a full fetch after updates.
   - What's unclear: Should the tasks page poll for updates or rely on optimistic state only?
   - Recommendation: Use optimistic updates for drag-and-drop (like kanban-board). For detail sheet saves, refresh the task list via API call (like initiatives-list). This matches existing patterns.

2. **Task count performance**
   - What we know: All other list views (initiatives, deals, potentials) load everything client-side.
   - What's unclear: How many total root tasks exist across all projects?
   - Recommendation: Start with the same "load all" pattern. If performance becomes an issue, add server-side pagination later. The project has never needed pagination so far.

## Sources

### Primary (HIGH confidence)
- **Prisma schema** (`prisma/schema.prisma`) - Task model definition, TaskStatus/TaskPriority/TeamMember enums
- **Existing kanban board** (`src/components/kanban/kanban-board.tsx`) - dnd-kit pattern with DndContext, SortableContext, DragOverlay, collision detection, sensors
- **Existing kanban card** (`src/components/kanban/kanban-card.tsx`) - useSortable, CSS.Transform, touch handling
- **Existing kanban column** (`src/components/kanban/kanban-column.tsx`) - useDroppable pattern
- **Existing filter bar** (`src/components/kanban/kanban-filter-bar.tsx`) - Search, person pills, dropdown filters
- **Existing initiatives list** (`src/components/initiatives/initiatives-list.tsx`) - Table view with shadcn Table, toolbar pattern
- **Existing task detail sheet** (`src/components/projects/task-detail-sheet.tsx`) - Full task editing with DetailView wrapper
- **Existing task utils** (`src/lib/task-utils.ts`) - formatTaskStatus, getTaskStatusColor, formatTaskPriority, getTaskPriorityColor, TASK_STATUS_OPTIONS, TASK_PRIORITY_OPTIONS
- **Existing utils** (`src/lib/utils.ts`) - formatTeamMember, formatDate, TEAM_MEMBER_OPTIONS, cn
- **Task API routes** (`src/app/api/projects/[id]/tasks/route.ts`, `[taskId]/route.ts`) - Existing CRUD endpoints
- **Nav config** (`src/lib/nav-config.ts`) - Tasks link already in `topLevelItems`
- **Package.json** - All dependencies already installed
- **Pipeline board** (`src/components/pipeline/pipeline-board.tsx`) - Additional dnd-kit reference pattern

### Secondary (MEDIUM confidence)
- **localStorage pattern** (`src/lib/hooks/use-nav-collapse-state.ts`) - SSR-safe localStorage read/write

### Tertiary (LOW confidence)
- None -- all findings are from direct codebase inspection

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already installed and used in codebase
- Architecture: HIGH - Every pattern directly mirrors existing code with minor adaptations
- Pitfalls: HIGH - Identified from actual codebase structure and API design
- Code examples: HIGH - Based on actual existing code patterns

**Research date:** 2026-01-27
**Valid until:** Indefinite (based on codebase inspection, not external documentation)
