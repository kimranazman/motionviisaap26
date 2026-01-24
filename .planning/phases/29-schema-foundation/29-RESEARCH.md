# Phase 29: Schema Foundation - Research

**Researched:** 2026-01-24
**Domain:** Prisma ORM Schema Design (MySQL/MariaDB)
**Confidence:** HIGH

## Summary

This research analyzes the existing SAAP2026v2 Prisma schema and determines how to add five new models (Supplier, Department, Deliverable, Task, ActivityLog) for v1.4 features. The codebase uses Prisma 6.19.2 with MySQL/MariaDB, and follows well-established patterns for foreign keys, enums, timestamps, and table mappings.

**Key findings:**
- The existing schema demonstrates consistent patterns that new models should follow
- Self-referencing relations for Task hierarchy are well-supported by Prisma
- Polymorphic relations for ActivityLog require a discriminator pattern (entityType + entityId)
- The project uses `prisma db push` for schema updates, not formal migrations

**Primary recommendation:** Add all five models in a single schema update following existing conventions exactly. Use enums for finite status/priority fields and maintain the established naming patterns.

## Current Schema Analysis

### Existing Models (13 total)

| Model | Purpose | Key Relations |
|-------|---------|---------------|
| Initiative | KRI tracking | -> Comments, -> Projects |
| Comment | Initiative comments | -> Initiative, -> User |
| Event | Event records | standalone |
| EventToAttend | Industry events | standalone |
| User | Authentication | -> Account, Session, Comment, Document |
| Account | OAuth accounts | -> User |
| Session | User sessions | -> User |
| VerificationToken | Auth tokens | standalone |
| Company | Client organizations | -> Contact, Deal, PotentialProject, Project |
| Contact | People at companies | -> Company, -> Deal, PotentialProject, Project |
| Deal | New business pipeline | -> Company, Contact, Project |
| PotentialProject | Repeat client pipeline | -> Company, Contact, Project |
| Project | Actual work | -> Company, Contact, Deal, Potential, Initiative, Cost, Document |
| CostCategory | Cost classification lookup | -> Cost |
| Cost | Project expenses | -> Project, CostCategory |
| Document | Project files | -> Project, User |
| UserPreferences | Dashboard settings | -> User (1:1) |
| AdminDefaults | System defaults | singleton |

### Established Patterns

**Confidence: HIGH** - Directly observed in schema.prisma

#### 1. ID Generation
```prisma
id String @id @default(cuid())
```
All models use CUID string IDs, not auto-increment integers.

#### 2. Timestamps
```prisma
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt
```
Every model includes both timestamps.

#### 3. Foreign Key Naming
```prisma
companyId String  @map("company_id")
company   Company @relation(fields: [companyId], references: [id])
```
- camelCase in Prisma schema
- snake_case in database via `@map`
- Relation field uses entity name without "Id" suffix

#### 4. Table Mapping
```prisma
@@map("table_name")  // snake_case, plural
```

#### 5. Indexes
```prisma
@@index([foreignKeyField])
@@index([statusField])
@@index([commonQueryField])
```
Indexes on: foreign keys, status/stage fields, date fields, boolean filters.

#### 6. Optional Relations
```prisma
contactId String?  @map("contact_id")
contact   Contact? @relation(fields: [contactId], references: [id])
```
Optional FKs use `?` on both the ID and relation fields.

#### 7. Enum Definition
```prisma
enum DealStage {
  LEAD
  QUALIFIED
  PROPOSAL
  NEGOTIATION
  WON
  LOST
}
```
SCREAMING_SNAKE_CASE for enum values.

#### 8. Cascade Delete
```prisma
@relation(fields: [projectId], references: [id], onDelete: Cascade)
```
Used when child records should be deleted with parent (Comments -> Initiative, Costs -> Project).

#### 9. Decimal Fields
```prisma
amount Decimal @db.Decimal(12, 2)
```
Financial values use Decimal(12,2).

#### 10. Text Fields
```prisma
description String? @db.Text      // Long text
title       String  @db.VarChar(255)  // Short string
```

## Model Design Recommendations

### 1. Supplier Model

**Requirements:** SUPP-01 through SUPP-09

```prisma
enum PaymentTerms {
  IMMEDIATE
  NET_7
  NET_15
  NET_30
  NET_45
  NET_60
  NET_90
}

model Supplier {
  id              String        @id @default(cuid())
  name            String        @db.VarChar(255)

  // Contact info
  email           String?       @db.VarChar(255)
  phone           String?       @db.VarChar(50)
  address         String?       @db.Text
  website         String?       @db.VarChar(255)
  contactPerson   String?       @map("contact_person") @db.VarChar(255)

  // Credit terms
  acceptsCredit   Boolean       @default(false) @map("accepts_credit")
  paymentTerms    PaymentTerms? @map("payment_terms")

  notes           String?       @db.Text

  // Relations
  costs           Cost[]

  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  @@index([name])
  @@map("suppliers")
}
```

**Cost model addition:**
```prisma
// Add to existing Cost model:
supplierId String?   @map("supplier_id")
supplier   Supplier? @relation(fields: [supplierId], references: [id])

@@index([supplierId])  // Add to existing indexes
```

**Confidence: HIGH** - Follows existing patterns exactly

### 2. Department Model

**Requirements:** DEPT-01 through DEPT-08

```prisma
model Department {
  id          String   @id @default(cuid())
  name        String   @db.VarChar(255)
  description String?  @db.Text

  companyId   String   @map("company_id")
  company     Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)

  contacts    Contact[]
  deals       Deal[]
  potentials  PotentialProject[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([companyId, name])  // No duplicate dept names per company
  @@index([companyId])
  @@map("departments")
}
```

**Contact model addition:**
```prisma
// Add to existing Contact model:
departmentId String?     @map("department_id")
department   Department? @relation(fields: [departmentId], references: [id])

@@index([departmentId])  // Add to existing indexes
```

**Deal model addition:**
```prisma
// Add to existing Deal model:
departmentId String?     @map("department_id")
department   Department? @relation(fields: [departmentId], references: [id])

@@index([departmentId])  // Add to existing indexes
```

**PotentialProject model addition:**
```prisma
// Add to existing PotentialProject model:
departmentId String?     @map("department_id")
department   Department? @relation(fields: [departmentId], references: [id])

@@index([departmentId])  // Add to existing indexes
```

**Company model addition:**
```prisma
// Add to existing Company model:
departments Department[]
```

**Confidence: HIGH** - Standard hierarchical pattern

### 3. Deliverable Model

**Requirements:** DELV-01 through DELV-05

```prisma
model Deliverable {
  id          String   @id @default(cuid())
  title       String   @db.VarChar(500)
  description String?  @db.Text
  value       Decimal? @db.Decimal(12, 2)
  sortOrder   Int      @default(0) @map("sort_order")

  projectId   String   @map("project_id")
  project     Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)

  // AI extraction tracking (similar to Cost.aiImported)
  aiExtracted Boolean  @default(false) @map("ai_extracted")

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([projectId])
  @@map("deliverables")
}
```

**Project model addition:**
```prisma
// Add to existing Project model:
deliverables Deliverable[]
```

**Confidence: HIGH** - Direct parallel to Cost pattern

### 4. Task Model (Self-Referencing)

**Requirements:** TASK-01 through TASK-14

```prisma
enum TaskStatus {
  TODO
  IN_PROGRESS
  DONE
}

enum TaskPriority {
  LOW
  MEDIUM
  HIGH
}

model Task {
  id           String       @id @default(cuid())
  title        String       @db.VarChar(500)
  description  String?      @db.Text

  status       TaskStatus   @default(TODO)
  priority     TaskPriority @default(MEDIUM)
  dueDate      DateTime?    @map("due_date")

  // Assignee (reuse existing TeamMember enum)
  assignee     TeamMember?

  // Project relation
  projectId    String       @map("project_id")
  project      Project      @relation(fields: [projectId], references: [id], onDelete: Cascade)

  // Self-referencing for subtasks (up to 5 levels)
  parentId     String?      @map("parent_id")
  parent       Task?        @relation("TaskSubtasks", fields: [parentId], references: [id], onDelete: NoAction, onUpdate: NoAction)
  children     Task[]       @relation("TaskSubtasks")

  // Hierarchy metadata
  depth        Int          @default(0)  // 0=root, max=4 (5 levels)
  sortOrder    Int          @default(0)  @map("sort_order")

  // Relations
  comments     TaskComment[]
  tags         TaskTag[]

  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt

  @@index([projectId])
  @@index([parentId])
  @@index([status])
  @@index([assignee])
  @@index([dueDate])
  @@map("tasks")
}

model TaskComment {
  id        String   @id @default(cuid())
  content   String   @db.Text

  taskId    String   @map("task_id")
  task      Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)

  userId    String   @map("user_id")
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([taskId])
  @@index([userId])
  @@map("task_comments")
}

model Tag {
  id        String    @id @default(cuid())
  name      String    @unique @db.VarChar(50)
  color     String    @default("#6B7280") @db.VarChar(7)  // Hex color

  tasks     TaskTag[]

  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  @@map("tags")
}

model TaskTag {
  id        String   @id @default(cuid())

  taskId    String   @map("task_id")
  task      Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)

  tagId     String   @map("tag_id")
  tag       Tag      @relation(fields: [tagId], references: [id], onDelete: Cascade)

  inherited Boolean  @default(false)  // true if inherited from parent task

  createdAt DateTime @default(now())

  @@unique([taskId, tagId])
  @@index([taskId])
  @@index([tagId])
  @@map("task_tags")
}
```

**Project model addition:**
```prisma
// Add to existing Project model:
tasks Task[]
```

**User model addition:**
```prisma
// Add to existing User model:
taskComments TaskComment[]
```

**Self-Reference Pattern Notes:**
- Source: [Prisma Self-Relations Documentation](https://www.prisma.io/docs/orm/prisma-schema/data-model/relations/self-relations)
- Must use `onDelete: NoAction, onUpdate: NoAction` to avoid cascade cycles
- Relation name "TaskSubtasks" links parent/children
- `depth` field enforces 5-level max at application layer

**Confidence: HIGH** - Verified with official Prisma documentation

### 5. ActivityLog Model (Polymorphic)

**Requirements:** SYNC-06

```prisma
enum ActivityEntityType {
  DEAL
  POTENTIAL
  PROJECT
}

enum ActivityAction {
  CREATED
  UPDATED
  STAGE_CHANGED
  TITLE_SYNCED
  REVENUE_UPDATED
  STATUS_CHANGED
  CONVERTED
}

model ActivityLog {
  id          String             @id @default(cuid())

  // Polymorphic reference
  entityType  ActivityEntityType @map("entity_type")
  entityId    String             @map("entity_id")

  // Activity details
  action      ActivityAction
  field       String?            @db.VarChar(50)   // Which field changed
  oldValue    String?            @map("old_value") @db.Text
  newValue    String?            @map("new_value") @db.Text

  // Optional user who triggered the change (null for system actions)
  userId      String?            @map("user_id")
  user        User?              @relation(fields: [userId], references: [id])

  createdAt   DateTime           @default(now())

  @@index([entityType, entityId])
  @@index([createdAt])
  @@index([userId])
  @@map("activity_logs")
}
```

**User model addition:**
```prisma
// Add to existing User model:
activityLogs ActivityLog[]
```

**Polymorphic Pattern Notes:**
- Source: [Prisma Table Inheritance Documentation](https://www.prisma.io/docs/orm/prisma-schema/data-model/table-inheritance)
- Prisma does not natively support polymorphic relations
- Use discriminator pattern: `entityType` enum + `entityId` string
- Application layer resolves to actual entity when needed
- Composite index `[entityType, entityId]` for efficient queries

**Confidence: HIGH** - Standard workaround documented by Prisma

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Task hierarchy depth | Manual tree traversal | `depth` field + validation | Enforced at insert time, O(1) check |
| Tag inheritance | Complex parent lookup | `inherited` flag on TaskTag | Denormalized for speed |
| Activity history | Manual field tracking | ActivityLog with discrete actions | Explicit, queryable, auditable |
| Subtask progress | Count on every render | Computed in aggregate query | Single DB round-trip |

## Common Pitfalls

### Pitfall 1: Self-Reference Cascade Cycles

**What goes wrong:** Using `onDelete: Cascade` on self-referencing relations causes MySQL errors.

**Why it happens:** Database cannot determine deletion order in cyclical references.

**How to avoid:** Use `onDelete: NoAction, onUpdate: NoAction` on the parent reference. Handle deletion in application code with recursive delete if needed.

**Warning signs:** Prisma migration fails with "cycle detected" error.

### Pitfall 2: Unbounded Nesting Depth

**What goes wrong:** Tasks can be nested infinitely, causing UI/performance issues.

**Why it happens:** No database constraint on depth.

**How to avoid:** Store `depth` field, validate `depth < 5` before creating subtask.

**Warning signs:** UI tree becomes unrenderable, queries slow down.

### Pitfall 3: Tag Inheritance Stale State

**What goes wrong:** Parent tag removed but children still show inherited tag.

**Why it happens:** Denormalized `inherited` flag not updated when parent changes.

**How to avoid:** Update tag inheritance in transaction when parent tags change. Consider trigger or application-layer hook.

**Warning signs:** Subtasks show tags that parent no longer has.

### Pitfall 4: Polymorphic Query Complexity

**What goes wrong:** N+1 queries when fetching activity logs with their entities.

**Why it happens:** Can't use Prisma include on polymorphic relation.

**How to avoid:** Query activities first, then batch-fetch entities grouped by type.

**Warning signs:** Activity feed page is slow with many entries.

### Pitfall 5: Existing Enum Conflict

**What goes wrong:** `Department` enum already exists in schema (used by Initiative).

**Why it happens:** Naming collision with new Department model.

**How to avoid:** Keep existing `Department` enum (rename to `InitiativeDepartment` if desired, but breaking change). New `Department` model is distinct - it's a table for Company subdivisions, not the Initiative enum.

**Warning signs:** Prisma validation error about duplicate name.

**Decision:** Rename existing enum to `InitiativeDepartment` for clarity:
```prisma
// Change from:
enum Department { BIZ_DEV, OPERATIONS, FINANCE, MARKETING }
model Initiative { ... department Department ... }

// To:
enum InitiativeDepartment { BIZ_DEV, OPERATIONS, FINANCE, MARKETING }
model Initiative { ... department InitiativeDepartment ... }
```

## Code Examples

### Creating Task with Subtasks

```typescript
// Source: Existing codebase patterns + Prisma docs

// Create parent task
const parentTask = await prisma.task.create({
  data: {
    title: "Design Phase",
    projectId: projectId,
    depth: 0,
  },
});

// Create subtask (validating depth)
const createSubtask = async (parentId: string, title: string) => {
  const parent = await prisma.task.findUnique({
    where: { id: parentId },
    select: { depth: true, projectId: true },
  });

  if (!parent) throw new Error("Parent not found");
  if (parent.depth >= 4) throw new Error("Maximum nesting depth reached");

  return prisma.task.create({
    data: {
      title,
      projectId: parent.projectId,
      parentId,
      depth: parent.depth + 1,
    },
  });
};
```

### Fetching Task Tree

```typescript
// Fetch 5 levels deep (max depth)
const tasks = await prisma.task.findMany({
  where: {
    projectId,
    parentId: null,  // Root tasks only
  },
  include: {
    children: {
      include: {
        children: {
          include: {
            children: {
              include: {
                children: true,  // Level 5
              },
            },
          },
        },
      },
    },
    tags: { include: { tag: true } },
    comments: { include: { user: { select: { id: true, name: true } } } },
  },
  orderBy: { sortOrder: 'asc' },
});
```

### Computing Subtask Progress

```typescript
// Get progress for a task
const getTaskProgress = async (taskId: string) => {
  const result = await prisma.task.aggregate({
    where: { parentId: taskId },
    _count: { _all: true },
  });

  const doneCount = await prisma.task.count({
    where: { parentId: taskId, status: 'DONE' },
  });

  return {
    total: result._count._all,
    completed: doneCount,
  };
};
```

### Creating Activity Log Entry

```typescript
// Log a stage change
await prisma.activityLog.create({
  data: {
    entityType: 'DEAL',
    entityId: deal.id,
    action: 'STAGE_CHANGED',
    field: 'stage',
    oldValue: oldStage,
    newValue: newStage,
    userId: session.user.id,
  },
});
```

### Fetching Activity Feed with Entities

```typescript
// Batch-fetch pattern for polymorphic relations
const activities = await prisma.activityLog.findMany({
  where: { entityType: 'DEAL', entityId: dealId },
  orderBy: { createdAt: 'desc' },
  include: { user: { select: { id: true, name: true, image: true } } },
});

// If you need the actual deal data, fetch separately
const deal = await prisma.deal.findUnique({
  where: { id: dealId },
  // ... includes
});
```

## Migration Approach

### Strategy: `prisma db push`

**Confidence: HIGH** - This is how the project currently operates.

The project does not use Prisma migrations (`prisma migrate`). Instead, it uses `prisma db push` for schema synchronization.

**Scripts in package.json:**
```json
"db:push": "prisma db push",
"db:generate": "prisma generate"
```

**Process:**
1. Update `prisma/schema.prisma` with all new models
2. Run `npm run db:push` to sync schema to database
3. Run `npm run db:generate` to regenerate Prisma Client
4. Test locally
5. Deploy (build step runs `prisma generate` automatically)

**References:**
- [Prisma db push Documentation](https://www.prisma.io/docs/orm/prisma-migrate/workflows/prototyping-your-schema)
- [Development and Production Workflows](https://www.prisma.io/docs/orm/prisma-migrate/workflows/development-and-production)

### Order of Operations

Since these are all new tables with no data, order doesn't matter. However, for clarity:

1. Add new enums first (`PaymentTerms`, `TaskStatus`, `TaskPriority`, `ActivityEntityType`, `ActivityAction`)
2. Rename existing `Department` enum to `InitiativeDepartment`
3. Add standalone models (`Supplier`, `Department`, `Tag`, `ActivityLog`)
4. Add related models (`Deliverable`, `Task`, `TaskComment`, `TaskTag`)
5. Add FK fields to existing models (`Cost.supplierId`, `Contact.departmentId`, etc.)

### Seeding (Optional)

May want to seed default tags similar to cost categories:
```typescript
// prisma/seed-tags.ts
const defaultTags = [
  { name: 'Urgent', color: '#EF4444' },
  { name: 'Blocked', color: '#F59E0B' },
  { name: 'Review', color: '#3B82F6' },
  { name: 'Documentation', color: '#10B981' },
];
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Integer IDs | CUID string IDs | Project start | Already using current approach |
| Raw SQL migrations | Prisma db push | Project start | Already using current approach |
| Polymorphic FK | Discriminator pattern | N/A (Prisma limitation) | Manual entity resolution required |

**Deprecated/outdated:**
- None relevant to this phase - Prisma 6.x patterns are current

## Open Questions

1. **Tag Management Scope**
   - What we know: Tasks need tags, tags inherit to subtasks
   - What's unclear: Should tags be project-scoped or global?
   - Recommendation: Start with global tags (simpler), can add `projectId` later if needed

2. **Activity Log Retention**
   - What we know: Logs sync changes on deal/potential cards
   - What's unclear: How long to keep logs? Pagination strategy?
   - Recommendation: No automatic cleanup initially; add pagination at 50 entries per page

3. **Subtask Deletion Behavior**
   - What we know: `onDelete: NoAction` prevents cascade
   - What's unclear: Delete children recursively or orphan them?
   - Recommendation: Recursive delete in application code (matches requirement "delete task with subtasks")

## Sources

### Primary (HIGH confidence)
- `/Users/khairul/Documents/MyDev/Work/Motionvii/saap2026v2/prisma/schema.prisma` - Full existing schema analysis
- [Prisma Self-Relations Documentation](https://www.prisma.io/docs/orm/prisma-schema/data-model/relations/self-relations) - One-to-many self-reference pattern
- [Prisma Table Inheritance Documentation](https://www.prisma.io/docs/orm/prisma-schema/data-model/table-inheritance) - Polymorphic relation workarounds

### Secondary (MEDIUM confidence)
- [Prisma Prototyping Schema](https://www.prisma.io/docs/orm/prisma-migrate/workflows/prototyping-your-schema) - db push workflow
- [GitHub Discussion #16817](https://github.com/prisma/prisma/discussions/16817) - Nested self-relation fetching

### Tertiary (LOW confidence)
- None - all findings verified with official sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Existing schema provides clear patterns
- Architecture: HIGH - Well-documented Prisma patterns
- Pitfalls: HIGH - Verified with official docs and GitHub issues

**Research date:** 2026-01-24
**Valid until:** 2026-03-24 (60 days - Prisma schema patterns stable)
