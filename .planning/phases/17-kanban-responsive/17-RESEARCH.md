# Phase 17: Kanban Responsive - Research

**Researched:** 2026-01-22
**Domain:** Touch-friendly Kanban boards, mobile drag-and-drop, responsive horizontal scrolling
**Confidence:** HIGH

## Summary

This phase makes all three Kanban boards (Initiatives, Pipeline, Potential Projects) work effectively on touch devices. The current implementation uses dnd-kit for drag-and-drop with PointerSensor, which has known issues on mobile. The columns are fixed at 320px (`w-80`) width with no responsive behavior, and quick actions menus show on hover (unusable on touch devices).

The standard approach involves:
1. **Touch Sensor Configuration** - Add TouchSensor alongside PointerSensor with delay/tolerance constraints to distinguish scrolling from dragging
2. **Horizontal Scroll Container** - Make board container horizontally scrollable with CSS snap points so partial columns are visible
3. **Touch-Friendly Cards** - Increase tap target sizes, make quick actions accessible via tap (not hover)
4. **Responsive Column Width** - Columns should be 75-80% viewport width on mobile to show edges of adjacent columns

**Primary recommendation:** Configure dnd-kit with both MouseSensor + TouchSensor (NOT PointerSensor) for reliable cross-device support. Use CSS scroll-snap for horizontal column navigation. Replace hover-based quick actions with a visible tap target on mobile.

## Standard Stack

### Core (Already in Project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @dnd-kit/core | 6.3.1 | Drag-and-drop context | Already in use, has TouchSensor |
| @dnd-kit/sortable | 10.0.0 | Sortable lists | Already in use for cards |
| Tailwind CSS | 3.4.1 | Responsive utilities, scroll-snap | `md:` breakpoint, scroll-snap classes |
| shadcn/ui Sheet | (Radix) | Bottom sheet for actions | Already in project |

### Supporting (May Need)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| N/A | | | All needed components already present |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| TouchSensor | PointerSensor only | PointerSensor has documented issues on touch devices |
| CSS scroll-snap | JS-based swiper | CSS is simpler, no extra dependency |
| Bottom Sheet actions | Long-press context menu | Long-press conflicts with drag; tap is clearer |

**Installation:**
No new packages needed. All functionality available in existing stack.

## Architecture Patterns

### Recommended Project Structure
```
src/
components/
  kanban/
    kanban-board.tsx         # UPDATE: Add touch sensors, responsive wrapper
    kanban-column.tsx        # UPDATE: Responsive width on mobile
    kanban-card.tsx          # UPDATE: Touch-friendly quick actions
    kanban-card-actions.tsx  # NEW: Extracted mobile-friendly action menu
  pipeline/
    pipeline-board.tsx       # UPDATE: Same touch sensor changes
    pipeline-column.tsx      # UPDATE: Responsive width
    pipeline-card.tsx        # UPDATE: Touch-friendly
  potential-projects/
    potential-board.tsx      # UPDATE: Same touch sensor changes
    potential-column.tsx     # UPDATE: Responsive width
    potential-card.tsx       # UPDATE: Touch-friendly
```

### Pattern 1: Dual Sensor Configuration (MouseSensor + TouchSensor)
**What:** Use separate MouseSensor and TouchSensor instead of PointerSensor
**When to use:** All Kanban boards with drag-and-drop
**Example:**
```typescript
// Source: https://docs.dndkit.com/api-documentation/sensors/touch
import {
  DndContext,
  MouseSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'

const mouseSensor = useSensor(MouseSensor, {
  activationConstraint: {
    distance: 5, // 5px movement before drag starts
  },
})

const touchSensor = useSensor(TouchSensor, {
  activationConstraint: {
    delay: 250,     // Hold for 250ms before drag
    tolerance: 5,   // Allow 5px movement during delay
  },
})

const keyboardSensor = useSensor(KeyboardSensor, {
  coordinateGetter: sortableKeyboardCoordinates,
})

const sensors = useSensors(mouseSensor, touchSensor, keyboardSensor)

return (
  <DndContext sensors={sensors} ...>
    {/* board content */}
  </DndContext>
)
```

### Pattern 2: Horizontal Scroll Container with Snap Points
**What:** Make board horizontally scrollable with CSS snap to show partial columns
**When to use:** Board wrapper on mobile screens
**Example:**
```typescript
// Source: https://developer.mozilla.org/en-US/docs/Web/CSS/scroll-snap-type
// Board container
<div className={cn(
  "flex gap-4 pb-4",
  // Desktop: standard layout
  "md:min-w-max",
  // Mobile: horizontal scroll with snap
  "overflow-x-auto snap-x snap-mandatory",
  "overscroll-x-contain" // Prevent page scroll when at edges
)}>
  {columns.map(column => (
    <KanbanColumn key={column.id} ... />
  ))}
</div>

// Column - responsive width
<div className={cn(
  // Mobile: 75% width so edges of adjacent columns show
  "w-[75vw] min-w-[280px]",
  // Desktop: fixed width
  "md:w-80",
  "shrink-0 snap-start", // Snap point at start of each column
  ...otherClasses
)}>
```

### Pattern 3: Touch-Friendly Quick Actions (Always-Visible Trigger)
**What:** Replace hover-only quick actions with visible tap target on mobile
**When to use:** Cards that need status change, reassign actions
**Example:**
```typescript
// Source: https://www.nngroup.com/articles/contextual-menus-guidelines/
// Card component - action button visible on mobile, hover on desktop
<div className="group relative ...">
  {/* Content */}
  <div className="p-4">
    <div className="flex items-center justify-between mb-3">
      <span className="text-sm font-medium">{title}</span>
      {/* Mobile: Always visible; Desktop: visible on hover */}
      {canEdit && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className={cn(
                "h-8 w-8 shrink-0",
                // Mobile: always visible
                "md:opacity-0 md:group-hover:opacity-100",
                "transition-opacity"
              )}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {/* Status change, reassign, view details */}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
    {/* Rest of card content */}
  </div>
</div>
```

### Pattern 4: Responsive Filter Bar
**What:** Make filter bar scrollable or collapsible on mobile
**When to use:** KanbanFilterBar on initiative board
**Example:**
```typescript
// Filter bar - horizontal scroll on mobile
<div className={cn(
  "flex items-center gap-3",
  // Mobile: horizontal scroll
  "overflow-x-auto",
  // Desktop: fixed width
  "md:overflow-visible",
  "p-3 bg-white/70 backdrop-blur-xl rounded-2xl"
)}>
  {/* Filters remain same but container scrolls */}
</div>
```

### Anti-Patterns to Avoid
- **Using PointerSensor alone:** Has documented issues on touch devices. Use MouseSensor + TouchSensor instead.
- **Setting `touch-action: none` on the board container:** Prevents scrolling. Only set on individual draggable cards.
- **Hover-only interactions:** Touch devices have no hover state. Provide visible tap targets.
- **Fixed-width columns without viewport-relative sizing on mobile:** No column edges visible, user doesn't know more columns exist.
- **Long-press for both drag AND context menu:** Confusing. Use long-press for drag, tap for quick actions.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Touch drag detection | Custom touchmove handlers | dnd-kit TouchSensor | Handles edge cases, activation constraints |
| Horizontal scroll snap | JS-based swiper/carousel | CSS scroll-snap | Native performance, no JS needed |
| Mobile action menu | Custom long-press handler | DropdownMenu with visible trigger | shadcn/ui handles accessibility |
| Scroll container edge shadows | Manual box-shadow on scroll | CSS `overscroll-behavior` + gradient masks | Cleaner, performant |

**Key insight:** dnd-kit already has all the touch sensor capabilities built in - just need to configure them correctly instead of relying on PointerSensor default.

## Common Pitfalls

### Pitfall 1: PointerSensor Doesn't Work Well on Touch
**What goes wrong:** Drag feels choppy, conflicts with scroll, doesn't start reliably
**Why it happens:** PointerSensor tries to handle both mouse and touch with same config; documented in issue #435
**How to avoid:** Use MouseSensor + TouchSensor with separate configurations
**Warning signs:** "Dragging with PointerSensor does not work well on touch devices"

### Pitfall 2: touch-action: none on Wrong Element
**What goes wrong:** User can't scroll the board horizontally
**Why it happens:** `touch-none` class (already on cards) is correct; putting it on board breaks scroll
**How to avoid:** Only apply `touch-none` to individual draggable items, NOT the scrollable container
**Warning signs:** Can drag cards but can't scroll to see other columns

### Pitfall 3: No Visual Indicator for More Columns
**What goes wrong:** User on mobile doesn't realize there are more columns
**Why it happens:** Columns sized at 100% viewport width, no partial columns visible
**How to avoid:** Size columns at 75-80% viewport width on mobile; use scroll-snap-align: start
**Warning signs:** Users complain they can only see "To Do" column

### Pitfall 4: Quick Actions Menu Inaccessible on Touch
**What goes wrong:** Users can't change status or reassign from Kanban card
**Why it happens:** Menu only shows on hover; touch devices don't have hover
**How to avoid:** Make action button always visible on mobile (md:opacity-0 md:group-hover:opacity-100)
**Warning signs:** Users have to open full detail sheet for simple status change

### Pitfall 5: Drag Interferes with Card Click
**What goes wrong:** Tapping to view details triggers drag instead
**Why it happens:** No delay on touch sensor; any touch starts drag
**How to avoid:** TouchSensor `delay: 250` with `tolerance: 5` - tap fires click, hold starts drag
**Warning signs:** Users accidentally drag when trying to tap cards

### Pitfall 6: Filter Bar Too Wide on Mobile
**What goes wrong:** Filter bar pushes off screen, controls cut off
**Why it happens:** All filters visible at once don't fit mobile width
**How to avoid:** Make filter bar horizontally scrollable OR collapse into dropdown
**Warning signs:** Filters partially visible, can't clear filters

## Code Examples

Verified patterns from official sources:

### Complete Touch-Enabled Board Setup
```typescript
// Source: https://docs.dndkit.com/api-documentation/sensors
'use client'

import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { cn } from '@/lib/utils'

export function ResponsiveKanbanBoard({ initialData }) {
  // Configure sensors for cross-device support
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: { distance: 5 },
  })

  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 250,     // 250ms hold to start drag
      tolerance: 5,   // 5px tolerance during delay
    },
  })

  const keyboardSensor = useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates,
  })

  const sensors = useSensors(mouseSensor, touchSensor, keyboardSensor)

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={...}
      onDragStart={...}
      onDragOver={...}
      onDragEnd={...}
    >
      {/* Responsive scrollable board container */}
      <div className={cn(
        "flex gap-4 pb-4",
        // Mobile: scrollable with snap
        "overflow-x-auto snap-x snap-mandatory overscroll-x-contain",
        // Desktop: standard min-width
        "md:min-w-max"
      )}>
        {COLUMNS.map(column => (
          <ResponsiveColumn key={column.id} column={column}>
            <SortableContext items={...} strategy={verticalListSortingStrategy}>
              {/* Cards */}
            </SortableContext>
          </ResponsiveColumn>
        ))}
      </div>

      <DragOverlay>
        {/* Dragged card preview */}
      </DragOverlay>
    </DndContext>
  )
}
```

### Responsive Column Component
```typescript
// Source: https://css-tricks.com/practical-css-scroll-snapping/
export function ResponsiveColumn({ id, title, colorDot, count, children }) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        // Mobile: 75% viewport width to show adjacent column edges
        "w-[75vw] min-w-[280px] max-w-[320px]",
        // Desktop: fixed width
        "md:w-80 md:min-w-0 md:max-w-none",
        // Shared styles
        "shrink-0 rounded-2xl",
        "bg-gray-50/50 backdrop-blur-sm",
        // Snap alignment
        "snap-start",
        isOver && "ring-2 ring-blue-400/50"
      )}
    >
      {/* Header */}
      <div className="p-4 flex items-center gap-2">
        <div className={cn("w-2 h-2 rounded-full", colorDot)} />
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <span className="ml-auto text-sm text-gray-500 bg-white/60 px-2.5 py-1 rounded-full">
          {count}
        </span>
      </div>

      {/* Cards Container - adequate touch target spacing */}
      <div className="p-3 pt-0 space-y-3 min-h-[200px]">
        {children}
      </div>
    </div>
  )
}
```

### Touch-Friendly Card with Visible Actions
```typescript
// Source: https://www.nngroup.com/articles/contextual-menus-guidelines/
export function TouchFriendlyCard({ item, onClick, onStatusChange, onReassign, canEdit }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled: !canEdit,
  })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      className={cn(
        "group relative bg-white rounded-2xl shadow-apple",
        "hover:shadow-apple-hover hover:scale-[1.02]",
        "transition-all duration-200",
        canEdit && "cursor-grab active:cursor-grabbing touch-none",
        isDragging && "opacity-60 shadow-xl scale-105"
      )}
    >
      <div className="p-4">
        {/* Header with title and VISIBLE action button */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div
            className="text-sm font-medium text-gray-900 line-clamp-2 cursor-pointer flex-1"
            onClick={(e) => { e.stopPropagation(); onClick?.(); }}
            onPointerDown={(e) => e.stopPropagation()}
          >
            {item.title}
          </div>

          {/* Quick Actions - visible on mobile, hover on desktop */}
          {canEdit && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className={cn(
                    "h-8 w-8 -mr-2 -mt-1 shrink-0",
                    // Mobile: always visible
                    // Desktop: visible on hover
                    "md:opacity-0 md:group-hover:opacity-100",
                    "focus:opacity-100",
                    "transition-opacity"
                  )}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-4 w-4 text-gray-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onClick?.()}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                {/* Status change submenu */}
                {/* Reassign submenu */}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Footer content */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          {/* ... */}
        </div>
      </div>
    </div>
  )
}
```

### CSS Scroll Indicator (Gradient Fade at Edges)
```css
/* Source: CSS best practices for scroll containers */
/* Add to globals.css for visual scroll hint */
@layer utilities {
  .scroll-fade-x {
    mask-image: linear-gradient(
      to right,
      transparent,
      black 2rem,
      black calc(100% - 2rem),
      transparent
    );
    -webkit-mask-image: linear-gradient(
      to right,
      transparent,
      black 2rem,
      black calc(100% - 2rem),
      transparent
    );
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| PointerSensor for all | MouseSensor + TouchSensor separate | Best practice 2024+ | Reliable touch support |
| JS carousel libraries | CSS scroll-snap | 2020+ | Native, performant |
| Hover-only actions | Always-visible mobile triggers | Mobile-first design | Touch accessibility |
| Fixed column widths | Viewport-relative on mobile | Mobile-first | Shows more columns exist |
| 44px touch targets | 48px minimum recommended | WCAG 2.5.8 (2023) | Accessibility compliance |

**Deprecated/outdated:**
- Single PointerSensor: Use MouseSensor + TouchSensor combo
- Pure hover interactions: Provide tap alternatives on touch devices
- Full-width columns on mobile: Users don't see adjacent columns

## Open Questions

Things that couldn't be fully resolved:

1. **Drag handle vs whole card drag**
   - What we know: dnd-kit docs recommend drag handles for scrollable contexts
   - What's unclear: Is whole-card drag with delay sufficient, or need explicit handle?
   - Recommendation: Start with delay-based whole card drag (current pattern), add handle only if user testing shows issues

2. **Auto-scroll during drag**
   - What we know: dnd-kit has auto-scroll modifier but may conflict with snap scroll
   - What's unclear: How well does auto-scroll work with CSS snap-mandatory?
   - Recommendation: Test with proximity snap first; if auto-scroll issues, switch to mandatory

3. **Filter bar on mobile - scroll vs collapse**
   - What we know: Filter bar is wide, won't fit mobile
   - What's unclear: Should it scroll horizontally or collapse into "Filters" dropdown?
   - Recommendation: Try horizontal scroll first (simpler); collapse if testing shows confusion

## Sources

### Primary (HIGH confidence)
- [dnd-kit Touch Sensor documentation](https://docs.dndkit.com/api-documentation/sensors/touch) - TouchSensor configuration
- [dnd-kit Sensors overview](https://docs.dndkit.com/api-documentation/sensors) - Sensor combinations
- [CSS Scroll Snap MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/scroll-snap-type) - Snap type and alignment
- [Tailwind CSS scroll-snap-type](https://tailwindcss.com/docs/scroll-snap-type) - Utility classes

### Secondary (MEDIUM confidence)
- [CSS-Tricks Practical Scroll Snapping](https://css-tricks.com/practical-css-scroll-snapping/) - Implementation patterns
- [NN/G Contextual Menus Guidelines](https://www.nngroup.com/articles/contextual-menus-guidelines/) - Mobile action menu UX
- [dnd-kit GitHub Issue #435](https://github.com/clauderic/dnd-kit/issues/435) - PointerSensor touch issues

### Tertiary (LOW confidence)
- Community patterns for Kanban horizontal scroll
- Mobile-first workflow recommendations

## Metadata

**Confidence breakdown:**
- Touch sensors: HIGH - official dnd-kit documentation confirms approach
- Horizontal scroll: HIGH - CSS scroll-snap is well-documented standard
- Quick actions: HIGH - established UX pattern for mobile
- Filter bar responsive: MEDIUM - multiple valid approaches

**Research date:** 2026-01-22
**Valid until:** 2026-04-22 (3 months - stable patterns, no major library changes expected)
