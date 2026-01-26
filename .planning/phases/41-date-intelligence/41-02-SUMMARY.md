---
phase: 41-date-intelligence
plan: 02
subsystem: objectives-ui
tags: [timeline-suggestions, detail-sheet, date-intelligence, actionable-guidance]
dependency-graph:
  requires:
    - phase: 41-01
      provides: analyzeDates, detectOwnerOverlap, generateTimelineSuggestions utilities
  provides:
    - TimelineSuggestions component rendering contextual date-issue guidance
    - Detail sheet integration showing suggestions for flagged initiatives
  affects: [42-export]
tech-stack:
  added: []
  patterns: [conditional-render-null-for-empty-suggestions, overlap-recomputation-in-detail-context]
key-files:
  created:
    - src/components/objectives/timeline-suggestions.tsx
  modified:
    - src/components/kanban/initiative-detail-sheet.tsx
    - src/components/objectives/objective-hierarchy.tsx
key-decisions:
  - "TimelineSuggestions placed between date fields and KPI section in detail sheet"
  - "allInitiatives passed from ObjectiveHierarchy root to detail sheet for overlap computation"
  - "Uses local status state so suggestions reflect unsaved status changes"
patterns-established:
  - "Conditional component rendering: return null when no data to show"
duration: 3min
completed: 2026-01-26
---

# Phase 41 Plan 02: Timeline Suggestions in Detail Sheet Summary

**Amber suggestion box in initiative detail sheet showing actionable timeline adjustments for overdue, late-start, long-duration, invalid-date, and high-overlap initiatives**

## Performance

- **Duration:** 3 min
- **Started:** 2026-01-26T07:19:37Z
- **Completed:** 2026-01-26T07:22:37Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Created TimelineSuggestions component with amber info box and Lightbulb icon
- Integrated suggestions into InitiativeDetailSheet between date fields and KPI section
- Passed allInitiatives from ObjectiveHierarchy for overlap computation in detail context

## Task Commits

Each task was committed atomically:

1. **Task 1: Create TimelineSuggestions component** - `610e6ca` (feat)
2. **Task 2: Integrate TimelineSuggestions into InitiativeDetailSheet** - `c051ec2` (feat)

## Files Created/Modified

- `src/components/objectives/timeline-suggestions.tsx` - Amber suggestion box rendering bullet-pointed recommendations based on date flags and overlap count
- `src/components/kanban/initiative-detail-sheet.tsx` - Added allInitiatives prop, renders TimelineSuggestions between grid and KPI section
- `src/components/objectives/objective-hierarchy.tsx` - Passes initialData as allInitiatives to detail sheet

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| TimelineSuggestions placed between date fields and KPI section | Contextual to timeline data, before business metrics |
| allInitiatives passed from ObjectiveHierarchy root | Single source of truth for initiative data, avoids separate fetch |
| Uses local `status` state variable for suggestions | Reflects unsaved status changes so user sees immediate feedback |

## Deviations from Plan

None -- plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All DATE-01 through DATE-08 requirements complete across Plan 01 + Plan 02
- Phase 41 fully complete, ready for Phase 42 (Export)

## Requirements Coverage

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| DATE-08: Timeline suggestions in detail sheet | Done | Amber box with context-specific suggestions for flagged initiatives |
| All DATE-01 through DATE-07 | Done (Plan 01) | Date badges, overlap detection, hierarchy integration |

---
*Phase: 41-date-intelligence*
*Completed: 2026-01-26*
