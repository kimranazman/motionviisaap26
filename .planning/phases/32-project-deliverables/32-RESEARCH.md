# Phase 32: Project Deliverables - Research

**Researched:** 2026-01-25
**Domain:** Project deliverables management with AI extraction
**Confidence:** HIGH

## Summary

This phase implements project deliverables (scope items from quotes) with CRUD operations and AI extraction from Talenta/Motionvii invoices/quotes. The Deliverable model already exists in the schema (added in Phase 29), so this phase focuses on API routes, UI components, and extending the AI extraction system.

The codebase has excellent patterns to follow: Cost management provides the exact CRUD and UI patterns, AI document intelligence (Phase 25) provides the extraction and review workflow, and the ProjectDetailSheet demonstrates section layout for deliverables.

**Primary recommendation:** Build deliverables following the Cost pattern exactly - API routes, form component, card component, and section in ProjectDetailSheet. For AI extraction, extend the existing invoice-analysis prompt to extract line items as deliverables, and add a new import endpoint for deliverables.

## Standard Stack

### Core (Already in Codebase)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Prisma | 6.19.2 | ORM for Deliverable model | Already defined in schema |
| React Hook Form | Latest | Form handling | Used in CostForm pattern |
| Zod | Latest | Validation | Standard in codebase |
| shadcn/ui | Latest | UI components | Sheet, Card, Input, Button available |
| Sonner | Latest | Toast notifications | Standard in codebase |

### No Additional Libraries Needed

This phase uses existing infrastructure only:
- AI extraction: Uses existing Claude Code workflow with prompts
- File handling: Uses existing manifest-utils.ts
- Import flow: Extends existing AI review patterns

## Architecture Patterns

### Recommended File Structure

```
src/
  app/api/projects/[id]/deliverables/
    route.ts                    # GET (list), POST (create)
    [deliverableId]/route.ts    # PATCH, DELETE
  app/api/ai/import/deliverable/
    route.ts                    # POST - import AI-extracted deliverables
  components/projects/
    deliverable-form.tsx        # Add/edit form (parallel to cost-form.tsx)
    deliverable-card.tsx        # Display card (parallel to cost-card.tsx)
    deliverables-section.tsx    # Section container for ProjectDetailSheet
  types/
    ai-extraction.ts            # Extend with DeliverableExtraction type
```

### Pattern 1: Deliverables API (Follow Cost Pattern)

**What:** REST API for deliverables CRUD
**When to use:** All deliverable operations
**Example from existing Cost API:**

```typescript
// Source: src/app/api/projects/[id]/costs/route.ts
// GET /api/projects/[id]/deliverables - List deliverables for project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth()
  if (error) return error

  try {
    const { id } = await params

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    const deliverables = await prisma.deliverable.findMany({
      where: { projectId: id },
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'desc' },
      ],
    })

    // Convert Decimal values to Number
    return NextResponse.json(deliverables.map(d => ({
      ...d,
      value: d.value ? Number(d.value) : null,
    })))
  } catch (error) {
    console.error('Error fetching deliverables:', error)
    return NextResponse.json(
      { error: 'Failed to fetch deliverables' },
      { status: 500 }
    )
  }
}
```

### Pattern 2: DeliverableCard Component (Follow CostCard)

**What:** Display card for a single deliverable with edit/delete actions
**When to use:** In deliverables list on project detail
**Example from existing CostCard:**

```typescript
// Source: src/components/projects/cost-card.tsx pattern
interface Deliverable {
  id: string
  title: string
  description: string | null
  value: number | null
  sortOrder: number
  aiExtracted?: boolean
}

interface DeliverableCardProps {
  deliverable: Deliverable
  projectId: string
  onEdit: (deliverable: Deliverable) => void
  onDelete: () => void
}

export function DeliverableCard({ deliverable, projectId, onEdit, onDelete }: DeliverableCardProps) {
  // Follow CostCard patterns:
  // - Display title, value, optional AI badge
  // - Edit and Delete buttons with icons
  // - AlertDialog for delete confirmation
  // - API call on delete
}
```

### Pattern 3: AI Extraction Extension

**What:** Extend invoice analysis to extract deliverables (our quotes/invoices)
**When to use:** When user uploads Talenta/Motionvii quote/invoice

**Existing AI Results Structure:**
```typescript
// Source: src/types/ai-extraction.ts
export interface AIAnalysisResult {
  version: '1.0'
  analyzedAt: string
  projectId: string
  invoices: InvoiceExtraction[]
  receipts: ReceiptExtraction[]
  errors?: { documentId: string; error: string }[]
}
```

**Add to type (new):**
```typescript
// Deliverable extraction from our invoices/quotes
export interface DeliverableExtraction {
  documentId: string
  confidence: ConfidenceLevel
  deliverables: {
    title: string
    description?: string
    value: number
    confidence: ConfidenceLevel
  }[]
  documentTotal: number
  notes?: string
  warnings?: string[]
}

// Extend AIAnalysisResult
export interface AIAnalysisResult {
  // ... existing fields
  deliverables?: DeliverableExtraction[]  // Optional for backward compatibility
}
```

### Pattern 4: Prompt Template for Deliverables

**What:** Claude Code prompt for extracting deliverables from our quotes
**When to use:** Analyzing Talenta/Motionvii invoices/quotes

```markdown
# Deliverable Extraction Prompt

Analyze Talenta or Motionvii quotes/invoices to extract project scope items (deliverables).

## Document Identification

**Talenta/Motionvii indicators:**
- Header contains "Talenta" or "Motionvii"
- "QUOTATION" or "INVOICE" at top
- Our company details in header/letterhead
- Client name as recipient

If document is NOT from Talenta/Motionvii:
- Skip deliverable extraction
- Log: "Not a Talenta/Motionvii document - skipping deliverable extraction"

## Extraction Rules

1. Extract each line item as a deliverable
2. Title = item description (service name)
3. Description = additional details if present
4. Value = line item amount (without tax)
5. Ignore administrative items (Bank charges, SST, etc.)

## Output Format

{
  "documentId": "string",
  "confidence": "HIGH|MEDIUM|LOW",
  "deliverables": [
    {
      "title": "Event Production Services",
      "description": "Full production for annual dinner",
      "value": 25000.00,
      "confidence": "HIGH"
    }
  ],
  "documentTotal": 27500.00,
  "notes": "Standard Talenta quotation format",
  "warnings": []
}
```

### Anti-Patterns to Avoid

- **DON'T create separate deliverables page:** Deliverables belong in ProjectDetailSheet section
- **DON'T import both as revenue AND deliverables:** Invoice total sets revenue, line items become deliverables
- **DON'T auto-import deliverables:** Always require user review (scope items need verification)
- **DON'T duplicate Cost patterns for persistence:** Deliverables are simpler (no category, no date)

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Deliverable CRUD | Custom patterns | Copy Cost API/UI exactly | Proven patterns, consistency |
| AI extraction | New prompt system | Extend existing prompts | Unified AI workflow |
| Review UI | Custom dialog | AIReviewSheet pattern | User already familiar |
| Form validation | Manual checks | Zod + React Hook Form | Type-safe, consistent |

## Common Pitfalls

### Pitfall 1: Revenue vs Deliverable Value Confusion

**What goes wrong:** Total of deliverable values doesn't match invoice total (revenue)
**Why it happens:** Some invoices have discounts, taxes, or adjustments
**How to avoid:**
- Deliverable values are individual scope items
- Invoice total (revenue) may differ from sum of deliverables
- Don't try to reconcile; they serve different purposes
**Warning signs:** User questions why deliverables don't sum to revenue

### Pitfall 2: Mixing Quote Types

**What goes wrong:** Trying to extract deliverables from supplier invoices
**Why it happens:** All invoices look similar
**How to avoid:**
- Only extract deliverables from OUR quotes/invoices (Talenta/Motionvii)
- Supplier invoices should become costs, not deliverables
- Add clear prompt instructions to identify document source
**Warning signs:** Deliverables that look like cost items (materials, supplies)

### Pitfall 3: AI Status Collision

**What goes wrong:** Document marked IMPORTED but only revenue imported, not deliverables
**Why it happens:** Single aiStatus field, two import actions possible
**How to avoid:**
- Track deliverable import separately (new field or boolean)
- Or combine into single import action (revenue + deliverables together)
- Recommendation: Single import - extract deliverables when importing invoice
**Warning signs:** User imports same document twice

### Pitfall 4: Missing sortOrder on Create

**What goes wrong:** Deliverables display in random order
**Why it happens:** Forgetting to set sortOrder on create
**How to avoid:**
- On create: `sortOrder = (max existing + 1)`
- Or default to 0 and sort by createdAt as fallback
**Warning signs:** Newly created deliverables appear in unexpected positions

## Code Examples

### Deliverable API Routes

```typescript
// Source: Following src/app/api/projects/[id]/costs/route.ts pattern

// POST /api/projects/[id]/deliverables - Create deliverable
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireEditor()
  if (error) return error

  try {
    const { id } = await params
    const body = await request.json()

    // Validate required fields
    if (!body.title?.trim()) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Get next sortOrder
    const maxSortOrder = await prisma.deliverable.aggregate({
      where: { projectId: id },
      _max: { sortOrder: true },
    })
    const nextSortOrder = (maxSortOrder._max.sortOrder ?? -1) + 1

    const deliverable = await prisma.deliverable.create({
      data: {
        projectId: id,
        title: body.title.trim(),
        description: body.description?.trim() || null,
        value: body.value ? parseFloat(body.value) : null,
        sortOrder: nextSortOrder,
        aiExtracted: body.aiExtracted ?? false,
      },
    })

    return NextResponse.json({
      ...deliverable,
      value: deliverable.value ? Number(deliverable.value) : null,
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating deliverable:', error)
    return NextResponse.json(
      { error: 'Failed to create deliverable' },
      { status: 500 }
    )
  }
}
```

### Deliverable Form Component

```typescript
// Source: Following src/components/projects/cost-form.tsx pattern

interface DeliverableFormProps {
  projectId: string
  deliverable?: Deliverable
  onSuccess: () => void
  onCancel: () => void
}

export function DeliverableForm({
  projectId,
  deliverable,
  onSuccess,
  onCancel,
}: DeliverableFormProps) {
  const [title, setTitle] = useState(deliverable?.title || '')
  const [description, setDescription] = useState(deliverable?.description || '')
  const [value, setValue] = useState(deliverable?.value?.toString() || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Follow CostForm validation and submission pattern
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg bg-gray-50">
      {/* Title input (required) */}
      {/* Description textarea (optional) */}
      {/* Value input (optional) */}
      {/* Actions: Cancel, Save */}
    </form>
  )
}
```

### Deliverables Section in ProjectDetailSheet

```typescript
// Source: Following DocumentsSection and Costs section patterns

interface DeliverablesSectionProps {
  projectId: string
  deliverables: Deliverable[]
  onDeliverablesChange: () => void
}

export function DeliverablesSection({
  projectId,
  deliverables,
  onDeliverablesChange,
}: DeliverablesSectionProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingDeliverable, setEditingDeliverable] = useState<Deliverable | null>(null)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Label className="text-muted-foreground">Deliverables</Label>
          {deliverables.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {deliverables.length}
            </Badge>
          )}
        </div>
        {deliverables.length > 0 && !showAddForm && (
          <Button variant="ghost" size="sm" onClick={() => setShowAddForm(true)}>
            <Plus className="mr-1 h-4 w-4" />
            Add Deliverable
          </Button>
        )}
      </div>

      {/* Form */}
      {showAddForm && (
        <DeliverableForm
          projectId={projectId}
          deliverable={editingDeliverable || undefined}
          onSuccess={() => {
            onDeliverablesChange()
            setShowAddForm(false)
            setEditingDeliverable(null)
          }}
          onCancel={() => {
            setShowAddForm(false)
            setEditingDeliverable(null)
          }}
        />
      )}

      {/* Empty state or list */}
      {deliverables.length === 0 && !showAddForm ? (
        <Card className="p-6 text-center border-dashed">
          <Package className="mx-auto h-8 w-8 text-gray-400 mb-2" />
          <p className="text-sm text-gray-500 mb-3">No deliverables defined</p>
          <Button variant="outline" size="sm" onClick={() => setShowAddForm(true)}>
            <Plus className="mr-1 h-4 w-4" />
            Add deliverable
          </Button>
        </Card>
      ) : (
        <div className="space-y-2">
          {deliverables.map((d) => (
            <DeliverableCard
              key={d.id}
              deliverable={d}
              projectId={projectId}
              onEdit={setEditingDeliverable}
              onDelete={onDeliverablesChange}
            />
          ))}
        </div>
      )}
    </div>
  )
}
```

### AI Import Endpoint for Deliverables

```typescript
// Source: Following src/app/api/ai/import/invoice/route.ts pattern

// POST /api/ai/import/deliverable - Import AI-extracted deliverables
export async function POST(request: NextRequest) {
  const { error } = await requireEditor()
  if (error) return error

  try {
    const body = await request.json()
    const { projectId, extraction, documentId } = body

    // Validate inputs
    if (!projectId || !extraction?.deliverables) {
      return NextResponse.json(
        { error: 'projectId and extraction.deliverables are required' },
        { status: 400 }
      )
    }

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Get current max sortOrder
    const maxSortOrder = await prisma.deliverable.aggregate({
      where: { projectId },
      _max: { sortOrder: true },
    })
    let nextSortOrder = (maxSortOrder._max.sortOrder ?? -1) + 1

    // Create deliverables in transaction
    const created = await prisma.$transaction(
      extraction.deliverables.map((d: { title: string; description?: string; value: number }) =>
        prisma.deliverable.create({
          data: {
            projectId,
            title: d.title,
            description: d.description || null,
            value: d.value,
            sortOrder: nextSortOrder++,
            aiExtracted: true,
          },
        })
      )
    )

    // Update document status if documentId provided
    if (documentId) {
      await prisma.document.update({
        where: { id: documentId },
        data: {
          aiStatus: 'IMPORTED',
          aiAnalyzedAt: new Date(),
        },
      })
    }

    return NextResponse.json({
      success: true,
      createdCount: created.length,
      deliverables: created.map(d => ({
        ...d,
        value: d.value ? Number(d.value) : null,
      })),
    })
  } catch (error) {
    console.error('Error importing deliverables:', error)
    return NextResponse.json(
      { error: 'Failed to import deliverables' },
      { status: 500 }
    )
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual scope tracking | Database deliverables model | Phase 29 | Already using current approach |
| No AI extraction | Claude Code prompts | Phase 25 | Extend for deliverables |

**Deprecated/outdated:**
- None - Phase 29 schema is current

## Open Questions

1. **Combined Import vs Separate Import**
   - What we know: Invoice import sets revenue, deliverables are separate
   - What's unclear: Import both in one action or separately?
   - Recommendation: Separate actions - invoice import for revenue, then deliverable import for scope items. Allows user to selectively import.

2. **Deliverable-Specific AI Review UI**
   - What we know: AIReviewSheet exists for invoices/receipts
   - What's unclear: Create new sheet or extend existing?
   - Recommendation: Create DeliverableReviewSheet following same pattern - simpler than extending existing component

3. **Quote vs Invoice Distinction**
   - What we know: DELV-05 mentions "invoices/quotes"
   - What's unclear: Are these handled differently?
   - Recommendation: Treat same - both have line items that become deliverables. Prompt should handle either format.

## Sources

### Primary (HIGH confidence)
- `/prisma/schema.prisma` - Deliverable model already defined
- `/src/app/api/projects/[id]/costs/route.ts` - CRUD API pattern
- `/src/components/projects/cost-form.tsx` - Form component pattern
- `/src/components/projects/cost-card.tsx` - Card component pattern
- `/src/components/projects/project-detail-sheet.tsx` - Section integration pattern
- `/src/types/ai-extraction.ts` - AI extraction type structure
- `/src/app/api/ai/import/invoice/route.ts` - AI import endpoint pattern
- `/src/components/ai/ai-review-sheet.tsx` - Review UI pattern

### Secondary (MEDIUM confidence)
- Phase 25 research - AI document intelligence workflow
- Phase 29 research - Schema design decisions

### Tertiary (LOW confidence)
- None - all findings verified with codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in codebase
- Architecture: HIGH - Direct parallel to existing patterns
- AI extraction: MEDIUM - Extension of existing system
- Pitfalls: HIGH - Based on existing cost/document patterns

**Research date:** 2026-01-25
**Valid until:** 2026-02-25 (30 days - stable domain)

---

## RESEARCH COMPLETE

**Phase:** 32 - Project Deliverables
**Confidence:** HIGH

### Key Findings

1. **Deliverable model exists:** Schema already has Deliverable model from Phase 29 with title, description, value, sortOrder, aiExtracted fields
2. **Cost pattern provides template:** Deliverable CRUD mirrors Cost pattern exactly - API routes, form, card, section
3. **AI extraction extends existing:** Add DeliverableExtraction type, create new prompt, add import endpoint
4. **UI follows established patterns:** DeliverablesSection in ProjectDetailSheet, following Costs section pattern
5. **Document source matters:** Only extract deliverables from OUR quotes/invoices (Talenta/Motionvii)

### File Created

`/Users/khairul/Documents/MyDev/Work/Motionvii/saap2026v2/.planning/phases/32-project-deliverables/32-RESEARCH.md`

### Confidence Assessment

| Area | Level | Reason |
|------|-------|--------|
| Standard Stack | HIGH | All libraries already in codebase |
| Architecture | HIGH | Parallel to Cost pattern |
| API Design | HIGH | Direct copy of Cost routes |
| AI Extraction | MEDIUM | Extension of existing system |
| UI Components | HIGH | Follows CostForm/CostCard patterns |

### Open Questions

1. Combined vs separate import (recommendation: separate)
2. AI review sheet approach (recommendation: new DeliverableReviewSheet)
3. Quote vs invoice handling (recommendation: treat same)

### Ready for Planning

Research complete. Planner can now create PLAN.md files.
