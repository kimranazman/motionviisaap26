# Requirements: v1.5 Initiative Intelligence & Export

**Milestone:** v1.5
**Goal:** Transform the initiatives view into an objective-driven hierarchy with KPI tracking, date intelligence, linked project visibility, and Excel export.
**Created:** 2026-01-26

---

## v1 Requirements

### Hierarchy & Views (VIEW)

- [ ] **VIEW-01**: User can see initiatives grouped by Objective → Key Result → Initiative in an expandable hierarchy view
- [ ] **VIEW-02**: By Objective view is the default landing view for the initiatives page
- [ ] **VIEW-03**: Each Objective and Key Result section header shows initiative count and status summary (e.g., "5 On Track, 2 At Risk")
- [ ] **VIEW-04**: User can expand/collapse individual Objective and Key Result sections, with state preserved across data refreshes
- [ ] **VIEW-05**: Initiative titles display with full text wrapping (no truncation) in all views
- [ ] **VIEW-06**: User can toggle between view modes: By Objective (default), List, Kanban, Timeline, Calendar
- [x] **VIEW-07**: Key Result grouping normalizes free-text `keyResult` field values (trim, case-insensitive) to prevent duplicate groups

### KPI Tracking (KPI)

- [ ] **KPI-01**: Each initiative has optional KPI fields: label (text), target (decimal), actual (decimal), unit (text), with manual override flag
- [ ] **KPI-02**: KPI actual value auto-calculates from linked project revenue when manual override is not set
- [ ] **KPI-03**: User can manually set KPI actual value, which sets the manual override flag and prevents auto-calculation from overwriting
- [ ] **KPI-04**: KPI progress displays visually as a progress bar or percentage with color coding (green >80%, yellow 50-80%, red <50%)
- [ ] **KPI-05**: KR-level and Objective-level headers show aggregated KPI totals (sum of child initiative targets and actuals)
- [ ] **KPI-06**: Null/zero edge cases handled gracefully: no linked projects shows "No data" (not 0%), zero target shows absolute value (no division), null revenue treated as 0 for sums
- [ ] **KPI-07**: Manual vs auto-calculated values are visually distinguished (indicator icon or label)

### Linked Projects (PROJ)

- [ ] **PROJ-01**: Each initiative row shows inline list of linked projects with title, status badge, revenue, and costs
- [ ] **PROJ-02**: User can click a linked project to navigate to the project detail view
- [ ] **PROJ-03**: Initiative row shows a project count badge (e.g., "3 projects") when projects are linked
- [ ] **PROJ-04**: Initiatives with no linked projects show appropriate empty state (not broken UI)

### Date Intelligence (DATE)

- [ ] **DATE-01**: Overdue initiatives flagged with red badge showing "X days overdue" (endDate < today, status not COMPLETED/CANCELLED)
- [ ] **DATE-02**: Ending-soon initiatives flagged with orange badge showing "Ends in X days" (endDate within 14 days, not completed)
- [ ] **DATE-03**: Late-start initiatives flagged with yellow badge (startDate < today, status NOT_STARTED)
- [ ] **DATE-04**: Invalid date combinations flagged with red error badge (endDate < startDate)
- [ ] **DATE-05**: Long-duration initiatives flagged with gray info badge (>180 days span)
- [ ] **DATE-06**: Owner overlap detection warns when same personInCharge has >3 concurrent active initiatives (orange badge "Workload: X concurrent")
- [ ] **DATE-07**: Date intelligence badges display inline in the By Objective hierarchy view per initiative row
- [ ] **DATE-08**: System suggests better timeline adjustments for initiatives with date issues (e.g., overlapping timelines or unrealistic durations)

### Excel Export (EXPORT)

- [ ] **EXPORT-01**: User can export all initiatives to Excel (.xlsx) with a single click from the initiatives page
- [ ] **EXPORT-02**: Export includes all columns: #, Objective, Key Result, Title, Department, Status, Owner, Start Date, End Date, Duration, KPI Label, KPI Target, KPI Actual, % Achievement, Linked Projects count, Total Revenue, Total Costs, Monthly Objective, Weekly Tasks, Remarks
- [ ] **EXPORT-03**: File downloads with date-stamped filename (SAAP_Initiatives_YYYY-MM-DD.xlsx)
- [ ] **EXPORT-04**: Export generates server-side via API route for reliability on NAS deployment
- [ ] **EXPORT-05**: Export formats data for readability: dates as dates (not ISO strings), status as readable text, currency with 2 decimal places

### Schema Changes (SCHEMA)

- [x] **SCHEMA-01**: Initiative model extended with nullable KPI fields: kpiLabel (VarChar 100), kpiTarget (Decimal 12,2), kpiActual (Decimal 12,2), kpiUnit (VarChar 50), kpiManualOverride (Boolean default false)
- [x] **SCHEMA-02**: Migration is additive only — no breaking changes to existing data

---

## v2 Requirements (Deferred)

- KR as first-class entity (KeyResult model with targets, owners, descriptions)
- KPI history/trending over time
- Multi-sheet Excel export (one sheet per objective)
- Export with conditional formatting (colored cells matching app status)
- Customizable date intelligence thresholds (admin settings)
- Saved filter presets in hierarchy view
- Objective progress dashboard widget
- Cross-initiative dependency mapping
- Quarter-over-quarter comparison

---

## Out of Scope

| Feature | Reason |
|---------|--------|
| Visual tree diagram (SVG/canvas) | Overkill for 2 objectives; expandable list achieves same result |
| Weighted KPI scoring | 3-person team doesn't need formula-based weighting |
| OKR confidence voting | Meaningful for 50+ people, not 3 who talk daily |
| AI-generated OKR suggestions | AI is better used for document analysis |
| Cascading OKRs (top-down) | Only 2 objectives, 1 team; cascading adds no value |
| Custom metric formulas | 28 initiatives don't need a formula engine |
| PDF export with charts | Excel is more useful; users can chart in Excel |
| CSV export | Excel is strictly superior (formatting, multi-sheet) |
| Real-time KPI updates | 3 users; page refresh is sufficient |
| Drag-and-drop reorder in hierarchy | Objectives/KRs are fixed strategic structure |

---

## Traceability

> Filled during roadmap creation -- maps requirements to phases.

| REQ-ID | Phase | Status |
|--------|-------|--------|
| SCHEMA-01 | Phase 38 | Complete |
| SCHEMA-02 | Phase 38 | Complete |
| VIEW-07 | Phase 38 | Complete |
| VIEW-01 | Phase 39 | Pending |
| VIEW-02 | Phase 39 | Pending |
| VIEW-03 | Phase 39 | Pending |
| VIEW-04 | Phase 39 | Pending |
| VIEW-05 | Phase 39 | Pending |
| VIEW-06 | Phase 39 | Pending |
| KPI-01 | Phase 40 | Pending |
| KPI-02 | Phase 40 | Pending |
| KPI-03 | Phase 40 | Pending |
| KPI-04 | Phase 40 | Pending |
| KPI-05 | Phase 40 | Pending |
| KPI-06 | Phase 40 | Pending |
| KPI-07 | Phase 40 | Pending |
| PROJ-01 | Phase 40 | Pending |
| PROJ-02 | Phase 40 | Pending |
| PROJ-03 | Phase 40 | Pending |
| PROJ-04 | Phase 40 | Pending |
| DATE-01 | Phase 41 | Pending |
| DATE-02 | Phase 41 | Pending |
| DATE-03 | Phase 41 | Pending |
| DATE-04 | Phase 41 | Pending |
| DATE-05 | Phase 41 | Pending |
| DATE-06 | Phase 41 | Pending |
| DATE-07 | Phase 41 | Pending |
| DATE-08 | Phase 41 | Pending |
| EXPORT-01 | Phase 42 | Pending |
| EXPORT-02 | Phase 42 | Pending |
| EXPORT-03 | Phase 42 | Pending |
| EXPORT-04 | Phase 42 | Pending |
| EXPORT-05 | Phase 42 | Pending |
