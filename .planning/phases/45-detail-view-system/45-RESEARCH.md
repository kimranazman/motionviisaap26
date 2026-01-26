# Phase 45: Detail View System - Research

**Researched:** 2026-01-26
**Domain:** UI patterns, user preferences, drawer/dialog switching
**Confidence:** HIGH

## Summary

This phase adds a drawer (slide-over) variant for all detail views, an "Expand" button to navigate to full detail pages, and user preference persistence so users can choose between drawer and dialog modes.

The codebase already has strong foundations for this work:
- A `Sheet` UI component (slide-over drawer) already exists at `src/components/ui/sheet.tsx`, built on `@radix-ui/react-dialog` with `side` variants (top/bottom/left/right), resizable support, and responsive sizing
- A `Dialog` UI component exists at `src/components/ui/dialog.tsx` with mobile-first slide-from-bottom on mobile and centered modal on desktop
- **All 7 existing detail view components** use the `Dialog` component exclusively (not `Sheet`), despite their filenames containing "Sheet"
- A `UserPreferences` model already exists in the Prisma schema with JSON fields (`dashboardLayout`, `dateFilter`), and an API route at `/api/user/preferences` with GET/PATCH (upsert pattern)
- The user menu dropdown in `header.tsx` currently only has name/email display and sign-out

**Primary recommendation:** Create a `DetailView` wrapper component that conditionally renders either `Dialog` or `Sheet` based on user preference (from React Context), and refactor all 7 detail view components to use it. Add a `detailViewMode` field to the existing `UserPreferences` model. No new Prisma model needed.

## Standard Stack

### Core (already in codebase)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@radix-ui/react-dialog` | ^1.1.15 | Both Dialog AND Sheet are built on this | Already used for both components |
| `next-auth` | ^5.0.0-beta.30 | Session/auth for preferences API | Already used throughout |
| `@prisma/client` | ^6.19.2 | UserPreferences storage | Already used, model exists |
| `class-variance-authority` | ^0.7.1 | Sheet variant styling (side) | Already used in sheet.tsx |
| `sonner` | ^2.0.7 | Toast notifications for preference changes | Already used in deal/potential sheets |

### Supporting (already in codebase)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `lucide-react` | ^0.562.0 | Icons (Expand, PanelRight, Columns2, Settings) | UI elements |
| `tailwindcss-animate` | ^1.0.7 | Sheet/Dialog animations | slide-in/slide-out/fade |

### No New Dependencies Needed
This phase requires zero new npm packages. Everything is built on existing primitives.

## Architecture Patterns

### Recommended Project Structure
```
src/
  components/
    ui/
      detail-view.tsx           # NEW: Wrapper component (Dialog or Sheet based on preference)
    layout/
      header.tsx                # MODIFY: Add detail view toggle to user menu dropdown
  lib/
    hooks/
      use-detail-view-mode.ts   # NEW: Hook to access/toggle preference from context
    detail-view-context.tsx     # NEW: React context provider for detail view mode
  app/
    (dashboard)/
      settings/
        page.tsx                # NEW: Settings page with detail view mode toggle
    api/
      user/
        preferences/
          route.ts              # MODIFY: Add detailViewMode field handling
```

### Pattern 1: DetailView Wrapper Component
**What:** A single component that conditionally renders content inside either Dialog or Sheet based on user preference.
**When to use:** Replace all direct Dialog usage in detail view components.

```typescript
// src/components/ui/detail-view.tsx
'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useDetailViewMode } from '@/lib/hooks/use-detail-view-mode'
import { ScrollArea } from '@/components/ui/scroll-area'

interface DetailViewProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: React.ReactNode
  children: React.ReactNode
  className?: string  // for custom max-width etc
  expandHref?: string // URL for the "Expand" full page link
}

export function DetailView({ open, onOpenChange, title, children, className, expandHref }: DetailViewProps) {
  const { mode } = useDetailViewMode()

  if (mode === 'drawer') {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" resizable className={className}>
          <SheetHeader>
            <div className="flex items-center justify-between pr-8">
              <SheetTitle>{title}</SheetTitle>
              {expandHref && <ExpandButton href={expandHref} />}
            </div>
          </SheetHeader>
          <ScrollArea className="flex-1 mt-4">
            {children}
          </ScrollArea>
        </SheetContent>
      </Sheet>
    )
  }

  // Default: dialog mode
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={className}>
        <DialogHeader>
          <div className="flex items-center justify-between pr-8">
            <DialogTitle>{title}</DialogTitle>
            {expandHref && <ExpandButton href={expandHref} />}
          </div>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  )
}
```

### Pattern 2: React Context for Detail View Mode
**What:** A context provider that loads user preference on mount, provides current mode, and exposes a toggle function.
**When to use:** Wrap the dashboard layout so all components can access the preference.

```typescript
// src/lib/detail-view-context.tsx
'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'

type DetailViewMode = 'dialog' | 'drawer'

interface DetailViewContextType {
  mode: DetailViewMode
  setMode: (mode: DetailViewMode) => void
  toggle: () => void
  isLoading: boolean
}

const DetailViewContext = createContext<DetailViewContextType>({
  mode: 'dialog',
  setMode: () => {},
  toggle: () => {},
  isLoading: true,
})

export function DetailViewProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<DetailViewMode>('dialog')
  const [isLoading, setIsLoading] = useState(true)

  // Load from API on mount
  useEffect(() => {
    fetch('/api/user/preferences')
      .then(res => res.json())
      .then(data => {
        if (data.detailViewMode) setModeState(data.detailViewMode)
      })
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [])

  // Persist to API
  const setMode = useCallback((newMode: DetailViewMode) => {
    setModeState(newMode)
    fetch('/api/user/preferences', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ detailViewMode: newMode }),
    }).catch(console.error)
  }, [])

  const toggle = useCallback(() => {
    setMode(mode === 'dialog' ? 'drawer' : 'dialog')
  }, [mode, setMode])

  return (
    <DetailViewContext.Provider value={{ mode, setMode, toggle, isLoading }}>
      {children}
    </DetailViewContext.Provider>
  )
}

export const useDetailViewMode = () => useContext(DetailViewContext)
```

### Pattern 3: Extending UserPreferences (Prisma schema + API)
**What:** Add a `detailViewMode` field to the existing `UserPreferences` model.
**Approach:** Use a simple String field (not enum) stored in the existing JSON pattern, OR add a dedicated column. Since the existing model uses JSON fields for other preferences, the cleanest approach is adding a dedicated `String` column with a default value.

```prisma
model UserPreferences {
  id              String  @id @default(cuid())
  userId          String  @unique @map("user_id")
  user            User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  dashboardLayout Json?   @db.Json
  dateFilter      Json?   @db.Json
  detailViewMode  String  @default("dialog") @map("detail_view_mode") @db.VarChar(20)  // NEW

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("user_preferences")
}
```

### Pattern 4: Responsive Drawer Behavior (VIEW-07)
**What:** On desktop, drawer slides from right. On mobile, drawer slides from bottom.
**How:** The existing `Sheet` component already supports `side` variants. Use a responsive approach:

```typescript
// Inside DetailView component, for drawer mode:
const isMobile = useMediaQuery('(max-width: 768px)')
const side = isMobile ? 'bottom' : 'right'

// The Sheet component's sheetVariants already handle:
// - right: "inset-y-0 right-0 h-full border-l ... w-full md:w-3/4 md:max-w-lg"
// - bottom: "inset-x-0 bottom-0 border-t ..."
```

However, a simpler approach is to always use `side="right"` since the existing Sheet component already goes full-width on mobile (`w-full md:w-3/4 md:max-w-lg`). The mobile behavior already slides from the right edge and fills the screen. If true bottom-slide is needed on mobile, use a media query or CSS-only approach.

### Anti-Patterns to Avoid
- **Duplicating Sheet/Dialog content**: Do NOT create separate drawer and dialog versions of each detail view. Use ONE wrapper component that switches the container.
- **localStorage-only persistence**: The requirements specify database persistence, not localStorage. Use the API.
- **Prop drilling mode**: Do NOT pass `mode` prop through component trees. Use React Context.
- **Modifying existing Dialog/Sheet primitives**: Do NOT change the base `dialog.tsx` or `sheet.tsx` components. Build the wrapper on top.

## Inventory of All Detail View Components to Refactor

These are ALL detail view components that currently use `Dialog` and need to be wrapped with `DetailView`:

| Component | File | Uses | Expand Target |
|-----------|------|------|---------------|
| InitiativeDetailSheet | `src/components/kanban/initiative-detail-sheet.tsx` | Dialog | `/initiatives/{id}` |
| CompanyDetailModal | `src/components/companies/company-detail-modal.tsx` | Dialog | N/A (no full page exists) |
| DealDetailSheet | `src/components/pipeline/deal-detail-sheet.tsx` | Dialog | N/A |
| PotentialDetailSheet | `src/components/potential-projects/potential-detail-sheet.tsx` | Dialog | N/A |
| ProjectDetailSheet | `src/components/projects/project-detail-sheet.tsx` | Dialog | `/projects/{id}` |
| TaskDetailSheet | `src/components/projects/task-detail-sheet.tsx` | Dialog | N/A |
| SupplierDetailModal | `src/components/suppliers/supplier-detail-modal.tsx` | Dialog | N/A |

**Key observation:** Despite names like "DetailSheet", ALL these components use the `Dialog` UI component, not `Sheet`. The naming is misleading. The existing `Sheet` component is only used by:
- `mobile-sidebar.tsx` (navigation drawer)
- `widget-bank.tsx` (dashboard widget picker)

### Consumers of Detail Views (where they are opened from)
| Detail View | Opened From |
|---|---|
| InitiativeDetailSheet | `initiatives-list.tsx`, `kanban-board.tsx`, `objective-hierarchy.tsx` |
| CompanyDetailModal | `company-list.tsx` |
| DealDetailSheet | `pipeline-board.tsx` |
| PotentialDetailSheet | `potential-board.tsx` |
| ProjectDetailSheet | `project-list.tsx` |
| TaskDetailSheet | `task-tree.tsx` |
| SupplierDetailModal | `supplier-list.tsx` |

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Drawer component | Custom drawer with CSS | Existing `Sheet` component from `ui/sheet.tsx` | Already built with proper animations, resize, side variants |
| User preference storage | Custom API/model | Extend existing `UserPreferences` model + `/api/user/preferences` route | Model and API already exist, just add a field |
| Responsive detection | Custom resize observer | CSS media queries or `side` prop on Sheet | Sheet already handles responsive sizing |
| Animation transitions | Custom CSS animations | `tailwindcss-animate` already provides slide-in/slide-out | Already configured in the Sheet/Dialog components |
| Form persistence | Custom debounce/save | Existing upsert pattern in preferences route | Already handles create-or-update |

## Common Pitfalls

### Pitfall 1: Sheet/Dialog API Differences
**What goes wrong:** Assuming Sheet and Dialog have identical APIs when wrapping them.
**Why it happens:** Both are built on `@radix-ui/react-dialog` but Sheet adds `side`, `resizable`, and different layout (no centering).
**How to avoid:** The `DetailView` wrapper must handle the structural differences:
- Dialog uses `DialogContent` (centered, with overlay)
- Sheet uses `SheetContent` with `side` prop
- Dialog allows `max-h-[85vh] overflow-y-auto` inline
- Sheet needs `ScrollArea` as a child for scrollable content
**Warning signs:** Content doesn't scroll, layout breaks on one mode but works on the other.

### Pitfall 2: Context Provider Placement
**What goes wrong:** DetailViewProvider placed too low in the tree, causing some components to not have access.
**Why it happens:** The provider needs to wrap ALL pages that might show detail views.
**How to avoid:** Add `DetailViewProvider` inside the existing `Providers` component (`src/components/providers.tsx`) or in the dashboard layout.
**Warning signs:** `useDetailViewMode()` returns default values; mode doesn't change.

### Pitfall 3: Hydration Mismatch with Preference Loading
**What goes wrong:** Server renders dialog mode, client loads drawer mode from API, causing hydration mismatch.
**Why it happens:** Preference is loaded from API (client-side only), so server always renders default.
**How to avoid:**
- Default to 'dialog' on server (matches initial state)
- Use `isLoading` state to suppress rendering until preference is loaded, OR
- Accept the brief flash (dialog opens, then switches to drawer) -- this is acceptable since the detail view opens on user interaction, not on page load
**Warning signs:** React hydration warnings, flash of wrong mode.

### Pitfall 4: ScrollArea Differences Between Dialog and Sheet
**What goes wrong:** Content that scrolls in Dialog doesn't scroll in Sheet, or vice versa.
**Why it happens:** Dialog has `overflow-y-auto` on DialogContent. Sheet needs explicit ScrollArea.
**How to avoid:** Use ScrollArea in the DetailView wrapper for both modes to ensure consistent scrolling behavior.

### Pitfall 5: Close Button Positioning
**What goes wrong:** Sheet's close button (absolute right-4 top-4) conflicts with content or is hidden.
**Why it happens:** Sheet's close button is inside SheetContent, while Dialog's is also absolute positioned.
**How to avoid:** The DetailView wrapper should handle the close button consistently. Both existing components already have X close buttons at `absolute right-4 top-4`.

### Pitfall 6: DB Migration on MySQL
**What goes wrong:** Adding a new column to `user_preferences` table fails or has unexpected behavior.
**Why it happens:** The database is MySQL (not PostgreSQL as stated in CLAUDE.md -- the schema uses `@db.VarChar` and `@db.Json` MySQL syntax, and the datasource is `mysql`).
**How to avoid:** Use `prisma db push` (as the project does, not migrations) and ensure the default value is set so existing rows don't break.

## Code Examples

### Example 1: Expanding Existing Preferences API
```typescript
// In src/app/api/user/preferences/route.ts - MODIFY existing PATCH handler
export async function PATCH(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { dashboardLayout, dateFilter, detailViewMode } = body

  const data: Record<string, unknown> = {}
  if (dashboardLayout !== undefined) data.dashboardLayout = dashboardLayout
  if (dateFilter !== undefined) data.dateFilter = dateFilter
  if (detailViewMode !== undefined) data.detailViewMode = detailViewMode  // NEW

  await prisma.userPreferences.upsert({
    where: { userId: session.user.id },
    update: data,
    create: { userId: session.user.id, ...data },
  })

  return NextResponse.json({ success: true })
}
```

### Example 2: User Menu Toggle
```typescript
// In header.tsx - add inside DropdownMenuContent, before sign-out
import { useDetailViewMode } from '@/lib/hooks/use-detail-view-mode'
import { PanelRight, Columns2 } from 'lucide-react'

// Inside Header component:
const { mode, toggle } = useDetailViewMode()

// In JSX, before sign-out:
<DropdownMenuItem onClick={(e) => { e.preventDefault(); toggle(); }}>
  {mode === 'dialog' ? (
    <>
      <PanelRight className="h-4 w-4 mr-2" />
      Switch to Drawer
    </>
  ) : (
    <>
      <Columns2 className="h-4 w-4 mr-2" />
      Switch to Dialog
    </>
  )}
</DropdownMenuItem>
<DropdownMenuSeparator />
```

### Example 3: Settings Page
```typescript
// src/app/(dashboard)/settings/page.tsx
import { Header } from '@/components/layout/header'
// Client component with mode selector using Switch or radio buttons

// The settings page follows the same layout pattern as other dashboard pages:
// - Header component at top
// - Card-based content sections
// - Uses existing UI primitives (Switch, Label, Card)
```

### Example 4: Refactoring a Detail View Component
```typescript
// Before (initiative-detail-sheet.tsx):
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

return (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="md:max-w-[650px] p-0 flex flex-col">
      <DialogHeader>...</DialogHeader>
      <ScrollArea>...</ScrollArea>
    </DialogContent>
  </Dialog>
)

// After:
import { DetailView } from '@/components/ui/detail-view'

return (
  <DetailView
    open={open}
    onOpenChange={onOpenChange}
    title={<TitleContent />}
    expandHref={`/initiatives/${initiative.id}`}
    className="md:max-w-[650px]"
  >
    <div className="p-6 space-y-6">
      {/* Same content, no longer wrapped in ScrollArea (DetailView handles it) */}
    </div>
  </DetailView>
)
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|---|---|---|---|
| All detail views use Dialog | Need Dialog + Sheet support | This phase | 7 components to refactor |
| No settings page exists | Settings page at /settings | This phase | New route needed |
| User menu has only sign-out | User menu gets quick toggle | This phase | header.tsx modification |
| UserPreferences has 2 fields | UserPreferences gets 3rd field | This phase | Schema + API change |

**Important context:**
- The Sheet component in this codebase is built on `@radix-ui/react-dialog` (NOT `@radix-ui/react-sheet` -- no such package exists). It uses `data-[state=closed]:slide-out-to-right` animations via CSS.
- The Sheet component already supports `resizable` prop with drag handle and localStorage persistence for width.
- Both Sheet and Dialog already have responsive behavior: Dialog slides from bottom on mobile, centered on desktop. Sheet goes full-width on mobile, 3/4 width on desktop.

## Open Questions

1. **Full detail pages for all entities?**
   - What we know: Only `/initiatives/{id}` has a full detail page. Other entities (companies, deals, potentials, projects, suppliers, tasks) only have modal/sheet detail views.
   - What's unclear: Should the "Expand" button exist on ALL detail views, or only those with existing full pages?
   - Recommendation: Add `expandHref` as optional prop. Only pass it for entities with existing full pages (`/initiatives/{id}`). For others, don't show the Expand button -- creating full pages is out of scope for this phase.

2. **Mobile drawer direction**
   - What we know: VIEW-07 says "slides from bottom on mobile". The existing Sheet component slides from right on all screen sizes (but goes full-width on mobile, effectively taking the whole screen).
   - What's unclear: Does "slide from bottom on mobile" mean the same as Dialog's current mobile behavior (slide from bottom)?
   - Recommendation: For drawer mode on mobile, use `side="bottom"` via media query detection. For desktop, use `side="right"`. This matches v1.2.1 patterns where Dialog already slides from bottom on mobile.

3. **Settings page scope**
   - What we know: VIEW-05 requires a settings page at `/settings`. Currently no `/settings` route exists.
   - What's unclear: Should the settings page only have the detail view mode toggle, or should it include other user settings?
   - Recommendation: Create a settings page with a "Display" or "Appearance" section containing the detail view mode toggle. Structure it to be extensible for future settings.

## Sources

### Primary (HIGH confidence)
- **Codebase analysis** - Direct reading of all 7 detail view components, Sheet/Dialog UI components, UserPreferences model, API routes, header/layout components
- **Prisma schema** - `prisma/schema.prisma` confirms MySQL database, existing UserPreferences model with JSON fields
- **Existing patterns** - Providers pattern in `providers.tsx`, preferences API pattern in `/api/user/preferences/route.ts`

### Secondary (MEDIUM confidence)
- **Radix UI Dialog** - Sheet component is built on `@radix-ui/react-dialog` (confirmed from import in `sheet.tsx`)
- **CVA variants** - Sheet `side` variants confirmed from `sheetVariants` in `sheet.tsx`

### Tertiary (LOW confidence)
- **Mobile drawer behavior** - VIEW-07 mentions "consistent with v1.2.1 patterns" but no v1.2.1 codebase was found to verify the exact pattern

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in codebase, verified from package.json and component imports
- Architecture: HIGH - Patterns derived from existing codebase conventions (context providers, preferences API, UI components)
- Detail view inventory: HIGH - All 7 detail view components identified and verified by reading source files
- Pitfalls: HIGH - Based on actual code structure differences between Dialog and Sheet components
- Mobile behavior: MEDIUM - VIEW-07 requirement clear but "v1.2.1 patterns" reference couldn't be verified

**Research date:** 2026-01-26
**Valid until:** 2026-02-26 (stable -- all patterns based on existing codebase, no external dependencies changing)
