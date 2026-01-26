# Roadmap: v1.5 Initiative Intelligence & Export

## Overview

Transform the initiatives view from a flat list into an objective-driven intelligence layer with KPI tracking, date intelligence, linked project visibility, and Excel export. Five phases move from schema foundation through hierarchy view, KPI and project enrichment, date intelligence, to Excel export -- each building on the previous to deliver a progressively richer initiatives experience.

## Milestones

- v1.0 through v1.4.2: See `.planning/milestones/` (shipped)
- v1.5 Initiative Intelligence & Export: Phases 38-42 (in progress)

## Phases

- [x] **Phase 38: Schema & Utilities Foundation** - KPI fields migration, grouping/date/KPI utility modules
- [x] **Phase 39: By Objective Hierarchy View** - Three-level expandable hierarchy as default initiatives view
- [x] **Phase 40: KPI Tracking & Linked Projects** - KPI metrics with auto-calculation, inline project visibility
- [ ] **Phase 41: Date Intelligence** - Overdue, ending-soon, late-start, and overlap detection badges
- [ ] **Phase 42: Excel Export** - Single-click server-side XLSX export with all columns

## Phase Details

### Phase 38: Schema & Utilities Foundation
**Goal**: All KPI fields exist in the database and pure-function utility modules for grouping, KPI calculation, and date intelligence are ready for consumption by UI components
**Depends on**: Nothing (first phase of v1.5)
**Requirements**: SCHEMA-01, SCHEMA-02, VIEW-07
**Success Criteria** (what must be TRUE):
  1. Initiative model has 5 new nullable KPI fields (kpiLabel, kpiTarget, kpiActual, kpiUnit, kpiManualOverride) and existing data is unaffected
  2. Group utility normalizes free-text keyResult values so "KR1.1", " kr1.1 ", and "KR 1.1" all resolve to the same group
  3. KPI utility correctly handles null/zero edge cases: no projects returns "No data", zero target avoids division, null revenue treated as 0
  4. Date utility computes overdue, ending-soon, late-start, invalid-date, and long-duration flags from initiative date fields
**Plans**: 1 plan

Plans:
- [x] 38-01-PLAN.md -- Schema migration (5 KPI fields) and 3 utility modules (group, KPI, date)

### Phase 39: By Objective Hierarchy View
**Goal**: Users land on an objective-driven hierarchy that groups all 28 initiatives by Objective and Key Result with expand/collapse and full text display
**Depends on**: Phase 38 (schema + group-utils)
**Requirements**: VIEW-01, VIEW-02, VIEW-03, VIEW-04, VIEW-05, VIEW-06
**Success Criteria** (what must be TRUE):
  1. User navigates to initiatives and sees initiatives grouped in Objective > Key Result > Initiative hierarchy by default
  2. Each Objective and Key Result header shows initiative count and status summary (e.g., "5 On Track, 2 At Risk")
  3. User can expand/collapse any section and the state persists when data refreshes (no reset on re-render)
  4. Initiative titles display with full text wrapping -- no truncation anywhere in the hierarchy
  5. User can toggle between By Objective, List, Kanban, Timeline, and Calendar views
**Plans**: 2 plans

Plans:
- [x] 39-01-PLAN.md -- Objectives route, hierarchy components (Objective/KR/Initiative), sidebar navigation
- [x] 39-02-PLAN.md -- ViewModeToggle component integrated into all 5 view pages

### Phase 40: KPI Tracking & Linked Projects
**Goal**: Each initiative row shows KPI progress (auto-calculated or manual) and inline linked project details, enabling users to assess initiative health at a glance
**Depends on**: Phase 39 (hierarchy view to render KPI and project data within)
**Requirements**: KPI-01, KPI-02, KPI-03, KPI-04, KPI-05, KPI-06, KPI-07, PROJ-01, PROJ-02, PROJ-03, PROJ-04
**Success Criteria** (what must be TRUE):
  1. User can set KPI label, target, actual, and unit on any initiative via the edit form
  2. KPI actual auto-calculates from linked project revenue when manual override is not set, and stops auto-calculating when user manually sets a value
  3. KPI progress bar displays with color coding (green >80%, yellow 50-80%, red <50%) and manual vs auto values are visually distinguished
  4. Each initiative row shows linked project count badge and expandable inline list with project title, status, revenue, and costs
  5. Clicking a linked project navigates to the project detail view
**Plans**: 2 plans

Plans:
- [x] 40-01-PLAN.md -- KPI data layer, progress bar component, header aggregation, and detail sheet KPI editing
- [x] 40-02-PLAN.md -- Linked projects section component, count badge on rows, detail sheet integration

### Phase 41: Date Intelligence
**Goal**: Initiative rows display contextual date badges that flag overdue, ending-soon, late-start, invalid-date, long-duration, and owner overlap situations
**Depends on**: Phase 39 (hierarchy view to render badges within)
**Requirements**: DATE-01, DATE-02, DATE-03, DATE-04, DATE-05, DATE-06, DATE-07, DATE-08
**Success Criteria** (what must be TRUE):
  1. Overdue initiatives show red "X days overdue" badge; ending-soon show orange "Ends in X days" badge (within 14 days)
  2. Late-start initiatives show yellow badge; invalid dates (end < start) show red error badge
  3. Long-duration initiatives (>180 days) show gray info badge
  4. Owner overlap detection shows orange "Workload: X concurrent" badge when same person has >3 active concurrent initiatives
  5. System suggests timeline adjustments for initiatives with date issues
**Plans**: TBD

Plans:
- [ ] 41-01: Date intelligence badges and suggestions

### Phase 42: Excel Export
**Goal**: Users can export all initiative data to a formatted Excel file with a single click
**Depends on**: Phase 40 + 41 (all data columns must exist before export serializes them)
**Requirements**: EXPORT-01, EXPORT-02, EXPORT-03, EXPORT-04, EXPORT-05
**Success Criteria** (what must be TRUE):
  1. User clicks export button and receives an .xlsx file downloaded to their device
  2. Export contains all 20 columns: objective, key result, title, department, status, owner, dates, duration, KPI fields, linked project count, revenue, costs, monthly objective, weekly tasks, remarks
  3. File is named SAAP_Initiatives_YYYY-MM-DD.xlsx with today's date
  4. Dates display as readable dates (not ISO strings), currency shows 2 decimal places, status shows readable text
**Plans**: TBD

Plans:
- [ ] 42-01: Server-side XLSX export API and UI button

## Progress

**Execution Order:** 38 > 39 > 40 > 41 > 42

| Phase | Plans Complete | Status | Completed |
|-------|---------------|--------|-----------|
| 38. Schema & Utilities Foundation | 1/1 | Complete | 2026-01-26 |
| 39. By Objective Hierarchy View | 2/2 | Complete | 2026-01-26 |
| 40. KPI Tracking & Linked Projects | 2/2 | Complete | 2026-01-26 |
| 41. Date Intelligence | 0/1 | Not started | - |
| 42. Excel Export | 0/1 | Not started | - |
