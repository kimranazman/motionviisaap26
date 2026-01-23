# Pitfalls Research: Document Management & Dashboard Customization (v1.3)

**Project:** SAAP 2026 v2
**Context:** Adding document uploads (receipts/invoices) and customizable per-user dashboards to existing Next.js 14 App Router application deployed on NAS via Docker
**Researched:** 2026-01-23
**Overall Confidence:** HIGH (verified with official Next.js docs, Docker documentation, and industry patterns)

---

## Document Upload Pitfalls

Common mistakes when implementing file uploads in Next.js with Docker/NAS deployment.

### Pitfall 1: Server Action 1MB Body Limit

**What goes wrong:** File uploads via Server Actions fail with "Body exceeded 1MB limit" error, even for small receipt images (2-3MB).

**Why it happens:** By default, Next.js Server Actions limit request body to 1MB to prevent DDoS attacks and server resource exhaustion. This limit applies to all Server Action requests, not just file uploads.

**Consequences:**
- Users cannot upload typical receipt photos (phone cameras produce 2-5MB images)
- Silent failures with cryptic 413 errors
- Workarounds lead to fragmented upload approaches

**Warning signs:**
- Error: "[Error: Body exceeded 1 MB limit.]" with statusCode 413
- Uploads work locally but fail in production
- Small files upload fine, larger ones fail

**Prevention:**
```typescript
// next.config.mjs - MUST be configured before deployment
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // Increase to reasonable limit for receipts
    },
  },
  output: 'standalone',
}

export default nextConfig
```

**Known Issue:** In some Next.js versions (up to 15.2.2), this configuration may not work properly in production. Fallback: use API Routes instead of Server Actions for file uploads.

**Phase to address:** Phase 1 (Schema & Infrastructure) - Configure before any upload code is written

**Sources:**
- [Next.js serverActions Config](https://nextjs.org/docs/app/api-reference/config/next-config-js/serverActions)
- [GitHub Discussion #53989](https://github.com/vercel/next.js/discussions/53989)
- [GitHub Discussion #49891](https://github.com/vercel/next.js/discussions/49891)

---

### Pitfall 2: Docker Container File Persistence Loss

**What goes wrong:** Uploaded files disappear after container restart or redeployment. Files saved inside the container's filesystem are ephemeral.

**Why it happens:** Docker containers are stateless by design. When a container is removed and recreated (during updates or restarts), everything inside it is lost. This is a feature for application code but a disaster for user uploads.

**Consequences:**
- All uploaded receipts and invoices lost on next deployment
- "File not found" errors after container restart
- Database references point to non-existent files
- Users must re-upload all documents

**Warning signs:**
- Files exist after upload, gone after `docker-compose down && up`
- "File exists: true" locally but "false" in production after deploy
- Growing database with missing file references

**Prevention:**
```yaml
# docker-compose.nas.yml - Add volume mount for uploads
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    volumes:
      # Mount NAS directory for persistent file storage
      - /volume1/Motionvii/saap2026v2/uploads:/app/uploads
    # ... rest of config

# Directory structure on NAS:
# /volume1/Motionvii/saap2026v2/
#   uploads/
#     receipts/
#       2026/
#         01/
#           {projectId}/{filename}
#     invoices/
#       2026/
#         01/
#           {projectId}/{filename}
```

```typescript
// File paths must be relative to mounted volume
const UPLOAD_BASE = process.env.NODE_ENV === 'production'
  ? '/app/uploads'  // Docker volume mount point
  : './uploads';    // Local development

async function saveUpload(file: File, type: 'receipt' | 'invoice', projectId: string) {
  const date = new Date();
  const dir = `${type}s/${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${projectId}`;
  const fullDir = path.join(UPLOAD_BASE, dir);

  await fs.mkdir(fullDir, { recursive: true });
  // ... save file
}
```

**Phase to address:** Phase 1 (Infrastructure) - Set up volume mount before any upload implementation

**Sources:**
- [Docker Volumes Documentation](https://docs.docker.com/engine/storage/volumes/)
- [Docker Data Persistence Guide](https://www.bibekgupta.com/blog/2025/04/docker-volumes-data-persistence-guide)

---

### Pitfall 3: File Serving from Uploaded Location in Next.js

**What goes wrong:** Files uploaded to a custom directory (not `/public`) cannot be served to browsers. Next.js only serves static files from the `/public` folder at build time.

**Why it happens:** Next.js static file serving is designed for build-time assets, not runtime uploads. Files added after build are not automatically served.

**Consequences:**
- Uploaded files exist on disk but return 404 when accessed
- Cannot display receipt images or allow invoice downloads
- Workarounds like symlinking are fragile

**Warning signs:**
- File saves successfully, but URL returns 404
- Works in development, fails in production
- `/uploads/file.pdf` returns "Not Found"

**Prevention:**
```typescript
// Option 1: API Route to serve files (recommended for security)
// src/app/api/files/[...path]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import fs from 'fs/promises';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  // Require authentication
  const session = await auth();
  if (!session) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const filePath = params.path.join('/');
  const fullPath = path.join(process.cwd(), 'uploads', filePath);

  // Security: Prevent directory traversal
  const normalizedPath = path.normalize(fullPath);
  if (!normalizedPath.startsWith(path.join(process.cwd(), 'uploads'))) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  try {
    const file = await fs.readFile(normalizedPath);
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
    };

    return new NextResponse(file, {
      headers: {
        'Content-Type': mimeTypes[ext] || 'application/octet-stream',
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch {
    return new NextResponse('Not Found', { status: 404 });
  }
}
```

**Phase to address:** Phase 1 (Infrastructure) - Implement file serving API route before upload UI

**Sources:**
- [Next.js Public Folder](https://nextjs.org/docs/pages/api-reference/file-conventions/public-folder)
- [GitHub Discussion #14769](https://github.com/vercel/next.js/discussions/14769)

---

### Pitfall 4: Missing File Validation (MIME Type Spoofing)

**What goes wrong:** Malicious files uploaded by renaming extensions (e.g., `malware.exe` renamed to `receipt.pdf`). Client-side validation easily bypassed.

**Why it happens:** Only checking file extension or trusting browser-provided MIME type. Both can be trivially manipulated.

**Consequences:**
- Security vulnerabilities
- Stored XSS if serving user-uploaded HTML
- Potential for executable upload attacks
- Corrupted data if non-image processed as image

**Warning signs:**
- No server-side validation
- Trusting `file.type` from FormData
- Only checking extension string

**Prevention:**
```typescript
import { fileTypeFromBuffer } from 'file-type';

const ALLOWED_TYPES = {
  'application/pdf': ['.pdf'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
};

async function validateUpload(file: File): Promise<{ valid: boolean; error?: string }> {
  // 1. Check file size (max 10MB for receipts)
  const MAX_SIZE = 10 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    return { valid: false, error: 'File too large (max 10MB)' };
  }

  // 2. Read file buffer for actual type detection
  const buffer = Buffer.from(await file.arrayBuffer());
  const detected = await fileTypeFromBuffer(buffer);

  if (!detected) {
    return { valid: false, error: 'Could not determine file type' };
  }

  // 3. Verify detected MIME type is allowed
  if (!ALLOWED_TYPES[detected.mime]) {
    return { valid: false, error: `File type ${detected.mime} not allowed` };
  }

  // 4. Verify extension matches detected type
  const ext = path.extname(file.name).toLowerCase();
  if (!ALLOWED_TYPES[detected.mime].includes(ext)) {
    return { valid: false, error: 'File extension does not match content' };
  }

  return { valid: true };
}
```

**Phase to address:** Phase 2 (Receipt Upload) - Implement validation in upload Server Action

**Sources:**
- [File Upload Security Best Practices](https://moldstud.com/articles/p-handling-file-uploads-in-nextjs-best-practices-and-security-considerations)
- [file-type npm package](https://www.npmjs.com/package/file-type)

---

### Pitfall 5: Storing Files in Database as BLOB

**What goes wrong:** Saving file bytes directly to database column causes massive database bloat, slow backups, and degraded query performance.

**Why it happens:** Simplest implementation path - no external storage to configure. Works for tiny files but doesn't scale.

**Consequences:**
- Database size explodes (5MB receipt x 100 projects = 500MB+ database)
- MariaDB backups become slow and unreliable
- NAS storage fills up faster than expected
- All queries slow down as database grows
- Cannot use CDN or browser caching for files

**Warning signs:**
- Database backup taking 10x longer than expected
- `SHOW TABLE STATUS` shows huge data_length
- Simple queries becoming slow
- Disk space alerts on NAS

**Prevention:**
```prisma
// Store path reference only, not file content
model ProjectDocument {
  id            String       @id @default(cuid())
  projectId     String
  project       Project      @relation(fields: [projectId], references: [id], onDelete: Cascade)
  type          DocumentType // RECEIPT, INVOICE
  fileName      String       // Original filename for display
  filePath      String       // Path relative to uploads dir
  fileSize      Int          // Size in bytes for display
  mimeType      String       // application/pdf, image/jpeg, etc.
  uploadedBy    String
  uploadedByUser User        @relation(fields: [uploadedBy], references: [id])
  uploadedAt    DateTime     @default(now())

  // Optional metadata extracted from document
  documentDate  DateTime?    // Date on receipt/invoice
  amount        Decimal?     @db.Decimal(12, 2) // Amount if extracted

  @@index([projectId])
  @@index([type])
  @@map("project_documents")
}

enum DocumentType {
  RECEIPT
  INVOICE
}
```

**Phase to address:** Phase 1 (Schema Design) - Establish file-on-disk pattern from start

**Sources:**
- [Building File Storage with Next.js and S3](https://www.alexefimenko.com/posts/file-storage-nextjs-postgres-s3)
- Previous PITFALLS.md (v1.2) Pitfall 5

---

### Pitfall 6: No Cleanup of Orphaned Files

**What goes wrong:** When a project or document record is deleted, the physical file remains on disk. Over time, orphaned files accumulate and consume storage.

**Why it happens:** Database cascade delete removes records, but application doesn't delete associated files. Easy to forget because deletion "works" from UI perspective.

**Consequences:**
- Disk space consumed by unreferenced files
- Cannot reclaim storage without manual cleanup
- "Where is all this storage going?" confusion
- Potential data retention compliance issues

**Warning signs:**
- Upload folder size exceeds expected based on active documents
- Storage usage grows faster than document count
- Old deleted project folders still exist

**Prevention:**
```typescript
// Delete file when document record is deleted
async function deleteProjectDocument(documentId: string) {
  const doc = await prisma.projectDocument.findUnique({
    where: { id: documentId }
  });

  if (!doc) throw new Error('Document not found');

  // Delete file first (if file delete fails, we still have record)
  const fullPath = path.join(UPLOAD_BASE, doc.filePath);
  try {
    await fs.unlink(fullPath);
  } catch (err) {
    // Log but don't fail - file might already be gone
    console.error(`Failed to delete file: ${fullPath}`, err);
  }

  // Then delete database record
  await prisma.projectDocument.delete({
    where: { id: documentId }
  });
}

// For project deletion, delete all documents first
async function deleteProject(projectId: string) {
  const documents = await prisma.projectDocument.findMany({
    where: { projectId }
  });

  // Delete files
  await Promise.all(documents.map(async (doc) => {
    const fullPath = path.join(UPLOAD_BASE, doc.filePath);
    try {
      await fs.unlink(fullPath);
    } catch { /* ignore */ }
  }));

  // Cascade delete handles DB records
  await prisma.project.delete({
    where: { id: projectId }
  });
}
```

**Phase to address:** Phase 2 (Document Operations) - Implement file cleanup in delete operations

---

## Dashboard Customization Pitfalls

Common mistakes when implementing customizable grid layouts with per-user persistence.

### Pitfall 7: React-Grid-Layout Width Configuration

**What goes wrong:** Widgets snap back to original position when dragged because GridLayout doesn't take full container width.

**Why it happens:** React-Grid-Layout requires explicit width configuration. Without it, the grid calculates positions incorrectly.

**Consequences:**
- Drag operations appear to work then snap back
- Layout looks correct until interaction
- User frustration with "broken" drag-and-drop

**Warning signs:**
- Items snap back after drag release
- Grid appears narrower than container
- Resize operations behave unexpectedly

**Prevention:**
```typescript
import { Responsive, WidthProvider } from 'react-grid-layout';

// WidthProvider HOC handles width calculation
const ResponsiveGridLayout = WidthProvider(Responsive);

function Dashboard() {
  return (
    <ResponsiveGridLayout
      className="layout"
      layouts={layouts}
      breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
      cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
      rowHeight={100}
      onLayoutChange={handleLayoutChange}
      // Important: enable dragging and resizing
      isDraggable={true}
      isResizable={true}
      // Margin between grid items
      margin={[16, 16]}
    >
      {widgets.map((widget) => (
        <div key={widget.i} data-grid={widget}>
          <WidgetComponent widget={widget} />
        </div>
      ))}
    </ResponsiveGridLayout>
  );
}
```

**Phase to address:** Phase 3 (Dashboard Layout) - Use WidthProvider from project start

**Sources:**
- [React-Grid-Layout GitHub](https://github.com/react-grid-layout/react-grid-layout)
- [Building Dashboard Widgets with React Grid Layout](https://medium.com/@antstack/building-customizable-dashboard-widgets-using-react-grid-layout-234f7857c124)

---

### Pitfall 8: Layout Persistence Race Condition

**What goes wrong:** Layout saved to database before drag operation completes, or multiple rapid changes create race conditions losing intermediate states.

**Why it happens:** `onLayoutChange` fires frequently during drag. Saving on every change causes excessive API calls and potential data corruption.

**Consequences:**
- Layout partially saved
- Network errors from rapid API calls
- Database constraint violations
- User sees different layout after refresh

**Warning signs:**
- Console shows many failed save requests
- Layout different after page refresh
- "Save failed" errors during drag operations
- Inconsistent state between sessions

**Prevention:**
```typescript
import { useDebouncedCallback } from 'use-debounce';

function Dashboard() {
  const [layouts, setLayouts] = useState(initialLayouts);
  const [isSaving, setIsSaving] = useState(false);

  // Debounce saves - wait 1 second after last change
  const saveLayout = useDebouncedCallback(
    async (newLayouts: Layouts) => {
      setIsSaving(true);
      try {
        await fetch('/api/dashboard/layout', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ layouts: newLayouts }),
        });
      } catch (error) {
        // Show toast notification
        toast.error('Failed to save layout');
      } finally {
        setIsSaving(false);
      }
    },
    1000 // Wait 1 second after last change
  );

  const handleLayoutChange = (
    currentLayout: Layout[],
    allLayouts: Layouts
  ) => {
    setLayouts(allLayouts);
    saveLayout(allLayouts);
  };

  return (
    <>
      {isSaving && <SavingIndicator />}
      <ResponsiveGridLayout
        layouts={layouts}
        onLayoutChange={handleLayoutChange}
        // ...
      />
    </>
  );
}
```

**Phase to address:** Phase 3 (Layout Persistence) - Implement debounced saving from start

**Sources:**
- [React-Grid-Layout Issue #883](https://github.com/STRML/react-grid-layout/issues/883)
- [React-Grid-Layout Issue #1583](https://github.com/react-grid-layout/react-grid-layout/issues/1583)

---

### Pitfall 9: Missing CSS Imports for React-Grid-Layout

**What goes wrong:** Grid layout renders but items overlap, don't resize properly, or drag handles don't appear.

**Why it happens:** React-Grid-Layout requires two CSS files that are easy to forget to import.

**Consequences:**
- Items render on top of each other
- No visual feedback during drag
- Resize handles invisible or non-functional
- Layout looks broken

**Warning signs:**
- Grid items overlapping
- No cursor change on drag handles
- Resize corners don't appear
- Drag preview missing

**Prevention:**
```typescript
// In your layout component or global styles
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

// Or add to globals.css
// @import 'react-grid-layout/css/styles.css';
// @import 'react-resizable/css/styles.css';
```

**Phase to address:** Phase 3 (Dashboard Setup) - Import CSS immediately when adding dependency

---

### Pitfall 10: Responsive Layout Data Structure Mismatch

**What goes wrong:** Single layout defined but ResponsiveGridLayout expects different layouts per breakpoint. Widgets work at one screen size but break at others.

**Why it happens:** Using `GridLayout` patterns with `ResponsiveGridLayout` or not defining all breakpoints.

**Consequences:**
- Dashboard works on desktop, breaks on mobile
- Widgets disappear at certain screen sizes
- Layout resets when resizing browser
- Inconsistent experience across devices

**Warning signs:**
- Widget positions change dramatically when resizing
- Some widgets disappear at smaller screens
- Console warnings about missing breakpoints
- Layout "jumps" when crossing breakpoint

**Prevention:**
```typescript
// Define layouts for all breakpoints
const defaultLayouts: Layouts = {
  lg: [ // 1200px+
    { i: 'kpi-cards', x: 0, y: 0, w: 12, h: 2 },
    { i: 'pipeline-chart', x: 0, y: 2, w: 8, h: 3 },
    { i: 'recent-activity', x: 8, y: 2, w: 4, h: 3 },
  ],
  md: [ // 996-1199px
    { i: 'kpi-cards', x: 0, y: 0, w: 10, h: 2 },
    { i: 'pipeline-chart', x: 0, y: 2, w: 6, h: 3 },
    { i: 'recent-activity', x: 6, y: 2, w: 4, h: 3 },
  ],
  sm: [ // 768-995px
    { i: 'kpi-cards', x: 0, y: 0, w: 6, h: 2 },
    { i: 'pipeline-chart', x: 0, y: 2, w: 6, h: 3 },
    { i: 'recent-activity', x: 0, y: 5, w: 6, h: 3 },
  ],
  xs: [ // 480-767px
    { i: 'kpi-cards', x: 0, y: 0, w: 4, h: 3 },
    { i: 'pipeline-chart', x: 0, y: 3, w: 4, h: 3 },
    { i: 'recent-activity', x: 0, y: 6, w: 4, h: 3 },
  ],
  xxs: [ // 0-479px
    { i: 'kpi-cards', x: 0, y: 0, w: 2, h: 4 },
    { i: 'pipeline-chart', x: 0, y: 4, w: 2, h: 3 },
    { i: 'recent-activity', x: 0, y: 7, w: 2, h: 3 },
  ],
};
```

**Phase to address:** Phase 3 (Layout Design) - Define all breakpoint layouts when creating default

---

## Settings/Preferences Pitfalls

Common mistakes when implementing per-user settings with admin defaults.

### Pitfall 11: Wide Settings Table Anti-Pattern

**What goes wrong:** Adding each setting as a new column to the User table creates a massive, sparsely populated table that's hard to maintain and query.

**Why it happens:** Simplest mental model - "user has a theme setting, add theme column." Works for 2-3 settings, becomes unmanageable at 10+.

**Consequences:**
- User table with 50+ columns, most null
- Every new setting requires migration
- Schema changes for simple preference additions
- Slow queries due to wide rows
- Cannot easily query "users who customized X"

**Warning signs:**
- Schema migrations for every new setting
- User table has columns like `dashboard_layout`, `theme`, `notification_email`, `sidebar_collapsed`
- Many columns are nullable with no values
- Adding settings feels heavyweight

**Prevention:**
```prisma
// Separate UserSettings table with JSON for layout
model UserSettings {
  id                  String   @id @default(cuid())
  userId              String   @unique
  user                User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Dashboard layout as JSON (complex, changes frequently)
  dashboardLayout     Json?    // Stores react-grid-layout Layouts object

  // Simple preferences (rarely change, worth indexing)
  theme               String   @default("system") // light, dark, system
  sidebarCollapsed    Boolean  @default(false)

  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  @@map("user_settings")
}

// Access pattern: fall back to defaults if no settings exist
async function getUserDashboardLayout(userId: string) {
  const settings = await prisma.userSettings.findUnique({
    where: { userId }
  });

  if (!settings?.dashboardLayout) {
    // Return admin-defined defaults
    return getAdminDefaultLayout();
  }

  return settings.dashboardLayout as Layouts;
}
```

**Phase to address:** Phase 4 (Settings Schema) - Use separate table from start

**Sources:**
- [Designing User Settings Database Table](https://basila.medium.com/designing-a-user-settings-database-table-e8084fcd1f67)
- [Default/Override Schema Pattern](https://double.finance/blog/default_override)

---

### Pitfall 12: No Admin Default Layout Defined

**What goes wrong:** New users see empty dashboard or random widget arrangement because admin default was never configured.

**Why it happens:** Focus on "users can customize" without establishing "what's the starting point."

**Consequences:**
- New users confused by empty/broken dashboard
- Each user starts from scratch
- No consistency in initial experience
- Admin can't establish standard view

**Warning signs:**
- "What dashboard should I show new users?"
- Different users reporting different "default" layouts
- No way to reset to "standard"
- New users asking "where are the widgets?"

**Prevention:**
```prisma
// Store admin defaults separately
model AdminDefaults {
  id                  String   @id @default(cuid())
  key                 String   @unique // 'dashboard_layout', 'widget_visibility', etc.
  value               Json
  updatedBy           String
  updatedByUser       User     @relation(fields: [updatedBy], references: [id])
  updatedAt           DateTime @updatedAt

  @@map("admin_defaults")
}
```

```typescript
// Admin UI to set defaults
async function setAdminDefaultLayout(layout: Layouts, adminId: string) {
  await prisma.adminDefaults.upsert({
    where: { key: 'dashboard_layout' },
    create: {
      key: 'dashboard_layout',
      value: layout as unknown as Prisma.JsonValue,
      updatedBy: adminId,
    },
    update: {
      value: layout as unknown as Prisma.JsonValue,
      updatedBy: adminId,
      updatedAt: new Date(),
    },
  });
}

// User can reset to admin default
async function resetToAdminDefault(userId: string) {
  const adminDefault = await prisma.adminDefaults.findUnique({
    where: { key: 'dashboard_layout' }
  });

  if (!adminDefault) {
    throw new Error('No admin default configured');
  }

  await prisma.userSettings.update({
    where: { userId },
    data: { dashboardLayout: adminDefault.value },
  });
}
```

**Phase to address:** Phase 4 (Admin Defaults) - Build admin default UI before user customization

---

### Pitfall 13: Role-Based Widget Visibility Only Client-Side

**What goes wrong:** Widget visibility based on role is only enforced in UI. Users can still see restricted data by inspecting network requests or modifying JavaScript.

**Why it happens:** Client-side role checks are easy - just filter the widget list. Server-side validation requires more work.

**Consequences:**
- Data leakage to unauthorized roles
- False sense of security
- Compliance violations
- Viewers can see Admin-only widgets by manipulating state

**Warning signs:**
- Widget restriction only in React component
- No server-side check for widget data endpoints
- All widget data returned to all users
- Role check only in `{role === 'ADMIN' && <Widget />}`

**Prevention:**
```prisma
// Store role visibility per widget type
model WidgetVisibility {
  id          String   @id @default(cuid())
  widgetKey   String   // 'pipeline_value', 'profit_summary', etc.
  role        Role     // ADMIN, EDITOR, VIEWER
  visible     Boolean  @default(true)

  @@unique([widgetKey, role])
  @@map("widget_visibility")
}
```

```typescript
// Server-side: filter widgets based on role BEFORE sending to client
async function getVisibleWidgets(userRole: Role): Promise<string[]> {
  const visibility = await prisma.widgetVisibility.findMany({
    where: { role: userRole, visible: true },
    select: { widgetKey: true },
  });

  return visibility.map(v => v.widgetKey);
}

// API Route: Only return data for visible widgets
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const visibleWidgets = await getVisibleWidgets(session.user.role);

  // Only fetch data for widgets user can see
  const dashboardData = await Promise.all(
    visibleWidgets.map(async (widget) => ({
      key: widget,
      data: await getWidgetData(widget),
    }))
  );

  return Response.json(dashboardData);
}
```

**Phase to address:** Phase 4 (Widget Visibility) - Implement server-side filtering from start

**Sources:**
- [React RBAC Authorization](https://www.permit.io/blog/implementing-react-rbac-authorization)
- [React-Admin RBAC](https://marmelab.com/react-admin/AuthRBAC.html)

---

### Pitfall 14: JSON Schema Drift for Layouts

**What goes wrong:** Layout JSON structure changes over time (new widget properties, renamed keys), but old user settings contain incompatible data.

**Why it happens:** Treating JSON as "just data" without versioning. Schema changes break existing saved layouts.

**Consequences:**
- Dashboard crashes for users with old layouts
- "Cannot read property X of undefined" errors
- Users must reset layouts after updates
- Data migration complexity

**Warning signs:**
- Type errors in layout components after updates
- Some users' dashboards work, others don't
- "My dashboard broke after the update"
- Runtime errors parsing saved layouts

**Prevention:**
```typescript
// Version your layout schema
interface LayoutV1 {
  version: 1;
  widgets: Array<{ i: string; x: number; y: number; w: number; h: number }>;
}

interface LayoutV2 {
  version: 2;
  widgets: Array<{
    i: string;
    x: number;
    y: number;
    w: number;
    h: number;
    minW?: number;  // New in v2
    minH?: number;  // New in v2
  }>;
}

// Migration function
function migrateLayout(layout: LayoutV1 | LayoutV2): LayoutV2 {
  if (!layout.version || layout.version === 1) {
    return {
      version: 2,
      widgets: (layout as LayoutV1).widgets.map(w => ({
        ...w,
        minW: 2,  // Default values for new fields
        minH: 2,
      })),
    };
  }
  return layout as LayoutV2;
}

// Always migrate when loading
async function getUserLayout(userId: string): Promise<LayoutV2> {
  const settings = await prisma.userSettings.findUnique({
    where: { userId }
  });

  if (!settings?.dashboardLayout) {
    return getAdminDefaultLayout();
  }

  return migrateLayout(settings.dashboardLayout as LayoutV1 | LayoutV2);
}
```

**Phase to address:** Phase 3 (Layout Schema) - Include version field from first implementation

---

## Deployment Pitfalls (NAS/Docker Specific)

### Pitfall 15: File Permission Mismatch in Docker

**What goes wrong:** Uploaded files created with container user (usually root or node) cannot be read by host system, or vice versa.

**Why it happens:** Docker container runs as different UID than NAS user. Volume mounts preserve ownership, causing permission conflicts.

**Consequences:**
- "Permission denied" errors on file read/write
- Files created in container inaccessible from NAS File Station
- Backups fail due to permission issues
- Cannot manually manage uploaded files

**Warning signs:**
- `EACCES: permission denied` in logs
- Files visible in container, not accessible from NAS
- Upload succeeds but download fails
- Manual file deletion from NAS fails

**Prevention:**
```dockerfile
# Dockerfile - run as specific UID matching NAS user
FROM node:20-alpine AS runner

# Create user with specific UID (match NAS user)
# Replace 1000 with your NAS admin user's UID
RUN addgroup --system --gid 1000 nodejs
RUN adduser --system --uid 1000 nextjs

# Set ownership of app directory
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Create uploads directory with correct ownership
RUN mkdir -p ./uploads && chown nextjs:nodejs ./uploads

USER nextjs

CMD ["node", "server.js"]
```

```yaml
# docker-compose.nas.yml
services:
  app:
    # ... other config
    user: "1000:1000"  # Run as NAS user UID:GID
    volumes:
      - /volume1/Motionvii/saap2026v2/uploads:/app/uploads
```

**Phase to address:** Phase 1 (Infrastructure) - Set up correct permissions before first upload

**Sources:**
- [Docker v25.1 Volume Mount Fixes](https://markaicode.com/docker-v25-volume-mount-fixes/)
- [Docker Volume Permissions](https://docs.docker.com/engine/storage/volumes/)

---

### Pitfall 16: Standalone Build Excludes next.config

**What goes wrong:** bodySizeLimit and other configurations not applied in production because standalone build doesn't include config.

**Why it happens:** Next.js standalone output is optimized for minimal deployment. Some configurations need to be explicitly included.

**Consequences:**
- Upload size limits default to 1MB despite configuration
- Other `next.config.mjs` settings ignored
- Works in development, fails in production

**Warning signs:**
- "Body exceeded 1MB limit" in production only
- Configuration changes have no effect after deploy
- Dev environment works, production doesn't

**Prevention:**
```dockerfile
# Dockerfile - explicitly copy next.config
FROM node:20-alpine AS runner

# Copy next.config for runtime access
COPY --from=builder /app/next.config.mjs ./

# ... rest of Dockerfile
```

```yaml
# docker-compose.nas.yml - alternative: mount config
services:
  app:
    volumes:
      - ./next.config.mjs:/app/next.config.mjs:ro
```

**Phase to address:** Phase 1 (Docker Setup) - Verify config included in build

**Sources:**
- [GitHub Discussion #77505](https://github.com/vercel/next.js/discussions/77505)
- [Next.js Deploying Documentation](https://nextjs.org/docs/app/getting-started/deploying)

---

### Pitfall 17: No Backup Strategy for Upload Volume

**What goes wrong:** NAS hardware failure or accidental deletion loses all uploaded documents permanently.

**Why it happens:** Database has backup strategy, but upload directory treated as secondary. "Files are on NAS, NAS is reliable."

**Consequences:**
- All receipts and invoices lost
- Cannot regenerate from database (only paths stored)
- Business records missing for accounting
- Potential legal/compliance issues

**Warning signs:**
- No backup job for upload directory
- "We'll set up backups later"
- Only database in backup rotation
- No disaster recovery test

**Prevention:**
```bash
# On Synology NAS - create Hyper Backup task for uploads
# Include: /volume1/Motionvii/saap2026v2/uploads/

# Or via rsync cron job
0 2 * * * rsync -av /volume1/Motionvii/saap2026v2/uploads/ /volume1/Backups/saap-uploads/
```

```typescript
// Optional: Track backup status in database
model SystemStatus {
  id          String   @id @default(cuid())
  key         String   @unique
  value       String
  checkedAt   DateTime

  @@map("system_status")
}

// Backup script updates status
// SELECT value FROM system_status WHERE key = 'last_upload_backup'
```

**Phase to address:** Phase 1 (Infrastructure) - Set up backup before any production uploads

---

## Phase-Specific Warnings Summary

| Phase | Topic | Likely Pitfall | Mitigation |
|-------|-------|---------------|------------|
| Phase 1 | Infrastructure | Docker volume not mounted | Test file persistence before any upload code |
| Phase 1 | Infrastructure | File permissions mismatch | Set container UID to match NAS user |
| Phase 1 | Config | 1MB body limit | Configure bodySizeLimit in next.config.mjs |
| Phase 1 | Schema | Files in database | Store path only, files on disk |
| Phase 2 | Uploads | MIME type spoofing | Server-side file-type validation |
| Phase 2 | Uploads | Files not served | Create API route to serve uploads |
| Phase 2 | Deletion | Orphaned files | Delete file when document deleted |
| Phase 3 | Layout | Width configuration | Use WidthProvider HOC |
| Phase 3 | Layout | Race conditions | Debounce layout saves |
| Phase 3 | Layout | Missing CSS | Import both RGL CSS files |
| Phase 3 | Layout | Schema drift | Version layout JSON from start |
| Phase 4 | Settings | Wide table | Separate UserSettings table |
| Phase 4 | Defaults | No admin default | Build admin default UI first |
| Phase 4 | Security | Client-only role check | Server-side widget filtering |
| Phase 5 | Backup | No upload backup | Configure Hyper Backup for uploads |

---

## Security Checklist for v1.3

Before deploying document management:

- [ ] Upload size limit configured (not just default 1MB)
- [ ] File type validation server-side (not just extension check)
- [ ] Directory traversal prevention in file serving
- [ ] Authentication required for file access
- [ ] Files stored outside web root
- [ ] Volume permissions correctly configured
- [ ] Backup strategy for upload directory

Before deploying dashboard customization:

- [ ] Widget visibility enforced server-side
- [ ] Role check on widget data endpoints
- [ ] Layout JSON validated before rendering
- [ ] User can only modify their own settings
- [ ] Admin defaults cannot be modified by non-admins
- [ ] Layout schema versioned for future migrations

---

## Pre-Implementation Checklist

- [ ] Docker volume mount configured in `docker-compose.nas.yml`
- [ ] Container UID matches NAS user UID
- [ ] `bodySizeLimit` increased in `next.config.mjs`
- [ ] File serving API route planned
- [ ] React-Grid-Layout CSS imports noted
- [ ] UserSettings schema designed (not on User table)
- [ ] AdminDefaults table for default layout
- [ ] WidgetVisibility table for role-based access
- [ ] Layout version field included
- [ ] Backup job configured for upload directory

---

## Sources

### File Uploads
- [Next.js serverActions Config](https://nextjs.org/docs/app/api-reference/config/next-config-js/serverActions)
- [GitHub Discussion #53989 - Body Limit Issue](https://github.com/vercel/next.js/discussions/53989)
- [GitHub Discussion #49891 - Body Size Error](https://github.com/vercel/next.js/discussions/49891)
- [Next.js Public Folder Documentation](https://nextjs.org/docs/pages/api-reference/file-conventions/public-folder)
- [File Upload Security Best Practices](https://moldstud.com/articles/p-handling-file-uploads-in-nextjs-best-practices-and-security-considerations)

### Docker/Storage
- [Docker Volumes Documentation](https://docs.docker.com/engine/storage/volumes/)
- [Docker Data Persistence Guide](https://www.bibekgupta.com/blog/2025/04/docker-volumes-data-persistence-guide)
- [Docker Volume Mount Fixes](https://markaicode.com/docker-v25-volume-mount-fixes/)

### Dashboard Layouts
- [React-Grid-Layout GitHub](https://github.com/react-grid-layout/react-grid-layout)
- [Building Dashboard Widgets - AntStack](https://medium.com/@antstack/building-customizable-dashboard-widgets-using-react-grid-layout-234f7857c124)
- [Interactive Dashboards with React-Grid-Layout - ilert](https://www.ilert.com/blog/building-interactive-dashboards-why-react-grid-layout-was-our-best-choice)
- [Layout Persistence Issue #883](https://github.com/STRML/react-grid-layout/issues/883)

### User Settings
- [Default/Override Schema Pattern](https://double.finance/blog/default_override)
- [Designing User Settings Database Table](https://basila.medium.com/designing-a-user-settings-database-table-e8084fcd1f67)
- [Storing User Customisations - DEV](https://dev.to/imthedeveloper/storing-user-customisations-and-settings-how-do-you-do-it-1017)

### Role-Based Access
- [React RBAC Authorization - Permit.io](https://www.permit.io/blog/implementing-react-rbac-authorization)
- [React-Admin RBAC](https://marmelab.com/react-admin/AuthRBAC.html)
- [Conditional React UI Based on Permissions](https://medium.com/geekculture/how-to-conditionally-render-react-ui-based-on-user-permissions-7b9a1c73ffe2)
