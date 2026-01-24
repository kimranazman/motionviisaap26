# Roadmap: SAAP2026v2

## Milestones

- [x] **v1.0 MVP** - Phases 1-3 (shipped 2026-01-20)
- [x] **v1.1 Authentication** - Phases 4-8 (shipped 2026-01-22)
- [x] **v1.2 CRM & Project Financials** - Phases 9-15 (shipped 2026-01-22)
- [x] **v1.2.1 Responsive / Mobile Web** - Phases 16-20 (shipped 2026-01-23)
- [x] **v1.3 Document Management & Dashboard Customization** - Phases 21-25 (shipped 2026-01-24)
- [x] **v1.3.1 Revenue Model Refinement** - Phase 26 (shipped 2026-01-24)
- [x] **v1.3.2 Conversion Visibility & Archive** - Phases 27-28 (shipped 2026-01-24)
- [ ] **v1.4 Intelligent Automation & Organization** - Phases 29-35 (in progress)

## Phases

<details>
<summary>v1.0-v1.3.2 (Phases 1-28) - SHIPPED</summary>

See `.planning/milestones/` for archived phase details.

**v1.0 MVP (Phases 1-3):** Dashboard, Kanban, Gantt, Calendar, CRUD
**v1.1 Authentication (Phases 4-8):** Google OAuth, RBAC, route protection
**v1.2 CRM & Project Financials (Phases 9-15):** Companies, deals, pipeline, projects, costs
**v1.2.1 Responsive (Phases 16-20):** Mobile navigation, touch Kanban, responsive forms
**v1.3 Documents & Dashboards (Phases 21-25):** File uploads, widget customization, AI parsing
**v1.3.1 Revenue Model (Phase 26):** potentialRevenue vs revenue separation
**v1.3.2 Conversion & Archive (Phases 27-28):** Conversion badges, archive toggle

</details>

### v1.4 Intelligent Automation & Organization (In Progress)

**Milestone Goal:** Transform SAAP into an intelligent project delivery system with supplier tracking, organizational structure, task hierarchies, and bidirectional data sync.

#### Phase 29: Schema Foundation
**Goal**: Establish database models for all v1.4 features
**Depends on**: Phase 28 (v1.3.2 complete)
**Requirements**: Foundation for SUPP-*, DEPT-*, DELV-*, TASK-*, SYNC-06
**Success Criteria** (what must be TRUE):
  1. Supplier model exists with contact info and credit terms fields
  2. Department model exists under Company with departmentId FK on Contact
  3. Deliverable model exists linked to Project
  4. Task model exists with self-referencing parent/children relations
  5. ActivityLog model exists with polymorphic entity reference
**Plans**: 1 plan

Plans:
- [ ] 29-01-PLAN.md - Add v1.4 database models (Supplier, Department, Deliverable, Task, ActivityLog)

#### Phase 30: Supplier Management
**Goal**: Users can track suppliers and link them to project costs
**Depends on**: Phase 29
**Requirements**: SUPP-01, SUPP-02, SUPP-03, SUPP-04, SUPP-05, SUPP-06, SUPP-07, SUPP-08, SUPP-09
**Success Criteria** (what must be TRUE):
  1. User can create supplier with name, contact info, and payment terms
  2. User can view, search, edit, and delete suppliers
  3. User can link supplier when creating/editing project cost entry
  4. Supplier detail page shows total spend and list of all purchased items
  5. Supplier detail page shows projects the supplier worked on
**Plans**: TBD

Plans:
- [ ] 30-01: Supplier CRUD
- [ ] 30-02: Supplier-Cost linking and detail page

#### Phase 31: Department Organization
**Goal**: Users can organize company contacts by department and scope deals/potentials
**Depends on**: Phase 29
**Requirements**: DEPT-01, DEPT-02, DEPT-03, DEPT-04, DEPT-05, DEPT-06, DEPT-07, DEPT-08
**Success Criteria** (what must be TRUE):
  1. User can create, view, edit, and delete departments under a company
  2. User can assign contacts to departments
  3. User can assign deals and potential projects to departments
  4. Company -> Department -> Contact cascading selection works in forms
**Plans**: TBD

Plans:
- [ ] 31-01: Department CRUD and contact assignment
- [ ] 31-02: Deal/potential department scoping and selection flow

#### Phase 32: Project Deliverables
**Goal**: Users can track project scope items (deliverables) from quotes
**Depends on**: Phase 29
**Requirements**: DELV-01, DELV-02, DELV-03, DELV-04, DELV-05
**Success Criteria** (what must be TRUE):
  1. User can create deliverable on project with title and value
  2. User can view, edit, and delete deliverables on project detail
  3. AI extracts deliverables from uploaded Talenta/Motionvii quotes/invoices
**Plans**: TBD

Plans:
- [ ] 32-01: Deliverable CRUD
- [ ] 32-02: AI deliverable extraction

#### Phase 33: Task Management
**Goal**: Users can track tasks and subtasks on projects with full workflow
**Depends on**: Phase 32 (tasks can link to deliverables)
**Requirements**: TASK-01, TASK-02, TASK-03, TASK-04, TASK-05, TASK-06, TASK-07, TASK-08, TASK-09, TASK-10, TASK-11, TASK-12, TASK-13, TASK-14
**Success Criteria** (what must be TRUE):
  1. User can create, edit, and delete tasks with status, due date, assignee, and priority
  2. User can create subtasks nested up to 5 levels deep
  3. User can add comments and tags to tasks
  4. Tags inherit to subtasks automatically
  5. Task shows progress indicator (X of Y subtasks complete)
  6. User can collapse/expand subtasks in tree view
**Plans**: TBD

Plans:
- [ ] 33-01: Task CRUD and hierarchy
- [ ] 33-02: Task features (comments, tags, progress)
- [ ] 33-03: Task tree UI and interactions

#### Phase 34: Activity Logging & Bidirectional Sync
**Goal**: Users see live project data on pipeline and changes sync bidirectionally
**Depends on**: Phase 33 (activity logging touches all entities)
**Requirements**: SYNC-01, SYNC-02, SYNC-03, SYNC-04, SYNC-05, SYNC-06
**Success Criteria** (what must be TRUE):
  1. Converted deal/potential cards show live project metrics (revenue, costs, status)
  2. Project title changes sync back to source deal/potential title
  3. Activity history log shows sync changes on deal/potential cards
  4. Pipeline board data refreshes automatically when viewing
**Plans**: TBD

Plans:
- [ ] 34-01: Activity logging infrastructure
- [ ] 34-02: Bidirectional sync with live metrics

#### Phase 35: AI Price Comparison
**Goal**: Users can compare prices across suppliers using AI semantic matching
**Depends on**: Phase 30 (requires supplier data)
**Requirements**: SUPP-10, SUPP-11
**Success Criteria** (what must be TRUE):
  1. AI semantic matching finds similar line items across suppliers
  2. Price comparison view shows suppliers' prices for similar items with confidence
**Plans**: TBD

Plans:
- [ ] 35-01: AI embeddings and price comparison

## Progress

**Execution Order:**
Phases execute in numeric order: 29 -> 30 -> 31 -> 32 -> 33 -> 34 -> 35

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 29. Schema Foundation | v1.4 | 0/1 | Not started | - |
| 30. Supplier Management | v1.4 | 0/2 | Not started | - |
| 31. Department Organization | v1.4 | 0/2 | Not started | - |
| 32. Project Deliverables | v1.4 | 0/2 | Not started | - |
| 33. Task Management | v1.4 | 0/3 | Not started | - |
| 34. Activity Logging & Sync | v1.4 | 0/2 | Not started | - |
| 35. AI Price Comparison | v1.4 | 0/1 | Not started | - |

**v1.4 Total:** 0/13 plans complete

---
*Roadmap created: 2026-01-24*
*Last updated: 2026-01-24*
