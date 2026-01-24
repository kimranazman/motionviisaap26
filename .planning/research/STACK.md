# Stack Research: Document Management & Customizable Dashboard

**Project:** SAAP v1.3 - Document Management & Dashboard Widgets
**Researched:** 2026-01-23
**Confidence:** HIGH (packages verified via official sources)

## Executive Summary

For adding document uploads and customizable dashboards to SAAP, the recommended approach is:

1. **File Uploads**: Use Next.js 14 native `FormData` API (no extra libraries needed for basic uploads). Add `sharp` for image optimization and `file-type` for secure MIME validation.

2. **Dashboard Widgets**: Use `react-grid-layout` v2 - purpose-built for dashboards with drag-drop and resize. Leverage existing `@dnd-kit` for non-grid drag operations only.

---

## Recommended Packages

### File Upload & Document Management

| Package | Version | Purpose | Rationale |
|---------|---------|---------|-----------|
| `sharp` | ^0.33.x | Image processing/thumbnails | Next.js recommended; 4-5x faster than ImageMagick; generates receipt thumbnails |
| `file-type` | ^19.x | MIME type detection from binary | Security: validates actual file content, not just extension; prevents malicious uploads |

**Why no multer/formidable?**

Next.js 14 App Router has native `FormData` support via `req.formData()`. No middleware needed:
```typescript
// Next.js 14 native approach
export async function POST(request: Request) {
  const formData = await request.formData()
  const file = formData.get('file') as File
  const buffer = Buffer.from(await file.arrayBuffer())
  // Write to filesystem or process
}
```

**Installation:**
```bash
npm install sharp file-type
```

### Dashboard Grid Layout

| Package | Version | Purpose | Rationale |
|---------|---------|---------|-----------|
| `react-grid-layout` | ^2.2.x | Dashboard widget grid | Built-in drag+resize; TypeScript native; React 18 hooks; no additional DnD library needed for grid |
| `react-resizable` | ^3.1.x | Resize handles (peer dep) | Required by react-grid-layout; provides resize functionality |

**Why react-grid-layout over extending @dnd-kit?**

- `@dnd-kit` (already installed) is excellent for Kanban/list operations
- `react-grid-layout` is purpose-built for dashboards with:
  - Built-in resize handles
  - Responsive breakpoints (auto-adapt to mobile)
  - Grid snapping and compaction
  - Layout persistence API (save/restore positions)
- Using @dnd-kit for dashboard would require implementing all grid/resize logic manually

**Installation:**
```bash
npm install react-grid-layout react-resizable
```

**CSS Import Required:**
```typescript
// In your layout or component
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
```

### Utility Packages (Already Available)

| Package | Purpose | Notes |
|---------|---------|-------|
| `crypto.randomUUID()` | Unique file names | Built into Node.js 18+, no package needed |
| `date-fns` | Date formatting for file paths | Already installed (v4.1.0) |

---

## Already Installed (Reuse)

These packages in the current stack can be leveraged for v1.3:

| Package | Current Version | Reuse For |
|---------|-----------------|-----------|
| `@dnd-kit/core` | ^6.3.1 | NOT for dashboard grid (use react-grid-layout instead); keep for Kanban boards |
| `@dnd-kit/sortable` | ^10.0.0 | Existing Kanban functionality |
| `date-fns` | ^4.1.0 | File path date formatting (`/uploads/2026/01/`) |
| `lucide-react` | ^0.562.0 | File type icons (FileText, Image, File, etc.) |
| `@radix-ui/react-dialog` | ^1.1.15 | Upload modal, file preview modal |
| `@radix-ui/react-dropdown-menu` | ^2.1.16 | File actions (download, delete, rename) |
| `@radix-ui/react-progress` | ^1.1.8 | Upload progress indicator |
| `recharts` | ^3.6.0 | Dashboard chart widgets |
| `nanoid` | (if installed from v1.2) | Unique file naming (alternative to crypto.randomUUID) |

---

## What NOT to Use

### File Upload Alternatives

| Package | Why Not |
|---------|---------|
| `multer` | Express middleware; doesn't work well with Next.js App Router; requires disabling body parser |
| `formidable` | Extra dependency when native FormData works; callback-based API is dated |
| `busboy` | Low-level; requires manual stream handling; FormData is simpler |
| Cloud SDKs (S3, etc.) | Over-engineered for NAS local storage; adds external dependency |

### Dashboard Grid Alternatives

| Package | Why Not |
|---------|---------|
| Extend `@dnd-kit` for grid | Requires building grid snapping, resize, responsive breakpoints from scratch |
| `gridstack.js` | jQuery dependency; not React-native |
| `react-dnd` | Older API; react-grid-layout uses it internally anyway |
| `react-beautiful-dnd` | Deprecated; Atlassian discontinued maintenance |

### File Validation Alternatives

| Package | Why Not |
|---------|---------|
| `mime-types` | Only checks file extension, not actual content; security risk |
| `mime` | Same issue; extension-based, not content-based |

---

## Integration Notes

### File Storage Strategy

Given NAS deployment at `/volume1/Motionvii/saap2026v2/`:

```
/volume1/Motionvii/saap2026v2/
  uploads/
    projects/
      {projectId}/
        {year}/{month}/
          {uuid}-{originalName}.{ext}
    thumbnails/
      {projectId}/
        {uuid}-thumb.webp
```

**Docker Volume Mount Required:**
```yaml
# docker-compose.nas.yml - add to app service
volumes:
  - /volume1/Motionvii/saap2026v2/uploads:/app/uploads
```

### Prisma Schema Additions

**Document model:**
```prisma
model Document {
  id          String    @id @default(cuid())
  projectId   String    @map("project_id")
  project     Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)

  filename    String    @db.VarChar(255)  // Original filename
  filepath    String    @db.VarChar(500)  // /uploads/projects/{id}/...
  mimeType    String    @db.VarChar(100)
  fileSize    Int                         // Bytes
  category    String?   @db.VarChar(50)   // receipt, invoice, contract, etc.

  uploadedBy  String    @map("uploaded_by")
  user        User      @relation(fields: [uploadedBy], references: [id])

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([projectId])
  @@index([category])
  @@map("documents")
}
```

**Dashboard layout model:**
```prisma
model UserDashboardLayout {
  id        String   @id @default(cuid())
  userId    String   @unique @map("user_id")
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  layout    Json     // Stores react-grid-layout positions
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("user_dashboard_layouts")
}
```

### Widget Role Restrictions

Use existing role infrastructure:
```typescript
// Widget visibility by role
const WIDGET_PERMISSIONS = {
  'revenue-chart': ['ADMIN', 'EDITOR'],
  'cost-summary': ['ADMIN', 'EDITOR'],
  'project-status': ['ADMIN', 'EDITOR', 'VIEWER'],
  'recent-activity': ['ADMIN', 'EDITOR', 'VIEWER'],
  'deals-pipeline': ['ADMIN', 'EDITOR'],
  'upcoming-events': ['ADMIN', 'EDITOR', 'VIEWER'],
} as const
```

### react-grid-layout v2 API

v2 uses TypeScript-native hooks:
```typescript
import { ResponsiveGridLayout } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

// Layout definition
const layouts = {
  lg: [
    { i: 'revenue-chart', x: 0, y: 0, w: 6, h: 4 },
    { i: 'cost-summary', x: 6, y: 0, w: 6, h: 4 },
    { i: 'project-status', x: 0, y: 4, w: 4, h: 3 },
  ],
  md: [...],
  sm: [...],
}

// Component usage
<ResponsiveGridLayout
  layouts={layouts}
  breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480 }}
  cols={{ lg: 12, md: 10, sm: 6, xs: 4 }}
  onLayoutChange={(layout, layouts) => saveToDatabase(layouts)}
  draggableHandle=".widget-header"
  isResizable={true}
  isDraggable={true}
>
  {widgets.map(widget => (
    <div key={widget.id}>
      <WidgetComponent widget={widget} />
    </div>
  ))}
</ResponsiveGridLayout>
```

---

## Package Summary

### New Dependencies (4 packages)

```bash
npm install sharp file-type react-grid-layout react-resizable
```

### TypeScript Types

- `sharp`: Bundled types (no @types needed)
- `file-type`: Bundled types (ESM package)
- `react-grid-layout` v2: Bundled types (no @types/react-grid-layout needed)
- `react-resizable` v3: Bundled types (no @types needed)

### Peer Dependencies Met

All new packages are compatible with:
- React 18 (current)
- Node.js 20 (current)
- TypeScript 5 (current)

---

## File Upload Security Checklist

1. **Validate MIME type from content** (use `file-type`, not extension)
2. **Limit file size** (10MB max recommended for receipts/invoices)
3. **Generate unique filenames** (use `crypto.randomUUID()`)
4. **Sanitize original filename** (strip path separators, special chars)
5. **Store outside web root** (serve via API route with auth check)
6. **Scan for malware** (optional: integrate ClamAV for enterprise)

---

## Sources

**File Upload:**
- [Next.js 14 App Router Native FormData](https://medium.com/@mrrabbilhasan/file-upload-in-next-js-14-app-router-most-simple-clean-way-5ed4c90fde39)
- [file-type npm](https://www.npmjs.com/package/file-type)
- [sharp npm](https://www.npmjs.com/package/sharp)
- [Next.js sharp recommendation](https://nextjs.org/docs/messages/install-sharp)

**Dashboard Grid:**
- [react-grid-layout GitHub](https://github.com/react-grid-layout/react-grid-layout)
- [react-grid-layout npm](https://www.npmjs.com/package/react-grid-layout)
- [react-resizable npm](https://www.npmjs.com/package/react-resizable)
- [Building Dashboard Widgets with React Grid Layout](https://www.antstack.com/blog/building-customizable-dashboard-widgets-using-react-grid-layout/)
- [Why React-Grid-Layout for Dashboards (ilert case study)](https://www.ilert.com/blog/building-interactive-dashboards-why-react-grid-layout-was-our-best-choice)

**Comparisons:**
- [dnd-kit vs react-grid-layout discussion](https://github.com/clauderic/dnd-kit/discussions/1560)
- [npm trends: dnd-kit vs react-grid-layout](https://npmtrends.com/@dnd-kit/core-vs-react-dnd-vs-react-grid-layout)

---
---

# Stack Research: Supplier Management, Task Hierarchies, AI Semantic Matching

**Project:** SAAP v1.4 - Supplier Price Comparison, Infinite Task Nesting, Activity History
**Researched:** 2026-01-24
**Confidence:** HIGH (verified against official documentation and existing codebase)

---

## Executive Summary (v1.4)

This section covers packages and approaches for implementing:
1. Infinite nesting task/subtask hierarchies
2. AI semantic matching for supplier price comparison
3. Activity history logging for sync events
4. Live data synchronization between entities (Deals <-> Projects)

The recommendations prioritize:
- Compatibility with existing stack (Next.js 14, Prisma, MariaDB)
- Minimal new dependencies (only 1 new npm package required)
- Patterns already established in the codebase

---

## 1. Task Hierarchy (Infinite Nesting)

### Recommended Approach: Adjacency List with Prisma Self-Relations

**Why adjacency list over other patterns:**
- Closure tables add storage overhead and INSERT/UPDATE complexity
- Nested sets are deprecated pattern since recursive CTEs became available
- MariaDB 10.2+ fully supports recursive CTEs for tree traversal
- Adjacency list offers fastest INSERT/UPDATE operations

**Prisma Schema Pattern:**
```prisma
model Task {
  id          String     @id @default(cuid())
  title       String     @db.VarChar(255)
  description String?    @db.Text
  status      TaskStatus @default(NOT_STARTED)
  position    Int        @default(0)  // Ordering within siblings

  // Self-referential hierarchy
  parentId    String?    @map("parent_id")
  parent      Task?      @relation("TaskHierarchy", fields: [parentId], references: [id], onDelete: NoAction, onUpdate: NoAction)
  children    Task[]     @relation("TaskHierarchy")

  // Computed depth (denormalized for performance)
  depth       Int        @default(0)

  projectId   String     @map("project_id")
  project     Project    @relation(fields: [projectId], references: [id], onDelete: Cascade)

  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  @@index([parentId])
  @@index([projectId])
  @@map("tasks")
}

enum TaskStatus {
  NOT_STARTED
  IN_PROGRESS
  COMPLETED
  BLOCKED
}
```

**Critical:** Self-relations in Prisma require `onDelete: NoAction, onUpdate: NoAction` on one side to prevent circular reference issues.

### Querying Deep Hierarchies

Prisma does NOT support recursive includes natively. For deep tree fetching, use one of:

**Option A: Raw SQL with Recursive CTE (Recommended for full trees)**
```typescript
// Fetch all descendants of a task
async function getTaskTree(taskId: string) {
  return await prisma.$queryRaw`
    WITH RECURSIVE task_tree AS (
      SELECT id, title, parent_id, depth, position, status, 0 as level
      FROM tasks
      WHERE id = ${taskId}

      UNION ALL

      SELECT t.id, t.title, t.parent_id, t.depth, t.position, t.status, tt.level + 1
      FROM tasks t
      INNER JOIN task_tree tt ON t.parent_id = tt.id
      WHERE tt.level < 10  -- Safety limit to prevent infinite loops
    )
    SELECT * FROM task_tree ORDER BY level, position
  `;
}
```

**Option B: Application-Level Recursion (Small trees only)**
```typescript
async function getTaskWithChildren(taskId: string, maxDepth = 5): Promise<TaskWithChildren | null> {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { children: { orderBy: { position: 'asc' } } }
  });

  if (maxDepth > 0 && task?.children) {
    for (const child of task.children) {
      const childWithDescendants = await getTaskWithChildren(child.id, maxDepth - 1);
      if (childWithDescendants) {
        Object.assign(child, { children: childWithDescendants.children });
      }
    }
  }
  return task;
}
```

### UI Component: Tree View

**Recommended:** [shadcn-tree-view](https://github.com/MrLightful/shadcn-tree-view)

**Installation:**
```bash
npx shadcn add "https://mrlightful.com/registry/tree-view"
```

**Why this component:**
- Built for shadcn/ui (matches existing stack)
- Supports drag-and-drop reordering
- Expand/collapse with custom icons
- Action buttons per node
- TypeScript native

**Example Usage:**
```tsx
import { TreeView, TreeItem } from '@/components/ui/tree-view';

function TaskTree({ tasks }: { tasks: Task[] }) {
  return (
    <TreeView>
      {tasks.map(task => (
        <TreeItem
          key={task.id}
          id={task.id}
          label={task.title}
          icon={<CheckCircle />}
          actions={[
            { icon: <Plus />, onClick: () => addSubtask(task.id) },
            { icon: <Trash />, onClick: () => deleteTask(task.id) },
          ]}
        >
          {task.children?.map(child => (
            <TreeItem key={child.id} id={child.id} label={child.title} />
          ))}
        </TreeItem>
      ))}
    </TreeView>
  );
}
```

### No New NPM Packages Required for Hierarchy

The existing stack handles this:
- Prisma: Self-relations (already supported)
- MariaDB: Recursive CTEs (10.2+)
- UI: shadcn-tree-view (copy-paste component, not npm)

---

## 2. AI Semantic Matching (Price Comparison)

### Recommended Approach: OpenAI Embeddings API

**Why OpenAI over alternatives:**
- **Anthropic (Claude) does NOT offer embeddings** - they recommend Voyage AI as partner
- **transformers.js has onnxruntime-node size issues** (~720MB) breaking Next.js API routes (max 250MB)
- **OpenAI text-embedding-3-small is cost-effective** ($0.02/1M tokens)
- Simple API, well-documented, production-proven

**Critical Finding:** The existing SAAP AI integration uses Claude Code manifest files for document analysis - this is a file-based pattern for Claude to read. Embeddings are a different API-based approach for semantic similarity.

### Required Package

| Package | Version | Purpose |
|---------|---------|---------|
| `openai` | ^4.x | OpenAI Node.js SDK for embeddings |

**Installation:**
```bash
npm install openai
```

### Implementation Pattern

```typescript
// lib/embeddings.ts
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate embedding vector for a text string
 * Returns 1536-dimensional float array
 */
export async function getEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text.slice(0, 8000), // Max 8191 tokens
    encoding_format: 'float',
  });
  return response.data[0].embedding;
}

/**
 * Calculate cosine similarity between two embedding vectors
 * OpenAI embeddings are pre-normalized, so dot product = cosine similarity
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  return a.reduce((sum, val, i) => sum + val * b[i], 0);
}

/**
 * Find similar items from a collection
 */
export async function findSimilarItems<T extends { embedding: number[] | null }>(
  query: string,
  items: T[],
  threshold = 0.7,
  limit = 10
): Promise<Array<T & { similarity: number }>> {
  const queryEmbedding = await getEmbedding(query);

  const withSimilarity = items
    .filter(item => item.embedding !== null)
    .map(item => ({
      ...item,
      similarity: cosineSimilarity(queryEmbedding, item.embedding!),
    }))
    .filter(item => item.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);

  return withSimilarity;
}
```

### Storing Embeddings in MariaDB

**Schema addition for Supplier Quote Items:**
```prisma
model Supplier {
  id          String   @id @default(cuid())
  name        String   @db.VarChar(255)
  contactName String?  @db.VarChar(255)
  email       String?  @db.VarChar(255)
  phone       String?  @db.VarChar(50)
  address     String?  @db.Text
  notes       String?  @db.Text

  quoteItems  SupplierQuoteItem[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([name])
  @@map("suppliers")
}

model SupplierQuoteItem {
  id           String   @id @default(cuid())
  description  String   @db.VarChar(500)
  unitPrice    Decimal  @db.Decimal(12, 2)
  unit         String?  @db.VarChar(50)  // "per unit", "per day", "per kg"
  quoteDate    DateTime @default(now())

  // Embedding stored as JSON (1536 floats for text-embedding-3-small)
  embedding    Json?    @db.Json

  supplierId   String   @map("supplier_id")
  supplier     Supplier @relation(fields: [supplierId], references: [id], onDelete: Cascade)

  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([supplierId])
  @@index([quoteDate])
  @@map("supplier_quote_items")
}
```

**Why JSON instead of vector column:**
- MariaDB lacks native vector type (unlike PostgreSQL with pgvector)
- JSON is sufficient for small-scale comparison (< 10K items)
- Comparison done in-memory after fetching candidates
- For large scale (100K+ items), would need PostgreSQL with pgvector or dedicated vector DB

### Semantic Matching Flow for Price Comparison

1. **On Quote Item Create/Update:**
   - Generate embedding for description via OpenAI API
   - Store embedding JSON in `embedding` column

2. **When Comparing Prices:**
   - User enters item description or selects existing item
   - Fetch all quote items with embeddings
   - Compute cosine similarity in-memory
   - Return top-N similar items sorted by similarity
   - Display price comparison table

**API Route Example:**
```typescript
// app/api/suppliers/compare/route.ts
import { getEmbedding, cosineSimilarity } from '@/lib/embeddings';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  const { description, limit = 10 } = await request.json();

  // Get embedding for query
  const queryEmbedding = await getEmbedding(description);

  // Fetch all items with embeddings
  const items = await prisma.supplierQuoteItem.findMany({
    where: { embedding: { not: null } },
    include: { supplier: { select: { id: true, name: true } } },
  });

  // Calculate similarities
  const results = items
    .map(item => ({
      ...item,
      unitPrice: Number(item.unitPrice),
      similarity: cosineSimilarity(queryEmbedding, item.embedding as number[]),
    }))
    .filter(item => item.similarity >= 0.6) // Threshold
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);

  return Response.json({ results });
}
```

### Cost Estimate

- 500 quote items x 50 words avg = 25,000 words
- ~33,000 tokens
- Cost: ~$0.0007 (less than 1 cent per project)
- Even 10,000 items would cost ~$0.014

### Alternative (NOT Recommended): Local Embeddings

**Why NOT transformers.js:**
- onnxruntime-node exceeds Next.js API route size limits (250MB max, it's 720MB)
- Requires `serverExternalPackages` config hacks
- Less accurate than OpenAI models (MiniLM-L6 vs text-embedding-3-small)
- More complexity for marginal cost savings (~$0.01/project)

---

## 3. Activity History Logging

### Recommended Approach: Prisma Client Extension

**Why extension over middleware:**
- Prisma recommends extensions over deprecated middleware pattern
- Type-safe query hooks
- Can pass application context (user, action source)
- Works well with MariaDB (no PostgreSQL-specific triggers needed)

### Schema Addition

```prisma
model ActivityLog {
  id          String   @id @default(cuid())
  entityType  String   @db.VarChar(50)  // "Deal", "Project", "Task", "Supplier"
  entityId    String   @db.VarChar(50)
  action      String   @db.VarChar(50)  // "created", "updated", "deleted", "synced"
  changes     Json?    @db.Json         // { field: { old: value, new: value } }
  metadata    Json?    @db.Json         // { source: "deal_sync", dealId: "..." }

  userId      String?  @map("user_id")
  user        User?    @relation(fields: [userId], references: [id])

  createdAt   DateTime @default(now())

  @@index([entityType, entityId])
  @@index([createdAt])
  @@index([userId])
  @@map("activity_logs")
}
```

### Implementation Pattern

```typescript
// lib/prisma-with-activity.ts
import { Prisma, PrismaClient } from '@prisma/client';

const AUDITED_MODELS = ['Deal', 'Project', 'Task', 'Supplier', 'SupplierQuoteItem'];

interface ActivityContext {
  userId?: string | null;
  source?: string;
  metadata?: Record<string, unknown>;
}

export function createPrismaWithActivity(
  basePrisma: PrismaClient,
  getContext: () => ActivityContext
) {
  return basePrisma.$extends({
    query: {
      $allModels: {
        async create({ model, args, query }) {
          const result = await query(args);

          if (AUDITED_MODELS.includes(model)) {
            const ctx = getContext();
            await basePrisma.activityLog.create({
              data: {
                entityType: model,
                entityId: (result as { id: string }).id,
                action: 'created',
                changes: args.data as Prisma.JsonObject,
                metadata: ctx.metadata as Prisma.JsonObject,
                userId: ctx.userId,
              },
            });
          }
          return result;
        },

        async update({ model, args, query }) {
          if (!AUDITED_MODELS.includes(model)) return query(args);

          // Fetch before state for diff
          const modelLower = model.charAt(0).toLowerCase() + model.slice(1);
          const before = await (basePrisma as any)[modelLower].findUnique({
            where: args.where,
          });

          const result = await query(args);

          // Compute changes
          const changes = computeDiff(before, args.data as Record<string, unknown>);

          if (Object.keys(changes).length > 0) {
            const ctx = getContext();
            await basePrisma.activityLog.create({
              data: {
                entityType: model,
                entityId: (result as { id: string }).id,
                action: 'updated',
                changes: changes as Prisma.JsonObject,
                metadata: ctx.metadata as Prisma.JsonObject,
                userId: ctx.userId,
              },
            });
          }
          return result;
        },

        async delete({ model, args, query }) {
          if (!AUDITED_MODELS.includes(model)) return query(args);

          const modelLower = model.charAt(0).toLowerCase() + model.slice(1);
          const before = await (basePrisma as any)[modelLower].findUnique({
            where: args.where,
          });

          const result = await query(args);

          const ctx = getContext();
          await basePrisma.activityLog.create({
            data: {
              entityType: model,
              entityId: before?.id || 'unknown',
              action: 'deleted',
              changes: before as Prisma.JsonObject,
              metadata: ctx.metadata as Prisma.JsonObject,
              userId: ctx.userId,
            },
          });

          return result;
        },
      },
    },
  });
}

function computeDiff(
  before: Record<string, unknown> | null,
  updates: Record<string, unknown>
): Record<string, { old: unknown; new: unknown }> {
  if (!before) return {};

  const diff: Record<string, { old: unknown; new: unknown }> = {};

  for (const [key, newValue] of Object.entries(updates)) {
    const oldValue = before[key];
    // Skip if values are equal (handle Decimal, Date, etc.)
    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      diff[key] = { old: oldValue, new: newValue };
    }
  }
  return diff;
}
```

### Usage in API Routes

```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client';
import { createPrismaWithActivity } from './prisma-with-activity';
import { auth } from '@/auth';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const basePrisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = basePrisma;

// For use in API routes with activity logging
export async function getPrismaWithActivity() {
  const session = await auth();
  return createPrismaWithActivity(basePrisma, () => ({
    userId: session?.user?.id,
    source: 'api',
  }));
}

export default basePrisma;
```

### Custom Sync Event Logging

For Deal-to-Project sync events:
```typescript
async function logSyncEvent(
  projectId: string,
  dealId: string,
  changes: Record<string, { old: unknown; new: unknown }>,
  userId?: string
) {
  await prisma.activityLog.create({
    data: {
      entityType: 'Project',
      entityId: projectId,
      action: 'synced',
      changes,
      metadata: {
        source: 'deal_sync',
        dealId,
        syncedAt: new Date().toISOString(),
      },
      userId,
    },
  });
}
```

### No New NPM Packages Required

Prisma Client Extensions are built-in since Prisma 4.16. Current version is 6.19.2.

---

## 4. Data Sync (Deals <-> Projects)

### Recommended Approach: React useOptimistic + Server Actions

**Why this over WebSockets:**
- SAAP is a 3-person team app, not real-time collaborative editing
- No need for bidirectional push notifications
- Server Actions provide immediate feedback
- `useOptimistic` gives instant UI response
- WebSockets would add complexity (socket.io, connection management) for minimal benefit

### Pattern for Deal-to-Project Sync

**Server Action:**
```typescript
// app/actions/sync-actions.ts
'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';

export async function syncDealToProject(dealId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    include: { project: true, company: true },
  });

  if (!deal) throw new Error('Deal not found');
  if (!deal.projectId) throw new Error('Deal has no linked project');

  const before = {
    potentialRevenue: deal.project?.potentialRevenue,
    title: deal.project?.title,
  };

  // Sync relevant fields from Deal to Project
  const updated = await prisma.project.update({
    where: { id: deal.projectId },
    data: {
      potentialRevenue: deal.value,
      // Add other fields to sync as needed
    },
  });

  // Log the sync event
  await prisma.activityLog.create({
    data: {
      entityType: 'Project',
      entityId: deal.projectId,
      action: 'synced',
      changes: {
        potentialRevenue: {
          old: before.potentialRevenue ? Number(before.potentialRevenue) : null,
          new: deal.value ? Number(deal.value) : null,
        },
      },
      metadata: {
        source: 'deal_sync',
        dealId: deal.id,
        dealTitle: deal.title,
      },
      userId: session.user.id,
    },
  });

  revalidatePath('/projects');
  revalidatePath('/projects/' + deal.projectId);
  revalidatePath('/deals');

  return { success: true, projectId: deal.projectId };
}
```

### Client-Side Optimistic Update

```typescript
'use client';

import { useOptimistic, useTransition } from 'react';
import { syncDealToProject } from '@/app/actions/sync-actions';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface SyncButtonProps {
  deal: { id: string; value: number | null; title: string };
  project: { id: string; potentialRevenue: number | null };
}

export function SyncButton({ deal, project }: SyncButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [optimisticProject, addOptimisticUpdate] = useOptimistic(
    project,
    (state, newValue: number | null) => ({
      ...state,
      potentialRevenue: newValue,
    })
  );

  const handleSync = () => {
    startTransition(async () => {
      addOptimisticUpdate(deal.value);
      try {
        await syncDealToProject(deal.id);
        toast.success('Synced to project');
      } catch (error) {
        toast.error('Sync failed');
        // Optimistic update will revert automatically on revalidation
      }
    });
  };

  const needsSync = deal.value !== optimisticProject.potentialRevenue;

  return (
    <Button
      onClick={handleSync}
      disabled={isPending || !needsSync}
      variant={needsSync ? 'default' : 'ghost'}
      size="sm"
    >
      <RefreshCw className={isPending ? 'animate-spin mr-2' : 'mr-2'} size={16} />
      {isPending ? 'Syncing...' : needsSync ? 'Sync to Project' : 'In Sync'}
    </Button>
  );
}
```

### No New NPM Packages Required

- `useOptimistic` is built into React 19 (via Next.js 14)
- `useTransition` is built into React 18+
- Server Actions are built into Next.js 14
- `sonner` already installed for toast notifications

---

## 5. New UI Components Needed (v1.4)

### Summary Table

| Component | Source | Purpose |
|-----------|--------|---------|
| Tree View | [shadcn-tree-view](https://github.com/MrLightful/shadcn-tree-view) | Task hierarchy display with expand/collapse |
| Comparison Table | Build with existing Table component | Price comparison with similarity scores |
| Activity Timeline | Build with existing Card + ScrollArea | Show activity history for entity |

### Tree View Installation

```bash
npx shadcn add "https://mrlightful.com/registry/tree-view"
```

This is a copy-paste component, not an npm dependency.

### Activity Timeline Component (Build from existing shadcn)

```tsx
// components/activity-timeline.tsx
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';

interface ActivityItem {
  id: string;
  action: string;
  entityType: string;
  changes: Record<string, { old: unknown; new: unknown }> | null;
  metadata: Record<string, unknown> | null;
  user: { name: string | null } | null;
  createdAt: Date;
}

export function ActivityTimeline({ activities }: { activities: ActivityItem[] }) {
  return (
    <ScrollArea className="h-[400px]">
      <div className="space-y-4 pr-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback>
                {activity.user?.name?.charAt(0) || 'S'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
              <p className="text-sm">
                <span className="font-medium">{activity.user?.name || 'System'}</span>
                {' '}{getActionLabel(activity.action)}{' '}
                <span className="text-muted-foreground">{activity.entityType}</span>
              </p>
              {activity.changes && (
                <ChangesList changes={activity.changes} />
              )}
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(activity.createdAt, { addSuffix: true })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
```

---

## Complete Package Changes (v1.4)

### New Dependencies

| Package | Version | Purpose | Monthly Cost |
|---------|---------|---------|--------------|
| `openai` | ^4.x | Embeddings API for semantic matching | ~$1-5 (API usage) |

**Installation:**
```bash
npm install openai
```

### Environment Variables

```env
# Add to .env
OPENAI_API_KEY=sk-...
```

### No Changes Needed

| Package | Reason |
|---------|--------|
| `@dnd-kit/*` | Already installed, use for task reordering within tree |
| `prisma` | Extensions built-in (v4.16+), current v6.19.2 |
| `next` | Server Actions and useOptimistic available in 14.x |
| `react` | useOptimistic available in React 19 (via Next.js 14) |

---

## Alternatives Considered (NOT Recommended) - v1.4

### For Embeddings

| Alternative | Why Not |
|-------------|---------|
| transformers.js | 720MB onnxruntime-node breaks Next.js API routes (250MB limit) |
| Voyage AI | Adds another vendor; OpenAI simpler for small scale |
| Cohere | More expensive, less ecosystem support |
| Local LLM | Overkill for embeddings, complex deployment |
| No embeddings (keyword match) | Poor matching quality for similar items with different wording |

### For Tree Hierarchy

| Alternative | Why Not |
|-------------|---------|
| Closure Table | Storage overhead, complex INSERT/DELETE for every level change |
| Nested Sets | Deprecated pattern, extremely slow updates |
| Materialized Path | Complex string manipulation, harder to query |
| ltree (PostgreSQL) | Wrong database; would require migration from MariaDB |

### For Activity Logging

| Alternative | Why Not |
|-------------|---------|
| @bemi-db/prisma | PostgreSQL-only; SAAP uses MariaDB |
| Database triggers | MariaDB trigger syntax differs; harder to maintain |
| Prisma middleware | Deprecated in favor of extensions |
| Third-party audit service | Over-engineered for 3-person team app |

### For Data Sync

| Alternative | Why Not |
|-------------|---------|
| WebSockets (socket.io) | Adds complexity for 3-person team; no real-time collaboration needed |
| Polling | Wastes resources; Server Actions are more efficient |
| Event sourcing | Over-engineered for simple field sync |

---

## Sources (v1.4)

**Official Documentation:**
- [Prisma Self-Relations](https://www.prisma.io/docs/orm/prisma-schema/data-model/relations/self-relations)
- [Prisma Client Extensions](https://www.prisma.io/docs/orm/prisma-client/client-extensions)
- [OpenAI Embeddings API](https://platform.openai.com/docs/guides/embeddings)
- [OpenAI text-embedding-3-small](https://platform.openai.com/docs/models/text-embedding-3-small)
- [MariaDB Recursive CTEs](https://mariadb.com/docs/server/reference/sql-statements/data-manipulation/selecting-data/common-table-expressions/recursive-common-table-expressions-overview)
- [React useOptimistic](https://react.dev/reference/react/useOptimistic)
- [Next.js Server Actions](https://nextjs.org/docs/14/app/building-your-application/data-fetching/server-actions-and-mutations)

**Community Resources:**
- [shadcn-tree-view](https://github.com/MrLightful/shadcn-tree-view) - Tree view component for shadcn/ui
- [Prisma Audit Trail Discussion](https://github.com/prisma/prisma/issues/1902) - Feature request history
- [Closure Table Pattern](https://balevdev.medium.com/the-closure-table-pattern-for-hierarchical-filters-with-sql-31644e760c09) - Why we chose adjacency list instead
- [Implementing Entity Audit Log with Prisma](https://medium.com/@gayanper/implementing-entity-audit-log-with-prisma-9cd3c15f6b8e)

**Verified Limitations:**
- [Anthropic does not offer embeddings](https://docs.anthropic.com/en/docs/build-with-claude/embeddings) - recommends Voyage AI
- [transformers.js Next.js 15 issue](https://github.com/huggingface/transformers.js/issues/1164) - onnxruntime-node too large
- [Prisma tree structures support request](https://github.com/prisma/prisma/issues/4562) - recursive includes not yet implemented
