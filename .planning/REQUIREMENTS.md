# Requirements: v2.1 Navigation & Views

**Milestone:** v2.1
**Goal:** Consolidate sidebar navigation into collapsible groups, add cross-project task view, and add per-member workload dashboard.
**Created:** 2026-01-27

---

## v1 Requirements

### Navigation (NAV)

- [ ] **NAV-01**: User can collapse/expand the SAAP navigation group in the sidebar via a clickable header with chevron icon
- [ ] **NAV-02**: User can collapse/expand the CRM navigation group in the sidebar via a clickable header with chevron icon
- [ ] **NAV-03**: User can collapse/expand the Admin navigation group in the sidebar (visible to ADMIN role only)
- [ ] **NAV-04**: Chevron icon rotates smoothly (CSS transition) when toggling collapse state
- [ ] **NAV-05**: Sidebar collapse state persists in localStorage across page navigations and browser sessions
- [ ] **NAV-06**: All sidebar groups default to expanded on first visit (before any localStorage value exists)
- [ ] **NAV-07**: When user navigates to a route inside a collapsed group, that group auto-expands to show the active item
- [ ] **NAV-08**: Mobile sidebar (Sheet) uses the same collapsible groups as the desktop sidebar, sharing a single navigation config
- [ ] **NAV-09**: Collapsed group headers show item count badge (e.g., "SAAP (8)")
- [ ] **NAV-10**: Sidebar includes top-level "Tasks" link to /tasks and "Members" link to /members (not nested in any group)
- [ ] **NAV-11**: Desktop and mobile sidebars share a unified navigation config (eliminates current duplication and fixes missing Price Comparison in mobile)

### Tasks (TASK)

- [ ] **TASK-01**: User can navigate to /tasks to see all tasks across all projects
- [ ] **TASK-02**: Table view displays tasks with columns: Title, Project, Status, Priority, Assignee, Due Date
- [ ] **TASK-03**: Kanban view displays tasks in three columns: To Do, In Progress, Done
- [ ] **TASK-04**: User can toggle between Table and Kanban views via a view switcher in the page header
- [ ] **TASK-05**: User can filter tasks by assignee (All, Khairul, Azlan, Izyani)
- [ ] **TASK-06**: User can filter tasks by project (dropdown of projects that have tasks)
- [ ] **TASK-07**: User can filter tasks by status (TODO, IN_PROGRESS, DONE)
- [ ] **TASK-08**: User can filter tasks by priority (LOW, MEDIUM, HIGH)
- [ ] **TASK-09**: User can search tasks by title (real-time text filter)
- [ ] **TASK-10**: User can sort table columns by clicking column headers (ascending/descending toggle)
- [ ] **TASK-11**: Each task row/card shows project name as a badge for cross-project context
- [ ] **TASK-12**: User can click a task to open a detail sheet showing full task info (title, description, status, priority, assignee, due date, subtasks, comments)
- [ ] **TASK-13**: User can drag task cards between kanban columns to change status (reuses existing dnd-kit pattern)
- [ ] **TASK-14**: User can filter tasks by due date range (Overdue, Due Today, Due This Week, Due This Month, No Due Date)
- [ ] **TASK-15**: Selected view preference (table vs kanban) persists in localStorage

### Members (MBR)

- [ ] **MBR-01**: User can navigate to /members to see an overview of all 3 team members
- [ ] **MBR-02**: Each member card on /members shows name, avatar/initials, and aggregated counts (KRs, initiatives, tasks, support tasks)
- [ ] **MBR-03**: User can click a member card to navigate to /members/[name] detail page
- [ ] **MBR-04**: Member detail page shows Key Results section listing KRs owned by the member (KR ID, description, progress bar, target/actual, status)
- [ ] **MBR-05**: Member detail page shows Initiatives section listing initiatives where member is personInCharge (sequence, title, status, department, date range, KR badge)
- [ ] **MBR-06**: Member detail page shows Tasks section listing tasks across all projects where member is assignee (title, project, status, priority, due date)
- [ ] **MBR-07**: Member detail page shows Support Tasks section listing support tasks owned by the member (category, description, frequency, priority, linked KRs)
- [ ] **MBR-08**: Member detail page shows summary statistics header with total counts per entity type
- [ ] **MBR-09**: Member detail shows status breakdown per section (e.g., "5 In Progress, 2 Completed, 1 At Risk") not just raw counts
- [ ] **MBR-10**: Items past due date or in AT_RISK status display with visual highlighting (red accent)
- [ ] **MBR-11**: Member detail page shows separate "Accountable For" section listing initiatives where member is accountable (distinct from personInCharge)

---

## v2 Requirements (Deferred)

These features are expected but deferred to a future milestone.

- [ ] **NAV-D01**: Sidebar collapses to icon-only rail mode (48px width) with hover tooltips
- [ ] **NAV-D02**: Keyboard shortcut (Cmd+B / Ctrl+B) to toggle sidebar visibility
- [ ] **NAV-D03**: Dynamic data-driven badges on section headers (e.g., "SAAP (3 overdue)")
- [ ] **TASK-D01**: Group-by option in table view (group by Project, Assignee, Status, Priority)
- [ ] **TASK-D02**: Kanban group-by toggle (by Status vs by Project)
- [ ] **TASK-D03**: Bulk status update via multi-select checkboxes in table view
- [ ] **TASK-D04**: Task creation dialog from cross-project page with project selector
- [ ] **MBR-D01**: Workload comparison chart on /members overview (bar chart comparing item counts)
- [ ] **MBR-D02**: Cross-entity timeline per member showing all assigned items temporally
- [ ] **MBR-D03**: Previous/Next member navigation buttons on detail page

---

## Out of Scope

| Feature | Reason |
|---------|--------|
| Full shadcn/ui Sidebar component migration | Existing sidebar is clean; collapsible groups only need Radix Collapsible primitive |
| Drag-and-drop task reordering in cross-project table | No meaningful semantics across projects; sort by column headers instead |
| Real-time WebSocket/SSE updates | 3-person team; page refresh is sufficient |
| Custom task statuses or board columns | Fixed TODO/IN_PROGRESS/DONE enum is sufficient for small team |
| Hours-based capacity planning | Massive model changes; team doesn't track hours |
| AI workload insights | Requires effort estimation and ML; team can visually compare counts |
| Per-member notification system | 3 people can communicate directly |
| Nested sub-groups in sidebar | One level of collapsible is sufficient for 16 items |
| Separate "My Tasks" vs "All Tasks" pages | Assignee filter on single /tasks page achieves same result |

---

## Traceability

<!-- Filled by roadmapper: maps each requirement to a phase -->

| Requirement | Phase | Status |
|-------------|-------|--------|
| NAV-01 | Phase 54 | Complete |
| NAV-02 | Phase 54 | Complete |
| NAV-03 | Phase 54 | Complete |
| NAV-04 | Phase 54 | Complete |
| NAV-05 | Phase 54 | Complete |
| NAV-06 | Phase 54 | Complete |
| NAV-07 | Phase 54 | Complete |
| NAV-08 | Phase 54 | Complete |
| NAV-09 | Phase 54 | Complete |
| NAV-10 | Phase 54 | Complete |
| NAV-11 | Phase 54 | Complete |
| TASK-01 | Phase 55 | Complete |
| TASK-02 | Phase 55 | Complete |
| TASK-03 | Phase 55 | Complete |
| TASK-04 | Phase 55 | Complete |
| TASK-05 | Phase 55 | Complete |
| TASK-06 | Phase 55 | Complete |
| TASK-07 | Phase 55 | Complete |
| TASK-08 | Phase 55 | Complete |
| TASK-09 | Phase 55 | Complete |
| TASK-10 | Phase 55 | Complete |
| TASK-11 | Phase 55 | Complete |
| TASK-12 | Phase 55 | Complete |
| TASK-13 | Phase 55 | Complete |
| TASK-14 | Phase 55 | Complete |
| TASK-15 | Phase 55 | Complete |
| MBR-01 | Phase 56 | Pending |
| MBR-02 | Phase 56 | Pending |
| MBR-03 | Phase 56 | Pending |
| MBR-04 | Phase 56 | Pending |
| MBR-05 | Phase 56 | Pending |
| MBR-06 | Phase 56 | Pending |
| MBR-07 | Phase 56 | Pending |
| MBR-08 | Phase 56 | Pending |
| MBR-09 | Phase 56 | Pending |
| MBR-10 | Phase 56 | Pending |
| MBR-11 | Phase 56 | Pending |
