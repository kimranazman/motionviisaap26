# Phase 21: Infrastructure & Schema - Research

**Researched:** 2026-01-23
**Domain:** Next.js file upload infrastructure, Docker volume mounts, Prisma schema design
**Confidence:** HIGH

## Summary

This phase establishes the infrastructure foundation for document management and dashboard customization features. The research focused on four key areas: (1) Next.js body size limit configuration for 10MB uploads, (2) Docker volume mounting for persistent file storage, (3) authenticated file serving API routes, and (4) Prisma schema design for Document, UserPreferences, and AdminDefaults models.

The project already uses Next.js 14.2.28 with App Router, Prisma 6.19.2 with MySQL, and Docker with standalone output mode. The existing authentication pattern (`requireAuth()` / `requireRole()`) provides a solid foundation for protected file serving routes. The NAS deployment uses bind mounts at `/volume1/Motionvii/saap2026v2/` which is the pattern to follow for the uploads directory.

**Primary recommendation:** Configure `serverActions.bodySizeLimit: '10MB'` globally in next.config.mjs, create `/uploads/` directory with Docker bind mount to NAS, implement streaming file serve API route with authentication, and add Document/UserPreferences/AdminDefaults models with JSON fields for flexible preferences storage.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 14.2.28 | File handling, API routes | Already in use, native FormData support |
| Prisma | 6.19.2 | Database models | Already in use, JSON field support for MySQL |
| Node.js | 20-alpine | File system operations | Already in Dockerfile |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| fs/promises | built-in | Async file operations | File write/read/stat |
| path | built-in | Path manipulation | Safe path construction |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Local filesystem | Cloudinary/S3 | Out of scope per requirements; NAS storage sufficient |
| JSON field | Separate preference tables | JSON more flexible for evolving dashboard configs |
| formidable | Native FormData | Native is simpler in App Router with Node 18+ |

**Installation:**
No additional packages required - all functionality available with existing dependencies.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   └── api/
│       └── files/
│           └── [projectId]/
│               └── [filename]/
│                   └── route.ts     # File serving with auth
├── lib/
│   └── file-utils.ts               # File streaming helpers
/uploads/                            # Outside src, Docker volume mount
└── projects/
    └── {projectId}/
        └── {filename}              # Actual files
```

### Pattern 1: Server Actions Body Size Limit
**What:** Configure global body size limit for file uploads
**When to use:** Any file upload exceeding default 1MB limit
**Example:**
```typescript
// next.config.mjs
// Source: https://nextjs.org/docs/app/api-reference/config/next-config-js/serverActions
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000'],
      bodySizeLimit: '10MB', // CRITICAL: uppercase MB works, lowercase may not
    },
  },
};

export default nextConfig;
```

### Pattern 2: Authenticated File Serving Route
**What:** Stream files from protected directory with authentication
**When to use:** Serving uploaded files that require access control
**Example:**
```typescript
// src/app/api/files/[projectId]/[filename]/route.ts
// Source: https://www.ericburel.tech/blog/nextjs-stream-files
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-utils';
import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';

const UPLOADS_DIR = process.env.UPLOADS_DIR || '/app/uploads';

// Convert Node.js stream to web ReadableStream
async function* nodeStreamToIterator(stream: fs.ReadStream) {
  for await (const chunk of stream) {
    yield new Uint8Array(chunk as Buffer);
  }
}

function iteratorToStream(iterator: AsyncGenerator<Uint8Array>) {
  return new ReadableStream({
    async pull(controller) {
      const { value, done } = await iterator.next();
      if (done) {
        controller.close();
      } else {
        controller.enqueue(value);
      }
    },
  });
}

function streamFile(path: string): ReadableStream {
  const nodeStream = fs.createReadStream(path);
  return iteratorToStream(nodeStreamToIterator(nodeStream));
}

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string; filename: string } }
) {
  const { error } = await requireAuth();
  if (error) return error;

  const { projectId, filename } = params;

  // SECURITY: Validate path components to prevent directory traversal
  if (projectId.includes('..') || filename.includes('..')) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }

  const filePath = path.join(UPLOADS_DIR, 'projects', projectId, filename);

  try {
    const stats = await fsPromises.stat(filePath);
    const stream = streamFile(filePath);

    // Determine content type from extension
    const ext = path.extname(filename).toLowerCase();
    const contentTypes: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
    };

    return new Response(stream, {
      status: 200,
      headers: {
        'Content-Disposition': `inline; filename="${filename}"`,
        'Content-Type': contentTypes[ext] || 'application/octet-stream',
        'Content-Length': stats.size.toString(),
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
    throw err;
  }
}
```

### Pattern 3: Docker Volume Mount for Uploads
**What:** Bind mount for persistent file storage on NAS
**When to use:** Production deployment with file persistence
**Example:**
```yaml
# docker-compose.nas.yml
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    volumes:
      # Uploads directory - persists across container restarts
      - /volume1/Motionvii/saap2026v2/uploads:/app/uploads
    environment:
      - UPLOADS_DIR=/app/uploads
```

### Pattern 4: Prisma JSON Fields for Preferences
**What:** Flexible schema-less storage for user/admin preferences
**When to use:** Dashboard layouts, widget configurations, user settings
**Example:**
```prisma
// Source: https://www.prisma.io/docs/orm/prisma-client/special-fields-and-types/working-with-json-fields
model UserPreferences {
  id            String   @id @default(cuid())
  userId        String   @unique @map("user_id")
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Dashboard layout stored as JSON
  // Example: { "widgets": [{"id": "revenue", "x": 0, "y": 0, "w": 2, "h": 1}] }
  dashboardLayout Json?   @db.Json

  // Date filter preferences
  // Example: { "startDate": "2026-01-01", "endDate": "2026-12-31" }
  dateFilter      Json?   @db.Json

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@map("user_preferences")
}
```

### Anti-Patterns to Avoid
- **Storing files in public/**: Files in `public/` are served without auth and bundled at build time
- **Using req.body for file uploads in App Router**: Use `request.formData()` instead
- **Hardcoding upload paths**: Use environment variables for flexibility between dev/prod
- **Trusting filename from client**: Always sanitize and potentially rename files
- **Loading entire file into memory**: Use streaming for files over a few MB

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| File type validation | Manual extension check | Check MIME type + extension | Extension alone is spoofable |
| Path traversal prevention | Regex-based filter | `path.join()` + validation | Edge cases are hard to catch |
| Stream conversion | Manual buffer management | Generator pattern shown above | Memory efficient, tested pattern |
| JSON field typing | Plain `any` types | TypeScript interfaces | Type safety for dashboard configs |

**Key insight:** File handling has many security edge cases. Use established patterns and validate both client-side (UX) and server-side (security).

## Common Pitfalls

### Pitfall 1: Body Size Limit Not Applied
**What goes wrong:** Files over 1MB fail with "Body exceeded 1mb limit" error
**Why it happens:** Default limit is 1MB; configuration syntax is case-sensitive
**How to avoid:** Use uppercase `'10MB'` in `bodySizeLimit` (lowercase `'10mb'` reported as inconsistent)
**Warning signs:** Uploads work locally but fail in production; small files work, large files fail

### Pitfall 2: Docker Volume Permissions
**What goes wrong:** File writes fail with EACCES errors in container
**Why it happens:** Container runs as non-root user (nextjs:1001) but volume has different ownership
**How to avoid:**
1. Create uploads directory in Dockerfile: `RUN mkdir -p /app/uploads && chown -R nextjs:nodejs /app/uploads`
2. Ensure NAS directory has appropriate permissions
**Warning signs:** Works locally but fails on NAS; works as root but not as nextjs user

### Pitfall 3: File Path in Database vs Filesystem
**What goes wrong:** Document records point to wrong paths after container restart
**Why it happens:** Using absolute container paths in database instead of relative paths
**How to avoid:** Store only relative path in database (e.g., `projects/{id}/{filename}`), construct full path at runtime using UPLOADS_DIR env var
**Warning signs:** Files work initially but 404 after deployment; path includes `/app/uploads/`

### Pitfall 4: JSON Field Default Values in Prisma
**What goes wrong:** Syntax error or invalid JSON in schema
**Why it happens:** JSON defaults need escaped quotes and specific formatting
**How to avoid:** Use `@default("[]")` for empty array, `@default("{}")` for empty object
**Warning signs:** `prisma generate` fails; migration errors

### Pitfall 5: Missing File Cleanup on Document Delete
**What goes wrong:** Orphaned files accumulate in uploads directory
**Why it happens:** Deleting database record doesn't automatically delete file
**How to avoid:** Implement cascade delete: delete file first, then database record
**Warning signs:** Disk usage grows; files exist with no database reference

## Code Examples

Verified patterns from official sources:

### File Upload API Route (Upload Handler)
```typescript
// src/app/api/projects/[id]/documents/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireEditor } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

const UPLOADS_DIR = process.env.UPLOADS_DIR || '/app/uploads';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['application/pdf', 'image/png', 'image/jpeg'];

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { session, error } = await requireEditor();
  if (error) return error;

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  const category = formData.get('category') as string || 'OTHER';

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  // Validate file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: 'Invalid file type. Allowed: PDF, PNG, JPG' },
      { status: 400 }
    );
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: 'File too large. Maximum size: 10MB' },
      { status: 400 }
    );
  }

  // Verify project exists
  const project = await prisma.project.findUnique({
    where: { id: params.id },
  });
  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  // Create unique filename to prevent collisions
  const ext = path.extname(file.name);
  const uniqueName = `${randomUUID()}${ext}`;
  const relativePath = `projects/${params.id}/${uniqueName}`;
  const fullPath = path.join(UPLOADS_DIR, relativePath);

  // Ensure directory exists
  await mkdir(path.dirname(fullPath), { recursive: true });

  // Write file
  const bytes = await file.arrayBuffer();
  await writeFile(fullPath, Buffer.from(bytes));

  // Create database record
  const document = await prisma.document.create({
    data: {
      projectId: params.id,
      filename: file.name, // Original filename for display
      storagePath: relativePath, // Relative path for retrieval
      mimeType: file.type,
      size: file.size,
      category: category,
      uploadedById: session.user.id,
    },
  });

  return NextResponse.json(document, { status: 201 });
}
```

### Prisma Schema Models
```prisma
// prisma/schema.prisma additions

enum DocumentCategory {
  RECEIPT
  INVOICE
  OTHER
}

model Document {
  id            String           @id @default(cuid())
  projectId     String           @map("project_id")
  project       Project          @relation(fields: [projectId], references: [id], onDelete: Cascade)

  filename      String           @db.VarChar(255)  // Original filename
  storagePath   String           @db.VarChar(500)  // Relative path: projects/{id}/{uuid}.ext
  mimeType      String           @db.VarChar(100)
  size          Int              // File size in bytes
  category      DocumentCategory @default(OTHER)

  uploadedById  String           @map("uploaded_by_id")
  uploadedBy    User             @relation(fields: [uploadedById], references: [id])

  createdAt     DateTime         @default(now())
  updatedAt     DateTime         @updatedAt

  @@index([projectId])
  @@index([category])
  @@map("documents")
}

model UserPreferences {
  id              String   @id @default(cuid())
  userId          String   @unique @map("user_id")
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Dashboard widget layout (JSON array of widget configs)
  dashboardLayout Json?    @db.Json

  // Date range filter for dashboard
  dateFilter      Json?    @db.Json

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@map("user_preferences")
}

model AdminDefaults {
  id              String   @id @default(cuid())

  // Default dashboard layout for new users
  dashboardLayout Json     @db.Json

  // Widget role restrictions (which roles can see which widgets)
  widgetRoles     Json     @db.Json

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@map("admin_defaults")
}
```

### TypeScript Types for JSON Fields
```typescript
// src/types/dashboard.ts

export interface WidgetConfig {
  id: string;       // Widget type identifier
  x: number;        // Grid position X
  y: number;        // Grid position Y
  w: number;        // Width in grid units
  h: number;        // Height in grid units
}

export interface DashboardLayout {
  widgets: WidgetConfig[];
}

export interface DateFilter {
  startDate: string | null;  // ISO date string
  endDate: string | null;    // ISO date string
  preset?: 'thisMonth' | 'lastMonth' | 'thisYear' | 'custom';
}

export interface WidgetRoleRestrictions {
  [widgetId: string]: string[];  // widgetId -> allowed roles
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| formidable/multer | Native FormData | Node.js 18 (2022) | No extra dependencies needed |
| Pages Router config | App Router serverActions | Next.js 13+ | Different config location |
| Express static serve | Route handlers | Next.js 13+ | Works with App Router |

**Deprecated/outdated:**
- `export const config = { api: { bodyParser: { sizeLimit }}}` - Pages Router only, not App Router
- `formidable` for file parsing - Native FormData simpler in App Router

## Open Questions

Things that couldn't be fully resolved:

1. **Exact NAS volume path for uploads**
   - What we know: Database uses `/volume1/Motionvii/saap2026v2/database/mariadb-data`
   - What's unclear: Best path for uploads (same parent? separate location?)
   - Recommendation: Use `/volume1/Motionvii/saap2026v2/uploads` for consistency

2. **AdminDefaults singleton pattern**
   - What we know: Need single row for admin settings
   - What's unclear: Best way to ensure only one row exists
   - Recommendation: Hardcode ID `'default'` and use upsert pattern

## Sources

### Primary (HIGH confidence)
- [Next.js serverActions config](https://nextjs.org/docs/app/api-reference/config/next-config-js/serverActions) - bodySizeLimit configuration
- [Prisma JSON fields](https://www.prisma.io/docs/orm/prisma-client/special-fields-and-types/working-with-json-fields) - JSON field patterns for MySQL
- [Next.js route.js file conventions](https://nextjs.org/docs/app/api-reference/file-conventions/route) - Route handler patterns

### Secondary (MEDIUM confidence)
- [Eric Burel: Stream files in Next.js](https://www.ericburel.tech/blog/nextjs-stream-files) - Verified streaming pattern
- [Docker volumes documentation](https://docs.docker.com/engine/storage/volumes/) - Volume mount best practices
- [OneUptime: NAS storage with Docker Compose](https://oneuptime.com/blog/post/2025-12-15-how-to-use-nas-storage-with-docker-compose/view) - NAS-specific guidance

### Tertiary (LOW confidence)
- GitHub discussions on body size limits - Community-reported issues with lowercase vs uppercase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Using existing project dependencies
- Architecture: HIGH - Builds on established codebase patterns
- Pitfalls: MEDIUM - Based on community reports and documentation
- File streaming: HIGH - Verified pattern from official sources

**Research date:** 2026-01-23
**Valid until:** 60 days (stable infrastructure patterns)
