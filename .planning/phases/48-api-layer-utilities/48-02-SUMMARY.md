---
phase: 48-api-layer-utilities
plan: 02
subsystem: api
tags: [prisma, initiative, api-routes, export, xlsx, next.js]

# Dependency graph
requires:
  - phase: 46-schema-migration
    provides: "v2.0 Initiative schema with keyResultId FK, budget, resources; removed KPI fields"
  - phase: 47-seed-script-rewrite
    provides: "Seeded Initiative/KeyResult data for testing"
provides:
  - "Initiative CRUD routes updated for v2.0 schema (no KPI fields, keyResultId FK)"
  - "Initiative search routes updated (title/remarks only)"
  - "Initiative XLSX export updated with budget/resources/accountable columns"
affects:
  - "49-okr-hierarchy-ui (will consume initiative API responses with keyResult relation)"
  - "50-support-tasks-ui (may reference initiative patterns)"
  - "52-cleanup-polish (may adjust export columns)"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "keyResultId FK pattern: body.keyResultId || null (string cuid, not parseInt)"
    - "Relation include pattern: keyResult: { select: { id, krId, description } }"

key-files:
  created: []
  modified:
    - "src/app/api/initiatives/route.ts"
    - "src/app/api/initiatives/[id]/route.ts"
    - "src/app/api/initiatives/search/route.ts"
    - "src/app/api/initiatives/export/route.ts"
    - "src/lib/initiative-export-utils.ts"

key-decisions:
  - "keyResultId is String (cuid), not Int -- plan said parseInt but schema uses String FK"
  - "Export columns reduced from 20 to 17: removed 7 KPI/text columns, added 3 new (budget, resources, accountable)"

patterns-established:
  - "v2.0 FK pattern: use keyResultId string directly, include keyResult relation for display"

# Metrics
duration: 3min
completed: 2026-01-27
---

# Phase 48 Plan 02: Initiative Routes Update Summary

**Initiative CRUD/search/export routes updated for v2.0 schema: keyResultId FK replaces keyResult string, KPI fields removed, budget/resources/accountable added to export**

## Performance

- **Duration:** 3 min
- **Started:** 2026-01-27T04:27:27Z
- **Completed:** 2026-01-27T04:30:40Z
- **Tasks:** 2/2
- **Files modified:** 5

## Accomplishments
- Initiative list/create routes use keyResultId FK and include keyResult relation in response
- Initiative detail/update/patch routes cleaned of all KPI fields and removed field references
- Initiative search only searches title and remarks (monthlyObjective/weeklyTasks removed)
- Initiative XLSX export updated: 17 columns with budget/resources/accountable, no KPI columns
- Export utility no longer imports from initiative-kpi-utils.ts

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix initiative list, create, detail, update, and search routes** - `54df195` (feat)
2. **Task 2: Fix initiative export route and export utilities** - `7c4c489` (feat)

## Files Created/Modified
- `src/app/api/initiatives/route.ts` - GET search updated (title/remarks only), POST uses keyResultId FK, includes keyResult relation
- `src/app/api/initiatives/[id]/route.ts` - GET removes kpiTarget/kpiActual serialization, includes keyResult relation; PUT uses keyResultId FK with budget/resources; PATCH removes KPI field handling
- `src/app/api/initiatives/search/route.ts` - OR conditions reduced to title and remarks only
- `src/app/api/initiatives/export/route.ts` - orderBy uses keyResultId, select uses keyResult relation, adds budget/resources/accountable
- `src/lib/initiative-export-utils.ts` - Removed calculateKpi import, updated interface/columns/row mapper for v2.0

## Decisions Made
- **keyResultId is String, not Int:** Plan specified `parseInt(body.keyResultId)` but the Prisma schema defines `keyResultId String?` (cuid FK). Used string directly instead of parsing as integer.
- **Export columns 20 to 17:** Removed kpiLabel, kpiTarget, kpiActual, % Achievement, monthlyObjective, weeklyTasks (6 removed) plus keyResult string column replaced with relation-based krId. Added budget, resources, accountable (3 added).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] keyResultId is String, not Int**
- **Found during:** Task 1 (initiative create/update routes)
- **Issue:** Plan specified `parseInt(body.keyResultId)` but Prisma schema defines keyResultId as `String?` (cuid). Using parseInt would produce NaN or incorrect values.
- **Fix:** Used `body.keyResultId || null` (string) instead of `parseInt(body.keyResultId)`
- **Files modified:** src/app/api/initiatives/route.ts, src/app/api/initiatives/[id]/route.ts
- **Verification:** TypeScript compiles without errors, keyResultId correctly typed as string
- **Committed in:** 54df195 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug prevention)
**Impact on plan:** Essential correction -- parseInt on a cuid string would produce NaN. No scope creep.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All initiative API routes compile and work with v2.0 schema
- keyResult relation included in list/detail responses for UI consumption
- Export produces valid XLSX with updated columns
- Ready for remaining 48-XX plans (other route updates) and Phase 49 (OKR UI)

---
*Phase: 48-api-layer-utilities*
*Completed: 2026-01-27*
