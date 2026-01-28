# Phase 59 Research: UI Visibility Fixes

## Research Date: 2026-01-28

## Key Finding: All Features Already Implemented

Both departments-in-company-detail and tasks-in-project-detail are **fully implemented** with complete CRUD operations, API endpoints, and UI components.

### VIS-01 & VIS-02: Departments in Company Detail

**Status: ALREADY IMPLEMENTED**

- `CompanyDetailModal` (`src/components/companies/company-detail-modal.tsx`) renders `DepartmentSection` at line 391-395
- `DepartmentSection` (`src/components/companies/department-section.tsx`) provides:
  - List of departments with count badge
  - Add department button + inline form (`DepartmentForm`)
  - Empty state with "Add your first department" CTA
- `DepartmentCard` (`src/components/companies/department-card.tsx`) provides:
  - Inline edit of department name via `CompanyInlineField`
  - Delete with confirmation dialog
  - Stats showing contacts, deals, potentials counts
- `DepartmentForm` (`src/components/companies/department-form.tsx`) provides:
  - Name (required) + description fields
  - Submit to `POST /api/companies/[id]/departments`
- API routes:
  - `GET/POST /api/companies/[id]/departments/` - List/create departments
  - `PATCH/DELETE /api/companies/[id]/departments/[deptId]` - Update/delete department
- Company GET API (`src/app/api/companies/[id]/route.ts`) includes departments with `_count` for contacts, deals, potentials

### VIS-03, VIS-04 & VIS-05: Tasks in Project Detail

**Status: ALREADY IMPLEMENTED**

- `ProjectDetailSheet` (`src/components/projects/project-detail-sheet.tsx`) renders `TaskTree` at line 1264-1268
- Tasks are fetched on project open (lines 522-539) from `/api/projects/[id]/tasks`
- `TaskTree` (`src/components/projects/task-tree.tsx`) provides:
  - Tree structure with `buildTaskTree()` utility
  - Progress badge (completed/total)
  - Add task button + form
  - Empty state with CTA
- `TaskTreeNode` (`src/components/projects/task-tree-node.tsx`) provides:
  - Collapsible tree nodes with expand/collapse
  - Status and priority badges
  - Inline actions: add subtask, edit, delete (with cascade confirmation)
  - Click to open `TaskDetailSheet` for full detail view
  - Due date, assignee, comments count, tags display
- `TaskForm` (`src/components/projects/task-form.tsx`) provides:
  - Title, description, status, priority, due date, assignee fields
  - Create (POST) and update (PATCH) modes
  - Subtask creation with parentId
- `TaskDetailSheet` (`src/components/projects/task-detail-sheet.tsx`) - full detail view
- API routes:
  - `GET/POST /api/projects/[id]/tasks/` - List/create tasks
  - `GET/PATCH/DELETE /api/projects/[id]/tasks/[taskId]` - CRUD single task
  - Tags and comments sub-routes also exist

## Conclusion

All VIS-01 through VIS-05 requirements are implemented. The phase plan should focus on **verification only** - confirming the app builds without errors and all features function as expected. No code changes should be needed.

## RESEARCH COMPLETE
