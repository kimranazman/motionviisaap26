# Phase 34: Activity Logging & Bidirectional Sync - Research

**Researched:** 2026-01-25
**Domain:** Data synchronization, activity tracking, real-time updates
**Confidence:** HIGH

## Summary

This phase adds bidirectional synchronization between converted deals/potentials and their linked projects, plus activity logging to track changes. The existing codebase already has:

1. **ActivityLog model** defined in schema with appropriate enums (ActivityEntityType, ActivityAction)
2. **Project-Deal/Potential relationships** via projectId foreign keys with server-side includes
3. **Conversion badges** already showing project title on converted cards
4. **Manual refresh pattern** used for data fetching (fetch + local state, no react-query)

The main work involves:
- Enhancing cards to display live project metrics (revenue, costs, status)
- Adding title sync from Project back to Deal/Potential
- Creating ActivityLog API routes and logging infrastructure
- Adding polling-based auto-refresh for pipeline boards

**Primary recommendation:** Use Prisma transactions for title sync to ensure atomicity, interval-based polling (60s) for board refresh (consistent with existing notification pattern), and server-side aggregation for project metrics to minimize client-side computation.

## Standard Stack

The project does NOT use react-query. All data fetching uses native fetch with React useState.

### Core (Already in Project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 14.2.28 | App Router, API routes | Existing stack |
| Prisma | 6.19.2 | ORM, transactions | Existing stack |
| React | 18.x | UI, state management | Existing stack |
| sonner | 2.0.7 | Toast notifications | Existing pattern |

### Data Refresh Pattern
| Pattern | Current Usage | Where Used |
|---------|---------------|------------|
| Manual fetch + setState | All data fetching | Pipeline board, detail sheets |
| setInterval polling | 60-second interval | NotificationBell |
| visibilitychange listener | Refresh on tab focus | NotificationBell |

### NOT Using (Important)
- react-query / TanStack Query - NOT installed, don't introduce
- SWR - NOT installed, don't introduce
- WebSockets - NOT in use, don't introduce

**Stay consistent:** Use fetch + useState + polling pattern that exists in NotificationBell.

## Architecture Patterns

### Current Data Flow (Pipeline Cards)
```
GET /api/deals
  -> includes { project: { id, title, revenue, potentialRevenue } }
  -> PipelineBoard local state
  -> PipelineCard renders deal.project data
```

The project include is ALREADY present. Cards just need to DISPLAY it.

### Recommended Enhancement: Live Metrics on Cards
```
1. Expand project include to add: status, costs aggregate
   GET /api/deals
     -> project: { id, title, revenue, potentialRevenue, status, _totalCosts }

2. Server-side aggregate costs (don't send full cost array)
   SELECT SUM(amount) as totalCosts FROM costs WHERE projectId = ?

3. Card displays: status badge + revenue/cost summary
```

### Recommended: Title Sync Pattern
```typescript
// When Project.title changes:
PATCH /api/projects/[id]
  -> Check if sourceDeal or sourcePotential exists
  -> If yes, update their title in same transaction
  -> Create ActivityLog entries for both entities
  -> Return updated project

// Transaction structure:
await prisma.$transaction(async (tx) => {
  // 1. Update project
  const project = await tx.project.update({ ... })

  // 2. Sync to source deal if exists
  if (project.sourceDealId) {
    await tx.deal.update({
      where: { projectId: project.id },
      data: { title: newTitle }
    })
  }

  // 3. Log activities
  await tx.activityLog.create({ ... })
})
```

### Recommended: Polling Refresh Pattern
```typescript
// In PipelineBoard, add polling similar to NotificationBell:
useEffect(() => {
  const fetchDeals = async () => { /* existing fetch logic */ }

  // Initial fetch
  fetchDeals()

  // Poll every 60 seconds
  const interval = setInterval(fetchDeals, 60000)

  // Refresh on tab focus
  const handleVisibility = () => {
    if (document.visibilityState === 'visible') fetchDeals()
  }
  document.addEventListener('visibilitychange', handleVisibility)

  return () => {
    clearInterval(interval)
    document.removeEventListener('visibilitychange', handleVisibility)
  }
}, [showArchived])
```

### Recommended Project Structure
```
src/
  app/
    api/
      activity-logs/
        route.ts              # GET activity logs (with filters)
      deals/
        route.ts              # Enhanced with costs aggregate
        [id]/route.ts         # No change needed
      potential-projects/
        route.ts              # Enhanced with costs aggregate
        [id]/route.ts         # No change needed
      projects/
        [id]/route.ts         # Add title sync logic
  components/
    pipeline/
      pipeline-card.tsx       # Add project metrics display
      pipeline-board.tsx      # Add polling refresh
    potential-projects/
      potential-card.tsx      # Add project metrics display
      potential-board.tsx     # Add polling refresh
    shared/
      activity-timeline.tsx   # Reusable activity display component
  lib/
    activity-utils.ts         # Activity logging helpers
```

### Anti-Patterns to Avoid
- **Don't introduce react-query:** Existing codebase uses fetch+state, keep consistent
- **Don't use WebSockets:** Over-engineering for this use case, polling is simpler
- **Don't fetch all costs client-side:** Aggregate on server to minimize payload
- **Don't sync bidirectionally on every field:** Only title needs sync back

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Date formatting | Custom formatter | date-fns (already installed) | Edge cases, i18n |
| Toast notifications | Custom toast system | sonner (already installed) | Animation, queue |
| Polling logic | Custom timing | setInterval + visibilitychange | Already proven in codebase |
| Transaction handling | Manual rollback | Prisma $transaction | ACID guarantees |

**Key insight:** The codebase already has patterns for everything needed. Follow existing patterns, don't innovate.

## Common Pitfalls

### Pitfall 1: Client-Side Cost Aggregation
**What goes wrong:** Fetching full costs array for each deal/potential, then summing client-side
**Why it happens:** Seems simpler than modifying API
**How to avoid:** Server-side aggregate with Prisma
```typescript
// DO THIS - server-side aggregate
const deals = await prisma.deal.findMany({
  include: {
    project: {
      include: {
        _count: { select: { costs: true } },
      },
      // Use Prisma aggregation for totalCosts
    }
  }
})

// Or compute manually:
const project = await prisma.project.findUnique({
  where: { id },
  include: {
    costs: { select: { amount: true } }
  }
})
const totalCosts = project.costs.reduce((sum, c) => sum + Number(c.amount), 0)
```
**Warning signs:** Large payloads, slow card rendering, repeated calculations

### Pitfall 2: Inconsistent Title Sync Direction
**What goes wrong:** Syncing title both ways creates loops or race conditions
**Why it happens:** Trying to make "bidirectional" mean "both directions simultaneously"
**How to avoid:** Clear sync direction:
- Project title changes -> sync TO deal/potential
- Deal/potential title changes -> NO sync (converted items are read-only anyway)
**Warning signs:** Infinite loops, conflicting titles, unclear source of truth

### Pitfall 3: Activity Log Explosion
**What goes wrong:** Logging every field change creates noise
**Why it happens:** Trying to be comprehensive
**How to avoid:** Only log significant changes:
- STAGE_CHANGED: Stage transitions
- TITLE_SYNCED: When title propagates
- REVENUE_UPDATED: When revenue changes
- CONVERTED: When deal/potential converts to project
**Warning signs:** Thousands of log entries per day, unreadable activity feed

### Pitfall 4: Polling Without Deduplication
**What goes wrong:** Full board re-render on every poll even when data unchanged
**Why it happens:** Not comparing before setting state
**How to avoid:**
```typescript
const fetchDeals = async () => {
  const response = await fetch('/api/deals')
  const newData = await response.json()
  // Only update if data actually changed
  setDeals(prev => {
    if (JSON.stringify(prev) === JSON.stringify(newData)) return prev
    return newData
  })
}
```
**Warning signs:** Flickering UI, excessive re-renders, performance degradation

### Pitfall 5: Missing Transaction for Title Sync
**What goes wrong:** Project title updates but deal/potential doesn't (or vice versa)
**Why it happens:** Not using Prisma transaction
**How to avoid:** Always use $transaction for multi-model updates
**Warning signs:** Mismatched titles, data inconsistency

## Code Examples

### Activity Log Creation Helper
```typescript
// src/lib/activity-utils.ts
import prisma from '@/lib/prisma'
import { ActivityEntityType, ActivityAction } from '@prisma/client'

interface LogActivityParams {
  entityType: ActivityEntityType
  entityId: string
  action: ActivityAction
  field?: string
  oldValue?: string
  newValue?: string
  userId?: string
}

export async function logActivity({
  entityType,
  entityId,
  action,
  field,
  oldValue,
  newValue,
  userId,
}: LogActivityParams) {
  return prisma.activityLog.create({
    data: {
      entityType,
      entityId,
      action,
      field,
      oldValue,
      newValue,
      userId,
    },
  })
}

// Convenience functions
export async function logTitleSync(
  sourceType: 'DEAL' | 'POTENTIAL',
  sourceId: string,
  oldTitle: string,
  newTitle: string,
  userId?: string
) {
  return logActivity({
    entityType: sourceType === 'DEAL' ? ActivityEntityType.DEAL : ActivityEntityType.POTENTIAL,
    entityId: sourceId,
    action: ActivityAction.TITLE_SYNCED,
    field: 'title',
    oldValue: oldTitle,
    newValue: newTitle,
    userId,
  })
}
```

### Enhanced Deals API with Cost Aggregate
```typescript
// src/app/api/deals/route.ts - Enhanced GET
export async function GET(request: NextRequest) {
  const { error } = await requireAuth()
  if (error) return error

  const { searchParams } = new URL(request.url)
  const showArchived = searchParams.get('showArchived') === 'true'

  const deals = await prisma.deal.findMany({
    where: {
      ...(showArchived ? {} : { isArchived: false }),
    },
    include: {
      company: { select: { id: true, name: true } },
      contact: { select: { id: true, name: true } },
      project: {
        select: {
          id: true,
          title: true,
          revenue: true,
          potentialRevenue: true,
          status: true,  // Added for live status display
          costs: {
            select: { amount: true },  // For server-side aggregation
          },
        },
      },
    },
    orderBy: [{ stage: 'asc' }, { position: 'asc' }],
  })

  // Serialize and aggregate costs
  const serialized = deals.map(deal => ({
    ...deal,
    value: deal.value ? Number(deal.value) : null,
    project: deal.project ? {
      id: deal.project.id,
      title: deal.project.title,
      revenue: deal.project.revenue ? Number(deal.project.revenue) : null,
      potentialRevenue: deal.project.potentialRevenue ? Number(deal.project.potentialRevenue) : null,
      status: deal.project.status,
      totalCosts: deal.project.costs.reduce((sum, c) => sum + Number(c.amount), 0),
    } : null,
  }))

  return NextResponse.json(serialized)
}
```

### Title Sync in Project Update
```typescript
// src/app/api/projects/[id]/route.ts - Enhanced PATCH
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requireEditor()
  if (error) return error

  const { id } = await params
  const body = await request.json()

  // Get current project with source links
  const currentProject = await prisma.project.findUnique({
    where: { id },
    include: {
      sourceDeal: { select: { id: true, title: true } },
      sourcePotential: { select: { id: true, title: true } },
    },
  })

  if (!currentProject) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  const titleChanged = body.title !== undefined && body.title !== currentProject.title

  // Use transaction if title is changing and has source
  const result = await prisma.$transaction(async (tx) => {
    // 1. Update project
    const project = await tx.project.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.status !== undefined && { status: body.status }),
        // ... other fields
      },
      include: {
        company: { select: { id: true, name: true } },
        sourceDeal: { select: { id: true, title: true } },
        sourcePotential: { select: { id: true, title: true } },
      },
    })

    // 2. Sync title back to source if changed
    if (titleChanged) {
      if (currentProject.sourceDeal) {
        await tx.deal.update({
          where: { id: currentProject.sourceDeal.id },
          data: { title: body.title },
        })
        // Log activity on deal
        await tx.activityLog.create({
          data: {
            entityType: 'DEAL',
            entityId: currentProject.sourceDeal.id,
            action: 'TITLE_SYNCED',
            field: 'title',
            oldValue: currentProject.sourceDeal.title,
            newValue: body.title,
            userId: session?.user?.id,
          },
        })
      }

      if (currentProject.sourcePotential) {
        await tx.potentialProject.update({
          where: { id: currentProject.sourcePotential.id },
          data: { title: body.title },
        })
        // Log activity on potential
        await tx.activityLog.create({
          data: {
            entityType: 'POTENTIAL',
            entityId: currentProject.sourcePotential.id,
            action: 'TITLE_SYNCED',
            field: 'title',
            oldValue: currentProject.sourcePotential.title,
            newValue: body.title,
            userId: session?.user?.id,
          },
        })
      }
    }

    return project
  })

  return NextResponse.json(result)
}
```

### Pipeline Card with Project Metrics
```typescript
// Enhancement to PipelineCard - project metrics section
interface Deal {
  // ... existing fields
  project?: {
    id: string
    title: string
    revenue: number | null
    potentialRevenue: number | null
    status: string
    totalCosts: number
  } | null
}

// Inside PipelineCard render, after conversion badge:
{deal.project && deal.stage === 'WON' && (
  <div className="mt-2 p-2 bg-gray-50 rounded-lg text-xs space-y-1">
    <div className="flex justify-between">
      <span className="text-gray-500">Status:</span>
      <Badge variant="outline" className={getProjectStatusColor(deal.project.status)}>
        {formatProjectStatus(deal.project.status)}
      </Badge>
    </div>
    {deal.project.revenue !== null && (
      <div className="flex justify-between">
        <span className="text-gray-500">Revenue:</span>
        <span className="font-medium text-green-600">
          {formatCurrency(deal.project.revenue)}
        </span>
      </div>
    )}
    {deal.project.totalCosts > 0 && (
      <div className="flex justify-between">
        <span className="text-gray-500">Costs:</span>
        <span className="font-medium text-red-600">
          {formatCurrency(deal.project.totalCosts)}
        </span>
      </div>
    )}
  </div>
)}
```

### Polling Hook for Board Refresh
```typescript
// In PipelineBoard.tsx, add to existing useEffects:
useEffect(() => {
  const fetchDeals = async () => {
    try {
      const response = await fetch(`/api/deals?showArchived=${showArchived}`)
      if (response.ok) {
        const newData = await response.json()
        setDeals(prev => {
          // Avoid unnecessary re-renders if data unchanged
          if (JSON.stringify(prev) === JSON.stringify(newData)) return prev
          return newData
        })
      }
    } catch (error) {
      console.error('Failed to refresh deals:', error)
    }
  }

  // Poll every 60 seconds
  const pollInterval = setInterval(fetchDeals, 60000)

  // Refresh on tab focus
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      fetchDeals()
    }
  }
  document.addEventListener('visibilitychange', handleVisibilityChange)

  return () => {
    clearInterval(pollInterval)
    document.removeEventListener('visibilitychange', handleVisibilityChange)
  }
}, [showArchived])
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual data refresh only | Polling + visibility | Existing in notification | Better UX for multi-user |
| Client aggregation | Server aggregation | Best practice | Performance |
| Separate API calls | Prisma includes | Existing pattern | Fewer roundtrips |

**Current best practices in this codebase:**
- Server-side includes for related data (already used)
- Prisma transactions for atomicity (already used in reorder)
- 60-second polling + visibility refresh (notification bell)
- sonner for user feedback (widely used)

## Open Questions

Things that couldn't be fully resolved:

1. **Activity Log UI Location**
   - What we know: ActivityLog model exists, needs display component
   - What's unclear: Where exactly to show (card detail sheet? separate tab? popover?)
   - Recommendation: Add collapsible section in DealDetailSheet/PotentialDetailSheet, similar to costs section

2. **Polling Interval Optimization**
   - What we know: 60 seconds works for notifications
   - What's unclear: Is 60s right for pipeline boards? More frequent needed?
   - Recommendation: Start with 60s, adjust based on user feedback. Could add manual "Refresh" button as backup.

3. **Activity Log Retention**
   - What we know: No cleanup strategy defined
   - What's unclear: How long to keep logs? Could grow unbounded.
   - Recommendation: Document as future cleanup task, not blocking for MVP

## Sources

### Primary (HIGH confidence)
- Prisma schema.prisma - ActivityLog model, relationships, enums
- Existing API routes - /api/deals, /api/potential-projects, /api/projects
- NotificationBell component - Polling pattern

### Secondary (MEDIUM confidence)
- Existing card components - Current structure and data display patterns
- Pipeline board - Current state management approach

### Tertiary (LOW confidence)
- None needed - all patterns exist in codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - verified from package.json and existing code
- Architecture: HIGH - based on existing patterns in codebase
- Pitfalls: HIGH - derived from understanding existing patterns and common mistakes

**Research date:** 2026-01-25
**Valid until:** 60 days (patterns are stable, no external dependencies)
