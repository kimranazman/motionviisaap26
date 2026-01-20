# Requirements: SAAP2026v2

**Defined:** 2026-01-20
**Core Value:** Team can visualize and track initiative progress across multiple views with intuitive drag-and-drop.

## v1 Requirements

Requirements for this milestone: Complete incomplete UI elements.

### Search

- [x] **SRCH-01**: User can search initiatives from header and see filtered results

### Notifications

- [x] **NOTF-01**: User can see count of overdue/at-risk initiatives on bell icon
- [x] **NOTF-02**: User can click bell to see list of overdue/at-risk initiatives with links

### Initiative Detail

- [x] **DETL-01**: User can view full initiative details on dedicated page (/initiatives/[id])
- [x] **DETL-02**: User can edit initiative fields inline on detail page
- [x] **DETL-03**: User can view and add comments on detail page

### Kanban Quick Actions

- [ ] **KANB-01**: User can change initiative status via context menu "Change Status"
- [ ] **KANB-02**: User can reassign initiative via context menu "Reassign"

### Navigation Cleanup

- [x] **NAV-01**: Settings link removed from sidebar (prevents 404)
- [x] **NAV-02**: Non-functional Profile/Settings/Logout removed from user dropdown
- [x] **NAV-03**: All initiative links across app navigate to working detail page

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Authentication

- **AUTH-01**: User can log in with email/password
- **AUTH-02**: User session persists across browser refresh
- **AUTH-03**: User can log out

### Settings

- **SETT-01**: User can access settings page
- **SETT-02**: User can configure notification preferences

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Real authentication | Dedicated future milestone |
| Settings page | Requires auth first |
| Email notifications | Overkill for 3-person team |
| Mobile app | Web responsive is sufficient |
| Real-time updates | Single user typically, not needed |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| NAV-01 | Phase 1 | Complete |
| NAV-02 | Phase 1 | Complete |
| NAV-03 | Phase 1 | Complete |
| DETL-01 | Phase 1 | Complete |
| DETL-02 | Phase 1 | Complete |
| DETL-03 | Phase 1 | Complete |
| SRCH-01 | Phase 2 | Complete |
| NOTF-01 | Phase 2 | Complete |
| NOTF-02 | Phase 2 | Complete |
| KANB-01 | Phase 3 | Pending |
| KANB-02 | Phase 3 | Pending |

**Coverage:**
- v1 requirements: 11 total
- Mapped to phases: 11
- Unmapped: 0

---
*Requirements defined: 2026-01-20*
*Last updated: 2026-01-20 after Phase 2 completion*
