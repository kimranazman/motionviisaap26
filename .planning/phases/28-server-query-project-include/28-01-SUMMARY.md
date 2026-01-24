---
phase: 28-server-query-project-include
plan: 01
subsystem: api
tags: [prisma, server-components, decimal-serialization, next.js]

# Dependency graph
requires:
  - phase: 27-conversion-visibility-archive
    provides: project relation on Deal/PotentialProject models, conversion badge UI
provides:
  - Server-side project include for pipeline page
  - Server-side project include for potential-projects page
  - Conversion badges visible on initial page load
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Server-side Prisma includes must match API route includes for consistent data

key-files:
  created: []
  modified:
    - src/app/(dashboard)/pipeline/page.tsx
    - src/app/(dashboard)/potential-projects/page.tsx

key-decisions:
  - "Mirror API route include pattern in server-side page queries for data consistency"

patterns-established:
  - "Server-side page queries must include same relations as API routes for initial render parity"

# Metrics
duration: 3min
completed: 2026-01-24
---

# Phase 28 Plan 01: Server Query Project Include Summary

**Fixed server-side page queries to include project relation with Decimal serialization for initial-load conversion badges**

## Performance

- **Duration:** 3 min
- **Started:** 2026-01-24T11:00:00Z
- **Completed:** 2026-01-24T11:03:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Added project relation to pipeline/page.tsx server query with revenue/potentialRevenue serialization
- Added project relation to potential-projects/page.tsx server query with revenue/potentialRevenue serialization
- Closed CONV-01 audit gap: conversion badges now visible on initial page load without archive toggle

## Task Commits

Each task was committed atomically:

1. **Task 1: Add project include to pipeline/page.tsx** - `65f1dd1` (fix)
2. **Task 2: Add project include to potential-projects/page.tsx** - `2bdb3fd` (fix)

## Files Created/Modified
- `src/app/(dashboard)/pipeline/page.tsx` - Added project include to Prisma query and Decimal serialization for project fields
- `src/app/(dashboard)/potential-projects/page.tsx` - Added project include to Prisma query and Decimal serialization for project fields

## Decisions Made
- Mirrored the exact include pattern from API routes (src/app/api/deals/route.ts lines 26-50) for consistency
- Used same Decimal serialization pattern (Number() with null fallback) for project.revenue and project.potentialRevenue

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - straightforward gap closure following established API route patterns.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- v1.3.2 gap closure complete
- Conversion badges now display correctly on initial page load for both pipeline and potential-projects pages
- Ready for v1.3.2 milestone completion

---
*Phase: 28-server-query-project-include*
*Completed: 2026-01-24*
