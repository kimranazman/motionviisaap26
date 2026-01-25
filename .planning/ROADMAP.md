# Roadmap: SAAP2026v2

## Milestones

- [x] **v1.0 MVP** - Phases 1-3 (shipped 2026-01-20)
- [x] **v1.1 Authentication** - Phases 4-8 (shipped 2026-01-22)
- [x] **v1.2 CRM & Project Financials** - Phases 9-15 (shipped 2026-01-22)
- [x] **v1.2.1 Responsive / Mobile Web** - Phases 16-20 (shipped 2026-01-23)
- [x] **v1.3 Document Management & Dashboard Customization** - Phases 21-25 (shipped 2026-01-24)
- [x] **v1.3.1 Revenue Model Refinement** - Phase 26 (shipped 2026-01-24)
- [x] **v1.3.2 Conversion Visibility & Archive** - Phases 27-28 (shipped 2026-01-24)
- [x] **v1.4 Intelligent Automation & Organization** - Phases 29-35 (shipped 2026-01-25)
- [x] **v1.4.1 Line Item Categorization** - Phase 36 (shipped 2026-01-25)
- [ ] **v1.4.2 UI Polish & Bug Fixes** - Phase 37 (in progress)

## Current Milestone: v1.4.2 UI Polish & Bug Fixes

**Milestone Goal:** Fix post-deployment issues - documents not showing, improve detail panel UX by converting sheets to modals.

**Context:** After deploying v1.4.1, users reported documents no longer display in project detail. The resizable sheet handle is also too subtle (1px) for users to discover. Converting to centered modals provides better UX for detailed content forms.

## Phases

<details>
<summary>v1.0-v1.4 (Phases 1-35) - SHIPPED</summary>

See `.planning/milestones/` for archived phase details.

**v1.0 MVP (Phases 1-3):** Dashboard, Kanban, Gantt, Calendar, CRUD
**v1.1 Authentication (Phases 4-8):** Google OAuth, RBAC, route protection
**v1.2 CRM & Project Financials (Phases 9-15):** Companies, deals, pipeline, projects, costs
**v1.2.1 Responsive (Phases 16-20):** Mobile navigation, touch Kanban, responsive forms
**v1.3 Documents & Dashboards (Phases 21-25):** File uploads, widget customization, AI parsing
**v1.3.1 Revenue Model (Phase 26):** potentialRevenue vs revenue separation
**v1.3.2 Conversion & Archive (Phases 27-28):** Conversion badges, archive toggle
**v1.4 Intelligent Automation (Phases 29-35):** Suppliers, departments, deliverables, tasks, sync, AI price comparison

</details>

### v1.4.1 Line Item Categorization (Complete)

**Milestone Goal:** Correct v1.4 price comparison - AI categorizes line items, users compare via table filtering (not AI search).

**Context:** v1.4 built on-demand semantic search. The actual need was simpler: AI assigns normalized category names to cost items, then users filter a table to compare prices manually.

#### Phase 36: Line Item Categorization & Price Table
**Goal**: AI categorizes cost line items; users compare prices via filterable table
**Depends on**: Phase 35 (v1.4 complete)
**Requirements**: ITEM-01 to ITEM-09
**Plans**: 2 plans in 2 waves
**Success Criteria** (what must be TRUE):
  1. Cost model has normalizedItem field
  2. AI assigns normalizedItem on cost create/update
  3. User can view all supplier line items in a single table
  4. User can filter by normalizedItem to see all suppliers for same item
  5. User can filter by supplier to see their price list
  6. User can sort by price to compare
  7. User can manually correct normalizedItem if AI got it wrong

Plans:
- [x] 36-01-PLAN.md - Schema update and AI categorization (Wave 1)
- [x] 36-02-PLAN.md - Supplier items table with filtering (Wave 2)

### v1.4.2 UI Polish & Bug Fixes (In Progress)

**Milestone Goal:** Fix post-deployment bugs and improve detail panel UX.

#### Phase 37: Convert Detail Sheets to Modals
**Goal**: Fix documents not showing, replace sliding sheets with centered Dialog/Modal for better UX
**Depends on**: Phase 36 (v1.4.1 complete)
**Requirements**: Bug fix + UX improvement
**Plans**: 2 plans in 1 wave
**Success Criteria** (what must be TRUE):
  1. Documents display correctly in project detail
  2. Detail panels use centered Dialog/Modal instead of sliding Sheet
  3. Modals are properly sized (600-700px default width)
  4. Modals have scrollable content with max-height 90vh
  5. All existing CRUD operations work (costs, deliverables, tasks, documents)
  6. Mobile responsive

Plans:
- [ ] 37-01-PLAN.md - Debug and fix documents display issue (Wave 1)
- [ ] 37-02-PLAN.md - Convert detail sheets to modals (Wave 1)

## Progress

| Milestone | Phases | Plans | Status | Shipped |
|-----------|--------|-------|--------|---------|
| v1.0 MVP | 1-3 | 5 | Complete | 2026-01-20 |
| v1.1 Authentication | 4-8 | 11 | Complete | 2026-01-22 |
| v1.2 CRM & Financials | 9-15 | 13 | Complete | 2026-01-22 |
| v1.2.1 Responsive | 16-20 | 14 | Complete | 2026-01-23 |
| v1.3 Documents & Dashboards | 21-25 | 18 | Complete | 2026-01-24 |
| v1.3.1 Revenue Model | 26 | 3 | Complete | 2026-01-24 |
| v1.3.2 Conversion & Archive | 27-28 | 4 | Complete | 2026-01-24 |
| v1.4 Intelligent Automation | 29-35 | 15 | Complete | 2026-01-25 |
| v1.4.1 Line Item Categorization | 36 | 2 | Complete | 2026-01-25 |
| v1.4.2 UI Polish & Bug Fixes | 37 | 2 | In Progress | - |

**Total:** 36 phases complete, 1 in progress

---
*Roadmap created: 2026-01-20*
*Last updated: 2026-01-26 (phase 37 planned - 2 plans in 1 wave)*
