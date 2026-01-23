# Phase 22: Document Management - Research

**Researched:** 2026-01-23
**Domain:** File upload UI, drag-and-drop, document lists, image preview, filtering
**Confidence:** HIGH

## Summary

This phase implements the user-facing document management features building on the Phase 21 infrastructure (10MB upload limit, Docker volume mounts, authenticated file serving API, Document model). The research focused on: (1) drag-and-drop upload UI patterns using react-dropzone, (2) upload progress tracking via XMLHttpRequest, (3) document list display within the existing ProjectDetailSheet, (4) image preview modal patterns, (5) category filtering patterns consistent with existing codebase, and (6) project date fields.

The codebase already has established patterns for: segmented filter tabs (KanbanFilterBar, ProjectList), AlertDialog for confirmations, Sheet for detail views, Badge for category display, Progress component for progress bars, and Dialog for full-screen mobile modals. The project-detail-sheet.tsx already includes a "Costs" section with add/edit/delete patterns that can serve as a template for the Documents section.

**Primary recommendation:** Add a "Documents" section to ProjectDetailSheet (below Costs), using react-dropzone for upload, XMLHttpRequest for progress tracking, card-based list with category badges, Dialog for image preview modal, and segmented filter tabs for category filtering. Add startDate/endDate fields to Project model and form.

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 14.2.28 | App Router, Server Actions, API Routes | Already in use |
| Prisma | 6.19.2 | Document model (already exists) | Already in use |
| shadcn/ui | latest | Dialog, Badge, Button, Progress, Sheet | Already in use |
| Tailwind CSS | 3.x | Styling | Already in use |

### To Install
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|-------------|
| react-dropzone | ^14.3.5 | Drag-and-drop file selection | Most popular React dropzone, 10k+ GitHub stars, works with shadcn/ui |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-dropzone | Native HTML5 drag-drop | react-dropzone handles all edge cases, cross-browser support |
| XMLHttpRequest progress | Axios | XHR is built-in, Axios adds 30KB bundle; both work equally well |
| New file upload route | Server Actions | Server Actions don't support upload progress; use API route |

**Installation:**
```bash
npm install react-dropzone
```

## Architecture Patterns

### Recommended File Structure
```
src/
├── app/
│   └── api/
│       └── projects/
│           └── [id]/
│               └── documents/
│                   ├── route.ts           # POST (upload), GET (list)
│                   └── [documentId]/
│                       └── route.ts       # DELETE, PATCH (category)
├── components/
│   └── projects/
│       ├── project-detail-sheet.tsx       # Add Documents section here
│       ├── document-upload-zone.tsx       # NEW: Drag-drop + file picker
│       ├── document-list.tsx              # NEW: List with filter tabs
│       ├── document-card.tsx              # NEW: Card with actions
│       └── image-preview-dialog.tsx       # NEW: Fullscreen image modal
└── lib/
    └── document-utils.ts                  # NEW: Helpers for documents
```

### Pattern 1: Upload Zone with react-dropzone
**What:** Drag-and-drop area with click-to-select fallback
**When to use:** File upload interface
**Example:**
```typescript
// components/projects/document-upload-zone.tsx
'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, AlertCircle, CheckCircle } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface FileWithProgress {
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'complete' | 'error'
  error?: string
}

interface DocumentUploadZoneProps {
  projectId: string
  onUploadComplete: () => void
}

const MAX_SIZE = 10 * 1024 * 1024 // 10MB
const ACCEPTED_TYPES = {
  'application/pdf': ['.pdf'],
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
}

export function DocumentUploadZone({ projectId, onUploadComplete }: DocumentUploadZoneProps) {
  const [files, setFiles] = useState<FileWithProgress[]>([])

  const uploadFile = async (file: File, index: number) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('category', 'OTHER') // Default category

    return new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest()

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100)
          setFiles(prev => prev.map((f, i) =>
            i === index ? { ...f, progress, status: 'uploading' } : f
          ))
        }
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          setFiles(prev => prev.map((f, i) =>
            i === index ? { ...f, progress: 100, status: 'complete' } : f
          ))
          resolve()
        } else {
          const error = JSON.parse(xhr.responseText)?.error || 'Upload failed'
          setFiles(prev => prev.map((f, i) =>
            i === index ? { ...f, status: 'error', error } : f
          ))
          reject(new Error(error))
        }
      }

      xhr.onerror = () => {
        setFiles(prev => prev.map((f, i) =>
          i === index ? { ...f, status: 'error', error: 'Network error' } : f
        ))
        reject(new Error('Network error'))
      }

      xhr.open('POST', `/api/projects/${projectId}/documents`)
      xhr.send(formData)
    })
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    // Add files to state with pending status
    const newFiles = acceptedFiles.map(file => ({
      file,
      progress: 0,
      status: 'pending' as const,
    }))
    setFiles(prev => [...prev, ...newFiles])

    // Upload each file
    const startIndex = files.length
    for (let i = 0; i < acceptedFiles.length; i++) {
      try {
        await uploadFile(acceptedFiles[i], startIndex + i)
      } catch (err) {
        console.error('Upload error:', err)
      }
    }

    onUploadComplete()
  }, [files.length, projectId, onUploadComplete])

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_SIZE,
    multiple: true,
  })

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
          'min-h-[120px] flex flex-col items-center justify-center',
          isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
        )}
      >
        <input {...getInputProps()} />
        <Upload className="h-8 w-8 text-gray-400 mb-2" />
        {isDragActive ? (
          <p className="text-blue-600 font-medium">Drop files here...</p>
        ) : (
          <>
            <p className="text-gray-600 font-medium">Drag & drop files here</p>
            <p className="text-sm text-gray-400 mt-1">or click to select files</p>
            <p className="text-xs text-gray-400 mt-2">PDF, PNG, JPG up to 10MB</p>
          </>
        )}
      </div>

      {/* File rejections */}
      {fileRejections.length > 0 && (
        <div className="text-sm text-red-500 space-y-1">
          {fileRejections.map(({ file, errors }) => (
            <div key={file.name} className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span>{file.name}: {errors.map(e => e.message).join(', ')}</span>
            </div>
          ))}
        </div>
      )}

      {/* Upload progress */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((f, i) => (
            <div key={i} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{f.file.name}</p>
                {f.status === 'uploading' && (
                  <Progress value={f.progress} className="h-1 mt-1" />
                )}
                {f.status === 'error' && (
                  <p className="text-xs text-red-500">{f.error}</p>
                )}
              </div>
              {f.status === 'complete' && (
                <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
              )}
              {f.status === 'error' && (
                <X className="h-5 w-5 text-red-500 shrink-0" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

### Pattern 2: Document Card with Actions
**What:** List item for a document with preview/download/delete actions
**When to use:** Document list display
**Example:**
```typescript
// components/projects/document-card.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { FileText, Image, Download, Trash2, Eye } from 'lucide-react'
import { formatDate, formatFileSize, getCategoryColor } from '@/lib/document-utils'

interface Document {
  id: string
  filename: string
  mimeType: string
  size: number
  category: 'RECEIPT' | 'INVOICE' | 'OTHER'
  createdAt: string
}

interface DocumentCardProps {
  document: Document
  projectId: string
  onPreview: (document: Document) => void
  onCategoryChange: (id: string, category: string) => void
  onDelete: () => void
}

export function DocumentCard({
  document,
  projectId,
  onPreview,
  onCategoryChange,
  onDelete,
}: DocumentCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const isImage = document.mimeType.startsWith('image/')
  const Icon = isImage ? Image : FileText

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(
        `/api/projects/${projectId}/documents/${document.id}`,
        { method: 'DELETE' }
      )
      if (response.ok) {
        onDelete()
      }
    } catch (error) {
      console.error('Failed to delete document:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDownload = () => {
    // Use the file serving API route
    window.open(`/api/files/${projectId}/${document.filename}`, '_blank')
  }

  const handlePreview = () => {
    if (isImage) {
      onPreview(document)
    } else {
      // PDF opens in new tab
      window.open(`/api/files/${projectId}/${document.filename}`, '_blank')
    }
  }

  return (
    <div className="flex items-center justify-between p-3 border rounded-lg bg-white hover:bg-gray-50">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Icon className="h-8 w-8 text-gray-400 shrink-0" />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">{document.filename}</span>
            <Badge variant="outline" className={getCategoryColor(document.category)}>
              {document.category}
            </Badge>
          </div>
          <div className="text-sm text-gray-500 mt-0.5">
            {formatFileSize(document.size)} - {formatDate(document.createdAt)}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 ml-2">
        {/* Category select - mobile-friendly 44px target */}
        <Select
          value={document.category}
          onValueChange={(value) => onCategoryChange(document.id, value)}
        >
          <SelectTrigger className="w-[100px] h-10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="RECEIPT">Receipt</SelectItem>
            <SelectItem value="INVOICE">Invoice</SelectItem>
            <SelectItem value="OTHER">Other</SelectItem>
          </SelectContent>
        </Select>

        {/* Preview */}
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10"
          onClick={handlePreview}
        >
          <Eye className="h-4 w-4" />
        </Button>

        {/* Download */}
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10"
          onClick={handleDownload}
        >
          <Download className="h-4 w-4" />
        </Button>

        {/* Delete with confirmation */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Document</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{document.filename}"? This action
                cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
```

### Pattern 3: Image Preview Dialog (Mobile Full-Screen)
**What:** Full-screen modal for image preview
**When to use:** Viewing image documents
**Example:**
```typescript
// components/projects/image-preview-dialog.tsx
'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface Document {
  id: string
  filename: string
  mimeType: string
}

interface ImagePreviewDialogProps {
  document: Document | null
  projectId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ImagePreviewDialog({
  document,
  projectId,
  open,
  onOpenChange,
}: ImagePreviewDialogProps) {
  if (!document) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="truncate">{document.filename}</DialogTitle>
        </DialogHeader>
        <div className="p-4 flex items-center justify-center bg-gray-100 min-h-[300px] max-h-[70vh] overflow-auto">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/files/${projectId}/${document.filename}`}
            alt={document.filename}
            className="max-w-full max-h-full object-contain"
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

### Pattern 4: Category Filter Tabs (Existing Pattern)
**What:** Segmented control for filtering by category
**When to use:** Document list filtering
**Example:**
```typescript
// Within document-list.tsx, following project-list.tsx pattern
const CATEGORY_TABS = [
  { id: 'ALL', label: 'All' },
  { id: 'RECEIPT', label: 'Receipt' },
  { id: 'INVOICE', label: 'Invoice' },
  { id: 'OTHER', label: 'Other' },
]

// Filter pills (like ProjectList)
<div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg overflow-x-auto">
  {CATEGORY_TABS.map((tab) => (
    <button
      key={tab.id}
      onClick={() => setSelectedCategory(tab.id)}
      className={cn(
        'px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap',
        selectedCategory === tab.id
          ? 'bg-white text-gray-900 shadow-sm'
          : 'text-gray-600 hover:text-gray-900'
      )}
    >
      {tab.label}
    </button>
  ))}
</div>
```

### Pattern 5: Project Dates in Schema and Form
**What:** Add startDate and endDate to Project model
**When to use:** Project timeline tracking
**Example:**
```prisma
// prisma/schema.prisma - Add to Project model
model Project {
  // ... existing fields ...

  // Project dates (DOC-16, DOC-17)
  startDate       DateTime?       @map("start_date")
  endDate         DateTime?       @map("end_date")

  // ... rest of model ...
}
```

```typescript
// In ProjectDetailSheet - Add date pickers after description
<div className="grid grid-cols-2 gap-4">
  <div className="space-y-2">
    <Label>Start Date</Label>
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            'w-full justify-start text-left font-normal h-11',
            !startDate && 'text-muted-foreground'
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {startDate ? format(startDate, 'PPP') : 'Pick date'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={startDate}
          onSelect={(d) => setStartDate(d || null)}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  </div>

  <div className="space-y-2">
    <Label>End Date</Label>
    {/* Similar pattern */}
  </div>
</div>
```

### Anti-Patterns to Avoid
- **Using Server Actions for uploads**: No progress tracking support; use API routes with XHR
- **Large file thumbnails in list**: Load on demand, use lazy loading
- **Blocking UI during upload**: Use async uploads with progress indicators
- **Deleting files without cleanup**: Always delete file from filesystem when deleting database record
- **Storing absolute paths**: Store relative paths (e.g., `projects/{id}/{filename}`)

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Drag-and-drop | HTML5 drag events manually | react-dropzone | Handles edge cases, keyboard accessibility, mobile |
| File type validation | Extension checking only | MIME type check + extension | Extensions can be spoofed |
| Progress tracking | Polling or SSE | XMLHttpRequest onprogress | Native, reliable, no extra infrastructure |
| Image scaling | Canvas manipulation | CSS object-fit | Browser handles rendering efficiently |
| File size display | Manual division | formatBytes utility | Consistent formatting |

**Key insight:** react-dropzone handles many edge cases (mobile, keyboard nav, multiple files, drag leave/enter) that would take significant effort to implement correctly.

## Common Pitfalls

### Pitfall 1: Upload Progress Not Working
**What goes wrong:** Progress stays at 0% or jumps to 100%
**Why it happens:** Using fetch() instead of XMLHttpRequest; fetch doesn't support upload progress
**How to avoid:** Use XMLHttpRequest with xhr.upload.onprogress event handler
**Warning signs:** Progress bar doesn't move during upload

### Pitfall 2: File Serving Path Mismatch
**What goes wrong:** Files upload successfully but can't be viewed
**Why it happens:** Storing full storage path (UUID-based) in Document record but trying to access by original filename
**How to avoid:** Store both filename (for display) and storagePath (UUID for filesystem); file serve route should use storagePath
**Warning signs:** 404 errors when trying to preview/download

### Pitfall 3: Memory Overflow on Multiple Uploads
**What goes wrong:** Browser tab crashes with many large files
**Why it happens:** Reading all files into memory at once with arrayBuffer()
**How to avoid:** Upload files sequentially or with limited parallelism (2-3 at a time)
**Warning signs:** Page becomes unresponsive during bulk upload

### Pitfall 4: Stale Document List
**What goes wrong:** Newly uploaded documents don't appear until page refresh
**Why it happens:** Not refreshing document list after upload completes
**How to avoid:** Call onUploadComplete callback to trigger list refresh
**Warning signs:** Users report documents "not saving"

### Pitfall 5: File Orphans on Failed Upload
**What goes wrong:** Files exist on disk but no database record
**Why it happens:** File written first, then database write fails
**How to avoid:** Write file first, create DB record, if DB fails delete file
**Warning signs:** Disk space grows, files with no documents in DB

### Pitfall 6: Category Filter Not Persisting
**What goes wrong:** Filter resets when navigating away
**Why it happens:** Filter state only in component, not in URL or parent
**How to avoid:** Keep filter state in parent component (ProjectDetailSheet) and pass down
**Warning signs:** Users complain about filters resetting

## Code Examples

### Document Upload API Route
```typescript
// src/app/api/projects/[id]/documents/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { requireEditor } from '@/lib/auth-utils'
import prisma from '@/lib/prisma'
import { writeFile, mkdir, unlink } from 'fs/promises'
import path from 'path'
import { randomUUID } from 'crypto'

const UPLOADS_DIR = process.env.UPLOADS_DIR || '/app/uploads'
const MAX_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ['application/pdf', 'image/png', 'image/jpeg']

// GET /api/projects/[id]/documents - List documents
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth()
  if (error) return error

  const { id } = await params
  const documents = await prisma.document.findMany({
    where: { projectId: id },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(documents)
}

// POST /api/projects/[id]/documents - Upload document
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireEditor()
  if (error) return error

  const { id: projectId } = await params
  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const category = (formData.get('category') as string) || 'OTHER'

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  // Validate type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: 'Invalid file type. Allowed: PDF, PNG, JPG' },
      { status: 400 }
    )
  }

  // Validate size
  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: 'File too large. Maximum: 10MB' },
      { status: 400 }
    )
  }

  // Verify project exists
  const project = await prisma.project.findUnique({ where: { id: projectId } })
  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  // Create unique filename
  const ext = path.extname(file.name)
  const uniqueName = `${randomUUID()}${ext}`
  const relativePath = `projects/${projectId}/${uniqueName}`
  const fullPath = path.join(UPLOADS_DIR, relativePath)

  try {
    // Ensure directory exists
    await mkdir(path.dirname(fullPath), { recursive: true })

    // Write file
    const bytes = await file.arrayBuffer()
    await writeFile(fullPath, Buffer.from(bytes))

    // Create database record
    const document = await prisma.document.create({
      data: {
        projectId,
        filename: uniqueName, // Store UUID name for file serving
        storagePath: relativePath,
        mimeType: file.type,
        size: file.size,
        category: category as 'RECEIPT' | 'INVOICE' | 'OTHER',
        uploadedById: session.user.id,
      },
    })

    // Return with original filename for display
    return NextResponse.json({
      ...document,
      displayName: file.name, // Original filename
    }, { status: 201 })
  } catch (err) {
    // Cleanup file if DB write failed
    try {
      await unlink(fullPath)
    } catch {}
    console.error('Upload error:', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
```

### Document Utils
```typescript
// src/lib/document-utils.ts

// Document category colors (matching cost-utils pattern)
export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    RECEIPT: 'bg-green-100 text-green-700 border-green-200',
    INVOICE: 'bg-blue-100 text-blue-700 border-blue-200',
    OTHER: 'bg-gray-100 text-gray-700 border-gray-200',
  }
  return colors[category] || colors.OTHER
}

// Format file size for display
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

// MIME type to file icon mapping
export function getFileIcon(mimeType: string): 'pdf' | 'image' {
  if (mimeType === 'application/pdf') return 'pdf'
  return 'image'
}

// Check if file is previewable inline (images only)
export function isPreviewable(mimeType: string): boolean {
  return mimeType.startsWith('image/')
}

// Document category options
export const DOCUMENT_CATEGORIES = [
  { value: 'RECEIPT', label: 'Receipt' },
  { value: 'INVOICE', label: 'Invoice' },
  { value: 'OTHER', label: 'Other' },
] as const

export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number]['value']
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| formidable parsing | Native FormData | Node.js 18+ | No external deps |
| Multer middleware | App Router formData() | Next.js 13+ | Simpler setup |
| Base64 in DB | File on disk + path in DB | Best practice | Better performance, smaller DB |
| Thumbnail generation | CSS object-fit + lazy loading | Modern browsers | No server processing needed |

**Deprecated/outdated:**
- `formidable` / `multer` - Not needed with native FormData in App Router
- Base64-encoded files in database - Causes DB bloat, slow queries

## Open Questions

1. **Filename storage strategy**
   - What we know: Files stored with UUID name for uniqueness
   - What's unclear: Best way to preserve original filename for display
   - Recommendation: Store original filename in separate `displayName` field OR extract from filename before UUID suffix

2. **Concurrent upload limit**
   - What we know: Many files at once can exhaust memory
   - What's unclear: What's the right concurrent limit
   - Recommendation: Start with 2 concurrent uploads, can adjust based on testing

3. **Start date auto-fill from deal**
   - What we know: Requirements say "auto-filled from deal won date or manual"
   - What's unclear: Deal model doesn't have a "won date" field; uses stageChangedAt
   - Recommendation: Use Deal.stageChangedAt when stage is WON as the source for auto-fill

## Sources

### Primary (HIGH confidence)
- Codebase analysis - Existing patterns in project-detail-sheet.tsx, cost-card.tsx, project-list.tsx
- Phase 21 Research - Infrastructure already in place (verified)
- Prisma schema - Document model already defined with correct fields

### Secondary (MEDIUM confidence)
- [react-dropzone documentation](https://react-dropzone.js.org/) - Official docs for drag-drop
- [XMLHttpRequest upload progress](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/upload) - MDN documentation
- [shadcn-dropzone](https://github.com/diragb/shadcn-dropzone) - Community implementation reference

### Tertiary (LOW confidence)
- Web search results for shadcn file upload patterns - Community best practices

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Uses existing codebase patterns and infrastructure
- Architecture: HIGH - Follows established component structure
- Upload patterns: HIGH - XMLHttpRequest is well-documented standard
- UI patterns: HIGH - Matches existing codebase patterns exactly
- Date fields: MEDIUM - Need schema migration

**Research date:** 2026-01-23
**Valid until:** 30 days (UI patterns are stable)
