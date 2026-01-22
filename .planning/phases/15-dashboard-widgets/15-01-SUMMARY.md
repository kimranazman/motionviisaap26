---
phase: 15-dashboard-widgets
plan: 01
subsystem: ui
tags: [dashboard, recharts, crm, pipeline, kpi, aggregation]

# Dependency graph
requires:
  - phase: 11-sales-pipeline
    provides: Deal model with stage and value fields
provides:
  - STAGE_PROBABILITY constant for weighted forecast calculation
  - STAGE_CHART_COLORS constant for pipeline chart colors
  - CRMKPICards component for sales KPI display
  - PipelineStageChart component for pipeline visualization
  - getCRMDashboardData function for CRM metrics
affects: [15-02 revenue widgets, dashboard enhancements]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Server-side aggregation with Prisma groupBy and aggregate"
    - "Weighted forecast using stage probability constants"
    - "Horizontal bar chart pattern for pipeline stages"

key-files:
  created:
    - src/components/dashboard/crm-kpi-cards.tsx
    - src/components/dashboard/pipeline-stage-chart.tsx
  modified:
    - src/lib/pipeline-utils.ts
    - src/app/(dashboard)/page.tsx

key-decisions:
  - "STAGE_PROBABILITY values: Lead 10%, Qualified 25%, Proposal 50%, Negotiation 75%"
  - "Open pipeline excludes Won/Lost stages from value calculation"
  - "Win rate calculated from closed deals only (Won + Lost)"

patterns-established:
  - "CRM KPI cards follow same pattern as initiative KPI cards"
  - "Pipeline chart uses horizontal bar layout with custom tooltip"

# Metrics
duration: 5min
completed: 2026-01-22
---

# Phase 15 Plan 01: Pipeline Widgets Summary

**CRM dashboard section with 4 KPI cards (Open Pipeline, Weighted Forecast, Win Rate, Total Deals) and horizontal bar chart showing pipeline by stage**

## Performance

- **Duration:** 5 min
- **Started:** 2026-01-22T10:00:00Z
- **Completed:** 2026-01-22T10:05:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Added STAGE_PROBABILITY and STAGE_CHART_COLORS constants for pipeline calculations
- Created getCRMDashboardData function with Prisma aggregations for pipeline metrics
- Built CRMKPICards component displaying Open Pipeline, Weighted Forecast, Win Rate, Total Deals
- Built PipelineStageChart component with horizontal bar chart and custom tooltip
- Added Sales & Revenue section to dashboard below initiative section

## Task Commits

Each task was committed atomically:

1. **Task 1: Add STAGE_PROBABILITY constant and create CRM data fetching** - `2bee061` (feat)
2. **Task 2: Create CRM KPI cards and pipeline stage chart components** - `10eabc5` (feat)

## Files Created/Modified
- `src/lib/pipeline-utils.ts` - Added STAGE_PROBABILITY and STAGE_CHART_COLORS constants
- `src/app/(dashboard)/page.tsx` - Added getCRMDashboardData function and CRM section
- `src/components/dashboard/crm-kpi-cards.tsx` - New CRM KPI cards component
- `src/components/dashboard/pipeline-stage-chart.tsx` - New pipeline stage chart component

## Decisions Made
- STAGE_PROBABILITY values aligned with standard sales methodology: Lead 10%, Qualified 25%, Proposal 50%, Negotiation 75%
- Excluded Won/Lost stages from open pipeline calculation (they are closed)
- Win rate calculated as Won / (Won + Lost) to reflect closed deal conversion
- Used same KPI card styling pattern as initiative KPI cards for consistency

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- CRM dashboard section complete with pipeline widgets
- Ready for plan 15-02 to add revenue/project metrics widgets
- All success criteria met: DASH-01, DASH-02, DASH-05, DASH-06

---
*Phase: 15-dashboard-widgets*
*Completed: 2026-01-22*
