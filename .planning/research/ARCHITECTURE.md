# Architecture Patterns: CRM & Project Financials

**Domain:** Sales Pipeline + Project Cost Tracking
**Researched:** 2026-01-22
**Confidence:** HIGH (builds on established codebase patterns)

## Recommended Architecture

This milestone extends the existing Next.js 14 App Router architecture with new domain models and API routes following established patterns.

### High-Level Component Diagram

```
+------------------+     +------------------+     +------------------+
|   Sales Pipeline |     |     Projects     |     |   Initiatives    |
|------------------|     |------------------|     |------------------|
| Lead             |---->| Project          |<----| Initiative (KRI) |
| Deal             |     | (auto-created    |     | (optional link)  |
| PotentialProject |---->|  or standalone)  |     |                  |
+------------------+     +--------+---------+     +------------------+
                                 |
                                 v
                        +------------------+
                        |   Project Costs  |
                        |------------------|
                        | Cost             |
                        | CostCategory     |
                        | Receipt (upload) |
                        +------------------+
```

### Data Model Relationships (ERD)

```
+-------------------+       +--------------------+       +-------------------+
|       Client      |       |        Deal        |       |      Project      |
|-------------------|       |--------------------|       |-------------------|
| id (PK)           |<---+  | id (PK)            |       | id (PK)           |
| name              |    |  | clientId (FK)      |------>| dealId? (FK)      |
| email?            |    |  | contactName        |       | potentialId? (FK) |
| phone?            |    |  | contactEmail?      |       | initiativeId? (FK)|
| company?          |    |  | title              |       | clientId (FK)     |
| isRepeatClient    |    |  | description?       |       | name              |
| createdAt         |    |  | estimatedValue     |       | description?      |
| updatedAt         |    |  | stage (enum)       |       | status (enum)     |
+-------------------+    |  | probability        |       | revenue           |
         ^               |  | expectedCloseDate  |       | startDate?        |
         |               |  | assignedTo         |       | endDate?          |
         |               |  | source?            |       | assignedTo        |
         |               |  | createdAt          |       | createdAt         |
         |               |  | updatedAt          |       | updatedAt         |
         |               |  +--------------------+       +--------+----------+
         |               |                                        |
         |               |  +--------------------+                 |
         |               |  | PotentialProject   |                 |
         |               |  |--------------------|                 |
         |               +--| clientId (FK)      |                 |
         |                  | title              |                 |
         |                  | description?       |                 |
         |                  | estimatedValue     |                 |
         |                  | stage (enum)       |                 |
         |                  | expectedDate?      |                 |
         |                  | assignedTo         |                 |
         |                  | remarks?           |                 |
         |                  | createdAt          |                 |
         |                  | updatedAt          |                 |
         +------------------| (repeat clients)   |                 |
                           +--------------------+                 |
                                                                  |
+-------------------+       +--------------------+                  |
|   CostCategory    |       |        Cost        |                  |
|-------------------|       |--------------------|                  |
| id (PK)           |<------| id (PK)            |                  |
| name              |       | projectId (FK)     |<-----------------+
| description?      |       | categoryId (FK)    |
| color?            |       | description        |
| position          |       | amount             |
+-------------------+       | date               |
                           | receiptUrl?        |
                           | receiptFilename?   |
                           | notes?             |
                           | createdAt          |
                           | updatedAt          |
                           +--------------------+
```

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| **Client** | Company/contact information, repeat client tracking | Deals, PotentialProjects, Projects |
| **Deal** | New business pipeline (Lead->Won/Lost) | Client, Project (creates on Won) |
| **PotentialProject** | Repeat client pipeline (Potential->Confirmed) | Client, Project (creates on Confirmed) |
| **Project** | Actual work tracking, revenue/profit | Client, Deal?, PotentialProject?, Initiative?, Costs |
| **Cost** | Individual expense line items | Project, CostCategory |
| **CostCategory** | Expense classification (labor, materials, etc.) | Costs |
| **Initiative** | Existing KRI tracking | Projects (optional backlink) |

## Prisma Schema Extension

```prisma
// ============================================================
// CRM & Project Financials Models (v1.2)
// ============================================================

// Sales pipeline stages for new business
enum DealStage {
  LEAD           // Initial contact, not yet qualified
  QUALIFIED      // Budget, authority, need, timeline confirmed
  PROPOSAL       // Proposal sent, awaiting response
  NEGOTIATION    // Active negotiation on terms
  WON            // Deal closed, project created
  LOST           // Deal lost, no project
}

// Pipeline stages for repeat clients
enum PotentialStage {
  POTENTIAL      // Discussion with existing client
  CONFIRMED      // Client confirmed, project created
  CANCELLED      // Client declined or postponed
}

// Project status tracking
enum ProjectStatus {
  PLANNING       // Pre-work, scoping
  IN_PROGRESS    // Active execution
  ON_HOLD        // Paused, waiting on external factor
  COMPLETED      // Delivered, pending final payment
  INVOICED       // Invoice sent
  PAID           // Payment received
  CANCELLED      // Project cancelled
}

// Client/Company for CRM
model Client {
  id              String            @id @default(cuid())
  name            String            @db.VarChar(255)
  email           String?           @db.VarChar(255)
  phone           String?           @db.VarChar(50)
  company         String?           @db.VarChar(255)
  isRepeatClient  Boolean           @default(false)
  remarks         String?           @db.Text

  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  deals             Deal[]
  potentialProjects PotentialProject[]
  projects          Project[]

  @@index([name])
  @@index([company])
  @@map("clients")
}

// Sales pipeline for new business
model Deal {
  id                String      @id @default(cuid())
  clientId          String
  client            Client      @relation(fields: [clientId], references: [id])

  contactName       String      @db.VarChar(255)
  contactEmail      String?     @db.VarChar(255)
  contactPhone      String?     @db.VarChar(50)

  title             String      @db.VarChar(500)
  description       String?     @db.Text
  estimatedValue    Decimal     @db.Decimal(12, 2)
  stage             DealStage   @default(LEAD)
  probability       Int         @default(10)  // 0-100%
  expectedCloseDate DateTime?

  assignedTo        TeamMember?
  source            String?     @db.VarChar(100)  // e.g., "Referral", "Event", "Website"
  lostReason        String?     @db.Text
  remarks           String?     @db.Text

  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt

  project           Project?    // Created when stage = WON

  @@index([clientId])
  @@index([stage])
  @@index([assignedTo])
  @@index([expectedCloseDate])
  @@map("deals")
}

// Pipeline for repeat clients
model PotentialProject {
  id              String          @id @default(cuid())
  clientId        String
  client          Client          @relation(fields: [clientId], references: [id])

  title           String          @db.VarChar(500)
  description     String?         @db.Text
  estimatedValue  Decimal         @db.Decimal(12, 2)
  stage           PotentialStage  @default(POTENTIAL)
  expectedDate    DateTime?

  assignedTo      TeamMember?
  remarks         String?         @db.Text

  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  project         Project?        // Created when stage = CONFIRMED

  @@index([clientId])
  @@index([stage])
  @@index([assignedTo])
  @@map("potential_projects")
}

// Project entity (three entry points)
model Project {
  id              String          @id @default(cuid())

  // Entry point references (one of these, or none for direct creation)
  dealId          String?         @unique
  deal            Deal?           @relation(fields: [dealId], references: [id])

  potentialId     String?         @unique
  potential       PotentialProject? @relation(fields: [potentialId], references: [id])

  initiativeId    String?
  initiative      Initiative?     @relation(fields: [initiativeId], references: [id])

  // Client (copied from Deal/Potential or set directly)
  clientId        String
  client          Client          @relation(fields: [clientId], references: [id])

  // Project details
  name            String          @db.VarChar(500)
  description     String?         @db.Text
  status          ProjectStatus   @default(PLANNING)

  // Financials
  revenue         Decimal         @db.Decimal(12, 2)  // From deal value or manual

  // Timeline
  startDate       DateTime?
  endDate         DateTime?

  assignedTo      TeamMember?
  remarks         String?         @db.Text

  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  costs           Cost[]

  @@index([clientId])
  @@index([status])
  @@index([assignedTo])
  @@index([initiativeId])
  @@map("projects")
}

// Cost categories (seeded, admin-managed)
model CostCategory {
  id          String    @id @default(cuid())
  name        String    @db.VarChar(100)
  description String?   @db.VarChar(255)
  color       String?   @db.VarChar(7)   // Hex color for UI
  position    Int       @default(0)       // Display order

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  costs       Cost[]

  @@unique([name])
  @@map("cost_categories")
}

// Individual cost items
model Cost {
  id              String        @id @default(cuid())
  projectId       String
  project         Project       @relation(fields: [projectId], references: [id], onDelete: Cascade)

  categoryId      String
  category        CostCategory  @relation(fields: [categoryId], references: [id])

  description     String        @db.VarChar(500)
  amount          Decimal       @db.Decimal(12, 2)
  date            DateTime      @db.Date

  // Receipt upload
  receiptUrl      String?       @db.VarChar(500)
  receiptFilename String?       @db.VarChar(255)

  notes           String?       @db.Text

  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  @@index([projectId])
  @@index([categoryId])
  @@index([date])
  @@map("costs")
}

// Add relation to existing Initiative model
// (Add to existing Initiative model)
// projects         Project[]
```

## API Routes Structure

Following existing patterns from `src/app/api/initiatives/`:

```
src/app/api/
├── clients/
│   ├── route.ts                 # GET (list), POST (create)
│   └── [id]/
│       └── route.ts             # GET, PUT, DELETE
│
├── deals/
│   ├── route.ts                 # GET (with stage filter), POST
│   └── [id]/
│       ├── route.ts             # GET, PUT, PATCH, DELETE
│       └── convert/
│           └── route.ts         # POST - Convert to Project (stage=WON)
│
├── potential-projects/
│   ├── route.ts                 # GET (with stage filter), POST
│   └── [id]/
│       ├── route.ts             # GET, PUT, PATCH, DELETE
│       └── convert/
│           └── route.ts         # POST - Convert to Project (stage=CONFIRMED)
│
├── projects/
│   ├── route.ts                 # GET (with filters), POST (direct create)
│   └── [id]/
│       ├── route.ts             # GET (with costs), PUT, PATCH, DELETE
│       └── costs/
│           └── route.ts         # GET, POST (add cost)
│
├── costs/
│   └── [id]/
│       └── route.ts             # PUT, DELETE (update/remove individual cost)
│
├── cost-categories/
│   └── route.ts                 # GET (list for dropdowns)
│
└── dashboard/
    └── pipeline/
        └── route.ts             # GET - Pipeline stats, forecasts
```

## Page Structure

Following existing `(dashboard)` route group pattern:

```
src/app/(dashboard)/
├── pipeline/
│   └── page.tsx                 # Sales pipeline Kanban view
│
├── potential/
│   └── page.tsx                 # Repeat client pipeline view
│
├── projects/
│   ├── page.tsx                 # Projects list/table view
│   ├── [id]/
│   │   └── page.tsx             # Project detail with costs
│   └── new/
│       └── page.tsx             # Direct project creation form
│
├── clients/
│   ├── page.tsx                 # Client list view
│   └── [id]/
│       └── page.tsx             # Client detail (all deals, projects)
│
└── (existing pages...)
```

## Component Structure

```
src/components/
├── pipeline/
│   ├── pipeline-board.tsx       # Kanban board for deals
│   ├── pipeline-card.tsx        # Deal card component
│   ├── deal-form.tsx            # Create/edit deal modal
│   └── deal-convert-dialog.tsx  # Convert to project confirmation
│
├── potential/
│   ├── potential-board.tsx      # Kanban for potential projects
│   ├── potential-card.tsx       # Potential project card
│   └── potential-form.tsx       # Create/edit potential project
│
├── projects/
│   ├── project-list.tsx         # Table view of projects
│   ├── project-card.tsx         # Card for grid view
│   ├── project-detail.tsx       # Full detail view
│   ├── project-form.tsx         # Create/edit project
│   ├── cost-table.tsx           # Costs table with totals
│   ├── cost-form.tsx            # Add/edit cost modal
│   └── receipt-upload.tsx       # File upload component
│
├── clients/
│   ├── client-list.tsx          # Client table
│   ├── client-form.tsx          # Create/edit client
│   └── client-detail.tsx        # Client with history
│
└── dashboard/
    ├── pipeline-widget.tsx      # Deals by stage summary
    ├── revenue-widget.tsx       # Revenue/profit summary
    └── (existing widgets...)
```

## Suggested Build Order

Dependencies dictate the following order:

### Phase 1: Foundation Models (No Dependencies)
1. **CostCategory model** - Seed data, no relations needed
2. **Client model** - Foundation for deals and projects
3. **API routes**: `/cost-categories`, `/clients`
4. **UI**: Client list page, client form

### Phase 2: Sales Pipeline (Depends on Client)
1. **Deal model** - Requires Client
2. **API routes**: `/deals`, `/deals/[id]`
3. **UI**: Pipeline board (Kanban), deal form
4. **Sidebar navigation update**

### Phase 3: Potential Projects (Depends on Client)
1. **PotentialProject model** - Requires Client
2. **API routes**: `/potential-projects`, `/potential-projects/[id]`
3. **UI**: Potential board, potential form

### Phase 4: Projects (Depends on Deal, Potential, Client, Initiative)
1. **Project model** - Requires all above
2. **Update Initiative model** - Add projects relation
3. **API routes**: `/projects`, `/projects/[id]`
4. **Conversion endpoints**: `/deals/[id]/convert`, `/potential-projects/[id]/convert`
5. **UI**: Projects list, project form (3 entry points), project detail

### Phase 5: Costs (Depends on Project, CostCategory)
1. **Cost model** - Requires Project, CostCategory
2. **API routes**: `/projects/[id]/costs`, `/costs/[id]`
3. **File upload setup** (local storage or S3)
4. **UI**: Cost table, cost form, receipt upload

### Phase 6: Dashboard & Polish
1. **Dashboard widgets**: Pipeline summary, revenue/profit
2. **Reports**: Project profitability view
3. **Integration testing**
4. **Polish: Loading states, error handling**

## Patterns to Follow

### Pattern 1: Server Component Data Fetching
**What:** Fetch data in Server Components, serialize for Client Components
**When:** All page loads
**Example:**
```typescript
// src/app/(dashboard)/projects/page.tsx
export const dynamic = 'force-dynamic'

async function getProjects() {
  const projects = await prisma.project.findMany({
    include: { client: true, costs: true },
    orderBy: { createdAt: 'desc' }
  })
  return projects.map(p => ({
    ...p,
    startDate: p.startDate?.toISOString() ?? null,
    endDate: p.endDate?.toISOString() ?? null,
    revenue: Number(p.revenue),
    costs: p.costs.map(c => ({
      ...c,
      amount: Number(c.amount),
      date: c.date.toISOString()
    }))
  }))
}
```

### Pattern 2: API Route Authorization
**What:** Use existing `requireAuth`/`requireEditor` helpers
**When:** All mutations
**Example:**
```typescript
// src/app/api/deals/route.ts
export async function POST(request: NextRequest) {
  const { error } = await requireEditor()
  if (error) return error
  // ... create deal
}
```

### Pattern 3: Stage Transitions with Side Effects
**What:** Use transactions for state changes that create related records
**When:** Converting Deal->Project, PotentialProject->Project
**Example:**
```typescript
// src/app/api/deals/[id]/convert/route.ts
const result = await prisma.$transaction(async (tx) => {
  // Update deal to WON
  const deal = await tx.deal.update({
    where: { id },
    data: { stage: 'WON' }
  })

  // Create project from deal
  const project = await tx.project.create({
    data: {
      dealId: deal.id,
      clientId: deal.clientId,
      name: deal.title,
      revenue: deal.estimatedValue,
      status: 'PLANNING',
      assignedTo: deal.assignedTo
    }
  })

  return { deal, project }
})
```

### Pattern 4: Computed Fields via Prisma Queries
**What:** Calculate totals/summaries at query time, not stored
**When:** Project profit calculation
**Example:**
```typescript
// Get project with computed profit
const project = await prisma.project.findUnique({
  where: { id },
  include: {
    costs: {
      select: { amount: true }
    }
  }
})

const totalCosts = project.costs.reduce(
  (sum, c) => sum + Number(c.amount),
  0
)
const profit = Number(project.revenue) - totalCosts
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Storing Computed Values
**What:** Storing `totalCosts` or `profit` in the Project table
**Why bad:** Gets out of sync when costs added/removed/edited
**Instead:** Calculate on read from costs relation

### Anti-Pattern 2: Deep Nesting in API Responses
**What:** Including full nested objects for all relations
**Why bad:** Large payloads, over-fetching
**Instead:** Include only needed fields, use separate endpoints for details

### Anti-Pattern 3: Multiple Sources of Truth for Stage
**What:** Storing stage in both Deal and Project
**Why bad:** Can become inconsistent
**Instead:** Project inherits from Deal only once at creation; subsequent status is independent

### Anti-Pattern 4: Orphaned Projects
**What:** Allowing Project deletion without cleaning up Deal/Potential references
**Why bad:** Broken references, confusing UI state
**Instead:** Use `onDelete: SetNull` or prevent deletion if source exists

## Scalability Considerations

| Concern | At Current (10s of deals) | At 100 deals | At 1000+ deals |
|---------|---------------------------|--------------|----------------|
| Pipeline board | Load all | Load all | Virtual scroll or pagination |
| Project costs | Load all with project | Load all | Paginate costs table |
| Dashboard stats | Query on load | Cache with revalidate | Background job + cache |
| Receipt storage | Local filesystem | Local filesystem | Consider S3/R2 |

For current scale (small team, internal tool), optimize later patterns are appropriate.

## File Upload Strategy

For receipt uploads, recommend local storage initially:

```typescript
// Store in: /public/uploads/receipts/[projectId]/[filename]
// URL: /uploads/receipts/[projectId]/[filename]

// Later migration path: S3/Cloudflare R2
// - Change upload endpoint to use S3 SDK
// - Store full S3 URL in receiptUrl
// - No schema changes needed
```

## Sources

- [Prisma Data Model Documentation](https://www.prisma.io/docs/orm/prisma-schema/data-model)
- [Sales Pipeline Management Best Practices](https://www.zendesk.com/blog/using-crm-sales-pipeline-management/)
- [Project Cost Management Database Design](https://budibase.com/blog/tutorials/project-cost-management-software/)
- [Project Management Data Model](https://vertabelo.com/blog/organize-your-time-and-resources-a-project-management-data-model/)
- Existing codebase patterns: `src/app/api/initiatives/`, `prisma/schema.prisma`

---

# Architecture Research: Document Management & Customizable Dashboard (v1.3)

**Project:** SAAP 2026 v1.3
**Researched:** 2026-01-23
**Overall Confidence:** HIGH

## Executive Summary

This section outlines the architecture for integrating document management and customizable dashboards into the existing SAAP application. The research recommends:

1. **Document Management:** Filesystem storage at `/uploads/` organized by project ID, with metadata tracked in MariaDB. Server Actions for upload handling with security validation.

2. **Dashboard Customization:** JSON-based layout persistence in a new `UserPreferences` table, using the existing `@dnd-kit` library for widget drag-and-drop (no need for `react-grid-layout` given no resize requirement).

3. **Role Restrictions:** Permission checks embedded in widget registry with server-side validation of visible widgets.

---

## Document Management Architecture

### Storage Approach: Filesystem with Database Metadata

**Recommendation:** Store files on filesystem at `/uploads/`, store metadata in database.

**Rationale:**
- NAS deployment makes filesystem storage natural and performant
- Database stores metadata (path, name, size, uploadedBy, uploadedAt)
- Existing `Cost.receiptPath` field already follows this pattern
- Cloud storage (S3) would add unnecessary complexity for NAS deployment

**References:**
- [Next.js File Uploads: Server-Side Solutions](https://www.pronextjs.dev/next-js-file-uploads-server-side-solutions)
- [File Upload with Next.js 14 and Server Actions](https://akoskm.com/file-upload-with-nextjs-14-and-server-actions/)

### Folder Structure

```
/uploads/
  /projects/
    /{projectId}/
      /documents/
        {uuid}-{original-filename}.pdf
        {uuid}-{original-filename}.xlsx
      /receipts/
        {uuid}-{original-filename}.jpg
```

**Key decisions:**
- **UUID prefix:** Prevents filename collisions, enables deduplication
- **Preserve original filename:** Better UX when downloading
- **Project-scoped:** Natural organization, easy permission checks
- **Separate receipts subfolder:** Aligns with existing `Cost.receiptPath` pattern

### Schema Additions

```prisma
model Document {
  id            String    @id @default(cuid())
  filename      String    @db.VarChar(255)    // Original filename
  storagePath   String    @db.VarChar(500)    // Full path on filesystem
  mimeType      String    @db.VarChar(100)
  sizeBytes     Int
  description   String?   @db.Text

  projectId     String    @map("project_id")
  project       Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)

  uploadedById  String    @map("uploaded_by_id")
  uploadedBy    User      @relation(fields: [uploadedById], references: [id])

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@index([projectId])
  @@index([uploadedById])
  @@map("documents")
}

// Update existing Project model
model Project {
  // ... existing fields ...
  documents     Document[]
}

// Update existing User model
model User {
  // ... existing fields ...
  documents     Document[]
}
```

### API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/projects/[id]/documents` | GET | List documents for project |
| `/api/projects/[id]/documents` | POST | Upload new document (Server Action) |
| `/api/projects/[id]/documents/[docId]` | GET | Download document |
| `/api/projects/[id]/documents/[docId]` | DELETE | Delete document |

### Server Action for Upload

```typescript
// src/lib/actions/document-actions.ts
"use server";

import { auth } from "@/auth";
import { canEdit } from "@/lib/permissions";
import prisma from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { v4 as uuid } from "uuid";

const UPLOAD_BASE = process.env.UPLOAD_PATH || "/uploads";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
];

export async function uploadDocument(formData: FormData) {
  // 1. Auth check
  const session = await auth();
  if (!session?.user?.id || !canEdit(session.user.role)) {
    return { error: "Unauthorized" };
  }

  // 2. Extract and validate file
  const file = formData.get("file") as File;
  const projectId = formData.get("projectId") as string;
  const description = formData.get("description") as string | null;

  if (!file || file.size === 0) {
    return { error: "No file provided" };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { error: "File too large (max 10MB)" };
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { error: "File type not allowed" };
  }

  // 3. Verify project exists and user has access
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    return { error: "Project not found" };
  }

  // 4. Generate storage path
  const fileId = uuid();
  const safeFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const storagePath = join(
    UPLOAD_BASE,
    "projects",
    projectId,
    "documents",
    `${fileId}-${safeFilename}`
  );

  // 5. Write file to filesystem
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Ensure directory exists
  const dir = join(UPLOAD_BASE, "projects", projectId, "documents");
  await mkdir(dir, { recursive: true });

  await writeFile(storagePath, buffer);

  // 6. Create database record
  const document = await prisma.document.create({
    data: {
      filename: file.name,
      storagePath,
      mimeType: file.type,
      sizeBytes: file.size,
      description,
      projectId,
      uploadedById: session.user.id,
    },
  });

  return { success: true, document };
}
```

### Security Considerations

| Concern | Mitigation |
|---------|------------|
| Path traversal | UUID-based paths, sanitize filenames |
| File type validation | Check MIME type server-side, not just extension |
| Size limits | Enforce in Server Action (10MB default) |
| Access control | Verify project membership before download |
| Virus scanning | Consider ClamAV integration for production |

**References:**
- [Handling File Uploads in Next.js Best Practices and Security](https://moldstud.com/articles/p-handling-file-uploads-in-nextjs-best-practices-and-security-considerations)
- [Shield Your Data: How to Manage Private Files in Next.js](https://prateekbadjatya.medium.com/shield-your-data-how-to-manage-private-files-in-next-js-applications-5895c9093b1c)

---

## Dashboard Customization Architecture

### Widget Registry Pattern

A central registry defines available widgets with their metadata and role requirements.

```typescript
// src/lib/dashboard/widget-registry.ts
import { UserRole } from "@prisma/client";

export interface WidgetDefinition {
  id: string;
  name: string;
  description: string;
  component: string;  // Component path for dynamic import
  defaultSize: "small" | "medium" | "large" | "full";
  minRole: UserRole;  // Minimum role required to see widget
  category: "kpi" | "chart" | "list" | "crm";
}

export const WIDGET_REGISTRY: WidgetDefinition[] = [
  {
    id: "kpi-initiatives",
    name: "Initiative KPIs",
    description: "Total, completed, at-risk initiatives",
    component: "@/components/dashboard/kpi-cards",
    defaultSize: "full",
    minRole: "VIEWER",
    category: "kpi",
  },
  {
    id: "kpi-revenue",
    name: "Revenue Progress",
    description: "Revenue vs target progress bar",
    component: "@/components/dashboard/revenue-progress",
    defaultSize: "full",
    minRole: "VIEWER",
    category: "kpi",
  },
  {
    id: "chart-status",
    name: "Status Distribution",
    description: "Pie chart of initiative statuses",
    component: "@/components/dashboard/status-chart",
    defaultSize: "medium",
    minRole: "VIEWER",
    category: "chart",
  },
  {
    id: "chart-department",
    name: "Department Distribution",
    description: "Bar chart by department",
    component: "@/components/dashboard/department-chart",
    defaultSize: "medium",
    minRole: "VIEWER",
    category: "chart",
  },
  {
    id: "list-recent",
    name: "Recent Initiatives",
    description: "Latest updated initiatives",
    component: "@/components/dashboard/recent-initiatives",
    defaultSize: "medium",
    minRole: "VIEWER",
    category: "list",
  },
  {
    id: "chart-workload",
    name: "Team Workload",
    description: "Initiatives per team member",
    component: "@/components/dashboard/team-workload",
    defaultSize: "medium",
    minRole: "VIEWER",
    category: "chart",
  },
  {
    id: "crm-kpis",
    name: "Sales KPIs",
    description: "Pipeline, forecast, win rate",
    component: "@/components/dashboard/crm-kpi-cards",
    defaultSize: "full",
    minRole: "EDITOR",  // Only EDITOR+ see sales data
    category: "crm",
  },
  {
    id: "crm-pipeline",
    name: "Pipeline Stages",
    description: "Deal stages funnel chart",
    component: "@/components/dashboard/pipeline-stage-chart",
    defaultSize: "large",
    minRole: "EDITOR",  // Only EDITOR+ see sales data
    category: "crm",
  },
];

// Role hierarchy for comparison
const ROLE_HIERARCHY: Record<UserRole, number> = {
  VIEWER: 1,
  EDITOR: 2,
  ADMIN: 3,
};

export function canAccessWidget(
  widget: WidgetDefinition,
  userRole: UserRole
): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[widget.minRole];
}

export function getAvailableWidgets(userRole: UserRole): WidgetDefinition[] {
  return WIDGET_REGISTRY.filter((w) => canAccessWidget(w, userRole));
}
```

### Layout Persistence Schema

```prisma
model UserPreferences {
  id            String    @id @default(cuid())
  userId        String    @unique @map("user_id")
  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Dashboard layout stored as JSON
  // Example: [{ widgetId: "kpi-initiatives", order: 0, visible: true }]
  dashboardLayout Json?   @db.Text  // MariaDB: JSON is alias for LONGTEXT

  // Future: other preferences
  // theme         String?   @default("light")
  // timezone      String?

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@map("user_preferences")
}

// Update User model
model User {
  // ... existing fields ...
  preferences   UserPreferences?
}
```

**MariaDB JSON Note:** MariaDB's `Json` type is an alias for `LONGTEXT` with a `JSON_VALID` check constraint. This works fine for storing structured data but returns strings (not objects) - parse in application code.

**Reference:** [MariaDB JSON Data Type](https://mariadb.com/docs/server/reference/data-types/string-data-types/json)

### Layout TypeScript Types

```typescript
// src/types/dashboard.ts
export interface WidgetLayoutItem {
  widgetId: string;
  order: number;
  visible: boolean;
}

export type DashboardLayout = WidgetLayoutItem[];

// Default layout for new users (filtered by role at runtime)
export const DEFAULT_LAYOUT: DashboardLayout = [
  { widgetId: "kpi-initiatives", order: 0, visible: true },
  { widgetId: "kpi-revenue", order: 1, visible: true },
  { widgetId: "chart-status", order: 2, visible: true },
  { widgetId: "chart-department", order: 3, visible: true },
  { widgetId: "chart-workload", order: 4, visible: true },
  { widgetId: "list-recent", order: 5, visible: true },
  { widgetId: "crm-kpis", order: 6, visible: true },
  { widgetId: "crm-pipeline", order: 7, visible: true },
];
```

### Default vs User Layouts

```
Flow:
1. User visits dashboard
2. Fetch UserPreferences.dashboardLayout from DB
3. If null, use DEFAULT_LAYOUT
4. Filter layout by user's role (remove widgets they can't access)
5. Render widgets in order
```

**Server-side layout resolution:**

```typescript
// src/lib/dashboard/get-dashboard-layout.ts
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { getAvailableWidgets, WIDGET_REGISTRY } from "./widget-registry";
import { DEFAULT_LAYOUT, DashboardLayout } from "@/types/dashboard";

export async function getDashboardLayout(): Promise<DashboardLayout> {
  const session = await auth();
  if (!session?.user?.id) {
    return [];
  }

  const userRole = session.user.role;
  const availableWidgets = getAvailableWidgets(userRole);
  const availableIds = new Set(availableWidgets.map((w) => w.id));

  // Fetch user preferences
  const prefs = await prisma.userPreferences.findUnique({
    where: { userId: session.user.id },
  });

  // Parse stored layout or use default
  let layout: DashboardLayout;
  if (prefs?.dashboardLayout) {
    // MariaDB returns JSON as string - parse it
    layout = typeof prefs.dashboardLayout === "string"
      ? JSON.parse(prefs.dashboardLayout)
      : prefs.dashboardLayout;
  } else {
    layout = DEFAULT_LAYOUT;
  }

  // Filter to only widgets user can access
  return layout.filter((item) => availableIds.has(item.widgetId));
}
```

### Role Restrictions Implementation

| Role | Accessible Widgets |
|------|-------------------|
| VIEWER | Initiative KPIs, Revenue Progress, Status Chart, Department Chart, Workload, Recent |
| EDITOR | All VIEWER widgets + Sales KPIs, Pipeline Stages |
| ADMIN | All widgets |

**Enforcement points:**

1. **Widget Registry:** `minRole` property defines minimum role
2. **Server-side filter:** `getDashboardLayout()` filters by role before returning
3. **Client-side guard:** Double-check role before rendering (defense in depth)
4. **API protection:** Dashboard data APIs check role before returning sensitive data

---

## Data Flow

### Document Upload Flow

```
+-----------+     +--------------+     +----------------+     +-------------+
|   Client  |---->| Server Action|---->|   Filesystem   |---->|  Database   |
|  (Form)   |     |  (Validate)  |     |  (/uploads/)   |     | (Metadata)  |
+-----------+     +--------------+     +----------------+     +-------------+
       |                 |                    |                     |
       |  FormData       |  Auth + Type check |  Write file         |  Create Document
       |  + file         |  + Size check      |  to project folder  |  record
```

### Document Download Flow

```
+-----------+     +--------------+     +----------------+     +-------------+
|   Client  |---->|  API Route   |---->|   Database     |---->| Filesystem  |
|  (Link)   |     | (Auth check) |     |  (Get path)    |     |  (Stream)   |
+-----------+     +--------------+     +----------------+     +-------------+
       |                 |                    |                     |
       |  GET /api/...   |  Verify role +     |  Lookup Document    |  Stream file
       |  /documents/[id]|  project access    |  get storagePath    |  to response
```

### Dashboard Render Flow

```
+-----------+     +--------------+     +----------------+     +-------------+
| Dashboard |---->| Get Layout   |---->| Filter by Role |---->|   Render    |
| Page(SSR) |     |  (Server)    |     | (Widget Reg)   |     |  Widgets    |
+-----------+     +--------------+     +----------------+     +-------------+
       |                 |                    |                     |
       |  Page load      |  Query prefs +     |  Remove widgets     |  Map layout
       |                 |  default layout    |  user can't see     |  to components
```

### Dashboard Customization Flow

```
+-----------+     +--------------+     +----------------+
|   Client  |---->|  @dnd-kit    |---->| Server Action  |
|(Drag/Drop)|     |  (Reorder)   |     | (Save Layout)  |
+-----------+     +--------------+     +----------------+
       |                 |                    |
       |  Drag widget    |  Update local      |  Persist to
       |  to new position|  state + optimistic|  UserPreferences
```

---

## Component Boundaries

### Document Management Components

```
src/
  components/
    documents/
      document-list.tsx        # List documents for a project
      document-upload.tsx      # Upload form (uses Server Action)
      document-card.tsx        # Single document with download/delete
      document-preview.tsx     # Preview modal (images, PDFs)
  lib/
    actions/
      document-actions.ts      # Server Actions: upload, delete
  app/
    api/
      projects/
        [id]/
          documents/
            route.ts           # GET list
            [docId]/
              route.ts         # GET download, DELETE
```

### Dashboard Customization Components

```
src/
  components/
    dashboard/
      customizable-dashboard.tsx  # Main container with @dnd-kit
      widget-wrapper.tsx          # Draggable widget container
      widget-picker.tsx           # Modal to add/remove widgets
      # Existing widgets remain unchanged:
      kpi-cards.tsx
      status-chart.tsx
      department-chart.tsx
      team-workload.tsx
      recent-initiatives.tsx
      crm-kpi-cards.tsx
      pipeline-stage-chart.tsx
  lib/
    dashboard/
      widget-registry.ts          # Widget definitions + role checks
      get-dashboard-layout.ts     # Server-side layout resolution
    actions/
      dashboard-actions.ts        # Server Action: save layout
  types/
    dashboard.ts                  # Layout types
```

### Integration Points

| New Component | Integrates With |
|---------------|-----------------|
| `document-list.tsx` | Project detail page (new tab) |
| `customizable-dashboard.tsx` | Replaces current dashboard page.tsx content |
| `widget-registry.ts` | `permissions.ts` role checks |
| `UserPreferences` model | `User` model (1:1 relation) |

---

## Suggested Build Order (v1.3)

Based on dependencies and complexity, here is the recommended phase structure:

### Phase 1: Database & Core Infrastructure

**Duration:** 1-2 days

1. Add `Document` model to Prisma schema
2. Add `UserPreferences` model to Prisma schema
3. Update `User` and `Project` relations
4. Run migration
5. Create document storage directory structure

**Dependencies:** None (foundation for everything else)

### Phase 2: Document Management

**Duration:** 3-4 days

1. Create document Server Actions (upload, delete)
2. Build API route for download streaming
3. Create `document-list.tsx` component
4. Create `document-upload.tsx` with drag-drop zone
5. Create `document-card.tsx` with preview/download
6. Integrate into project detail page

**Dependencies:** Phase 1 (schema must exist)

**Why before dashboard:** Simpler feature, establishes Server Action patterns

### Phase 3: Widget Registry & Role Filtering

**Duration:** 1-2 days

1. Create `widget-registry.ts` with all existing widgets
2. Implement `canAccessWidget()` role checks
3. Create `get-dashboard-layout.ts` server function
4. Define TypeScript types for layout

**Dependencies:** Phase 1 (UserPreferences schema)

**Why this order:** Registry is foundation for dashboard customization

### Phase 4: Dashboard Customization UI

**Duration:** 3-4 days

1. Create `customizable-dashboard.tsx` with @dnd-kit
2. Create `widget-wrapper.tsx` (draggable container)
3. Create `widget-picker.tsx` (add/remove modal)
4. Create Server Action to save layout
5. Replace existing dashboard with customizable version
6. Test role-based widget visibility

**Dependencies:** Phase 3 (widget registry must exist)

### Phase 5: Polish & Testing

**Duration:** 1-2 days

1. Add loading states and error handling
2. Implement optimistic updates for drag-drop
3. Add document preview for images/PDFs
4. Test all role combinations
5. Mobile responsiveness for customization UI

**Dependencies:** Phases 2-4 complete

---

## Technology Decisions

### Use @dnd-kit for Dashboard (Not react-grid-layout)

**Recommendation:** Continue using `@dnd-kit` already in the project.

**Rationale:**
- Already installed and used for Kanban boards
- No resize requirement for widgets (just reorder)
- Smaller bundle size than react-grid-layout
- Consistent DX across the codebase
- Better mobile/touch support

**When to reconsider:** If widget resizing becomes a requirement, evaluate `react-grid-layout`.

**Reference:** [Interactive Dashboards: Why React-Grid-Layout Was Our Best Choice](https://www.ilert.com/blog/building-interactive-dashboards-why-react-grid-layout-was-our-best-choice)

### Use JSON Column for Layout (Not Normalized Tables)

**Recommendation:** Store layout as JSON in `UserPreferences.dashboardLayout`.

**Rationale:**
- Layout is read-as-whole, written-as-whole (no partial updates)
- Schema flexibility for future additions
- Simpler queries (single read vs joins)
- MariaDB JSON type works fine (LONGTEXT with validation)

**Tradeoff:** Can't query "which users have widget X visible" easily. Acceptable for this use case.

**Reference:** [Working with JSON fields | Prisma Documentation](https://www.prisma.io/docs/orm/prisma-client/special-fields-and-types/working-with-json-fields)

### Use Server Actions for Uploads (Not API Routes)

**Recommendation:** Server Actions for document uploads.

**Rationale:**
- Simpler code (no separate API route)
- Progressive enhancement (works without JS)
- Type-safe with TypeScript
- Natural integration with forms
- Existing pattern in codebase

**Reference:** [File Upload with Next.js 14 and Server Actions](https://akoskm.com/file-upload-with-nextjs-14-and-server-actions/)

---

## Anti-Patterns to Avoid

### Document Management

| Anti-Pattern | Why Bad | Instead |
|--------------|---------|---------|
| Store files in `/public` | Publicly accessible, no auth | Use `/uploads/` outside webroot |
| Trust client MIME type | Can be spoofed | Validate on server, check magic bytes |
| Store full path in DB | Breaks if storage moves | Store relative path, configure base |
| No file size limit | DoS risk | Enforce max size server-side |

### Dashboard Customization

| Anti-Pattern | Why Bad | Instead |
|--------------|---------|---------|
| Client-only role checks | Can be bypassed | Server-side validation |
| Store layout per-session | Lost on logout | Persist to database |
| Load all widget data upfront | Slow for hidden widgets | Lazy load visible only |
| No default layout | Blank dashboard for new users | Sensible defaults |

---

## Sources

### File Upload & Storage
- [File Upload with Next.js 14 and Server Actions | Akos Komuves](https://akoskm.com/file-upload-with-nextjs-14-and-server-actions/)
- [Next.js File Uploads: Server-Side Solutions | ProNextJS](https://www.pronextjs.dev/next-js-file-uploads-server-side-solutions)
- [Handling File Uploads in Next.js Best Practices and Security | MoldStud](https://moldstud.com/articles/p-handling-file-uploads-in-nextjs-best-practices-and-security-considerations)
- [Shield Your Data: How to Manage Private Files in Next.js | Medium](https://prateekbadjatya.medium.com/shield-your-data-how-to-manage-private-files-in-next-js-applications-5895c9093b1c)

### Dashboard Customization
- [Building Customizable Dashboard Widgets Using React Grid Layout | AntStack](https://www.antstack.com/blog/building-customizable-dashboard-widgets-using-react-grid-layout/)
- [Interactive Dashboards: Why React-Grid-Layout Was Our Best Choice | ilert](https://www.ilert.com/blog/building-interactive-dashboards-why-react-grid-layout-was-our-best-choice)
- [Top 5 Drag-and-Drop Libraries for React | Puck](https://puckeditor.com/blog/top-5-drag-and-drop-libraries-for-react)
- [Can DND do the react-grid-layout showcase? | GitHub Discussion](https://github.com/clauderic/dnd-kit/discussions/1560)

### Role-Based Access Control
- [Implementing Role Based Access Control (RBAC) in React | Permit.io](https://www.permit.io/blog/implementing-react-rbac-authorization)
- [Authorization | React-admin Documentation](https://marmelab.com/react-admin/Permissions.html)

### Prisma & Database
- [Working with JSON fields | Prisma Documentation](https://www.prisma.io/docs/orm/prisma-client/special-fields-and-types/working-with-json-fields)
- [MariaDB JSON Data Type | Documentation](https://mariadb.com/docs/server/reference/data-types/string-data-types/json)
- [prisma-json-types-generator | npm](https://www.npmjs.com/package/prisma-json-types-generator)

---

## Confidence Assessment

| Area | Confidence | Rationale |
|------|------------|-----------|
| Document Storage | HIGH | Follows existing receiptPath pattern, well-documented approach |
| Upload Security | HIGH | Standard practices from official sources |
| Dashboard Layout | HIGH | JSON persistence is proven pattern, @dnd-kit already in use |
| Role Restrictions | HIGH | Extends existing permissions.ts pattern |
| MariaDB JSON | MEDIUM | Works but is LONGTEXT alias - parse in app code |
| Widget Registry | HIGH | Standard React pattern, no external deps |

---

## Open Questions for Implementation

1. **Document preview:** Support inline PDF/image preview or download-only?
2. **Widget data caching:** Cache dashboard data or fetch fresh on each render?
3. **Layout migration:** How to handle layout when new widgets are added? (Auto-add to end?)
4. **Mobile dashboard:** Allow customization on mobile or fixed layout?

---

*Architecture research for v1.3: 2026-01-23*
