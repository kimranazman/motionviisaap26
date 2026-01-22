# Requirements: SAAP2026v2 v1.2

**Defined:** 2026-01-22
**Core Value:** Track sales pipeline, convert deals to projects, monitor costs and profit

## v1.2 Requirements

Requirements for CRM & Project Financials. Each maps to roadmap phases.

### Company & Contacts

- [ ] **COMP-01**: User can create company with name, industry, and notes
- [ ] **COMP-02**: User can view list of all companies
- [ ] **COMP-03**: User can edit company details
- [ ] **COMP-04**: User can delete company (with confirmation)
- [ ] **CONT-01**: User can add contact to a company (name, email, phone, role)
- [ ] **CONT-02**: User can view contacts for a company
- [ ] **CONT-03**: User can edit contact details
- [ ] **CONT-04**: User can delete contact
- [ ] **COMP-05**: Company detail page shows related deals, potentials, and projects

### Sales Pipeline

- [ ] **PIPE-01**: User can view deals in Kanban board by stage
- [ ] **PIPE-02**: User can create deal with title, description, value, company, and contact
- [ ] **PIPE-03**: User can drag deal between stages (Lead, Qualified, Proposal, Negotiation, Won, Lost)
- [ ] **PIPE-04**: User can edit deal details
- [ ] **PIPE-05**: User can delete deal (with confirmation)
- [ ] **PIPE-06**: When deal moves to Won, system auto-creates a Project linked to deal
- [ ] **PIPE-07**: When deal moves to Lost, user prompted for lost reason
- [ ] **PIPE-08**: User can view pipeline metrics (total value by stage, deal count)

### Repeat Client Tracking

- [ ] **PTNL-01**: User can view potential projects in Kanban board (Potential, Confirmed, Cancelled)
- [ ] **PTNL-02**: User can create potential project with title, description, estimated value, company, and contact
- [ ] **PTNL-03**: User can drag potential between stages
- [ ] **PTNL-04**: User can edit potential project details
- [ ] **PTNL-05**: User can delete potential project (with confirmation)
- [ ] **PTNL-06**: When potential moves to Confirmed, system auto-creates a Project linked to potential

### Projects

- [ ] **PROJ-01**: User can view list of all projects
- [ ] **PROJ-02**: User can create project directly (without deal/potential)
- [ ] **PROJ-03**: User can link project to a KRI (initiative) — optional
- [ ] **PROJ-04**: User can edit project details (title, description, revenue, status)
- [ ] **PROJ-05**: User can change project status (Draft, Active, Completed, Cancelled)
- [ ] **PROJ-06**: User can delete project (with confirmation)
- [ ] **PROJ-07**: Project detail page shows source (deal, potential, or direct)
- [ ] **PROJ-08**: Project detail page shows linked KRI if present
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
| COMP-01 | TBD | Pending |
| COMP-02 | TBD | Pending |
| COMP-03 | TBD | Pending |
| COMP-04 | TBD | Pending |
| COMP-05 | TBD | Pending |
| CONT-01 | TBD | Pending |
| CONT-02 | TBD | Pending |
| CONT-03 | TBD | Pending |
| CONT-04 | TBD | Pending |
| PIPE-01 | TBD | Pending |
| PIPE-02 | TBD | Pending |
| PIPE-03 | TBD | Pending |
| PIPE-04 | TBD | Pending |
| PIPE-05 | TBD | Pending |
| PIPE-06 | TBD | Pending |
| PIPE-07 | TBD | Pending |
| PIPE-08 | TBD | Pending |
| PTNL-01 | TBD | Pending |
| PTNL-02 | TBD | Pending |
| PTNL-03 | TBD | Pending |
| PTNL-04 | TBD | Pending |
| PTNL-05 | TBD | Pending |
| PTNL-06 | TBD | Pending |
| PROJ-01 | TBD | Pending |
| PROJ-02 | TBD | Pending |
| PROJ-03 | TBD | Pending |
| PROJ-04 | TBD | Pending |
| PROJ-05 | TBD | Pending |
| PROJ-06 | TBD | Pending |
| PROJ-07 | TBD | Pending |
| PROJ-08 | TBD | Pending |
| PROJ-09 | TBD | Pending |
| COST-01 | TBD | Pending |
| COST-02 | TBD | Pending |
| COST-03 | TBD | Pending |
| COST-04 | TBD | Pending |
| COST-05 | TBD | Pending |
| COST-06 | TBD | Pending |
| DASH-01 | TBD | Pending |
| DASH-02 | TBD | Pending |
| DASH-03 | TBD | Pending |
| DASH-04 | TBD | Pending |
| DASH-05 | TBD | Pending |
| DASH-06 | TBD | Pending |

**Coverage:**
- v1.2 requirements: 42 total
- Mapped to phases: 0
- Unmapped: 42

---
*Requirements defined: 2026-01-22*
*Last updated: 2026-01-22 after initial definition*
