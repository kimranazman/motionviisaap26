# Requirements: v2.4 Settings, Sidebar & Bug Fixes

**Defined:** 2026-01-28
**Core Value:** Team can customize sidebar navigation, see accurate revenue data, and manage tasks on completed projects without friction.

## v1 Requirements

Requirements for v2.4 release. Each maps to roadmap phases.

### Sidebar Bug Fixes (SIDE)

- [ ] **SIDE-01**: Hidden nav items stay hidden regardless of which URL the user navigates to (autoReveal removed or restricted to explicit user action only)
- [ ] **SIDE-02**: Settings page shows a Save button that persists all sidebar visibility changes in a single batch
- [ ] **SIDE-03**: Save button only appears when local state differs from persisted state (dirty detection)
- [ ] **SIDE-04**: Sidebar visually updates immediately after saving without requiring page reload
- [ ] **SIDE-05**: Toast notification confirms successful save ("Settings saved")

### Nested Sidebar Navigation (NEST)

- [x] **NEST-01**: Companies nav item has an expand/collapse chevron showing Departments and Contacts as indented sub-items
- [x] **NEST-02**: Clicking "Companies" label navigates to /companies; clicking the chevron toggles sub-items
- [x] **NEST-03**: Companies parent is highlighted when on /companies, /departments, or /contacts
- [x] **NEST-04**: Sub-items can be individually hidden via Settings page toggles
- [x] **NEST-05**: Hiding parent "Companies" also hides Departments and Contacts sub-items
- [x] **NEST-06**: Mobile sidebar renders nested items with same hierarchy and behavior
- [x] **NEST-07**: Settings page shows nested items with visual indentation under parent

### Sidebar Drag-and-Drop Reorder (REORD)

- [ ] **REORD-01**: Settings page shows nav items with drag handles for each group
- [ ] **REORD-02**: User can drag to reorder items within a group (SAAP, CRM, Admin)
- [ ] **REORD-03**: Items cannot be dragged between groups
- [ ] **REORD-04**: Custom order persisted per-user in UserPreferences (navItemOrder JSON field)
- [ ] **REORD-05**: Sidebar renders items in user's custom order
- [ ] **REORD-06**: "Reset Order" button restores default order from nav-config.ts
- [ ] **REORD-07**: New nav items added in future deploys appear at end for users with custom order

### Revenue Accuracy (REV)

- [ ] **REV-01**: Dashboard CRM Revenue KPI uses per-project `revenue ?? potentialRevenue` fallback (prefer actual, fall back to potential)
- [ ] **REV-02**: Revenue calculation includes ACTIVE and COMPLETED projects (not just COMPLETED)
- [ ] **REV-03**: Projects with both revenue and potentialRevenue count actual revenue only (no double-counting)
- [ ] **REV-04**: Profit calculation updates consistently with the new revenue logic

### Task on Completed Projects (TASK)

- [ ] **TASK-01**: User can create tasks on projects with COMPLETED status
- [ ] **TASK-02**: User can create subtasks on tasks belonging to completed projects
- [ ] **TASK-03**: User can edit existing tasks on completed projects

### Internal Project Field Config (INTL)

- [ ] **INTL-01**: Admin settings section shows toggles for internal project field visibility
- [ ] **INTL-02**: Configurable fields include: revenue, potentialRevenue, pipeline source (deal/potential), company/contact, initiative link
- [ ] **INTL-03**: Configuration stored in AdminDefaults (system-wide, not per-user)
- [ ] **INTL-04**: Project form dynamically hides fields based on admin config when project is internal
- [ ] **INTL-05**: Project detail view follows same field visibility rules
- [ ] **INTL-06**: Sensible defaults applied when no admin config exists (hide revenue and pipeline source for internal projects)

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Sidebar Enhancements

- **SIDE-V2-01**: Unsaved changes browser prompt when navigating away from Settings
- **SIDE-V2-02**: Drag-to-reorder also available in the live sidebar (not just Settings)

### Revenue Enhancements

- **REV-V2-01**: Revenue breakdown tooltip showing actual vs potential per project
- **REV-V2-02**: Revenue Target widget integration with project-level revenue

### Field Config Enhancements

- **INTL-V2-01**: Per-user field visibility overrides (beyond admin defaults)
- **INTL-V2-02**: Field visibility for external projects too (not just internal)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Multi-level sidebar nesting (3+ levels) | One level of children is sufficient; deep nesting is a UX anti-pattern |
| User-configurable sidebar groups | Groups (SAAP, CRM, Admin) provide stable structure; reorder within groups only |
| Per-widget revenue configuration | Revenue should have one consistent definition across the dashboard |
| Full RBAC on project status transitions | 3-person team; status is informational, not a permission gate |
| Auto-save sidebar settings | Explicit save button is the fix for the current fire-and-forget problem |
| Complex lead scoring | 3-person team; manual review is fast enough |
| Sidebar item badges (counts) | Nice-to-have, defer |
| Contact quick-search in header | Defer to v2.5+ |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SIDE-01 | Phase 68 | Pending |
| SIDE-02 | Phase 68 | Pending |
| SIDE-03 | Phase 68 | Pending |
| SIDE-04 | Phase 68 | Pending |
| SIDE-05 | Phase 68 | Pending |
| NEST-01 | Phase 69 | Complete |
| NEST-02 | Phase 69 | Complete |
| NEST-03 | Phase 69 | Complete |
| NEST-04 | Phase 69 | Complete |
| NEST-05 | Phase 69 | Complete |
| NEST-06 | Phase 69 | Complete |
| NEST-07 | Phase 69 | Complete |
| REORD-01 | Phase 70 | Pending |
| REORD-02 | Phase 70 | Pending |
| REORD-03 | Phase 70 | Pending |
| REORD-04 | Phase 70 | Pending |
| REORD-05 | Phase 70 | Pending |
| REORD-06 | Phase 70 | Pending |
| REORD-07 | Phase 70 | Pending |
| REV-01 | Phase 68 | Pending |
| REV-02 | Phase 68 | Pending |
| REV-03 | Phase 68 | Pending |
| REV-04 | Phase 68 | Pending |
| TASK-01 | Phase 68 | Pending |
| TASK-02 | Phase 68 | Pending |
| TASK-03 | Phase 68 | Pending |
| INTL-01 | Phase 71 | Pending |
| INTL-02 | Phase 71 | Pending |
| INTL-03 | Phase 71 | Pending |
| INTL-04 | Phase 71 | Pending |
| INTL-05 | Phase 71 | Pending |
| INTL-06 | Phase 71 | Pending |

**Coverage:**
- v1 requirements: 32 total
- Mapped to phases: 32
- Unmapped: 0

---
*Requirements defined: 2026-01-28*
*Last updated: 2026-01-28 after roadmap creation*
