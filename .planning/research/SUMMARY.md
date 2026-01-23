# Project Research Summary

**Project:** SAAP 2026 v2 - v1.3 Document Management & Dashboard Customization
**Domain:** Document Management, Customizable Dashboards
**Researched:** 2026-01-23
**Confidence:** HIGH (verified across multiple official sources and industry patterns)

---

## Executive Summary

The v1.3 milestone adds two complementary features to SAAP: document uploads attached to projects (receipts, invoices) and customizable per-user dashboards with role-based widget restrictions. Research confirms both features follow well-established patterns with strong library support. The recommended approach uses **filesystem storage** with database metadata for documents (leveraging the existing NAS deployment) and **react-grid-layout** for dashboard customization with **JSON-based layout persistence** per user.

The primary technical risks center on Docker/NAS deployment configuration rather than feature complexity. The 1MB default body limit for Server Actions must be increased before any upload implementation, and Docker volume mounts require careful UID matching to prevent file permission issues. Dashboard customization benefits from the existing `@dnd-kit` library already installed, though `react-grid-layout` is recommended specifically for its built-in resize handles and responsive breakpoints essential for dashboard widgets.

The most critical pitfalls to avoid are: (1) storing files in the database instead of filesystem, (2) trusting client-side MIME types without server-side validation, (3) enforcing widget visibility only on the client side, and (4) not versioning the layout JSON schema for future migrations. Following the phased approach below and addressing infrastructure concerns in Phase 1 will prevent these issues.

---

## Key Findings

### Recommended Stack

From STACK.md - specific packages with versions:

| Package | Version | Purpose |
|---------|---------|---------|
| `sharp` | ^0.33.x | Image processing for receipt thumbnails; Next.js recommended |
| `file-type` | ^19.x | Server-side MIME validation from file bytes (security) |
| `react-grid-layout` | ^2.2.x | Dashboard widget grid with drag, drop, and resize |
| `react-resizable` | ^3.1.x | Resize handles (peer dependency of react-grid-layout) |

**Already installed (reuse):**
- `@dnd-kit/core` ^6.3.1 - Keep for Kanban; NOT for dashboard grid
- `@radix-ui/react-dialog` - Upload modal, file preview
- `@radix-ui/react-progress` - Upload progress indicator
- `date-fns` ^4.1.0 - File path date formatting
- `lucide-react` - File type icons

**Do NOT use:**
- `multer`, `formidable` - Next.js 14 native FormData is sufficient
- `mime-types` - Extension-based only; use `file-type` for content validation
- Cloud SDKs (S3) - Overkill for NAS local storage

### Expected Features

From FEATURES.md - prioritized feature list:

**Must Have (Table Stakes):**
- Drag-and-drop upload with click fallback
- File type validation (PDF, PNG, JPG only)
- File size limit (10MB)
- Upload progress indicator
- Document list per project
- Download and delete functionality
- Widget bank/selector for dashboard
- Add/remove widgets
- Drag-and-drop widget positioning
- Widget resize capability
- Layout persistence per user
- Reset to default button
- Admin default layout
- Responsive dashboard behavior

**Should Have (Differentiators):**
- File preview/thumbnail for images
- Document type categorization (RECEIPT, INVOICE, OTHER)
- Role-based widget restrictions
- Date range filter for all dashboard widgets
- Bulk upload support

**Defer to v2+:**
- AI value extraction from receipts
- OCR text extraction
- Document search
- Multiple saved layouts per user
- Real-time data updates (WebSocket)

### Architecture Approach

From ARCHITECTURE.md - major components and data flow:

**Document Management:**
```
Client (Form) --> Server Action --> Filesystem (/uploads/) --> Database (Metadata)
```
- Store files at `/uploads/projects/{projectId}/documents/{uuid}-{filename}`
- Database stores: filename, storagePath, mimeType, sizeBytes, uploadedById
- API route serves files with authentication check
- Cascade delete removes files when document record deleted

**Dashboard Customization:**
```
Page Load --> Get UserPreferences --> Filter by Role --> Render Widgets
User Drag --> @dnd-kit / RGL --> Debounce --> Save to DB
```
- Widget registry defines all widgets with `minRole` requirement
- Layout stored as JSON in `UserPreferences.dashboardLayout`
- Server-side role filtering before returning visible widgets
- Admin default layout in `AdminDefaults` table

**New Prisma Models:**
1. `Document` - File metadata linked to Project
2. `UserPreferences` - Dashboard layout JSON + other settings
3. `AdminDefaults` - System-wide default configurations

### Critical Pitfalls

From PITFALLS.md - top 5 pitfalls with prevention:

| # | Pitfall | Prevention |
|---|---------|------------|
| 1 | **Server Action 1MB body limit** | Configure `bodySizeLimit: '10mb'` in next.config.mjs BEFORE any upload code |
| 2 | **Docker volume file persistence** | Mount NAS directory to `/app/uploads` in docker-compose; files inside container are ephemeral |
| 3 | **MIME type spoofing** | Use `file-type` package to validate actual file bytes, not just extension |
| 4 | **Client-only role checks for widgets** | Server-side filtering of widget list and data endpoints by role |
| 5 | **Layout JSON schema drift** | Include `version` field in layout JSON from day one for migration support |

**Docker/NAS Specific:**
- Container UID must match NAS user UID (typically 1000)
- Backup strategy required for `/uploads/` directory
- API route needed to serve files (not served from /public)

---

## Implications for Roadmap

### Suggested Phases

Based on dependencies identified in architecture research:

**Phase 1: Infrastructure & Schema (1-2 days)**
- Configure `bodySizeLimit` in next.config.mjs
- Add `Document`, `UserPreferences`, `AdminDefaults` models to Prisma
- Update docker-compose.nas.yml with upload volume mount
- Create upload directory structure on NAS
- Set up file serving API route skeleton
- Run migration

*Rationale:* All subsequent work depends on schema and storage being configured correctly. Prevents the most critical pitfalls (body limit, file persistence).

*Pitfalls to avoid:* #1 (body limit), #2 (Docker volume), #5 (schema design)

**Phase 2: Document Management (3-4 days)**
- Implement upload Server Action with validation
- Build document-list component for project detail
- Build document-upload component with drag-drop
- Implement file download API with auth check
- Implement document deletion with file cleanup
- Add Documents tab to project detail page

*Rationale:* Simpler feature that establishes Server Action patterns. Complete before dashboard to reduce parallel complexity.

*Pitfalls to avoid:* #3 (MIME validation), #6 (orphaned files)

**Phase 3: Widget Registry & Role System (1-2 days)**
- Create widget-registry.ts with all existing widgets
- Define WidgetDefinition interface with minRole
- Implement `canAccessWidget()` role checks
- Create `getAvailableWidgets()` server function
- Define TypeScript types for dashboard layout
- Seed AdminDefaults with default layout

*Rationale:* Registry is foundation for dashboard customization. Role system must be server-side from the start.

*Pitfalls to avoid:* #4 (client-only role checks), #12 (no admin default)

**Phase 4: Dashboard Customization UI (3-4 days)**
- Install react-grid-layout and react-resizable
- Import required CSS files
- Create customizable-dashboard.tsx container
- Create widget-wrapper.tsx (draggable/resizable)
- Create widget-picker.tsx modal
- Implement layout save Server Action with debounce
- Replace existing dashboard with customizable version
- Add reset-to-default functionality

*Rationale:* Depends on widget registry and role system being complete.

*Pitfalls to avoid:* #7 (RGL width), #8 (race conditions), #9 (CSS imports), #10 (responsive breakpoints)

**Phase 5: Polish & Testing (1-2 days)**
- Add loading states and error handling
- Implement optimistic updates for drag-drop
- Add document preview modal for images/PDFs
- Test all role combinations (ADMIN, EDITOR, VIEWER)
- Mobile responsive testing
- Verify backup strategy is working

*Rationale:* Integration testing and edge cases after core features complete.

### Research Flags

| Phase | Needs Research? | Notes |
|-------|-----------------|-------|
| Phase 1 | NO | Standard Prisma/Docker patterns |
| Phase 2 | NO | Well-documented Next.js upload patterns |
| Phase 3 | NO | Standard React patterns |
| Phase 4 | MAYBE | react-grid-layout v2 API if issues arise |
| Phase 5 | NO | Testing/polish phase |

**Standard patterns (skip research):** All phases follow established patterns from official documentation. The research files provide sufficient detail for implementation.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack Selection | HIGH | Packages verified via npm; versions confirmed compatible with React 18/Node 20 |
| Document Upload | HIGH | Next.js 14 native FormData well-documented; existing receiptPath pattern in codebase |
| File Security | HIGH | file-type package is standard solution; patterns from official docs |
| Dashboard Layout | HIGH | react-grid-layout is industry standard for dashboards; TypeScript-native v2 |
| Role Restrictions | HIGH | Extends existing permissions.ts pattern in codebase |
| Layout Persistence | HIGH | JSON in Prisma is proven pattern; MariaDB supports it |
| Docker/NAS | MEDIUM | Specific to deployment environment; verify UID configuration |
| Widget Registry | HIGH | Standard React pattern with no external dependencies |

**Overall Confidence: HIGH**

Research sources include official Next.js documentation, npm package documentation, GitHub discussions, and industry case studies. All recommended packages have significant download counts and active maintenance.

---

## Open Questions

Questions requiring user decision during implementation:

1. **Document preview scope:** Support inline PDF/image preview in modal, or download-only?
   - Recommendation: Image preview in modal; PDF opens in new tab (simpler)

2. **Widget data caching:** Cache dashboard widget data or fetch fresh on each render?
   - Recommendation: Fetch fresh initially; add caching if performance issues arise

3. **Layout migration strategy:** When new widgets are added in future versions, auto-add to user layouts?
   - Recommendation: Add to end of layout with visible=true; user can remove

4. **Mobile dashboard customization:** Allow drag-drop on mobile or lock layout?
   - Recommendation: Lock layout on mobile (xs/xxs breakpoints); show view-only

5. **File size limit:** 10MB suggested; adjust based on typical receipt/invoice sizes?
   - Recommendation: Start with 10MB; increase if users report issues

---

## Sources

**File Upload & Storage:**
- Next.js serverActions Config: https://nextjs.org/docs/app/api-reference/config/next-config-js/serverActions
- File Upload with Next.js 14 and Server Actions: https://akoskm.com/file-upload-with-nextjs-14-and-server-actions/
- file-type npm: https://www.npmjs.com/package/file-type
- sharp npm: https://www.npmjs.com/package/sharp

**Dashboard Customization:**
- react-grid-layout GitHub: https://github.com/react-grid-layout/react-grid-layout
- Building Dashboard Widgets with React Grid Layout: https://www.antstack.com/blog/building-customizable-dashboard-widgets-using-react-grid-layout/
- ilert: Why React-Grid-Layout for Dashboards: https://www.ilert.com/blog/building-interactive-dashboards-why-react-grid-layout-was-our-best-choice

**Docker/Deployment:**
- Docker Volumes Documentation: https://docs.docker.com/engine/storage/volumes/
- Next.js Deploying Documentation: https://nextjs.org/docs/app/getting-started/deploying

**Role-Based Access:**
- Permit.io React RBAC: https://www.permit.io/blog/implementing-react-rbac-authorization
- Working with JSON fields (Prisma): https://www.prisma.io/docs/orm/prisma-client/special-fields-and-types/working-with-json-fields

---

*Research completed: 2026-01-23*
*Ready for roadmap: yes*
