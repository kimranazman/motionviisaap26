---
phase: 38-schema-utilities-foundation
plan: 01
subsystem: database, api
tags: [prisma, typescript, date-fns, kpi, initiative, utilities]

# Dependency graph
requires:
  - phase: none
    provides: "First plan of v1.5 -- no prior v1.5 phases"
provides:
  - "Initiative model with 5 KPI fields (kpiLabel, kpiTarget, kpiActual, kpiUnit, kpiManualOverride)"
  - "normalizeKeyResult and groupInitiativesByObjective functions"
  - "calculateKpi function with null/zero-safe handling"
  - "analyzeDates function returning DateIntelligence with 5 flag types"
affects: [39-objectives-page, 40-initiative-detail, 41-date-intelligence, 42-export]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Initiative utility files: initiative-{domain}-utils.ts naming convention"
    - "Per-utility TypeScript interfaces (no shared types directory)"
    - "KPI fields use @map('snake_case') convention for new Initiative columns"

key-files:
  created:
    - src/lib/initiative-group-utils.ts
    - src/lib/initiative-kpi-utils.ts
    - src/lib/initiative-date-utils.ts
  modified:
    - prisma/schema.prisma

key-decisions:
  - "kpiUnit uses VarChar(50) per REQUIREMENTS.md SCHEMA-01 (not VarChar(20) from architecture doc)"
  - "New KPI fields use @map('snake_case') convention (consistent with Project/Deal/Cost models)"
  - "Each utility file defines its own TypeScript interfaces (no shared types directory)"

patterns-established:
  - "initiative-{domain}-utils.ts: Domain-specific utility files for initiative intelligence"
  - "Pure function utilities: no React imports, no side effects, accept plain data return plain data"

# Metrics
duration: 6min
completed: 2026-01-26
---

# Phase 38 Plan 01: Schema & Utilities Foundation Summary

**5 nullable KPI fields added to Initiative model plus 3 pure-function utility modules (grouping, KPI calculation, date intelligence) for v1.5 Initiative Intelligence**

## Performance

- **Duration:** 6 min
- **Started:** 2026-01-26T02:18:43Z
- **Completed:** 2026-01-26T02:24:34Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Initiative model extended with kpiLabel, kpiTarget, kpiActual, kpiUnit, kpiManualOverride fields
- Grouping utility normalizes keyResult variations ("KR1.1", " kr1.1 ", "KR 1.1") to same value via trim+uppercase+remove-all-spaces
- KPI utility handles manual override mode and auto-calculation from linked projects with zero-division protection
- Date utility detects 5 intelligence flags: overdue, ending-soon, late-start, invalid-dates, long-duration

## Task Commits

Each task was committed atomically:

1. **Task 1: Add KPI fields to Initiative schema and push to database** - `d023175` (feat)
2. **Task 2: Create initiative utility modules (group, KPI, date)** - `e686ba0` (feat)

**Plan metadata:** (pending)

## Files Created/Modified
- `prisma/schema.prisma` - Added 5 KPI fields to Initiative model (kpiLabel, kpiTarget, kpiActual, kpiUnit, kpiManualOverride)
- `src/lib/initiative-group-utils.ts` - normalizeKeyResult and groupInitiativesByObjective functions with TypeScript interfaces
- `src/lib/initiative-kpi-utils.ts` - calculateKpi function with manual/auto modes and null/zero-safe division
- `src/lib/initiative-date-utils.ts` - analyzeDates function returning DateIntelligence with 5 flag types using date-fns

## Decisions Made
- Used VarChar(50) for kpiUnit per REQUIREMENTS.md SCHEMA-01 (authoritative over ARCHITECTURE.md VarChar(20))
- New KPI fields use @map("snake_case") column mapping consistent with Project/Deal/Cost models
- Each utility file defines its own TypeScript interfaces rather than using a shared types directory (follows existing codebase pattern)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Schema foundation complete: Initiative model has all KPI fields needed by phases 39-42
- Utility modules ready: grouping, KPI calculation, and date intelligence functions available for import
- All 28 existing initiatives unaffected (new fields are null/default)
- No blockers for Phase 39 (Objectives page)

---
*Phase: 38-schema-utilities-foundation*
*Completed: 2026-01-26*
