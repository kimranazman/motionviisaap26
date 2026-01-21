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

*Architecture research: 2026-01-22*
