# Phase 3: Kanban Quick Actions - Research

**Researched:** 2026-01-20
**Domain:** Radix UI dropdown menus with submenus, dnd-kit integration, inline updates
**Confidence:** HIGH

## Summary

This phase makes the existing "Change Status" and "Reassign" menu items in the Kanban card dropdown functional. The current implementation at `/src/components/kanban/kanban-card.tsx` already has the UI in place - a hover-triggered dropdown menu with these items, but they perform no action. The requirements specify right-click context menu, but the existing pattern uses hover-based dropdown which provides the same functionality with better discoverability.

The API endpoint `PATCH /api/initiatives/[id]` already supports both `status` and `personInCharge` updates (verified in code lines 77-117). The primary work is: (1) adding submenus to the dropdown to show status/person options, and (2) wiring the selection handlers to call the API and update local state.

**Primary recommendation:** Enhance the existing DropdownMenu with submenus using `DropdownMenuSub`, `DropdownMenuSubTrigger`, and `DropdownMenuSubContent`. The codebase already has these components available in the dropdown-menu.tsx file (lines 21-57). Pass an `onStatusChange` and `onReassign` callback from KanbanBoard to KanbanCard.

## Standard Stack

This phase uses only technologies already in the codebase - no new dependencies needed.

### Core (Already Installed)
| Library | Version | Purpose | Notes |
|---------|---------|---------|-------|
| @radix-ui/react-dropdown-menu | 2.1.16 | Dropdown with submenus | Already wrapped in shadcn/ui |
| @dnd-kit/sortable | 10.0.0 | Sortable cards | Already in use, pattern for stopPropagation exists |

### UI Components (Already Available)
| Component | Location | Purpose | When to Use |
|-----------|----------|---------|-------------|
| DropdownMenuSub | `@/components/ui/dropdown-menu` | Submenu container | Wraps status/person options |
| DropdownMenuSubTrigger | `@/components/ui/dropdown-menu` | Opens submenu | "Change Status", "Reassign" items |
| DropdownMenuSubContent | `@/components/ui/dropdown-menu` | Submenu popup | Contains status/person options |
| DropdownMenuRadioGroup | `@/components/ui/dropdown-menu` | Single selection | Status options (one active) |
| DropdownMenuRadioItem | `@/components/ui/dropdown-menu` | Radio option | Individual status/person |

### Decision: Dropdown Menu vs Context Menu

| Approach | Pros | Cons |
|----------|------|------|
| **Dropdown Menu (Current)** | Already implemented, visible trigger, better discoverability, works with touch | Requires hover to see trigger |
| Context Menu (Right-click) | Native feel, no visible trigger | Less discoverable, conflicts with dnd-kit, requires additional component |

**Recommendation:** Keep the existing dropdown menu pattern. The requirements mention "right-click" but the existing hover-based dropdown is superior for this use case because:
1. The trigger button already exists and uses `stopPropagation` to avoid drag conflicts
2. Touch devices don't have right-click
3. Users can see the menu option (better UX)
4. No additional component installation needed

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| DropdownMenu | ContextMenu | Would need to install new component, add right-click handler to card, handle dnd-kit conflicts |
| Submenu for status | Dialog with Select | More disruptive UX, requires more clicks |
| Radio items | Checkbox items | Status is single-select, radio is semantically correct |

**Installation:** No new packages needed.

## Architecture Patterns

### Recommended Changes
```
src/
├── components/
│   └── kanban/
│       ├── kanban-card.tsx        # MODIFY: Add submenus, accept callbacks
│       └── kanban-board.tsx       # MODIFY: Pass update handlers to cards
```

### Pattern 1: Submenu with Radio Selection for Status

**What:** Replace flat menu items with submenu containing status options
**When to use:** When user needs to pick from a list of predefined options
**Example:**
```typescript
// Source: Existing dropdown-menu.tsx components (lines 21-57)
<DropdownMenuSub>
  <DropdownMenuSubTrigger>
    <RefreshCw className="h-4 w-4 mr-2" />
    Change Status
  </DropdownMenuSubTrigger>
  <DropdownMenuSubContent className="w-44">
    <DropdownMenuRadioGroup value={item.status} onValueChange={handleStatusChange}>
      {STATUS_OPTIONS.map(opt => (
        <DropdownMenuRadioItem key={opt.value} value={opt.value}>
          <span className={cn('px-2 py-0.5 rounded text-xs mr-2', getStatusColor(opt.value))}>
            {opt.label}
          </span>
        </DropdownMenuRadioItem>
      ))}
    </DropdownMenuRadioGroup>
  </DropdownMenuSubContent>
</DropdownMenuSub>
```

### Pattern 2: Callback Props for State Updates

**What:** KanbanCard receives callbacks, KanbanBoard owns the state update logic
**When to use:** When child components need to trigger state changes owned by parent
**Example:**
```typescript
// KanbanCard props
interface KanbanCardProps {
  item: Initiative
  isDragging?: boolean
  onClick?: () => void
  onStatusChange?: (id: string, status: string) => Promise<void>
  onReassign?: (id: string, personInCharge: string | null) => Promise<void>
}

// KanbanBoard passes handlers
<KanbanCard
  key={item.id}
  item={item}
  onClick={() => handleCardClick(item)}
  onStatusChange={handleStatusChange}
  onReassign={handleReassign}
/>
```

### Pattern 3: Optimistic Updates with API Sync

**What:** Update local state immediately, then persist to API
**When to use:** For instant UI feedback on quick actions
**Example:**
```typescript
// From existing kanban-board.tsx pattern (handleInitiativeUpdate at line 274)
const handleStatusChange = async (id: string, newStatus: string) => {
  // 1. Optimistic local update
  setInitiatives(prev =>
    prev.map(item => (item.id === id ? { ...item, status: newStatus } : item))
  )

  // 2. Persist to API
  try {
    const response = await fetch(`/api/initiatives/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    if (!response.ok) {
      // Revert on failure (optional)
      console.error('Failed to update status')
    }
  } catch (error) {
    console.error('Failed to update status:', error)
  }
}
```

### Pattern 4: stopPropagation for Drag Isolation

**What:** Prevent dropdown interactions from triggering drag
**When to use:** Any interactive element inside a draggable item
**Example (already in codebase at kanban-card.tsx lines 107-108):**
```typescript
<Button
  onPointerDown={(e) => e.stopPropagation()}
  onClick={(e) => e.stopPropagation()}
>
```

### Anti-Patterns to Avoid
- **Opening dialog for single-field changes:** Use inline submenu, not modal
- **Full page reload after status change:** Use local state update
- **Separate API call for status vs position:** Both use PATCH endpoint
- **Context menu on draggable without stopPropagation:** Will trigger drag on right-click

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Status options | Inline array | `STATUS_OPTIONS` from utils.ts | Single source of truth |
| Person options | Inline array | `TEAM_MEMBER_OPTIONS` from utils.ts | Single source of truth |
| Status colors | Inline styles | `getStatusColor` from utils.ts | Consistent with app |
| API updates | Full PUT | PATCH endpoint | Already supports partial updates |
| Submenu components | Custom dropdown | shadcn DropdownMenuSub | Already available |

**Key insight:** The existing codebase already has 95% of what this phase needs. The work is primarily wiring existing components together.

## Common Pitfalls

### Pitfall 1: Submenu Not Appearing
**What goes wrong:** SubTrigger is clicked but submenu doesn't open
**Why it happens:** Missing DropdownMenuSub wrapper or wrong nesting
**How to avoid:** Ensure structure is `Sub > SubTrigger + SubContent`
**Warning signs:** Menu item looks clickable but nothing happens

### Pitfall 2: Drag Starts When Clicking Menu
**What goes wrong:** Opening dropdown starts dragging the card
**Why it happens:** PointerDown event propagates to sortable listeners
**How to avoid:** Add `onPointerDown={(e) => e.stopPropagation()}` to trigger
**Warning signs:** Card moves when trying to click menu (already solved in current code)

### Pitfall 3: Card Moves to Wrong Column After Status Change
**What goes wrong:** Card status changes but card stays in old column visually
**Why it happens:** Kanban columns filter by status, but local state not updated
**How to avoid:** Ensure setInitiatives updates the status field properly
**Warning signs:** Card shows new status badge but is in wrong column

### Pitfall 4: Menu Stays Open After Selection
**What goes wrong:** After selecting status, dropdown remains visible
**Why it happens:** DropdownMenuRadioItem doesn't auto-close by default in some patterns
**How to avoid:** Radix dropdown closes by default on item selection - verify this behavior
**Warning signs:** User must manually close menu after each action

### Pitfall 5: Stale Closure in Callback
**What goes wrong:** Status change uses old item data
**Why it happens:** Callback captures item from render time, not current state
**How to avoid:** Use item.id to lookup current state, or pass id only
**Warning signs:** Changing status on one card affects different card

## Code Examples

Verified patterns from official sources and existing codebase:

### Example 1: Complete Submenu for Status Change
```typescript
// Based on existing dropdown-menu.tsx structure and STATUS_OPTIONS from utils.ts
import {
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu'
import { STATUS_OPTIONS, getStatusColor } from '@/lib/utils'

// Inside DropdownMenuContent:
<DropdownMenuSub>
  <DropdownMenuSubTrigger onPointerDown={(e) => e.stopPropagation()}>
    <RefreshCw className="h-4 w-4 mr-2" />
    Change Status
  </DropdownMenuSubTrigger>
  <DropdownMenuSubContent className="w-48">
    <DropdownMenuRadioGroup
      value={item.status}
      onValueChange={(value) => {
        onStatusChange?.(item.id, value)
      }}
    >
      {STATUS_OPTIONS.map(opt => (
        <DropdownMenuRadioItem
          key={opt.value}
          value={opt.value}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <span className={cn('px-2 py-0.5 rounded text-xs mr-2', getStatusColor(opt.value))}>
            {opt.label}
          </span>
        </DropdownMenuRadioItem>
      ))}
    </DropdownMenuRadioGroup>
  </DropdownMenuSubContent>
</DropdownMenuSub>
```

### Example 2: Submenu for Reassignment
```typescript
// Based on existing TEAM_MEMBER_OPTIONS from utils.ts
import { TEAM_MEMBER_OPTIONS } from '@/lib/utils'

<DropdownMenuSub>
  <DropdownMenuSubTrigger onPointerDown={(e) => e.stopPropagation()}>
    <UserPlus className="h-4 w-4 mr-2" />
    Reassign
  </DropdownMenuSubTrigger>
  <DropdownMenuSubContent className="w-36">
    <DropdownMenuRadioGroup
      value={item.personInCharge || ''}
      onValueChange={(value) => {
        onReassign?.(item.id, value || null)
      }}
    >
      <DropdownMenuRadioItem value="" onPointerDown={(e) => e.stopPropagation()}>
        Unassigned
      </DropdownMenuRadioItem>
      {TEAM_MEMBER_OPTIONS.map(opt => (
        <DropdownMenuRadioItem
          key={opt.value}
          value={opt.value}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {opt.label}
        </DropdownMenuRadioItem>
      ))}
    </DropdownMenuRadioGroup>
  </DropdownMenuSubContent>
</DropdownMenuSub>
```

### Example 3: Update Handler in KanbanBoard
```typescript
// Add to kanban-board.tsx alongside existing handleInitiativeUpdate
const handleStatusChange = async (id: string, newStatus: string) => {
  // Optimistic update
  setInitiatives(prev =>
    prev.map(item => (item.id === id ? { ...item, status: newStatus } : item))
  )

  // Persist to API (existing PATCH endpoint at line 77 of API route)
  try {
    const response = await fetch(`/api/initiatives/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    if (!response.ok) {
      console.error('Failed to update status:', await response.text())
    }
  } catch (error) {
    console.error('Failed to update status:', error)
  }
}

const handleReassign = async (id: string, personInCharge: string | null) => {
  // Optimistic update
  setInitiatives(prev =>
    prev.map(item => (item.id === id ? { ...item, personInCharge } : item))
  )

  // Persist to API
  try {
    const response = await fetch(`/api/initiatives/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ personInCharge }),
    })
    if (!response.ok) {
      console.error('Failed to reassign:', await response.text())
    }
  } catch (error) {
    console.error('Failed to reassign:', error)
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Custom dropdown | Radix DropdownMenu | shadcn/ui era | Already using |
| Modal for quick edits | Inline submenu | Modern UX | Less disruption |
| Right-click context menu | Hover dropdown | Mobile-friendly | Better accessibility |

**Already using current approaches:** The codebase uses modern patterns.

## Open Questions

Things that couldn't be fully resolved:

1. **Right-click vs Hover Dropdown**
   - What we know: Requirements say "right-clicks Kanban card" but existing code uses hover dropdown
   - What's unclear: Is right-click a hard requirement or just describing the action concept?
   - Recommendation: Keep hover dropdown - it's already working and more accessible

2. **Error Handling for Failed Updates**
   - What we know: Current pattern logs errors to console
   - What's unclear: Should there be user-visible feedback on failure?
   - Recommendation: Keep console logging for MVP, could add toast later

3. **Swimlane View Support**
   - What we know: There's also a "By Person" swimlane view
   - What's unclear: Should quick actions work there too?
   - Recommendation: If using same KanbanCard component, it will work automatically

## Sources

### Primary (HIGH confidence)
- Codebase: `/src/components/kanban/kanban-card.tsx` - Existing dropdown menu pattern
- Codebase: `/src/components/ui/dropdown-menu.tsx` - Available submenu components
- Codebase: `/src/app/api/initiatives/[id]/route.ts` - PATCH endpoint for status/person updates
- Codebase: `/src/lib/utils.ts` - STATUS_OPTIONS, TEAM_MEMBER_OPTIONS constants

### Secondary (MEDIUM confidence)
- [Dropdown Menu - shadcn/ui](https://ui.shadcn.com/docs/components/dropdown-menu) - Submenu patterns
- [Dropdown Menu - Radix Primitives](https://www.radix-ui.com/primitives/docs/components/dropdown-menu) - API documentation

### Tertiary (LOW confidence)
- None - all findings verified against codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All components already in use
- Architecture: HIGH - Extending existing pattern, not creating new one
- Pitfalls: HIGH - Based on actual dnd-kit + dropdown interactions in codebase

**Research date:** 2026-01-20
**Valid until:** 2026-02-20 (stable patterns, unlikely to change)

---

## Key Implementation Notes for Planner

1. **Files to Modify:**
   - `/src/components/kanban/kanban-card.tsx` - Add submenus, add callback props
   - `/src/components/kanban/kanban-board.tsx` - Add handlers, pass to cards

2. **No New Files Needed:**
   - All components already exist
   - API endpoint already supports the operations

3. **Existing Code to Leverage:**
   - `STATUS_OPTIONS` from utils.ts (6 status values)
   - `TEAM_MEMBER_OPTIONS` from utils.ts (3 team members)
   - `getStatusColor` from utils.ts (badge styling)
   - PATCH endpoint already handles status and personInCharge

4. **Phase 1 Patterns to Reuse:**
   - Optimistic update pattern from initiative-detail-sheet.tsx
   - stopPropagation pattern already in kanban-card.tsx

5. **Scope Clarification:**
   - KANB-01: "Change Status" via submenu with 6 status options
   - KANB-02: "Reassign" via submenu with 3 team members + "Unassigned"
