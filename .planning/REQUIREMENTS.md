# Requirements: SAAP 2026 v2

**Defined:** 2026-01-23
**Core Value:** Team can visualize and track initiative progress with secure access, full CRM, and now customizable dashboards with project document management.

## v1.3 Requirements

Requirements for Document Management & Dashboard Customization milestone. Each maps to roadmap phases.

### Document Management

**Upload & Storage:**
- [ ] **DOC-01**: User can upload documents to a project via drag-and-drop
- [ ] **DOC-02**: User can upload documents via file picker (click fallback)
- [ ] **DOC-03**: System validates file type (PDF, PNG, JPG only)
- [ ] **DOC-04**: System validates file size (max 10MB)
- [ ] **DOC-05**: User sees upload progress indicator during upload
- [ ] **DOC-06**: Documents stored in folder by project (`/uploads/projects/{id}/`)
- [ ] **DOC-07**: User can upload multiple files at once (bulk upload)

**Document List & Actions:**
- [ ] **DOC-08**: User can view list of documents attached to a project
- [ ] **DOC-09**: User can download a document
- [ ] **DOC-10**: User can delete a document (with confirmation)
- [ ] **DOC-11**: User can preview images inline (thumbnail + modal)
- [ ] **DOC-12**: User can preview PDF (opens in new tab)

**Document Categorization:**
- [ ] **DOC-13**: User can categorize document as RECEIPT, INVOICE, or OTHER
- [ ] **DOC-14**: Document list shows category badge
- [ ] **DOC-15**: User can filter documents by category

**Project Dates:**
- [ ] **DOC-16**: Project has start date field (auto-filled from deal won date or manual)
- [ ] **DOC-17**: Project has end date field (manual entry)

### Dashboard Customization

**Widget Selection:**
- [ ] **DASH-01**: User can open widget bank/selector
- [ ] **DASH-02**: Widget bank shows all available widgets with preview
- [ ] **DASH-03**: User can add widget from bank to dashboard
- [ ] **DASH-04**: User can remove widget from dashboard

**Widget Arrangement:**
- [ ] **DASH-05**: User can drag widgets to reposition
- [ ] **DASH-06**: User can resize widgets (predefined size options)
- [ ] **DASH-07**: Dashboard layout persists per user
- [ ] **DASH-08**: User can reset dashboard to admin default

**Admin Controls:**
- [ ] **DASH-09**: Admin can set default layout (new users inherit this)
- [ ] **DASH-10**: Admin can restrict widgets by role (e.g., Viewers can't see revenue)
- [ ] **DASH-11**: Role restrictions enforced server-side

**Responsive & Filtering:**
- [ ] **DASH-12**: Dashboard is responsive across breakpoints
- [ ] **DASH-13**: Mobile layout is fixed (no drag-drop on mobile)
- [ ] **DASH-14**: User can set date range filter for all widgets
- [ ] **DASH-15**: Date filter persists in user preferences

### Infrastructure

- [ ] **INFRA-01**: Next.js body size limit configured for 10MB uploads
- [ ] **INFRA-02**: Docker volume mount for `/uploads/` directory
- [ ] **INFRA-03**: File serving API route with authentication
- [ ] **INFRA-04**: Document, UserPreferences, AdminDefaults Prisma models

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Document Intelligence

- **DOC-AI-01**: AI extraction of values from receipts (Claude Code integration)
- **DOC-AI-02**: OCR text extraction from documents
- **DOC-AI-03**: Full-text search across documents

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
| INFRA-01 | Phase 21 | Pending |
| INFRA-02 | Phase 21 | Pending |
| INFRA-03 | Phase 21 | Pending |
| INFRA-04 | Phase 21 | Pending |
| DOC-01 | Phase 22 | Pending |
| DOC-02 | Phase 22 | Pending |
| DOC-03 | Phase 22 | Pending |
| DOC-04 | Phase 22 | Pending |
| DOC-05 | Phase 22 | Pending |
| DOC-06 | Phase 22 | Pending |
| DOC-07 | Phase 22 | Pending |
| DOC-08 | Phase 22 | Pending |
| DOC-09 | Phase 22 | Pending |
| DOC-10 | Phase 22 | Pending |
| DOC-11 | Phase 22 | Pending |
| DOC-12 | Phase 22 | Pending |
| DOC-13 | Phase 22 | Pending |
| DOC-14 | Phase 22 | Pending |
| DOC-15 | Phase 22 | Pending |
| DOC-16 | Phase 22 | Pending |
| DOC-17 | Phase 22 | Pending |
| DASH-01 | Phase 24 | Pending |
| DASH-02 | Phase 24 | Pending |
| DASH-03 | Phase 24 | Pending |
| DASH-04 | Phase 24 | Pending |
| DASH-05 | Phase 24 | Pending |
| DASH-06 | Phase 24 | Pending |
| DASH-07 | Phase 24 | Pending |
| DASH-08 | Phase 24 | Pending |
| DASH-09 | Phase 23 | Pending |
| DASH-10 | Phase 23 | Pending |
| DASH-11 | Phase 23 | Pending |
| DASH-12 | Phase 24 | Pending |
| DASH-13 | Phase 24 | Pending |
| DASH-14 | Phase 24 | Pending |
| DASH-15 | Phase 24 | Pending |

**Coverage:**
- v1.3 requirements: 36 total
- Mapped to phases: 36
- Unmapped: 0

---
*Requirements defined: 2026-01-23*
*Last updated: 2026-01-23 after v1.3 roadmap creation*
