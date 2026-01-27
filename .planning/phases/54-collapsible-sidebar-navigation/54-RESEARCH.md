# Phase 54: Collapsible Sidebar Navigation - Research

**Researched:** 2026-01-27
**Domain:** React sidebar navigation with collapsible groups, localStorage persistence, shared config
**Confidence:** HIGH

## Summary

This phase refactors the existing dual-sidebar system (separate `sidebar.tsx` and `mobile-sidebar.tsx` with duplicated navigation arrays) into a unified navigation config with collapsible groups using the already-installed `@radix-ui/react-collapsible` (v1.1.12). The codebase already has the shadcn/ui Collapsible component wrapper and an established pattern for using it (see `objective-group.tsx` and `key-result-group.tsx`), including the exact chevron rotation animation pattern required by NAV-04.

The main challenges are: (1) designing a unified navigation config data structure that both desktop and mobile sidebars consume, (2) implementing localStorage persistence for collapse state with proper SSR hydration safety in Next.js 14, and (3) auto-expanding collapsed groups when the user navigates to a route inside them.

**Primary recommendation:** Extract a shared `nav-config.ts` defining all navigation groups as typed data, create a `useNavCollapseState` hook for localStorage-persisted collapse state with SSR-safe initialization, and refactor both `Sidebar` and `MobileSidebar` to render from the shared config using the existing `Collapsible`/`CollapsibleTrigger`/`CollapsibleContent` components.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@radix-ui/react-collapsible` | 1.1.12 | Collapsible group primitive | Already installed, already used in objectives page |
| `lucide-react` | 0.562.0 | ChevronRight icon for collapse indicator | Already used throughout codebase |
| `next/navigation` | 14.x | `usePathname()` for active route detection | Already used in both sidebars |
| `next-auth/react` | 5.0.0-beta.30 | `useSession()` for ADMIN role check | Already used in both sidebars |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@/components/ui/collapsible` | local | shadcn/ui wrapper around Radix Collapsible | Use for all collapsible groups |
| `@/components/ui/sheet` | local | Mobile sidebar sheet container | Already used by MobileSidebar |
| `@/components/ui/badge` | local | Item count badge on collapsed headers | NAV-09 count display |
| `@/lib/utils` (cn) | local | Tailwind class merging | Used everywhere in codebase |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Radix Collapsible | shadcn/ui Sidebar component | Out of scope per REQUIREMENTS.md ("Existing sidebar is clean; collapsible groups only need Radix Collapsible primitive") |
| Custom collapse logic | Radix Accordion (single open at a time) | Accordion forces single-open; requirement allows multiple groups open simultaneously |
| localStorage | API-persisted preferences | localStorage is explicitly required by NAV-05; simpler than API round-trip for UI-only preference |

**Installation:**
```bash
# No new installations needed - all dependencies already present
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  lib/
    nav-config.ts              # NEW: Unified navigation configuration
    hooks/
      use-nav-collapse-state.ts # NEW: localStorage-backed collapse state hook
  components/
    layout/
      sidebar.tsx              # REFACTOR: Consume shared config + collapsible groups
      mobile-sidebar.tsx       # REFACTOR: Consume shared config + collapsible groups
      nav-group.tsx            # NEW: Reusable collapsible nav group component
```

### Pattern 1: Unified Navigation Config
**What:** A single TypeScript file defining all navigation items in typed groups
**When to use:** When multiple components (desktop sidebar, mobile sidebar) need the same navigation structure
**Example:**
```typescript
// src/lib/nav-config.ts
import { LucideIcon, LayoutDashboard, Target, GanttChart, /* ... */ } from 'lucide-react'

export interface NavItem {
  name: string
  href: string
  icon: LucideIcon
}

export interface NavGroup {
  key: string           // localStorage key segment: 'saap', 'crm', 'admin'
  label: string         // Display label: 'SAAP', 'CRM', 'Admin'
  items: NavItem[]
  requireRole?: string  // Optional role gate (e.g., 'ADMIN')
}

export interface TopLevelNavItem extends NavItem {
  // Top-level items not in any group
}

export const navGroups: NavGroup[] = [
  {
    key: 'saap',
    label: 'SAAP',
    items: [
      { name: 'Dashboard', href: '/', icon: LayoutDashboard },
      { name: 'By Objective', href: '/objectives', icon: Target },
      { name: 'Timeline', href: '/timeline', icon: GanttChart },
      { name: 'Kanban', href: '/kanban', icon: KanbanSquare },
      { name: 'Calendar', href: '/calendar', icon: Calendar },
      { name: 'Initiatives', href: '/initiatives', icon: ListTodo },
      { name: 'Support Tasks', href: '/support-tasks', icon: ClipboardList },
      { name: 'Events to Attend', href: '/events', icon: Ticket },
    ],
  },
  {
    key: 'crm',
    label: 'CRM',
    items: [
      { name: 'Companies', href: '/companies', icon: Building2 },
      { name: 'Pipeline', href: '/pipeline', icon: Funnel },
      { name: 'Potential Projects', href: '/potential-projects', icon: FolderKanban },
      { name: 'Projects', href: '/projects', icon: Briefcase },
      { name: 'Suppliers', href: '/suppliers', icon: Truck },
      { name: 'Price Comparison', href: '/supplier-items', icon: Scale },
    ],
  },
  {
    key: 'admin',
    label: 'Admin',
    items: [
      { name: 'Users', href: '/admin/users', icon: Users },
    ],
    requireRole: 'ADMIN',
  },
]

export const topLevelItems: TopLevelNavItem[] = [
  { name: 'Tasks', href: '/tasks', icon: ListChecks },
  { name: 'Members', href: '/members', icon: Users2 },
]

// Helper: find which group a pathname belongs to
export function findGroupForPath(pathname: string): string | null {
  for (const group of navGroups) {
    for (const item of group.items) {
      if (pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))) {
        return group.key
      }
    }
  }
  return null
}
```

### Pattern 2: SSR-Safe localStorage Hook
**What:** A custom hook that reads/writes collapse state to localStorage while avoiding Next.js hydration mismatches
**When to use:** Any time UI state needs to persist in localStorage within a Next.js SSR environment
**Example:**
```typescript
// src/lib/hooks/use-nav-collapse-state.ts
'use client'
import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'sidebar-collapse-state'

// Default: all groups expanded (NAV-06)
const DEFAULT_STATE: Record<string, boolean> = {
  saap: true,
  crm: true,
  admin: true,
}

export function useNavCollapseState(pathname: string) {
  // Initialize with defaults (matches server render)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(DEFAULT_STATE)
  const [hydrated, setHydrated] = useState(false)

  // Load from localStorage after mount (avoids hydration mismatch)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        setExpandedGroups(JSON.parse(stored))
      }
    } catch {
      // Ignore parse errors, use defaults
    }
    setHydrated(true)
  }, [])

  // Auto-expand group containing active route (NAV-07)
  useEffect(() => {
    if (!hydrated) return
    const activeGroup = findGroupForPath(pathname)
    if (activeGroup && !expandedGroups[activeGroup]) {
      setExpandedGroups(prev => {
        const next = { ...prev, [activeGroup]: true }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
        return next
      })
    }
  }, [pathname, hydrated])

  const toggleGroup = useCallback((key: string) => {
    setExpandedGroups(prev => {
      const next = { ...prev, [key]: !prev[key] }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  return { expandedGroups, toggleGroup }
}
```

### Pattern 3: Reusable NavGroup Component
**What:** A shared component for rendering a collapsible navigation group, used identically in desktop and mobile sidebars
**When to use:** NAV-08 requires mobile and desktop to share the same collapsible groups
**Example:**
```typescript
// src/components/layout/nav-group.tsx
'use client'
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible'
import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { NavGroup, NavItem } from '@/lib/nav-config'

interface NavGroupProps {
  group: NavGroup
  isExpanded: boolean
  onToggle: () => void
  pathname: string
  onLinkClick?: () => void  // For mobile: close sheet on navigation
}

export function NavGroupComponent({ group, isExpanded, onToggle, pathname, onLinkClick }: NavGroupProps) {
  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 mt-4 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-gray-600 transition-colors">
        <span>{group.label} ({group.items.length})</span>
        <ChevronRight
          className={cn(
            'h-3.5 w-3.5 shrink-0 transition-transform duration-200',
            isExpanded && 'rotate-90'
          )}
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="flex flex-col gap-1">
          {group.items.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onLinkClick}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            )
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
```

### Anti-Patterns to Avoid
- **Duplicating navigation arrays:** The current codebase has separate `navigation` arrays in `sidebar.tsx` and `mobile-sidebar.tsx` with drift (Price Comparison missing from mobile). This MUST be eliminated per NAV-11.
- **Reading localStorage during render (SSR):** Will cause hydration mismatch. Always read in `useEffect`.
- **Using Accordion for independent groups:** Radix Accordion only allows one section open at a time. Use Collapsible for each group independently.
- **Inline navigation config:** Avoid defining nav items inside components. Extract to a typed config file for single source of truth.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Collapsible animation | Custom height transition with refs | Radix Collapsible (`@radix-ui/react-collapsible`) | Already installed (v1.1.12), handles animation, accessibility (aria-expanded), keyboard support |
| Chevron rotation animation | JavaScript-driven animation | CSS `transition-transform duration-200` + `rotate-90` class | Established pattern already used in `objective-group.tsx` (line 76-77) |
| Mobile slide-out sidebar | Custom drawer implementation | Existing Sheet component (`@radix-ui/react-dialog` based) | Already working in `mobile-sidebar.tsx` |
| Class merging for active states | String concatenation | `cn()` from `@/lib/utils` (clsx + tailwind-merge) | Used consistently throughout codebase |
| Active route detection | Custom route matching | `usePathname()` from `next/navigation` | Already the pattern in both sidebars |

**Key insight:** Every building block needed for this phase already exists in the codebase. This is a refactoring/restructuring task, not a greenfield implementation. No new packages are needed.

## Common Pitfalls

### Pitfall 1: Hydration Mismatch with localStorage
**What goes wrong:** Reading localStorage during initial render produces different HTML on server vs client, causing React hydration error
**Why it happens:** `localStorage` is not available during SSR. If state is initialized from localStorage, the server renders with `undefined`/default while client renders with stored value
**How to avoid:** Initialize state with defaults (all expanded per NAV-06). Use `useEffect` to read localStorage AFTER mount. The two-pass pattern: first render matches server, second render applies stored state.
**Warning signs:** Console error "Text content does not match server-rendered HTML" or "Hydration failed because the initial UI does not match what was rendered on the server"

### Pitfall 2: Auto-expand Runs Before localStorage Load
**What goes wrong:** NAV-07 (auto-expand for active route) fires before localStorage state is loaded, overwriting stored preferences
**Why it happens:** Both useEffect hooks run on mount; if auto-expand runs first, it doesn't know the stored state
**How to avoid:** Use a `hydrated` flag. Only run auto-expand logic after localStorage has been read. See the hook example above where `hydrated` state gates the auto-expand effect.
**Warning signs:** After navigation, all groups are expanded regardless of user's saved preferences

### Pitfall 3: Mobile Sidebar Closes on Any State Change
**What goes wrong:** Toggling a collapse group in the mobile sidebar causes re-render which may close the Sheet
**Why it happens:** If collapse state is lifted too high or causes parent re-render that resets the Sheet's `open` state
**How to avoid:** Keep the Sheet's `open` state independent from collapse state. The collapse toggle handler should only update collapse state, not trigger any Sheet state changes. The `onLinkClick` callback (which closes the sheet) should only be on the `<Link>` elements, not on `CollapsibleTrigger`.
**Warning signs:** Mobile sheet closes when user tries to expand/collapse a group

### Pitfall 4: Navigation Config Import Bloats Server Components
**What goes wrong:** Importing lucide-react icons in `nav-config.ts` makes it a client module, but it gets imported in server-rendered contexts
**Why it happens:** Lucide icons are React components (client-side), and importing them at the module level drags in the client bundle
**How to avoid:** The nav config file will be imported only by client components (`'use client'` sidebar components). This is already the established pattern -- both current sidebar files are `'use client'`. No issue as long as the config file is only consumed by client components.
**Warning signs:** "Attempted to call Icon() from the server but Icon is on the client" errors

### Pitfall 5: localStorage Key Collision
**What goes wrong:** Multiple features store JSON in localStorage with generic keys that collide
**Why it happens:** Using too-generic keys like `"state"` or `"collapsed"`
**How to avoid:** Use a specific, namespaced key like `'sidebar-collapse-state'`. The codebase already uses `'sheet-width'` for the sheet resizer.
**Warning signs:** Unexpected values appearing in state, data corruption after unrelated feature changes

## Code Examples

Verified patterns from the existing codebase:

### Collapsible with Chevron Rotation (from objective-group.tsx)
```typescript
// Source: src/components/objectives/objective-group.tsx (lines 71-122)
// This is the EXACT pattern already used in the codebase
<Collapsible open={isExpanded} onOpenChange={onToggleObjective}>
  <CollapsibleTrigger className="flex items-center gap-3 w-full p-3 hover:bg-gray-50 transition rounded-xl text-left">
    <ChevronRight
      className={cn(
        'h-5 w-5 shrink-0 transition-transform duration-200 text-gray-400',
        isExpanded && 'rotate-90'
      )}
    />
    <span className="font-semibold text-lg text-gray-900">
      {label}
    </span>
    <span className="text-sm text-gray-500 shrink-0">
      {count} items
    </span>
  </CollapsibleTrigger>
  <CollapsibleContent>
    {/* child items here */}
  </CollapsibleContent>
</Collapsible>
```

### Active Route Detection (from sidebar.tsx)
```typescript
// Source: src/components/layout/sidebar.tsx (lines 57-58)
const isActive = pathname === item.href ||
  (item.href !== '/' && pathname.startsWith(item.href))
```

### Mobile Sheet with Navigation Links (from mobile-sidebar.tsx)
```typescript
// Source: src/components/layout/mobile-sidebar.tsx (lines 47-70)
// Links in mobile Sheet call setOpen(false) on click to close the sheet
<Link
  href={item.href}
  onClick={() => setOpen(false)}
  className={cn(
    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
    isActive
      ? 'bg-gray-100 text-gray-900'
      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
  )}
>
  <item.icon className="h-5 w-5" />
  {item.name}
</Link>
```

### Role-Based Conditional Rendering (from sidebar.tsx)
```typescript
// Source: src/components/layout/sidebar.tsx (lines 154-172)
{session?.user?.role === "ADMIN" && (
  <>
    {/* Admin section content */}
  </>
)}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Separate nav arrays per sidebar | Shared config file consumed by both | This phase | Eliminates duplication, fixes mobile drift |
| Static section headers (non-interactive) | Collapsible groups with Radix Collapsible | This phase | User control over sidebar density |
| No collapse state persistence | localStorage-backed state | This phase | Preference survives sessions |
| CRM items hardcoded inline (desktop) vs array (mobile) | Single navGroups array | This phase | All items in single source of truth |

**Current issues in existing code:**
- Desktop `sidebar.tsx` has CRM items hardcoded as individual `<Link>` elements (lines 80-151), NOT from an array
- Mobile `mobile-sidebar.tsx` has CRM items in a `crmNavigation` array (lines 39-45) but is MISSING `Price Comparison` (Scale icon / `/supplier-items`)
- The two files import different sets of icons and define navigation items independently
- Settings link exists in both but is not part of any group (this is correct -- it should remain standalone)

## Open Questions

Things that couldn't be fully resolved:

1. **Top-level items placement relative to groups**
   - What we know: NAV-10 says Tasks and Members should be top-level (not in any group). Settings is already top-level at the bottom.
   - What's unclear: Should Tasks/Members appear BEFORE the groups, BETWEEN groups, or AFTER groups? Most sidebar patterns put top-level items at the top or between sections.
   - Recommendation: Place Tasks and Members between the collapsible groups and the Settings link at bottom. This gives them visual prominence without cluttering the top. Planner should decide exact ordering.

2. **Collapse animation smoothness on CollapsibleContent**
   - What we know: Radix Collapsible does not animate height by default. The `CollapsibleContent` just shows/hides. NAV-04 only specifies chevron rotation animation, not content expand animation.
   - What's unclear: Should the content area animate open/closed (slide down) or just appear instantly?
   - Recommendation: Implement chevron rotation animation (required by NAV-04). Content can be instant show/hide to match the existing `objective-group.tsx` pattern. If smooth content animation is desired later, it can be added with CSS `data-[state=open]:animate-slideDown` keyframes on `CollapsibleContent`, but this is not a requirement.

3. **Tasks/Members pages don't exist yet**
   - What we know: Phase 55 creates /tasks and Phase 56 creates /members. Phase 54 only adds the nav links.
   - What's unclear: Should the links be disabled/hidden until those phases ship?
   - Recommendation: Add the links now (they'll show 404 until built). This is standard practice -- nav structure comes first, pages follow. The roadmap confirms Phase 54 runs first to "unblock the new page links."

## Sources

### Primary (HIGH confidence)
- **Codebase analysis:** `src/components/layout/sidebar.tsx`, `src/components/layout/mobile-sidebar.tsx` -- full current implementation reviewed
- **Codebase analysis:** `src/components/ui/collapsible.tsx` -- shadcn/ui wrapper already present
- **Codebase analysis:** `src/components/objectives/objective-group.tsx` -- established Collapsible + ChevronRight rotation pattern
- **Codebase analysis:** `src/components/ui/sheet.tsx` -- localStorage pattern for sheet width persistence
- **Codebase analysis:** `package.json` -- `@radix-ui/react-collapsible@1.1.12` already installed
- [Radix Collapsible API](https://www.radix-ui.com/primitives/docs/components/collapsible) -- Root, Trigger, Content API, controlled via `open`/`onOpenChange`

### Secondary (MEDIUM confidence)
- [Next.js Hydration Error docs](https://nextjs.org/docs/messages/react-hydration-error) -- SSR hydration mismatch patterns and solutions
- [Handling React server hydration mismatch](https://www.benmvp.com/blog/handling-react-server-mismatch-error/) -- Two-pass rendering pattern for localStorage

### Tertiary (LOW confidence)
- None. All findings verified with codebase or official documentation.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- All libraries already installed and used in codebase; no new dependencies
- Architecture: HIGH -- Patterns directly derived from existing codebase code (`objective-group.tsx`, `sidebar.tsx`, `mobile-sidebar.tsx`)
- Pitfalls: HIGH -- SSR/localStorage hydration pattern well-documented in Next.js ecosystem; confirmed against codebase patterns

**Research date:** 2026-01-27
**Valid until:** 2026-02-27 (stable stack, no fast-moving dependencies)
