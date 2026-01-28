# Roadmap: SAAP 2026 v2.3

## Overview

v2.3 is a consolidation milestone that fixes persistent UX bugs, expands CRM browsing with standalone entity pages, adds missing CRUD entry points, introduces internal project support, enables sidebar personalization, and adds line item pricing history. Six phases deliver these features in dependency order: modal fixes first (every feature renders in modals), then additive CRM pages, independent task creation, the high-impact internal project schema change, sidebar customization (after nav config is stable), and finally the most complex integration -- line item pricing.

## Milestones

- v1.0 through v2.2: Shipped (Phases 1-61)
- v2.3 CRM & UX Improvements: Phases 62-67 (in progress)

## Phases

- [x] **Phase 62: Modal Scroll + Expand Fixes** - Fix scrolling and expand-to-page across all detail modals
- [x] **Phase 63: Standalone CRM Pages** - Standalone Departments and Contacts pages under CRM
- [x] **Phase 64: Task Creation on /tasks** - Add Task button with project selector on cross-project tasks page
- [ ] **Phase 65: Internal Project Flag** - Internal projects (Motionvii / Talenta) without external company requirement
- [ ] **Phase 66: Customizable Sidebar Navigation** - Users choose which sidebar links to show/hide
- [ ] **Phase 67: Line Item Pricing History** - Quantity/unit price tracking with by-item and by-client views

## Phase Details

### Phase 62: Modal Scroll + Expand Fixes
**Goal**: Users can scroll through all modal content and expand any detail view to a full page
**Depends on**: Nothing (first phase -- fixes foundation before building on it)
**Requirements**: UX-01, UX-02, UX-03, UX-04
**Success Criteria** (what must be TRUE):
  1. User can scroll through long content in any of the 7+ detail modals without content being clipped
  2. User can click the expand button on any detail modal and land on a dedicated full page (not a modal on an empty page)
  3. ScrollArea renders correctly inside DialogContent across all detail sheet types (project, deal, potential, company, supplier, task, initiative)
  4. Modal scroll works identically in both Dialog mode and Drawer mode
**Plans**: TBD

Plans:
- [x] 62-01: Fix modal scroll in all detail views (wave 1)
- [x] 62-02: Fix expand-to-page for detail views (wave 2)

### Phase 63: Standalone CRM Pages
**Goal**: Users can browse, filter, and manage departments and contacts as standalone pages without navigating through company detail
**Depends on**: Phase 62 (detail modals must scroll correctly before adding new modal content)
**Requirements**: CRM-01, CRM-02, CRM-03, CRM-04, CRM-05, CRM-06, CRM-07, CRM-08, CRM-09, CRM-10, CRM-11
**Success Criteria** (what must be TRUE):
  1. User can browse all departments on /departments and filter by company
  2. User can browse all contacts on /contacts and filter by company and department (cascading)
  3. User can view department detail modal showing contacts, deals, and company link
  4. User can view contact detail modal showing company, department, deals, and projects
  5. User can create departments and contacts from their respective standalone pages
**Plans**: 3 plans in 3 waves

Plans:
- [x] 63-01: API routes + sidebar navigation (wave 1)
- [x] 63-02: Departments page + detail modal (wave 2)
- [x] 63-03: Contacts page + detail modal (wave 3)

### Phase 64: Task Creation on /tasks
**Goal**: Users can create tasks directly from the cross-project /tasks page
**Depends on**: Nothing (independent feature, can run after Phase 62)
**Requirements**: TASK-01, TASK-02, TASK-03
**Success Criteria** (what must be TRUE):
  1. User can click Add Task button on /tasks page and fill out a task creation form
  2. Add Task dialog requires selecting a project to link the new task to
  3. User can create subtasks from task detail view with correct bidirectional parent-child link
**Plans**: 2 plans in 2 waves

Plans:
- [x] 64-01: Add Task dialog with project selector (wave 1)
- [x] 64-02: Subtask creation from task detail view (wave 2)

### Phase 65: Internal Project Flag
**Goal**: Users can create and manage internal projects (Motionvii / Talenta) without an external company
**Depends on**: Phase 63 (CRM pages stable before schema change that makes companyId nullable)
**Requirements**: INT-01, INT-02, INT-03, INT-04, INT-05
**Success Criteria** (what must be TRUE):
  1. User can create a project marked as internal with Motionvii or Talenta entity selection, without selecting a company
  2. User can filter the /projects page by type (All / Client / Internal)
  3. Internal projects display a visible "Internal" badge on cards and detail views
  4. All existing project views, cards, and API endpoints work without errors when a project has no company
**Plans**: TBD

Plans:
- [ ] 65-01: TBD
- [ ] 65-02: TBD

### Phase 66: Customizable Sidebar Navigation
**Goal**: Users can personalize which sidebar links are visible
**Depends on**: Phase 63 (nav config must include new Departments and Contacts items before customization)
**Requirements**: NAV-01, NAV-02, NAV-03, NAV-04
**Success Criteria** (what must be TRUE):
  1. User can toggle sidebar nav items on/off from the Settings page
  2. Sidebar visibility preferences persist across sessions (stored in database per user)
  3. Dashboard and Settings nav items are always visible and cannot be hidden
  4. Navigating directly to a URL whose nav item is hidden auto-reveals that item in the sidebar
**Plans**: TBD

Plans:
- [ ] 66-01: TBD

### Phase 67: Line Item Pricing History
**Goal**: Users can track and compare item pricing with quantity and unit price detail
**Depends on**: Phase 65 (all schema changes settled before adding more fields)
**Requirements**: PRICE-01, PRICE-02, PRICE-03, PRICE-04, PRICE-05, PRICE-06
**Success Criteria** (what must be TRUE):
  1. User can enter quantity and unit price when creating/editing a cost, with total auto-calculated
  2. AI receipt import extracts and persists quantity and unit price from scanned documents
  3. User can view pricing history for a specific normalized item across all projects (by-item view)
  4. User can view all items charged to a specific company (by-client view)
  5. Existing cost aggregation (sum of amount) remains unchanged -- amount is the canonical total
**Plans**: TBD

Plans:
- [ ] 67-01: TBD
- [ ] 67-02: TBD

## Progress

**Execution Order:**
Phases execute in order: 62 -> 63 -> 64 -> 65 -> 66 -> 67

| Phase | Plans Complete | Status | Completed |
|-------|---------------|--------|-----------|
| 62. Modal Scroll + Expand Fixes | 2/2 | Complete | 2026-01-28 |
| 63. Standalone CRM Pages | 3/3 | Complete | 2026-01-28 |
| 64. Task Creation on /tasks | 2/2 | Complete | 2026-01-28 |
| 65. Internal Project Flag | 0/TBD | Not started | - |
| 66. Customizable Sidebar Navigation | 0/TBD | Not started | - |
| 67. Line Item Pricing History | 0/TBD | Not started | - |
