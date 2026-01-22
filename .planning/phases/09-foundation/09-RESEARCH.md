# Phase 9: Foundation - Research

**Researched:** 2026-01-22
**Domain:** Prisma schema design for CRM and project financials (MariaDB)
**Confidence:** HIGH

## Summary

Phase 9 establishes the database foundation for v1.2 CRM and Project Financials. Research confirms that Prisma 6.x with MariaDB supports all required features, and the existing schema patterns in this codebase provide clear precedents. The key decisions are: (1) use `Decimal(12,2)` for all currency fields via `@db.Decimal(12,2)`; (2) use separate entities for Deal, PotentialProject, and Project with optional linkages; (3) seed CostCategory as a lookup table rather than using an enum (allows future extensibility); (4) follow existing naming conventions (snake_case tables, cuid IDs, explicit indexes).

The schema design is straightforward because the data model was already researched in the v1.2 milestone research (`.planning/research/SUMMARY.md`). This phase implements that design in Prisma, runs the migration, and seeds the cost categories. The existing schema already uses `Decimal(12,2)` for financial fields (see `Initiative.resourcesFinancial`), so the pattern is established.

**Primary recommendation:** Extend existing schema patterns. Use `Decimal` for currency, `cuid()` for IDs, snake_case for table names via `@@map`, and create explicit indexes on foreign keys and commonly queried fields.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Prisma | ^6.19.2 | ORM and migrations | Already installed, handles schema-to-MariaDB mapping |
| @prisma/client | ^6.19.2 | Database queries | Type-safe queries, Decimal.js integration |
| ts-node | ^10.9.2 | Seed script execution | Already installed, runs TypeScript seeds |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| tsx | (if needed) | Faster TS execution | Alternative to ts-node if seed is slow |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Decimal type | Integer cents | Cents approach avoids Decimal.js complexity but requires conversion everywhere |
| Enum for CostCategory | Lookup table | Lookup table allows adding categories without migration |
| Single Deal entity | Separate Deal + PotentialProject | Separate entities are clearer for UI but require two Kanbans |

**Installation:**
```bash
# No new packages needed - Prisma already installed
```

## Architecture Patterns

### Recommended Schema Structure
```
prisma/
├── schema.prisma       # All models defined here
├── seed.ts             # Existing seed script (initiatives, events)
└── seed-cost-categories.ts  # New: seed CostCategory lookup data
```

### Pattern 1: Currency Fields with Decimal(12,2)
**What:** Use `Decimal @db.Decimal(12,2)` for all monetary values
**When to use:** Any field storing money (deal value, project revenue, cost amount)
**Example:**
```prisma
// Source: Existing schema (Initiative.resourcesFinancial) and Prisma docs
model Deal {
  value         Decimal?     @db.Decimal(12, 2)  // Up to 9,999,999,999.99
  // ...
}

model Project {
  revenue       Decimal?     @db.Decimal(12, 2)
  // ...
}

model Cost {
  amount        Decimal      @db.Decimal(12, 2)  // Required - costs always have amount
  // ...
}
```

**Why (12,2):**
- 12 total digits, 2 after decimal
- Supports values up to RM 9,999,999,999.99 (sufficient for Motionvii)
- Matches existing `resourcesFinancial` field in Initiative
- Prisma returns as `Decimal.js` instance; use `.toNumber()` for calculations

### Pattern 2: Lookup Table vs Enum for Categories
**What:** Use a database table for CostCategory instead of Prisma enum
**When to use:** Categories that may change without requiring migration
**Example:**
```prisma
// Source: Database design best practices for extensibility
model CostCategory {
  id          String    @id @default(cuid())
  name        String    @unique @db.VarChar(50)
  description String?   @db.VarChar(255)
  sortOrder   Int       @default(0)
  isActive    Boolean   @default(true)

  costs       Cost[]

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@map("cost_categories")
}

model Cost {
  id            String       @id @default(cuid())
  categoryId    String       @map("category_id")
  category      CostCategory @relation(fields: [categoryId], references: [id])
  // ...

  @@index([categoryId])
  @@map("costs")
}
```

**Seeded categories:**
| Name | Description | Sort Order |
|------|-------------|------------|
| Labor | Internal staff costs | 1 |
| Materials | Physical materials and supplies | 2 |
| Vendors | Third-party contractor/vendor costs | 3 |
| Travel | Transportation and accommodation | 4 |
| Software | Software licenses and subscriptions | 5 |
| Other | Miscellaneous costs | 6 |

### Pattern 3: Entity Relationships with Optional Links
**What:** Use nullable foreign keys for optional relationships between entities
**When to use:** Deal-to-Project, PotentialProject-to-Project, Project-to-Initiative links
**Example:**
```prisma
// Source: Prisma relations documentation
model Deal {
  id          String    @id @default(cuid())
  // ... deal fields

  // Optional: Link to created project (when deal moves to Won)
  projectId   String?   @unique @map("project_id")
  project     Project?  @relation(fields: [projectId], references: [id])

  @@map("deals")
}

model Project {
  id          String    @id @default(cuid())
  // ... project fields

  // Optional: Link back to source deal
  sourceDeal  Deal?     // Inverse of Deal.project

  // Optional: Link to source potential project
  sourcePotential PotentialProject?

  // Optional: Link to KRI (initiative)
  initiativeId String?  @map("initiative_id")
  initiative   Initiative? @relation(fields: [initiativeId], references: [id])

  @@index([initiativeId])
  @@map("projects")
}
```

### Pattern 4: Stage Enums for Pipeline Status
**What:** Use Prisma enums for fixed pipeline stages
**When to use:** Deal stages (fixed 6 stages), PotentialProject stages (fixed 3 stages), Project status (fixed 4 stages)
**Example:**
```prisma
// Source: Requirements and v1.2 research
enum DealStage {
  LEAD
  QUALIFIED
  PROPOSAL
  NEGOTIATION
  WON
  LOST
}

enum PotentialStage {
  POTENTIAL
  CONFIRMED
  CANCELLED
}

enum ProjectStatus {
  DRAFT
  ACTIVE
  COMPLETED
  CANCELLED
}

model Deal {
  stage       DealStage     @default(LEAD)
  stageChangedAt DateTime   @default(now()) @map("stage_changed_at")
  // ...

  @@index([stage])
}
```

### Pattern 5: Company-Contact Hierarchy
**What:** Company is parent entity, Contacts belong to Company
**When to use:** All CRM entities reference Company, with optional Contact
**Example:**
```prisma
// Source: CRM schema best practices
model Company {
  id          String    @id @default(cuid())
  name        String    @db.VarChar(255)
  industry    String?   @db.VarChar(100)
  notes       String?   @db.Text

  contacts    Contact[]
  deals       Deal[]
  potentials  PotentialProject[]
  projects    Project[]

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([name])
  @@map("companies")
}

model Contact {
  id          String    @id @default(cuid())
  companyId   String    @map("company_id")
  company     Company   @relation(fields: [companyId], references: [id], onDelete: Cascade)

  name        String    @db.VarChar(255)
  email       String?   @db.VarChar(255)
  phone       String?   @db.VarChar(50)
  role        String?   @db.VarChar(100)  // Job title at company

  deals       Deal[]
  potentials  PotentialProject[]
  projects    Project[]

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([companyId])
  @@map("contacts")
}
```

### Anti-Patterns to Avoid
- **Enum for CostCategory:** Would require migration to add new categories
- **Float for currency:** Precision errors; always use Decimal
- **Missing indexes on foreign keys:** Query performance suffers
- **Storing receipt files in database:** Use filesystem paths, not BLOBs
- **Bidirectional @relation without disambiguation:** Use relation names when multiple relations exist

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Currency precision | JavaScript Number | Prisma Decimal + toNumber() | Floating point errors accumulate |
| Unique IDs | UUID strings | cuid() via @default(cuid()) | Already established pattern in codebase |
| Date handling | Manual Date | DateTime with @default(now()) | Prisma handles timezone properly |
| Cascade deletes | Manual cleanup | onDelete: Cascade in @relation | Database handles referential integrity |
| Sort ordering | Random order | `position` or `sortOrder` Int field | Explicit ordering for UI |

**Key insight:** The existing schema already solves these problems for Initiative and Event entities. Follow the same patterns.

## Common Pitfalls

### Pitfall 1: Decimal Serialization in API Responses
**What goes wrong:** Decimal.js objects don't serialize to JSON cleanly
**Why it happens:** Prisma returns Decimal as Decimal.js instance, not number
**How to avoid:** Call `.toNumber()` before returning from API, or use a serialization helper
**Warning signs:** `{"s":1,"e":2,"d":[123,45]}` in JSON instead of `123.45`
**Code example:**
```typescript
// In API route:
const projects = await prisma.project.findMany()
return NextResponse.json(
  projects.map(p => ({
    ...p,
    revenue: p.revenue?.toNumber() ?? null,
  }))
)
```

### Pitfall 2: Missing Indexes on Foreign Keys
**What goes wrong:** Slow queries when filtering by company, contact, or category
**Why it happens:** Forgetting to add @@index for foreign key columns
**How to avoid:** Always add `@@index([foreignKeyField])` for every @relation field
**Warning signs:** Slow queries in production, especially with larger datasets

### Pitfall 3: Seed Script Not Idempotent
**What goes wrong:** Running seed twice creates duplicate CostCategories
**Why it happens:** Using `create` instead of `upsert` or `createMany` with unique constraint
**How to avoid:** Use `upsert` with the unique field (name) as the `where` condition
**Warning signs:** Duplicate entries, unique constraint violations on re-seed
**Code example:**
```typescript
// Idempotent seeding:
await prisma.costCategory.upsert({
  where: { name: 'Labor' },
  update: {},  // No changes on re-run
  create: { name: 'Labor', description: 'Internal staff costs', sortOrder: 1 },
})
```

### Pitfall 4: Circular Dependencies in Relations
**What goes wrong:** TypeScript errors or runtime issues with relation loading
**Why it happens:** Project -> Deal -> Project circular reference
**How to avoid:** Use explicit relation names and be careful with include depth
**Warning signs:** "Maximum call stack size exceeded" or infinite loops
**Code example:**
```prisma
// Disambiguate with relation names:
model Deal {
  projectId   String?   @unique @map("project_id")
  project     Project?  @relation("DealProject", fields: [projectId], references: [id])
}

model Project {
  sourceDeal  Deal?     @relation("DealProject")
}
```

### Pitfall 5: Enum Value Migration
**What goes wrong:** Adding/removing enum values requires careful migration
**Why it happens:** MariaDB stores enums as strings; adding value is easy, removing is hard
**How to avoid:** Plan enum values carefully upfront; prefer lookup tables for volatile categories
**Warning signs:** Migration fails when removing enum value that has data
**Recommendation:** DealStage, PotentialStage, ProjectStatus are stable; keep as enums. CostCategory is volatile; use lookup table.

## Code Examples

Verified patterns from official sources and existing codebase:

### Complete Schema Addition (new models for Phase 9)
```prisma
// Source: Prisma schema reference + existing codebase patterns

// ============================================================
// CRM & Project Financials Models (v1.2)
// ============================================================

// Pipeline stages for new business deals
enum DealStage {
  LEAD
  QUALIFIED
  PROPOSAL
  NEGOTIATION
  WON
  LOST
}

// Pipeline stages for repeat client opportunities
enum PotentialStage {
  POTENTIAL
  CONFIRMED
  CANCELLED
}

// Project lifecycle status
enum ProjectStatus {
  DRAFT
  ACTIVE
  COMPLETED
  CANCELLED
}

// Company (client organization)
model Company {
  id          String    @id @default(cuid())
  name        String    @db.VarChar(255)
  industry    String?   @db.VarChar(100)
  notes       String?   @db.Text

  contacts    Contact[]
  deals       Deal[]
  potentials  PotentialProject[]
  projects    Project[]

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([name])
  @@map("companies")
}

// Contact (person at a company)
model Contact {
  id          String    @id @default(cuid())
  companyId   String    @map("company_id")
  company     Company   @relation(fields: [companyId], references: [id], onDelete: Cascade)

  name        String    @db.VarChar(255)
  email       String?   @db.VarChar(255)
  phone       String?   @db.VarChar(50)
  role        String?   @db.VarChar(100)

  deals       Deal[]
  potentials  PotentialProject[]
  projects    Project[]

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([companyId])
  @@map("contacts")
}

// Deal (new business pipeline opportunity)
model Deal {
  id              String      @id @default(cuid())
  title           String      @db.VarChar(255)
  description     String?     @db.Text
  value           Decimal?    @db.Decimal(12, 2)

  stage           DealStage   @default(LEAD)
  stageChangedAt  DateTime    @default(now()) @map("stage_changed_at")
  lostReason      String?     @db.Text @map("lost_reason")

  companyId       String      @map("company_id")
  company         Company     @relation(fields: [companyId], references: [id])

  contactId       String?     @map("contact_id")
  contact         Contact?    @relation(fields: [contactId], references: [id])

  // Link to created project (set when stage moves to WON)
  projectId       String?     @unique @map("project_id")
  project         Project?    @relation("DealToProject", fields: [projectId], references: [id])

  position        Int         @default(0)  // Kanban ordering within stage

  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  @@index([companyId])
  @@index([contactId])
  @@index([stage])
  @@map("deals")
}

// PotentialProject (repeat client pipeline opportunity)
model PotentialProject {
  id              String          @id @default(cuid())
  title           String          @db.VarChar(255)
  description     String?         @db.Text
  estimatedValue  Decimal?        @db.Decimal(12, 2) @map("estimated_value")

  stage           PotentialStage  @default(POTENTIAL)
  stageChangedAt  DateTime        @default(now()) @map("stage_changed_at")

  companyId       String          @map("company_id")
  company         Company         @relation(fields: [companyId], references: [id])

  contactId       String?         @map("contact_id")
  contact         Contact?        @relation(fields: [contactId], references: [id])

  // Link to created project (set when stage moves to CONFIRMED)
  projectId       String?         @unique @map("project_id")
  project         Project?        @relation("PotentialToProject", fields: [projectId], references: [id])

  position        Int             @default(0)  // Kanban ordering within stage

  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  @@index([companyId])
  @@index([contactId])
  @@index([stage])
  @@map("potential_projects")
}

// Project (actual work being delivered)
model Project {
  id              String          @id @default(cuid())
  title           String          @db.VarChar(255)
  description     String?         @db.Text
  revenue         Decimal?        @db.Decimal(12, 2)
  status          ProjectStatus   @default(DRAFT)

  companyId       String          @map("company_id")
  company         Company         @relation(fields: [companyId], references: [id])

  contactId       String?         @map("contact_id")
  contact         Contact?        @relation(fields: [contactId], references: [id])

  // Optional: Link back to source deal (if created from pipeline)
  sourceDeal      Deal?           @relation("DealToProject")

  // Optional: Link back to source potential (if created from repeat client)
  sourcePotential PotentialProject? @relation("PotentialToProject")

  // Optional: Link to KRI (initiative)
  initiativeId    String?         @map("initiative_id")
  initiative      Initiative?     @relation(fields: [initiativeId], references: [id])

  costs           Cost[]

  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  @@index([companyId])
  @@index([contactId])
  @@index([initiativeId])
  @@index([status])
  @@map("projects")
}

// CostCategory (lookup table for cost classification)
model CostCategory {
  id          String    @id @default(cuid())
  name        String    @unique @db.VarChar(50)
  description String?   @db.VarChar(255)
  sortOrder   Int       @default(0) @map("sort_order")
  isActive    Boolean   @default(true) @map("is_active")

  costs       Cost[]

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@map("cost_categories")
}

// Cost (line item expense on a project)
model Cost {
  id            String        @id @default(cuid())
  description   String        @db.VarChar(500)
  amount        Decimal       @db.Decimal(12, 2)
  date          DateTime      @default(now())

  projectId     String        @map("project_id")
  project       Project       @relation(fields: [projectId], references: [id], onDelete: Cascade)

  categoryId    String        @map("category_id")
  category      CostCategory  @relation(fields: [categoryId], references: [id])

  // Receipt file path (stored on filesystem, not in DB)
  receiptPath   String?       @db.VarChar(500) @map("receipt_path")

  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  @@index([projectId])
  @@index([categoryId])
  @@index([date])
  @@map("costs")
}
```

### Initiative Model Update (add projects relation)
```prisma
// Add to existing Initiative model:
model Initiative {
  // ... existing fields ...

  projects      Project[]  // New: projects linked to this KRI

  // ... rest of model ...
}
```

### Seed Script for CostCategory
```typescript
// prisma/seed-cost-categories.ts
// Source: Prisma seeding documentation + existing seed pattern

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const costCategories = [
  { name: 'Labor', description: 'Internal staff costs', sortOrder: 1 },
  { name: 'Materials', description: 'Physical materials and supplies', sortOrder: 2 },
  { name: 'Vendors', description: 'Third-party contractor/vendor costs', sortOrder: 3 },
  { name: 'Travel', description: 'Transportation and accommodation', sortOrder: 4 },
  { name: 'Software', description: 'Software licenses and subscriptions', sortOrder: 5 },
  { name: 'Other', description: 'Miscellaneous costs', sortOrder: 6 },
]

async function main() {
  console.log('Seeding cost categories...')

  for (const category of costCategories) {
    await prisma.costCategory.upsert({
      where: { name: category.name },
      update: { description: category.description, sortOrder: category.sortOrder },
      create: category,
    })
    console.log(`  Upserted: ${category.name}`)
  }

  console.log('Cost category seeding complete!')

  // Show summary
  const count = await prisma.costCategory.count()
  console.log(`Total cost categories: ${count}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

### package.json script addition
```json
{
  "scripts": {
    "db:seed:categories": "npx ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed-cost-categories.ts"
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Float for money | Decimal with precision | Always was bad | Prevents precision errors |
| Manual ID generation | cuid()/uuid() | Prisma default | Consistent, collision-free |
| Enum for categories | Lookup table | Best practice | No migration to add categories |
| BLOB for files | Filesystem + path | Best practice | Better performance, backup |

**Deprecated/outdated:**
- `@mysql.Decimal()` syntax: Use `@db.Decimal()` (generic database attribute)
- `autoincrement()` for IDs: Project uses cuid(); don't mix ID strategies

## Open Questions

Things that couldn't be fully resolved:

1. **Should Deal.projectId be nullable or should we create Project immediately on Won?**
   - What we know: Some CRMs create project immediately, others wait
   - What's unclear: User workflow preference
   - Recommendation: Make nullable, create project on stage change to WON (per requirements PIPE-06)

2. **Should we track stage history now or defer?**
   - What we know: Research recommends audit trail for financial changes
   - What's unclear: Complexity vs. value for 3-person team
   - Recommendation: Defer to v1.3. Include `stageChangedAt` timestamp for basic tracking.

3. **CostCategory: use enum or lookup table?**
   - What we know: Both work; enum is simpler, table is more flexible
   - What's unclear: Will categories change?
   - Recommendation: Use lookup table. Categories are listed in requirements but may evolve.

## Sources

### Primary (HIGH confidence)
- [Prisma Schema Reference](https://www.prisma.io/docs/orm/reference/prisma-schema-reference) - Decimal types, relations, indexes
- [Prisma Relations Documentation](https://www.prisma.io/docs/orm/prisma-schema/data-model/relations) - One-to-many, optional relations
- [Prisma Seeding Guide](https://www.prisma.io/docs/orm/prisma-migrate/workflows/seeding) - Idempotent seeding patterns
- [MariaDB DECIMAL Documentation](https://mariadb.com/kb/en/decimal/) - Precision and scale limits
- Existing codebase: `prisma/schema.prisma`, `prisma/seed.ts` - Established patterns

### Secondary (MEDIUM confidence)
- [Prisma GitHub Discussion #10160](https://github.com/prisma/prisma/discussions/10160) - Recommended type for money
- [Red-Gate Project Management Data Model](https://www.red-gate.com/blog/organize-your-time-and-resources-a-project-management-data-model/) - Schema structure patterns
- `.planning/research/SUMMARY.md` - v1.2 milestone research (architecture decisions)

### Tertiary (LOW confidence)
- Web search results for CRM pipeline patterns - General guidance, not schema-specific

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - No new packages needed; Prisma 6.x verified
- Architecture: HIGH - Follows existing codebase patterns; relations well-documented
- Pitfalls: HIGH - Decimal serialization and seeding are well-documented issues

**Research date:** 2026-01-22
**Valid until:** 2026-02-22 (30 days - Prisma is stable, unlikely to change)
