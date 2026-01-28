# Requirements: SAAP 2026 v2.6

**Defined:** 2026-01-28
**Core Value:** Team can visualize and track initiative progress across multiple views with full CRM, project management, and AI-powered intelligence

## v1 Requirements

Requirements for v2.6 release. Each maps to roadmap phases.

### Navigation (NAV)

- [x] **NAV-01**: Members nav item moved from top-level to nested under Work group
- [x] **NAV-02**: Desktop sidebar renders Members under Work with correct indentation
- [x] **NAV-03**: Mobile sidebar renders Members under Work with correct indentation

### Projects Kanban (PROJ)

- [x] **PROJ-01**: User can view projects in Kanban board layout
- [x] **PROJ-02**: Kanban columns display Draft, Active, Completed, Cancelled statuses
- [x] **PROJ-03**: User can drag project card between status columns
- [x] **PROJ-04**: Drag-and-drop updates project status via API
- [x] **PROJ-05**: Project card shows status badge with color coding
- [x] **PROJ-06**: Project card shows client/company name (or "Internal" badge)
- [x] **PROJ-07**: Project card shows date range (start to end)
- [x] **PROJ-08**: Project card shows task progress (X/Y tasks complete)
- [x] **PROJ-09**: Project card shows revenue/cost when available
- [x] **PROJ-10**: View toggle between List and Kanban on /projects page

### Tasks Kanban Grouping (TASK)

- [ ] **TASK-01**: User can toggle grouping mode on /tasks kanban (by status vs by project)
- [ ] **TASK-02**: By-project grouping shows project sections with task status columns
- [ ] **TASK-03**: Each project section is collapsible
- [ ] **TASK-04**: Task cards within project sections support drag-and-drop status changes

### Main Calendar (CAL)

- [ ] **CAL-01**: User can access unified calendar at /calendar
- [ ] **CAL-02**: Calendar shows task start dates as markers
- [ ] **CAL-03**: Calendar shows task end/due dates as markers
- [ ] **CAL-04**: Calendar shows project start dates as markers
- [ ] **CAL-05**: Calendar shows project end dates as markers
- [ ] **CAL-06**: Calendar shows initiative start dates as markers
- [ ] **CAL-07**: Calendar shows initiative end dates as markers
- [ ] **CAL-08**: User can switch between day, week, and month views
- [ ] **CAL-09**: Completed/done items render in grey (no status color)
- [ ] **CAL-10**: Only start and end dates marked (no spanning/filling between dates)
- [ ] **CAL-11**: Calendar sidebar navigation added under SAAP group
- [ ] **CAL-12**: Clicking a date marker opens relevant entity detail

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Calendar Enhancements

- **CAL-V2-01**: Filter by entity type (tasks only, projects only, initiatives only)
- **CAL-V2-02**: Filter by assignee/owner
- **CAL-V2-03**: Drag-and-drop to reschedule dates directly on calendar
- **CAL-V2-04**: Color coding by entity type (not just status)

### Projects Views

- **PROJ-V2-01**: Swimlane view grouping by client/company
- **PROJ-V2-02**: Project timeline/Gantt view
- **PROJ-V2-03**: Project milestone tracking

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Calendar sync with Google Calendar | External integration complexity; not needed for 3-person team |
| Recurring events on calendar | Already have Events page for this; calendar is for viewing dates |
| Resource allocation view | Overkill for 3-person team |
| Project dependencies/critical path | Too complex; SAAP is not a full project management tool |
| Custom calendar themes | Unnecessary customization |
| Calendar export (iCal) | Can use screenshot or Excel export if needed |
| Full-width calendar spanning | User explicitly requested markers only (no clutter) |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| NAV-01 | Phase 75 | Complete |
| NAV-02 | Phase 75 | Complete |
| NAV-03 | Phase 75 | Complete |
| PROJ-01 | Phase 76 | Complete |
| PROJ-02 | Phase 76 | Complete |
| PROJ-03 | Phase 76 | Complete |
| PROJ-04 | Phase 76 | Complete |
| PROJ-05 | Phase 76 | Complete |
| PROJ-06 | Phase 76 | Complete |
| PROJ-07 | Phase 76 | Complete |
| PROJ-08 | Phase 76 | Complete |
| PROJ-09 | Phase 76 | Complete |
| PROJ-10 | Phase 76 | Complete |
| TASK-01 | Phase 77 | Pending |
| TASK-02 | Phase 77 | Pending |
| TASK-03 | Phase 77 | Pending |
| TASK-04 | Phase 77 | Pending |
| CAL-01 | Phase 78 | Pending |
| CAL-02 | Phase 78 | Pending |
| CAL-03 | Phase 78 | Pending |
| CAL-04 | Phase 78 | Pending |
| CAL-05 | Phase 78 | Pending |
| CAL-06 | Phase 78 | Pending |
| CAL-07 | Phase 78 | Pending |
| CAL-08 | Phase 78 | Pending |
| CAL-09 | Phase 78 | Pending |
| CAL-10 | Phase 78 | Pending |
| CAL-11 | Phase 78 | Pending |
| CAL-12 | Phase 78 | Pending |

**Coverage:**
- v1 requirements: 29 total
- Mapped to phases: 29
- Unmapped: 0

---
*Requirements defined: 2026-01-28*
*Last updated: 2026-01-29 after Phase 76 completion*
