# Phase 70 Research: Sidebar Drag-and-Drop Reorder

## Current Architecture

### Nav Config (`src/lib/nav-config.ts`)
- `navGroups` array defines 3 groups: saap, crm, admin
- Each group has `key`, `label`, `items[]`, optional `requireRole`
- Items can have `children[]` (Companies -> Departments, Contacts)
- `topLevelItems` are outside groups (Tasks, Members)
- `settingsItem` is a standalone item
- Export types: `NavItem`, `NavGroup`, `TopLevelNavItem`
- Helper: `isAlwaysVisible(href)` - Dashboard and Settings always visible
- Helper: `getAllNavHrefs()` - returns all item hrefs
- Helper: `findGroupForPath(pathname)` - maps pathname to group key

### Settings Page (`src/app/(dashboard)/settings/page.tsx`)
- Shows nav groups with toggles for visibility
- Uses `useNavVisibility()` hook for hidden items management
- Local state `localHidden` with dirty detection against persisted `hiddenItems`
- Save button appears when dirty, calls `saveHiddenItems()`
- Cascade toggle: hiding parent hides children
- Structure: groups -> items -> children (nested indent)
- Currently iterates `navGroups` directly (static order from config)

### useNavVisibility Hook (`src/lib/hooks/use-nav-visibility.ts`)
- Fetches `hiddenNavItems` from `/api/user/preferences` on mount
- Provides: `hiddenItems`, `isLoading`, `isVisible(href)`, `toggleItem(href)`, `saveHiddenItems(items[])`
- Save PATCHes to `/api/user/preferences` with `{ hiddenNavItems }`

### Sidebar (`src/components/layout/sidebar.tsx`)
- Uses `useNavVisibility().isVisible` to filter items
- Maps over `navGroups` with `filterVisible` prop to NavGroupComponent
- Top-level items (Tasks, Members) rendered separately
- Settings rendered at bottom

### Mobile Sidebar (`src/components/layout/mobile-sidebar.tsx`)
- Same pattern as desktop sidebar, uses Sheet component
- Same `useNavVisibility()` and `NavGroupComponent`

### NavGroupComponent (`src/components/layout/nav-group.tsx`)
- Receives `group`, `filterVisible`, renders items
- Handles nested children with Collapsible expand/collapse
- Uses `displayItems` = `filterVisible(group.items)` or `group.items`

### UserPreferences Model (Prisma)
- Fields: `dashboardLayout`, `dateFilter`, `detailViewMode`, `hiddenNavItems`
- `hiddenNavItems` is `Json?` type - stores array of hidden href strings
- No `navItemOrder` field yet - needs to be added

### Preferences API (`src/app/api/user/preferences/route.ts`)
- GET returns all preferences including `hiddenNavItems`
- PATCH accepts partial updates, upserts
- Will need to handle new `navItemOrder` field

### Existing DnD Packages
Already installed:
- `@dnd-kit/core@^6.3.1`
- `@dnd-kit/sortable@^10.0.0`
- `@dnd-kit/utilities@^3.2.2`

No new packages needed.

## Implementation Strategy

### Data Model
- Add `navItemOrder` field to `UserPreferences` as `Json?`
- Shape: `{ [groupKey: string]: string[] }` where values are arrays of item hrefs in order
- Example: `{ "saap": ["/", "/kanban", "/timeline", ...], "crm": [...] }`
- `null` means default order from nav-config.ts

### API Changes
- GET: return `navItemOrder` alongside other preferences
- PATCH: accept `navItemOrder` in body, persist it

### Hook: useNavOrder
- New hook or extend `useNavVisibility` to include ordering
- Fetch `navItemOrder` from preferences API
- Provide `getOrderedItems(groupKey, items)` that applies saved order
- Handle new items not in saved order: append to end
- Provide `saveNavOrder(order)` to persist

### Settings Page Changes
- Import `@dnd-kit/core` and `@dnd-kit/sortable`
- Wrap each group's items in `SortableContext`
- Each item row gets a drag handle (GripVertical icon)
- On drag end: update local order state
- Save button already exists (dirty detection) - extend to include order changes
- Add "Reset Order" button per group or global
- Children move with parent (parent-level drag only, not individual children)

### Sidebar Changes
- Both `sidebar.tsx` and `mobile-sidebar.tsx` need to apply custom order
- Use `useNavOrder` hook to reorder items before rendering
- `NavGroupComponent` already receives filtered items - just need to sort first

### Key Decisions
1. Drag only at parent level (children move with parent)
2. Items cannot cross group boundaries
3. "Reset Order" restores `nav-config.ts` default order
4. New items in future deploys: if href not in saved order, append to end
5. Top-level items (Tasks, Members) are not reorderable (only 2 items, outside groups)
6. Settings item is fixed at bottom, not reorderable

## Files to Modify

1. `prisma/schema.prisma` - Add `navItemOrder` field
2. `src/app/api/user/preferences/route.ts` - Handle navItemOrder
3. `src/lib/hooks/use-nav-visibility.ts` - Add order support (or new hook)
4. `src/app/(dashboard)/settings/page.tsx` - DnD UI
5. `src/components/layout/sidebar.tsx` - Apply custom order
6. `src/components/layout/mobile-sidebar.tsx` - Apply custom order

## Risk Areas
- DnD kit v10 sortable API may differ from older versions
- Must handle drag over nested children correctly (skip them)
- Order state must merge cleanly with visibility state in Settings
- Dirty detection needs to cover both hidden items AND order changes
