# Phase 11: Sales Pipeline - Research

**Researched:** 2026-01-22
**Domain:** Kanban board drag-and-drop, pipeline stage management
**Confidence:** HIGH

## Summary

This phase implements a sales pipeline Kanban board for tracking deals through stages. The codebase already has a mature Kanban implementation for KRIs (Key Result Initiatives) using `@dnd-kit/core` and `@dnd-kit/sortable`. The Deal model already exists in Prisma with all required fields including `stage`, `position`, `lostReason`, and relationships to Company/Contact.

The primary work involves:
1. Creating deal-specific Kanban components (adapting existing patterns)
2. Building deal CRUD API routes (following company/contact patterns)
3. Implementing the "Lost" stage prompt for reason capture
4. Adding pipeline metrics calculations

**Primary recommendation:** Reuse existing Kanban patterns exactly. Copy `kanban-board.tsx`, `kanban-column.tsx`, `kanban-card.tsx` as starting points and adapt for deals. Do not introduce new libraries or patterns.

## Standard Stack

The established libraries/tools for this domain:

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@dnd-kit/core` | `^6.3.1` | Drag-and-drop foundation | Already used for KRI Kanban, modern React DnD library |
| `@dnd-kit/sortable` | `^10.0.0` | Sortable lists within columns | Already used, enables reordering within stages |
| `@dnd-kit/utilities` | `^3.2.2` | CSS Transform utilities | Already used for smooth drag animations |

### Supporting (Already Installed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `cmdk` | `^1.1.1` | Command/combobox for company/contact selection | Used via shadcn Command component |
| `@radix-ui/react-dialog` | `^1.1.15` | Deal create/edit modals | Existing pattern in codebase |
| `@radix-ui/react-alert-dialog` | `^1.1.15` | Lost reason prompt, delete confirmation | Existing pattern |
| `lucide-react` | `^0.562.0` | Icons for stage indicators | Existing pattern |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @dnd-kit | react-beautiful-dnd | Deprecated, doesn't work with React 18 strict mode |
| @dnd-kit | react-dnd | More complex API, no built-in sortable |
| Custom stage selector | react-select | Unnecessary - shadcn Command already perfect |

**Installation:**
```bash
# No new packages needed - all dependencies already installed
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   ├── (dashboard)/
│   │   └── pipeline/
│   │       └── page.tsx              # Server component, fetches deals
│   └── api/
│       └── deals/
│           ├── route.ts              # GET (list), POST (create)
│           ├── reorder/
│           │   └── route.ts          # PATCH (batch position/stage update)
│           └── [id]/
│               └── route.ts          # GET, PATCH, DELETE (single deal)
├── components/
│   └── pipeline/
│       ├── pipeline-board.tsx        # Main board with DndContext
│       ├── pipeline-column.tsx       # Droppable stage column
│       ├── pipeline-card.tsx         # Draggable deal card
│       ├── deal-create-modal.tsx     # Create deal form
│       ├── deal-detail-sheet.tsx     # View/edit deal details
│       ├── lost-reason-dialog.tsx    # Prompt when moving to Lost
│       ├── company-select.tsx        # Company selection combobox
│       ├── contact-select.tsx        # Contact selection (filtered by company)
│       └── pipeline-metrics.tsx      # Stage value/count summary
└── lib/
    └── pipeline-utils.ts             # Stage colors, transitions, calculations
```

### Pattern 1: DndContext with Stage-Based Columns
**What:** Wrap Kanban board in DndContext, each stage is a droppable column, each deal is a sortable item
**When to use:** Always for the pipeline board
**Example:**
```typescript
// Adapted from src/components/kanban/kanban-board.tsx
const STAGES = [
  { id: 'LEAD', title: 'Lead', colorDot: 'bg-gray-400' },
  { id: 'QUALIFIED', title: 'Qualified', colorDot: 'bg-blue-400' },
  { id: 'PROPOSAL', title: 'Proposal', colorDot: 'bg-purple-400' },
  { id: 'NEGOTIATION', title: 'Negotiation', colorDot: 'bg-amber-400' },
  { id: 'WON', title: 'Won', colorDot: 'bg-green-500' },
  { id: 'LOST', title: 'Lost', colorDot: 'bg-red-400' },
]

// DndContext handles drag events, SortableContext enables reordering
<DndContext
  sensors={sensors}
  collisionDetection={collisionDetection}
  onDragStart={handleDragStart}
  onDragOver={handleDragOver}
  onDragEnd={handleDragEnd}
>
  {STAGES.map(stage => (
    <PipelineColumn key={stage.id} stage={stage}>
      <SortableContext items={getDealsForStage(stage.id)}>
        {deals.filter(d => d.stage === stage.id).map(deal => (
          <PipelineCard key={deal.id} deal={deal} />
        ))}
      </SortableContext>
    </PipelineColumn>
  ))}
</DndContext>
```

### Pattern 2: Optimistic Updates with Rollback
**What:** Update UI immediately on drag, persist to API, rollback on failure
**When to use:** All stage changes and reordering
**Example:**
```typescript
// From existing kanban-board.tsx pattern
const handleDragEnd = async (event: DragEndEvent) => {
  const { active, over } = event
  setActiveId(null)

  if (!over) return

  // Calculate new positions
  const updates = calculateNewPositions(deals, active.id, over.id)

  // Optimistic update - immediate UI feedback
  setDeals(prev => applyUpdates(prev, updates))

  // Persist to API
  try {
    const response = await fetch('/api/deals/reorder', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updates }),
    })

    if (!response.ok) {
      // Rollback on failure
      setDeals(originalDeals)
      toast.error('Failed to save changes')
    }
  } catch {
    setDeals(originalDeals)
    toast.error('Failed to save changes')
  }
}
```

### Pattern 3: Lost Reason Interception
**What:** When deal moves to LOST stage, intercept the drag and show dialog before completing
**When to use:** Only for transitions TO the Lost stage
**Example:**
```typescript
const [pendingLostDeal, setPendingLostDeal] = useState<string | null>(null)

const handleDragEnd = async (event: DragEndEvent) => {
  const targetStage = getTargetStage(event)

  // Intercept Lost stage transition
  if (targetStage === 'LOST') {
    setPendingLostDeal(event.active.id)
    // Don't complete the move yet - wait for reason
    return
  }

  // Normal stage transition
  await completeDragEnd(event)
}

// In render:
<LostReasonDialog
  open={!!pendingLostDeal}
  onConfirm={async (reason) => {
    await updateDealStage(pendingLostDeal, 'LOST', reason)
    setPendingLostDeal(null)
  }}
  onCancel={() => {
    setPendingLostDeal(null)
    // Optionally revert the visual position
  }}
/>
```

### Pattern 4: Company-Contact Cascading Selection
**What:** When company is selected, filter contacts to show only that company's contacts
**When to use:** Deal create/edit forms
**Example:**
```typescript
const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null)
const [contacts, setContacts] = useState<Contact[]>([])

// Fetch contacts when company changes
useEffect(() => {
  if (selectedCompanyId) {
    fetch(`/api/companies/${selectedCompanyId}`)
      .then(res => res.json())
      .then(data => setContacts(data.contacts))
  } else {
    setContacts([])
  }
}, [selectedCompanyId])

// In form:
<CompanySelect
  value={selectedCompanyId}
  onValueChange={(id) => {
    setSelectedCompanyId(id)
    setSelectedContactId(null) // Clear contact when company changes
  }}
/>
<ContactSelect
  value={selectedContactId}
  onValueChange={setSelectedContactId}
  contacts={contacts}
  disabled={!selectedCompanyId}
/>
```

### Anti-Patterns to Avoid
- **Creating new Kanban implementation from scratch:** Copy and adapt existing components
- **Using useState for server data:** Use optimistic updates pattern, not full client state
- **Fetching contacts separately from company:** The company API already includes contacts
- **Building custom dropdowns:** Use shadcn Command component (already used for IndustryCombobox)
- **Multiple API calls for stage change:** Batch updates in single /reorder endpoint

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Drag-and-drop | Custom mouse event handlers | @dnd-kit with existing patterns | Touch support, keyboard accessibility, edge cases |
| Combobox search | Input with filtered list | shadcn Command component | Already used in IndustryCombobox, handles focus, keyboard |
| Batch updates | Individual PATCH calls | Transaction-based /reorder endpoint | Race conditions, partial failure handling |
| Currency display | Template literals | Intl.NumberFormat | Locale-aware, handles edge cases |
| Stage colors | Inline styles | lib/pipeline-utils.ts constants | Consistency, single source of truth |

**Key insight:** The existing Kanban implementation handles complex edge cases (collision detection, keyboard navigation, touch devices). Adapting it is faster and safer than building from scratch.

## Common Pitfalls

### Pitfall 1: Not Intercepting Lost Stage Transition
**What goes wrong:** Deal moves to Lost without capturing reason, losing valuable data
**Why it happens:** Simple drag handler completes all transitions the same way
**How to avoid:** Check target stage in handleDragEnd, show dialog before completing
**Warning signs:** Lost deals have null lostReason

### Pitfall 2: Stale Contacts After Company Change
**What goes wrong:** User selects Company A, selects Contact from A, changes to Company B, contact still shows from A
**Why it happens:** Contact selection not cleared when company changes
**How to avoid:** Clear contactId when companyId changes, re-fetch contacts
**Warning signs:** Deals linked to contacts that don't belong to the selected company

### Pitfall 3: Position Conflicts on Rapid Drag
**What goes wrong:** Two quick drags result in same position number for multiple deals
**Why it happens:** Second drag uses stale position data
**How to avoid:** Use transaction in /reorder API, recalculate positions from current state
**Warning signs:** Deals appearing in wrong order after refresh

### Pitfall 4: Lost Stage Changes Without Reason Update
**What goes wrong:** Deal already in Lost stage has reason updated but stageChangedAt doesn't reflect it
**Why it happens:** Only updating lostReason field, not tracking when
**How to avoid:** Update stageChangedAt whenever stage or lostReason changes
**Warning signs:** Incorrect "time in stage" calculations

### Pitfall 5: Currency Calculation Precision
**What goes wrong:** Pipeline total shows RM 100,000.00000001
**Why it happens:** JavaScript floating point in aggregation
**How to avoid:** Use Prisma Decimal type, format only at display time
**Warning signs:** Extra decimal places in totals, sums not matching

## Code Examples

Verified patterns from existing codebase:

### API Route Pattern (from companies)
```typescript
// src/app/api/deals/route.ts
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth, requireEditor } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  const { error } = await requireAuth()
  if (error) return error

  const deals = await prisma.deal.findMany({
    orderBy: [
      { stage: 'asc' },
      { position: 'asc' },
    ],
    include: {
      company: { select: { id: true, name: true } },
      contact: { select: { id: true, name: true } },
    },
  })

  return NextResponse.json(deals)
}

export async function POST(request: NextRequest) {
  const { error } = await requireEditor()
  if (error) return error

  const body = await request.json()

  // Validate required fields
  if (!body.title?.trim()) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  }
  if (!body.companyId) {
    return NextResponse.json({ error: 'Company is required' }, { status: 400 })
  }

  // Get max position for LEAD stage
  const maxPosition = await prisma.deal.aggregate({
    where: { stage: 'LEAD' },
    _max: { position: true },
  })

  const deal = await prisma.deal.create({
    data: {
      title: body.title.trim(),
      description: body.description || null,
      value: body.value || null,
      companyId: body.companyId,
      contactId: body.contactId || null,
      stage: 'LEAD',
      position: (maxPosition._max.position ?? -1) + 1,
    },
    include: {
      company: { select: { id: true, name: true } },
      contact: { select: { id: true, name: true } },
    },
  })

  return NextResponse.json(deal, { status: 201 })
}
```

### Reorder Endpoint Pattern (from initiatives)
```typescript
// src/app/api/deals/reorder/route.ts
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { DealStage } from '@prisma/client'
import { requireEditor } from '@/lib/auth-utils'

export async function PATCH(request: NextRequest) {
  const { error } = await requireEditor()
  if (error) return error

  const { updates } = await request.json()

  if (!Array.isArray(updates)) {
    return NextResponse.json({ error: 'Updates must be an array' }, { status: 400 })
  }

  // Use transaction for batch update
  await prisma.$transaction(
    updates.map((update: { id: string; position: number; stage?: string; lostReason?: string }) =>
      prisma.deal.update({
        where: { id: update.id },
        data: {
          position: update.position,
          ...(update.stage && {
            stage: update.stage as DealStage,
            stageChangedAt: new Date(),
          }),
          ...(update.lostReason !== undefined && { lostReason: update.lostReason }),
        },
      })
    )
  )

  return NextResponse.json({ success: true })
}
```

### Pipeline Card Pattern (adapted from kanban-card)
```typescript
// src/components/pipeline/pipeline-card.tsx
'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn, formatCurrency } from '@/lib/utils'
import { Building2, User } from 'lucide-react'

interface Deal {
  id: string
  title: string
  value: string | null  // Decimal as string from Prisma
  company: { name: string }
  contact: { name: string } | null
}

export function PipelineCard({ deal, onClick }: { deal: Deal; onClick?: () => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: deal.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={cn(
        'bg-white rounded-xl p-4 shadow-sm border cursor-grab',
        'hover:shadow-md transition-shadow',
        isDragging && 'opacity-50 shadow-lg'
      )}
    >
      <h4 className="font-medium text-gray-900 line-clamp-2">{deal.title}</h4>

      {deal.value && (
        <p className="text-sm font-semibold text-green-600 mt-1">
          {formatCurrency(deal.value)}
        </p>
      )}

      <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <Building2 className="h-3 w-3" />
          {deal.company.name}
        </span>
        {deal.contact && (
          <span className="flex items-center gap-1">
            <User className="h-3 w-3" />
            {deal.contact.name}
          </span>
        )}
      </div>
    </div>
  )
}
```

### Pipeline Metrics Calculation
```typescript
// src/lib/pipeline-utils.ts
import { DealStage } from '@prisma/client'
import prisma from '@/lib/prisma'

export const STAGE_ORDER: DealStage[] = [
  'LEAD', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'
]

export const STAGE_COLORS: Record<DealStage, string> = {
  LEAD: 'bg-gray-400',
  QUALIFIED: 'bg-blue-400',
  PROPOSAL: 'bg-purple-400',
  NEGOTIATION: 'bg-amber-400',
  WON: 'bg-green-500',
  LOST: 'bg-red-400',
}

export async function getPipelineMetrics() {
  const metrics = await prisma.deal.groupBy({
    by: ['stage'],
    _count: { id: true },
    _sum: { value: true },
  })

  return STAGE_ORDER.map(stage => {
    const data = metrics.find(m => m.stage === stage)
    return {
      stage,
      count: data?._count.id ?? 0,
      value: data?._sum.value?.toNumber() ?? 0,
    }
  })
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| react-beautiful-dnd | @dnd-kit | 2022 | rbd deprecated, dnd-kit is active |
| Separate API calls per card | Batch reorder endpoint | Existing pattern | Better performance, atomicity |
| Inline stage dropdown | Drag-and-drop Kanban | Existing pattern | Better UX, visual pipeline |

**Deprecated/outdated:**
- react-beautiful-dnd: Deprecated, doesn't support React 18 strict mode
- Manual drag handlers: @dnd-kit handles touch, keyboard, accessibility

## Open Questions

Things that couldn't be fully resolved:

1. **Terminal Stage Behavior (Won/Lost)**
   - What we know: PIPE-06 (auto-create project on Won) is deferred to Phase 13
   - What's unclear: Should Won/Lost stages allow editing? Can deals move OUT of Won/Lost?
   - Recommendation: For Phase 11, treat Won/Lost as terminal - no dragging out. Phase 13 will handle Won->Project conversion.

2. **Stage Change from Edit Modal**
   - What we know: Edit modal needs to support stage changes
   - What's unclear: Should it also trigger Lost reason prompt?
   - Recommendation: Yes - any path to Lost stage should prompt for reason

## Sources

### Primary (HIGH confidence)
- Existing codebase: `src/components/kanban/kanban-board.tsx` - verified working implementation
- Existing codebase: `src/app/api/initiatives/reorder/route.ts` - batch update pattern
- Existing codebase: `src/components/companies/industry-combobox.tsx` - Command component usage
- Prisma schema: `prisma/schema.prisma` - Deal model with all required fields

### Secondary (MEDIUM confidence)
- `.planning/research/STACK.md` - Prior research on dnd-kit for this project
- `.planning/research/PITFALLS.md` - Pipeline-specific pitfalls documented

### Tertiary (LOW confidence)
- None - all patterns verified against existing codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries already installed and used in codebase
- Architecture: HIGH - adapting existing patterns, not creating new
- Pitfalls: HIGH - documented from both prior research and codebase analysis

**Research date:** 2026-01-22
**Valid until:** Indefinite - patterns stable, all based on existing codebase
