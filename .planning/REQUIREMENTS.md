# Requirements: SAAP 2026 v2 - v2.7 Services Pricing History

**Defined:** 2026-01-29
**Core Value:** Track service pricing across projects and clients — the revenue counterpart to supplier cost tracking

## v1 Requirements

Requirements for v2.7 release. Maps to Phase 79.

### Page Structure

- [ ] **PAGE-01**: Services Pricing History page at /services-pricing/
- [ ] **PAGE-02**: Page title "Services Pricing" with subtitle "Track service pricing across projects and clients"
- [ ] **PAGE-03**: Three-tab layout: All Services, By Service, By Client

### All Services Tab

- [ ] **ALL-01**: Table showing all deliverables with value set
- [ ] **ALL-02**: Columns: Service Title, Description, Value, Project, Client, Date
- [ ] **ALL-03**: Search filter for service title
- [ ] **ALL-04**: Filter by company (client)
- [ ] **ALL-05**: Sortable by value and date

### By Service Tab

- [ ] **SVC-01**: Filter dropdown listing all unique service titles
- [ ] **SVC-02**: Statistics cards: Count, Min Value, Max Value, Avg Value
- [ ] **SVC-03**: Table showing all deliverables for selected service
- [ ] **SVC-04**: Shows value across different clients/projects

### By Client Tab

- [ ] **CLT-01**: Filter dropdown listing all companies with deliverables
- [ ] **CLT-02**: Statistics cards: Count, Total Revenue
- [ ] **CLT-03**: Table showing all deliverables for selected client
- [ ] **CLT-04**: Shows services charged to that client

### Excel Export

- [ ] **EXP-01**: Export button in page header
- [ ] **EXP-02**: Export to XLSX with all columns
- [ ] **EXP-03**: Filename: Services_Pricing_YYYY-MM-DD.xlsx

### Deliverable Detail

- [ ] **DTL-01**: Click row to open deliverable detail modal
- [ ] **DTL-02**: Full edit capability in modal

### Navigation

- [ ] **NAV-01**: Add "Services Pricing" to Work nav group
- [ ] **NAV-02**: Icon: Receipt (from lucide-react)

## v2 Requirements

Deferred to future release. Not in current roadmap.

(None identified — v2.7 is a complete feature)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Inline value editing | Full modal edit is sufficient per user spec |
| Price trend charts | Keep it simple; tabular data is enough |
| AI-powered service categorization | Not needed; service titles are user-entered |
| Comparison with competitor pricing | External data not available |
| Service templates/presets | Out of scope for pricing history view |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| PAGE-01 | Phase 79 | Pending |
| PAGE-02 | Phase 79 | Pending |
| PAGE-03 | Phase 79 | Pending |
| ALL-01 | Phase 79 | Pending |
| ALL-02 | Phase 79 | Pending |
| ALL-03 | Phase 79 | Pending |
| ALL-04 | Phase 79 | Pending |
| ALL-05 | Phase 79 | Pending |
| SVC-01 | Phase 79 | Pending |
| SVC-02 | Phase 79 | Pending |
| SVC-03 | Phase 79 | Pending |
| SVC-04 | Phase 79 | Pending |
| CLT-01 | Phase 79 | Pending |
| CLT-02 | Phase 79 | Pending |
| CLT-03 | Phase 79 | Pending |
| CLT-04 | Phase 79 | Pending |
| EXP-01 | Phase 79 | Pending |
| EXP-02 | Phase 79 | Pending |
| EXP-03 | Phase 79 | Pending |
| DTL-01 | Phase 79 | Pending |
| DTL-02 | Phase 79 | Pending |
| NAV-01 | Phase 79 | Pending |
| NAV-02 | Phase 79 | Pending |

**Coverage:**
- v1 requirements: 23 total
- Mapped to phases: 23
- Unmapped: 0 ✓

---
*Requirements defined: 2026-01-29*
*Last updated: 2026-01-29 after initial definition*
