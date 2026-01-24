# Requirements: SAAP2026v2

**Defined:** 2026-01-24
**Core Value:** Team can visualize and track initiative progress with secure access, full CRM, customizable dashboards, project document management, AI document intelligence, conversion visibility, archive management, and intelligent project delivery with supplier tracking and task management.

## v1.4 Requirements

Requirements for v1.4 Intelligent Automation & Organization milestone.

### Live Project Summary

- [ ] **SYNC-01**: Converted deal shows live project metrics (revenue, costs, status) on pipeline card
- [ ] **SYNC-02**: Converted potential shows live project metrics on potential-projects card
- [ ] **SYNC-03**: Project title changes sync back to source deal title
- [ ] **SYNC-04**: Project title changes sync back to source potential title
- [ ] **SYNC-05**: Pipeline board data refreshes automatically when viewing
- [ ] **SYNC-06**: Activity history log shows sync changes on deal/potential cards

### Supplier Management

- [ ] **SUPP-01**: User can create supplier with name, contact info
- [ ] **SUPP-02**: User can add credit terms (accepts credit, payment terms like Net 30)
- [ ] **SUPP-03**: User can view list of all suppliers with search
- [ ] **SUPP-04**: User can edit supplier details
- [ ] **SUPP-05**: User can delete supplier (with confirmation)
- [ ] **SUPP-06**: User can link supplier to project cost entry
- [ ] **SUPP-07**: Supplier detail page shows total spend (sum of linked costs)
- [ ] **SUPP-08**: Supplier detail page shows price list (all linked cost line items)
- [ ] **SUPP-09**: Supplier detail page shows projects worked on
- [ ] **SUPP-10**: AI semantic matching finds similar line items across suppliers
- [ ] **SUPP-11**: Price comparison view shows suppliers' prices for similar items

### Company Departments

- [ ] **DEPT-01**: User can create department under company
- [ ] **DEPT-02**: User can view list of departments for a company
- [ ] **DEPT-03**: User can edit department details
- [ ] **DEPT-04**: User can delete department
- [ ] **DEPT-05**: User can assign contact to department
- [ ] **DEPT-06**: User can assign deal to department
- [ ] **DEPT-07**: User can assign potential project to department
- [ ] **DEPT-08**: Company → Department → Contact selection flow in forms

### Project Deliverables

- [ ] **DELV-01**: User can create deliverable on project with title and value
- [ ] **DELV-02**: User can view list of deliverables on project detail
- [ ] **DELV-03**: User can edit deliverable details
- [ ] **DELV-04**: User can delete deliverable
- [ ] **DELV-05**: AI extracts deliverables from uploaded Talenta/Motionvii invoices/quotes

### Task Management

- [ ] **TASK-01**: User can create task on project with title, description
- [ ] **TASK-02**: User can set task status (To Do, In Progress, Done)
- [ ] **TASK-03**: User can set task due date
- [ ] **TASK-04**: User can assign task to team member
- [ ] **TASK-05**: User can add comment on task
- [ ] **TASK-06**: User can create subtask under existing task
- [ ] **TASK-07**: Subtasks can be nested up to 5 levels deep
- [ ] **TASK-08**: User can add tags to task
- [ ] **TASK-09**: Tags inherit to subtasks automatically
- [ ] **TASK-10**: User can set task priority (High, Medium, Low)
- [ ] **TASK-11**: Task shows progress indicator (X of Y subtasks complete)
- [ ] **TASK-12**: User can collapse/expand subtasks in tree view
- [ ] **TASK-13**: User can edit task details
- [ ] **TASK-14**: User can delete task (with subtasks)

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Supplier Enhancements

- **SUPP-12**: Price history tracking over time with effectiveDate
- **SUPP-13**: Supplier performance scoring
- **SUPP-14**: Preferred supplier flag

### Task Enhancements

- **TASK-15**: Convert deliverable to task
- **TASK-16**: Task dependencies (blocked by)
- **TASK-17**: Task Gantt view
- **TASK-18**: Time tracking on tasks

### AI Enhancements

- **AI-01**: Auto-extract supplier from receipts/invoices
- **AI-02**: Auto-extract contacts from client invoices

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Supplier portal/login | Massive complexity for 3-person team |
| RFQ workflow | Overkill; manual quotes via email sufficient |
| Task dependencies/Gantt | Initiatives have Gantt; tasks are simpler |
| Time tracking on tasks | Separate domain; use external tools |
| Real-time price API | No API integration; manual entry only |
| ML price forecasting | Low volume; insufficient data |
| Invoice generation | SAAP tracks invoices, doesn't generate them |
| Full audit trail | Activity history for sync events only, not all fields |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SYNC-01 | TBD | Pending |
| SYNC-02 | TBD | Pending |
| SYNC-03 | TBD | Pending |
| SYNC-04 | TBD | Pending |
| SYNC-05 | TBD | Pending |
| SYNC-06 | TBD | Pending |
| SUPP-01 | TBD | Pending |
| SUPP-02 | TBD | Pending |
| SUPP-03 | TBD | Pending |
| SUPP-04 | TBD | Pending |
| SUPP-05 | TBD | Pending |
| SUPP-06 | TBD | Pending |
| SUPP-07 | TBD | Pending |
| SUPP-08 | TBD | Pending |
| SUPP-09 | TBD | Pending |
| SUPP-10 | TBD | Pending |
| SUPP-11 | TBD | Pending |
| DEPT-01 | TBD | Pending |
| DEPT-02 | TBD | Pending |
| DEPT-03 | TBD | Pending |
| DEPT-04 | TBD | Pending |
| DEPT-05 | TBD | Pending |
| DEPT-06 | TBD | Pending |
| DEPT-07 | TBD | Pending |
| DEPT-08 | TBD | Pending |
| DELV-01 | TBD | Pending |
| DELV-02 | TBD | Pending |
| DELV-03 | TBD | Pending |
| DELV-04 | TBD | Pending |
| DELV-05 | TBD | Pending |
| TASK-01 | TBD | Pending |
| TASK-02 | TBD | Pending |
| TASK-03 | TBD | Pending |
| TASK-04 | TBD | Pending |
| TASK-05 | TBD | Pending |
| TASK-06 | TBD | Pending |
| TASK-07 | TBD | Pending |
| TASK-08 | TBD | Pending |
| TASK-09 | TBD | Pending |
| TASK-10 | TBD | Pending |
| TASK-11 | TBD | Pending |
| TASK-12 | TBD | Pending |
| TASK-13 | TBD | Pending |
| TASK-14 | TBD | Pending |

**Coverage:**
- v1.4 requirements: 45 total
- Mapped to phases: 0
- Unmapped: 45

---
*Requirements defined: 2026-01-24*
*Last updated: 2026-01-24 after initial definition*
