---
phase: 26-revenue-model-refinement
plan: 02
subsystem: api
tags: [nextjs, api, prisma, revenue, conversion]

# Dependency graph
requires:
  - phase: 26-01
    provides: potentialRevenue field on Project model
provides:
  - Deal WON conversion sets potentialRevenue (not revenue)
  - Potential CONFIRMED conversion sets potentialRevenue (not revenue)
  - AI invoice import sets only revenue field
  - Project API includes potentialRevenue in response
  - Project API prevents manual revenue updates
affects: [26-03 UI updates, dashboard widgets, project financials]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Conversion routes set potentialRevenue, AI import sets revenue"
    - "Revenue field is read-only from API perspective"

key-files:
  created: []
  modified:
    - src/app/api/deals/reorder/route.ts
    - src/app/api/potential-projects/reorder/route.ts
    - src/lib/ai-auto-import.ts
    - src/app/api/ai/import/invoice/route.ts
    - src/app/api/projects/[id]/route.ts
    - src/components/projects/project-list.tsx
    - src/components/projects/project-card.tsx
    - src/components/projects/project-form-modal.tsx

key-decisions:
  - "Conversion routes set potentialRevenue instead of revenue on project creation"
  - "AI import routes only set revenue field (aiImportedRevenue references removed)"
  - "Project PATCH API no longer accepts revenue updates"
  - "Project GET API includes potentialRevenue in serialized response"

patterns-established:
  - "Revenue source of truth: AI invoice import only"
  - "Estimate source: deal/potential conversion to potentialRevenue"

# Metrics
duration: 3min
completed: 2026-01-24
---

# Phase 26 Plan 02: Conversion Logic Updates Summary

**Updated API routes to separate estimates (potentialRevenue) from actuals (revenue) - conversions set potentialRevenue, AI imports set revenue**

## Performance

- **Duration:** 3 min
- **Started:** 2026-01-24T03:00:00Z
- **Completed:** 2026-01-24T03:03:00Z
- **Tasks:** 3
- **Files modified:** 8

## Accomplishments
- Deal WON conversion now sets potentialRevenue instead of revenue
- Potential CONFIRMED conversion now sets potentialRevenue instead of revenue
- AI auto-import and manual import only set revenue field
- Project GET API includes potentialRevenue in serialized response
- Project PATCH API no longer accepts revenue field updates
- All aiImportedRevenue references removed from codebase

## Task Commits

Each task was committed atomically:

1. **Task 1: Update conversion routes to set potentialRevenue** - `e0b2591` (feat)
2. **Task 2: Simplify AI import routes - remove aiImportedRevenue** - `599f637` (feat)
3. **Task 3: Update projects API route** - `6171b92` (feat)
4. **Type fix: Add potentialRevenue to Project interfaces** - `c573394` (fix)

## Files Created/Modified
- `src/app/api/deals/reorder/route.ts` - Set potentialRevenue on WON conversion
- `src/app/api/potential-projects/reorder/route.ts` - Set potentialRevenue on CONFIRMED conversion
- `src/lib/ai-auto-import.ts` - Remove aiImportedRevenue, set only revenue
- `src/app/api/ai/import/invoice/route.ts` - Remove aiImportedRevenue, return potentialRevenue
- `src/app/api/projects/[id]/route.ts` - Add potentialRevenue to GET, remove revenue from PATCH
- `src/components/projects/project-list.tsx` - Add potentialRevenue to Project interface
- `src/components/projects/project-card.tsx` - Add potentialRevenue to Project interface
- `src/components/projects/project-form-modal.tsx` - Add potentialRevenue to Project interface

## Decisions Made
- **Conversion creates projects with null revenue**: Deal/Potential conversions set potentialRevenue only. Revenue is null until AI invoice import sets it.
- **Revenue is read-only via API**: Removed body.revenue from PATCH allowed fields to ensure revenue only comes from AI imports.
- **Response includes potentialRevenue**: Changed aiImportedRevenue references to potentialRevenue for API consumers.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Added potentialRevenue to Project interfaces**
- **Found during:** Task 3 (TypeScript verification)
- **Issue:** Project interfaces in UI components didn't have potentialRevenue field, causing TypeScript error
- **Fix:** Added potentialRevenue: number | null to Project interfaces in project-list.tsx, project-card.tsx, project-form-modal.tsx
- **Files modified:** src/components/projects/project-list.tsx, project-card.tsx, project-form-modal.tsx
- **Verification:** npx tsc --noEmit passes
- **Committed in:** c573394 (separate fix commit)

---

**Total deviations:** 1 auto-fixed (1 bug fix)
**Impact on plan:** Essential for TypeScript compilation. No scope creep.

## Issues Encountered

None - all tasks completed as planned with one type fix.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- API routes updated with new revenue model
- Ready for Plan 03: UI Updates to display both potentialRevenue and revenue
- project-detail-sheet.tsx already has potentialRevenue support (updated in 26-01)

---
*Phase: 26-revenue-model-refinement*
*Completed: 2026-01-24*
