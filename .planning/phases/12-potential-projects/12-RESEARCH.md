# Phase 12: Potential Projects - Research

**Researched:** 2026-01-22
**Domain:** Kanban board for tracking repeat client opportunities (PotentialProject entity)
**Confidence:** HIGH

## Summary

Phase 12 implements a Potential Projects Kanban board for tracking repeat client opportunities. This is intentionally similar to the Sales Pipeline (Phase 11) which tracks deals through 6 stages. The key difference is that PotentialProject has only 3 stages (POTENTIAL, CONFIRMED, CANCELLED) compared to Deal's 6 stages (LEAD through WON/LOST).

The existing Phase 11 implementation provides a complete, working template to adapt. All required libraries (@dnd-kit/core, @dnd-kit/sortable, shadcn components) are already installed and patterns are proven. The PotentialProject Prisma model already exists with all required fields: title, description, estimatedValue, stage, company, contact, position.

**Key difference from Phase 11:** No "lost reason" interception needed - the CANCELLED stage doesn't require capturing a reason like the Deal's LOST stage. This simplifies the implementation.

**Primary recommendation:** Copy Phase 11 components exactly (pipeline-board, pipeline-column, pipeline-card, deal-form-modal, deal-detail-sheet) and adapt for PotentialProject. Rename files to potential-* prefix, update stage configuration, and remove lost reason logic.

## Standard Stack

The established libraries/tools for this domain:

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@dnd-kit/core` | `^6.3.1` | Drag-and-drop foundation | Already used in Phase 11 Pipeline and existing Kanban |
| `@dnd-kit/sortable` | `^10.0.0` | Sortable lists within columns | Already used, enables reordering within stages |
| `@dnd-kit/utilities` | `^3.2.2` | CSS Transform utilities | Already used for smooth drag animations |

### Supporting (Already Installed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `cmdk` | `^1.1.1` | Command/combobox for company/contact selection | Reuse existing CompanySelect, ContactSelect |
| `@radix-ui/react-dialog` | `^1.1.15` | Create/edit modals | Follow deal-form-modal pattern |
| `@radix-ui/react-sheet` | via shadcn | Detail slide-out panel | Follow deal-detail-sheet pattern |
| `@radix-ui/react-alert-dialog` | `^1.1.15` | Delete confirmation | Follow existing pattern |
| `lucide-react` | `^0.562.0` | Icons (Building2, User, Plus, Trash2) | Existing pattern |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Copy pipeline components | Build from scratch | Unnecessary - Phase 11 provides perfect template |
| New Kanban implementation | Reuse generic kanban | Pipeline-specific (stage colors, metrics) is cleaner |

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
│   │   └── potential-projects/
│   │       └── page.tsx                      # Server component, fetches potential projects
│   └── api/
│       └── potential-projects/
│           ├── route.ts                      # GET (list), POST (create)
│           ├── reorder/
│           │   └── route.ts                  # PATCH (batch position/stage update)
│           └── [id]/
│               └── route.ts                  # GET, PATCH, DELETE (single)
├── components/
│   └── potential-projects/
│       ├── potential-board.tsx               # Main board with DndContext (adapt from pipeline-board)
│       ├── potential-column.tsx              # Droppable stage column (adapt from pipeline-column)
│       ├── potential-card.tsx                # Draggable card (adapt from pipeline-card)
│       ├── potential-form-modal.tsx          # Create potential project form
│       ├── potential-detail-sheet.tsx        # View/edit details
│       └── potential-metrics.tsx             # Stage value/count summary (optional, simpler than pipeline)
└── lib/
    └── potential-utils.ts                    # Stage colors, transitions (3 stages vs 6)
```

### Pattern 1: 3-Stage Configuration (vs 6-Stage Pipeline)
**What:** PotentialProject has only 3 stages: POTENTIAL, CONFIRMED, CANCELLED
**When to use:** Always for potential projects board
**Example:**
```typescript
// src/lib/potential-utils.ts
export const POTENTIAL_STAGES = [
  { id: 'POTENTIAL', title: 'Potential', colorDot: 'bg-blue-400' },
  { id: 'CONFIRMED', title: 'Confirmed', colorDot: 'bg-green-500' },
  { id: 'CANCELLED', title: 'Cancelled', colorDot: 'bg-gray-400' },
] as const

export type PotentialStageId = (typeof POTENTIAL_STAGES)[number]['id']

export function formatPotentialStage(stage: string): string {
  const stageMap: Record<string, string> = {
    POTENTIAL: 'Potential',
    CONFIRMED: 'Confirmed',
    CANCELLED: 'Cancelled',
  }
  return stageMap[stage] || stage
}

export function getPotentialStageColor(stage: string): string {
  const colors: Record<string, string> = {
    POTENTIAL: 'bg-blue-100 text-blue-700',
    CONFIRMED: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-gray-100 text-gray-700',
  }
  return colors[stage] || 'bg-gray-100 text-gray-700'
}
```

### Pattern 2: Reuse CompanySelect and ContactSelect
**What:** The existing pipeline components for company/contact selection work identically
**When to use:** In potential-form-modal and potential-detail-sheet
**Example:**
```typescript
// Import from existing pipeline components - they're generic enough to reuse
import { CompanySelect } from '@/components/pipeline/company-select'
import { ContactSelect } from '@/components/pipeline/contact-select'

// OR copy them to potential-projects folder if you want isolation
```

### Pattern 3: Simplified Drag (No Stage Interception)
**What:** Unlike deals where Lost stage prompts for reason, potential projects don't need interception
**When to use:** Always - simplifies handleDragEnd considerably
**Example:**
```typescript
// potential-board.tsx - simpler than pipeline-board.tsx
const handleDragEnd = async (event: DragEndEvent) => {
  const { active, over } = event
  setActiveId(null)

  if (!over) {
    // Revert if dropped outside
    if (originalStageRef.current) {
      setProjects(prev =>
        prev.map(item =>
          item.id === active.id
            ? { ...item, stage: originalStageRef.current! }
            : item
        )
      )
    }
    originalStageRef.current = null
    return
  }

  // Calculate positions and update
  const updates = calculateUpdates(event)

  // Optimistic update
  setProjects(prev => applyUpdates(prev, updates))

  // Persist to server
  await fetch('/api/potential-projects/reorder', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ updates }),
  })

  originalStageRef.current = null
}
```

### Pattern 4: API Routes Follow Deal Pattern Exactly
**What:** Copy deals API routes and adapt for PotentialProject model
**When to use:** All CRUD operations
**Example:**
```typescript
// src/app/api/potential-projects/route.ts
import { PotentialStage } from '@prisma/client'

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

  // Get next position in POTENTIAL stage
  const maxPosition = await prisma.potentialProject.aggregate({
    where: { stage: PotentialStage.POTENTIAL },
    _max: { position: true },
  })

  const potentialProject = await prisma.potentialProject.create({
    data: {
      title: body.title.trim(),
      description: body.description || null,
      estimatedValue: body.estimatedValue ? parseFloat(body.estimatedValue) : null,
      companyId: body.companyId,
      contactId: body.contactId || null,
      stage: PotentialStage.POTENTIAL,
      position: (maxPosition._max.position ?? -1) + 1,
    },
    include: {
      company: { select: { id: true, name: true } },
      contact: { select: { id: true, name: true } },
    },
  })

  return NextResponse.json(potentialProject, { status: 201 })
}
```

### Anti-Patterns to Avoid
- **Building from scratch:** Phase 11 provides complete, tested patterns to copy
- **Adding lost reason logic:** PotentialProject doesn't need stage transition interception
- **Creating new select components:** Reuse CompanySelect/ContactSelect from pipeline
- **Complex metrics:** 3 stages don't need the same detailed metrics as 6-stage pipeline
- **Different file organization:** Follow exact structure from Phase 11 for consistency

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Drag-and-drop | Custom mouse handlers | Copy pipeline-board.tsx DndContext setup | Touch, keyboard, accessibility handled |
| Company selection | Custom dropdown | Reuse CompanySelect from pipeline | Already handles fetch, search, selection |
| Contact selection | Custom dropdown | Reuse ContactSelect from pipeline | Already handles cascading, empty state |
| Position calculation | Custom logic | Copy from pipeline-board handleDragEnd | Edge cases handled |
| Batch updates | Individual API calls | Copy deals/reorder pattern | Transaction, atomicity |

**Key insight:** This phase is essentially "copy Phase 11 with 3 stages instead of 6, remove lost reason logic." The research confirms there's no need for new patterns.

## Common Pitfalls

### Pitfall 1: Creating New Components Instead of Adapting
**What goes wrong:** Time wasted rebuilding existing functionality
**Why it happens:** Desire for "clean" implementation
**How to avoid:** Start by copying pipeline components, then simplify
**Warning signs:** Writing DndContext setup from scratch

### Pitfall 2: Field Name Mismatch (value vs estimatedValue)
**What goes wrong:** Form submits but data doesn't save
**Why it happens:** Deal uses `value`, PotentialProject uses `estimatedValue`
**How to avoid:** Update form field names and API body parsing
**Warning signs:** Null values in database for estimatedValue

### Pitfall 3: Forgetting stageChangedAt Update
**What goes wrong:** Stage change timestamp not tracked
**Why it happens:** Copy-pasting without updating model field references
**How to avoid:** Include stageChangedAt update in reorder and PATCH routes
**Warning signs:** stageChangedAt stuck at creation time

### Pitfall 4: Keeping Lost Reason Dialog Logic
**What goes wrong:** Dialog opens on Cancelled stage, but model has no reason field
**Why it happens:** Incomplete removal of Phase 11 lost reason pattern
**How to avoid:** Remove LostReasonDialog import and all pendingLostDeal state
**Warning signs:** TypeScript errors about missing lostReason field

### Pitfall 5: Wrong Prisma Enum Import
**What goes wrong:** TypeScript error on stage assignment
**Why it happens:** Using DealStage instead of PotentialStage
**How to avoid:** Import { PotentialStage } from '@prisma/client'
**Warning signs:** "Type 'string' is not assignable to type 'PotentialStage'"

## Code Examples

Verified patterns from existing Phase 11 implementation:

### PotentialProject Model (Prisma Schema)
```prisma
// Already exists in prisma/schema.prisma
enum PotentialStage {
  POTENTIAL
  CONFIRMED
  CANCELLED
}

model PotentialProject {
  id              String          @id @default(cuid())
  title           String          @db.VarChar(255)
  description     String?         @db.Text
  estimatedValue  Decimal?        @db.Decimal(12, 2) @map("estimated_value")

  stage           PotentialStage  @default(POTENTIAL)
  stageChangedAt  DateTime        @default(now()) @map("stage_changed_at")

  companyId       String          @map("company_id")
  company         Company         @relation(fields: [companyId], references: [id])

  contactId       String?         @map("contact_id")
  contact         Contact?        @relation(fields: [contactId], references: [id])

  // Link to created project (set when stage moves to CONFIRMED)
  projectId       String?         @unique @map("project_id")
  project         Project?        @relation("PotentialToProject", fields: [projectId], references: [id])

  position        Int             @default(0) // Kanban ordering within stage

  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  @@index([companyId])
  @@index([contactId])
  @@index([stage])
  @@map("potential_projects")
}
```

### Simplified Metrics Component (3 Stages)
```typescript
// src/components/potential-projects/potential-metrics.tsx
'use client'

import { POTENTIAL_STAGES } from '@/lib/potential-utils'
import { formatCurrency } from '@/lib/utils'

interface PotentialProject {
  id: string
  stage: string
  estimatedValue: number | null
}

interface PotentialMetricsProps {
  projects: PotentialProject[]
}

export function PotentialMetrics({ projects }: PotentialMetricsProps) {
  // Calculate metrics per stage
  const stageMetrics = POTENTIAL_STAGES.map((stage) => {
    const stageProjects = projects.filter((p) => p.stage === stage.id)
    const count = stageProjects.length
    const totalValue = stageProjects.reduce((sum, p) => sum + (p.estimatedValue || 0), 0)
    return { ...stage, count, totalValue }
  })

  // Open potential (exclude Confirmed and Cancelled)
  const openProjects = projects.filter((p) => p.stage === 'POTENTIAL')
  const openValue = openProjects.reduce((sum, p) => sum + (p.estimatedValue || 0), 0)

  return (
    <div className="bg-gray-50 rounded-lg p-3 mb-4">
      <div className="flex items-center justify-between gap-4">
        {/* Open Potential Summary */}
        <div className="flex items-center gap-2 pr-4 border-r border-gray-200">
          <span className="text-xs font-medium text-gray-500 uppercase">Open</span>
          <span className="text-sm font-semibold text-gray-900">
            {openValue > 0 ? formatCurrency(openValue) : '-'}
          </span>
          <span className="text-xs text-gray-500">
            ({openProjects.length} project{openProjects.length !== 1 ? 's' : ''})
          </span>
        </div>

        {/* Per-Stage Metrics */}
        <div className="flex items-center gap-4 flex-1">
          {stageMetrics.map((stage) => (
            <div key={stage.id} className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${stage.colorDot}`} />
              <span className="text-xs text-gray-600">{stage.title}</span>
              <span className="text-xs font-medium text-gray-900">{stage.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

### Card Component (Adapted from Pipeline)
```typescript
// src/components/potential-projects/potential-card.tsx
// Key changes from pipeline-card.tsx:
// 1. estimatedValue instead of value
// 2. No lostReason field

interface PotentialProject {
  id: string
  title: string
  estimatedValue: number | null  // Changed from 'value'
  company: { id: string; name: string } | null
  contact: { id: string; name: string } | null
}

// Rest of component is identical to PipelineCard
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Building from scratch | Copy and adapt Phase 11 | Phase 11 complete | 90% less work |
| Different component patterns | Identical patterns to Pipeline | Established in Phase 11 | Consistency, maintainability |

**Deprecated/outdated:**
- None - this is a new implementation following current Phase 11 patterns

## Open Questions

Things that couldn't be fully resolved:

1. **CONFIRMED Stage to Project Conversion**
   - What we know: PotentialProject has `projectId` field for linking to Project when confirmed
   - What's unclear: Should Phase 12 implement auto-create Project on CONFIRMED, or defer to later phase?
   - Recommendation: Phase 12 focuses on PTNL requirements only. Project creation logic is out of scope (likely Phase 13+). The projectId field exists but remains null for now.

2. **Navigation Placement**
   - What we know: Pipeline is under CRM section in sidebar
   - What's unclear: Should Potential Projects be adjacent to Pipeline, or in a separate section?
   - Recommendation: Add "Potential Projects" link immediately after "Pipeline" in CRM section. Use Folder or FolderClosed icon from lucide-react for distinction.

## Sources

### Primary (HIGH confidence)
- Existing codebase: `src/components/pipeline/pipeline-board.tsx` - verified working Kanban implementation
- Existing codebase: `src/components/pipeline/pipeline-card.tsx` - verified card component
- Existing codebase: `src/app/api/deals/route.ts` - verified API pattern
- Existing codebase: `src/app/api/deals/reorder/route.ts` - verified batch update pattern
- Prisma schema: `prisma/schema.prisma` - PotentialProject model with all required fields

### Secondary (MEDIUM confidence)
- `.planning/phases/11-sales-pipeline/11-RESEARCH.md` - Phase 11 research document
- `.planning/phases/11-sales-pipeline/11-01-PLAN.md` - Task structure reference
- `.planning/phases/11-sales-pipeline/11-02-PLAN.md` - CRUD task structure reference

### Tertiary (LOW confidence)
- None - all patterns verified against existing codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries already installed and used in Phase 11
- Architecture: HIGH - direct adaptation of Phase 11 patterns
- Pitfalls: HIGH - based on actual Phase 11 implementation differences
- Code examples: HIGH - derived from working Phase 11 code

**Research date:** 2026-01-22
**Valid until:** Indefinite - patterns stable, all based on existing codebase

## Key Differences from Phase 11 (Checklist for Adaptation)

When copying Phase 11 files, apply these changes:

1. **Stage configuration**: 3 stages (POTENTIAL, CONFIRMED, CANCELLED) vs 6 stages
2. **Field names**: `estimatedValue` instead of `value`
3. **No lost reason**: Remove LostReasonDialog, pendingLostDeal state, and interception logic
4. **Prisma enum**: Import `PotentialStage` instead of `DealStage`
5. **API routes**: `/api/potential-projects/` instead of `/api/deals/`
6. **Component folder**: `components/potential-projects/` instead of `components/pipeline/`
7. **Page route**: `/potential-projects` instead of `/pipeline`
8. **Simpler metrics**: Only "Open" (POTENTIAL stage) vs "Open Pipeline" (4 stages)
