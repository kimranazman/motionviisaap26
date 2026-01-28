# Requirements: SAAP2026v2 — v2.2 Bug Fixes & UX Polish

**Defined:** 2026-01-28
**Core Value:** Fix broken/hidden features and enhance calendar + event management for daily use.

## v1 Requirements

Requirements for v2.2. Each maps to roadmap phases.

### Bug Fixes (BUG)

- [ ] **BUG-01**: Project detail view loads without error when clicking project cards on /projects page
- [ ] **BUG-02**: All modals scroll vertically when content exceeds viewport height
- [ ] **BUG-03**: Sidebar navigation menu scrolls when items exceed viewport height
- [ ] **BUG-04**: Dashboard layout persists separately per breakpoint (mobile layout does not overwrite desktop layout)
- [ ] **BUG-05**: Kanban cards are draggable by clicking anywhere on the card (not just handles) on desktop
- [ ] **BUG-06**: Dotted drag handles are hidden on desktop kanban boards (visible only on mobile)
- [ ] **BUG-07**: Companies page has consistent whitespace/spacing matching Price Comparison layout
- [ ] **BUG-08**: Suppliers page has consistent whitespace/spacing matching Price Comparison layout

### UI Visibility Fixes (VIS)

- [ ] **VIS-01**: Department section is visible and functional in company detail view
- [ ] **VIS-02**: Department CRUD (add, edit, delete) works from company detail
- [ ] **VIS-03**: Tasks section is visible and functional in project detail view
- [ ] **VIS-04**: Task tree with subtask hierarchy renders correctly in project detail
- [ ] **VIS-05**: Task CRUD (add, edit, delete, status change) works from project detail

### Events Management (EVT)

- [ ] **EVT-01**: User can create a new event with all fields (name, category, priority, date, location, estimated cost, why attend, target companies, action required, status, remarks)
- [ ] **EVT-02**: User can edit all fields of an existing event
- [ ] **EVT-03**: User can delete an event with confirmation
- [ ] **EVT-04**: Events page shows add button for creating new events
- [ ] **EVT-05**: Events page shows edit/delete actions on event cards

### Calendar Enhancements (CAL)

- [ ] **CAL-01**: User can toggle between month view and week view
- [ ] **CAL-02**: Week view shows 7 days with expanded vertical space per day (no "+N more" overflow)
- [ ] **CAL-03**: Week view shows all initiatives and events for each day without truncation
- [ ] **CAL-04**: Calendar displays full KR name (e.g., "KR1.1 - Achieve RM1M Revenue") not just identifier

## v2 Requirements

None deferred — this milestone is scoped tightly.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Event recurring schedule | Complexity not justified for one-time events |
| Calendar day view | Week view provides sufficient daily detail |
| Calendar drag-to-create events | Nice-to-have, not essential for 3-person team |
| Event notifications/reminders | Email notifications out of scope per project constraints |
| Event attendee tracking | Overkill for 3-person team |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| BUG-01 | Phase 57 | Pending |
| BUG-02 | Phase 57 | Pending |
| BUG-03 | Phase 57 | Pending |
| BUG-04 | Phase 58 | Complete |
| BUG-05 | Phase 58 | Complete |
| BUG-06 | Phase 58 | Complete |
| BUG-07 | Phase 58 | Complete |
| BUG-08 | Phase 58 | Complete |
| VIS-01 | Phase 59 | Complete |
| VIS-02 | Phase 59 | Complete |
| VIS-03 | Phase 59 | Complete |
| VIS-04 | Phase 59 | Complete |
| VIS-05 | Phase 59 | Complete |
| EVT-01 | Phase 60 | Complete |
| EVT-02 | Phase 60 | Complete |
| EVT-03 | Phase 60 | Complete |
| EVT-04 | Phase 60 | Complete |
| EVT-05 | Phase 60 | Complete |
| CAL-01 | Phase 61 | Pending |
| CAL-02 | Phase 61 | Pending |
| CAL-03 | Phase 61 | Pending |
| CAL-04 | Phase 61 | Pending |

**Coverage:**
- v1 requirements: 22 total
- Mapped to phases: 22
- Unmapped: 0

---
*Requirements defined: 2026-01-28*
*Last updated: 2026-01-28 after roadmap creation*
