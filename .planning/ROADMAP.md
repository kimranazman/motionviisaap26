# Roadmap: SAAP2026v2

## Milestones

- ✅ **v1.0 MVP** - Phases 1-3 (shipped 2026-01-20)
- ✅ **v1.1 Authentication** - Phases 4-8 (shipped 2026-01-22)
- ✅ **v1.2 CRM & Project Financials** - Phases 9-15 (shipped 2026-01-22)
- ✅ **v1.2.1 Responsive / Mobile Web** - Phases 16-20 (shipped 2026-01-23)
- ✅ **v1.3 Document Management & Dashboard Customization** - Phases 21-25 (shipped 2026-01-24)
- ✅ **v1.3.1 Revenue Model Refinement** - Phase 26 (shipped 2026-01-24)
- ✅ **v1.3.2 Conversion Visibility & Archive** - Phases 27-28 (shipped 2026-01-24)
- ✅ **v1.4 Intelligent Automation & Organization** - Phases 29-35 (shipped 2026-01-25)
- ✅ **v1.4.1 Line Item Categorization** - Phase 36 (shipped 2026-01-25)
- ✅ **v1.4.2 UI Polish & Bug Fixes** - Phase 37 (shipped 2026-01-26)
- ✅ **v1.5 Initiative Intelligence & Export** - Phases 38-42 (shipped 2026-01-26)
- ✅ **v1.5.1 Site Audit Fixes & Detail View Preferences** - Phases 43-45 (shipped 2026-01-27)
- ✅ **v2.0 OKR Restructure & Support Tasks** - Phases 46-53 (shipped 2026-01-27)
- ✅ **v2.1 Navigation & Views** - Phases 54-56 (shipped 2026-01-28)
- 🚧 **v2.2 Bug Fixes & UX Polish** - Phases 57-61 (in progress)

## Phases

- [x] **Phase 57: Critical Bug Fixes** - Fix project detail error, unscrollable modals, and sidebar scroll
- [x] **Phase 58: Dashboard & Kanban UX Fixes** - Fix dashboard breakpoint persistence, kanban drag handles, and page spacing
- [x] **Phase 59: UI Visibility Fixes** - Surface departments in company detail and tasks in project detail
- [ ] **Phase 60: Event CRUD** - Full create, edit, delete for events
- [ ] **Phase 61: Calendar Enhancements** - Week view and full KR labels

## Phase Details

### 🚧 v2.2 Bug Fixes & UX Polish (In Progress)

**Milestone Goal:** Fix broken/hidden features and enhance calendar + event management for daily use.

#### Phase 57: Critical Bug Fixes
**Goal**: Users can navigate to project details, scroll modal content, and scroll sidebar without hitting broken UI
**Depends on**: Nothing (independent fixes)
**Requirements**: BUG-01, BUG-02, BUG-03
**Success Criteria** (what must be TRUE):
  1. Clicking a project card on /projects navigates to project detail without console errors or blank page
  2. Opening any modal with content taller than the viewport allows vertical scrolling to reach all content
  3. Sidebar navigation scrolls when menu items exceed the viewport height (especially on smaller screens)
**Plans**: 3 plans, 1 wave (all parallel)

Plans:
- [x] 57-01: Fix project detail navigation error (BUG-01)
- [x] 57-02: Fix unscrollable modals (BUG-02)
- [x] 57-03: Fix sidebar scroll (BUG-03)

#### Phase 58: Dashboard & Kanban UX Fixes
**Goal**: Dashboard layouts persist correctly across devices and kanban boards have clean drag UX
**Depends on**: Nothing (independent fixes)
**Requirements**: BUG-04, BUG-05, BUG-06, BUG-07, BUG-08
**Success Criteria** (what must be TRUE):
  1. Saving dashboard layout on mobile does not overwrite the desktop layout (each breakpoint persists independently)
  2. Kanban cards on desktop can be dragged by clicking anywhere on the card body (no visible dotted drag handles)
  3. Kanban cards on mobile still show drag handles for touch-hold interaction
  4. Companies page and Suppliers page have consistent spacing matching the Price Comparison page layout
**Plans**: 3 plans, 1 wave (all parallel)

Plans:
- [x] 58-01: Dashboard breakpoint layout persistence (BUG-04)
- [x] 58-02: Kanban desktop full-card drag & hide handles (BUG-05, BUG-06)
- [x] 58-03: Companies & suppliers page spacing (BUG-07, BUG-08)

#### Phase 59: UI Visibility Fixes
**Goal**: Departments and tasks are discoverable and usable from their parent detail views
**Depends on**: Nothing (independent fixes)
**Requirements**: VIS-01, VIS-02, VIS-03, VIS-04, VIS-05
**Success Criteria** (what must be TRUE):
  1. Opening a company detail view shows a Departments section with existing departments listed
  2. User can add, edit, and delete departments directly from the company detail view
  3. Opening a project detail view shows a Tasks section with existing tasks and subtask hierarchy
  4. User can add, edit, delete tasks and change task status directly from the project detail view
**Plans**: 1 plan, 1 wave (verification only - all features already implemented)

Plans:
- [x] 59-01: Verify UI visibility features (VIS-01 through VIS-05)

#### Phase 60: Event CRUD
**Goal**: Users can fully manage events (create, edit, delete) instead of read-only viewing
**Depends on**: Nothing (independent feature)
**Requirements**: EVT-01, EVT-02, EVT-03, EVT-04, EVT-05
**Success Criteria** (what must be TRUE):
  1. Events page displays an Add button that opens a form with all event fields (name, category, priority, date, location, estimated cost, why attend, target companies, action required, status, remarks)
  2. User can edit any field on an existing event and save changes
  3. User can delete an event with a confirmation dialog
  4. Event cards show edit and delete action buttons
**Plans**: TBD

Plans:
- [ ] 60-01: TBD

#### Phase 61: Calendar Enhancements
**Goal**: Calendar provides better daily visibility with week view and meaningful KR labels
**Depends on**: Nothing (independent feature)
**Requirements**: CAL-01, CAL-02, CAL-03, CAL-04
**Success Criteria** (what must be TRUE):
  1. Calendar page shows a toggle to switch between month view and week view
  2. Week view displays 7 days with expanded vertical space showing all initiatives and events without "+N more" truncation
  3. Calendar labels show full KR names (e.g., "KR1.1 - Achieve RM1M Revenue") instead of just the identifier code
**Plans**: TBD

Plans:
- [ ] 61-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 57 → 58 → 59 → 60 → 61

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 57. Critical Bug Fixes | v2.2 | 3/3 | Complete | 2026-01-28 |
| 58. Dashboard & Kanban UX Fixes | v2.2 | 3/3 | Complete | 2026-01-28 |
| 59. UI Visibility Fixes | v2.2 | 1/1 | Complete | 2026-01-28 |
| 60. Event CRUD | v2.2 | 0/TBD | Not started | - |
| 61. Calendar Enhancements | v2.2 | 0/TBD | Not started | - |
