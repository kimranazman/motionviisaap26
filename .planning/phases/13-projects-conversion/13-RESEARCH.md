# Phase 13: Projects & Conversion - Research

**Researched:** 2026-01-22
**Domain:** Project entity CRUD with auto-conversion from deals/potentials
**Confidence:** HIGH

## Summary

Phase 13 implements the Project entity which serves as the final destination for won deals and confirmed potentials, while also supporting direct creation. The Project model already exists in Prisma with all required relationships (sourceDeal, sourcePotential, initiative, company, contact).

The phase has two distinct parts:
1. **Project CRUD** (PROJ-01 through PROJ-08): Standard list/create/edit/delete functionality similar to existing patterns
2. **Auto-conversion** (PIPE-06, PTNL-06): When a deal moves to WON or a potential moves to CONFIRMED, automatically create a linked Project

The key complexity is in the conversion logic - it must intercept stage changes (similar to how Lost reason is captured) and create the Project in a transaction. The Company detail page enhancement (COMP-05) requires adding related items display.

**Primary recommendation:** Build project management first (simpler, establishes patterns), then implement conversion logic by extending existing pipeline/potential board components.

## Current State Analysis

### Project Model (Already Exists)
```prisma
model Project {
  id              String          @id @default(cuid())
  title           String          @db.VarChar(255)
  description     String?         @db.Text
  revenue         Decimal?        @db.Decimal(12, 2)
  status          ProjectStatus   @default(DRAFT)

  companyId       String          @map("company_id")
  company         Company         @relation(fields: [companyId], references: [id])

  contactId       String?         @map("contact_id")
  contact         Contact?        @relation(fields: [contactId], references: [id])

  // Source tracking - only ONE will be set
  sourceDeal      Deal?           @relation("DealToProject")  // Back-relation from Deal.projectId
  sourcePotential PotentialProject? @relation("PotentialToProject")  // Back-relation

  // Optional KRI link
  initiativeId    String?         @map("initiative_id")
  initiative      Initiative?     @relation(fields: [initiativeId], references: [id])

  costs           Cost[]

  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  @@index([companyId])
  @@index([contactId])
  @@index([initiativeId])
  @@index([status])
  @@map("projects")
}

enum ProjectStatus {
  DRAFT
  ACTIVE
  COMPLETED
  CANCELLED
}
```

### Deal-Project Relationship (Already Exists)
```prisma
model Deal {
  // ... other fields
  projectId       String?         @unique @map("project_id")
  project         Project?        @relation("DealToProject", fields: [projectId], references: [id])
}
```

### PotentialProject-Project Relationship (Already Exists)
```prisma
model PotentialProject {
  // ... other fields
  projectId       String?         @unique @map("project_id")
  project         Project?        @relation("PotentialToProject", fields: [projectId], references: [id])
}
```

### Initiative-Project Relationship (Already Exists)
```prisma
model Initiative {
  // ... other fields
  projects        Project[]       // Projects linked to this KRI (v1.2)
}
```

### Company API Already Returns Counts
The existing `/api/companies/[id]` endpoint already includes:
```typescript
_count: {
  select: { deals: true, projects: true, potentials: true },
}
```

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Prisma | `^6.5.0` | Database operations with transactions | Already used, supports atomic conversion |
| shadcn/ui | various | UI components (Dialog, Sheet, AlertDialog) | Already used throughout app |
| lucide-react | `^0.562.0` | Icons (Folder, FolderOpen, ArrowRight) | Existing pattern |

### Supporting (Already Installed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `cmdk` | `^1.1.1` | Initiative selection combobox | For optional KRI linking |
| `@radix-ui/react-select` | via shadcn | Status dropdown | For project status |
| `next/navigation` | built-in | Redirect after conversion | Navigate to new project |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| List page | Kanban board | Projects have linear status, not pipeline stages - list is more appropriate |
| Modal for edit | Detail page | Projects may have more complex data (costs) in future - consider sheet/page |

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
│   │   └── projects/
│   │       ├── page.tsx                    # Server component, list of projects
│   │       └── [id]/
│   │           └── page.tsx                # Project detail page (optional, could use sheet)
│   └── api/
│       └── projects/
│           ├── route.ts                    # GET (list), POST (create)
│           └── [id]/
│               └── route.ts                # GET, PATCH, DELETE (single)
├── components/
│   └── projects/
│       ├── project-list.tsx                # Filterable list of projects
│       ├── project-card.tsx                # Card component for list
│       ├── project-form-modal.tsx          # Create project form
│       ├── project-detail-sheet.tsx        # View/edit details + source info
│       └── initiative-select.tsx           # Optional KRI linking
└── lib/
    └── project-utils.ts                    # Status colors, formatters
```

### Pattern 1: Project List (Not Kanban)
**What:** Projects use a filterable list/card view, not Kanban
**Why:** ProjectStatus (DRAFT, ACTIVE, COMPLETED, CANCELLED) represents lifecycle state, not a sales pipeline. Projects don't "move through stages" the same way.
**Example:**
```typescript
// src/app/(dashboard)/projects/page.tsx
export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string }>
}) {
  const { status, search } = await searchParams

  const projects = await prisma.project.findMany({
    where: {
      AND: [
        status ? { status: status as ProjectStatus } : {},
        search ? { title: { contains: search } } : {},
      ],
    },
    include: {
      company: { select: { id: true, name: true } },
      contact: { select: { id: true, name: true } },
      sourceDeal: { select: { id: true, title: true } },
      sourcePotential: { select: { id: true, title: true } },
      initiative: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return <ProjectList initialData={projects} />
}
```

### Pattern 2: Auto-Conversion on Stage Change (Deal to WON)
**What:** When deal moves to WON stage, automatically create Project and link it
**Where:** Modify `/api/deals/reorder/route.ts` or create conversion endpoint
**Example:**
```typescript
// src/app/api/deals/reorder/route.ts (enhanced)
import { DealStage, ProjectStatus } from '@prisma/client'

export async function PATCH(request: NextRequest) {
  // ... existing validation ...

  // Get current deals to check for stage changes
  const dealIds = updates.map((u: { id: string }) => u.id)
  const currentDeals = await prisma.deal.findMany({
    where: { id: { in: dealIds } },
    select: { id: true, stage: true, title: true, value: true, companyId: true, contactId: true },
  })
  const currentStageMap = new Map(currentDeals.map(d => [d.id, d]))

  // Use transaction to ensure atomicity
  await prisma.$transaction(async (tx) => {
    for (const update of updates) {
      const currentDeal = currentStageMap.get(update.id)
      const stageIsChanging = update.stage && currentDeal?.stage !== update.stage
      const movingToWon = update.stage === 'WON' && stageIsChanging

      if (movingToWon && currentDeal) {
        // Create project first
        const project = await tx.project.create({
          data: {
            title: currentDeal.title,
            description: null,
            revenue: currentDeal.value,
            status: ProjectStatus.DRAFT,
            companyId: currentDeal.companyId,
            contactId: currentDeal.contactId,
          },
        })

        // Update deal with project link AND stage change
        await tx.deal.update({
          where: { id: update.id },
          data: {
            position: update.position,
            stage: 'WON',
            stageChangedAt: new Date(),
            projectId: project.id,
          },
        })
      } else {
        // Normal update (existing logic)
        await tx.deal.update({
          where: { id: update.id },
          data: {
            position: update.position,
            ...(update.stage && { stage: update.stage as DealStage }),
            ...(update.lostReason !== undefined && { lostReason: update.lostReason || null }),
            ...(stageIsChanging && { stageChangedAt: new Date() }),
          },
        })
      }
    }
  })

  return NextResponse.json({ success: true })
}
```

### Pattern 3: Auto-Conversion on Stage Change (Potential to CONFIRMED)
**What:** When potential moves to CONFIRMED stage, automatically create Project and link it
**Where:** Modify `/api/potential-projects/reorder/route.ts`
**Example:**
```typescript
// src/app/api/potential-projects/reorder/route.ts (enhanced)
const movingToConfirmed = update.stage === 'CONFIRMED' && stageIsChanging

if (movingToConfirmed && currentProject) {
  // Create project first
  const project = await tx.project.create({
    data: {
      title: currentProject.title,
      description: currentProject.description,
      revenue: currentProject.estimatedValue,
      status: ProjectStatus.DRAFT,
      companyId: currentProject.companyId,
      contactId: currentProject.contactId,
    },
  })

  // Update potential with project link AND stage change
  await tx.potentialProject.update({
    where: { id: update.id },
    data: {
      position: update.position,
      stage: 'CONFIRMED',
      stageChangedAt: new Date(),
      projectId: project.id,
    },
  })
}
```

### Pattern 4: Initiative Selection (KRI Linking)
**What:** Optional combobox to link project to an initiative (KRI)
**How:** Similar to CompanySelect, but with search via existing `/api/initiatives/search` endpoint
**Example:**
```typescript
// src/components/projects/initiative-select.tsx
'use client'

import { useState, useEffect } from 'react'
import { Check, ChevronsUpDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface Initiative {
  id: string
  title: string
  status: string
}

interface InitiativeSelectProps {
  value: string | null
  onValueChange: (initiativeId: string | null) => void
  disabled?: boolean
}

export function InitiativeSelect({
  value,
  onValueChange,
  disabled = false,
}: InitiativeSelectProps) {
  const [open, setOpen] = useState(false)
  const [initiatives, setInitiatives] = useState<Initiative[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [query, setQuery] = useState('')

  // Search initiatives as user types
  useEffect(() => {
    if (!query.trim()) {
      setInitiatives([])
      return
    }

    const searchInitiatives = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/initiatives/search?q=${encodeURIComponent(query)}`)
        if (response.ok) {
          const data = await response.json()
          setInitiatives(data)
        }
      } catch (error) {
        console.error('Failed to search initiatives:', error)
      } finally {
        setIsLoading(false)
      }
    }

    const debounce = setTimeout(searchInitiatives, 300)
    return () => clearTimeout(debounce)
  }, [query])

  const selectedInitiative = initiatives.find((i) => i.id === value)

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              'flex-1 justify-between font-normal',
              !value && 'text-muted-foreground'
            )}
          >
            {selectedInitiative?.title || 'Link to KRI (optional)...'}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[350px] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              value={query}
              onValueChange={setQuery}
              placeholder="Search initiatives..."
            />
            <CommandList>
              {isLoading ? (
                <CommandEmpty>Searching...</CommandEmpty>
              ) : initiatives.length === 0 ? (
                <CommandEmpty>
                  {query ? 'No initiatives found.' : 'Type to search...'}
                </CommandEmpty>
              ) : null}
              <CommandGroup>
                {initiatives.map((initiative) => (
                  <CommandItem
                    key={initiative.id}
                    value={initiative.id}
                    onSelect={() => {
                      onValueChange(initiative.id)
                      setOpen(false)
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value === initiative.id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <span className="truncate">{initiative.title}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {value && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onValueChange(null)}
          className="h-9 w-9"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
```

### Pattern 5: Project Source Display
**What:** Show where project originated (deal, potential, or direct)
**Where:** Project detail sheet/page
**Example:**
```typescript
// In project-detail-sheet.tsx
{/* Source Info */}
<div className="space-y-2">
  <Label className="text-muted-foreground">Source</Label>
  {project.sourceDeal ? (
    <div className="flex items-center gap-2 text-sm">
      <ArrowRight className="h-4 w-4 text-green-500" />
      <span>Converted from deal: </span>
      <Link href="#" className="text-blue-600 hover:underline">
        {project.sourceDeal.title}
      </Link>
    </div>
  ) : project.sourcePotential ? (
    <div className="flex items-center gap-2 text-sm">
      <ArrowRight className="h-4 w-4 text-blue-500" />
      <span>Converted from potential: </span>
      <Link href="#" className="text-blue-600 hover:underline">
        {project.sourcePotential.title}
      </Link>
    </div>
  ) : (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Plus className="h-4 w-4" />
      <span>Created directly</span>
    </div>
  )}
</div>
```

### Pattern 6: Company Detail Enhancement (COMP-05)
**What:** Show related deals, potentials, and projects on company detail modal
**Where:** Extend existing company-detail-modal.tsx
**Example:**
```typescript
// Enhanced CompanyDetailModal with related items
interface Company {
  // ... existing fields
  deals: { id: string; title: string; stage: string; value: number | null }[]
  potentials: { id: string; title: string; stage: string; estimatedValue: number | null }[]
  projects: { id: string; title: string; status: string; revenue: number | null }[]
}

// In the modal, after Contacts section:
<Separator />

{/* Related Items Section */}
<div className="space-y-4">
  <h3 className="font-medium text-gray-900">Related Items</h3>

  {/* Deals */}
  {company.deals.length > 0 && (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-gray-500">
        Deals ({company.deals.length})
      </h4>
      <div className="space-y-1">
        {company.deals.slice(0, 3).map((deal) => (
          <div key={deal.id} className="flex items-center justify-between text-sm">
            <span className="truncate">{deal.title}</span>
            <Badge variant="outline">{formatDealStage(deal.stage)}</Badge>
          </div>
        ))}
        {company.deals.length > 3 && (
          <p className="text-xs text-muted-foreground">
            +{company.deals.length - 3} more
          </p>
        )}
      </div>
    </div>
  )}

  {/* Similar for potentials and projects */}
</div>
```

### Anti-Patterns to Avoid
- **Creating project without transaction:** Conversion must be atomic - if project creation fails, stage shouldn't change
- **Allowing duplicate conversion:** Check if deal/potential already has projectId before creating new project
- **Manual project linking:** Don't let users manually link projects to deals/potentials - it's auto-set on conversion
- **Kanban for projects:** Projects don't have a pipeline flow - use list view with status filter

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Initiative search | New search endpoint | Existing `/api/initiatives/search` | Already supports text search |
| Conversion logic | Client-side orchestration | Server-side transaction | Atomicity required |
| Source display | Complex conditionals | Prisma include with select | Clean data structure |
| Status management | Custom state machine | Simple status field | No complex transitions needed |

**Key insight:** The Project entity is simpler than Deal or PotentialProject because it doesn't have a Kanban-style flow. The complexity is in the conversion trigger points, which should be handled server-side.

## Common Pitfalls

### Pitfall 1: Non-Atomic Conversion
**What goes wrong:** Stage changes but project creation fails, or vice versa
**Why it happens:** Separate API calls without transaction
**How to avoid:** Use Prisma transaction for conversion
**Warning signs:** Deals in WON stage without linked projects

### Pitfall 2: Duplicate Projects on Re-drag
**What goes wrong:** Dragging deal away from WON and back creates duplicate project
**Why it happens:** Not checking if projectId already exists
**How to avoid:** Check `currentDeal.projectId` before creating new project
**Warning signs:** Multiple projects with same title/deal source

### Pitfall 3: Stale Board After Conversion
**What goes wrong:** UI doesn't reflect the new project link after stage change
**Why it happens:** Optimistic update doesn't include project data
**How to avoid:** Return full deal data with project info in reorder response, or refetch
**Warning signs:** Project link not visible until page refresh

### Pitfall 4: Missing Source on Direct Create
**What goes wrong:** Confusion when project shows "no source" but should show linked deal
**Why it happens:** Using direct create API instead of conversion path
**How to avoid:** Only auto-set source via conversion; direct create has no source by design
**Warning signs:** None - this is correct behavior

### Pitfall 5: Orphaned Projects
**What goes wrong:** Deleting a deal that has a linked project
**Why it happens:** No cascade behavior or protection
**How to avoid:** Decide on policy: prevent deal deletion if has project, or unlink project on deal delete
**Warning signs:** Projects with null source that were actually converted

### Pitfall 6: Company Include Performance
**What goes wrong:** Company detail modal slow with many deals/projects
**Why it happens:** Loading all related items without limits
**How to avoid:** Limit related items query (e.g., top 5 most recent), add "view all" links
**Warning signs:** Modal takes seconds to open for companies with many records

## Code Examples

### Project API Routes
```typescript
// src/app/api/projects/route.ts
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth, requireEditor } from '@/lib/auth-utils'
import { ProjectStatus } from '@prisma/client'

// GET /api/projects - List all projects
export async function GET() {
  const { error } = await requireAuth()
  if (error) return error

  const projects = await prisma.project.findMany({
    include: {
      company: { select: { id: true, name: true } },
      contact: { select: { id: true, name: true } },
      sourceDeal: { select: { id: true, title: true } },
      sourcePotential: { select: { id: true, title: true } },
      initiative: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(projects)
}

// POST /api/projects - Create new project (direct, not from conversion)
export async function POST(request: NextRequest) {
  const { error } = await requireEditor()
  if (error) return error

  const body = await request.json()

  // Validate required fields
  if (!body.title || typeof body.title !== 'string' || !body.title.trim()) {
    return NextResponse.json(
      { error: 'Title is required' },
      { status: 400 }
    )
  }

  if (!body.companyId || typeof body.companyId !== 'string') {
    return NextResponse.json(
      { error: 'Company is required' },
      { status: 400 }
    )
  }

  const project = await prisma.project.create({
    data: {
      title: body.title.trim(),
      description: body.description || null,
      revenue: body.revenue ? parseFloat(body.revenue) : null,
      status: ProjectStatus.DRAFT,
      companyId: body.companyId,
      contactId: body.contactId || null,
      initiativeId: body.initiativeId || null,
    },
    include: {
      company: { select: { id: true, name: true } },
      contact: { select: { id: true, name: true } },
      initiative: { select: { id: true, title: true } },
    },
  })

  return NextResponse.json(project, { status: 201 })
}
```

### Project Individual Route
```typescript
// src/app/api/projects/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth, requireEditor } from '@/lib/auth-utils'
import { ProjectStatus } from '@prisma/client'

// GET /api/projects/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth()
  if (error) return error

  const { id } = await params
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      company: { select: { id: true, name: true } },
      contact: { select: { id: true, name: true } },
      sourceDeal: { select: { id: true, title: true, value: true } },
      sourcePotential: { select: { id: true, title: true, estimatedValue: true } },
      initiative: { select: { id: true, title: true } },
    },
  })

  if (!project) {
    return NextResponse.json(
      { error: 'Project not found' },
      { status: 404 }
    )
  }

  return NextResponse.json(project)
}

// PATCH /api/projects/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireEditor()
  if (error) return error

  const { id } = await params
  const body = await request.json()

  const project = await prisma.project.update({
    where: { id },
    data: {
      ...(body.title !== undefined && { title: body.title }),
      ...(body.description !== undefined && { description: body.description || null }),
      ...(body.revenue !== undefined && { revenue: body.revenue ? parseFloat(body.revenue) : null }),
      ...(body.status !== undefined && { status: body.status as ProjectStatus }),
      ...(body.companyId !== undefined && { companyId: body.companyId }),
      ...(body.contactId !== undefined && { contactId: body.contactId || null }),
      ...(body.initiativeId !== undefined && { initiativeId: body.initiativeId || null }),
    },
    include: {
      company: { select: { id: true, name: true } },
      contact: { select: { id: true, name: true } },
      initiative: { select: { id: true, title: true } },
    },
  })

  return NextResponse.json(project)
}

// DELETE /api/projects/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireEditor()
  if (error) return error

  const { id } = await params
  await prisma.project.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
```

### Project Utils
```typescript
// src/lib/project-utils.ts
export const PROJECT_STATUSES = [
  { id: 'DRAFT', title: 'Draft', colorDot: 'bg-gray-400' },
  { id: 'ACTIVE', title: 'Active', colorDot: 'bg-blue-500' },
  { id: 'COMPLETED', title: 'Completed', colorDot: 'bg-green-500' },
  { id: 'CANCELLED', title: 'Cancelled', colorDot: 'bg-red-400' },
] as const

export type ProjectStatusId = (typeof PROJECT_STATUSES)[number]['id']

export function formatProjectStatus(status: string): string {
  const statusMap: Record<string, string> = {
    DRAFT: 'Draft',
    ACTIVE: 'Active',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
  }
  return statusMap[status] || status
}

export function getProjectStatusColor(status: string): string {
  const colors: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-700',
    ACTIVE: 'bg-blue-100 text-blue-700',
    COMPLETED: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-red-100 text-red-700',
  }
  return colors[status] || 'bg-gray-100 text-gray-700'
}

export function getSourceLabel(
  sourceDeal: { title: string } | null,
  sourcePotential: { title: string } | null
): { type: 'deal' | 'potential' | 'direct'; label: string } {
  if (sourceDeal) {
    return { type: 'deal', label: `From deal: ${sourceDeal.title}` }
  }
  if (sourcePotential) {
    return { type: 'potential', label: `From potential: ${sourcePotential.title}` }
  }
  return { type: 'direct', label: 'Direct creation' }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual project creation from deals | Auto-conversion on stage change | This phase | Better data integrity |
| No source tracking | sourceDeal/sourcePotential fields | Schema design | Full traceability |

**Deprecated/outdated:**
- None - this is a new implementation

## Open Questions

1. **What happens when user tries to move deal OUT of WON stage?**
   - Options: Prevent entirely, allow but keep project link, allow and delete project
   - Recommendation: Prevent moving out of WON/LOST - these are terminal stages

2. **Should conversion show a confirmation dialog?**
   - Current: Lost reason requires dialog input
   - WON/CONFIRMED: Just information, no input needed
   - Recommendation: Optional toast notification "Project created!" with link, but no blocking dialog

3. **How to handle Project deletion when linked to deal?**
   - Current schema: Deal.projectId would become orphan reference
   - Options: Cascade set to null, or prevent project deletion if source exists
   - Recommendation: Set projectId to null on project delete, allowing project re-creation

## Dependencies

Phase 13 depends on:
- **Phase 11 (Sales Pipeline):** Deal model, pipeline board, reorder endpoint - ALL EXIST
- **Phase 12 (Potential Projects):** PotentialProject model, potential board, reorder endpoint - ALL EXIST

These dependencies are fully satisfied in the current codebase.

## Sources

### Primary (HIGH confidence)
- Prisma schema: `prisma/schema.prisma` - Project, Deal, PotentialProject models verified
- Existing codebase: `src/app/api/deals/reorder/route.ts` - Batch update pattern
- Existing codebase: `src/app/api/potential-projects/reorder/route.ts` - Same pattern
- Existing codebase: `src/components/pipeline/pipeline-board.tsx` - Stage change handling
- Existing codebase: `src/app/api/initiatives/search/route.ts` - Search API for KRI linking
- Existing codebase: `src/components/companies/company-detail-modal.tsx` - Company detail pattern

### Secondary (MEDIUM confidence)
- Existing patterns from Phase 11/12 research documents

### Tertiary (LOW confidence)
- None - all patterns verified against existing codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries already installed
- Architecture: HIGH - adapting existing patterns
- Pitfalls: HIGH - based on database relationships and existing code analysis
- Conversion logic: HIGH - clear pattern from existing stage change handling

**Research date:** 2026-01-22
**Valid until:** Indefinite - patterns stable, based on existing codebase

## Implementation Priority

Based on requirements and dependencies:

1. **Project CRUD (PROJ-01 through PROJ-06)** - Foundation
   - API routes
   - List page
   - Create form (with KRI select)
   - Detail sheet

2. **Project Source Display (PROJ-07, PROJ-08)** - Detail enhancement
   - Show source (deal/potential/direct)
   - Show linked KRI

3. **Deal Conversion (PIPE-06)** - Pipeline enhancement
   - Modify reorder endpoint
   - Handle WON stage transition

4. **Potential Conversion (PTNL-06)** - Potential enhancement
   - Modify reorder endpoint
   - Handle CONFIRMED stage transition

5. **Company Related Items (COMP-05)** - Company detail enhancement
   - Enhance company API
   - Update company detail modal
