---
phase: 26-revenue-model-refinement
plan: 01
subsystem: database
tags: [prisma, mysql, schema, revenue, decimal]

# Dependency graph
requires:
  - phase: 25-ai-document-intelligence
    provides: AI invoice import that sets revenue field
provides:
  - potentialRevenue field on Project model for deal/potential estimates
  - Simplified revenue model (actual only from AI invoices)
affects: [26-02 conversion logic, 26-03 AI import updates, 26-04 UI updates]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Revenue separation: potentialRevenue (estimates) vs revenue (actuals)"

key-files:
  created: []
  modified:
    - prisma/schema.prisma

key-decisions:
  - "aiImportedRevenue field removed - revenue field is now exclusively for AI-imported actuals"
  - "potentialRevenue uses same Decimal(12,2) precision as revenue"
  - "Used @map(potential_revenue) for snake_case database column naming"

patterns-established:
  - "Potential vs Actual: Estimates from pipeline go to potentialRevenue, confirmed values from documents go to revenue"

# Metrics
duration: 2min
completed: 2026-01-24
---

# Phase 26 Plan 01: Schema Update Summary

**Added potentialRevenue field to Project model, removed aiImportedRevenue for clean separation of estimates vs actuals**

## Performance

- **Duration:** 2 min
- **Started:** 2026-01-24T02:46:07Z
- **Completed:** 2026-01-24T02:48:24Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments
- Added `potentialRevenue` Decimal field to Project model for deal/potential conversion estimates
- Removed `aiImportedRevenue` field (no longer needed - revenue is now exclusively for AI imports)
- Applied database schema migration via prisma db push
- Regenerated Prisma client with new types

## Task Commits

Each task was committed atomically:

1. **Task 1: Update Project model in schema** - `6054111` (feat)
2. **Task 2: Apply schema migration** - No commit (command-only task - ran prisma db push)

## Files Created/Modified
- `prisma/schema.prisma` - Added potentialRevenue field, removed aiImportedRevenue from Project model

## Decisions Made
- **aiImportedRevenue removed**: With the new model, `revenue` is exclusively for AI-imported invoice totals. The separate tracking field is unnecessary.
- **Field placement**: potentialRevenue placed after revenue for logical grouping
- **Database column naming**: Used `@map("potential_revenue")` for consistent snake_case in MySQL

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- Warning about 1 non-null aiImportedRevenue value being dropped during migration. This is expected behavior per plan notes about existing data possibly needing manual adjustment.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Schema updated and database synced
- Ready for Plan 02: Update conversion logic to set potentialRevenue
- Ready for Plan 03: Update AI import to only set revenue (remove aiImportedRevenue references)

---
*Phase: 26-revenue-model-refinement*
*Completed: 2026-01-24*
