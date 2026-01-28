# Phase 70 Verification: Sidebar Drag-and-Drop Reorder

status: passed

## Phase Goal
Users can personalize sidebar navigation order by dragging items within groups on the Settings page

## Must-Haves Verification

### REORD-01: Settings page shows nav items with drag handles
- **Status:** PASS
- **Evidence:** `GripVertical` icon imported and rendered in `SortableNavItem` component (settings/page.tsx:82)
- Each nav group item has a drag handle button with `cursor-grab` styling

### REORD-02: User can drag to reorder items within a group
- **Status:** PASS
- **Evidence:** `DndContext` + `SortableContext` with `verticalListSortingStrategy` wraps each group's items (settings/page.tsx:341-369)
- `handleDragEnd` uses `arrayMove` to update `localOrder` state
- `useSortable` hook provides transform/transition for smooth drag animation

### REORD-03: Items cannot be dragged between groups
- **Status:** PASS
- **Evidence:** Separate `DndContext` per nav group (settings/page.tsx:341). Each group is an isolated DnD context, so items cannot be dragged across group boundaries.

### REORD-04: Custom order persisted per-user in UserPreferences
- **Status:** PASS
- **Evidence:** `navItemOrder Json? @map("nav_item_order")` field in Prisma schema (schema.prisma:622)
- API GET returns `navItemOrder` (route.ts:30), PATCH accepts and persists it (route.ts:66-68)
- `saveNavOrder()` in hook PATCHes to API and updates local state

### REORD-05: Sidebar renders items in user's custom order
- **Status:** PASS
- **Evidence:** Desktop sidebar uses `getOrderedItems(group.key, group.items)` before visibility filter (sidebar.tsx:25)
- Mobile sidebar uses same pattern (mobile-sidebar.tsx:28)
- `filterVisible` prop also applies ordering before filtering (sidebar.tsx:63, mobile-sidebar.tsx:75)

### REORD-06: Reset Order button restores default order
- **Status:** PASS
- **Evidence:** `handleResetOrder` calls `setLocalOrder(getDefaultNavOrder())` (settings/page.tsx:205)
- `getDefaultNavOrder()` helper returns hrefs from nav-config.ts groups (nav-config.ts:148-153)
- Reset Order button with `RotateCcw` icon shown when `isOrderDirty` (settings/page.tsx:420-428)

### REORD-07: New nav items in future deploys appear at end
- **Status:** PASS
- **Evidence:** `getOrderedItems()` in hook sorts known items by saved order, unknown items get `order.length` index (use-nav-visibility.ts:92-93)
- Settings page `getOrderedGroupItems()` appends items not in `orderedHrefs` at end (settings/page.tsx:232-235)

## Success Criteria

1. Settings page shows drag handles on nav items and user can drag to reorder within a group but not between groups -- **PASS**
2. Custom order persists per-user across sessions and the sidebar renders items in the saved order -- **PASS**
3. Reset Order button restores the default order from nav-config.ts -- **PASS**
4. New nav items added in future deploys appear at the end of the appropriate group for users with custom order -- **PASS**

## Score: 7/7 must-haves verified
