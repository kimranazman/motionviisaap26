# Roadmap: SAAP 2026 v2

## Milestones

- [x] **v1.0 MVP** - Phases 1-3 (shipped 2026-01-20)
- [x] **v1.1 Authentication** - Phases 4-8 (shipped 2026-01-22)
- [x] **v1.2 CRM & Project Financials** - Phases 9-15 (shipped 2026-01-22)
- [x] **v1.2.1 Responsive / Mobile Web** - Phases 16-20 (shipped 2026-01-23)
- [ ] **v1.3 Document Management & Dashboard Customization** - Phases 21-25 (in progress)

## Phases

<details>
<summary>v1.0-v1.2.1 (Phases 1-20) - SHIPPED</summary>

See `.planning/milestones/` for archived phase details.

</details>

### v1.3 Document Management & Dashboard Customization (In Progress)

**Milestone Goal:** Enable project document management (receipts, invoices) with folder-based storage, AI-powered document analysis for revenue/cost extraction, plus customizable per-user dashboards with role-based widget restrictions.

- [x] **Phase 21: Infrastructure & Schema** - Foundation config, Prisma models, Docker volume
- [x] **Phase 22: Document Management** - Upload, list, preview, categorization, project dates
- [ ] **Phase 23: Widget Registry & Roles** - Widget registry, role restrictions, admin defaults
- [ ] **Phase 24: Dashboard Customization UI** - Widget bank, drag-drop, resize, persistence
- [ ] **Phase 25: AI Document Intelligence** - Invoice/receipt parsing, revenue/cost extraction, auto-categorization

## Phase Details

### Phase 21: Infrastructure & Schema
**Goal**: Foundation is configured and ready for document and dashboard features
**Depends on**: Phase 20 (v1.2.1 complete)
**Requirements**: INFRA-01, INFRA-02, INFRA-03, INFRA-04
**Success Criteria** (what must be TRUE):
  1. Next.js accepts 10MB file uploads without error
  2. Docker container persists files to NAS `/uploads/` directory across restarts
  3. Authenticated API route serves files from `/uploads/` with proper access control
  4. Prisma schema includes Document, UserPreferences, AdminDefaults models
**Plans**: 2 plans

Plans:
- [x] 21-01-PLAN.md — Infrastructure config (Next.js body size, Docker volume mount)
- [x] 21-02-PLAN.md — Schema & file serving (Prisma models, file API route, types)

### Phase 22: Document Management
**Goal**: Users can upload, view, and manage documents attached to projects
**Depends on**: Phase 21
**Requirements**: DOC-01, DOC-02, DOC-03, DOC-04, DOC-05, DOC-06, DOC-07, DOC-08, DOC-09, DOC-10, DOC-11, DOC-12, DOC-13, DOC-14, DOC-15, DOC-16, DOC-17
**Success Criteria** (what must be TRUE):
  1. User can upload single or multiple files via drag-drop or file picker to a project
  2. User sees upload progress and gets error feedback for invalid files (wrong type or >10MB)
  3. User can view document list with category badges and filter by category
  4. User can download, preview (images inline, PDF in new tab), and delete documents
  5. User can set project start and end dates
**Plans**: 3 plans

Plans:
- [x] 22-01-PLAN.md — API routes & schema (document CRUD endpoints, project date fields, utils)
- [x] 22-02-PLAN.md — Upload & display components (react-dropzone, upload zone, document card/list, preview)
- [x] 22-03-PLAN.md — Integration (Documents section in ProjectDetailSheet, date pickers)

### Phase 23: Widget Registry & Roles
**Goal**: Widget system foundation with role-based access control for dashboard
**Depends on**: Phase 21 (UserPreferences, AdminDefaults models)
**Requirements**: DASH-09, DASH-10, DASH-11
**Success Criteria** (what must be TRUE):
  1. Widget registry defines all dashboard widgets with role requirements
  2. Admin can set default dashboard layout that new users inherit
  3. Admin can restrict widgets by role (e.g., Viewers cannot see revenue widget)
  4. Role restrictions are enforced server-side (not client-only)
**Plans**: TBD

Plans:
- [ ] 23-01: TBD

### Phase 24: Dashboard Customization UI
**Goal**: Users can customize their dashboard layout with drag-drop, resize, and persistence
**Depends on**: Phase 23 (widget registry and role system)
**Requirements**: DASH-01, DASH-02, DASH-03, DASH-04, DASH-05, DASH-06, DASH-07, DASH-08, DASH-12, DASH-13, DASH-14, DASH-15
**Success Criteria** (what must be TRUE):
  1. User can open widget bank and add/remove widgets from dashboard
  2. User can drag widgets to reposition and resize them
  3. Dashboard layout persists per user across sessions
  4. User can reset dashboard to admin default
  5. Dashboard is responsive (drag-drop disabled on mobile, layout adapts)
  6. User can set date range filter that applies to all widgets and persists
**Plans**: TBD

Plans:
- [ ] 24-01: TBD
- [ ] 24-02: TBD

### Phase 25: AI Document Intelligence
**Goal**: AI automatically extracts financial data from invoices and receipts, calculates revenue/costs, and categorizes line items
**Depends on**: Phase 22 (document management)
**Requirements**: AI-01, AI-02, AI-03, AI-04, AI-05, AI-06, AI-07, AI-08
**Success Criteria** (what must be TRUE):
  1. AI parses uploaded invoices and extracts line items with amounts
  2. Invoice totals auto-calculate project revenue (sum of all invoice line items)
  3. AI parses uploaded receipts and extracts items with amounts
  4. Receipt items auto-create cost entries with appropriate categories
  5. AI suggests existing categories or creates new ones when needed
  6. User can review and confirm AI-extracted data before finalizing
  7. Project financials dashboard shows AI-calculated revenue vs costs
  8. Manifest file generated per project for AI context
**Plans**: TBD

Plans:
- [ ] 25-01: TBD
- [ ] 25-02: TBD
- [ ] 25-03: TBD

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 21. Infrastructure & Schema | v1.3 | 2/2 | Complete | 2026-01-23 |
| 22. Document Management | v1.3 | 3/3 | Complete | 2026-01-23 |
| 23. Widget Registry & Roles | v1.3 | 0/TBD | Not started | - |
| 24. Dashboard Customization UI | v1.3 | 0/TBD | Not started | - |
| 25. AI Document Intelligence | v1.3 | 0/TBD | Not started | - |

---
*Roadmap created: 2026-01-23*
*Last updated: 2026-01-23*
