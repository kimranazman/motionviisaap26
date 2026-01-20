---
phase: 03-kanban-quick-actions
plan: 01
subsystem: kanban-board
tags: [dropdown-menu, radix-ui, optimistic-update, quick-actions]

dependency-graph:
  requires:
    - 01-01: Kanban board with KanbanCard component
  provides:
    - Functional status change submenu on Kanban cards
    - Functional reassign submenu on Kanban cards
    - Optimistic updates with API persistence
  affects: []

tech-stack:
  added: []
  patterns:
    - DropdownMenuSub for nested dropdown menus
    - DropdownMenuRadioGroup for single-select options
    - Optimistic update pattern (update UI immediately, persist async)

file-tracking:
  key-files:
    created: []
    modified:
      - src/components/kanban/kanban-card.tsx
      - src/components/kanban/kanban-board.tsx

decisions:
  - decision: Use DropdownMenuRadioGroup for single-select options
    rationale: Provides visual indicator of current selection, enforces single choice

metrics:
  duration: 3min
  completed: 2026-01-20
---

# Phase 03 Plan 01: Kanban Quick Actions Summary

**One-liner:** Functional dropdown submenus for status change and reassign with optimistic updates on Kanban cards.

## What Was Built

### Task 1: KanbanCard Dropdown Submenus
- Added imports for DropdownMenuSub, DropdownMenuRadioGroup, DropdownMenuRadioItem
- Added STATUS_OPTIONS, TEAM_MEMBER_OPTIONS, getStatusColor from utils
- Extended KanbanCardProps with onStatusChange and onReassign callbacks
- Replaced static "Change Status" menu item with functional submenu showing all 6 statuses as colored badges
- Replaced static "Reassign" menu item with functional submenu showing "Unassigned" + all team members
- Added stopPropagation on all interactive elements to prevent drag conflicts

### Task 2: KanbanBoard Handlers
- Added handleStatusChange: optimistic state update + PATCH to /api/initiatives/[id]
- Added handleReassign: optimistic state update + PATCH to /api/initiatives/[id]
- Passed handlers to KanbanCard in main board view SortableContext
- Passed handlers to KanbanCard in DragOverlay for consistency

## Commits

| Commit | Message | Files |
|--------|---------|-------|
| cc04948 | feat(03-01): add dropdown submenus for status change and reassign | kanban-card.tsx |
| f9b62ec | feat(03-01): add status change and reassign handlers to KanbanBoard | kanban-board.tsx |

## Verification Results

- TypeScript compilation: PASS
- Build: PASS
- Manual verification: Required (see below)

### Manual Verification Steps
1. Navigate to /kanban
2. Hover over any card to reveal menu button
3. Click menu button, hover "Change Status" - submenu appears with 6 status options
4. Select different status - card moves to appropriate column immediately
5. Click menu again, hover "Reassign" - submenu appears with team members + Unassigned
6. Select different person - card avatar updates immediately
7. Verify changes persist after page refresh

## Deviations from Plan

None - plan executed exactly as written.

## Success Criteria Status

| Criteria | Status |
|----------|--------|
| KANB-01: User changes status via dropdown submenu, card moves to correct column | Ready for manual verification |
| KANB-02: User reassigns via dropdown submenu, card shows new owner | Ready for manual verification |
| No drag conflicts when using menus (stopPropagation working) | Ready for manual verification |
| Changes persist to database (API PATCH calls succeed) | Ready for manual verification |

## Technical Notes

### Optimistic Update Pattern
Both handlers follow the same pattern:
1. Update local state immediately (card moves/updates instantly)
2. Make async API call to persist
3. Log errors but don't roll back (acceptable for MVP)

### stopPropagation Usage
Added to all interactive elements (SubTrigger, RadioItem) to prevent the drag handler from interfering with menu interactions. This is critical for dnd-kit integration.

## Next Steps

Phase 3 complete. All planned features implemented:
- Navigation with sidebar (Phase 1)
- Header search and notifications (Phase 2)
- Kanban quick actions (Phase 3)
