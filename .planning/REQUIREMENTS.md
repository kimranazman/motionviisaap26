# Requirements: SAAP2026v2 v1.5.1

**Defined:** 2026-01-26
**Core Value:** Fix critical bugs, reduce UX friction, and give users control over their detail view experience (drawer vs dialog).

## v1 Requirements

### Bug Fixes

- [ ] **BUG-01**: Price Comparison page (/supplier-items) renders without crashing — fix Select.Item empty value error
- [ ] **BUG-02**: Timeline page (/timeline) renders Gantt chart bars for initiatives with valid date ranges
- [ ] **BUG-03**: Timeline page shows "No initiatives scheduled" message when no data matches current filters

### Clickable Rows

- [ ] **ROW-01**: Clicking an initiative row in the Initiatives list opens the initiative detail dialog
- [ ] **ROW-02**: Clicking a company row in the Companies list opens the company detail dialog
- [ ] **ROW-03**: Clicking a pipeline row in Pipeline list views opens the deal/potential detail dialog

### Data Formatting

- [ ] **FMT-01**: Pipeline/Deal value inputs display with "RM" prefix and thousand separators (e.g., "RM 200,000")
- [ ] **FMT-02**: Value stored as raw number, formatting is display-only
- [ ] **FMT-03**: Initiative titles in table views wrap to multiple lines instead of truncating

### Detail View System

- [ ] **VIEW-01**: Drawer (slide-over) component variant exists as alternative to centered Dialog for detail views
- [ ] **VIEW-02**: Detail views include an "Expand" button that navigates to the full detail page
- [ ] **VIEW-03**: User preference (drawer vs dialog) stored in database via UserPreferences
- [ ] **VIEW-04**: Detail view components respect user's drawer/dialog preference
- [ ] **VIEW-05**: Settings page at /settings allows user to configure detail view mode
- [ ] **VIEW-06**: User menu dropdown includes quick toggle for drawer/dialog mode
- [ ] **VIEW-07**: Drawer slides from right on desktop, slides from bottom on mobile (consistent with v1.2.1 patterns)

## v2 Requirements

None — this is a focused bug fix and UX polish milestone.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Route guard security audit | Deferred — separate security-focused milestone |
| Dashboard chart width(-1) console warning | Cosmetic, no user impact |
| Quick-edit sidebars replacing all modals | User preference system handles this instead |
| Multiple saved layout profiles | Overkill for 3-person team; one preference per user |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| BUG-01 | Phase 43 | Pending |
| BUG-02 | Phase 43 | Pending |
| BUG-03 | Phase 43 | Pending |
| ROW-01 | Phase 44 | Pending |
| ROW-02 | Phase 44 | Pending |
| ROW-03 | Phase 44 | Pending |
| FMT-01 | Phase 44 | Pending |
| FMT-02 | Phase 44 | Pending |
| FMT-03 | Phase 44 | Pending |
| VIEW-01 | Phase 45 | Pending |
| VIEW-02 | Phase 45 | Pending |
| VIEW-03 | Phase 45 | Pending |
| VIEW-04 | Phase 45 | Pending |
| VIEW-05 | Phase 45 | Pending |
| VIEW-06 | Phase 45 | Pending |
| VIEW-07 | Phase 45 | Pending |

**Coverage:**
- v1 requirements: 16 total
- Mapped to phases: 16
- Unmapped: 0

---
*Requirements defined: 2026-01-26*
*Last updated: 2026-01-26 after roadmap creation*
