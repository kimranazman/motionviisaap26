# Stack Research: CRM Pipeline & Project Financials

**Project:** SAAP 2026 v2 - v1.2 CRM & Project Financials Milestone
**Researched:** 2026-01-22
**Overall Confidence:** HIGH

## Executive Summary

For v1.2 CRM & Project Financials, the existing stack (Next.js 14, Prisma, MariaDB, shadcn/ui) remains unchanged. New requirements are:

1. **CRM Pipeline** - No new dependencies. Use existing `@dnd-kit` (already installed) for Kanban boards.
2. **Project Financials** - Use `Decimal(12,2)` in Prisma for money fields. Consider `react-currency-input-field` for input formatting.
3. **Receipt Uploads** - Use native Next.js Server Actions with local filesystem storage. Store files on Docker volume mounted to NAS.

This milestone adds minimal new dependencies, leveraging what's already installed.

---

## Recommended Stack Additions

### Required Packages

| Package | Version | Purpose | Rationale |
|---------|---------|---------|-----------|
| `nanoid` | `^5.0.9` | Unique file naming | URL-friendly, 21 chars, collision-resistant. Better than UUID for filenames. |
| `react-currency-input-field` | `^4.0.3` | Currency input formatting | 315K weekly downloads, ISO 4217 support, locale-aware. Perfect for cost inputs. |

### Optional But Recommended

| Package | Version | Purpose | Rationale |
|---------|---------|---------|-----------|
| `sharp` | `^0.33.5` | Image optimization for receipt thumbnails | Already used by Next.js Image component. Explicit install for Docker standalone mode. |

### Installation Command

```bash
npm install nanoid react-currency-input-field
npm install sharp  # If generating receipt thumbnails
```

---

## Already Installed (Reuse)

These packages in `package.json` cover most v1.2 needs:

| Package | Version | Use for v1.2 |
|---------|---------|--------------|
| `@dnd-kit/core` | `^6.3.1` | Sales pipeline Kanban |
| `@dnd-kit/sortable` | `^10.0.0` | Drag-and-drop deals between stages |
| `@dnd-kit/utilities` | `^3.2.2` | DnD utilities |
| `date-fns` | `^4.1.0` | Date formatting for project timelines |
| `recharts` | `^3.6.0` | Pipeline/revenue dashboard charts |
| `lucide-react` | `^0.562.0` | Icons for stages, costs, etc. |

**Key insight:** The v1.0 Kanban board for initiatives uses `@dnd-kit`. The same patterns apply to sales pipeline stages. No new DnD library needed.

---

## File Upload Strategy

### Recommendation: Native Server Actions + Local Filesystem

**Why NOT UploadThing or cloud storage:**
- NAS deployment (Synology DS925+) has ample local storage
- No external service dependency or costs
- Full control over file handling
- Team of 3 doesn't need CDN delivery
- Receipts are internal documents, not public assets

### Architecture

```
1. Client: <form> with type="file" input
2. Server Action: Receives FormData, writes to /uploads
3. Database: Stores filepath reference, not binary
4. Docker: Volume maps /app/uploads to NAS directory
```

### Server Action Pattern

```typescript
// app/actions/upload-receipt.ts
"use server"

import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { nanoid } from "nanoid"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads/receipts"
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"]

export async function uploadReceipt(formData: FormData) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const file = formData.get("file") as File
  if (!file) throw new Error("No file provided")

  // Validation
  if (file.size > MAX_FILE_SIZE) throw new Error("File too large (max 10MB)")
  if (!ALLOWED_TYPES.includes(file.type)) throw new Error("Invalid file type")

  // Generate unique filename
  const ext = file.name.split(".").pop()
  const filename = `${nanoid()}.${ext}`
  const filepath = join(UPLOAD_DIR, filename)

  // Ensure directory exists
  await mkdir(UPLOAD_DIR, { recursive: true })

  // Write file
  const buffer = Buffer.from(await file.arrayBuffer())
  await writeFile(filepath, buffer)

  return { filepath: `/uploads/receipts/${filename}`, filename }
}
```

### Docker Volume Configuration

```yaml
# docker-compose.yml
services:
  saap:
    volumes:
      - ./uploads:/app/uploads  # Persists across container restarts
      - /volume1/docker/saap/uploads:/app/uploads  # NAS path on Synology
```

### Serving Static Files

Next.js doesn't serve files outside `public/` by default. Options:

**Option A: Symlink (Simple)**
```bash
# In container entrypoint
ln -sf /app/uploads /app/public/uploads
```

**Option B: API Route (More Control)**
```typescript
// app/api/uploads/[...path]/route.ts
import { readFile } from "fs/promises"
import { join } from "path"
import { auth } from "@/auth"

export async function GET(
  request: Request,
  { params }: { params: { path: string[] } }
) {
  const session = await auth()
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 })
  }

  const filepath = join(process.cwd(), "uploads", ...params.path)
  const file = await readFile(filepath)

  return new Response(file, {
    headers: {
      "Content-Type": getMimeType(filepath),
      "Cache-Control": "private, max-age=31536000",
    },
  })
}
```

**Recommendation:** Use Option B (API Route) for auth-protected receipt access.

---

## Prisma Schema Patterns

### Money Fields

Use `Decimal` type, NOT `Float`. Never use floating-point for currency.

```prisma
// Example: Project cost breakdown
model ProjectCost {
  id          String   @id @default(cuid())
  projectId   String
  project     Project  @relation(fields: [projectId], references: [id])
  category    CostCategory
  description String   @db.VarChar(255)
  amount      Decimal  @db.Decimal(12, 2)  // Up to 999,999,999,999.99
  currency    String   @default("MYR") @db.VarChar(3)
  receiptPath String?  @db.VarChar(500)    // File path reference

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([projectId])
  @@index([category])
}
```

**Why Decimal(12,2):**
- Matches existing `resourcesFinancial` field in Initiative model
- 12 digits total, 2 after decimal
- Sufficient for project costs up to ~1 billion MYR

### File Reference Pattern

Store filepath, not binary blob:

```prisma
model Receipt {
  id          String   @id @default(cuid())
  costId      String   @unique
  cost        ProjectCost @relation(fields: [costId], references: [id])
  filename    String   @db.VarChar(255)  // Original filename for display
  filepath    String   @db.VarChar(500)  // /uploads/receipts/abc123.pdf
  mimeType    String   @db.VarChar(100)
  fileSize    Int                        // Bytes
  uploadedBy  String
  user        User     @relation(fields: [uploadedBy], references: [id])

  createdAt   DateTime @default(now())
}
```

**Why NOT store blobs:**
- Prisma recommends external storage for files >100KB
- Database backups become huge
- Query performance degrades
- MariaDB `LONGBLOB` has 4GB limit but complicates everything

### Pipeline Stage Enums

```prisma
enum PipelineStage {
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
```

---

## Currency Input Component

### react-currency-input-field Usage

```tsx
import CurrencyInput from "react-currency-input-field"

<CurrencyInput
  id="amount"
  name="amount"
  placeholder="0.00"
  decimalsLimit={2}
  prefix="RM "
  intlConfig={{ locale: "en-MY", currency: "MYR" }}
  onValueChange={(value) => setAmount(value)}
  className="flex h-10 w-full rounded-md border..."
/>
```

**Features:**
- Locale-aware formatting (1,234.56 for Malaysia)
- Prefix/suffix support (RM)
- Decimal limits
- Form integration

### Alternative: Native Intl API (Zero Dependencies)

If you want to avoid another dependency:

```typescript
const formatCurrency = (value: number, locale = "en-MY", currency = "MYR") => {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(value)
}
```

Use `<input type="number" step="0.01">` with `onBlur` formatting.

**Recommendation:** Use `react-currency-input-field` for better UX. It's well-maintained (315K weekly downloads) and handles edge cases.

---

## Dropzone Component for Receipts

### Recommendation: shadcn-dropzone Pattern

The shadcn ecosystem has several dropzone components built on `react-dropzone`. Since the project already uses shadcn/ui, follow the same pattern:

```tsx
// components/ui/dropzone.tsx
// Adapted from shadcn.io/components/forms/dropzone

import { useDropzone } from "react-dropzone"
import { cn } from "@/lib/utils"

interface DropzoneProps {
  onDrop: (files: File[]) => void
  accept?: Record<string, string[]>
  maxSize?: number
}

export function Dropzone({ onDrop, accept, maxSize }: DropzoneProps) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: accept ?? {
      "image/*": [".jpeg", ".jpg", ".png", ".webp"],
      "application/pdf": [".pdf"],
    },
    maxSize: maxSize ?? 10 * 1024 * 1024, // 10MB
    multiple: false,
  })

  return (
    <div
      {...getRootProps()}
      className={cn(
        "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer",
        isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25"
      )}
    >
      <input {...getInputProps()} />
      {isDragActive ? (
        <p>Drop the file here...</p>
      ) : (
        <p>Drag & drop a receipt, or click to select</p>
      )}
    </div>
  )
}
```

**Required dependency:**
```bash
npm install react-dropzone
```

However, since the project aims for minimal dependencies, consider starting with a native `<input type="file">` styled with shadcn, and adding dropzone later if needed.

---

## Sharp for Docker (If Using Image Optimization)

If you generate receipt thumbnails or use `next/image` for receipts:

### Installation for Docker Standalone

```dockerfile
# In Dockerfile, before COPY
RUN npm install sharp --os=linux --cpu=x64

# Set environment variable
ENV NEXT_SHARP_PATH=/app/node_modules/sharp
```

### If Not Using Image Optimization

Skip sharp. Receipts can be served as-is without thumbnails.

**Recommendation:** Skip sharp for v1.2. Serve original receipt files. Add thumbnail generation later if needed.

---

## What NOT to Use

### 1. UploadThing

**Why not:** Adds external service dependency, costs money at scale, overkill for internal tool with 3 users. Native Server Actions + local storage is simpler and sufficient.

### 2. Multer

**Why not:** Multer doesn't work well with Next.js App Router. Native `formData.get("file")` works fine. Multer is for Express middleware.

### 3. Formidable

**Why not:** Requires disabling Next.js bodyParser. More complexity than native approach. Only useful for streaming large files (not needed for receipts).

### 4. AWS S3 / Cloudinary

**Why not:** External dependency, requires credentials management, network latency to cloud, costs money. NAS has plenty of storage.

### 5. PostgreSQL `@db.Money` Type

**Why not:** The project uses MariaDB, but even if it were PostgreSQL, avoid `@db.Money`. It depends on locale settings and has rounding issues. Stick with `Decimal`.

### 6. Float for Currency

**Why not:** Floating-point arithmetic causes precision errors (`0.1 + 0.2 != 0.3`). Always use `Decimal` for money.

### 7. Storing Files in Database

**Why not:** Prisma documentation explicitly recommends against storing large objects (files >100KB) in the database. Increases backup size, degrades query performance.

### 8. UUID for Filenames

**Why not:** UUID is 36 characters with dashes (not URL-friendly). NanoID is 21 characters, URL-safe, and collision-resistant.

### 9. react-beautiful-dnd

**Why not:** Deprecated, not maintained, doesn't work with React 18 strict mode. The project already uses `@dnd-kit` which is the modern replacement.

### 10. New Kanban Library

**Why not:** `@dnd-kit` is already installed and used for initiatives Kanban. Use the same library for sales pipeline consistency.

---

## Summary: New Dependencies

| Package | Required? | Notes |
|---------|-----------|-------|
| `nanoid` | Yes | File naming |
| `react-currency-input-field` | Recommended | Currency input UX |
| `react-dropzone` | Optional | Drag-and-drop upload UX (can use native input instead) |
| `sharp` | No | Skip for v1.2, add later if thumbnails needed |

**Total new packages:** 1-3 (minimal footprint)

---

## Migration Checklist

1. [ ] Install `nanoid` and `react-currency-input-field`
2. [ ] Create `/uploads` directory with proper permissions
3. [ ] Configure Docker volume for uploads persistence
4. [ ] Add upload API route or Server Action
5. [ ] Add Prisma models for Pipeline, Project, ProjectCost
6. [ ] Create currency input component
7. [ ] Create receipt upload component
8. [ ] Test file upload end-to-end on NAS

---

## Sources

### HIGH Confidence (Official Documentation)
- [Next.js File Uploads: Server-Side Solutions](https://www.pronextjs.dev/next-js-file-uploads-server-side-solutions)
- [Prisma: Avoid Storing BLOBs](https://www.prisma.io/docs/postgres/query-optimization/recommendations/storing-blob-in-database)
- [Prisma: Decimal Type](https://github.com/prisma/prisma/discussions/10160)
- [nanoid GitHub](https://github.com/ai/nanoid)
- [@dnd-kit Documentation](https://dndkit.com/)

### MEDIUM Confidence (Verified Community)
- [react-currency-input-field npm](https://www.npmjs.com/package/react-currency-input-field) - 315K weekly downloads
- [shadcn.io Dropzone](https://www.shadcn.io/components/forms/dropzone)
- [File Upload with Server Actions](https://akoskm.com/file-upload-with-nextjs-14-and-server-actions/)
- [Building Kanban with dnd-kit](https://blog.chetanverma.com/how-to-create-an-awesome-kanban-board-using-dnd-kit)
- [Sharp Docker Configuration](https://github.com/vercel/next.js/discussions/35296)

### LOW Confidence (Single Source - Verify Before Using)
- Sharp version compatibility with Next.js 14 Docker may require testing
