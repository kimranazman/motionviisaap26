# Phase 77 Research: Tasks Project Grouping

## Objective

Add project-grouped view option to tasks kanban, allowing users to toggle between "group by status" (current default) and "group by project" modes.

## Current Implementation Analysis

### Tasks Page (`src/app/(dashboard)/tasks/page.tsx`)

- Server component that fetches all tasks with `parentId: null` (top-level tasks only)
- Already includes project relation for each task
- Already has two data fetches:
  - `getProjects()` - projects with tasks (for filtering)
  - `getAllProjects()` - all projects (for create dialog)
- Data shape includes `projectId` and `project: { id, title }` for each task

### Tasks Page Client (`src/components/tasks/tasks-page-client.tsx`)

- Manages view mode state with localStorage persistence (table vs kanban)
- Has comprehensive filtering system (search, assignee, project, status, priority, due date)
- View toggle already exists as `Tabs` component with Table/Kanban options
- **Key insight:** We need to add a SECOND toggle for grouping mode (by status vs by project)

### Task Kanban View (`src/components/tasks/task-kanban-view.tsx`)

- Uses @dnd-kit for drag-and-drop (proven pattern used across 5+ boards)
- Renders 3 status columns: TODO, IN_PROGRESS, DONE
- Each column has color dot indicator
- Drag-and-drop updates status via PATCH to `/api/projects/{projectId}/tasks/{taskId}`
- Mobile responsive with snap scroll

### Task Kanban Components

- `TaskKanbanColumn` - Droppable column with header (title, color dot, count)
- `TaskKanbanCard` - Draggable card with title, project badge, due date, priority, assignee

## Architecture Decision

### Option A: Toggle within TaskKanbanView
Modify TaskKanbanView to accept a `groupBy` prop and conditionally render status columns OR project sections.

**Pros:** Single component, less file creation
**Cons:** Complex conditionals, harder to maintain

### Option B: Separate ProjectGroupedKanbanView (Recommended)
Create a new component `TaskKanbanProjectView` that renders project sections with embedded status columns.

**Pros:** Clean separation, reuses existing column/card components
**Cons:** Some code duplication

**Decision:** Option B - Separate view component with shared DndContext pattern.

## Implementation Plan

### New Components Needed

1. **`ProjectTasksSection`** (`src/components/tasks/project-tasks-section.tsx`)
   - Collapsible section header with project title and task count
   - Contains 3 mini status columns (TODO, IN_PROGRESS, DONE) as horizontal flex
   - Uses Radix Collapsible (already in codebase)
   - Reuses `TaskKanbanCard` for task cards

2. **`TaskKanbanProjectView`** (`src/components/tasks/task-kanban-project-view.tsx`)
   - Single DndContext wrapping all project sections
   - Groups tasks by projectId, sorts projects alphabetically
   - Handles "No Project" section for orphan tasks
   - Filters out projects with zero tasks

### UI/UX Patterns

**Grouping Toggle Location:**
- Add a small toggle/segmented control NEXT to the view toggle (Table/Kanban)
- Only visible when Kanban view is selected
- Options: "By Status" (default) | "By Project"

**Visual Pattern:**
- Project section header: Collapsible with ChevronRight, project title, task count
- Each section contains horizontal scrollable status columns (narrower than full-width)
- Consistent with objective-group.tsx collapsible pattern

**"No Project" Handling:**
- Tasks without projectId grouped into "No Project" section
- Shown at bottom of list
- Same visual treatment as project sections

### Drag-and-Drop Complexity

**Challenge:** DndContext needs to handle cross-section drops.

**Solution:**
- Use unique IDs for droppable columns: `${projectId}:${status}` (e.g., `project-123:TODO`)
- Parse target column ID on drop to extract projectId and status
- Only status changes allowed (no cross-project drag) - keeps it simple

**Alternative considered:** Allow dragging tasks between projects. Rejected - scope creep, different feature.

### Data Flow

```
TasksPageClient
  ├─ groupMode: 'status' | 'project' (new state)
  ├─ filteredTasks (existing)
  │
  └─ Kanban Views
       ├─ TaskKanbanView (groupMode='status') - existing, unchanged
       └─ TaskKanbanProjectView (groupMode='project') - new
            └─ ProjectTasksSection[] (one per project with tasks)
                 └─ TaskKanbanCard[] (reused)
```

### Collapse State Management

- Store collapsed project IDs in Set
- Default: all expanded (or localStorage persistence if desired)
- Simple `expandedProjects` state in TaskKanbanProjectView

## Files to Modify

1. `src/components/tasks/tasks-page-client.tsx`
   - Add `groupMode` state ('status' | 'project')
   - Add grouping toggle UI (only visible in kanban mode)
   - Conditionally render TaskKanbanView or TaskKanbanProjectView

2. `src/components/tasks/task-kanban-view.tsx`
   - No changes needed (stays as status-grouped view)

## Files to Create

1. `src/components/tasks/project-tasks-section.tsx`
   - Collapsible project section with mini status columns
   - Props: project, tasks, expanded, onToggle, onTaskClick, onTaskStatusChange

2. `src/components/tasks/task-kanban-project-view.tsx`
   - DndContext for project-grouped view
   - Groups tasks by project, renders ProjectTasksSection for each
   - Handles "No Project" section

## Key Technical Details

### Column ID Scheme for Project View

```typescript
// For project-grouped view, column IDs include project context
const columnId = projectId ? `${projectId}:${status}` : `no-project:${status}`

// Parse on drop
const [targetProjectId, targetStatus] = overId.split(':')
```

### API Endpoint

Status updates use existing endpoint:
```
PATCH /api/projects/{projectId}/tasks/{taskId}
Body: { status: 'TODO' | 'IN_PROGRESS' | 'DONE' }
```

For "No Project" tasks (if they exist - likely edge case), we'd need the task to have a projectId. Current schema requires projectId, so orphan tasks shouldn't exist in practice.

**Update after checking schema:** Tasks have required `projectId` field. "No Project" section is defensive code for potential data issues, not a real use case.

## Success Criteria Mapping

| Requirement | Implementation |
|-------------|----------------|
| TASK-01: Toggle grouping mode | Segmented control next to view toggle |
| TASK-02: Project sections with status columns | ProjectTasksSection component |
| TASK-03: Collapsible sections | Radix Collapsible + ChevronRight |
| TASK-04: Drag-and-drop within sections | DndContext with composite column IDs |

## Risk Assessment

**Low Risk:**
- Reuses proven @dnd-kit patterns
- Collapsible pattern already exists in codebase
- No database changes required
- No new API endpoints needed

**Medium Risk:**
- Collision detection with multiple nested droppables
  - Mitigation: Use composite IDs and test thoroughly

**Testing Focus:**
- Drag between columns within same project section
- Collapse/expand during drag
- Mobile touch interactions
- Filter + group by project combination
