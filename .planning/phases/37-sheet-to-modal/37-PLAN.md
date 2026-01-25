# Phase 37: Convert Detail Sheets to Modals

## Problem Statement

1. **Documents not showing** in project detail panel after recent changes
2. **Resizable sheet handle too subtle** - users can't find the 1px drag handle
3. **Sheet UX suboptimal** for detailed content - modals provide better focus

## Goals

1. Debug and fix documents not displaying in project detail
2. Convert detail sheets to centered Dialog/Modal components
3. Make modals properly sized and optionally resizable

## Files to Modify

### Primary (Project Detail)
- `src/components/projects/project-detail-sheet.tsx` → rename to `project-detail-modal.tsx`
- `src/app/(dashboard)/projects/page.tsx` - update import

### Secondary (Other Detail Sheets)
- `src/components/pipeline/deal-detail-sheet.tsx`
- `src/components/kanban/initiative-detail-sheet.tsx`
- `src/components/potential-projects/potential-detail-sheet.tsx`
- `src/components/projects/task-detail-sheet.tsx`

### UI Component
- `src/components/ui/sheet.tsx` - revert resizable changes (optional)
- Consider creating `src/components/ui/resizable-dialog.tsx`

## Implementation Tasks

### Task 1: Debug Documents Issue
1. Check if documents fetch is being called
2. Verify DocumentsSection component renders
3. Check for any JS errors in console
4. May be unrelated to sheet changes

### Task 2: Create Resizable Dialog Component
```tsx
// src/components/ui/resizable-dialog.tsx
- Based on @radix-ui/react-dialog
- Centered modal with max-width
- Optional resize handles on edges
- localStorage persistence for size
- Scrollable content area
```

### Task 3: Convert Project Detail Sheet to Modal
1. Replace Sheet with Dialog
2. Adjust layout for centered modal
3. Keep all existing functionality (costs, deliverables, tasks, documents)
4. Test all features work

### Task 4: Convert Other Detail Sheets (if time permits)
- Deal detail
- Initiative detail
- Potential project detail

## UI Design

```
┌─────────────────────────────────────────┐
│  [Badge] Project Title              [X] │
├─────────────────────────────────────────┤
│                                         │
│  Title: [_______________]               │
│  Status: [Dropdown]                     │
│  Company: [Select]                      │
│  ...                                    │
│                                         │
│  ─────────────────────────              │
│  Financials Summary                     │
│  [Cards...]                             │
│                                         │
│  ─────────────────────────              │
│  Deliverables (2)          [+ Add]     │
│  [List...]                              │
│                                         │
│  ─────────────────────────              │
│  Documents (1)             [+ Upload]   │
│  [List...]                              │
│                                         │
├─────────────────────────────────────────┤
│  [Archive] [Delete]    [Save Changes]   │
└─────────────────────────────────────────┘
```

- Default width: 600-700px
- Max height: 90vh with scroll
- Backdrop click to close (with unsaved changes warning)

## Verification

1. Documents display correctly
2. All CRUD operations work (costs, deliverables, tasks)
3. Modal opens/closes smoothly
4. Form validation works
5. Mobile responsive

## Rollback

If modal approach doesn't work well:
- Keep sheets but improve resize handle visibility (make it 4px wide, always show grip icon)
