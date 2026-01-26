---
phase: 40-kpi-tracking-linked-projects
plan: 01
subsystem: objectives-kpi
tags: [kpi, progress-bar, initiative, prisma, alertdialog]
completed: 2026-01-26
duration: 6min
dependency-graph:
  requires: [38-01, 39-01, 39-02]
  provides: [kpi-progress-bar, kpi-edit-fields, kpi-aggregation, kpi-patch-api]
  affects: [40-02, 42-01]
tech-stack:
  added: []
  patterns: [aggregateKpiTotals, KpiProgressBar, manual-override-alertdialog]
key-files:
  created:
    - src/components/objectives/kpi-progress-bar.tsx
  modified:
    - src/app/(dashboard)/objectives/page.tsx
    - src/components/objectives/objective-hierarchy.tsx
    - src/components/objectives/initiative-row.tsx
    - src/components/objectives/key-result-group.tsx
    - src/components/objectives/objective-group.tsx
    - src/components/kanban/initiative-detail-sheet.tsx
    - src/app/api/initiatives/[id]/route.ts
    - src/lib/initiative-kpi-utils.ts
decisions:
  - id: KPI-AGG-TYPE
    decision: "aggregateKpiTotals uses inline object type with required id field for structural overlap with InitiativeForGrouping"
    context: "TypeScript weak type detection prevented passing InitiativeForGrouping[] to KPI-only typed functions"
  - id: KPI-LABEL-DISPLAY
    decision: "KpiProgressBar shows label prefix only for custom KPI labels (not 'No data' or 'Revenue' defaults)"
    context: "Avoids redundant label for auto-calculated revenue display"
metrics:
  tasks: 2/2
  commits: 2
---

# Phase 40 Plan 01: KPI Tracking & Initiative Row Display Summary

**One-liner:** KPI progress bars with green/yellow/red color coding on initiative rows, aggregated KPI totals in headers, KPI edit fields with manual override AlertDialog confirmation in detail sheet.

## What Was Built

### Task 1: Data Layer Expansion
- Extended Prisma query in objectives page to fetch KPI fields (kpiLabel, kpiTarget, kpiActual, kpiUnit, kpiManualOverride) and linked projects with revenue/cost data
- Serialized Decimal fields to numbers server-side; aggregated project costs into totalCosts
- Expanded Initiative interface with optional KPI and projects fields (backward compatible)
- Extended PATCH API to accept and persist all 5 KPI fields
- Added `aggregateKpiTotals` utility function for header-level KPI summation with mixed-unit detection

### Task 2: UI Components and Editing
- Created `KpiProgressBar` component: thin h-1.5 progress bar with color coding (green >=80%, yellow >=50%, red <50%, gray for no data), manual/auto icon (Pencil/Calculator), percentage text
- Updated `InitiativeRow` to render KpiProgressBar below each initiative title using calculateKpi
- Added aggregated KPI totals to KeyResultGroup and ObjectiveGroup headers with same color coding
- Added KPI Tracking section to InitiativeDetailSheet with label, unit, target, actual fields
- Implemented AlertDialog confirmation flow for manual override of auto-calculated values
- Added "Revert to Auto" button that PATCHes kpiManualOverride=false and kpiActual=null
- Extended hasChanges detection to include all KPI fields

## Decisions Made

| ID | Decision | Rationale |
|----|----------|-----------|
| KPI-AGG-TYPE | aggregateKpiTotals uses inline object type with required `id` field | Structural overlap needed with InitiativeForGrouping to satisfy TypeScript without modifying the grouping utility |
| KPI-LABEL-DISPLAY | Label prefix shown only for custom KPI labels | Auto-calculated "Revenue" and "No data" labels don't need prefix duplication |

## Deviations from Plan

None -- plan executed exactly as written.

## Commits

| Hash | Type | Description |
|------|------|-------------|
| d27788d | feat | Expand data layer with KPI fields, project aggregation, and PATCH API |
| 4882b94 | feat | KPI progress bar, header aggregation, and detail sheet KPI editing |

## Verification

- `npx tsc --noEmit` -- passes with zero errors
- `npm run build` -- production build succeeds
- All success criteria met:
  - KPI-01: Editable KPI fields in detail sheet
  - KPI-02: Auto-calculation from linked project revenue
  - KPI-03: Manual override with AlertDialog confirmation
  - KPI-04: Color-coded progress bar on every initiative row
  - KPI-05: Aggregated KPI totals in KR and Objective headers
  - KPI-06: Null/zero edge cases handled (no data, zero target, null revenue)
  - KPI-07: Manual (pencil) vs auto (calculator) icon distinction

## Next Phase Readiness

Plan 40-02 (Linked Projects section in detail sheet) can proceed. All KPI data including projects array is already flowing through the component hierarchy.
