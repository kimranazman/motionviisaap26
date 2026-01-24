---
phase: 27-conversion-visibility-archive
plan: 02
subsystem: ui
tags: [react, conversion, pipeline, potentials, variance, read-only]

# Dependency graph
requires:
  - phase: 27-01
    provides: Project relation in deals/potentials API, isArchived field
provides:
  - Conversion badges on WON deals and CONFIRMED potentials
  - View Project button in detail sheets
  - Variance display (estimated vs actual revenue)
  - Read-only mode for converted/lost items
affects: [27-03] # Archive toggle UI will need consistent archive behavior

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Conversion badge pattern: ArrowRight icon with linked project title"
    - "Read-only form pattern: isConverted/isLost flags disable all inputs"
    - "Variance display: estimated vs actual with color-coded difference"

key-files:
  created: []
  modified:
    - src/components/pipeline/pipeline-card.tsx
    - src/components/pipeline/deal-detail-sheet.tsx
    - src/components/potential-projects/potential-card.tsx
    - src/components/potential-projects/potential-detail-sheet.tsx

key-decisions:
  - "Conversion badge only shows when stage is WON/CONFIRMED AND project exists"
  - "Read-only mode applies to converted AND lost deals (no editing either)"
  - "Variance shows positive (green) or negative (amber) color coding"
  - "View button navigates via /projects?open={id} query param pattern"

patterns-established:
  - "Conversion visibility: badge on card + info section in detail sheet"
  - "Read-only form: isReadOnly flag controls all input disabled states"
  - "Project link: /projects?open={id} for deep-linking to project detail"

# Metrics
duration: 4min
completed: 2026-01-24
---

# Phase 27 Plan 02: Conversion Visibility UI Summary

**Conversion badges on pipeline/potential cards, View Project button with variance display, and read-only mode for converted/lost items**

## Performance

- **Duration:** 4 min
- **Started:** 2026-01-24T04:45:00Z
- **Completed:** 2026-01-24T04:49:00Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments
- Added green conversion badge with linked project title on WON deals and CONFIRMED potentials
- Implemented conversion info section in detail sheets with View Project button
- Added variance display showing estimated vs actual revenue with color coding
- Made form fields read-only for converted deals/potentials and lost deals

## Task Commits

Each task was committed atomically:

1. **Task 1: Add conversion badge to deal and potential cards** - `bca8611` (feat)
2. **Task 2: Add View Project, variance, and read-only to deal detail sheet** - `71f1d27` (feat)
3. **Task 3: Add View Project, variance, and read-only to potential detail sheet** - `206dd0a` (feat)

## Files Created/Modified
- `src/components/pipeline/pipeline-card.tsx` - Added conversion badge for WON deals with project
- `src/components/pipeline/deal-detail-sheet.tsx` - Added conversion info, variance, read-only mode
- `src/components/potential-projects/potential-card.tsx` - Added conversion badge for CONFIRMED potentials
- `src/components/potential-projects/potential-detail-sheet.tsx` - Added conversion info, variance, read-only mode

## Decisions Made
- Conversion badge only shows when both stage and project conditions are met (WON+project or CONFIRMED+project)
- Read-only mode applies to both converted items (WON/CONFIRMED with project) AND lost deals
- Variance display uses green for positive variance (actual > estimated), amber for negative
- View Project button uses /projects?open={id} URL pattern for consistent navigation

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Conversion visibility complete for pipeline and potentials
- Ready for 27-03 (Archive Toggle UI) to complete the phase
- All converted items clearly visible with link to project

---
*Phase: 27-conversion-visibility-archive*
*Completed: 2026-01-24*
