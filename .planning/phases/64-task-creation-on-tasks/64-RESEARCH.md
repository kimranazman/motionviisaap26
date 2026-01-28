# Phase 64 Research: Task Creation on /tasks

## Current Architecture

### /tasks Page
- **Server component**: `src/app/(dashboard)/tasks/page.tsx` fetches all root tasks (parentId=null) with project relation and counts
- **Client component**: `src/components/tasks/tasks-page-client.tsx` provides table/kanban views, filtering, and task detail sheet
- **No Add Task button** exists on this page currently
- Projects filter only lists projects that already have tasks (`where: { tasks: { some: {} } }`)

### Task Model (Prisma)
- `Task` model at `prisma/schema.prisma:707`
- Fields: id, title, description, status (TODO/IN_PROGRESS/DONE), priority (LOW/MEDIUM/HIGH), dueDate, assignee (TeamMember enum), projectId (required), parentId (nullable), depth, sortOrder, comments, tags
- Self-referencing parent/children for subtask hierarchy (up to 5 levels)
- `projectId` is **required** - every task must belong to a project

### Task Creation API
- **POST** `/api/projects/[id]/tasks` - Creates task within a project context
- Supports `parentId` for subtasks with depth validation (max 5 levels)
- Inherits parent tags automatically
- Auto-calculates `sortOrder` for siblings

### Existing Task Form
- `src/components/projects/task-form.tsx` - Inline form for creating/editing tasks
- Takes `projectId` as a required prop (project already known)
- Fields: title (required), description, status, priority, dueDate, assignee
- No project selector (assumes project context)

### Task Detail Sheet
- `src/components/projects/task-detail-sheet.tsx` - Detail view for editing existing tasks
- Uses `DetailView` component (dialog/drawer pattern)
- Shows: title, status, priority, dueDate, assignee, description, tags, comments
- Subtask creation happens in `task-tree-node.tsx` via inline `TaskForm` with `parentId`

### Pattern Reference: Department Creation (Phase 63)
- `src/components/departments/department-list.tsx` uses Dialog with form inside
- "Add Department" button in toolbar, opens Dialog
- Form fields include CompanySelect combobox (required)
- Creates via `POST /api/departments`
- Refreshes list after creation

### CompanySelect Pattern
- `src/components/pipeline/company-select.tsx` - Combobox with search
- Uses Command/Popover pattern for searchable dropdown
- Fetches companies from API on mount
- This pattern should be replicated for ProjectSelect

## What Needs Building

### TASK-01: Add Task button on /tasks page
1. Add "Add Task" button to the tasks page toolbar (next to view toggle)
2. Opens a Dialog with task creation form
3. Form includes all standard task fields + project selector
4. Calls `POST /api/projects/{selectedProjectId}/tasks` to create
5. Refreshes task list after creation

### TASK-02: Project selector in Add Task dialog
1. Build a `ProjectSelect` combobox (similar to CompanySelect)
2. Fetches all projects from `/api/projects` or a lightweight endpoint
3. Required field - can't create task without selecting project
4. The existing `getProjects()` in the page only fetches projects with tasks - need ALL projects for creation

### TASK-03: Subtask creation from task detail view
1. Already partially exists via `task-tree-node.tsx` (inline form with parentId)
2. Need to add "Add Subtask" capability from `task-detail-sheet.tsx`
3. When viewing a task in the detail sheet, user should be able to create a subtask
4. Subtask creation should use existing API with parentId set to current task ID

## Key Decisions

- **API endpoint**: No new API routes needed. Existing `POST /api/projects/[id]/tasks` works for both root tasks and subtasks
- **Project list**: The server-side `getProjects()` needs to fetch ALL projects (not just those with tasks) to allow assigning tasks to any project
- **Pattern**: Follow department-list.tsx dialog pattern for the Add Task dialog
- **ProjectSelect**: Build as reusable component similar to CompanySelect
- **Detail sheet subtask**: Add an "Add Subtask" section/button within TaskDetailSheet

## Files to Modify

1. `src/app/(dashboard)/tasks/page.tsx` - Pass all projects, not just those with tasks
2. `src/components/tasks/tasks-page-client.tsx` - Add the Add Task dialog
3. `src/components/projects/task-detail-sheet.tsx` - Add subtask creation
4. New: `src/components/tasks/project-select.tsx` - Reusable project selector combobox

## Risks

- The project list for the selector could be long - need searchable combobox (ProjectSelect)
- The tasks page `getProjects()` currently only gets projects with tasks; must also pass allProjects for the creation form
- Subtask creation in detail sheet needs access to projectId which is already available via props
