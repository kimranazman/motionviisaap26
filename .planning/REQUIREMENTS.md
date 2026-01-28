# Requirements: SAAP 2026 v2.3

**Defined:** 2026-01-28
**Core Value:** Team can visualize and track initiative progress across multiple views with full CRM, project management, AI-powered intelligence, cross-project task management, per-member workload dashboards, event management, and enhanced calendar.

## v1 Requirements

Requirements for v2.3 release. Each maps to roadmap phases.

### UX Fixes

- [x] **UX-01**: All detail modals scroll content when it exceeds viewport height
- [x] **UX-02**: Expand-to-page button opens dedicated full page (not modal-on-empty-page)
- [x] **UX-03**: ScrollArea works correctly inside DialogContent across all 7+ detail sheet types
- [x] **UX-04**: Modal scroll works in both Dialog and Drawer modes

### CRM Entity Browsing

- [x] **CRM-01**: User can browse all departments on standalone /departments page
- [x] **CRM-02**: User can filter departments by company on /departments page
- [x] **CRM-03**: User can view department detail modal with contacts, deals, and company link
- [x] **CRM-04**: User can create a department (with company selection)
- [x] **CRM-05**: User can browse all contacts on standalone /contacts page
- [x] **CRM-06**: User can filter contacts by company on /contacts page
- [x] **CRM-07**: User can filter contacts by department (cascading from company) on /contacts page
- [x] **CRM-08**: User can view contact detail modal with company, department, deals, and projects
- [x] **CRM-09**: User can create a contact (with company selection)
- [x] **CRM-10**: Cross-entity navigation links (department row links to company, contact row links to company/department)
- [x] **CRM-11**: Departments and Contacts appear in sidebar CRM group

### Task Management

- [x] **TASK-01**: User can create a task from the /tasks page via Add Task button
- [x] **TASK-02**: Add Task dialog includes project selector (required) for linking task to a project
- [x] **TASK-03**: User can create subtasks from task detail view (bidirectional parent-child link)

### Internal Projects

- [ ] **INT-01**: Project model has isInternal flag with Motionvii / Talenta entity selection
- [ ] **INT-02**: User can create internal projects without selecting an external company
- [ ] **INT-03**: User can filter projects by type (All / Client / Internal) on /projects page
- [ ] **INT-04**: Internal projects display visual "Internal" badge on cards and detail views
- [ ] **INT-05**: All project.company references handle null safely (26+ files audited)

### Sidebar Customization

- [ ] **NAV-01**: User can show/hide sidebar nav items via Settings page
- [ ] **NAV-02**: Sidebar customization persisted per user in database (UserPreferences)
- [ ] **NAV-03**: Dashboard and Settings nav items cannot be hidden (always visible)
- [ ] **NAV-04**: Hidden nav item auto-reveals if user navigates to that page directly

### Line Item Pricing

- [ ] **PRICE-01**: Cost model has optional quantity and unitPrice fields
- [ ] **PRICE-02**: CostForm supports entering quantity and unit price with auto-calculated total
- [ ] **PRICE-03**: AI receipt import persists quantity and unitPrice from extraction
- [ ] **PRICE-04**: By-item pricing history view showing all prices for a normalized item across projects
- [ ] **PRICE-05**: By-client pricing history view showing all items charged to a specific company
- [ ] **PRICE-06**: Existing cost aggregation (sum of amount) remains unchanged (amount is canonical total)

## v2 Requirements

Deferred to v2.4+. Tracked but not in current roadmap.

### CRM Enhancements

- **CRM-V2-01**: Contact quick-search in header search bar
- **CRM-V2-02**: Bulk contact import via CSV
- **CRM-V2-03**: Company-scoped entity views with URL filter params

### Sidebar Enhancements

- **NAV-V2-01**: Drag-to-reorder nav items within groups
- **NAV-V2-02**: Sidebar item badges showing counts (overdue tasks, active deals)
- **NAV-V2-03**: Quick-collapse all groups keyboard shortcut

### Pricing Enhancements

- **PRICE-V2-01**: Pricing trend visualization (sparkline charts per item)
- **PRICE-V2-02**: Normalized deliverable titles (AI normalization for grouping)
- **PRICE-V2-03**: Invoice import creates granular line item Cost entries

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Full CRM contact management suite | Email tracking, call logging, activity timelines are enterprise bloat for 3-person team |
| Complex role-based sidebar visibility | 3 users do not need per-role sidebar presets; individual customization sufficient |
| Real-time pricing alerts | Static history page sufficient; 20-50 costs/month does not warrant push notifications |
| Inline sidebar customization (right-click to hide) | Complex UX; use Settings page instead for discoverability |
| Pricing prediction / ML models | Premature for 3 users with limited data points |
| Multi-currency pricing history | Team operates in MYR; manual conversion for rare foreign invoices |
| Contact activity timeline | Related deals/projects IS the interaction history for this team |
| Departments as standalone entity pages (/departments/[id]) | Departments are thin reference entities; modal detail is sufficient |
| Drag-and-drop sidebar reordering | Low value for 3 users; added complexity for questionable benefit |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| UX-01 | Phase 62 | Complete |
| UX-02 | Phase 62 | Complete |
| UX-03 | Phase 62 | Complete |
| UX-04 | Phase 62 | Complete |
| CRM-01 | Phase 63 | Complete |
| CRM-02 | Phase 63 | Complete |
| CRM-03 | Phase 63 | Complete |
| CRM-04 | Phase 63 | Complete |
| CRM-05 | Phase 63 | Complete |
| CRM-06 | Phase 63 | Complete |
| CRM-07 | Phase 63 | Complete |
| CRM-08 | Phase 63 | Complete |
| CRM-09 | Phase 63 | Complete |
| CRM-10 | Phase 63 | Complete |
| CRM-11 | Phase 63 | Complete |
| TASK-01 | Phase 64 | Complete |
| TASK-02 | Phase 64 | Complete |
| TASK-03 | Phase 64 | Complete |
| INT-01 | Phase 65 | Pending |
| INT-02 | Phase 65 | Pending |
| INT-03 | Phase 65 | Pending |
| INT-04 | Phase 65 | Pending |
| INT-05 | Phase 65 | Pending |
| NAV-01 | Phase 66 | Pending |
| NAV-02 | Phase 66 | Pending |
| NAV-03 | Phase 66 | Pending |
| NAV-04 | Phase 66 | Pending |
| PRICE-01 | Phase 67 | Pending |
| PRICE-02 | Phase 67 | Pending |
| PRICE-03 | Phase 67 | Pending |
| PRICE-04 | Phase 67 | Pending |
| PRICE-05 | Phase 67 | Pending |
| PRICE-06 | Phase 67 | Pending |

**Coverage:**
- v1 requirements: 33 total
- Mapped to phases: 33
- Unmapped: 0

---
*Requirements defined: 2026-01-28*
*Last updated: 2026-01-28 after roadmap creation*
