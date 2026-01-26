# Roadmap: SAAP2026v2 v1.5.1

## Milestones

- v1.0 through v1.5: See `.planning/milestones/` (shipped)
- **v1.5.1 Site Audit Fixes & Detail View Preferences** - Phases 43-45 (in progress)

## Overview

Fix critical bugs (Price Comparison crash, Timeline rendering), reduce UX friction (clickable rows, currency formatting, title wrapping), and add a user-configurable detail view system where users choose between drawer and dialog modes. Three phases: stabilize broken pages, polish interaction patterns, then build the detail view preference system.

## Phases

- [x] **Phase 43: Bug Fixes** - Fix crashing and non-rendering pages
- [ ] **Phase 44: UX Polish** - Clickable rows and data formatting improvements
- [ ] **Phase 45: Detail View System** - Drawer variant with user preference and settings

## Phase Details

### Phase 43: Bug Fixes
**Goal**: All existing pages render correctly without crashes or missing content
**Depends on**: Nothing (first phase of milestone)
**Requirements**: BUG-01, BUG-02, BUG-03
**Success Criteria** (what must be TRUE):
  1. Price Comparison page (/supplier-items) loads and displays supplier item data without crashing
  2. Timeline page (/timeline) renders Gantt chart bars for initiatives that have both start and end dates
  3. Timeline page shows a clear "No initiatives scheduled" message when filters produce no results
**Plans**: 1 plan

Plans:
- [x] 43-01-PLAN.md -- Fix Radix Select crashes, Gantt bar rendering, and empty state message

### Phase 44: UX Polish
**Goal**: Users can click into detail views from any list and see properly formatted data
**Depends on**: Nothing (independent of Phase 43)
**Requirements**: ROW-01, ROW-02, ROW-03, FMT-01, FMT-02, FMT-03
**Success Criteria** (what must be TRUE):
  1. Clicking any initiative row in the Initiatives list opens the initiative detail dialog
  2. Clicking any company row in the Companies list opens the company detail dialog
  3. Clicking any pipeline row in Pipeline list views opens the deal/potential detail dialog
  4. Pipeline/Deal value inputs display formatted as "RM 200,000" while storing raw numbers
  5. Initiative titles in table views wrap to multiple lines instead of being truncated
**Plans**: 2 plans

Plans:
- [ ] 44-01-PLAN.md -- Clickable initiative rows and title wrapping
- [ ] 44-02-PLAN.md -- Currency input formatting for deal and potential project values

### Phase 45: Detail View System
**Goal**: Users control how detail views appear -- choosing between centered dialog and slide-over drawer -- with settings that persist across sessions
**Depends on**: Phase 44 (clickable rows create more detail view usage, making preference meaningful)
**Requirements**: VIEW-01, VIEW-02, VIEW-03, VIEW-04, VIEW-05, VIEW-06, VIEW-07
**Success Criteria** (what must be TRUE):
  1. A drawer (slide-over) component exists and can display the same content as the current dialog modals
  2. Every detail view includes an "Expand" button that navigates to the full detail page
  3. User can set their preferred detail view mode (drawer or dialog) on the Settings page at /settings
  4. User can quickly toggle between drawer and dialog mode from the user menu dropdown
  5. Detail view components automatically use whichever mode the user has chosen, with the preference persisted in the database
**Plans**: TBD

Plans:
- [ ] 45-01: Build drawer component and expand button
- [ ] 45-02: User preference system and settings page

## Progress

**Execution Order:** 43 -> 44 -> 45

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 43. Bug Fixes | v1.5.1 | 1/1 | Complete | 2026-01-26 |
| 44. UX Polish | v1.5.1 | 0/2 | Not started | - |
| 45. Detail View System | v1.5.1 | 0/2 | Not started | - |
