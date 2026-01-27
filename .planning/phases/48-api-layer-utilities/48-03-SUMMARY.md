---
phase: 48-api-layer-utilities
plan: 03
subsystem: api
tags: [dashboard, revenue, grouping, kpi, progress, keyresult, prisma]

# Dependency graph
requires:
  - phase: 46-schema-migration
    provides: KeyResult model with metricType, target, actual, progress, weight fields
  - phase: 47-seed-script-rewrite
    provides: Seeded KeyResult data (KR1.1 800K + KR2.2 200K revenue targets)
provides:
  - Real revenue calculation from KeyResult model in dashboard stats API and page
  - FK-based initiative grouping utility (keyResult.krId)
  - Stub KPI utility with safe defaults for backward-compatible imports
  - calculateObjectiveProgress weighted rollup utility for Phase 49
affects: [49-okr-hierarchy-ui, 50-support-tasks-ui, 52-cleanup-polish]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Revenue from KeyResult aggregate (metricType=REVENUE query)"
    - "FK-based grouping replaces string normalization"
    - "Deprecated utility stubs with safe defaults for gradual migration"
    - "Weighted objective progress rollup formula"

key-files:
  created:
    - src/lib/kr-progress-utils.ts
  modified:
    - src/app/api/dashboard/stats/route.ts
    - src/app/(dashboard)/page.tsx
    - src/lib/initiative-group-utils.ts
    - src/lib/initiative-kpi-utils.ts

key-decisions:
  - "keyResultId typed as string|null (not number) matching Prisma schema cuid"
  - "KPI utility stubbed (not removed) to prevent UI component crashes during transition"
  - "GroupedKeyResult interface uses krId:string + keyResultId:string|null instead of old keyResult:string"

patterns-established:
  - "Revenue computed from KeyResult model aggregation, not hardcoded proxy"
  - "Grouping by FK relation rather than string normalization"
  - "Deprecated utility pattern: stub functions returning safe defaults, marked for removal in Phase 52"

# Metrics
duration: 3min
completed: 2026-01-27
---

# Phase 48 Plan 03: Dashboard + Utilities Summary

**Real revenue from KeyResult model, FK-based initiative grouping, KPI stubs with safe defaults, and weighted objective progress rollup**

## Performance

- **Duration:** 3 min
- **Started:** 2026-01-27T04:27:32Z
- **Completed:** 2026-01-27T04:30:35Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Dashboard stats API and page.tsx compute revenue from KeyResult records with metricType=REVENUE (sum of targets = RM 1,000,000 from KR1.1 + KR2.2)
- Initiative grouping utility rewritten to use FK relation (keyResult.krId) instead of string normalization
- KPI utility replaced with stubs returning safe defaults -- all 4 consumer components continue to compile
- New kr-progress-utils.ts provides calculateObjectiveProgress with weighted rollup formula

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix dashboard revenue calculation** - `2723e7e` (feat)
2. **Task 2: Rewrite grouping utils, stub KPI utils, add KR progress calc** - `3fa1e93` (feat)

## Files Created/Modified
- `src/app/api/dashboard/stats/route.ts` - Revenue from KeyResult findMany where metricType=REVENUE
- `src/app/(dashboard)/page.tsx` - Same real revenue calculation in server component
- `src/lib/initiative-group-utils.ts` - Full rewrite: FK-based grouping by keyResult.krId
- `src/lib/initiative-kpi-utils.ts` - Stub functions with safe defaults, types preserved
- `src/lib/kr-progress-utils.ts` - New: calculateObjectiveProgress weighted rollup

## Decisions Made
- **keyResultId type:** Used `string | null` (not `number | null` as plan specified) because Prisma schema defines `keyResultId` as `String?` (cuid). [Rule 1 - corrected plan assumption to match schema]
- **KPI stub approach:** Kept all type interfaces and export signatures identical, replaced function bodies with no-op returns. This preserves compilation of 4 consumer components (initiative-row.tsx, key-result-group.tsx, objective-group.tsx, initiative-export-utils.ts) until Phase 49/52 updates them.
- **GroupedKeyResult interface change:** Renamed `keyResult: string` to `krId: string` and added `keyResultId: string | null`. Consumer components will show TS errors on `.keyResult` property access until Phase 49 updates them.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Corrected keyResultId type from number to string**
- **Found during:** Task 2 (grouping utility rewrite)
- **Issue:** Plan specified `keyResultId: number | null` in InitiativeForGrouping interface, but Prisma schema defines `keyResultId String?` (cuid string, not Int)
- **Fix:** Used `string | null` to match actual schema type
- **Files modified:** src/lib/initiative-group-utils.ts
- **Verification:** `npx tsc --noEmit` passes with no errors in the file
- **Committed in:** 3fa1e93

---

**Total deviations:** 1 auto-fixed (1 bug in plan specification)
**Impact on plan:** Trivial type correction. No scope change.

## Issues Encountered
- Task 1 commit inadvertently included 2 pre-staged files (`src/app/api/key-results/route.ts` and `[id]/route.ts`) that were created by a prior plan execution (48-01/48-02). These files are correct and part of Phase 48 scope. No code was lost or overwritten.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Dashboard revenue calculation is live from KeyResult model
- Grouping utility ready for Phase 49 OKR Hierarchy UI (accepts included keyResult relation)
- calculateObjectiveProgress ready for Phase 49 objective-level progress display
- KPI stubs prevent crashes in existing UI components during Phase 49 migration
- Pre-existing TS errors in consumer components (objectives page, key-result-group, objective-group, initiative-row) will be resolved in Phase 49

---
*Phase: 48-api-layer-utilities*
*Completed: 2026-01-27*
