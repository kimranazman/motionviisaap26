# Phase 27: Conversion Visibility & Archive - Research

**Researched:** 2026-01-24
**Domain:** React UI components, Prisma schema, Next.js API routes
**Confidence:** HIGH

## Summary

Phase 27 implements two distinct feature sets: (1) Conversion Visibility - showing users when deals/potentials have been converted to projects with navigation links, variance display, and read-only mode, and (2) Archive System - allowing users to archive completed items and toggle visibility of archived content.

The codebase already has the conversion infrastructure (Deal to Project, PotentialProject to Project relationships exist in Prisma schema, reorder routes handle project creation). This phase focuses on UI enhancements to surface this existing data. The archive functionality requires a new `isArchived` field on three models and filtering logic in list/board views.

**Primary recommendation:** Split into two sub-phases: (1) Conversion visibility UI enhancements on existing data, (2) Archive system with schema migration and filter toggle.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Prisma | ^6.5.0 | Schema migration for isArchived field | Already used for all database operations |
| React | existing | UI component state management | Current architecture |
| shadcn/ui | existing | Badge, Button, Sheet components | Already used throughout |
| Next.js | 14.x | API routes for archive operations | Current framework |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | ^0.562.0 | Icons (Archive, ArchiveRestore, ExternalLink) | All icon needs |
| next/link | built-in | Navigation to project detail | View Project button |
| sonner | existing | Toast notifications for archive actions | User feedback |
| cn (utils) | existing | Conditional class merging | Styling variations |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Boolean isArchived | DateTime archivedAt | Boolean simpler, timestamp not needed for requirements |
| Per-model archive | Soft delete pattern | Archive is semantic (can view), soft delete hides completely |
| URL query param for showArchived | State/cookie persistence | Query param is simpler, shareable, no persistence needed |

## Architecture Patterns

### Recommended Project Structure

```
src/
├── components/
│   ├── pipeline/
│   │   ├── pipeline-card.tsx         # Add conversion badge
│   │   ├── pipeline-board.tsx        # Add showArchived toggle
│   │   └── deal-detail-sheet.tsx     # Add conversion info, read-only mode, archive button
│   ├── potential-projects/
│   │   ├── potential-card.tsx        # Add conversion badge
│   │   ├── potential-board.tsx       # Add showArchived toggle
│   │   └── potential-detail-sheet.tsx # Add conversion info, variance, read-only, archive
│   └── projects/
│       ├── project-list.tsx          # Add showArchived toggle
│       └── project-card.tsx          # Show archived badge
└── app/api/
    ├── deals/[id]/
    │   ├── route.ts                  # Add archive PATCH, include project data
    │   └── archive/route.ts          # Optional: dedicated archive endpoint
    ├── potential-projects/[id]/
    │   └── route.ts                  # Add archive PATCH, include project data
    └── projects/[id]/
        └── route.ts                  # Add archive PATCH
```

### Pattern 1: Conversion Badge on Card
**What:** Show "Converted to Project" badge with project title on WON deals and CONFIRMED potentials
**When to use:** Card component when item has `projectId` set
**Example:**
```typescript
// In pipeline-card.tsx or potential-card.tsx
interface Deal {
  id: string
  title: string
  value: number | null
  stage: string
  project?: { id: string; title: string } | null  // NEW: include project relation
  company: { id: string; name: string } | null
  contact: { id: string; name: string } | null
}

// In card render:
{deal.project && (
  <Badge
    variant="outline"
    className="bg-green-50 text-green-700 border-green-200"
  >
    <ArrowRight className="h-3 w-3 mr-1" />
    {deal.project.title}
  </Badge>
)}
```

### Pattern 2: View Project Navigation
**What:** Button to navigate to linked project from detail sheet
**When to use:** Detail sheet when item has `projectId`
**Example:**
```typescript
// In deal-detail-sheet.tsx or potential-detail-sheet.tsx
import Link from 'next/link'
import { ExternalLink } from 'lucide-react'

// In the sheet content:
{deal.project && (
  <div className="space-y-2">
    <Label className="text-muted-foreground">Linked Project</Label>
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium">{deal.project.title}</span>
      <Button variant="outline" size="sm" asChild>
        <Link href={`/projects?open=${deal.project.id}`}>
          <ExternalLink className="h-4 w-4 mr-1" />
          View Project
        </Link>
      </Button>
    </div>
  </div>
)}
```

### Pattern 3: Variance Display (Potential to Project)
**What:** Show estimated vs actual revenue variance on converted potential
**When to use:** Potential detail sheet when project has both potentialRevenue and revenue
**Example:**
```typescript
// In potential-detail-sheet.tsx for CONFIRMED stage
{project.stage === 'CONFIRMED' && project.project && (
  <div className="space-y-3">
    <Label className="text-muted-foreground">Revenue Variance</Label>
    <Card className="p-3">
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <div className="text-gray-500">Estimated</div>
          <div className="font-semibold">{formatCurrency(project.estimatedValue ?? 0)}</div>
        </div>
        <div>
          <div className="text-gray-500">Actual (from AI)</div>
          <div className="font-semibold">{formatCurrency(project.project.revenue ?? 0)}</div>
        </div>
      </div>
      {project.project.revenue !== null && project.estimatedValue !== null && (
        <div className={cn(
          "mt-2 pt-2 border-t text-sm font-medium",
          project.project.revenue > project.estimatedValue ? "text-green-600" : "text-amber-600"
        )}>
          Variance: {project.project.revenue > project.estimatedValue ? '+' : ''}
          {formatCurrency(project.project.revenue - project.estimatedValue)}
        </div>
      )}
    </Card>
  </div>
)}
```

### Pattern 4: Read-Only Mode for Converted Items
**What:** Disable editing on WON deals and CONFIRMED potentials
**When to use:** Detail sheet when item is in terminal converted state
**Example:**
```typescript
// In deal-detail-sheet.tsx
const isConverted = deal.stage === 'WON' && deal.project !== null
const isLost = deal.stage === 'LOST'
const isReadOnly = isConverted || isLost  // Both terminal states are read-only

// Disable form inputs
<Input
  id="edit-title"
  value={title}
  onChange={(e) => setTitle(e.target.value)}
  disabled={isReadOnly}
  className={cn(isReadOnly && "bg-gray-50 cursor-not-allowed")}
/>

// Replace Save button with message
{isReadOnly && (
  <div className="text-sm text-muted-foreground text-center py-2">
    {isConverted ? 'This deal has been converted to a project and cannot be edited.' :
     'This deal is marked as lost and cannot be edited.'}
  </div>
)}
```

### Pattern 5: Archive Toggle in List/Board Views
**What:** Toggle button to show/hide archived items
**When to use:** List headers and board headers
**Example:**
```typescript
// In project-list.tsx, potential-board.tsx, pipeline-board.tsx
const [showArchived, setShowArchived] = useState(false)

// Filter logic
const visibleItems = showArchived
  ? items
  : items.filter(item => !item.isArchived)

// In header:
<div className="flex items-center gap-2">
  <Button
    variant={showArchived ? "secondary" : "ghost"}
    size="sm"
    onClick={() => setShowArchived(!showArchived)}
  >
    <Archive className="h-4 w-4 mr-1" />
    {showArchived ? 'Showing Archived' : 'Show Archived'}
  </Button>
</div>
```

### Pattern 6: Archive/Unarchive Action
**What:** Button to archive or unarchive an item
**When to use:** Detail sheet footer or dropdown menu
**Example:**
```typescript
// Archive button in detail sheet footer
<Button
  variant="outline"
  onClick={handleArchive}
  disabled={isArchiving}
  className={item.isArchived ? "text-blue-600" : "text-gray-600"}
>
  {item.isArchived ? (
    <>
      <ArchiveRestore className="mr-2 h-4 w-4" />
      Unarchive
    </>
  ) : (
    <>
      <Archive className="mr-2 h-4 w-4" />
      Archive
    </>
  )}
</Button>

// Handler
const handleArchive = async () => {
  setIsArchiving(true)
  try {
    const response = await fetch(`/api/deals/${deal.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isArchived: !deal.isArchived }),
    })
    if (response.ok) {
      const updated = await response.json()
      onUpdate(updated)
      toast.success(updated.isArchived ? 'Archived' : 'Unarchived')
    }
  } catch (error) {
    toast.error('Failed to update')
  } finally {
    setIsArchiving(false)
  }
}
```

### Anti-Patterns to Avoid
- **Hard-deleting instead of archiving:** Archive preserves data for historical reference
- **Separate archive endpoints:** Use existing PATCH with isArchived field, not new endpoints
- **Hiding archive toggle completely:** Always show toggle, just dim when no archived items exist
- **Making WON/CONFIRMED stages editable:** Converted items should be read-only to preserve data integrity

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Navigation to project | Custom router logic | Next.js Link with query param | Built-in, handles prefetching |
| Currency formatting | Custom formatter | Existing `formatCurrency` from lib/utils | Already handles RM prefix |
| Variance calculation | Complex state | Simple subtraction | Existing pattern in FinancialsSummary |
| Archive filtering | Complex filter logic | Simple boolean filter | Keep it simple |

**Key insight:** This phase is UI enhancement on existing data - no complex new systems needed.

## Common Pitfalls

### Pitfall 1: API Not Returning Project Data
**What goes wrong:** Card tries to show project badge but project is null
**Why it happens:** API queries don't include the project relation
**How to avoid:** Update all deal/potential API routes to include project in select:
```typescript
include: {
  project: { select: { id: true, title: true, revenue: true } }
}
```
**Warning signs:** Project badge never shows even for WON deals

### Pitfall 2: Read-Only Mode Breaks Form State
**What goes wrong:** Form doesn't save or errors on submit
**Why it happens:** Form still tries to submit when in read-only mode
**How to avoid:** Hide Save button entirely, show informational message instead
**Warning signs:** Save button visible but disabled with no explanation

### Pitfall 3: Archive Filter Not Applied to Initial Data
**What goes wrong:** Page load shows all items including archived, then filters
**Why it happens:** Filter only applied to client state, not server query
**How to avoid:** Apply archive filter on server side (page.tsx query)
**Warning signs:** Flash of archived items on page load

### Pitfall 4: Kanban Board Allows Dragging Archived Items
**What goes wrong:** User drags archived deal to different stage
**Why it happens:** Drag disabled only for read-only, not archived
**How to avoid:** Disable drag for archived items: `disabled={!canEdit || item.isArchived}`
**Warning signs:** Archived items can be moved between stages

### Pitfall 5: Archive Toggle Resets on Navigation
**What goes wrong:** User enables "Show Archived", navigates away, comes back, toggle is off
**Why it happens:** State is component-local
**How to avoid:** Use URL query param `?showArchived=true` for persistence
**Warning signs:** User has to re-enable toggle repeatedly

### Pitfall 6: Missing isArchived in Type Definitions
**What goes wrong:** TypeScript errors when accessing isArchived
**Why it happens:** Interface not updated after schema change
**How to avoid:** Update all Deal, PotentialProject, Project interfaces to include `isArchived: boolean`
**Warning signs:** TypeScript compilation errors

## Code Examples

Verified patterns from existing codebase:

### Schema Migration for isArchived
```prisma
// Source: prisma/schema.prisma - Pattern from existing models
model Deal {
  // ... existing fields
  isArchived     Boolean   @default(false) @map("is_archived")  // NEW
  archivedAt     DateTime? @map("archived_at")                   // Optional: for tracking

  @@index([isArchived])  // Index for efficient filtering
}

model PotentialProject {
  // ... existing fields
  isArchived     Boolean   @default(false) @map("is_archived")  // NEW

  @@index([isArchived])
}

model Project {
  // ... existing fields
  isArchived     Boolean   @default(false) @map("is_archived")  // NEW

  @@index([isArchived])
}
```

### Updated Deal API with Project Include
```typescript
// Source: src/app/api/deals/route.ts - Pattern from existing code
const deals = await prisma.deal.findMany({
  where: {
    // Filter out archived by default
    isArchived: showArchived ? undefined : false,
  },
  include: {
    company: { select: { id: true, name: true } },
    contact: { select: { id: true, name: true } },
    // NEW: Include project for conversion visibility
    project: {
      select: {
        id: true,
        title: true,
        revenue: true,
        potentialRevenue: true,
      }
    },
  },
  orderBy: { position: 'asc' },
})
```

### Archive PATCH Handler
```typescript
// Source: src/app/api/deals/[id]/route.ts - Extend existing PATCH
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireEditor()
  if (error) return error

  const { id } = await params
  const body = await request.json()

  const deal = await prisma.deal.update({
    where: { id },
    data: {
      ...(body.title !== undefined && { title: body.title }),
      ...(body.companyId !== undefined && { companyId: body.companyId }),
      ...(body.contactId !== undefined && { contactId: body.contactId || null }),
      ...(body.value !== undefined && { value: body.value ? parseFloat(body.value) : null }),
      ...(body.description !== undefined && { description: body.description || null }),
      // NEW: Handle archive toggle
      ...(body.isArchived !== undefined && {
        isArchived: body.isArchived,
        archivedAt: body.isArchived ? new Date() : null,
      }),
    },
    include: {
      company: { select: { id: true, name: true } },
      contact: { select: { id: true, name: true } },
      project: { select: { id: true, title: true, revenue: true, potentialRevenue: true } },
    },
  })

  return NextResponse.json(deal)
}
```

### Enhanced Deal Detail Sheet
```typescript
// Source: src/components/pipeline/deal-detail-sheet.tsx - Key additions
interface Deal {
  id: string
  title: string
  description: string | null
  value: number | null
  stage: string
  lostReason?: string | null
  position: number
  isArchived: boolean  // NEW
  company: { id: string; name: string } | null
  contact: { id: string; name: string } | null
  project: {  // NEW
    id: string
    title: string
    revenue: number | null
    potentialRevenue: number | null
  } | null
}

// In component:
const isConverted = deal.stage === 'WON' && deal.project !== null
const isLost = deal.stage === 'LOST'
const isReadOnly = isConverted || isLost

// Render conversion info section:
{isConverted && deal.project && (
  <>
    <Separator />
    <div className="space-y-3">
      <Label className="text-muted-foreground">Converted Project</Label>
      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
        <div>
          <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300 mb-1">
            Converted to Project
          </Badge>
          <div className="font-medium text-green-800">{deal.project.title}</div>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/projects?open=${deal.project.id}`}>
            <ExternalLink className="h-4 w-4 mr-1" />
            View
          </Link>
        </Button>
      </div>

      {/* Variance display */}
      {deal.project.revenue !== null && (
        <div className="text-sm">
          <span className="text-gray-500">Revenue: </span>
          <span className={cn(
            "font-medium",
            deal.project.revenue > (deal.value ?? 0) ? "text-green-600" : "text-amber-600"
          )}>
            {formatCurrency(deal.project.revenue)}
          </span>
          <span className="text-gray-400"> vs </span>
          <span className="text-gray-600">{formatCurrency(deal.value ?? 0)} estimated</span>
        </div>
      )}
    </div>
  </>
)}
```

### Projects Page with Open Query Param
```typescript
// Source: src/app/(dashboard)/projects/page.tsx - Handle deep link
export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ open?: string; showArchived?: string }>
}) {
  const { open, showArchived } = await searchParams

  const projects = await prisma.project.findMany({
    where: {
      isArchived: showArchived === 'true' ? undefined : false,
    },
    // ... existing includes
  })

  return (
    <div className="flex flex-col h-screen">
      <Header title="Projects" description="..." />
      <main className="flex-1 overflow-auto p-6">
        <ProjectList
          initialData={serializedProjects}
          openProjectId={open}  // NEW: auto-open project detail
          showArchived={showArchived === 'true'}
        />
      </main>
    </div>
  )
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| No conversion visibility | Show badge + link + variance | This phase | Users can track conversion path |
| Converted items editable | Read-only mode | This phase | Data integrity preserved |
| Completed items stay visible | Archive + toggle | This phase | Cleaner default views |

**Deprecated/outdated:**
- None - this is new functionality

## Open Questions

Things that couldn't be fully resolved:

1. **Should archive be available for non-terminal states?**
   - What we know: Requirements say "completed/converted" items
   - What's unclear: Can user archive a DRAFT project or LEAD deal?
   - Recommendation: Allow archive for any state - user knows when they want to hide something

2. **Should View Project open sheet or navigate to page?**
   - What we know: No dedicated project detail page exists
   - What's unclear: Whether to use sheet (current pattern) or URL navigation
   - Recommendation: Use URL with `?open=projectId` to trigger sheet, allows bookmarking

3. **Should showArchived persist across sessions?**
   - What we know: Requirements don't specify persistence
   - What's unclear: Whether toggle state should survive page refresh
   - Recommendation: URL query param provides natural persistence without storage

4. **Batch archive operations?**
   - What we know: Requirements focus on individual items
   - What's unclear: Whether users need to archive multiple items at once
   - Recommendation: Start with individual archive, add batch later if needed

## Dependencies

Phase 27 depends on:
- **Phase 26 (Revenue Model):** potentialRevenue field exists on Project - COMPLETE
- **Phase 13 (Projects Conversion):** Deal/Potential to Project conversion exists - COMPLETE
- **Phase 11/12 (Pipeline/Potentials):** Kanban boards exist - COMPLETE

All dependencies are satisfied. Phase 27 builds on existing infrastructure.

## Sources

### Primary (HIGH confidence)
- `prisma/schema.prisma` - Current Deal, PotentialProject, Project models (lines 320-421)
- `src/app/api/deals/reorder/route.ts` - Conversion logic, project creation (lines 52-77)
- `src/app/api/potential-projects/reorder/route.ts` - Conversion logic (lines 53-76)
- `src/components/pipeline/deal-detail-sheet.tsx` - Detail sheet pattern (lines 60-358)
- `src/components/potential-projects/potential-detail-sheet.tsx` - Detail sheet pattern (lines 58-335)
- `src/components/projects/project-detail-sheet.tsx` - Revenue display pattern (lines 128-349)
- `src/components/projects/project-list.tsx` - List with filter tabs pattern (lines 34-158)
- `.planning/REQUIREMENTS.md` - CONV-01 through ARCH-04 requirements

### Secondary (MEDIUM confidence)
- Existing Badge component usage across codebase
- Link navigation pattern from initiatives-list.tsx
- Archive patterns inferred from standard practices

### Tertiary (LOW confidence)
- None - all patterns verified from source code

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries already installed
- Architecture: HIGH - adapting existing patterns
- Pitfalls: HIGH - based on code analysis and existing patterns
- Conversion UI: HIGH - clear implementation path

**Research date:** 2026-01-24
**Valid until:** Indefinite - patterns stable, internal enhancement

## Implementation Priority

Based on requirements and dependencies:

1. **Conversion Visibility (CONV-01 through CONV-05)**
   - Update API routes to include project relation
   - Add conversion badge to deal/potential cards
   - Add View Project button to detail sheets
   - Add variance display to detail sheets
   - Implement read-only mode for converted items

2. **Archive System (ARCH-01 through ARCH-04)**
   - Schema migration: add isArchived to Deal, PotentialProject, Project
   - Update API routes to handle isArchived filter and update
   - Add archive/unarchive button to detail sheets
   - Add showArchived toggle to list/board views
   - Update kanban to disable drag for archived items
