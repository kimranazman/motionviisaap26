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

---
---

# v1.4 Research Summary: Intelligent Automation & Organization

**Project:** SAAP 2026 v2 - v1.4 Supplier Management, Tasks, AI Matching
**Domain:** Supplier tracking, task hierarchies, activity logging, bidirectional sync, AI semantic matching
**Researched:** 2026-01-24
**Confidence:** HIGH (verified against Prisma docs, established database patterns, industry research)

---

## Executive Summary

The v1.4 milestone transforms SAAP from a basic CRM/project tracker into an intelligent project delivery system with five major feature areas: (1) **Live Project Summary on Pipeline** enabling bidirectional sync between deals and projects, (2) **Supplier Management** with price comparison and AI-powered semantic matching, (3) **Company Departments** for organizational structure, (4) **Enhanced AI Document Intelligence** building on v1.3 document uploads, and (5) **Project Deliverables & Tasks** with infinite hierarchical nesting.

The recommended approach uses **adjacency list with recursive CTEs** for task hierarchies (not closure tables - MariaDB 10.2+ supports CTEs natively), **OpenAI text-embedding-3-small** for semantic matching (Anthropic does not offer embeddings; Claude recommends Voyage AI as partner, but OpenAI is simpler for this scale), and **polymorphic activity logging** with the entity type/ID pattern for audit trails. The most critical technical decision is using raw SQL CTEs for tree queries since Prisma does not support recursive includes natively.

The primary risks center on three areas: (1) **infinite sync loops** between deals and projects without proper sync tokens, (2) **unbounded recursive queries** on deep task hierarchies causing performance issues, and (3) **AI service dependency** without cached embeddings and fallbacks. Following the phased approach below and implementing the pre-identified mitigations will prevent these issues.

---

## Key Findings from v1.4 Research

### From STACK.md (v1.4 Section)

**New Package Required:**

| Package | Version | Purpose | Monthly Cost |
|---------|---------|---------|--------------|
| `openai` | ^4.x | Embeddings API for semantic price comparison | ~$1-5 (API usage) |

**Why OpenAI over alternatives:**
- Anthropic (Claude) does NOT offer embeddings - recommends Voyage AI as partner
- transformers.js has onnxruntime-node size issues (~720MB) breaking Next.js API routes (max 250MB)
- OpenAI text-embedding-3-small is cost-effective ($0.02/1M tokens)
- Simple API, well-documented, production-proven

**No Additional Packages Needed:**
- Task hierarchy uses Prisma self-relations + raw SQL CTEs (built-in)
- Activity logging uses Prisma Client Extensions (built-in since v4.16)
- Data sync uses React useOptimistic + Server Actions (built into Next.js 14)
- Tree view UI uses shadcn-tree-view (copy-paste component, not npm)

**Existing Stack Reuse:**
- `@dnd-kit/*` - Task reordering within tree
- Prisma 6.19.2 - Extensions for activity logging
- MariaDB 10.2+ - Recursive CTEs for tree queries
- `sonner` - Toast notifications for sync feedback

### From FEATURES.md (v1.4 Section)

**Table Stakes (Must Have):**

*Supplier Management:*
- Supplier CRUD with contact info, credit/payment terms
- Link suppliers to project costs
- Total spend per supplier (aggregate)
- Price list per supplier from linked costs

*Task Hierarchy:*
- Task CRUD with status, due date, assignee
- Subtasks with infinite nesting (capped at 5 levels recommended)
- Task comments
- Position-based ordering within siblings

*Deliverables:*
- Deliverable CRUD linked to projects
- AI extraction from quotes (extend v1.3 document parsing)
- Convert deliverable to task

*Activity History:*
- Change log per entity (who, when, what changed)
- Human-readable descriptions
- Per-entity history view

**Differentiators (Should Have):**

*Supplier:*
- Price history tracking over time
- AI semantic matching for same-item comparison
- Preferred supplier flag
- Notes/remarks field

*Tasks:*
- Tags with inheritance to subtasks
- Priority levels (High/Medium/Low)
- Progress indicator (X of Y subtasks complete)
- Collapse/expand subtasks

**Anti-Features (Do NOT Build):**

| Feature | Reason |
|---------|--------|
| Supplier portal/login | Massive complexity for 3-person team |
| RFQ workflow | Overkill; manual quotes via email sufficient |
| Task dependencies/Gantt | Initiatives have Gantt; tasks are simpler |
| Time tracking on tasks | Separate domain; use external tools |
| Real-time price API | No API integration; manual entry only |
| ML price forecasting | Low volume; insufficient data |

### From ARCHITECTURE.md (v1.4 Section)

**Key Schema Additions:**

```
Supplier (NEW)
  |
  +---> Cost (existing, add supplierId FK)

Department (NEW)
  |
  +---> Company (existing, add relation)
  |
  +---> Contact (existing, add departmentId FK)

Deliverable (NEW)
  |
  +---> Project (existing, add relation)
  |
  +---> Task (NEW, optional link)

Task (NEW - self-referencing)
  |
  +---> parentId (self-reference for subtasks)
  |
  +---> projectId (root tasks)
  |
  +---> deliverableId (optional scope link)

ActivityLog (NEW - polymorphic)
  |
  +---> entityType + entityId (polymorphic reference)
  |
  +---> userId (actor)
```

**Critical Self-Reference Pattern (from Prisma docs):**
```prisma
model Task {
  id        String  @id @default(cuid())
  parentId  String? @map("parent_id")
  parent    Task?   @relation("TaskHierarchy", fields: [parentId], references: [id], onDelete: NoAction, onUpdate: NoAction)
  children  Task[]  @relation("TaskHierarchy")
  // ...
}
```
Note: `onDelete: NoAction` required on one side to prevent circular reference issues.

**Query Pattern for Tree (Recursive CTE):**
```typescript
async function getTaskTree(projectId: string) {
  return await prisma.$queryRaw`
    WITH RECURSIVE task_tree AS (
      SELECT *, 0 as level FROM tasks WHERE project_id = ${projectId} AND parent_id IS NULL
      UNION ALL
      SELECT t.*, tt.level + 1
      FROM tasks t
      INNER JOIN task_tree tt ON t.parent_id = tt.id
      WHERE tt.level < 10  -- Safety limit
    )
    SELECT * FROM task_tree ORDER BY level, position
  `;
}
```

**Bidirectional Sync Pattern:**
```
Deal Update --> Check syncToken --> Update Project (skipSync: true) --> Log Activity
Project Update --> Check syncToken --> Update Deal (skipSync: true) --> Log Activity
```
- Sync tokens prevent infinite loops
- `skipSync` flag prevents cascade
- Activity log shows sync source

### From v1.4-PITFALLS.md

**Top 7 Critical Pitfalls:**

| # | Pitfall | Severity | Phase | Prevention |
|---|---------|----------|-------|------------|
| 1 | **Unbounded recursive includes** | CRITICAL | 1 | Use raw SQL CTEs, not nested Prisma includes |
| 2 | **Cascade delete without depth control** | HIGH | 1 | Use `onDelete: SetNull`, implement explicit tree deletion with count confirmation |
| 3 | **Infinite sync loop** | CRITICAL | 1 | Implement sync tokens; `skipSync` flag on updates |
| 4 | **AI embeddings for numerical comparison** | HIGH | 4 | Hybrid approach: semantic matching for items, numerical sorting for prices |
| 5 | **Single similarity threshold** | MEDIUM | 4 | Confidence levels (HIGH/MEDIUM/LOW) with human review for low confidence |
| 6 | **No fallback for AI failure** | HIGH | 4 | Cache embeddings in DB; fall back to keyword matching |
| 7 | **Logging in transaction** | MEDIUM | 2 | Log AFTER transaction commits; fire-and-forget pattern |

**Additional Pitfalls to Monitor:**

| Pitfall | Phase | Prevention |
|---------|-------|------------|
| No maximum depth on tasks | 2 | Enforce 5-level limit server-side |
| Moving tasks creates cycles | 2 | Validate ancestry chain before reparenting |
| UI renders full tree | 3 | Virtualize or lazy-load children |
| Price without history | 1 | Create PriceHistory table from start |
| Price without unit context | 1 | Require unit and pack size fields |
| Activity table bloat | 2 | Polymorphic with indexes; retention policy |
| Over-fetching relationships | ALL | Define select sets per context |
| Missing FK indexes | 1 | Add `@@index` on all foreign keys |

---

## Recommended Stack (v1.4 Summary)

### New Dependencies

```bash
npm install openai
```

### Environment Variables

```env
OPENAI_API_KEY=sk-...
```

### UI Components (Copy-Paste, Not NPM)

```bash
npx shadcn add "https://mrlightful.com/registry/tree-view"
```

### Existing Stack Reuse

| Technology | Use For |
|------------|---------|
| Prisma self-relations | Task hierarchy |
| MariaDB recursive CTEs | Tree queries |
| Prisma Client Extensions | Activity logging |
| React useOptimistic | Sync feedback |
| Server Actions | Sync operations |
| @dnd-kit | Task drag-drop reordering |

---

## Expected Features (v1.4 Priority)

### Must Build (Table Stakes)

1. Supplier CRUD with contact info
2. Supplier-Cost linking (supplierId on Cost)
3. Task CRUD with status, assignee, due date
4. Subtask hierarchy (self-referential)
5. Deliverable CRUD linked to projects
6. Activity log per entity
7. Deal-Project bidirectional sync

### Should Build (Differentiators)

1. Price history tracking with effectiveDate
2. AI semantic matching for price comparison
3. Department under Company
4. Tags on tasks with inheritance
5. AI extraction from quote documents

### Defer to v2+

- Supplier performance scoring
- Task dependencies/Gantt
- Real-time price APIs
- ML forecasting

---

## Architecture Approach (v1.4)

### Entity Relationships

```
Company
  +---> Department (NEW)
  +---> Contact (updated: departmentId)
  +---> Deal --> Project (bidirectional sync)

Project
  +---> Deliverable (NEW)
  +---> Task (NEW, hierarchical)
  +---> Cost --> Supplier (NEW)

Task
  +---> Task (children, self-reference)
  +---> Deliverable (optional link)
```

### Data Flow: Task Tree

```
API Request --> Recursive CTE Query --> Flat list --> Build tree client-side --> Virtualized render
```

### Data Flow: Sync

```
Deal Update --> Generate syncToken --> Update Project (skipSync) --> Log Activity
                                          |
                                          +--> revalidatePath()
```

### Data Flow: Price Comparison

```
User enters item description
    |
    v
Generate embedding (OpenAI)
    |
    v
Vector similarity search (in-memory, cached embeddings)
    |
    v
Filter by threshold (0.7+)
    |
    v
Sort by NUMERICAL price (not similarity)
    |
    v
Display with confidence badge
```

---

## Critical Pitfalls (v1.4 Top 7)

| # | Pitfall | Prevention Strategy |
|---|---------|---------------------|
| 1 | Unbounded recursive includes | Use raw SQL CTEs with `LIMIT`; build tree client-side |
| 2 | Cascade delete scope | `onDelete: SetNull`; require confirmation for large trees (>10 tasks) |
| 3 | Infinite sync loop | Sync tokens; `skipSync` parameter; deduplication map |
| 4 | Embeddings for price sort | Semantic match items THEN numerical sort prices |
| 5 | Single threshold matching | Confidence levels; require review for <0.85 similarity |
| 6 | AI service failure | Cache embeddings in JSON column; keyword fallback |
| 7 | Logging blocks transaction | Log AFTER commit; fire-and-forget with error capture |

---

## Implications for Roadmap (v1.4)

### Suggested Phases

**Phase 1: Schema Foundation (2-3 days)**
- Add Supplier model with SupplierStatus enum
- Add supplierId to Cost model
- Add Department model under Company
- Add departmentId to Contact model
- Add ActivityLog model (polymorphic)
- Add Task model with self-reference
- Add Deliverable model
- Run migrations
- Add all `@@index` on foreign keys

*Rationale:* All subsequent work depends on schema. Self-reference pattern must be correct from start.

*Pitfalls to avoid:* #1 (schema design), #2 (cascade config), #7 (price schema)

**Phase 2: Supplier & Cost Integration (2-3 days)**
- Supplier CRUD API routes
- SupplierSelect component for Cost form
- Supplier list/detail pages
- Total spend aggregation
- Price list per supplier

*Rationale:* Independent feature, no dependencies on other v1.4 features.

*Pitfalls to avoid:* #7 (price without unit)

**Phase 3: Task Hierarchy (3-4 days)**
- Task CRUD API with depth validation
- Recursive CTE queries for tree fetch
- TaskTree UI component (virtualized)
- Subtask creation (POST /tasks/{id}/subtasks)
- Task reordering with @dnd-kit
- Cycle detection on move operations

*Rationale:* Complex feature requiring careful implementation. Core to project delivery tracking.

*Pitfalls to avoid:* #1 (recursive includes), #2 (cascade delete), #3 (no depth limit), #5 (cycles)

**Phase 4: Deliverables (1-2 days)**
- Deliverable CRUD linked to Project
- AI extraction from quote documents (extend v1.3)
- Convert deliverable to task
- Deliverable list on project detail

*Rationale:* Simpler feature building on v1.3 AI parsing.

**Phase 5: Activity Logging (2 days)**
- Activity log API routes
- Prisma Client Extension for auto-logging
- Activity feed component
- Per-entity history view
- Retention policy implementation

*Rationale:* Touches all entities, implement after other CRUD is stable.

*Pitfalls to avoid:* #6 (logging in transaction), #8 (table bloat)

**Phase 6: Bidirectional Sync (2-3 days)**
- Sync token generation utility
- Deal-to-Project sync with skipSync
- Project-to-Deal sync with skipSync
- SyncIndicator component
- Sync event in activity log
- Field ownership rules

*Rationale:* Requires Activity logging for visibility. Most complex integration.

*Pitfalls to avoid:* #3 (infinite loop), #4 (no conflict resolution)

**Phase 7: AI Price Comparison (2-3 days)**
- OpenAI client setup
- Embedding generation on SupplierItem create
- Embedding cache in JSON column
- Comparison API endpoint
- Price comparison UI with confidence
- Keyword fallback implementation

*Rationale:* Final feature requiring embeddings infrastructure.

*Pitfalls to avoid:* #4 (semantic for numbers), #5 (single threshold), #6 (no fallback)

**Phase 8: Department & Polish (1-2 days)**
- Department CRUD under Company
- DepartmentSelect on Contact form
- Integration testing all features
- Mobile responsive testing
- Performance testing (large task trees)

### Research Flags

| Phase | Needs Research? | Notes |
|-------|-----------------|-------|
| Phase 1 | NO | Prisma self-relations well-documented |
| Phase 2 | NO | Standard CRUD patterns |
| Phase 3 | MAYBE | Recursive CTE syntax for MariaDB if issues |
| Phase 4 | NO | Extends v1.3 AI patterns |
| Phase 5 | NO | Prisma extensions documented |
| Phase 6 | MAYBE | Sync edge cases if complex |
| Phase 7 | MAYBE | OpenAI API specifics if issues |
| Phase 8 | NO | Polish phase |

---

## Confidence Assessment (v1.4)

| Area | Confidence | Notes |
|------|------------|-------|
| Supplier Schema | HIGH | Simple entity, follows existing patterns |
| Task Self-Reference | HIGH | Verified with Prisma official documentation |
| Task Query Depth | MEDIUM | 3-4 levels in Prisma; unlimited requires raw SQL |
| Department Schema | HIGH | Simple child entity pattern |
| Deliverable Schema | HIGH | Follows Project-child patterns |
| ActivityLog Polymorphic | HIGH | Common pattern, community examples |
| Bidirectional Sync | MEDIUM | Complex; sync tokens well-documented but edge cases possible |
| AI Embeddings | HIGH | OpenAI API well-documented |
| AI Matching Accuracy | MEDIUM | Depends on data quality; threshold tuning needed |
| Build Order | HIGH | Dependencies clearly mapped |

**Overall Confidence: HIGH**

Research verified against official Prisma documentation, OpenAI API docs, database pattern literature, and established community patterns. All patterns have production examples.

---

## Gaps to Address

1. **SupplierQuoteItem vs Cost:** Research shows two approaches - should suppliers have their own quote items table, or reuse existing Cost model? Recommendation: Use Cost with supplierId link; add SupplierQuoteItem only if distinct price list feature needed later.

2. **Embedding Storage Format:** MariaDB lacks native vector type. Research confirms JSON column is sufficient for <10K items with in-memory comparison. For larger scale, would need PostgreSQL with pgvector.

3. **Tree Virtualization Library:** Research mentions react-vtree but shadcn-tree-view may be sufficient for 3-person team scale. Implement basic first, virtualize if performance issues.

4. **Sync Conflict Resolution:** Research defines field ownership but what happens when both sides edited? Recommendation: Timestamp-based resolution with "last write wins" and clear activity log.

---

## Sources (v1.4)

**Task Hierarchy:**
- Prisma Self-Relations: https://www.prisma.io/docs/orm/prisma-schema/data-model/relations/self-relations
- Prisma Recursive Issue #3725: https://github.com/prisma/prisma/issues/3725
- MariaDB Recursive CTEs: https://mariadb.com/docs/server/reference/sql-statements/data-manipulation/selecting-data/common-table-expressions/recursive-common-table-expressions-overview

**AI Embeddings:**
- OpenAI Embeddings API: https://platform.openai.com/docs/guides/embeddings
- Anthropic Embeddings (recommends partners): https://docs.anthropic.com/en/docs/build-with-claude/embeddings
- text-embedding-3-small: https://platform.openai.com/docs/models/text-embedding-3-small

**Activity Logging:**
- Prisma Client Extensions: https://www.prisma.io/docs/orm/prisma-client/client-extensions
- Database Audit Logging: https://vertabelo.com/blog/database-design-for-audit-logging/

**Bidirectional Sync:**
- Preventing Sync Loops: https://www.workato.com/product-hub/how-to-prevent-infinite-loops-in-bi-directional-data-syncs/
- Data Sync Patterns: https://dev3lop.com/bidirectional-data-synchronization-patterns-between-systems/

**Price History:**
- Price History Database Model: https://vertabelo.com/blog/price-history-database-model/

**UI Components:**
- shadcn-tree-view: https://github.com/MrLightful/shadcn-tree-view
- React useOptimistic: https://react.dev/reference/react/useOptimistic

---

*v1.4 Research completed: 2026-01-24*
*Ready for roadmap: yes*

---
---

# v1.5 Research Summary: Initiative Intelligence & Export

**Project:** SAAP 2026 v2 -- v1.5 Initiative Intelligence & Export
**Domain:** OKR/Initiative Management with KPI Tracking, Date Intelligence & Excel Export
**Researched:** 2026-01-26
**Confidence:** HIGH

---

## Executive Summary

v1.5 transforms the existing flat initiative list into a strategic intelligence layer. The milestone adds five capabilities: a "By Objective" hierarchical view (Objective > Key Result > Initiative), KPI tracking with target/actual metrics auto-calculated from linked projects, inline linked project visibility, date intelligence with overdue/overlap flags, and Excel export. The target is a 3-person team managing 28 initiatives across 2 objectives with ~50 linked projects -- a small, well-scoped dataset that eliminates most scalability concerns and keeps every feature buildable with the existing stack.

The recommended approach requires **zero new npm dependencies**. The existing stack -- shadcn/ui (Table, Collapsible, Progress, Badge), Recharts v3, date-fns v4, and SheetJS xlsx v0.18.5 -- covers all needs. The architecture is additive: a new `/objectives` route with its own server-side data fetch, 14 new files (components + utilities), and 5 new nullable fields on the Initiative Prisma model. No existing views, routes, or components require breaking changes. The schema migration is safe -- all new fields are nullable or have defaults.

The key risks are: (1) free-text `keyResult` field fragility causing broken grouping if users type inconsistent values -- mitigated by normalizing on read and switching the input to a ComboBox; (2) KPI auto-calculation edge cases with null/zero values causing NaN or misleading percentages -- mitigated by explicit null-handling rules designed before any UI work; (3) the xlsx v0.18.5 CVE-2023-30533 vulnerability -- which does NOT affect export-only usage (confirmed by SheetJS advisory). Server-side export via API route is the correct approach for the NAS deployment.

---

## Key Findings

### Recommended Stack

Zero new packages. Every technology needed is already installed and proven in the codebase.

**Core technologies leveraged:**
- **shadcn/ui Table + Collapsible**: Hierarchy view -- custom collapsible table rows for 3-level grouping, proven pattern from community (GitHub issue #4736, DEV article). TanStack Table rejected as overkill for ~50 rows.
- **shadcn/ui Progress + Recharts v3**: KPI visualization -- inline progress bars and radial gauges for target/actual comparison. Already used in 3+ dashboard components.
- **date-fns v4**: Date intelligence -- `areIntervalsOverlapping`, `differenceInDays`, `isPast`, `intervalToDuration`. Already used in 12+ files. v4 handles reversed intervals gracefully.
- **xlsx (SheetJS) v0.18.5**: Excel export -- server-side XLSX generation via `json_to_sheet` + `write`. Export-only use is explicitly safe per SheetJS CVE advisory. No need for ExcelJS.
- **Prisma + MariaDB**: 5 new nullable fields on Initiative model. Single query with `include: { projects }` for hierarchy data. Performance is trivial at this scale (~28 initiatives, ~50 projects).

**Critical version note:** xlsx v0.18.5 CVE-2023-30533 affects read/parse operations only. Export workflows are unaffected. Do not use xlsx to parse untrusted files.

See: `.planning/research/v1.5-STACK.md`

### Expected Features

**Must have (table stakes -- P0):**
- By Objective hierarchy view (Objective > KR > Initiative with expand/collapse)
- KPI target/actual fields on Initiative model
- Overdue detection (endDate < today for non-completed initiatives)
- Full text display for initiative titles (remove truncation)

**Should have (ship with milestone -- P1):**
- KPI auto-calculation from linked project revenue
- KPI manual override with visual indicator
- KPI progress bar with color coding (green >80%, yellow 50-80%, red <50%)
- Linked project inline display (title, status, revenue, cost)
- Ending soon / late start date warnings
- Excel export with all columns (hierarchy, KPIs, dates, linked projects)

**Nice to have (if time allows -- P2):**
- KR/Objective level KPI rollup
- Long duration flag, invalid date validation
- Owner overlap/workload detection (>3 concurrent initiatives)
- Date intelligence summary banner

**Defer (v2+):**
- KeyResult as first-class entity (separate model)
- Objective progress dashboard widget
- Cross-initiative dependency mapping
- Quarter-over-quarter comparison
- KPI history/trending

**Anti-features (do NOT build):**
- Visual tree diagram (overkill for 2 objectives)
- Weighted KPI scoring (3-person team does not need formulas)
- OKR confidence voting (absurd for 3 people)
- PDF export with charts (Excel is more useful)
- Real-time KPI updates (page refresh is fine)
- Drag-and-drop reordering in hierarchy

See: `.planning/research/v1.5-FEATURES.md`

### Architecture Approach

The architecture is additive -- a new `/objectives` sidebar route with its own Server Component data fetch, a tree of 8 new client components under `components/objectives/`, 3 new utility modules, and one new API endpoint (`/api/initiatives/export`). Existing initiative views (list, kanban, timeline, calendar) remain untouched. The "By Objective" view is a separate route, NOT a tab on the existing page, because it has a distinct data requirement (must include `projects` relation) and follows the established pattern where each view is a top-level sidebar entry. Schema changes are 5 nullable fields on Initiative, with a single additive migration.

**Major components:**
1. **`/objectives` route (Server Component)** -- fetches initiatives + projects, serializes Decimals/Dates, passes to client hierarchy component
2. **ObjectiveHierarchy (Client)** -- groups data by Objective > KR, manages expand/collapse state (Set-based, following TaskTree pattern), renders hierarchy
3. **Leaf components (KpiInline, DateIntelligenceBadge, LinkedProjectsInline)** -- stateless presentational components consuming data from parent
4. **Utility modules (date-utils, kpi-utils, group-utils)** -- pure functions for business logic, testable without rendering
5. **Export API route (`/api/initiatives/export`)** -- server-side XLSX generation, returns binary Response with Content-Disposition header

**Key architecture decisions:**
- Server Component fetch (NOT client-side useEffect) -- consistent with all existing pages
- Separate route (NOT tabs) -- avoids refactoring existing views and respects distinct data requirements
- No KeyResult model -- `keyResult` VarChar grouping via client-side `groupBy` is sufficient for ~8 KRs
- No stored computed KPIs -- auto-calculated values computed at query time, only manual overrides stored
- Server-side export -- avoids 200KB xlsx client bundle, cleaner error handling, NAS-appropriate

See: `.planning/research/v1.5-ARCHITECTURE.md`

### Critical Pitfalls

1. **Free-text keyResult grouping fragility** -- The `keyResult` VarChar(20) field has no input constraints. Inconsistent casing/spacing ("KR1.1" vs "KR 1.1") will break hierarchy grouping. **Avoid:** Normalize on read (`trim().toUpperCase()`), replace Input with ComboBox showing existing values as suggestions. Address in Phase 2 before building any hierarchy components.

2. **KPI auto-calculation edge cases** -- Initiatives with 0 linked projects, null revenue, or zero targets will produce NaN/Infinity/misleading percentages. **Avoid:** Define explicit null-handling rules upfront: no projects = "No data" (not 0%), zero target = show absolute only (never divide), null revenue = treat as 0 for sum but display "No data" distinctly. Guard every division. Address in Phase 3.

3. **Manual KPI override silently overwritten** -- Auto-calculation could overwrite user-set values. **Avoid:** `kpiManualOverride` boolean flag on the model. When true, skip auto-calculation entirely. Show visual indicator "(manual)" vs "(auto)". Never auto-write to `kpiActual` when override is true. Address in Phase 3.

4. **Expand/collapse state lost on data refresh** -- Naive implementation resets tree state when parent re-renders. **Avoid:** Store expand state in parent component using Set<string> with stable IDs (objective enum + KR string), following the proven TaskTree pattern. Default all expanded for ~28 items. Address in Phase 2.

5. **Timeline overlap detection ambiguity** -- "Overlap" is undefined: same person? same KR? same department? Without scope, the feature flags everything or the wrong things. **Avoid:** Start with person-overlap only (same `personInCharge` with overlapping date ranges) -- most concrete and actionable for a 3-person team. Defer KR and department overlap to v1.5.x. Address in Phase 4.

See: `.planning/research/PITFALLS.md`

---

## Implications for Roadmap

Based on combined research, the milestone has a clear dependency chain that dictates build order. The FEATURES research identified the dependency graph (Hierarchy View -> KPI + Dates -> Linked Projects -> Export), the ARCHITECTURE research validated it with component dependencies, and the PITFALLS research flagged which phases need upfront design decisions.

### Phase 1: Schema + Utilities Foundation

**Rationale:** Every subsequent phase depends on the KPI fields existing in the schema and the utility functions being available. This is the irreducible foundation.
**Delivers:** Prisma migration with 5 KPI fields, 3 utility modules (date-utils, kpi-utils, group-utils), and the `/api/initiatives/export` route stub.
**Addresses:** Schema changes from FEATURES (KPI fields), utility modules from ARCHITECTURE.
**Avoids:** Pitfall #2 (KPI edge cases) by designing null-handling rules in kpi-utils upfront, Pitfall #9 (manual override overwrite) by implementing the override flag correctly from day one.

### Phase 2: By Objective Hierarchy View

**Rationale:** The hierarchy view is the visual foundation that all other features attach to. KPI progress bars, date badges, and linked project chips all render inside initiative rows within this hierarchy. Cannot build those features without the container.
**Delivers:** `/objectives` route, ObjectiveHierarchy component, ObjectiveGroup, KeyResultGroup, InitiativeRow, HierarchySummaryBar, sidebar navigation update.
**Addresses:** By Objective view (P0), full text wrapping (P0), view navigation.
**Avoids:** Pitfall #1 (keyResult grouping fragility) by normalizing on read and using ComboBox for input, Pitfall #3 (tight coupling) by making it a separate route with its own data fetch, Pitfall #5 (expand state loss) by following TaskTree pattern.

### Phase 3: KPI Tracking + Linked Projects

**Rationale:** KPI display and linked project visibility are tightly coupled -- auto-calculation derives KPI values from linked project data. Building them together ensures the data flow is coherent. Both attach to InitiativeRow built in Phase 2.
**Delivers:** KpiInline component, LinkedProjectsInline component, KPI section in initiative-form.tsx, auto-calculation logic, manual override toggle, PATCH/PUT API enhancements for KPI fields.
**Addresses:** KPI target/actual (P0), auto-calc (P1), manual override (P1), progress bars (P1), linked project display (P1).
**Avoids:** Pitfall #2 (null/zero edge cases) with pre-designed null-handling, Pitfall #9 (override overwrite) with kpiManualOverride boolean, Pitfall #8 (N+1 queries) with Prisma include in single query.

### Phase 4: Date Intelligence

**Rationale:** Date flags are independent of KPI but depend on initiative rows existing in the hierarchy (Phase 2). They enrich the view with operational intelligence.
**Delivers:** DateIntelligenceBadge component, overdue/ending-soon/late-start/invalid-date flags, owner overlap detection (person-scoped).
**Addresses:** Overdue flag (P0), ending soon (P1), late start (P1), long duration (P2), invalid dates (P2), owner overlap (P2).
**Avoids:** Pitfall #6 (arbitrary thresholds) by analyzing actual initiative duration distribution before setting thresholds, Pitfall #10 (overlap ambiguity) by scoping to person-overlap only.

### Phase 5: Excel Export

**Rationale:** Export comes last because it serializes ALL data from the other features. Building it last means all columns are known and the export route does not need rework as features add data.
**Delivers:** ExportButton component, `/api/initiatives/export` route (full implementation), XLSX file with all columns (hierarchy, KPIs, dates, linked projects).
**Addresses:** Excel export (P1) with all 20 recommended columns.
**Avoids:** Pitfall #4 (xlsx vulnerability) -- export-only use is safe per SheetJS advisory, Pitfall #7 (NAS resource) -- server-side generation of 28 rows completes in <100ms even on NAS.

### Phase 6: Polish + Detail View Enhancement

**Rationale:** Final integration phase -- adding KPI display and linked projects to existing detail views (initiative-detail.tsx, initiative-detail-sheet.tsx), moving shared components, and ensuring cross-view consistency.
**Delivers:** KPI section in initiative detail view, linked project display in kanban detail sheet, initiative-detail-sheet moved to shared location, date intelligence in detail views.
**Addresses:** Cross-view consistency, existing component enhancements.

### Phase Ordering Rationale

- **Schema first** because all features depend on KPI fields existing in the database
- **Hierarchy view second** because it is the visual container for all subsequent features (KPI bars, date badges, project chips all render inside hierarchy rows)
- **KPI + linked projects together** because auto-calculation requires project data, making them a natural unit of work
- **Date intelligence fourth** because it is independently testable and enriches the hierarchy but does not block other features
- **Export last** because it serializes the output of all other features -- building it last avoids rework
- **Polish last** because cross-view integration is optional refinement, not core functionality

### Research Flags

Phases likely needing review during planning:
- **Phase 3 (KPI + Linked Projects):** Define auto-calculation rules explicitly (which label maps to which aggregation). Document null-handling matrix as acceptance criteria.
- **Phase 4 (Date Intelligence):** Run a quick query on actual initiative durations to set data-driven thresholds. 15-minute data analysis task.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Schema + Utilities):** Prisma migration + TypeScript utility modules. Fully established patterns.
- **Phase 2 (Hierarchy View):** Collapsible + Table pattern documented in shadcn/ui community. TaskTree expand state pattern already proven in codebase.
- **Phase 5 (Excel Export):** SheetJS json_to_sheet + write is a 3-step pattern. Already used in seed script.
- **Phase 6 (Polish):** Additive UI changes to existing components.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Zero new dependencies. All libraries already installed, versioned, and used in the codebase. Stack research verified against package.json and existing usage in 12+ files. |
| Features | HIGH | Feature scope derived from OKR domain research (8+ tools surveyed), validated against existing schema and 28-initiative dataset. Anti-features clearly scoped for 3-person team context. |
| Architecture | HIGH | Architecture is additive -- new route, new components, schema additions. All patterns (Server Component fetch, Collapsible, TaskTree state) already proven in the codebase. |
| Pitfalls | HIGH | Pitfalls identified from domain research (KPI edge cases, free-text grouping) and codebase analysis (expand state, N+1 queries). Prevention strategies reference existing codebase patterns. |

**Overall confidence: HIGH**

All four research dimensions converge on the same conclusion: this milestone is well-scoped, low-risk, and buildable with existing tools. The dataset is small (28 initiatives, ~50 projects), the architecture is additive, and every technology is already installed.

### Gaps to Address

- **keyResult data quality:** Before Phase 2, run a query to check actual `keyResult` values in the database for consistency. If inconsistencies already exist from the import, decide on a normalization strategy (one-time cleanup vs. on-read normalization).
- **Auto-calculation label routing:** The FEATURES research suggests label-based sum routing ("revenue" in label -> sum project revenue). This needs explicit specification during Phase 3 planning -- which labels map to which aggregations, and what is the default.
- **Duration threshold calibration:** Before Phase 4 implementation, query actual initiative durations to determine data-driven thresholds. The PITFALLS research warns against arbitrary round-number thresholds.
- **SheetJS vs ExcelJS resolution:** The STACK and PITFALLS research disagree on whether to use xlsx or ExcelJS. The STACK research conclusively resolves this: xlsx export-only use is safe per SheetJS CVE advisory, and ExcelJS adds ~500KB for features not needed. **Recommendation: Use xlsx (already installed).**
- **View routing resolution:** The ARCHITECTURE research recommends a separate `/objectives` route. The PITFALLS research warns about tight coupling and suggests a shared data layer with view-as-state. **Recommendation: Separate route.** The ARCHITECTURE rationale is stronger -- distinct data requirements (projects include), consistency with existing sidebar pattern, and no refactoring of existing views.

---

## Sources

### Primary (HIGH confidence)
- shadcn/ui documentation and GitHub issues (#4736) -- Collapsible + Table pattern
- date-fns v4 official documentation -- interval/overlap functions
- SheetJS CVE-2023-30533 advisory (git.sheetjs.com) -- export-only safety confirmation
- SheetJS export documentation (docs.sheetjs.com) -- json_to_sheet API
- Prisma documentation -- include/select patterns
- Existing SAAP codebase analysis -- TaskTree, kanban, timeline, calendar patterns

### Secondary (MEDIUM confidence)
- OKR tool surveys (Synergita, Viva Goals, Jira Align, Weekdone, Mooncamp) -- hierarchy view patterns
- KPI tool surveys (Cascade, BSC Designer, PPM Express, monday.com) -- target/actual patterns
- DEV Community article on expandable data tables -- shadcn/ui Collapsible + Table without TanStack
- Power BI KPI Matrix zero-target issue -- edge case documentation

### Tertiary (LOW confidence)
- Duration threshold calibration -- needs validation against actual SAAP data
- Auto-calculation label routing -- needs explicit specification, not just pattern inference

---

*v1.5 Research completed: 2026-01-26*
*Ready for roadmap: yes*

---
---

# v2.3 Research Summary: CRM & UX Improvements

**Project:** SAAP 2026 v2 -- v2.3 CRM & UX Improvements
**Domain:** CRM entity management, modal UX, sidebar customization, line item pricing
**Researched:** 2026-01-28
**Confidence:** HIGH

---

## Executive Summary

v2.3 is a consolidation milestone that improves daily-use workflows rather than introducing new architectural patterns. The six features -- modal scroll fixes, standalone Departments/Contacts pages, Add Task on /tasks, internal project flag, customizable sidebar, and line item pricing history -- are all buildable with **zero new npm dependencies**. Every feature maps directly to patterns already proven in the codebase across 61+ completed phases. This is the most "pattern-reuse-heavy" milestone to date.

The recommended approach starts with **UX bug fixes** (modal scroll, expand-to-page), progresses through **additive CRUD pages** (standalone Departments and Contacts following the `/companies` template), then tackles **schema changes** (internal project flag making `companyId` nullable, sidebar preferences in `UserPreferences`, quantity/unitPrice on Cost). The architecture research confirms that all six features follow the established Server Component page + Client list component + API route pattern. The STACK research explicitly evaluated and rejected 6 packages (zustand, TanStack Table, body-scroll-lock, vaul, SWR, react-checkbox) -- the existing stack covers every need.

The single highest-risk change is **making `Project.companyId` optional** for internal projects. The PITFALLS research identified 26+ files that assume `company` is non-null on projects, including runtime crash points in project cards, pipeline cards, and the AI pending endpoint. This schema change must be done with a full file audit and type-driven refactoring, not incrementally discovered. The second risk area is **line item pricing history**, which requires adding `quantity`/`unitPrice` fields to the Cost model without breaking existing aggregation logic that sums `cost.amount` -- the canonical total must remain `amount`, with quantity/unitPrice as informational fields only.

---

## Key Findings

### Recommended Stack

From v2.3-STACK.md -- zero new packages required. All features buildable with the existing stack.

**Core technologies leveraged (unchanged):**
- **Next.js 14.2.28 (App Router)** -- server components for new pages, API routes for CRUD
- **Prisma 6.19.2** -- schema migrations for 3 model changes (Project, Cost, UserPreferences)
- **Radix UI primitives** -- Dialog scroll fixes (CSS-only), Switch for toggles, Tabs for pricing views
- **shadcn/ui** -- Table, Select, Input, Dialog for new CRUD pages
- **cmdk 1.1.1** -- project selector combobox for task creation dialog

**Packages explicitly evaluated and rejected:**

| Package | Why Rejected |
|---------|-------------|
| `zustand` | React Context + API fetch is the established pattern; 3 users do not need client-state optimization |
| `@tanstack/react-table` | Existing shadcn Table + manual filtering works at this data scale; adding a parallel pattern mid-project is risky |
| `body-scroll-lock` | Radix's built-in `react-remove-scroll` handles this; CSS fixes are sufficient |
| `vaul` | Existing Sheet component with resize already works; switching adds risk |
| `swr` / `@tanstack/react-query` | Existing fetch-in-useEffect is consistent; introducing a data fetching library mid-project fragments the codebase |
| `@radix-ui/react-checkbox` | `@radix-ui/react-switch` (already installed) is more appropriate for on/off toggles |

See: `.planning/research/v2.3-STACK.md`

### Expected Features

From v2.3-FEATURES.md -- prioritized with dependency analysis.

**Must Have (Table Stakes):**
- Modal scroll fix (CSS-only, audit all `DetailView` consumers)
- Expand-to-page consistency (wire `expandHref` on existing modals)
- Standalone Departments page (`/departments`) with company filter
- Standalone Contacts page (`/contacts`) with company + department cascading filters
- Cross-entity navigation links (department -> company, contact -> company/department)
- Department and Contact detail modals (following `CompanyDetailModal` pattern)
- Nav config update (add Departments, Contacts to CRM group)
- Add Task button on `/tasks` page with project selector dialog
- Internal project flag (`isInternal` boolean) with visual badge and filter
- Internal project filter on `/projects` page (All / Client / Internal)

**Should Have (Differentiators):**
- Customizable sidebar (show/hide nav items via Settings, persisted in `UserPreferences`)
- Line item pricing history by-item view (quantity/unitPrice on Cost model)

**Defer to v2.4+:**
- By-client pricing history view
- Pricing trend visualization (sparklines)
- Contact quick-search in header
- Bulk contact import (CSV)
- Drag-to-reorder sidebar items
- Sidebar item badges (counts)

**Anti-Features (do NOT build):**
- Full CRM contact management suite (email tracking, call logging, activity timelines)
- Complex role-based sidebar visibility (3 users do not need per-role presets)
- Real-time pricing alerts (static history page is sufficient)
- Inline sidebar customization (right-click to hide); use Settings page instead
- Pricing prediction / ML models
- Multi-currency pricing history
- Contact activity timeline

See: `.planning/research/v2.3-FEATURES.md`

### Architecture Approach

The architecture is strictly additive. Two new standalone pages (`/departments`, `/contacts`) follow the exact pattern of the existing `/companies` page: server component fetches all records with relations, passes to a client list component with search/filter/table/detail-modal. Task creation on `/tasks` wraps the existing `TaskForm` in a Dialog with a project combobox. Internal projects make `companyId` nullable on the Project model and add conditional rendering throughout. Sidebar customization adds a `sidebarConfig` JSON field to `UserPreferences` and filters nav items at render time. Line item pricing adds `quantity`/`unitPrice` nullable fields to Cost.

**Schema changes (single migration):**
1. `Project.companyId` -- `String` becomes `String?` (nullable); add `isInternal Boolean @default(false)`
2. `Cost` -- add `quantity Decimal?` and `unitPrice Decimal?` (nullable, backward-compatible)
3. `UserPreferences` -- add `sidebarConfig Json?` (same pattern as `dashboardLayout`)

**Key architecture decisions:**
- Add `quantity`/`unitPrice` to existing `Cost` model (NOT a separate `InvoiceLineItem` table) -- the STACK research proposed a new model but the ARCHITECTURE research correctly identifies that costs ARE line items; a separate model over-normalizes
- Use `hiddenItems: string[]` array for sidebar config (NOT a full visibility map) -- default is "show all", new nav items auto-appear, simpler merge logic
- Keep `amount` as canonical total on Cost -- `quantity`/`unitPrice` are informational/audit fields, existing aggregation (`sum(amount)`) remains unchanged

See: `.planning/research/v2.3-ARCHITECTURE.md`

### Critical Pitfalls

From v2.3-PITFALLS.md -- 4 critical, 4 moderate, 4 minor pitfalls identified.

1. **ScrollArea height collapse in Dialog (Critical)** -- Radix `ScrollArea` inside `DialogContent` fails to scroll because `overflow-y-auto` on the container competes with `ScrollArea`'s internal viewport. Fix: remove `overflow-y-auto` from `DialogContent`, give `ScrollArea` explicit bounded height. Test ALL 7 detail sheet types in both dialog and drawer modes.

2. **Expand-to-page renders modal-on-empty-page (Critical)** -- `/projects/[id]` page wraps `ProjectDetailSheet` with `open={true}` instead of rendering content inline. This is not a true full-page view. Fix: extract shared content components (`DetailContent`) usable by both modal and page contexts. Design this pattern before creating any new standalone entity pages.

3. **companyId optional cascades through 26+ files (Critical)** -- Changing `Project.companyId` to nullable triggers runtime crashes (`Cannot read property 'name' of null`) in project cards, pipeline cards, potential cards, supplier detail modal, manifest utils, and the AI pending endpoint. Fix: audit ALL `project.company` references first, change TypeScript interfaces to `company: ... | null`, add null guards everywhere, then apply the schema migration.

4. **Line item pricing breaks Cost aggregation (Critical)** -- Adding `quantity`/`unitPrice` introduces ambiguity about whether `amount` equals `quantity * unitPrice`. Fix: keep `amount` as the canonical total that all aggregation uses. `quantity`/`unitPrice` are informational. Validate that `amount == quantity * unitPrice` (within rounding tolerance) on save, but store all three independently.

5. **AlertDialog inside Dialog focus trap conflict (Moderate)** -- Nested dialog portals can cause focus trap issues when AlertDialog closes. Test the full flow after scroll fixes.

6. **Sidebar customization lock-out (Moderate)** -- Users hiding all nav items creates a disorienting experience. Enforce: Dashboard and Settings always visible, auto-reveal active page if its nav item is hidden, provide "Reset to defaults" button.

7. **Standalone pages duplicate data fetching (Moderate)** -- New entity pages must share data-fetching logic with existing modals to prevent divergence. Extract shared data layer utilities.

8. **AI quantity extraction accuracy for Malaysian invoices (Moderate)** -- Lump sum invoices, Malay language labels, and mixed formats reduce extraction accuracy. Cross-validate `quantity * unitPrice == lineTotal`, default to lump sum when ambiguous.

See: `.planning/research/v2.3-PITFALLS.md`

---

## Implications for Roadmap

Based on combined research, the milestone has a clear dependency structure. Modal fixes must come first (every new feature adds content to modals). CRM pages are independent of each other but both need nav config updates before sidebar customization can be finalized. Internal projects touch the core data model and should be isolated. Line item pricing is the most complex and should come last.

### Phase 1: Modal Scroll + Expand Fixes

**Rationale:** This is a blocking UX fix. Every subsequent feature (CRM pages, pricing history) renders content inside modals. The scroll issue gets worse as more content is added. Fix the foundation before building on it.
**Delivers:** Fixed `DialogContent` scroll behavior, consistent `ScrollArea` usage across all detail sheets, `overscroll-behavior: contain` for mobile, verified expand-to-page behavior.
**Addresses:** Modal scroll fix (table stakes), expand-to-page consistency (table stakes).
**Avoids:** Pitfall #1 (ScrollArea height collapse), Pitfall #2 (modal-on-page), Pitfall #5 (AlertDialog focus trap), Pitfall #9 (iOS bounce).

### Phase 2: Standalone CRM Pages (Departments + Contacts)

**Rationale:** These are additive pages with no schema changes required. Both Department and Contact models already exist. The pages follow the exact pattern of `/companies` -- server fetch, client table, search/filter, detail modal. Building them together ensures consistent patterns and shared nav config update.
**Delivers:** `/departments` page with company filter, `/contacts` page with company + department cascading filter, detail modals for both, cross-entity navigation links, nav config update adding both to CRM group.
**Addresses:** Standalone Departments/Contacts (table stakes), company/department filters (table stakes), nav config update (table stakes), detail modals (table stakes).
**Avoids:** Pitfall #7 (duplicate data fetching) by reusing existing component patterns.

### Phase 3: Task Creation on /tasks Page

**Rationale:** Independent feature with no dependencies on other phases. Missing CRUD entry point that breaks user expectations -- every other list page has an Add button. Uses existing `TaskForm` and `POST /api/projects/[id]/tasks` endpoint.
**Delivers:** Add Task button on `/tasks` toolbar, AddTaskModal with project combobox selector, task form fields reusing existing TaskForm component.
**Addresses:** Add Task button on /tasks (table stakes).
**Avoids:** No significant pitfalls -- uses existing patterns entirely.

### Phase 4: Internal Project Flag

**Rationale:** Isolated in its own phase because it is the most impactful schema change (26+ files affected). Must be done with a full audit checklist, not incrementally. Making `companyId` nullable touches project forms, cards, pipeline cards, potential cards, supplier detail, AI pending endpoint, and manifest utils.
**Delivers:** `isInternal` boolean and nullable `companyId` on Project model, "Internal Project" toggle on project form, "Internal" badge on project cards/detail, project list filter (All / Client / Internal), null guards on all `project.company` references.
**Addresses:** Internal project flag (table stakes), internal project filter (table stakes), internal project visual distinction (table stakes).
**Avoids:** Pitfall #3 (companyId cascade) by doing a full file audit before the schema change, using TypeScript compiler errors to find all crash points.

### Phase 5: Customizable Sidebar Navigation

**Rationale:** Depends on nav config being stable (all new items from Phase 2 already added). Self-contained feature that extends the existing `UserPreferences` pattern. The nav is now 18+ items across 3 groups -- personalization adds real value.
**Delivers:** `sidebarConfig` JSON field on UserPreferences, sidebar customization UI in Settings page (switches per nav item), sidebar rendering that filters hidden items, safeguards (Dashboard/Settings always visible, auto-reveal active page).
**Addresses:** Toggle nav link visibility (table stakes), sidebar customization UI in Settings (table stakes).
**Avoids:** Pitfall #6 (lock-out) with minimum visible set and auto-reveal, Pitfall #10 (localStorage) by using server-side DB persistence.

### Phase 6: Line Item Pricing History

**Rationale:** Most complex feature in v2.3 -- schema change + form update + AI import pipeline modification + new query views. Saved for last so all other features are stable. The schema change is additive (nullable fields) so it does not break existing data.
**Delivers:** `quantity` and `unitPrice` nullable fields on Cost model, updated CostForm with optional quantity/unitPrice inputs and auto-calculation, updated receipt import to persist quantity/unitPrice from AI extraction, updated supplier-items page with unit price column for comparison.
**Addresses:** Line item pricing history by-item view (differentiator), AI-extracted line item detail persistence (differentiator).
**Avoids:** Pitfall #4 (amount ambiguity) by keeping `amount` as canonical total, Pitfall #8 (AI extraction accuracy) with cross-validation rules and lump-sum defaults.

### Phase Ordering Rationale

- **Modal fixes first** because every subsequent feature adds content to modals, making scroll issues worse
- **CRM pages second** because they have no schema dependencies and establish the component patterns used by subsequent phases
- **Task creation third** because it is independent and quick -- a single dialog wrapping an existing form
- **Internal projects fourth** because the 26+ file cascade must be done in isolation to catch regressions cleanly, and it benefits from CRM pages being stable
- **Sidebar customization fifth** because it depends on nav config being finalized (new CRM items added in Phase 2)
- **Line item pricing last** because it is the most complex integration (schema + AI pipeline + forms + display) and benefits from all other changes being stable

### Research Flags

Phases likely needing deeper review during planning:
- **Phase 4 (Internal Projects):** Needs a comprehensive file audit of all `project.company` references before implementation. TypeScript compiler will surface most issues, but template strings and dynamic access patterns may be missed.
- **Phase 6 (Line Item Pricing):** Needs clarification on whether the receipt import pipeline should auto-persist quantity/unitPrice or require manual review. The existing PENDING -> ANALYZED -> IMPORTED flow already has a review step -- leverage it.

Phases with standard patterns (skip research):
- **Phase 1 (Modal Scroll):** CSS-only fixes verified against Radix docs and shadcn issues.
- **Phase 2 (CRM Pages):** Copy-paste pattern from existing `/companies` page. No unknowns.
- **Phase 3 (Task Creation):** Wraps existing `TaskForm` in a Dialog. Trivial integration.
- **Phase 5 (Sidebar Customization):** Mirrors existing `detailViewMode` preference pattern exactly.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Zero new dependencies. All libraries already installed and battle-tested across 61+ phases. Stack research verified against package.json and explicitly rejected 6 alternative packages. |
| Features | HIGH | Feature scope grounded in direct codebase analysis. Anti-features clearly scoped for 3-person team. Complexity estimates provided (48.5h total). |
| Architecture | HIGH | Every feature follows an existing pattern proven in the codebase. Schema changes are additive or nullable. Build order validated against component dependencies. |
| Pitfalls | HIGH | 12 pitfalls identified from codebase analysis, Radix/shadcn issue trackers, and domain research. The companyId cascade (Pitfall #3) was verified with a file-by-file audit identifying 26+ affected files. |

**Overall confidence: HIGH**

This is the highest-confidence milestone researched to date. The reason is simple: every feature is a variation of a pattern already implemented in the codebase. The risk profile is dominated by one factor -- the `companyId` nullable migration -- which is well-understood and preventable with a systematic audit.

### Gaps to Address

- **STACK vs ARCHITECTURE disagreement on pricing model:** The STACK research proposes a new `InvoiceLineItem` Prisma model for client-side pricing. The ARCHITECTURE research recommends adding `quantity`/`unitPrice` to the existing `Cost` model. **Resolution: Use the ARCHITECTURE approach (extend Cost).** The Cost model IS the line item store. A separate model creates unnecessary complexity and fragmented queries. Client-side invoice line items (revenue) are already handled by `project.revenue` -- granular line item tracking is a v2.4+ concern.

- **Expand-to-page pattern design:** The current `/projects/[id]` page renders a modal on an empty page. Before creating CRM standalone pages, the team should decide: (a) fix the project detail page first as a template, or (b) accept modal-on-page as the pattern for now. **Recommendation: Accept the current pattern for v2.3** -- fixing it requires extracting shared content components which is a significant refactor. Note this as tech debt for v2.4.

- **Receipt vs Invoice import for pricing:** The ARCHITECTURE research correctly identifies that receipt import (supplier expenses) creates Cost entries, while invoice import (client revenue) only updates `project.revenue`. For supplier pricing history, the focus should be on receipt import pipeline. The invoice import creating Cost entries would conflate revenue with expenses. **Recommendation: Only update receipt import to persist quantity/unitPrice.**

---

## Sources

### Primary (HIGH confidence)
- Radix Dialog/ScrollArea documentation and known issues (Issue #2307, shadcn #16, PR #8103)
- Prisma documentation -- optional relations, nullable columns, JSON fields
- Direct codebase analysis -- 20+ files audited for companyId references, dialog.tsx, detail-view.tsx, nav-config.ts patterns
- shadcn/ui Sidebar documentation -- persistence patterns for sidebar state

### Secondary (MEDIUM confidence)
- Radix Primitives discussions (#1586) -- react-remove-scroll shifting fixed headers
- Redgate and Vertabelo -- invoice line item and billing system schema design patterns
- UX Planet, Nielsen Norman Group -- sidebar navigation best practices

### Tertiary (LOW confidence)
- Invoice OCR accuracy benchmarks (Mindee, AIMutliple) -- AI quantity extraction reliability
- iOS Safari elastic bounce behavior -- needs runtime verification on actual devices

---

*v2.3 Research completed: 2026-01-28*
*Ready for roadmap: yes*

---
---

# v2.4 Research Summary: Settings, Sidebar & Bug Fixes

**Project:** SAAP 2026 v2 -- v2.4 Settings, Sidebar & Bug Fixes
**Domain:** Sidebar navigation behavior, settings UX, drag-and-drop reordering, nested nav links, dashboard revenue accuracy, admin field configuration
**Researched:** 2026-01-28
**Confidence:** HIGH

---

## Executive Summary

v2.4 is a **code-only milestone** that requires zero new npm packages. All seven features build on libraries already installed and battle-tested across 67+ completed phases: `@dnd-kit/core@6.3.1` and `@dnd-kit/sortable@10.0.0` (used in 12 files for kanban/pipeline/tasks), `@radix-ui/react-collapsible@1.1.12` (used in `nav-group.tsx`), `sonner@2.0.7` (used in 5+ components), and Prisma with JSON fields (proven pattern in `UserPreferences` and `AdminDefaults`). The milestone has two schema additions -- `navItemOrder Json?` on `UserPreferences` and `hiddenFieldsInternal Json?` on `AdminDefaults` -- both nullable and non-destructive.

The sidebar subsystem is the primary integration risk. Four of seven features modify the same cluster of files (`nav-config.ts`, `use-nav-visibility.ts`, `nav-group.tsx`, `sidebar.tsx`, `settings/page.tsx`). Research identified a strict dependency chain: autoReveal bug fix first (removes problematic auto-mutation), then batch save pattern (replaces fire-and-forget persistence), then nested nav links (structural change to `NavItem` type), then drag-and-drop reorder (builds on the stable nested structure). The three independent features -- completed projects editable, admin field visibility, and revenue widget fix -- can be interleaved freely.

The most critical finding is that **the "completed projects editable" feature may be a no-op**. Direct codebase analysis found no status-based read-only guard on projects -- `canEdit()` in `permissions.ts` checks user role only, and `project-detail-sheet.tsx` renders all fields editable regardless of status. The API route has no status guard either. This needs verification in the running app before planning any code changes. The second critical finding is the **autoReveal race condition**: the fire-and-forget PATCH pattern in `use-nav-visibility.ts` has no concurrency protection, meaning simultaneous `toggleItem` and `autoReveal` calls can overwrite each other's state. The batch save pattern (explicit Save button) resolves this by design.

---

## Key Findings

### Recommended Stack

From v2.4-STACK.md -- zero new packages. This is a pure code milestone.

**Core technologies leveraged (all already installed):**
- **@dnd-kit/core@6.3.1 + @dnd-kit/sortable@10.0.0** -- sidebar drag-and-drop reordering in Settings, replicating the proven kanban-board.tsx pattern with `verticalListSortingStrategy`
- **@radix-ui/react-collapsible@1.1.12** -- nested sidebar links (Company > Departments/Contacts), extending the existing group collapse pattern in `nav-group.tsx`
- **sonner@2.0.7** -- toast feedback for Settings save (`toast.success('Settings saved')`)
- **Prisma 6.19.2** -- two new nullable JSON fields (`navItemOrder`, `hiddenFieldsInternal`)
- **@radix-ui/react-switch@1.2.6** -- toggle switches for field visibility admin config (already in Settings)

**No new packages evaluated or needed.** The STACK research verified all package versions against `node_modules` and confirmed API compatibility.

See: `.planning/research/v2.4-STACK.md`

### Expected Features

From v2.4-FEATURES.md -- 7 features with clear dependency chain.

**Must Have (Table Stakes):**
- **F-01: autoReveal fix** -- Hidden nav items stay hidden regardless of URL navigation. Remove or guard the `autoReveal` function that auto-unhides items on pathname match.
- **F-02: Settings save button** -- Replace fire-and-forget toggle persistence with explicit Save/Reset buttons and dirty tracking. Single PATCH call on save with toast confirmation.
- **F-03: Completed projects editable** -- Confirm current behavior (already editable) or remove any hidden restrictions. Likely a no-op requiring documentation only.
- **F-04: Revenue widget accuracy** -- CRM KPI revenue card uses `revenue ?? potentialRevenue` per project instead of only summing `revenue`. Include ACTIVE and COMPLETED projects.

**Should Have (Differentiators):**
- **F-05: Nested sidebar links** -- Companies becomes a parent with Departments and Contacts as indented sub-items. Extend `NavItem` with optional `children?: NavItem[]`.
- **F-06: Sidebar drag-and-drop reorder** -- Users reorder nav items within groups via Settings page DnD. Persisted per-user in `UserPreferences.navItemOrder`.
- **F-07: Admin field visibility for internal projects** -- Admin configures which fields show/hide for internal projects via `AdminDefaults.hiddenFieldsInternal`.

**Defer to post-v2.4:**
- Drag-to-reorder sidebar items (F-06 is medium-high complexity, defer if time is tight)
- Admin field visibility config (F-07 is medium-high complexity, current hardcoded logic works)

**Anti-Features (do NOT build):**
- Full RBAC on project status transitions (3 users, trust each other)
- Complex sidebar configuration UI with live preview/themes
- Per-widget revenue configuration (one consistent definition)
- Multi-level sidebar nesting (3+ levels is a UX anti-pattern)
- User-configurable sidebar groups (groups are stable organizational structure)
- Auto-save timer for settings (contradicts explicit Save button)

See: `.planning/research/v2.4-FEATURES.md`

### Architecture Approach

From v2.4-ARCHITECTURE.md -- four sidebar features form a sequential chain; three features are independent.

The sidebar subsystem has a clean separation today: `nav-config.ts` (static structure), `use-nav-visibility.ts` (show/hide state via API), `use-nav-collapse-state.ts` (expand/collapse via localStorage), and `nav-group.tsx` (rendering). Four features modify this subsystem and must be sequenced carefully.

**Major components and their v2.4 modifications:**
1. **`nav-config.ts`** -- Add `children?: NavItem[]` to NavItem interface; restructure CRM group with Companies as parent
2. **`use-nav-visibility.ts`** -- Fix autoReveal logic (exact match only); add batch save support; handle children in visibility checks
3. **`nav-group.tsx`** -- Render nested items with indentation and expand/collapse chevron
4. **`settings/page.tsx`** -- Add Save/Reset buttons, nested toggle hierarchy, DnD reordering section, admin field visibility card
5. **`sidebar.tsx` + `mobile-sidebar.tsx`** -- Apply custom order when rendering, support nested items
6. **Dashboard `page.tsx`** -- Fix revenue aggregation to use `revenue ?? potentialRevenue` per project

**Schema changes (single migration):**
```prisma
model UserPreferences {
  navItemOrder    Json?  @map("nav_item_order") @db.Json  // NEW
}
model AdminDefaults {
  hiddenFieldsInternal Json? @map("hidden_fields_internal") @db.Json  // NEW
}
```

**Key architecture decisions:**
- Extend NavItem with `children` (not a separate NavSubGroup concept) -- one nesting level is sufficient
- Store nav order in UserPreferences (not a separate model) -- co-located with hiddenNavItems
- Store field visibility in AdminDefaults (not UserPreferences) -- system-wide admin setting
- Keep COMPLETED revenue filter, use `revenue ?? potentialRevenue` fallback -- do not conflate earned with expected
- Settings page and sidebar use separate hook instances -- accept eventual consistency on save (sidebar refreshes on next page load)

See: `.planning/research/v2.4-ARCHITECTURE.md`

### Critical Pitfalls

From v2.4-PITFALLS.md -- 3 critical, 8 high/moderate pitfalls identified.

1. **autoReveal `startsWith` matching is too broad (Critical)** -- `pathname.startsWith(href)` matches any sub-path, causing hidden items to reappear during in-page navigation. Fix: use exact match (`pathname === href`) or remove autoReveal entirely. Address first.

2. **Race condition in fire-and-forget preference saves (Critical)** -- `toggleItem` and `autoReveal` both fire independent PATCH calls without concurrency protection. Simultaneous calls can overwrite each other. Fix: batch save pattern with explicit Save button eliminates concurrent writes by design.

3. **Nested nav breaks flat href-based visibility system (Critical)** -- The entire visibility system assumes flat `string[]` of hrefs. Adding `children` to NavItem requires updating `isVisible`, `toggleItem`, `autoReveal`, `findGroupForPath`, `getAllNavHrefs`, and the Settings page. Must audit every consumer of `navGroups` and `NavItem` before changing the type.

4. **Drag-and-drop interferes with click navigation (High)** -- @dnd-kit sensors can intercept clicks intended for navigation. Fix: use drag handles only (GripVertical icon), not full-item drag. Set activation distance of 8px. Only enable DnD in Settings page, never in the live sidebar.

5. **Revenue double-counting when including potentialRevenue (High)** -- Projects with both `revenue` and `potentialRevenue` must not sum both fields. Fix: use per-project `revenue ?? potentialRevenue ?? 0` logic (COALESCE pattern), not `SUM(revenue) + SUM(potentialRevenue)`.

6. **No status-based read-only guard exists for projects (High)** -- The "completed projects editable" requirement may be solving a problem that does not exist. Verify in running app first. If confirmed as no-op, document as intentional design decision.

7. **navOrder/hiddenNavItems sync drift (High)** -- Two separate JSON arrays must stay synchronized with `nav-config.ts`. Fix: reconciliation function on sidebar load that filters stale entries and appends new items.

See: `.planning/research/v2.4-PITFALLS.md`

---

## Implications for Roadmap

Based on combined research, the milestone splits cleanly into a **sequential sidebar chain** (4 features that must be built in order) and **3 independent features** that can be interleaved at any point. The FEATURES research identified the dependency graph (F-01 -> F-02 -> F-05 -> F-06), the ARCHITECTURE research validated it with shared-file analysis, and the PITFALLS research confirmed each step must be stable before the next begins.

### Phase 1: Sidebar Bug Fix (autoReveal) + Save Button

**Rationale:** These two features are tightly coupled -- the autoReveal bug is caused by fire-and-forget persistence, and the Save button replaces that pattern. Fixing them together creates a stable persistence foundation for all subsequent sidebar work. This is also the highest-impact change: resolving daily user frustration (hidden items reappearing) with minimal risk (isolated hook logic change).
**Delivers:** Fixed `autoReveal` logic (exact match or removal), batch save pattern with Save/Reset buttons, dirty tracking, `toast.success` feedback, unsaved changes warning.
**Addresses:** F-01 (autoReveal fix), F-02 (Save button).
**Avoids:** Pitfall #1 (broad matching), Pitfall #2 (race condition).

### Phase 2: Dashboard Revenue Fix + Completed Projects Verification

**Rationale:** Both are quick, independent wins that can ship while sidebar structural work is planned. The revenue fix is a single query change (~5 minutes of coding). The completed projects feature is likely a no-op that needs verification, not implementation.
**Delivers:** Corrected CRM KPI revenue card using `revenue ?? potentialRevenue` per project for ACTIVE + COMPLETED statuses. Verified and documented project editability behavior.
**Addresses:** F-04 (revenue accuracy), F-03 (completed projects editable).
**Avoids:** Pitfall #5 (double-counting) with per-project COALESCE logic. Pitfall #6 (unnecessary code changes) by verifying actual behavior first.

### Phase 3: Nested Sidebar Links

**Rationale:** Structural change to the NavItem type that must happen before drag-and-drop reordering, since DnD must handle the nested structure. Requires updating 6+ files that consume `NavItem`: `nav-config.ts`, `nav-group.tsx`, `use-nav-visibility.ts`, `settings/page.tsx`, `sidebar.tsx`, `mobile-sidebar.tsx`. Medium complexity but well-understood -- extends the existing Radix Collapsible pattern.
**Delivers:** Companies as parent with Departments/Contacts as indented sub-items, expand/collapse chevron on parent items, active state highlighting for parent when child route is active, hierarchical toggle switches in Settings.
**Addresses:** F-05 (nested sidebar links).
**Avoids:** Pitfall #3 (breaks flat visibility system) by updating all NavItem consumers. Pitfall #8 (collapse state conflict) by using visually distinct expand indicators and separate state storage from group collapse.

### Phase 4: Sidebar Drag-and-Drop Reorder (Defer Candidate)

**Rationale:** Depends on nested nav being stable (Phase 3). Medium-high complexity: schema migration, DnD integration in Settings page, order persistence in `UserPreferences.navItemOrder`, reconciliation logic for new/removed items. However, 3 users can tolerate default ordering. **Recommend deferring to post-v2.4 if time is tight.**
**Delivers:** DnD reordering UI in Settings page (drag handles per item within each group), persisted order in UserPreferences, Reset Order button, sidebar renders in custom order.
**Addresses:** F-06 (sidebar drag-and-drop reorder).
**Avoids:** Pitfall #4 (drag interferes with click) by using drag handles and Settings-only DnD. Pitfall #7 (navOrder sync drift) with reconciliation function. Pitfall #10 (accessibility regression) by not adding keyboard drag to live sidebar.

### Phase 5: Admin Field Visibility for Internal Projects (Defer Candidate)

**Rationale:** Independent of sidebar chain. Medium-high complexity: new admin config model, conditional field rendering across 3+ project components, admin settings UI. Current hardcoded internal/external field logic works. **Recommend deferring to post-v2.4 unless team creates many internal projects with varying field needs.**
**Delivers:** `hiddenFieldsInternal` JSON field on AdminDefaults, admin-only field visibility card in Settings, conditional field rendering in project forms/detail views based on admin config.
**Addresses:** F-07 (admin field visibility).
**Avoids:** Pitfall #9 (AdminDefaults missing defaults) by defining hardcoded fallback constants in code.

### Phase Ordering Rationale

- **Sidebar bug fix + save button first** because they resolve daily user frustration and establish the persistence pattern all other sidebar features depend on
- **Revenue fix + project verification second** because they are quick independent wins that deliver immediate value with zero sidebar dependency
- **Nested nav third** because it is the structural prerequisite for drag-and-drop reordering -- the NavItem type must be stable before adding ordering logic
- **DnD reorder fourth (defer candidate)** because it is the most complex sidebar feature and the 3-person team can tolerate default ordering
- **Admin field visibility fifth (defer candidate)** because current hardcoded logic works and this feature is independent of all others

### Research Flags

Phases likely needing review during planning:
- **Phase 3 (Nested Nav):** Needs careful audit of all `NavItem` consumers before changing the type. TypeScript compiler will catch most issues, but rendering logic and Settings page toggle hierarchy need manual review.
- **Phase 4 (DnD Reorder):** Needs sensor tuning for activation constraints. The kanban pattern uses `distance: 5` for MouseSensor -- sidebar items are smaller, may need `distance: 8` or delay-based activation.

Phases with standard patterns (skip research):
- **Phase 1 (Bug Fix + Save Button):** Pure hook refactoring. Well-understood fix-and-replace pattern.
- **Phase 2 (Revenue Fix + Project Verification):** Single query change + behavioral verification. Trivial.
- **Phase 5 (Admin Field Visibility):** JSON field in AdminDefaults + conditional rendering. Same pattern as dashboard widget roles.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Zero new dependencies. All libraries verified against `node_modules` with exact versions. @dnd-kit usage proven in 12 files, Radix Collapsible in 7 files, sonner in 5+ files. |
| Features | HIGH | All 7 features scoped from direct codebase analysis. Feature dependencies mapped with file-level precision. MVP recommendation clearly separates must-ship from deferrable. |
| Architecture | HIGH | Sidebar subsystem fully mapped (6 files, clear data flow). Schema changes are nullable JSON fields -- non-destructive. Build order validated against shared-file analysis. |
| Pitfalls | HIGH | 11 pitfalls identified from direct codebase analysis. Root causes traced to specific lines of code (autoReveal lines 73-100, revenue aggregation lines 183-186). Prevention strategies reference existing codebase patterns. |

**Overall confidence: HIGH**

This milestone continues the pattern of previous v2.x milestones: high-confidence, code-only work building on proven patterns. The risk profile is dominated by the sidebar subsystem having 4 sequential changes to shared files -- mitigated by the strict build order. No new packages, no architectural shifts, no infrastructure changes.

### Gaps to Address

- **Completed projects editability verification:** Before any Phase 2 code changes, test in the running app: open a COMPLETED project and attempt to edit. The code shows no restriction, but runtime behavior should be confirmed. If confirmed as no-op, document the design decision and close the feature.

- **autoReveal removal vs. exact-match fix:** The FEATURES research recommends removing autoReveal entirely ("the only way to un-hide is through Settings"). The ARCHITECTURE research suggests exact-match as an alternative. **Recommendation: Remove autoReveal entirely.** The simpler approach is safer and matches user intent -- hiding means hiding, regardless of URL.

- **Nested nav parent-child visibility semantics:** When a parent is hidden, should children auto-hide? When all children are hidden, what happens to the parent? **Recommendation: Hiding parent hides all children. Hiding all children keeps parent visible but without expand chevron. Un-hiding a child auto-shows the parent.**

- **DnD reorder scope for nested items:** Should children be reorderable within their parent? Or do only top-level items within a group get reordered? **Recommendation: Top-level items only. Children follow their parent's position. Keep it simple for 3 users.**

- **Revenue widget scope (COMPLETED only vs. ACTIVE+COMPLETED):** The FEATURES research recommends including ACTIVE projects with potentialRevenue. The ARCHITECTURE research recommends keeping COMPLETED only with potentialRevenue fallback. **Recommendation: Include ACTIVE + COMPLETED** -- this gives a more accurate picture of the revenue pipeline and matches the "CRM KPI" purpose.

---

## Sources

### Primary (HIGH confidence)
- Direct codebase analysis of 20+ files: `nav-config.ts`, `sidebar.tsx`, `mobile-sidebar.tsx`, `nav-group.tsx`, `use-nav-visibility.ts`, `use-nav-collapse-state.ts`, `settings/page.tsx`, `kanban-board.tsx`, `project-detail-sheet.tsx`, `project-detail-page-client.tsx`, `page.tsx` (dashboard), `crm-kpi-cards.tsx`, `revenue-target.tsx`, `permissions.ts`, `schema.prisma`
- Package version verification from `node_modules`: @dnd-kit/core@6.3.1, @dnd-kit/sortable@10.0.0, @radix-ui/react-collapsible@1.1.12, sonner@2.0.7
- @dnd-kit/sortable v10 TypeScript definitions confirming API availability

### Secondary (MEDIUM confidence)
- Existing @dnd-kit usage patterns across 12 files in the codebase (kanban, pipeline, tasks, potential projects)
- Existing Radix Collapsible patterns across 7 files
- UserPreferences and AdminDefaults JSON field patterns already proven in production

### Tertiary (LOW confidence)
- None -- all findings are from direct codebase analysis with HIGH confidence

---

*v2.4 Research completed: 2026-01-28*
*Ready for roadmap: yes*
