# Roadmap: SAAP2026v2

## Milestones

- ✅ **v1.0 MVP** - Phases 1-3 (shipped 2026-01-20)
- ✅ **v1.1 Authentication** - Phases 4-8 (shipped 2026-01-22)
- 🚧 **v1.2 CRM & Project Financials** - Phases 9-15 (in progress)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1-3) - SHIPPED 2026-01-20</summary>

See `.planning/milestones/v1.0-MVP/` for archived plans.

</details>

<details>
<summary>✅ v1.1 Authentication (Phases 4-8) - SHIPPED 2026-01-22</summary>

See `.planning/milestones/v1.1-Authentication/` for archived plans.

</details>

### 🚧 v1.2 CRM & Project Financials (In Progress)

**Milestone Goal:** Add sales pipeline and project tracking with cost breakdowns to forecast revenue and calculate net profit.

- [x] **Phase 9: Foundation** - Schema migration, Company/Contact entities, CostCategory seed
- [x] **Phase 10: Companies & Contacts** - Company and contact management pages
- [x] **Phase 11: Sales Pipeline** - Deal Kanban board with stage transitions
- [x] **Phase 12: Potential Projects** - Repeat client pipeline Kanban
- [x] **Phase 13: Projects & Conversion** - Project entity with 3 entry points
- [ ] **Phase 14: Project Costs** - Cost tracking and profit calculation
- [ ] **Phase 15: Dashboard Widgets** - Pipeline and revenue/profit dashboards

## Phase Details

### Phase 9: Foundation
**Goal**: Database schema supports CRM and project financials
**Depends on**: Nothing (first phase of v1.2)
**Requirements**: None directly (enables all others)
**Success Criteria** (what must be TRUE):
  1. Prisma schema includes Company, Contact, Deal, PotentialProject, Project, Cost models
  2. CostCategory seeded with Labor, Materials, Vendors, Travel, Software, Other
  3. Currency fields use Decimal(12,2) for precision
  4. Database migration runs without errors
**Plans**: 1 plan

Plans:
- [x] 09-01-PLAN.md - Add CRM and project financials schema to database

### Phase 10: Companies & Contacts
**Goal**: Users can manage companies and their contacts
**Depends on**: Phase 9
**Requirements**: COMP-01, COMP-02, COMP-03, COMP-04, CONT-01, CONT-02, CONT-03, CONT-04
**Success Criteria** (what must be TRUE):
  1. User can create, view, edit, and delete companies
  2. User can add, view, edit, and delete contacts within a company
  3. Company list shows all companies with search/filter
  4. Contact appears in company context (not standalone)
**Plans**: 2 plans

Plans:
- [x] 10-01-PLAN.md - Company list, detail modal, inline editing, search/filter
- [x] 10-02-PLAN.md - Contact cards in company modal, CRUD, primary designation

### Phase 11: Sales Pipeline
**Goal**: Users can track new business deals through stages
**Depends on**: Phase 10
**Requirements**: PIPE-01, PIPE-02, PIPE-03, PIPE-04, PIPE-05, PIPE-07, PIPE-08
**Success Criteria** (what must be TRUE):
  1. User sees deals in Kanban board organized by stage
  2. User can create deal with company, contact, value, and description
  3. User can drag deal between stages (Lead, Qualified, Proposal, Negotiation, Won, Lost)
  4. Moving deal to Lost prompts for reason
  5. Pipeline metrics show total value and deal count by stage
**Plans**: 2 plans

Plans:
- [x] 11-01-PLAN.md - Pipeline Kanban board with deal API routes and drag-and-drop
- [x] 11-02-PLAN.md - Deal CRUD modals, Lost reason prompt, and pipeline metrics

### Phase 12: Potential Projects
**Goal**: Users can track repeat client opportunities
**Depends on**: Phase 10
**Requirements**: PTNL-01, PTNL-02, PTNL-03, PTNL-04, PTNL-05
**Success Criteria** (what must be TRUE):
  1. User sees potential projects in Kanban board (Potential, Confirmed, Cancelled)
  2. User can create potential project with company, contact, estimated value
  3. User can drag potential between stages
  4. User can edit and delete potential projects
**Plans**: 1 plan

Plans:
- [x] 12-01-PLAN.md - PotentialProject Kanban board with CRUD and drag-and-drop

### Phase 13: Projects & Conversion
**Goal**: Projects can be created from deals, potentials, or directly
**Depends on**: Phase 11, Phase 12
**Requirements**: PROJ-01, PROJ-02, PROJ-03, PROJ-04, PROJ-05, PROJ-06, PROJ-07, PROJ-08, PIPE-06, PTNL-06, COMP-05
**Success Criteria** (what must be TRUE):
  1. Moving deal to Won auto-creates linked Project
  2. Moving potential to Confirmed auto-creates linked Project
  3. User can create project directly (without deal/potential)
  4. User can link project to a KRI (initiative) optionally
  5. Project detail shows source (deal, potential, or direct)
  6. Company detail page shows related deals, potentials, and projects
**Plans**: 3 plans

Plans:
- [x] 13-01-PLAN.md - Project CRUD and direct creation with KRI linking
- [x] 13-02-PLAN.md - Deal/Potential to Project auto-conversion on stage change
- [x] 13-03-PLAN.md - Company detail page with related deals, potentials, projects

### Phase 14: Project Costs
**Goal**: Users can track project costs and see profit
**Depends on**: Phase 13
**Requirements**: COST-01, COST-02, COST-03, COST-04, COST-05, COST-06, PROJ-09
**Success Criteria** (what must be TRUE):
  1. User can add cost items to a project with description, amount, category, date
  2. Cost categories available: Labor, Materials, Vendors, Travel, Software, Other
  3. User can edit and delete cost items
  4. Project detail shows total costs and profit (revenue minus costs)
**Plans**: TBD

Plans:
- [ ] 14-01: Cost item CRUD
- [ ] 14-02: Profit calculation display

### Phase 15: Dashboard Widgets
**Goal**: Dashboard shows pipeline and financial summaries
**Depends on**: Phase 14
**Requirements**: DASH-01, DASH-02, DASH-03, DASH-04, DASH-05, DASH-06
**Success Criteria** (what must be TRUE):
  1. Dashboard shows pipeline by stage with visual breakdown and values
  2. Dashboard shows pipeline total value (open deals) and weighted value
  3. Dashboard shows revenue summary (completed project revenues)
  4. Dashboard shows profit summary (total revenue minus total costs)
  5. Dashboard shows win rate (won deals / closed deals)
**Plans**: TBD

Plans:
- [ ] 15-01: Pipeline widgets
- [ ] 15-02: Revenue and profit widgets

## Progress

**Execution Order:**
Phases execute in numeric order: 9 -> 10 -> 11 -> 12 -> 13 -> 14 -> 15

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 9. Foundation | v1.2 | 1/1 | Complete | 2026-01-22 |
| 10. Companies & Contacts | v1.2 | 2/2 | Complete | 2026-01-22 |
| 11. Sales Pipeline | v1.2 | 2/2 | Complete | 2026-01-22 |
| 12. Potential Projects | v1.2 | 1/1 | Complete | 2026-01-22 |
| 13. Projects & Conversion | v1.2 | 3/3 | Complete | 2026-01-22 |
| 14. Project Costs | v1.2 | 0/2 | Not started | - |
| 15. Dashboard Widgets | v1.2 | 0/2 | Not started | - |

---
*Roadmap created: 2026-01-22*
*Last updated: 2026-01-22*
