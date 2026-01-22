# Requirements: SAAP2026v2 v1.2

**Defined:** 2026-01-22
**Core Value:** Track sales pipeline, convert deals to projects, monitor costs and profit

## v1.2 Requirements

Requirements for CRM & Project Financials. Each maps to roadmap phases.

### Company & Contacts

- [x] **COMP-01**: User can create company with name, industry, and notes
- [x] **COMP-02**: User can view list of all companies
- [x] **COMP-03**: User can edit company details
- [x] **COMP-04**: User can delete company (with confirmation)
- [x] **CONT-01**: User can add contact to a company (name, email, phone, role)
- [x] **CONT-02**: User can view contacts for a company
- [x] **CONT-03**: User can edit contact details
- [x] **CONT-04**: User can delete contact
- [x] **COMP-05**: Company detail page shows related deals, potentials, and projects

### Sales Pipeline

- [x] **PIPE-01**: User can view deals in Kanban board by stage
- [x] **PIPE-02**: User can create deal with title, description, value, company, and contact
- [x] **PIPE-03**: User can drag deal between stages (Lead, Qualified, Proposal, Negotiation, Won, Lost)
- [x] **PIPE-04**: User can edit deal details
- [x] **PIPE-05**: User can delete deal (with confirmation)
- [x] **PIPE-06**: When deal moves to Won, system auto-creates a Project linked to deal
- [x] **PIPE-07**: When deal moves to Lost, user prompted for lost reason
- [x] **PIPE-08**: User can view pipeline metrics (total value by stage, deal count)

### Repeat Client Tracking

- [x] **PTNL-01**: User can view potential projects in Kanban board (Potential, Confirmed, Cancelled)
- [x] **PTNL-02**: User can create potential project with title, description, estimated value, company, and contact
- [x] **PTNL-03**: User can drag potential between stages
- [x] **PTNL-04**: User can edit potential project details
- [x] **PTNL-05**: User can delete potential project (with confirmation)
- [x] **PTNL-06**: When potential moves to Confirmed, system auto-creates a Project linked to potential

### Projects

- [x] **PROJ-01**: User can view list of all projects
- [x] **PROJ-02**: User can create project directly (without deal/potential)
- [x] **PROJ-03**: User can link project to a KRI (initiative) — optional
- [x] **PROJ-04**: User can edit project details (title, description, revenue, status)
- [x] **PROJ-05**: User can change project status (Draft, Active, Completed, Cancelled)
- [x] **PROJ-06**: User can delete project (with confirmation)
- [x] **PROJ-07**: Project detail page shows source (deal, potential, or direct)
- [x] **PROJ-08**: Project detail page shows linked KRI if present
- [ ] **PROJ-09**: Project detail page shows cost breakdown and profit

### Project Costs

- [ ] **COST-01**: User can add cost item to project (description, amount, category, date)
- [ ] **COST-02**: User can select cost category (Labor, Materials, Vendors, Travel, Software, Other)
- [ ] **COST-03**: User can edit cost item
- [ ] **COST-04**: User can delete cost item
- [ ] **COST-05**: Project shows total costs (sum of all cost items)
- [ ] **COST-06**: Project shows profit (revenue minus total costs)

### Dashboard Widgets

- [ ] **DASH-01**: Dashboard shows pipeline by stage (visual breakdown with values)
- [ ] **DASH-02**: Dashboard shows pipeline total value (sum of open deals)
- [ ] **DASH-03**: Dashboard shows revenue summary (sum of completed project revenues)
- [ ] **DASH-04**: Dashboard shows profit summary (total revenue minus total costs)
- [ ] **DASH-05**: Dashboard shows weighted pipeline value (probability × value per stage)
- [ ] **DASH-06**: Dashboard shows win rate (won deals / closed deals)

## v1.3 Requirements

Deferred to next milestone. Tracked but not in current roadmap.

### Enhancements

- **RCPT-01**: User can upload receipt for cost item
- **RCPT-02**: User can view/download receipt
- **DEAL-01**: User can set expected close date on deal
- **DEAL-02**: User can add notes/activity log to deal
- **DASH-07**: Dashboard shows deal aging alerts

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Complex lead scoring | 3-person team; manual review is fast enough |
| AI-powered forecasting | Low deal volume; insufficient data for ML |
| Marketing automation | Not a marketing tool; use external tools |
| Custom pipeline stages | Fixed stages are clearer for small team |
| Multi-pipeline support | One business, one pipeline + potentials |
| Activity tracking/logging | Overhead for small team; manual notes sufficient |
| Multi-currency support | MYR sufficient for current operations |
| Time tracking | Separate feature domain; use external tools |
| Invoice generation | Use external accounting software |
| Email integration | Overkill for 3-person team |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| COMP-01 | Phase 10 | Complete |
| COMP-02 | Phase 10 | Complete |
| COMP-03 | Phase 10 | Complete |
| COMP-04 | Phase 10 | Complete |
| COMP-05 | Phase 13 | Complete |
| CONT-01 | Phase 10 | Complete |
| CONT-02 | Phase 10 | Complete |
| CONT-03 | Phase 10 | Complete |
| CONT-04 | Phase 10 | Complete |
| PIPE-01 | Phase 11 | Complete |
| PIPE-02 | Phase 11 | Complete |
| PIPE-03 | Phase 11 | Complete |
| PIPE-04 | Phase 11 | Complete |
| PIPE-05 | Phase 11 | Complete |
| PIPE-06 | Phase 13 | Complete |
| PIPE-07 | Phase 11 | Complete |
| PIPE-08 | Phase 11 | Complete |
| PTNL-01 | Phase 12 | Complete |
| PTNL-02 | Phase 12 | Complete |
| PTNL-03 | Phase 12 | Complete |
| PTNL-04 | Phase 12 | Complete |
| PTNL-05 | Phase 12 | Complete |
| PTNL-06 | Phase 13 | Complete |
| PROJ-01 | Phase 13 | Complete |
| PROJ-02 | Phase 13 | Complete |
| PROJ-03 | Phase 13 | Complete |
| PROJ-04 | Phase 13 | Complete |
| PROJ-05 | Phase 13 | Complete |
| PROJ-06 | Phase 13 | Complete |
| PROJ-07 | Phase 13 | Complete |
| PROJ-08 | Phase 13 | Complete |
| PROJ-09 | Phase 14 | Pending |
| COST-01 | Phase 14 | Pending |
| COST-02 | Phase 14 | Pending |
| COST-03 | Phase 14 | Pending |
| COST-04 | Phase 14 | Pending |
| COST-05 | Phase 14 | Pending |
| COST-06 | Phase 14 | Pending |
| DASH-01 | Phase 15 | Pending |
| DASH-02 | Phase 15 | Pending |
| DASH-03 | Phase 15 | Pending |
| DASH-04 | Phase 15 | Pending |
| DASH-05 | Phase 15 | Pending |
| DASH-06 | Phase 15 | Pending |

**Coverage:**
- v1.2 requirements: 42 total
- Mapped to phases: 42
- Unmapped: 0

---
*Requirements defined: 2026-01-22*
*Last updated: 2026-01-22 after roadmap creation*
