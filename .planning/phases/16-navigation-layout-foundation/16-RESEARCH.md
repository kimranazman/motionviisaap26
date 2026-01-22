# Phase 16: Navigation & Layout Foundation - Research

**Researched:** 2026-01-22
**Domain:** Responsive navigation, mobile UI patterns, Tailwind CSS
**Confidence:** HIGH

## Summary

This phase implements responsive navigation patterns for SAAP to work across phone, tablet, and desktop screens. The standard approach uses Tailwind CSS responsive breakpoints (`md:` at 768px) combined with existing shadcn/ui components (Sheet for mobile sidebar drawer).

The implementation follows a mobile-first approach:
1. **Bottom navigation bar** for mobile (<768px) - fixed to bottom with 4 key navigation items
2. **Sidebar hidden on mobile** - uses `md:block` to show only on tablet/desktop
3. **Header adapts** - search collapses to icon on mobile, expands to input on tap
4. **Sheet component** for mobile sidebar access if needed (hamburger menu pattern)

**Primary recommendation:** Use CSS-only responsive patterns (`hidden md:block`, `md:hidden`) rather than JavaScript-based breakpoint detection where possible. This avoids hydration errors and provides instant responsiveness.

## Standard Stack

The established libraries/tools for this domain:

### Core (Already in Project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Tailwind CSS | 3.4.1 | Responsive utilities, mobile-first | Already established, `md:`, `lg:` breakpoints |
| shadcn/ui Sheet | (Radix Dialog) | Mobile drawer/sidebar | Already in project, slide-in from left |
| Lucide React | 0.562.0 | Navigation icons | Already in project, consistent icon set |

### Supporting (May Need)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| usehooks-ts | latest | useMediaQuery hook | Only if JS-based breakpoint logic needed |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom useMediaQuery | CSS `md:hidden` | CSS is hydration-safe, no flash |
| shadcn Sidebar component | Custom bottom nav + Sheet | Official sidebar is complex, we need simpler pattern |

**Installation:**
No new packages needed. All components already in project.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/
│   └── layout/
│       ├── header.tsx           # Existing - add responsive behavior
│       ├── header-search.tsx    # Existing - add mobile icon mode
│       ├── sidebar.tsx          # Existing - add md:block responsive
│       ├── mobile-nav.tsx       # NEW - bottom navigation bar
│       └── mobile-sidebar.tsx   # NEW - Sheet-based sidebar for hamburger
└── app/
    └── (dashboard)/
        └── layout.tsx           # Modify to include mobile nav
```

### Pattern 1: CSS-Only Responsive Hiding
**What:** Use Tailwind classes to show/hide elements at breakpoints
**When to use:** Static elements that differ between mobile/desktop
**Example:**
```typescript
// Source: Tailwind CSS documentation
// Sidebar - visible on md+ screens only
<aside className="hidden md:fixed md:inset-y-0 md:left-0 md:block md:w-64">
  {/* sidebar content */}
</aside>

// Bottom nav - visible on mobile only
<nav className="fixed bottom-0 inset-x-0 md:hidden">
  {/* bottom nav content */}
</nav>
```

### Pattern 2: Mobile Bottom Navigation
**What:** Fixed bar at bottom of screen with 4-5 nav items
**When to use:** Mobile screens (<768px) for primary navigation
**Example:**
```typescript
// Source: Flowbite Tailwind patterns
<nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 md:hidden pb-safe">
  <div className="grid h-16 grid-cols-4 max-w-lg mx-auto">
    {navItems.map((item) => (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          "inline-flex flex-col items-center justify-center px-2",
          "text-gray-500 hover:text-gray-900",
          isActive && "text-blue-600"
        )}
      >
        <item.icon className="w-6 h-6 mb-1" />
        <span className="text-xs">{item.name}</span>
      </Link>
    ))}
  </div>
</nav>
```

### Pattern 3: Sheet-Based Mobile Sidebar
**What:** Full sidebar slides in from left via hamburger menu
**When to use:** When user needs access to all navigation items on mobile
**Example:**
```typescript
// Source: shadcn/ui Sheet component
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu } from "lucide-react"

<Sheet>
  <SheetTrigger asChild>
    <Button variant="ghost" size="icon" className="md:hidden">
      <Menu className="h-6 w-6" />
    </Button>
  </SheetTrigger>
  <SheetContent side="left" className="w-64 p-0">
    {/* Reuse sidebar content */}
  </SheetContent>
</Sheet>
```

### Pattern 4: Collapsible Search
**What:** Search shows as icon on mobile, expands on tap
**When to use:** Header search that would be too wide on mobile
**Example:**
```typescript
// Mobile: Icon button that opens sheet/dialog
// Desktop: Full input (existing pattern)
<div className="md:hidden">
  <Button variant="ghost" size="icon" onClick={() => setSearchOpen(true)}>
    <Search className="h-5 w-5" />
  </Button>
</div>
<div className="hidden md:block">
  <HeaderSearch /> {/* Existing component */}
</div>
```

### Anti-Patterns to Avoid
- **JS-based breakpoint detection for layout:** Causes hydration mismatch. Use CSS `md:hidden` instead.
- **Duplicating navigation logic:** Extract nav items to shared constant, reuse in sidebar and bottom nav.
- **Fixed bottom nav without safe-area padding:** iOS notch/home indicator overlaps. Add `pb-safe` class.
- **Touch targets under 44px:** Leads to tap errors. Bottom nav items should be 48px+ touch area.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Slide-in sidebar | Custom drawer animation | shadcn/ui Sheet (side="left") | Handles focus trap, backdrop, animation |
| Responsive breakpoint detection | Custom useMediaQuery | Tailwind CSS classes | SSR-safe, no hydration errors |
| Icon set | Custom SVGs | Lucide React | Consistent sizing, already in project |
| Safe area padding | Manual env() calc | Tailwind plugin or utility class | iOS-specific, tested |

**Key insight:** Tailwind's responsive classes (`md:hidden`, `hidden md:flex`) are the safest way to handle layout differences. JavaScript-based approaches require careful SSR handling.

## Common Pitfalls

### Pitfall 1: Hydration Mismatch with useMediaQuery
**What goes wrong:** Server renders one layout, client renders another, React throws error
**Why it happens:** `window.matchMedia` returns undefined on server, different result on client
**How to avoid:** Prefer CSS-only responsive patterns. If JS needed, use `useEffect` to defer client-side detection.
**Warning signs:** "Text content does not match server-rendered HTML" error in console

### Pitfall 2: Bottom Nav Overlaps Content
**What goes wrong:** Page content hidden behind fixed bottom nav
**Why it happens:** No padding-bottom on main content area
**How to avoid:** Add `pb-16 md:pb-0` to main content wrapper when bottom nav visible
**Warning signs:** Last items in lists not visible, need to scroll "past" end

### Pitfall 3: iOS Safe Area Not Respected
**What goes wrong:** Bottom nav overlaps iOS home indicator bar
**Why it happens:** Missing viewport-fit=cover and env(safe-area-inset-bottom) padding
**How to avoid:**
1. Add `viewport-fit=cover` to viewport meta tag
2. Add padding-bottom using `env(safe-area-inset-bottom)`
**Warning signs:** Testing on iPhone shows overlap with home indicator

### Pitfall 4: Sidebar pl-64 Hardcoded on Mobile
**What goes wrong:** Main content indented on mobile even though sidebar hidden
**Why it happens:** Current layout has `pl-64` without responsive class
**How to avoid:** Change to `md:pl-64` so padding only applies when sidebar visible
**Warning signs:** Content appears shifted right on mobile

### Pitfall 5: Small Touch Targets
**What goes wrong:** Users have difficulty tapping nav items
**Why it happens:** Icon buttons without adequate padding
**How to avoid:** Ensure 44x44px minimum touch area (48px recommended). Use padding around icons.
**Warning signs:** Analytics show many mis-taps, user complaints about navigation

## Code Examples

Verified patterns from official sources:

### Dashboard Layout with Responsive Navigation
```typescript
// Source: Existing layout.tsx + responsive patterns
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      {/* Sidebar - hidden on mobile */}
      <Sidebar className="hidden md:fixed md:inset-y-0 md:left-0 md:block md:w-64" />

      {/* Main content - no left padding on mobile */}
      <main className="md:pl-64 pb-16 md:pb-0">
        {children}
      </main>

      {/* Bottom nav - visible on mobile only */}
      <MobileNav className="md:hidden" />
    </div>
  )
}
```

### Bottom Navigation Component
```typescript
// Source: Flowbite + Tailwind patterns
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ListTodo, Funnel, Ticket } from 'lucide-react'
import { cn } from '@/lib/utils'

const mobileNavItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Initiatives', href: '/initiatives', icon: ListTodo },
  { name: 'CRM', href: '/pipeline', icon: Funnel },
  { name: 'Events', href: '/events', icon: Ticket },
]

export function MobileNav({ className }: { className?: string }) {
  const pathname = usePathname()

  return (
    <nav className={cn(
      "fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200",
      "pb-[env(safe-area-inset-bottom)]",
      className
    )}>
      <div className="grid h-16 grid-cols-4 max-w-lg mx-auto">
        {mobileNavItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "inline-flex flex-col items-center justify-center",
                "min-h-[48px] min-w-[48px]", // Touch target
                "text-gray-500 hover:text-gray-900 transition-colors",
                isActive && "text-blue-600"
              )}
            >
              <item.icon className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">{item.name}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
```

### Mobile Header with Collapsible Search
```typescript
// Source: shadcn/ui patterns
'use client'

import { useState } from 'react'
import { Search, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { HeaderSearch } from './header-search'

export function Header({ title }: { title: string }) {
  const [searchOpen, setSearchOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 flex h-14 md:h-16 items-center justify-between border-b bg-white px-4 md:px-6">
      {/* Mobile: Hamburger + Title */}
      <div className="flex items-center gap-2 md:hidden">
        <MobileSidebarTrigger />
        <h1 className="text-lg font-semibold truncate">{title}</h1>
      </div>

      {/* Desktop: Title */}
      <div className="hidden md:block">
        <h1 className="text-xl font-semibold">{title}</h1>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        {/* Mobile search icon */}
        <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Search className="h-5 w-5" />
            </Button>
          </DialogTrigger>
          <DialogContent className="top-0 translate-y-0 p-4">
            <HeaderSearch autoFocus onResultClick={() => setSearchOpen(false)} />
          </DialogContent>
        </Dialog>

        {/* Desktop search */}
        <div className="hidden md:block">
          <HeaderSearch />
        </div>

        {/* Notifications and user menu stay same */}
        <NotificationBell />
        <UserMenu />
      </div>
    </header>
  )
}
```

### Safe Area CSS Utility
```css
/* Source: CSS env() specification */
/* Add to globals.css */
@layer utilities {
  .pb-safe {
    padding-bottom: env(safe-area-inset-bottom);
  }

  .pt-safe {
    padding-top: env(safe-area-inset-top);
  }
}
```

### Viewport Meta Tag Update
```html
<!-- Source: Apple iOS documentation -->
<!-- In app/layout.tsx metadata or head -->
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hamburger menu only | Bottom nav + hamburger | 2020+ | Mobile apps established bottom nav as standard |
| CSS media queries in <style> | Tailwind responsive utilities | 2020+ | Cleaner, co-located with markup |
| JavaScript breakpoint detection | CSS-first responsive | Best practice | Avoids hydration issues in Next.js |
| Fixed 60px touch targets | 48px minimum, 44px WCAG | WCAG 2.2 (2023) | Legal requirement in EAA 2025 |

**Deprecated/outdated:**
- `@media` queries in separate CSS files: Use Tailwind inline classes instead
- Using `useEffect` to detect screen width for layout: Causes flash, prefer CSS

## Open Questions

Things that couldn't be fully resolved:

1. **Admin section in bottom nav?**
   - What we know: Only admins see Users link in sidebar
   - What's unclear: Should bottom nav show "More" with admin options, or exclude entirely?
   - Recommendation: Exclude from bottom nav, accessible via hamburger menu

2. **CRM consolidation in bottom nav**
   - What we know: Sidebar has Companies, Pipeline, Potential Projects, Projects
   - What's unclear: Should bottom nav have single "CRM" link going to Pipeline, or dropdown?
   - Recommendation: Single "CRM" link to /pipeline, full CRM nav in hamburger sidebar

## Sources

### Primary (HIGH confidence)
- shadcn/ui Sheet component - official docs, slide-in behavior
- Tailwind CSS responsive utilities - mobile-first breakpoints
- Flowbite bottom navigation - Tailwind patterns

### Secondary (MEDIUM confidence)
- usehooks-ts useMediaQuery - SSR-safe hook implementation
- Next.js hydration error documentation - avoiding mismatches
- WCAG 2.5.8 touch target requirements - accessibility compliance

### Tertiary (LOW confidence)
- Community patterns for bottom navigation placement
- Platform-specific safe area handling nuances

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - using existing libraries only
- Architecture: HIGH - established responsive patterns
- Pitfalls: HIGH - well-documented Next.js/Tailwind issues

**Research date:** 2026-01-22
**Valid until:** 2026-04-22 (3 months - stable patterns)
