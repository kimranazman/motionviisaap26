# Roadmap: SAAP 2026 v2

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
- ✅ **v2.2 Bug Fixes & UX Polish** - Phases 57-61 (shipped 2026-01-28)
- ✅ **v2.3 CRM & UX Improvements** - Phases 62-67 (shipped 2026-01-28)
- 🚧 **v2.4 Settings, Sidebar & Bug Fixes** - Phases 68-71 (in progress)

## Phases

<details>
<summary>✅ v1.0 through v2.3 (Phases 1-67) - SHIPPED</summary>

See `.planning/milestones/` for archived phase details.

</details>

### 🚧 v2.4 Settings, Sidebar & Bug Fixes (In Progress)

**Milestone Goal:** Fix sidebar settings persistence bugs, add nested Company/Departments/Contacts sidebar links, sidebar drag-and-drop reordering, allow task creation on completed projects, configure internal project field visibility, and fix dashboard revenue accuracy.

- [x] **Phase 68: Sidebar Fixes & Quick Wins** - Fix autoReveal bug, add save button, fix revenue accuracy, enable tasks on completed projects
- [x] **Phase 69: Nested Sidebar Links** - Company nav item expands to show Departments and Contacts as nested sub-items
- [x] **Phase 70: Sidebar Drag-and-Drop Reorder** - Users reorder nav items within groups via Settings page
- [ ] **Phase 71: Internal Project Field Config** - Admin configures which fields are hidden for internal projects

## Phase Details

### Phase 68: Sidebar Fixes & Quick Wins
**Goal**: Users can reliably hide sidebar items and see accurate dashboard revenue, with task creation working on completed projects
**Depends on**: Nothing (first phase of v2.4)
**Requirements**: SIDE-01, SIDE-02, SIDE-03, SIDE-04, SIDE-05, REV-01, REV-02, REV-03, REV-04, TASK-01, TASK-02, TASK-03
**Success Criteria** (what must be TRUE):
  1. User hides a nav item in Settings, clicks Save, and the item stays hidden across all page navigations and browser refreshes
  2. Save button appears only when sidebar visibility state has unsaved changes, and a toast confirms successful save
  3. Dashboard CRM Revenue KPI shows the sum of per-project `revenue ?? potentialRevenue` for ACTIVE and COMPLETED projects without double-counting
  4. User can create tasks and subtasks on projects with COMPLETED status, and can edit existing tasks on those projects
**Plans**: 2 plans

Plans:
- [x] 68-01-PLAN.md — Sidebar bug fixes: remove autoReveal, add Save button with dirty detection and toast
- [x] 68-02-PLAN.md — Fix dashboard revenue accuracy, verify task CRUD on completed projects

### Phase 69: Nested Sidebar Links
**Goal**: Users can navigate to Departments and Contacts via nested sub-items under Companies in the sidebar
**Depends on**: Phase 68 (sidebar persistence must be stable before structural nav changes)
**Requirements**: NEST-01, NEST-02, NEST-03, NEST-04, NEST-05, NEST-06, NEST-07
**Success Criteria** (what must be TRUE):
  1. Companies nav item shows an expand/collapse chevron; clicking the label navigates to /companies while clicking the chevron toggles Departments and Contacts sub-items
  2. Companies parent is highlighted when the user is on /companies, /departments, or /contacts
  3. Sub-items (Departments, Contacts) can be individually hidden via Settings, and hiding the parent Companies hides all sub-items
  4. Mobile sidebar renders nested items with the same hierarchy, indentation, and behavior as desktop
  5. Settings page shows nested items with visual indentation under their parent toggle
**Plans**: 2 plans

Plans:
- [x] 69-01-PLAN.md — Nav config child support, NavGroupComponent nested rendering, sidebar/mobile updates
- [x] 69-02-PLAN.md — Settings page nested display with indentation and cascade hide logic

### Phase 70: Sidebar Drag-and-Drop Reorder
**Goal**: Users can personalize sidebar navigation order by dragging items within groups on the Settings page
**Depends on**: Phase 69 (nested nav structure must be stable before adding ordering logic)
**Requirements**: REORD-01, REORD-02, REORD-03, REORD-04, REORD-05, REORD-06, REORD-07
**Success Criteria** (what must be TRUE):
  1. Settings page shows drag handles on nav items and user can drag to reorder within a group (SAAP, CRM, Admin) but not between groups
  2. Custom order persists per-user across sessions and the sidebar renders items in the saved order
  3. Reset Order button restores the default order from nav-config.ts
  4. New nav items added in future deploys appear at the end of the appropriate group for users with custom order
**Plans**: 2 plans

Plans:
- [x] 70-01-PLAN.md — Nav order backend: Prisma schema, API, hook extension, default order helper
- [x] 70-02-PLAN.md — Settings DnD UI with drag handles, sidebar order rendering, Reset Order button

### Phase 71: Internal Project Field Config
**Goal**: Admin can control which fields are visible on internal projects via a system-wide configuration
**Depends on**: Nothing (independent of sidebar chain)
**Requirements**: INTL-01, INTL-02, INTL-03, INTL-04, INTL-05, INTL-06
**Success Criteria** (what must be TRUE):
  1. Admin settings section shows toggles for internal project fields (revenue, potentialRevenue, pipeline source, company/contact, initiative link) with sensible defaults
  2. Configuration is stored in AdminDefaults and applies system-wide (not per-user)
  3. Project form dynamically hides configured fields when the project is internal, and project detail view follows the same visibility rules
**Plans**: TBD

Plans:
- [ ] 71-01: TBD
- [ ] 71-02: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 68 → 69 → 70 → 71
Note: Phase 71 is independent and can execute in parallel with 69-70 if desired.

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 68. Sidebar Fixes & Quick Wins | v2.4 | 2/2 | Complete | 2026-01-28 |
| 69. Nested Sidebar Links | v2.4 | 2/2 | Complete | 2026-01-28 |
| 70. Sidebar DnD Reorder | v2.4 | 2/2 | Complete | 2026-01-28 |
| 71. Internal Project Field Config | v2.4 | 0/TBD | Not started | - |
