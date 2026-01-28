# Phase 69 Research: Nested Sidebar Links

## Current Architecture

### Nav Config (`src/lib/nav-config.ts`)
- `NavItem` interface: `{ name, href, icon }` — flat, no children support
- `NavGroup` interface: `{ key, label, items: NavItem[], requireRole? }`
- CRM group items are flat: Companies (`/companies`), Departments (`/departments`), Contacts (`/contacts`), Pipeline, etc.
- `ALWAYS_VISIBLE_HREFS`: `Set(['/', '/settings'])`
- `getAllNavHrefs()`: returns all hrefs for groups + top-level + settings
- `findGroupForPath()`: matches pathname to group key

### Sidebar (`src/components/layout/sidebar.tsx`)
- Desktop sidebar: filters groups/items by visibility via `useNavVisibility`
- Uses `NavGroupComponent` for each group
- Groups collapse/expand via `useNavCollapseState` (localStorage-backed)
- No concept of nested items within a group

### NavGroupComponent (`src/components/layout/nav-group.tsx`)
- Renders a `Collapsible` (Radix) with group label as trigger
- Items rendered as flat `Link` elements
- `isActive` check: exact match or `startsWith`
- Accepts `filterVisible` and `onLinkClick` props

### Mobile Sidebar (`src/components/layout/mobile-sidebar.tsx`)
- Sheet-based (slide from left) via Radix Sheet
- Same structure as desktop: uses `NavGroupComponent`
- Auto-closes on link click (`onLinkClick={() => setOpen(false)}`)

### Mobile Nav (`src/components/layout/mobile-nav.tsx`)
- Bottom tab bar with 4 fixed items — NOT related to sidebar nesting
- No changes needed here per requirements

### Settings Page (`src/app/(dashboard)/settings/page.tsx`)
- Lists all nav items with Switch toggles
- Flat list per group — no indentation for sub-items
- Dirty detection: compares `localHidden` vs `hiddenItems`
- Save button appears only when dirty

### Visibility Hook (`src/lib/hooks/use-nav-visibility.ts`)
- `hiddenItems: string[]` — list of hidden hrefs
- `isVisible(href)`: checks if href is in hiddenItems
- `toggleItem(href)`: local state toggle
- `saveHiddenItems(items)`: persists via PATCH /api/user/preferences
- Hidden items stored as `hiddenNavItems` JSON array in UserPreferences

### Preferences API (`src/app/api/user/preferences/route.ts`)
- GET returns `hiddenNavItems` as string array
- PATCH accepts `hiddenNavItems` as string array
- No schema changes needed — we just add/remove hrefs

## Implementation Strategy

### 1. NavItem Type Extension
Add optional `children` to `NavItem`:
```typescript
export interface NavItem {
  name: string
  href: string
  icon: LucideIcon
  children?: NavItem[]  // new
}
```

Move Departments and Contacts from flat CRM items to children of Companies:
```typescript
{ name: 'Companies', href: '/companies', icon: Building2, children: [
  { name: 'Departments', href: '/departments', icon: Building },
  { name: 'Contacts', href: '/contacts', icon: Contact },
]}
```

### 2. NavGroupComponent Changes
- Detect items with `children`
- For parent items: render with a chevron toggle AND a link
  - Clicking the label → navigate to `/companies`
  - Clicking the chevron → toggle sub-items
- Sub-items render indented (pl-8 or similar)
- Parent `isActive` when pathname matches parent OR any child href

### 3. Expand/Collapse State for Nested Items
- Use local state within NavGroupComponent or a new hook
- Key by parent href (e.g., `/companies`)
- Could use localStorage for persistence, but simpler to default-expand if active

### 4. Visibility Logic
- Hiding parent (`/companies`) hides all children → in the visibility check, if parent is hidden, children are hidden too
- Children can be individually hidden via Settings
- `getAllNavHrefs()` must include child hrefs
- `findGroupForPath()` must match child paths to parent's group

### 5. Settings Page Changes
- Show children indented under parent with visual indentation (pl-6 or pl-8)
- Parent toggle: when turned off, also turn off children
- Children toggles: independent of parent (can hide individual children)
- When all children hidden, parent still shows (just has no expandable children)

### 6. Mobile Sidebar
- Same `NavGroupComponent` is used → changes propagate automatically
- Verify `onLinkClick` still fires on child items to close Sheet

## Key Decisions

1. **No new npm packages** — use existing Radix Collapsible for nested expand/collapse
2. **No DB schema changes** — hiddenNavItems already stores href strings
3. **Parent highlight rule**: parent active when on `/companies`, `/departments`, or `/contacts`
4. **Default expand state**: nested items expanded by default when parent or child is active route
5. **Mobile behavior**: identical to desktop — same component, same hierarchy

## Files to Modify

1. `src/lib/nav-config.ts` — Add children to NavItem, restructure CRM items
2. `src/components/layout/nav-group.tsx` — Render nested items with chevron/link split
3. `src/components/layout/sidebar.tsx` — Update visibility filtering to handle children
4. `src/components/layout/mobile-sidebar.tsx` — Update visibility filtering to handle children
5. `src/app/(dashboard)/settings/page.tsx` — Show nested items with indentation, cascade hide
6. `src/lib/hooks/use-nav-visibility.ts` — No changes needed (works with hrefs)

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Breaking existing nav items | Only Companies gets children; all other items unchanged |
| Active state regression | Test all three routes: /companies, /departments, /contacts |
| Settings dirty detection | No change needed — still comparing href arrays |
| Mobile sidebar regression | Same NavGroupComponent → changes propagate |
