# Phase 76 Research: Projects Kanban Board

## Overview

This research documents existing patterns in the codebase to enable implementation of a Projects Kanban Board view with enhanced project cards.

## 1. Existing Kanban Implementations

### 1.1 Tasks Kanban (`src/components/tasks/task-kanban-view.tsx`)

The most relevant pattern - a simpler implementation without swimlanes:

```typescript
// Key imports for dnd-kit
import {
  DndContext,
  DragOverlay,
  pointerWithin,
  rectIntersection,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  CollisionDetection,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
```

**Sensor configuration (with touch support):**
```typescript
const mouseSensor = useSensor(MouseSensor, {
  activationConstraint: { distance: 5 },
})
const touchSensor = useSensor(TouchSensor, {
  activationConstraint: {
    delay: 250,     // 250ms hold before drag starts
    tolerance: 5,   // 5px movement allowed during delay
  },
})
const keyboardSensor = useSensor(KeyboardSensor, {
  coordinateGetter: sortableKeyboardCoordinates,
})
const sensors = useSensors(mouseSensor, touchSensor, keyboardSensor)
```

**Custom collision detection:**
```typescript
const collisionDetection: CollisionDetection = useCallback((args) => {
  const pointerCollisions = pointerWithin(args)
  const columnCollision = pointerCollisions.find(
    collision => COLUMN_IDS.includes(collision.id as string)
  )
  if (columnCollision) return [columnCollision]
  const rectCollisions = rectIntersection(args)
  const itemCollision = rectCollisions.find(
    collision => !COLUMN_IDS.includes(collision.id as string)
  )
  if (itemCollision) return [itemCollision]
  return rectCollisions.length > 0 ? [rectCollisions[0]] : []
}, [])
```

### 1.2 Initiatives Kanban (`src/components/kanban/kanban-board.tsx`)

More complex with swimlane support - useful for understanding patterns but projects kanban will be simpler.

## 2. Column Components

### 2.1 Task Kanban Column (`src/components/tasks/task-kanban-column.tsx`)

Droppable column pattern:

```typescript
'use client'
import { useDroppable } from '@dnd-kit/core'

export function TaskKanbanColumn({ id, title, colorDot, count, children }) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        // Mobile: 75% viewport width to show adjacent column edges
        'w-[75vw] min-w-[280px] max-w-[320px]',
        // Desktop: fixed width
        'md:w-80 md:min-w-0 md:max-w-none',
        'shrink-0 rounded-2xl bg-gray-50/50 backdrop-blur-sm snap-start',
        isOver && 'ring-2 ring-blue-400/50'
      )}
    >
      {/* Header with color dot, title, count badge */}
      {/* Cards container with min-height */}
    </div>
  )
}
```

## 3. Card Components

### 3.1 Task Kanban Card (`src/components/tasks/task-kanban-card.tsx`)

Sortable card pattern with touch support:

```typescript
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

export function TaskKanbanCard({ task, isDragging, onClick }) {
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSorting,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  // Touch detection for tap vs drag
  const handleTouchStart = (e) => { /* track touch start */ }
  const handleTouchEnd = (e) => { /* detect tap if quick/minimal movement */ }

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div onClick={handleClick} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        {/* Card content */}
      </div>
      {/* Drag handle */}
      <div {...listeners} className="absolute left-0 ...">
        <GripVertical />
      </div>
    </div>
  )
}
```

### 3.2 Current Project Card (`src/components/projects/project-card.tsx`)

Current structure shows: title, company, revenue, status badge, source badge, internal badge, archived badge.

**Missing for Kanban card:**
- Date range (startDate to endDate)
- Task progress indicator (X/Y complete)
- Cost summary

## 4. Project Schema & Status

### 4.1 Project Status Enum (Prisma)

```prisma
enum ProjectStatus {
  DRAFT
  ACTIVE
  COMPLETED
  CANCELLED
}
```

### 4.2 Project Status Config (`src/lib/project-utils.ts`)

```typescript
export const PROJECT_STATUSES = [
  { id: 'DRAFT', title: 'Draft', colorDot: 'bg-gray-400' },
  { id: 'ACTIVE', title: 'Active', colorDot: 'bg-blue-500' },
  { id: 'COMPLETED', title: 'Completed', colorDot: 'bg-green-500' },
  { id: 'CANCELLED', title: 'Cancelled', colorDot: 'bg-red-400' },
]
```

### 4.3 Project API - PATCH Status

`PATCH /api/projects/[id]` already supports status updates:

```typescript
...(body.status !== undefined && { status: body.status as ProjectStatus }),
```

No new API routes needed - just call existing PATCH.

## 5. View Toggle Pattern

### 5.1 Tasks Page Client (`src/components/tasks/tasks-page-client.tsx`)

```typescript
const STORAGE_KEY = 'tasks-view-preference'

// Load preference from localStorage (SSR-safe)
useEffect(() => {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'table' || stored === 'kanban') {
    setViewMode(stored)
  }
}, [])

// Persist preference
const handleViewChange = (mode: string) => {
  setViewMode(mode)
  localStorage.setItem(STORAGE_KEY, mode)
}

// UI using shadcn Tabs
<Tabs value={viewMode} onValueChange={handleViewChange}>
  <TabsList>
    <TabsTrigger value="table">
      <TableIcon /> Table
    </TabsTrigger>
    <TabsTrigger value="kanban">
      <KanbanSquare /> Kanban
    </TabsTrigger>
  </TabsList>
</Tabs>
```

## 6. Data Requirements

### 6.1 Current Projects Page Query

```typescript
const projects = await prisma.project.findMany({
  where: { ...(showArchived !== 'true' ? { isArchived: false } : {}) },
  include: {
    company: { select: { id: true, name: true } },
    contact: { select: { id: true, name: true } },
    sourceDeal: { select: { id: true, title: true, stageChangedAt: true } },
    sourcePotential: { select: { id: true, title: true } },
    initiative: { select: { id: true, title: true } },
  },
  orderBy: { createdAt: 'desc' },
})
```

### 6.2 Additional Data Needed for Kanban Cards

```typescript
// Need to add to query:
_count: {
  select: {
    tasks: true,  // Total tasks count
  }
},
tasks: {
  where: { status: 'DONE' },
  select: { id: true },
},
costs: {
  select: { amount: true },
}
```

Or compute in separate query for efficiency:
```typescript
// Task counts by project
const taskCounts = await prisma.task.groupBy({
  by: ['projectId'],
  _count: { id: true },
  where: { parentId: null },
})

const taskDoneCounts = await prisma.task.groupBy({
  by: ['projectId'],
  _count: { id: true },
  where: { parentId: null, status: 'DONE' },
})

// Cost totals by project
const costTotals = await prisma.cost.groupBy({
  by: ['projectId'],
  _sum: { amount: true },
})
```

## 7. Mobile Scroll Pattern

Container styling for horizontal mobile scroll:

```typescript
<div
  className={cn(
    'flex gap-4 pb-4 pl-1',
    'overflow-x-auto scroll-pl-1',
    !isDragging && 'snap-x snap-mandatory',
    '[&::-webkit-scrollbar]:hidden [-webkit-overflow-scrolling:touch]',
    'md:min-w-max md:snap-none md:pl-0 md:scroll-pl-0'
  )}
>
  {columns.map(column => (...))}
</div>
```

## 8. Architecture Recommendation

### File Structure

```
src/
├── app/(dashboard)/projects/
│   └── page.tsx                    # Modified - add view toggle, pass data
├── components/projects/
│   ├── project-list.tsx            # Existing list view (refactor to client)
│   ├── projects-page-client.tsx    # NEW - view toggle, filter state
│   ├── projects-kanban-board.tsx   # NEW - dnd-kit board
│   ├── project-kanban-column.tsx   # NEW - droppable column
│   └── project-kanban-card.tsx     # NEW - enhanced card with drag
```

### Component Hierarchy

```
ProjectsPage (server)
  └── ProjectsPageClient (client)
        ├── [View Toggle Tabs]
        ├── [Filters]
        ├── ProjectList (existing, list view)
        └── ProjectsKanbanBoard (new, kanban view)
              ├── DndContext
              │     └── ProjectKanbanColumn × 4
              │           └── SortableContext
              │                 └── ProjectKanbanCard × N
              └── DragOverlay
                    └── ProjectKanbanCard
```

## 9. Key Patterns to Reuse

| Pattern | Source File | Use For |
|---------|-------------|---------|
| Sensors config | `task-kanban-view.tsx` | Touch + mouse + keyboard |
| Collision detection | `task-kanban-view.tsx` | Column-aware drop zones |
| Droppable column | `task-kanban-column.tsx` | Status columns |
| Sortable card | `task-kanban-card.tsx` | Draggable project cards |
| Touch tap detection | `task-kanban-card.tsx` | Open detail on tap |
| View toggle | `tasks-page-client.tsx` | List/Kanban switch |
| Status config | `project-utils.ts` | Column IDs and colors |

## RESEARCH COMPLETE
