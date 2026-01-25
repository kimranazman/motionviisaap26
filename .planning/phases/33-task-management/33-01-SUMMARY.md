---
phase: 33-task-management
plan: 01
subsystem: projects
tags: [task-management, crud, api, components]

dependency-graph:
  requires: [32-project-deliverables]
  provides: [task-crud-api, task-ui-components]
  affects: [33-02-tags, 33-03-hierarchy, 33-04-progress]

tech-stack:
  added: []
  patterns: [deliverable-pattern-reuse, cascade-delete-in-app]

key-files:
  created:
    - src/app/api/projects/[id]/tasks/route.ts
    - src/app/api/projects/[id]/tasks/[taskId]/route.ts
    - src/components/projects/task-form.tsx
    - src/components/projects/task-card.tsx
  modified:
    - src/components/projects/project-detail-sheet.tsx

decisions:
  - id: task-cascade-delete
    choice: "App-level cascade delete with transaction"
    reason: "MySQL doesn't support ON DELETE CASCADE for self-referential foreign keys"
  - id: depth-validation
    choice: "Enforce 5-level max depth at create time"
    reason: "Prevent deep nesting that impacts performance and UX"

metrics:
  duration: 11m
  completed: 2026-01-25
---

# Phase 33 Plan 01: Task CRUD API and Basic UI Summary

**One-liner:** Task CRUD API with cascade delete and flat task list in project detail sheet.

## Completed Tasks

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Task API Routes | cd448bc | `src/app/api/projects/[id]/tasks/*.ts` |
| 2 | TaskForm and TaskCard Components | e4bb0aa | `task-form.tsx`, `task-card.tsx`, `project-detail-sheet.tsx` |

## What Was Built

### Task API Routes
- **GET /api/projects/[id]/tasks**: List all tasks for a project, ordered by depth, sortOrder, createdAt
- **POST /api/projects/[id]/tasks**: Create task with title, description, status, priority, dueDate, assignee
- **GET /api/projects/[id]/tasks/[taskId]**: Get single task with tags and counts
- **PATCH /api/projects/[id]/tasks/[taskId]**: Update task fields (except parentId)
- **DELETE /api/projects/[id]/tasks/[taskId]**: Delete task with cascade delete of descendants

### UI Components
- **TaskForm**: Create/edit form with all fields (title, description, status, priority, due date, assignee)
- **TaskCard**: Displays task with status/priority badges, assignee, due date, edit/delete actions
- **ProjectDetailSheet**: Tasks section added below Deliverables with empty state, list view, and CRUD operations

### Cascade Delete Implementation
Per RESEARCH.md pattern, implemented app-level cascade delete:
1. Collect all descendant task IDs recursively
2. Delete in transaction: TaskTag -> TaskComment -> Tasks (deepest first)

## Decisions Made

1. **Cascade Delete in App Code**: MySQL self-referential foreign keys don't support ON DELETE CASCADE, so we implement cascade delete in application code with transactions.

2. **Depth Validation on Create**: Enforce max 5-level nesting at task creation time (check parent.depth >= 4).

3. **Flat List Initially**: Tasks section shows flat list (root tasks only via `filter(t => !t.parentId)`), hierarchy display comes in Plan 33-03.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] MySQL mode: 'insensitive' not supported**
- **Found during:** Build verification
- **Issue:** Prisma `mode: 'insensitive'` doesn't work with MySQL
- **Fix:** Removed mode option, MySQL varchar collation handles case-insensitivity
- **Files modified:** `src/app/api/tags/route.ts`, `src/app/api/tags/[tagId]/route.ts`
- **Commit:** 58655a0

**2. [Rule 1 - Bug] Type mismatch for TagColor state**
- **Found during:** Build verification
- **Issue:** useState inferred narrow type from TAG_COLORS[0]
- **Fix:** Added explicit `TagColor` type annotation
- **Files modified:** `src/components/projects/task-tag-select.tsx`
- **Commit:** 58655a0

## Verification Results

- `npm run lint`: Passed (warnings only in existing files)
- `npm run build`: Passed type checking
- API endpoints: All CRUD operations functional
- UI: Tasks section visible, create/edit/delete working

## Next Phase Readiness

Ready for Plan 33-02 (Tags Management):
- Task API includes tag relations in responses
- TaskTag cascade delete implemented
- Tag inheritance on subtask creation ready (parentId support exists)

## Files Changed

```
Created:
  src/app/api/projects/[id]/tasks/route.ts (145 lines)
  src/app/api/projects/[id]/tasks/[taskId]/route.ts (175 lines)
  src/components/projects/task-form.tsx (180 lines)
  src/components/projects/task-card.tsx (130 lines)

Modified:
  src/components/projects/project-detail-sheet.tsx (+130 lines)
  src/app/api/tags/route.ts (bug fix)
  src/app/api/tags/[tagId]/route.ts (bug fix)
  src/components/projects/task-tag-select.tsx (type fix)
  src/lib/tag-utils.ts (extracted constants)
```
