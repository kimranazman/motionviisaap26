# Roadmap: SAAP 2026 v2.1

## Overview

v2.1 consolidates the sidebar navigation into collapsible groups with shared config (fixing existing mobile drift), adds a cross-project task page with table and kanban views, and delivers per-member workload dashboards. Three phases execute sequentially: navigation unification unblocks the new page links, the task page establishes cross-entity query patterns, and member workload reuses those patterns for multi-model aggregation.

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

## Phases

- [x] **Phase 54: Collapsible Sidebar Navigation** - Unified nav config with collapsible groups, persistence, mobile parity, and new top-level links
- [x] **Phase 55: Cross-Project Task View** - /tasks page with table and kanban views, filters, sorting, drag-and-drop status changes
- [x] **Phase 56: Member Workload Dashboard** - /members overview and /members/[name] detail with cross-model aggregation

## Phase Details

### Phase 54: Collapsible Sidebar Navigation
**Goal**: User navigates a clean, organized sidebar where SAAP, CRM, and Admin items are in collapsible groups, and Tasks/Members are accessible as top-level links
**Depends on**: Nothing (first phase of v2.1)
**Requirements**: NAV-01, NAV-02, NAV-03, NAV-04, NAV-05, NAV-06, NAV-07, NAV-08, NAV-09, NAV-10, NAV-11
**Success Criteria** (what must be TRUE):
  1. User can click SAAP, CRM, and Admin group headers to collapse/expand each section, with a smooth chevron rotation animation
  2. User closes the browser, reopens it, and the sidebar groups remember their collapsed/expanded state from the previous session
  3. User navigates to a page inside a collapsed group and that group auto-expands to reveal the active item
  4. User opens the mobile sidebar and sees the same collapsible groups with the same items as the desktop sidebar (including Price Comparison, which is currently missing on mobile)
  5. User sees top-level Tasks and Members links in the sidebar (not nested in any group)
**Plans**: 1 plan

Plans:
- [x] 54-01-PLAN.md -- Unified navigation config, collapse state hook, NavGroup component, and sidebar refactor (NAV-01 through NAV-11)

### Phase 55: Cross-Project Task View
**Goal**: User can view, filter, sort, and manage all tasks across all projects from a single /tasks page with table and kanban views
**Depends on**: Phase 54 (nav link to /tasks)
**Requirements**: TASK-01, TASK-02, TASK-03, TASK-04, TASK-05, TASK-06, TASK-07, TASK-08, TASK-09, TASK-10, TASK-11, TASK-12, TASK-13, TASK-14, TASK-15
**Success Criteria** (what must be TRUE):
  1. User navigates to /tasks and sees all tasks from all projects in a table with columns for Title, Project, Status, Priority, Assignee, and Due Date -- each sortable by clicking column headers
  2. User toggles between Table and Kanban views via a view switcher, and the selected preference persists across page navigations
  3. User filters tasks by any combination of assignee, project, status, priority, due date range, and text search -- results update in real time
  4. User drags a task card between kanban columns (To Do, In Progress, Done) and the status change persists
  5. User clicks a task row or card and sees a detail sheet with full task info including subtasks and comments
**Plans**: 2 plans

Plans:
- [x] 55-01-PLAN.md -- Server page, filter bar, table view with sortable columns, detail sheet, view preference (TASK-01, 02, 04-12, 14, 15)
- [x] 55-02-PLAN.md -- Kanban view with dnd-kit drag-and-drop status changes (TASK-03, 04, 13)

### Phase 56: Member Workload Dashboard
**Goal**: User can see each team member's workload across all entity types (KRs, initiatives, tasks, support tasks) from overview and detail pages
**Depends on**: Phase 55 (task query patterns and components)
**Requirements**: MBR-01, MBR-02, MBR-03, MBR-04, MBR-05, MBR-06, MBR-07, MBR-08, MBR-09, MBR-10, MBR-11
**Success Criteria** (what must be TRUE):
  1. User navigates to /members and sees 3 member cards, each showing the member's name, avatar/initials, and aggregated counts for KRs, initiatives, tasks, and support tasks
  2. User clicks a member card and navigates to /members/[name] where they see four distinct sections listing KRs (with progress bars), Initiatives (with status and KR badge), Tasks (with project context), and Support Tasks (with category and linked KRs)
  3. User sees a summary statistics header on the member detail page with total counts per entity type and status breakdowns (e.g., "5 In Progress, 2 Completed, 1 At Risk")
  4. User sees items past their due date or in AT_RISK status displayed with red visual highlighting across all sections
  5. User sees a separate "Accountable For" section listing initiatives where the member is accountable (distinct from the personInCharge initiatives section)
**Plans**: 2 plans

Plans:
- [x] 56-01-PLAN.md -- Member utils, overview page with 3 member cards and aggregated counts (MBR-01, MBR-02, MBR-03)
- [x] 56-02-PLAN.md -- Detail page with stats header, 5 sections (KRs, Initiatives, Accountable, Tasks, Support Tasks), and red highlighting (MBR-04 through MBR-11)

## Progress

**Execution Order:** 54 -> 55 -> 56

| Phase | Plans Complete | Status | Completed |
|-------|---------------|--------|-----------|
| 54. Collapsible Sidebar Navigation | 1/1 | Complete | 2026-01-27 |
| 55. Cross-Project Task View | 2/2 | Complete | 2026-01-28 |
| 56. Member Workload Dashboard | 2/2 | Complete | 2026-01-28 |
