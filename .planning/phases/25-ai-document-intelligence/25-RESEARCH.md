# Phase 25: AI Document Intelligence - Research

**Researched:** 2026-01-24
**Domain:** AI document extraction workflow (Phase A - Claude Code based)
**Confidence:** HIGH

## Summary

This phase implements an AI document intelligence workflow where users upload invoices/receipts, a manifest file is auto-generated for AI context, users run Claude Code commands to analyze documents, and the app imports structured JSON results for user confirmation.

The codebase already has solid foundations from Phase 22 (document management) and Phase 14 (project costs). Documents are stored with categories (RECEIPT, INVOICE, OTHER), costs have categories (Labor, Materials, Vendors, Travel, Software, Other), and the ProjectDetailSheet provides a pattern for slide-out review UIs.

**Primary recommendation:** Build a manifest generation system triggered on document upload, create prompt templates in `.claude/prompts/`, and add an AI extraction import flow with a review sheet UI using existing patterns.

## Existing Codebase Findings

### Document Management (Phase 22)

**File Storage:**
- Documents stored in `UPLOADS_DIR/projects/{projectId}/{uuid}.ext`
- UPLOADS_DIR defaults to `/app/uploads` (Docker) or `./uploads` (local)
- Files served via `/api/files/{projectId}/{filename}` with auth check
- Storage path format: `projects/{projectId}/{uuid}.{ext}`

**Database Schema (Document model):**
```prisma
model Document {
  id            String           @id @default(cuid())
  projectId     String
  filename      String           // Original filename for display
  storagePath   String           // Relative path: projects/{id}/{uuid}.ext
  mimeType      String           // application/pdf, image/png, image/jpeg
  size          Int              // File size in bytes
  category      DocumentCategory // RECEIPT, INVOICE, OTHER
  uploadedById  String
  createdAt     DateTime
  updatedAt     DateTime
}
```

**Document Categories:**
```typescript
const DOCUMENT_CATEGORIES = [
  { value: 'RECEIPT', label: 'Receipt' },
  { value: 'INVOICE', label: 'Invoice' },
  { value: 'OTHER', label: 'Other' },
]
```

**API Routes:**
- `GET /api/projects/[id]/documents` - List documents
- `POST /api/projects/[id]/documents` - Upload document (FormData)
- `PATCH /api/projects/[id]/documents/[documentId]` - Update category
- `DELETE /api/projects/[id]/documents/[documentId]` - Delete document
- `GET /api/files/[projectId]/[filename]` - Serve file content

### Project Costs (Phase 14)

**Database Schema (Cost model):**
```prisma
model Cost {
  id            String
  description   String
  amount        Decimal
  date          DateTime
  projectId     String
  categoryId    String
  receiptPath   String?    // Optional receipt file path
  createdAt     DateTime
  updatedAt     DateTime
}
```

**Cost Categories (seeded):**
- Labor - Internal staff costs
- Materials - Physical materials and supplies
- Vendors - Third-party contractor/vendor costs
- Travel - Transportation and accommodation
- Software - Software licenses and subscriptions
- Other - Miscellaneous costs

**API Routes:**
- `GET /api/projects/[id]/costs` - List costs
- `POST /api/projects/[id]/costs` - Create cost (requires description, amount, categoryId)
- `PATCH /api/projects/[id]/costs/[costId]` - Update cost
- `DELETE /api/projects/[id]/costs/[costId]` - Delete cost
- `GET /api/cost-categories` - List active categories

### ProjectDetailSheet Pattern

The `ProjectDetailSheet` component provides an excellent pattern for the AI review sheet:
- Uses `Sheet` component from shadcn/ui (slides in from right)
- Full height with scroll area for content
- Header with badge and title
- Footer with action buttons
- Sections for different data (description, dates, financial summary, costs, documents)
- Inline editing within the sheet
- Uses `ScrollArea` for scrollable content
- Side panel is ~lg width (`sm:max-w-lg`)

**Key patterns:**
```typescript
<Sheet open={open} onOpenChange={onOpenChange}>
  <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col">
    <SheetHeader className="p-6 pb-4 border-b">
      {/* Title and badge */}
    </SheetHeader>
    <ScrollArea className="flex-1">
      <div className="p-6 space-y-4">
        {/* Content sections */}
      </div>
    </ScrollArea>
    <SheetFooter className="p-4 border-t">
      {/* Actions */}
    </SheetFooter>
  </SheetContent>
</Sheet>
```

### UI Components Available

**Already available in codebase:**
- `Sheet` - Slide-out panels (right side, full height)
- `Badge` - Status/category indicators
- `Table` - Full shadcn table components
- `Dialog` - Modal dialogs (used for image preview)
- `Select` - Dropdown selection
- `Input` - Form inputs
- `Button` - Action buttons
- `Card` - Content cards
- `AlertDialog` - Confirmation dialogs
- `Popover` - Floating content
- `ScrollArea` - Scrollable containers

**Utility functions:**
- `formatCurrency()` - Malaysian Ringgit formatting
- `formatDate()` - Date display formatting
- `cn()` - Class name merging

## Technical Approach

### 1. Manifest Generation

**What goes in the manifest:**
```json
{
  "version": "1.0",
  "generatedAt": "2026-01-24T10:30:00Z",
  "project": {
    "id": "clxxx...",
    "title": "Project Name",
    "company": "Company Name",
    "startDate": "2026-01-01",
    "endDate": "2026-06-30",
    "status": "ACTIVE"
  },
  "existingCategories": [
    { "id": "cat1", "name": "Labor" },
    { "id": "cat2", "name": "Materials" }
  ],
  "documents": {
    "pendingAnalysis": [
      {
        "id": "doc1",
        "filename": "invoice-001.pdf",
        "category": "INVOICE",
        "path": "projects/proj1/uuid.pdf",
        "mimeType": "application/pdf",
        "size": 123456,
        "uploadedAt": "2026-01-24T09:00:00Z",
        "thumbnail": "data:image/jpeg;base64,..." // Optional for images
      }
    ],
    "alreadyAnalyzed": [
      {
        "id": "doc2",
        "filename": "receipt-001.jpg",
        "analyzedAt": "2026-01-20T15:00:00Z"
      }
    ]
  },
  "existingCosts": [
    {
      "description": "Previous expense",
      "amount": 500.00,
      "category": "Materials",
      "date": "2026-01-15"
    }
  ]
}
```

**Where to store:**
- Generate at: `UPLOADS_DIR/projects/{projectId}/manifest.json`
- Accessible to Claude Code when analyzing the project folder

**When to generate:**
- On document upload (auto-update)
- On demand via API call
- Bulk regeneration for all projects with pending documents

### 2. Document Status Tracking

**Schema Addition:**
```prisma
model Document {
  // ... existing fields
  aiStatus      DocumentAIStatus  @default(PENDING)
  aiAnalyzedAt  DateTime?
}

enum DocumentAIStatus {
  PENDING      // Not yet analyzed
  ANALYZED     // AI extraction complete
  IMPORTED     // Data imported to system
  FAILED       // Analysis failed
}
```

### 3. AI Extraction JSON Schema

**Invoice Extraction Schema:**
```typescript
interface InvoiceExtraction {
  documentId: string
  confidence: 'HIGH' | 'MEDIUM' | 'LOW'
  invoiceNumber?: string
  invoiceDate?: string
  vendor?: string
  lineItems: {
    description: string
    quantity?: number
    unitPrice?: number
    amount: number
    confidence: 'HIGH' | 'MEDIUM' | 'LOW'
  }[]
  subtotal?: number
  tax?: number
  total: number
  notes?: string
  warnings?: string[]
}
```

**Receipt Extraction Schema:**
```typescript
interface ReceiptExtraction {
  documentId: string
  confidence: 'HIGH' | 'MEDIUM' | 'LOW'
  merchant?: string
  receiptDate?: string
  items: {
    description: string
    amount: number
    suggestedCategory?: string
    suggestedCategoryId?: string
    confidence: 'HIGH' | 'MEDIUM' | 'LOW'
  }[]
  total: number
  paymentMethod?: string
  notes?: string
  warnings?: string[]
}
```

**Bulk Analysis Result:**
```typescript
interface AIAnalysisResult {
  version: "1.0"
  analyzedAt: string
  projectId: string
  invoices: InvoiceExtraction[]
  receipts: ReceiptExtraction[]
  errors?: {
    documentId: string
    error: string
  }[]
}
```

### 4. API Routes to Create

**Manifest:**
- `POST /api/projects/[id]/manifest/generate` - Generate/update manifest
- `GET /api/projects/[id]/manifest` - Get current manifest

**AI Import:**
- `POST /api/projects/[id]/ai-import` - Import AI extraction results
- `GET /api/projects/[id]/ai-pending` - Get documents pending analysis

**Bulk Operations:**
- `GET /api/ai/pending-projects` - List projects with pending documents
- `POST /api/ai/bulk-manifest` - Generate manifests for all pending projects

### 5. Prompt Templates Structure

**Location:** `.claude/prompts/`

**Files to create:**
```
.claude/prompts/
  invoice-analysis.md    # Single invoice analysis
  receipt-analysis.md    # Single receipt analysis
  bulk-analysis.md       # Bulk project analysis
  README.md              # Instructions for using prompts
```

**invoice-analysis.md template:**
```markdown
# Invoice Analysis Prompt

Analyze the invoice document and extract structured data.

## Input
- Document path: {document_path}
- Project context: Read manifest.json in same folder

## Output Format
Return a JSON object matching this schema:
```json
{
  "documentId": "...",
  "confidence": "HIGH|MEDIUM|LOW",
  "lineItems": [
    {
      "description": "...",
      "amount": 0.00,
      "confidence": "HIGH|MEDIUM|LOW"
    }
  ],
  "total": 0.00
}
```

## Rules
1. Extract ALL line items from the invoice
2. Set confidence based on text clarity
3. Include warnings for unclear items
4. Use existing categories from manifest when possible
```

### 6. Review Sheet UI Design

**Side-by-side layout in Sheet:**
- Left: Document preview (image or PDF iframe)
- Right: Extraction table with inline editing

**Table columns:**
| Column | Type | Notes |
|--------|------|-------|
| Description | Editable text | Click to edit |
| Amount | Editable number | Click to edit |
| Category | Dropdown | Auto-filled if high confidence |
| Confidence | Badge | GREEN/YELLOW/RED |

**Confidence badges:**
```typescript
const CONFIDENCE_COLORS = {
  HIGH: 'bg-green-100 text-green-700 border-green-200',
  MEDIUM: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  LOW: 'bg-red-100 text-red-700 border-red-200',
}
```

**Actions:**
- "Preview Changes" - Show what will be created
- "Import Selected" - Create cost entries for selected items
- "Import All" - Create all cost entries
- "Discard" - Close without importing

## Implementation Considerations

### Manifest Auto-Generation

**Trigger points:**
1. After successful document upload (POST /api/projects/[id]/documents)
2. After document category change (PATCH)
3. After document deletion (DELETE)

**Implementation:**
- Create `lib/manifest-utils.ts` with generation logic
- Call from document API routes after successful operations
- Generate asynchronously (don't block upload response)

### Thumbnail Generation for Manifests

**For images (PNG, JPG):**
- Use sharp library to resize to ~200px max dimension
- Convert to base64 for embedding in manifest
- Only include for RECEIPT and INVOICE categories

**For PDFs:**
- Skip thumbnail (too complex without pdf rendering)
- Or use pdf-thumbnail library if needed

### AI Import Workflow

**Flow:**
1. User runs Claude Code command (outside app)
2. AI reads manifest, analyzes documents
3. AI saves results to `UPLOADS_DIR/projects/{id}/ai-results.json`
4. User clicks "Import AI Results" in app
5. App reads `ai-results.json`, shows review sheet
6. User reviews/edits, confirms import
7. App creates Cost entries, updates Document aiStatus

### Bulk Analysis Support

**Dashboard indicator:**
- Count projects with pending documents
- Show ready-to-run Claude Code command
- Example: `claude analyze-documents --dir /path/to/uploads`

### High Confidence Auto-Import

**Threshold:**
- HIGH confidence = auto-select for import
- MEDIUM/LOW = require manual review

**Safety:**
- Never auto-import without showing review first
- Mark imported entries with "AI-imported" flag

## Potential Risks/Unknowns

### Risk 1: PDF Content Extraction
**Issue:** Claude Code can read PDFs, but accuracy varies
**Mitigation:**
- Set conservative confidence levels
- Allow manual override of all fields
- Test with sample documents first

### Risk 2: Category Matching
**Issue:** AI suggested categories may not match existing categories exactly
**Mitigation:**
- Provide category list in manifest
- Use fuzzy matching for suggestions
- Default to empty (user selects) for low confidence

### Risk 3: Large File Handling
**Issue:** Base64 thumbnails can bloat manifest
**Mitigation:**
- Limit thumbnail size (200px max)
- Only include for images, not PDFs
- Make thumbnails optional

### Risk 4: Concurrent Manifest Updates
**Issue:** Multiple uploads could race to update manifest
**Mitigation:**
- Use file locking or queue system
- Regenerate full manifest each time (not incremental)

## Recommended Plan Structure

### Plan 1: Schema & Infrastructure (2-3 tasks)
1. Add Document aiStatus field to schema
2. Create manifest generation utilities
3. Create manifest API routes

### Plan 2: Prompt Templates (2-3 tasks)
1. Create .claude/prompts folder structure
2. Write invoice-analysis.md template
3. Write receipt-analysis.md template
4. Write bulk-analysis.md template

### Plan 3: AI Import API (2-3 tasks)
1. Create AI results import API route
2. Create pending documents API route
3. Add bulk operations support

### Plan 4: Review Sheet UI (4-5 tasks)
1. Create ExtractionReviewSheet component
2. Add document preview pane
3. Add extraction table with inline editing
4. Add confidence badges and category dropdown
5. Add import confirmation flow

### Plan 5: Integration & Polish (2-3 tasks)
1. Add manifest auto-generation on upload
2. Add "Pending Analysis" badge to documents
3. Add dashboard indicator for pending projects
4. Add "AI-imported" badge to cost entries

## Sources

### Primary (HIGH confidence)
- Codebase review: `prisma/schema.prisma` - Document and Cost models
- Codebase review: `src/components/projects/project-detail-sheet.tsx` - Sheet UI pattern
- Codebase review: `src/app/api/projects/[id]/documents/route.ts` - Document API patterns
- Codebase review: `src/app/api/projects/[id]/costs/route.ts` - Cost API patterns
- Codebase review: `src/lib/document-utils.ts` - Document utilities
- Codebase review: `src/lib/cost-utils.ts` - Cost utilities

### Secondary (MEDIUM confidence)
- Context document: Phase 25 CONTEXT.md - User decisions on workflow

## Metadata

**Confidence breakdown:**
- Existing patterns: HIGH - Direct codebase inspection
- Manifest structure: MEDIUM - Designed based on requirements
- UI approach: HIGH - Following established patterns
- Prompt templates: MEDIUM - Based on Claude Code capabilities

**Research date:** 2026-01-24
**Valid until:** 2026-02-24 (30 days - stable domain)

---

## RESEARCH COMPLETE

**Phase:** 25 - AI Document Intelligence
**Confidence:** HIGH

### Key Findings

1. **Document infrastructure exists**: Phase 22 provides complete document upload/storage/serving with categories (RECEIPT, INVOICE, OTHER)
2. **Cost system ready**: Phase 14 has cost categories and API routes ready for new cost creation
3. **Sheet UI pattern established**: ProjectDetailSheet provides exact pattern for review interface
4. **Manifest approach is sound**: Storing manifest.json alongside documents enables Claude Code access
5. **Minimal schema changes needed**: Only need to add aiStatus enum and field to Document model

### File Created

`/Users/khairul/Documents/MyDev/Work/Motionvii/saap2026v2/.planning/phases/25-ai-document-intelligence/25-RESEARCH.md`

### Confidence Assessment

| Area | Level | Reason |
|------|-------|--------|
| Document patterns | HIGH | Direct codebase inspection |
| Cost patterns | HIGH | Direct codebase inspection |
| UI components | HIGH | Existing shadcn components verified |
| Manifest design | MEDIUM | Designed from requirements |
| Prompt templates | MEDIUM | Based on Claude Code capabilities |

### Open Questions

1. **PDF thumbnails**: Should we implement PDF thumbnail generation or skip for simplicity?
2. **Confidence thresholds**: Exact numeric thresholds for HIGH/MEDIUM/LOW need to be decided during implementation
3. **Error handling**: How to handle partially failed AI extractions in bulk mode

### Ready for Planning

Research complete. Planner can now create PLAN.md files.
