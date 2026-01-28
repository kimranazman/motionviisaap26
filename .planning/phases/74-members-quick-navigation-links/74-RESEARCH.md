# Research: Phase 74 - Members Quick Navigation Links

## Summary

The codebase already has a fully working nested navigation pattern for items with children, as implemented in the Companies nav item (CRM group). The pattern supports:

1. Parent item remains clickable (navigates to parent route)
2. Chevron button toggles child items visibility
3. Auto-expand when child route is active
4. Visibility filtering for child items

## Existing Architecture

### NavItem Interface (`src/lib/nav-config.ts`)

```typescript
export interface NavItem {
  name: string
  href: string
  icon: LucideIcon
  children?: NavItem[]  // Already supports children!
}
```

### Current topLevelItems

```typescript
export const topLevelItems: TopLevelNavItem[] = [
  { name: 'Members', href: '/members', icon: Users2 },
]
```

TopLevelNavItem is just an alias for NavItem, so it already supports `children`.

### Nested Pattern in CRM (Companies)

```typescript
{ name: 'Companies', href: '/companies', icon: Building2, children: [
  { name: 'Departments', href: '/departments', icon: Building },
  { name: 'Contacts', href: '/contacts', icon: Contact },
]},
```

### Nav Group Rendering (`src/components/layout/nav-group.tsx`)

The `NavGroupComponent` already handles items with children:
- Lines 106-174: Special rendering for items with children
- Lines 61-72: Auto-expand when child route is active
- Lines 74-76: Toggle nested items visibility
- Lines 147-171: Renders visible children with proper styling

## Gap: Top-Level Items Don't Use NavGroupComponent

The sidebars (`sidebar.tsx` and `mobile-sidebar.tsx`) render topLevelItems differently:
- Lines 70-93 (sidebar): Simple Link rendering, no children support
- Lines 81-106 (mobile-sidebar): Same simple Link rendering

The current top-level rendering doesn't check for `item.children` or render nested items.

## Solution Approach

Two options:

### Option A: Inline Nested Rendering in Sidebars
Copy the nested item rendering pattern from NavGroupComponent into the top-level items section of both sidebars.

### Option B: Extract Reusable NavItemWithChildren Component
Create a shared component that both NavGroupComponent and the top-level sections can use.

**Decision: Option A** - Inline rendering is simpler since there's only one top-level item (Members). Avoids over-engineering. If more top-level items with children are needed later, extraction can be done then.

## Implementation Details

### 1. Update nav-config.ts

Add children to Members with hardcoded team member names:

```typescript
export const topLevelItems: TopLevelNavItem[] = [
  {
    name: 'Members',
    href: '/members',
    icon: Users2,
    children: [
      { name: 'Khairul', href: '/members/khairul', icon: User },
      { name: 'Azlan', href: '/members/azlan', icon: User },
      { name: 'Izyani', href: '/members/izyani', icon: User },
    ]
  },
]
```

Import `User` icon from lucide-react.

### 2. Update getAllNavHrefs()

Function already handles children for group items. Need to also handle children for topLevelItems:

```typescript
for (const item of topLevelItems) {
  hrefs.push(item.href)
  if (item.children) {
    for (const child of item.children) {
      hrefs.push(child.href)
    }
  }
}
```

### 3. Update sidebar.tsx

Replace simple Link rendering (lines 70-93) with nested item pattern:
- Add useState for expandedItems tracking
- Add useEffect for auto-expand on active child
- Render parent with chevron toggle
- Render children when expanded

### 4. Update mobile-sidebar.tsx

Same changes as sidebar.tsx for the top-level items section (lines 81-106).

## Files to Modify

| File | Changes |
|------|---------|
| `src/lib/nav-config.ts` | Add children to Members, import User icon, update getAllNavHrefs |
| `src/components/layout/sidebar.tsx` | Add nested rendering for top-level items with children |
| `src/components/layout/mobile-sidebar.tsx` | Same nested rendering for mobile |

## Verification

1. Members shows chevron when children exist
2. Clicking chevron expands/collapses child list
3. Clicking Members parent navigates to /members
4. Clicking child navigates to /members/[name]
5. Active child auto-expands parent
6. Both desktop and mobile sidebars work identically

## RESEARCH COMPLETE
