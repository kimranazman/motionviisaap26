# Phase 1: Navigation & Detail Page - Research

**Researched:** 2026-01-20
**Domain:** Next.js App Router, Dynamic Routes, Inline Editing UI Patterns
**Confidence:** HIGH

## Summary

This phase involves two distinct workstreams: (1) cleaning up dead navigation links in the sidebar and header, and (2) building a new initiative detail page with inline editing and comments. The codebase already has all necessary infrastructure in place - API routes for CRUD operations on initiatives and comments exist and are tested, UI components from shadcn/ui are available, and established patterns for page structure and data fetching are documented.

The navigation cleanup is straightforward removal work. The detail page requires creating a new dynamic route `/initiatives/[id]/page.tsx` that leverages the existing `InitiativeDetailSheet` component patterns (comments, status editing) but surfaces them on a dedicated page instead of a slide-out sheet.

**Primary recommendation:** Build the detail page as a Server Component that fetches initiative data, passing to a Client Component for inline editing. Reuse existing patterns from `initiative-detail-sheet.tsx` and `initiative-form.tsx` rather than creating new patterns.

## Standard Stack

This phase uses only technologies already in the codebase - no new dependencies needed.

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | ^14.2.28 | App Router with dynamic routes | Already in use, provides `[id]` route pattern |
| React | ^18 | UI components | Already in use |
| Prisma | ^6.19.2 | Database ORM | Already in use for all data operations |

### UI Components (Already Installed via shadcn/ui)
| Component | Location | Purpose | When to Use |
|-----------|----------|---------|-------------|
| Card | `@/components/ui/card` | Detail page sections | Main content wrapper |
| Tabs | `@/components/ui/tabs` | Organize detail sections | If content grows complex |
| Separator | `@/components/ui/separator` | Visual section dividers | Between info blocks |
| Badge | `@/components/ui/badge` | Status, department display | Read-only info display |
| Select | `@/components/ui/select` | Inline status/assignment edit | Editable dropdowns |
| Textarea | `@/components/ui/textarea` | Inline text editing | Long text fields |
| Input | `@/components/ui/input` | Inline text editing | Short text fields |
| Button | `@/components/ui/button` | Actions | Save, back navigation |
| Avatar | `@/components/ui/avatar` | Comment authors | User display |
| ScrollArea | `@/components/ui/scroll-area` | Comments list | If many comments |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Inline editing | Full edit page | Inline is better UX, already proven in detail sheet |
| Custom form | React Hook Form | Overkill for single-entity editing, existing pattern works |
| Toast notifications | Alert | Toast would be better UX but not currently in stack |

**Installation:** No new packages needed.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   └── (dashboard)/
│       └── initiatives/
│           ├── page.tsx                    # List page (exists)
│           └── [id]/
│               └── page.tsx                # NEW: Detail page
├── components/
│   └── initiatives/
│       ├── initiatives-list.tsx            # Exists, update links
│       ├── initiative-form.tsx             # Exists, reusable
│       └── initiative-detail.tsx           # NEW: Detail view component
└── components/
    └── layout/
        ├── sidebar.tsx                     # Exists, remove Settings link
        └── header.tsx                      # Exists, clean user dropdown
```

### Pattern 1: Server Component Page with Client Component Detail
**What:** Page fetches data server-side, Client Component handles interactivity
**When to use:** For the detail page - need server-side data + client-side editing
**Example:**
```typescript
// src/app/(dashboard)/initiatives/[id]/page.tsx
export const dynamic = 'force-dynamic'

import prisma from '@/lib/prisma'
import { InitiativeDetail } from '@/components/initiatives/initiative-detail'
import { notFound } from 'next/navigation'

async function getInitiative(id: string) {
  const initiative = await prisma.initiative.findUnique({
    where: { id },
    include: { comments: { orderBy: { createdAt: 'desc' } } }
  })

  if (!initiative) return null

  // Serialize dates/decimals
  return {
    ...initiative,
    startDate: initiative.startDate.toISOString(),
    endDate: initiative.endDate.toISOString(),
    // ... other serialization
  }
}

export default async function InitiativeDetailPage({
  params
}: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const initiative = await getInitiative(id)

  if (!initiative) notFound()

  return <InitiativeDetail initiative={initiative} />
}
```
Source: Existing pattern from `src/app/(dashboard)/kanban/page.tsx`

### Pattern 2: Inline Editing with Optimistic Updates
**What:** User edits fields directly, changes save to API without full form submission
**When to use:** For status, assignment, and text field editing on detail page
**Example:**
```typescript
// From existing initiative-detail-sheet.tsx pattern
const handleSave = async () => {
  setIsSaving(true)
  try {
    const response = await fetch(`/api/initiatives/${initiative.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, personInCharge }),
    })
    if (response.ok) {
      const updated = await response.json()
      // Update local state
    }
  } catch (error) {
    console.error('Failed to save:', error)
  } finally {
    setIsSaving(false)
  }
}
```
Source: `src/components/kanban/initiative-detail-sheet.tsx` lines 121-144

### Pattern 3: Comments Section
**What:** List existing comments, add new comments with author selection
**When to use:** Initiative detail page comments section
**Example:** Reuse pattern from `initiative-detail-sheet.tsx` lines 310-418
Source: Existing implementation in codebase

### Anti-Patterns to Avoid
- **Separate edit page at `/initiatives/[id]/edit`:** The requirements specify inline editing on the detail page. Do NOT create a separate edit route - remove the edit link that currently exists.
- **Modal for editing:** User should edit inline on the page, not in a popup. This is different from the list page create dialog.
- **Page refresh after save:** Use local state updates after successful API calls, not router.refresh().

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Date formatting | Custom formatter | `formatDate` from utils | Already handles locale, null checks |
| Status color mapping | Inline styles | `getStatusColor` from utils | Consistent with rest of app |
| Team member display | Raw enum values | `formatTeamMember` from utils | Proper capitalization |
| Form dropdowns | Custom selects | `STATUS_OPTIONS`, `TEAM_MEMBER_OPTIONS` | Single source of truth |
| Comment time display | Manual calculation | Pattern from detail-sheet | Already handles relative time |

**Key insight:** The existing `initiative-detail-sheet.tsx` component already implements 80% of what the detail page needs (comments, status editing, person assignment). Extract and adapt that logic rather than rewriting.

## Common Pitfalls

### Pitfall 1: Missing Date Serialization
**What goes wrong:** Passing Prisma Date objects directly to Client Components causes hydration errors
**Why it happens:** Server Components can handle Date objects, but Client Components need serialized strings
**How to avoid:** Always convert Date to ISO string in the page's data-fetching function
**Warning signs:** "Text content does not match server-rendered HTML" errors

### Pitfall 2: Forgetting notFound() for Invalid IDs
**What goes wrong:** App crashes or shows cryptic error when accessing invalid initiative ID
**Why it happens:** Prisma returns null for non-existent records
**How to avoid:** Check for null result and call `notFound()` from `next/navigation`
**Warning signs:** Unhandled null reference errors in production

### Pitfall 3: Stale Data After Updates
**What goes wrong:** User saves changes but other parts of the page show old data
**Why it happens:** Multiple state variables not updated together
**How to avoid:** Update all related local state after successful API call, or refetch
**Warning signs:** Saving status shows success but badge still shows old status

### Pitfall 4: Link Href Typos
**What goes wrong:** Links go to wrong routes or cause 404s
**Why it happens:** Dynamic route paths are strings, easy to mistype
**How to avoid:** Use template literals consistently: `/initiatives/${initiative.id}`
**Warning signs:** 404 pages when clicking links

### Pitfall 5: Hardcoded User for Comments
**What goes wrong:** All comments appear from same user
**Why it happens:** No auth system means author must be selected manually
**How to avoid:** Keep the author selection dropdown (matches existing pattern in detail-sheet)
**Warning signs:** Comments lack author attribution UI

## Code Examples

Verified patterns from the existing codebase:

### Data Serialization Pattern
```typescript
// From src/app/(dashboard)/initiatives/page.tsx
return initiatives.map(i => ({
  ...i,
  startDate: i.startDate.toISOString(),
  endDate: i.endDate.toISOString(),
  createdAt: i.createdAt.toISOString(),
  updatedAt: i.updatedAt.toISOString(),
  resourcesFinancial: i.resourcesFinancial ? Number(i.resourcesFinancial) : null,
}))
```

### API PATCH for Inline Edits
```typescript
// From src/app/api/initiatives/[id]/route.ts
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()

  const updateData: Prisma.InitiativeUpdateInput = {}
  if (body.status !== undefined) updateData.status = body.status
  if (body.position !== undefined) updateData.position = body.position
  if (body.remarks !== undefined) updateData.remarks = body.remarks

  const initiative = await prisma.initiative.update({
    where: { id },
    data: updateData,
  })

  return NextResponse.json(initiative)
}
```

### Comment Submission Pattern
```typescript
// From src/components/kanban/initiative-detail-sheet.tsx
const handleSubmitComment = async () => {
  if (!initiative || !newComment.trim()) return

  setIsSubmittingComment(true)
  try {
    const response = await fetch(`/api/initiatives/${initiative.id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: newComment,
        author: commentAuthor,
      }),
    })

    if (response.ok) {
      const comment = await response.json()
      setComments(prev => [comment, ...prev])
      setNewComment('')
    }
  } catch (error) {
    console.error('Failed to add comment:', error)
  } finally {
    setIsSubmittingComment(false)
  }
}
```

### Relative Comment Time Display
```typescript
// From src/components/kanban/initiative-detail-sheet.tsx
const formatCommentTime = (dateStr: string) => {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-MY', { month: 'short', day: 'numeric' })
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Pages Router `/pages/` | App Router `src/app/` | Next.js 13 (2022) | Already using App Router |
| API Routes in pages | Route Handlers in app | Next.js 13 (2022) | Already using new pattern |
| getServerSideProps | async Server Components | Next.js 13 (2022) | Already using RSC |

**Deprecated/outdated:**
- No deprecated patterns to worry about - codebase is on modern Next.js 14

## Open Questions

Things that couldn't be fully resolved:

1. **Edit All Fields or Just Some Inline?**
   - What we know: Requirements say "edit initiative fields inline"
   - What's unclear: Does this mean all fields or just common ones (status, person, dates)?
   - Recommendation: Start with status, person in charge, and remarks (matching detail-sheet). Can expand later if needed.

2. **Back Navigation Behavior**
   - What we know: User will access detail from multiple entry points (list, kanban, dashboard, calendar, timeline)
   - What's unclear: Should "Back" go to previous page or always to initiatives list?
   - Recommendation: Use `router.back()` for natural navigation, with fallback to `/initiatives`

3. **Confirm Delete for Comments**
   - What we know: Current detail-sheet deletes comments without confirmation
   - What's unclear: Whether this matches desired UX
   - Recommendation: Keep existing pattern (no confirm) for MVP, noted in CONCERNS.md

## Sources

### Primary (HIGH confidence)
- Codebase analysis: `src/components/kanban/initiative-detail-sheet.tsx` - Full implementation of comments and inline editing
- Codebase analysis: `src/app/api/initiatives/[id]/route.ts` - API patterns for PATCH updates
- Codebase analysis: `src/app/(dashboard)/initiatives/page.tsx` - Page structure pattern
- Codebase analysis: `.planning/codebase/CONVENTIONS.md` - Coding standards
- Codebase analysis: `.planning/codebase/ARCHITECTURE.md` - Data flow patterns

### Secondary (MEDIUM confidence)
- Next.js documentation (known): Dynamic routes with `[param]` folders
- Next.js documentation (known): `notFound()` function usage

### Tertiary (LOW confidence)
- None - all patterns verified from existing codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in use, no new dependencies
- Architecture: HIGH - Following established patterns from existing code
- Pitfalls: HIGH - Based on actual bugs documented in CONCERNS.md

**Research date:** 2026-01-20
**Valid until:** No expiration - internal patterns, not external dependencies

---

## Files to Modify (Summary)

### Navigation Cleanup
1. `src/components/layout/sidebar.tsx` - Remove Settings link (lines 66-73)
2. `src/components/layout/header.tsx` - Remove Profile/Settings/Logout from dropdown (lines 70-73)

### Initiative Links (Already Correct - Just Verify)
These files link to `/initiatives/[id]` which will work once detail page exists:
- `src/components/initiatives/initiatives-list.tsx` (line 209) - Keep view link, remove edit link (line 214-216)
- `src/components/dashboard/recent-initiatives.tsx` (line 48) - Already correct
- `src/components/calendar/calendar-view.tsx` (line 281) - Already correct
- `src/components/timeline/gantt-chart.tsx` (line 189) - Already correct
- `src/components/kanban/kanban-card.tsx` (line 79) - Already correct
- `src/components/kanban/kanban-swimlane-view.tsx` (line 74) - Already correct

### New Files to Create
1. `src/app/(dashboard)/initiatives/[id]/page.tsx` - Detail page (Server Component)
2. `src/components/initiatives/initiative-detail.tsx` - Detail view (Client Component)
