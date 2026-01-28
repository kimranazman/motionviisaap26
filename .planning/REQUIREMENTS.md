# Requirements: SAAP 2026 v2.5

**Defined:** 2026-01-28
**Core Value:** Team can visualize and track initiative progress with intuitive navigation that groups related items logically

## v1 Requirements

Requirements for v2.5 Navigation Reorganization. Each maps to roadmap phases.

### Navigation Reorganization (NAV)

- [ ] **NAV-01**: Create "Work" nav group in nav-config.ts between SAAP and CRM groups
- [ ] **NAV-02**: Move Projects item from CRM group to new Work group
- [ ] **NAV-03**: Move Tasks item from topLevelItems to new Work group
- [ ] **NAV-04**: Update sidebar.tsx to render new Work group correctly
- [ ] **NAV-05**: Update mobile-sidebar.tsx with same navigation structure changes
- [ ] **NAV-06**: Update findGroupForPath to handle new group structure
- [ ] **NAV-07**: Update getDefaultNavOrder to include new Work group

### Repeat Clients Rename (RENAME)

- [ ] **RENAME-01**: Change "Potential Projects" label to "Repeat Clients" in nav-config.ts
- [ ] **RENAME-02**: Update page title in /potential-projects/page.tsx to "Repeat Clients"
- [ ] **RENAME-03**: Update breadcrumbs/headers in potential-projects components to say "Repeat Clients"
- [ ] **RENAME-04**: Update any toast messages or UI text referencing "Potential Projects"

### Members Quick Navigation (MBR)

- [ ] **MBR-01**: Add children array to Members nav item with 3 team member links
- [ ] **MBR-02**: Create child nav items for Khairul, Azlan, Izyani pointing to /members/[name]
- [ ] **MBR-03**: Apply same nested nav pattern as Companies/Departments/Contacts
- [ ] **MBR-04**: Members parent link (/members) remains clickable for overview page
- [ ] **MBR-05**: Update topLevelItems structure to support children on Members item

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

(None - v2.5 is a focused navigation cleanup milestone)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| URL changes for potential-projects | Minimize migration risk; label change is user-facing, URL is implementation |
| Database model rename for PotentialProject | Overkill for label change; model name is internal |
| Drag-to-reorder between groups | Existing within-group reorder is sufficient |
| Custom nav group creation | 3-person team has stable needs |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| NAV-01 | Phase 72 | Pending |
| NAV-02 | Phase 72 | Pending |
| NAV-03 | Phase 72 | Pending |
| NAV-04 | Phase 72 | Pending |
| NAV-05 | Phase 72 | Pending |
| NAV-06 | Phase 72 | Pending |
| NAV-07 | Phase 72 | Pending |
| RENAME-01 | Phase 73 | Pending |
| RENAME-02 | Phase 73 | Pending |
| RENAME-03 | Phase 73 | Pending |
| RENAME-04 | Phase 73 | Pending |
| MBR-01 | Phase 74 | Pending |
| MBR-02 | Phase 74 | Pending |
| MBR-03 | Phase 74 | Pending |
| MBR-04 | Phase 74 | Pending |
| MBR-05 | Phase 74 | Pending |

**Coverage:**
- v1 requirements: 16 total
- Mapped to phases: 16
- Unmapped: 0 ✓

---
*Requirements defined: 2026-01-28*
*Last updated: 2026-01-28 after initial definition*
