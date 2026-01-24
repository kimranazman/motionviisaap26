# Requirements: SAAP 2026 v2

**Defined:** 2026-01-23
**Core Value:** Team can visualize and track initiative progress with secure access, full CRM, and now customizable dashboards with project document management.

## v1.3 Requirements

Requirements for Document Management & Dashboard Customization milestone. Each maps to roadmap phases.

### Document Management

**Upload & Storage:**
- [x] **DOC-01**: User can upload documents to a project via drag-and-drop
- [x] **DOC-02**: User can upload documents via file picker (click fallback)
- [x] **DOC-03**: System validates file type (PDF, PNG, JPG only)
- [x] **DOC-04**: System validates file size (max 10MB)
- [x] **DOC-05**: User sees upload progress indicator during upload
- [x] **DOC-06**: Documents stored in folder by project (`/uploads/projects/{id}/`)
- [x] **DOC-07**: User can upload multiple files at once (bulk upload)

**Document List & Actions:**
- [x] **DOC-08**: User can view list of documents attached to a project
- [x] **DOC-09**: User can download a document
- [x] **DOC-10**: User can delete a document (with confirmation)
- [x] **DOC-11**: User can preview images inline (thumbnail + modal)
- [x] **DOC-12**: User can preview PDF (opens in new tab)

**Document Categorization:**
- [x] **DOC-13**: User can categorize document as RECEIPT, INVOICE, or OTHER
- [x] **DOC-14**: Document list shows category badge
- [x] **DOC-15**: User can filter documents by category

**Project Dates:**
- [x] **DOC-16**: Project has start date field (auto-filled from deal won date or manual)
- [x] **DOC-17**: Project has end date field (manual entry)

### Dashboard Customization

**Widget Selection:**
- [x] **DASH-01**: User can open widget bank/selector
- [x] **DASH-02**: Widget bank shows all available widgets with preview
- [x] **DASH-03**: User can add widget from bank to dashboard
- [x] **DASH-04**: User can remove widget from dashboard

**Widget Arrangement:**
- [x] **DASH-05**: User can drag widgets to reposition
- [x] **DASH-06**: User can resize widgets (predefined size options)
- [x] **DASH-07**: Dashboard layout persists per user
- [x] **DASH-08**: User can reset dashboard to admin default

**Admin Controls:**
- [x] **DASH-09**: Admin can set default layout (new users inherit this)
- [x] **DASH-10**: Admin can restrict widgets by role (e.g., Viewers can't see revenue)
- [x] **DASH-11**: Role restrictions enforced server-side

**Responsive & Filtering:**
- [x] **DASH-12**: Dashboard is responsive across breakpoints
- [x] **DASH-13**: Mobile layout is fixed (no drag-drop on mobile)
- [x] **DASH-14**: User can set date range filter for all widgets
- [x] **DASH-15**: Date filter persists in user preferences

### Infrastructure

- [x] **INFRA-01**: Next.js body size limit configured for 10MB uploads
- [x] **INFRA-02**: Docker volume mount for `/uploads/` directory
- [x] **INFRA-03**: File serving API route with authentication
- [x] **INFRA-04**: Document, UserPreferences, AdminDefaults Prisma models

### AI Document Intelligence

**Invoice Processing (Revenue):**
- [x] **AI-01**: AI parses uploaded invoices and extracts line items (description, quantity, unit price, amount)
- [x] **AI-02**: Invoice totals auto-calculate project revenue
- [x] **AI-03**: User can review and confirm AI-extracted invoice data

**Receipt Processing (Costs):**
- [x] **AI-04**: AI parses uploaded receipts and extracts items with amounts
- [x] **AI-05**: Receipt items auto-create cost entries linked to project
- [x] **AI-06**: AI suggests existing cost categories or creates new ones

**Integration & Context:**
- [x] **AI-07**: Manifest file generated per project folder for AI context
- [x] **AI-08**: Project financials show AI-calculated revenue vs manual costs

## v1.3.1 Requirements

Requirements for Revenue Model Refinement milestone.

### Revenue Model

- [x] **REV-01**: Project has potentialRevenue field set from deal/potential conversion
- [x] **REV-02**: Project revenue field is actual revenue from AI invoices only
- [x] **REV-03**: Manual revenue input removed from project edit form
- [x] **REV-04**: Financials Summary shows potential vs actual with variance
- [x] **REV-05**: Profit card displays correctly without cutoff on all screen sizes

## v1.3.2 Requirements

Requirements for Conversion Visibility & Archive milestone.

### Conversion Visibility

- [ ] **CONV-01**: CONFIRMED potential shows "Converted to Project" badge with project title
- [ ] **CONV-02**: User can click "View Project" on converted potential to navigate to project detail
- [ ] **CONV-03**: Converted potential shows variance (Estimated vs Actual revenue from linked project)
- [ ] **CONV-04**: Converted potential is read-only (edit controls disabled)
- [ ] **CONV-05**: WON deal shows same conversion indicators as potential (badge, View Project, variance, read-only)

### Archive System

- [ ] **ARCH-01**: User can archive completed/converted deals, potentials, and projects
- [ ] **ARCH-02**: Archived items hidden from default list/board views
- [ ] **ARCH-03**: User can toggle "Show Archived" to see archived items
- [ ] **ARCH-04**: User can unarchive items to restore them to active views

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Dashboard Advanced

- **DASH-ADV-01**: Multiple saved layouts per user
- **DASH-ADV-02**: Real-time data updates (WebSocket)
- **DASH-ADV-03**: Custom widget creation

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Document editing in-app | Use external tools; complexity outweighs value |
| Complex folder hierarchies | Flat per-project structure sufficient for 3-person team |
| Pixel-perfect widget positioning | Grid-based positioning is clearer and faster |
| Custom widget creation | Fixed widget set covers needs; defer to v2+ |
| Cloud storage (S3/Cloudinary) | NAS local storage is sufficient and simpler |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| INFRA-01 | Phase 21 | Complete |
| INFRA-02 | Phase 21 | Complete |
| INFRA-03 | Phase 21 | Complete |
| INFRA-04 | Phase 21 | Complete |
| DOC-01 | Phase 22 | Complete |
| DOC-02 | Phase 22 | Complete |
| DOC-03 | Phase 22 | Complete |
| DOC-04 | Phase 22 | Complete |
| DOC-05 | Phase 22 | Complete |
| DOC-06 | Phase 22 | Complete |
| DOC-07 | Phase 22 | Complete |
| DOC-08 | Phase 22 | Complete |
| DOC-09 | Phase 22 | Complete |
| DOC-10 | Phase 22 | Complete |
| DOC-11 | Phase 22 | Complete |
| DOC-12 | Phase 22 | Complete |
| DOC-13 | Phase 22 | Complete |
| DOC-14 | Phase 22 | Complete |
| DOC-15 | Phase 22 | Complete |
| DOC-16 | Phase 22 | Complete |
| DOC-17 | Phase 22 | Complete |
| DASH-01 | Phase 24 | Complete |
| DASH-02 | Phase 24 | Complete |
| DASH-03 | Phase 24 | Complete |
| DASH-04 | Phase 24 | Complete |
| DASH-05 | Phase 24 | Complete |
| DASH-06 | Phase 24 | Complete |
| DASH-07 | Phase 24 | Complete |
| DASH-08 | Phase 24 | Complete |
| DASH-09 | Phase 23 | Complete |
| DASH-10 | Phase 23 | Complete |
| DASH-11 | Phase 23 | Complete |
| DASH-12 | Phase 24 | Complete |
| DASH-13 | Phase 24 | Complete |
| DASH-14 | Phase 24 | Complete |
| DASH-15 | Phase 24 | Complete |
| AI-01 | Phase 25 | Complete |
| AI-02 | Phase 25 | Complete |
| AI-03 | Phase 25 | Complete |
| AI-04 | Phase 25 | Complete |
| AI-05 | Phase 25 | Complete |
| AI-06 | Phase 25 | Complete |
| AI-07 | Phase 25 | Complete |
| AI-08 | Phase 25 | Complete |
| REV-01 | Phase 26 | Complete |
| REV-02 | Phase 26 | Complete |
| REV-03 | Phase 26 | Complete |
| REV-04 | Phase 26 | Complete |
| REV-05 | Phase 26 | Complete |
| CONV-01 | Phase 27 | Pending |
| CONV-02 | Phase 27 | Pending |
| CONV-03 | Phase 27 | Pending |
| CONV-04 | Phase 27 | Pending |
| CONV-05 | Phase 27 | Pending |
| ARCH-01 | Phase 27 | Pending |
| ARCH-02 | Phase 27 | Pending |
| ARCH-03 | Phase 27 | Pending |
| ARCH-04 | Phase 27 | Pending |

**Coverage:**
- v1.3 requirements: 44 total (complete)
- v1.3.1 requirements: 5 total (complete)
- v1.3.2 requirements: 9 total (pending)
- Mapped to phases: 58
- Unmapped: 0

---
*Requirements defined: 2026-01-23*
*Last updated: 2026-01-24 after adding Phase 27 requirements*
