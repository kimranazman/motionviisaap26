# Roadmap: SAAP 2026 v2

## Milestones

- **v1.0 MVP** - Phases 1-3 (shipped 2026-01-20) - [archive](.planning/milestones/v1.1-ROADMAP.md)
- **v1.1 Authentication** - Phases 4-8 (shipped 2026-01-22) - [archive](.planning/milestones/v1.1-ROADMAP.md)
- **v1.2 CRM & Project Financials** - Phases 9-15 (shipped 2026-01-22) - [archive](.planning/milestones/v1.2-ROADMAP.md)
- **v1.2.1 Responsive / Mobile Web** - Phases 16-20 (shipped 2026-01-23) - [archive](.planning/milestones/v1.2.1-ROADMAP.md)
- **v1.3 Document Management & Dashboard Customization** - Phases 21-25 (shipped 2026-01-24) - [archive](.planning/milestones/v1.3-v1.3.2-ROADMAP.md)
- **v1.3.1 Revenue Model Refinement** - Phase 26 (shipped 2026-01-24) - [archive](.planning/milestones/v1.3.2-ROADMAP.md)
- **v1.3.2 Conversion Visibility & Archive** - Phases 27-28 (shipped 2026-01-24) - [archive](.planning/milestones/v1.3.2-ROADMAP.md)
- **v1.4 Intelligent Automation & Organization** - Phases 29-35 (shipped 2026-01-25) - [archive](.planning/milestones/v1.4-ROADMAP.md)
- **v1.4.1 Line Item Categorization** - Phase 36 (shipped 2026-01-25) - [archive](.planning/milestones/v1.4-ROADMAP.md)
- **v1.4.2 UI Polish & Bug Fixes** - Phase 37 (shipped 2026-01-26) - [archive](.planning/milestones/v1.4.2-ROADMAP.md)
- **v1.5 Initiative Intelligence & Export** - Phases 38-42 (shipped 2026-01-26) - [archive](.planning/milestones/v1.5-ROADMAP.md)
- **v1.5.1 Site Audit Fixes & Detail View Preferences** - Phases 43-45 (shipped 2026-01-27) - [archive](.planning/milestones/v1.5.1-ROADMAP.md)
- **v2.0 OKR Restructure & Support Tasks** - Phases 46-53 (shipped 2026-01-27) - [archive](.planning/milestones/v2.0-ROADMAP.md)
- **v2.1 Navigation & Views** - Phases 54-56 (shipped 2026-01-28) - [archive](.planning/milestones/v2.1-ROADMAP.md)
- **v2.2 Bug Fixes & UX Polish** - Phases 57-61 (shipped 2026-01-28) - [archive](.planning/milestones/v2.2-ROADMAP.md)
- **v2.3 CRM & UX Improvements** - Phases 62-67 (shipped 2026-01-28) - [archive](.planning/milestones/v2.3-ROADMAP.md)
- **v2.4 Settings, Sidebar & Bug Fixes** - Phases 68-71 (shipped 2026-01-28) - [archive](.planning/milestones/v2.4-ROADMAP.md)
- **v2.5 Navigation Reorganization** - Phases 72-74 (shipped 2026-01-28) - [archive](.planning/milestones/v2.5-ROADMAP.md)
- **v2.6 Views & Calendar Enhancement** - Phases 75-78 (in progress)

## Phases

<details>
<summary>v1.0 through v2.5 (Phases 1-74) - SHIPPED</summary>

See `.planning/milestones/` for archived phase details.

</details>

### v2.6 Views & Calendar Enhancement

**Goal:** Enhance visualization capabilities with Kanban views for projects and tasks, a unified main calendar showing all entity dates, and richer project card information.

---

#### Phase 75: Members Navigation Move

**Goal:** Move Members nav item from top-level to nested under Work group

**Requirements:** NAV-01, NAV-02, NAV-03

**Success Criteria:**
1. Members nav item removed from top-level sidebar
2. Members nav item appears indented under Work group (after Projects, Tasks)
3. Desktop sidebar renders Members under Work correctly
4. Mobile sidebar renders Members under Work correctly
5. Expandable children (Khairul, Azlan, Izyani) still function
6. Active route highlighting works for Members and children

**Files to modify:**
- `src/lib/nav-config.ts` - Move Members to Work group children
- `src/components/nav-group.tsx` - Verify nested rendering
- `src/components/mobile-sidebar.tsx` - Verify mobile rendering

**Status:** Complete (2026-01-29)

---

#### Phase 76: Projects Kanban Board

**Goal:** Add Kanban board view for projects with enhanced project cards

**Requirements:** PROJ-01 through PROJ-10

**Success Criteria:**
1. User can access Projects Kanban at /projects with view toggle
2. Kanban displays 4 status columns: Draft, Active, Completed, Cancelled
3. Project cards are draggable between columns
4. Drag-and-drop updates project status via PATCH API
5. Project cards show status badge with color coding
6. Project cards show client/company name (or "Internal" badge)
7. Project cards show date range (start to end)
8. Project cards show task progress indicator (X/Y complete)
9. Project cards show revenue/cost summary when available
10. View toggle switches between List and Kanban views
11. Touch support for mobile drag-and-drop

**Files to create:**
- `src/app/(dashboard)/projects/kanban/page.tsx` - Kanban view server component
- `src/components/projects/projects-kanban-board.tsx` - Kanban board client component
- `src/components/projects/project-kanban-card.tsx` - Enhanced project card

**Files to modify:**
- `src/app/(dashboard)/projects/page.tsx` - Add view toggle
- `src/components/projects/project-card.tsx` - Enhance with new fields

**Status:** Complete (2026-01-29)

---

#### Phase 77: Tasks Project Grouping

**Goal:** Add project-grouped view option to tasks kanban

**Requirements:** TASK-01 through TASK-04

**Success Criteria:**
1. User can toggle grouping mode on /tasks kanban (by status vs by project)
2. By-status view remains the default (current behavior)
3. By-project view shows collapsible project sections
4. Each project section contains task status columns (TODO, IN_PROGRESS, DONE)
5. Task cards within sections support drag-and-drop status changes
6. Projects with no tasks are hidden from view
7. Ungrouped tasks (orphan tasks without project) shown in "No Project" section

**Files to modify:**
- `src/app/(dashboard)/tasks/page.tsx` - Add grouping toggle state
- `src/components/tasks/tasks-kanban-board.tsx` - Add project grouping mode

**Files to create:**
- `src/components/tasks/project-tasks-section.tsx` - Collapsible project section with task columns

**Status:** Pending

---

#### Phase 78: Main Calendar View

**Goal:** Create unified calendar showing start/end dates for tasks, projects, and initiatives

**Requirements:** CAL-01 through CAL-12

**Success Criteria:**
1. User can access unified calendar at /calendar
2. Calendar shows task start dates as small markers
3. Calendar shows task due dates as small markers
4. Calendar shows project start dates as markers
5. Calendar shows project end dates as markers
6. Calendar shows initiative start dates as markers
7. Calendar shows initiative end dates as markers
8. User can switch between day, week, and month views
9. Completed/done items render in grey (muted color, no status color)
10. Only start and end dates marked (no spanning/filling between)
11. Calendar nav item added under SAAP group in sidebar
12. Clicking a marker opens relevant entity detail modal/sheet
13. Legend distinguishes entity types (Task, Project, Initiative)
14. Mobile responsive calendar layout

**Files to create:**
- `src/app/(dashboard)/calendar/page.tsx` - Calendar page server component
- `src/components/calendar/main-calendar.tsx` - Calendar client component
- `src/components/calendar/calendar-day-view.tsx` - Day view
- `src/components/calendar/calendar-week-view.tsx` - Week view
- `src/components/calendar/calendar-month-view.tsx` - Month view
- `src/components/calendar/calendar-date-marker.tsx` - Date marker component

**Files to modify:**
- `src/lib/nav-config.ts` - Add Calendar to SAAP group

**Status:** Pending

---

## Progress

Phase 76 of 78 | v2.6 in progress

Progress: [#########.] 97% (76/78 phases)

---

## Phase Dependencies

```
Phase 75 (Nav) ──────────────────────────────────────────┐
                                                         │
Phase 76 (Projects Kanban) ──────────────────────────────┤
                                                         ├──> v2.6 Complete
Phase 77 (Tasks Grouping) ───────────────────────────────┤
                                                         │
Phase 78 (Main Calendar) ────────────────────────────────┘
```

All phases are independent and can be built in parallel or any order.

---

## Key Decisions for v2.6

| Decision | Rationale | Status |
|----------|-----------|--------|
| Reuse @dnd-kit for projects kanban | Already proven in 5+ kanban boards; no new dependencies | Pending |
| Build simple custom calendar | Lightweight; no external calendar library needed | Pending |
| Date markers only (no spanning) | User explicitly requested to avoid clutter | Pending |
| Grey for completed items | Visual distinction without color distraction | Pending |
| View toggle pattern for projects | Matches existing table/kanban toggle on /tasks | Pending |

---
*Roadmap created: 2026-01-28*
*Last updated: 2026-01-28 after v2.6 milestone initialization*
