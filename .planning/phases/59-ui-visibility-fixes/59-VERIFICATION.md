# Phase 59 Verification: UI Visibility Fixes

status: passed
date: 2026-01-28

## Phase Goal

Departments and tasks are discoverable and usable from their parent detail views

## must_have Verification

### 1. Company detail shows Departments section [PASS]

**Evidence:**
- `src/components/companies/company-detail-modal.tsx` line 391: renders `<DepartmentSection companyId={company.id} departments={company.departments} onDepartmentChange={handleDepartmentChange} />`
- `src/app/api/companies/[id]/route.ts` lines 27-34: GET includes departments with `_count` for contacts, deals, potentials
- `src/components/companies/department-section.tsx`: Lists departments with count badge, empty state with CTA

### 2. Department CRUD from company detail [PASS]

**Evidence:**
- **Add:** `DepartmentSection` renders `DepartmentForm` which POSTs to `/api/companies/[id]/departments`
- **Edit:** `DepartmentCard` uses `CompanyInlineField` for inline name editing, PATCHes to `/api/companies/[id]/departments/[deptId]`
- **Delete:** `DepartmentCard` has `AlertDialog` confirmation, DELETEs to `/api/companies/[id]/departments/[deptId]`
- API: `src/app/api/companies/[id]/departments/route.ts` (GET, POST), `src/app/api/companies/[id]/departments/[deptId]/route.ts` (GET, PATCH, DELETE)

### 3. Project detail shows Tasks section with subtask hierarchy [PASS]

**Evidence:**
- `src/components/projects/project-detail-sheet.tsx` line 1264: renders `<TaskTree projectId={project.id} tasks={tasks} onTasksChange={handleTasksChange} />`
- Tasks fetched on mount (lines 522-539) from `/api/projects/[id]/tasks`
- `src/components/projects/task-tree.tsx`: Uses `buildTaskTree()` from `@/lib/task-utils` for hierarchy
- `src/components/projects/task-tree-node.tsx`: Recursive rendering with `Collapsible` for expand/collapse, indentation per level

### 4. Task CRUD and status change from project detail [PASS]

**Evidence:**
- **Add:** `TaskTree` renders `TaskForm` for root tasks; `TaskTreeNode` renders `TaskForm` with `parentId` for subtasks
- **Edit:** `TaskTreeNode` edit button opens `TaskForm` in edit mode (PATCH)
- **Delete:** `TaskTreeNode` delete button with cascade confirmation via `AlertDialog`
- **Status change:** `TaskForm` includes status select (TODO/IN_PROGRESS/DONE)
- **Detail view:** Click task opens `TaskDetailSheet` for full editing
- API: `src/app/api/projects/[id]/tasks/route.ts` (GET, POST), `src/app/api/projects/[id]/tasks/[taskId]/route.ts` (GET, PATCH, DELETE)
- Subtask depth validation (max 5 levels) in API
- Tag inheritance for subtasks in API

## Score

**4/4 must_haves verified**

## Build Status

`next build` exits with code 0 -- no TypeScript or compilation errors.

## Gaps

None.

## Human Verification

None required -- all checks are code-level structural verification.
