---
phase: 08-role-based-ui
plan: 01
subsystem: authorization
tags: [permissions, kanban, rbac, dnd-kit]

dependency-graph:
  requires: [05-01, 06-01]
  provides: [permission-utilities, role-aware-kanban]
  affects: [08-02]

tech-stack:
  added: []
  patterns: [permission-utility-functions, conditional-drag, role-based-rendering]

file-tracking:
  created:
    - src/lib/permissions.ts
  modified:
    - src/components/kanban/kanban-card.tsx
    - src/components/kanban/kanban-board.tsx
    - src/components/admin/user-list.tsx

decisions:
  - name: Pure permission functions
    choice: No hooks, just pure functions
    rationale: Simpler, can be used anywhere, hooks call these functions

metrics:
  started: 2026-01-21T10:27:52Z
  completed: 2026-01-21T10:30:39Z
  duration: 3min
  tasks: 2/2
---

# Phase 8 Plan 1: Permission Utilities and Kanban Role Controls Summary

Permission utilities for client-side role checks plus role-aware Kanban drag-and-drop and quick actions.

## What Was Done

### Task 1: Create Permission Utilities
Created `src/lib/permissions.ts` with two utility functions:
- `canEdit(role)` - Returns true for ADMIN or EDITOR roles
- `isAdmin(role)` - Returns true only for ADMIN role

Both handle undefined roles safely (return false).

### Task 2: Add Role-Based Controls to Kanban Components

**kanban-board.tsx:**
- Added `useSession` hook to get current user session
- Added `canEdit` import from permissions utility
- Derive `userCanEdit` from session role
- Pass `canEdit={userCanEdit}` to all KanbanCard instances (board view and drag overlay)

**kanban-card.tsx:**
- Added `canEdit` prop (defaults to true for backward compatibility)
- Added `disabled: !canEdit` to useSortable hook (disables dnd-kit drag)
- Created `dragListeners` that only attach listeners when canEdit is true
- Updated cursor classes: `cursor-grab` only when canEdit, `cursor-default` when not
- Wrapped quick action menu in `{canEdit && (...)}` conditional

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Removed unused getRoleBadgeVariant function**
- **Found during:** Build verification
- **Issue:** Lint error - function defined but never used in user-list.tsx
- **Fix:** Removed the unused function
- **Files modified:** src/components/admin/user-list.tsx
- **Commit:** Included in Task 2 commit

## Commits

| Hash | Type | Description |
|------|------|-------------|
| c7e793a | feat | Create permission utilities (canEdit, isAdmin) |
| 3fd7766 | feat | Add role-based controls to Kanban components |

## Verification Results

- [x] Build passes: `npm run build` successful
- [x] `src/lib/permissions.ts` exports canEdit() and isAdmin()
- [x] KanbanCard accepts canEdit prop and disables drag when false
- [x] Quick action menu only renders when canEdit is true
- [x] Cursor shows default (not grab) for VIEWERs

## Key Files

| File | Purpose |
|------|---------|
| src/lib/permissions.ts | Client-side permission check utilities |
| src/components/kanban/kanban-card.tsx | Role-aware Kanban card with conditional drag |
| src/components/kanban/kanban-board.tsx | Passes canEdit prop from session |

## Technical Notes

1. **dnd-kit disabled prop:** The `useSortable({ disabled: true })` prevents drag initiation but the element is still rendered. Separately, we don't spread listeners to prevent any drag cursor appearance.

2. **Backward compatibility:** `canEdit` prop defaults to `true` so existing uses without the prop continue to work.

3. **Swimlane view unchanged:** The "By Person" swimlane view uses its own SwimlaneCard component which doesn't have drag-and-drop, so no changes needed there.

## Next Phase Readiness

Ready for Plan 02 (Detail Page role controls). Permission utilities are available for use across all components.
