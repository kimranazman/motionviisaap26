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
