---
phase: 43-bug-fixes
plan: 01
subsystem: ui-components
tags: [radix-select, gantt-chart, bug-fix, css]

dependency-graph:
  requires: []
  provides:
    - "Price Comparison page loads without crash"
    - "Timeline Gantt chart bars render correctly"
    - "Timeline empty state says 'No initiatives scheduled'"
    - "Task form/detail sheet assignee select uses sentinel values"
  affects:
    - "Any future Select components must use sentinel values (never empty string)"

tech-stack:
  added: []
  patterns:
    - "Sentinel value 'all' for filter-reset Select options"
    - "Sentinel value '__unassigned__' for null-assignment Select options"
    - "min-h-[2.5rem] for absolute-positioned bar containers"

key-files:
  created: []
  modified:
    - src/components/supplier-items/supplier-items-table.tsx
    - src/components/timeline/gantt-chart.tsx
    - src/components/projects/task-form.tsx
    - src/components/projects/task-detail-sheet.tsx

decisions:
  - id: "43-01-d1"
    decision: "Use 'all' sentinel for filter SelectItems"
    rationale: "Matches existing pattern in 7+ other Select components in codebase"
  - id: "43-01-d2"
    decision: "Use '__unassigned__' sentinel for assignee SelectItems"
    rationale: "Matches pattern already used in initiative-detail.tsx"
  - id: "43-01-d3"
    decision: "Replace py-2 with min-h-[2.5rem] for Gantt bar container"
    rationale: "Gives 40px height for 24px absolutely-positioned bar to render correctly"

metrics:
  duration: "~6 minutes"
  completed: "2026-01-26"
---

# Phase 43 Plan 01: Bug Fixes Summary

**Fixed Radix Select empty value crashes and Gantt chart rendering issues across 4 components.**

## What Was Done

### Task 1: Fix Radix Select empty value crashes (BUG-01 + latent bugs)
**Commit:** `bcb2b10`

Fixed `<SelectItem value="">` crash in three files. `@radix-ui/react-select` v2.x throws a runtime error when value is an empty string because it is reserved for clearing the select to placeholder state.

**supplier-items-table.tsx (BUG-01):**
- Changed `value={categoryFilter ?? ''}` to `value={categoryFilter ?? 'all'}`
- Changed `value={supplierFilter ?? ''}` to `value={supplierFilter ?? 'all'}`
- Changed both `<SelectItem value="">` to `<SelectItem value="all">`
- Updated both `onValueChange` handlers to compare against `'all'` instead of `''`

**task-form.tsx (latent bug):**
- Changed `<SelectItem value="">Unassigned</SelectItem>` to `<SelectItem value="__unassigned__">`
- Changed `value={assignee}` to `value={assignee || '__unassigned__'}`
- Changed `onValueChange={setAssignee}` to `onValueChange={(v) => setAssignee(v === '__unassigned__' ? '' : v)}`

**task-detail-sheet.tsx (latent bug):**
- Same pattern as task-form.tsx for the assignee Select

### Task 2: Fix Timeline Gantt bar rendering and empty state (BUG-02 + BUG-03)
**Commit:** `4c9627d`

**BUG-02 -- Gantt bars not rendering:**
- Changed bar container class from `py-2` to `min-h-[2.5rem]` to give the absolutely-positioned bar (`h-6` = 24px, centered with `top-1/2 -translate-y-1/2`) enough vertical space to render

**BUG-03 -- Empty state message:**
- Updated empty state from "No initiatives found" to "No initiatives scheduled"
- Added filter context hint "Try adjusting your filters" shown only when department filter is active

## Decisions Made

| ID | Decision | Rationale |
|----|----------|-----------|
| 43-01-d1 | Use `"all"` sentinel for filter SelectItems | Matches existing pattern in 7+ other Select components in codebase |
| 43-01-d2 | Use `"__unassigned__"` sentinel for assignee SelectItems | Matches pattern already used in initiative-detail.tsx |
| 43-01-d3 | Replace `py-2` with `min-h-[2.5rem]` for Gantt bar container | Gives 40px height for 24px absolutely-positioned bar to render |

## Deviations from Plan

None -- plan executed exactly as written.

## Verification Results

- TypeScript compilation: PASS (zero errors)
- Build: PASS (clean build, no warnings)
- No `<SelectItem value="">` patterns remain in any component file
- `min-h-[2.5rem]` confirmed on Gantt bar container (line 205)
- "No initiatives scheduled" confirmed in empty state (line 252)
- Filter hint conditionally renders when `filterDepartment !== 'all'`

## Next Phase Readiness

All bugs in this plan are resolved. The remaining plans in Phase 43 (if any) can proceed. No blockers or concerns identified.
