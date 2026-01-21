# Phase 8: Role-Based UI - Research

**Researched:** 2026-01-21
**Domain:** Role-based conditional rendering in React/NextAuth.js
**Confidence:** HIGH

## Summary

This phase adapts UI elements based on user role (VIEWER, EDITOR, ADMIN). The codebase already has the foundation in place:
- Session includes `user.role` (UserRole enum from Prisma: VIEWER, EDITOR, ADMIN)
- `useSession()` from NextAuth.js v5 provides client-side access to role
- Sidebar already conditionally shows Admin section for ADMIN role
- API routes already protect mutations with `requireEditor()` returning 403

The primary work is adding conditional rendering to hide/disable edit controls for VIEWERs and handling 403 errors gracefully when they attempt blocked actions via direct URL access.

**Primary recommendation:** Use conditional rendering with `session?.user?.role` checks in client components. Pass role as prop or use custom `useCanEdit()` hook. For high-value controls, show disabled with tooltip rather than hiding completely.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next-auth | 5.0.0-beta.30 | Session/role access | Already in use, `useSession()` provides role |
| @radix-ui/react-tooltip | 1.2.8 | Disabled control hints | Already installed, shadcn/ui tooltip component |
| @radix-ui/react-dialog | 1.1.15 | Permission denied modal | Already installed, shadcn/ui dialog component |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @dnd-kit/core | 6.3.1 | Disable drag for VIEWERs | `disabled` prop on useSortable |
| sonner | (not installed) | Toast notifications | Consider for API error feedback |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| sonner/react-hot-toast | In-place error messages | Dialog modal already decided for permission errors per CONTEXT.md |
| Context-based permission hook | Direct `useSession()` checks | Context adds complexity; direct checks are simpler for this app size |

**Note:** Toast library not needed. CONTEXT.md specifies dialog modal for permission errors, not toast.

## Architecture Patterns

### Recommended Permission Check Pattern

```typescript
// src/lib/permissions.ts
import { UserRole } from "@prisma/client"

export function canEdit(role: UserRole | undefined): boolean {
  return role === UserRole.ADMIN || role === UserRole.EDITOR
}

export function isAdmin(role: UserRole | undefined): boolean {
  return role === UserRole.ADMIN
}
```

### Pattern 1: Conditional Rendering in Components

**What:** Check role and conditionally render edit controls
**When to use:** For components that show/hide controls based on role

```typescript
// Source: Existing codebase pattern (sidebar.tsx)
'use client'

import { useSession } from 'next-auth/react'
import { canEdit } from '@/lib/permissions'

export function InitiativeDetail({ initiative }: Props) {
  const { data: session } = useSession()
  const userCanEdit = canEdit(session?.user?.role)

  return (
    <div>
      {/* Read-only display always visible */}
      <div>{initiative.title}</div>

      {/* Edit controls only for EDITOR/ADMIN */}
      {userCanEdit && (
        <Select value={status} onValueChange={setStatus}>
          {/* ... */}
        </Select>
      )}
    </div>
  )
}
```

### Pattern 2: Disabled with Tooltip (High-Value Controls)

**What:** Show control but disabled with explanatory tooltip
**When to use:** For high-value controls where hiding might confuse users

```typescript
// Source: Radix UI + shadcn/ui pattern
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'

// Wrapper needed because disabled buttons don't fire mouse events
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <span tabIndex={0}> {/* Wrapper enables tooltip on disabled */}
        <Button disabled={!userCanEdit}>
          Edit
        </Button>
      </span>
    </TooltipTrigger>
    {!userCanEdit && (
      <TooltipContent>
        <p>Requires Editor or Admin role</p>
      </TooltipContent>
    )}
  </Tooltip>
</TooltipProvider>
```

### Pattern 3: Permission Denied Dialog

**What:** Modal dialog when user accesses restricted content
**When to use:** For direct URL access to edit pages or blocked actions

```typescript
// Source: Radix Dialog + Next.js router pattern
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { canEdit } from '@/lib/permissions'

interface PermissionDeniedDialogProps {
  isOpen: boolean
  requiredRole: 'editor' | 'admin'
  redirectTo?: string
}

export function PermissionDeniedDialog({
  isOpen,
  requiredRole,
  redirectTo = '/'
}: PermissionDeniedDialogProps) {
  const router = useRouter()

  const handleDismiss = () => {
    router.push(redirectTo)
  }

  const roleText = requiredRole === 'admin' ? 'Admin' : 'Editor or Admin'

  return (
    <Dialog open={isOpen} onOpenChange={() => handleDismiss()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Permission Denied</DialogTitle>
          <DialogDescription>
            You don&apos;t have permission to access this feature.
            This action requires {roleText} role.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={handleDismiss}>OK</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

### Pattern 4: Disabling DnD-Kit Drag for VIEWERs

**What:** Disable drag-and-drop functionality based on role
**When to use:** Kanban board for VIEWER users

```typescript
// Source: dnd-kit documentation
import { useSortable } from '@dnd-kit/sortable'

interface KanbanCardProps {
  item: Initiative
  canEdit: boolean  // Pass from parent based on role
}

export function KanbanCard({ item, canEdit }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    id: item.id,
    disabled: !canEdit  // Disables drag when false
  })

  // When disabled, don't spread listeners (prevents drag cursor)
  const dragListeners = canEdit ? listeners : {}

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...dragListeners}  // Only attach when can edit
      className={cn(
        'bg-white rounded-2xl',
        canEdit ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
      )}
    >
      {/* Card content */}
    </div>
  )
}
```

### Pattern 5: API 403 Error Handling

**What:** Handle 403 responses from API calls gracefully
**When to use:** When VIEWER attempts mutation that bypasses UI controls

```typescript
// Per CONTEXT.md: Show dialog modal, not toast
const handleSave = async () => {
  try {
    const response = await fetch(`/api/initiatives/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (response.status === 403) {
      // Show permission dialog
      setShowPermissionDenied(true)
      return
    }

    if (!response.ok) {
      throw new Error('Failed to save')
    }

    // Success handling
  } catch (error) {
    console.error('Save failed:', error)
  }
}
```

### Anti-Patterns to Avoid

- **Client-only role checks:** Always verify role server-side too. API already does this with `requireEditor()` - good.
- **Hiding everything:** Per CONTEXT.md, some controls should show disabled+tooltip to hint at capabilities
- **Blocking comment form:** Per CONTEXT.md, VIEWERs CAN add comments (collaboration feature)
- **Complex permission context:** For 3 roles and simple checks, direct `useSession()` is sufficient

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Tooltip on disabled button | Custom hover handler | `<span>` wrapper around button | Disabled elements don't fire mouse events |
| Session access | Custom auth context | `useSession()` from next-auth | Already provides role via JWT callbacks |
| Modal with overlay | Custom portal | shadcn/ui Dialog component | Handles focus trap, escape key, accessibility |
| Drag disable | Custom drag blocker | `useSortable({ disabled })` | Built into dnd-kit |

**Key insight:** The codebase already has all necessary UI primitives installed. Use them.

## Common Pitfalls

### Pitfall 1: Tooltip on Disabled Button Not Showing

**What goes wrong:** Tooltip never appears on disabled button
**Why it happens:** Disabled buttons don't fire `onMouseEnter` events
**How to avoid:** Wrap button in `<span tabIndex={0}>` to enable pointer events on wrapper
**Warning signs:** Tooltip works on enabled button but not disabled

### Pitfall 2: DnD Cursor Still Shows Grab

**What goes wrong:** Cursor shows grab icon even though drag is disabled
**Why it happens:** CSS cursor style not updated when disabled
**How to avoid:** Conditionally apply cursor class: `canEdit ? 'cursor-grab' : 'cursor-default'`
**Warning signs:** Visual mismatch between disabled state and cursor

### Pitfall 3: Quick Action Menu Still Visible

**What goes wrong:** Kanban card quick action menu (MoreHorizontal) still shows for VIEWERs
**Why it happens:** Menu visibility controlled by CSS hover, not role
**How to avoid:** Wrap entire menu in role check: `{canEdit && <DropdownMenu>...`
**Warning signs:** VIEWER can open menu even if actions fail

### Pitfall 4: API Errors Not Surfaced

**What goes wrong:** User clicks disabled-looking control, nothing happens
**Why it happens:** 403 caught but no UI feedback provided
**How to avoid:** Per CONTEXT.md, show permission dialog on 403
**Warning signs:** Silent failures after API calls

### Pitfall 5: Session Loading State

**What goes wrong:** Controls flash visible then hide during session load
**Why it happens:** `session` is undefined during loading
**How to avoid:** Check `status === 'loading'` from useSession
**Warning signs:** UI flicker on page load

```typescript
const { data: session, status } = useSession()

// Don't render edit controls until session loaded
if (status === 'loading') return <Skeleton />

const canEdit = session?.user?.role === 'ADMIN' || session?.user?.role === 'EDITOR'
```

### Pitfall 6: Blocking Comment Form Incorrectly

**What goes wrong:** Comment form hidden for VIEWERs
**Why it happens:** Misreading requirements - comments are for all users
**How to avoid:** Per CONTEXT.md, VIEWERs CAN add comments. Only hide DELETE button.
**Warning signs:** VIEWER can't participate in discussions

## Code Examples

Verified patterns from official sources and existing codebase:

### Permission Utility Functions

```typescript
// src/lib/permissions.ts
import { UserRole } from "@prisma/client"

/**
 * Check if user role can edit content
 * ADMIN and EDITOR can edit; VIEWER cannot
 */
export function canEdit(role: UserRole | undefined): boolean {
  if (!role) return false
  return role === UserRole.ADMIN || role === UserRole.EDITOR
}

/**
 * Check if user role is admin
 */
export function isAdmin(role: UserRole | undefined): boolean {
  return role === UserRole.ADMIN
}
```

### useCanEdit Custom Hook (Optional)

```typescript
// src/lib/hooks/use-can-edit.ts
'use client'

import { useSession } from 'next-auth/react'
import { canEdit, isAdmin } from '@/lib/permissions'

export function usePermissions() {
  const { data: session, status } = useSession()

  return {
    canEdit: canEdit(session?.user?.role),
    isAdmin: isAdmin(session?.user?.role),
    isLoading: status === 'loading',
    role: session?.user?.role,
  }
}
```

### Initiative Detail with Role-Based Controls

```typescript
// Adapted from existing initiative-detail.tsx
'use client'

import { useSession } from 'next-auth/react'
import { canEdit } from '@/lib/permissions'
// ... other imports

export function InitiativeDetail({ initiative }: Props) {
  const { data: session, status } = useSession()
  const userCanEdit = canEdit(session?.user?.role)

  // Show loading state to prevent flash
  if (status === 'loading') {
    return <DetailSkeleton />
  }

  return (
    <div>
      {/* Status - Editable only for Editor/Admin */}
      <div className="space-y-1.5">
        <label>Status</label>
        {userCanEdit ? (
          <Select value={status} onValueChange={setStatus}>
            {/* Select options */}
          </Select>
        ) : (
          <div className="h-9 px-3 flex items-center text-sm bg-gray-50 rounded-md border">
            <Badge className={getStatusColor(initiative.status)}>
              {formatStatus(initiative.status)}
            </Badge>
          </div>
        )}
      </div>

      {/* Comments - Available to ALL users per CONTEXT.md */}
      <div className="space-y-4">
        {/* Comment input - VIEWER can add */}
        <CommentInput onSubmit={handleSubmitComment} />

        {/* Comments list - delete button only for Editor/Admin */}
        {comments.map(comment => (
          <Comment
            key={comment.id}
            comment={comment}
            canDelete={userCanEdit}  // Only Editor/Admin can delete
          />
        ))}
      </div>
    </div>
  )
}
```

### Kanban Card with Disabled Drag

```typescript
// Adapted from existing kanban-card.tsx
export function KanbanCard({ item, isDragging, onClick, onStatusChange, onReassign, canEdit }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSorting,
  } = useSortable({
    id: item.id,
    disabled: !canEdit  // Disable drag for VIEWERs
  })

  // Only attach drag listeners when user can edit
  const dragListeners = canEdit ? listeners : {}

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...dragListeners}
      className={cn(
        'group relative bg-white rounded-2xl border-0 shadow-apple',
        canEdit && 'cursor-grab active:cursor-grabbing',
        !canEdit && 'cursor-default',
        // ... other classes
      )}
    >
      {/* Quick Actions Menu - Only for Editor/Admin */}
      {canEdit && (
        <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100">
          <DropdownMenu>
            {/* Menu content */}
          </DropdownMenu>
        </div>
      )}

      {/* Card content - always visible */}
      <div className="p-4">
        {/* ... */}
      </div>
    </div>
  )
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| next-auth v4 `getSession()` | next-auth v5 `auth()` or `useSession()` | 2024 | Use `auth()` in server components, `useSession()` in client |
| HOC wrappers for auth | Direct hook usage | React 18+ | Simpler, more readable |
| RBAC middleware-only | UI + API dual enforcement | Best practice | Defense in depth |

**Current approach validation:**
- Sidebar already uses `useSession()` for admin check - correct pattern
- API routes use `requireEditor()` for server-side enforcement - correct pattern
- This phase extends the existing pattern to more components

## Open Questions

Things that couldn't be fully resolved:

1. **Which controls get disabled+tooltip vs hidden completely?**
   - CONTEXT.md says Claude decides
   - **Recommendation:** High-value, frequently used controls (Status dropdown, Reassign) get disabled+tooltip. Less critical controls (quick action menu) get hidden completely.

2. **Comment author selector for VIEWERs?**
   - Currently hardcoded author selector exists
   - **Recommendation:** When full auth integration happens, comment author should come from session user. For now, keep selector but perhaps default to session user's name.

3. **Edit page direct access (e.g., /initiatives/[id]/edit)?**
   - No dedicated edit page exists currently - edits happen inline
   - **Recommendation:** If edit pages added later, redirect VIEWERs with permission dialog.

## Sources

### Primary (HIGH confidence)
- NextAuth.js v5 documentation - useSession hook, role-based access control
- Existing codebase files:
  - `/src/components/layout/sidebar.tsx` - existing role check pattern
  - `/src/lib/auth-utils.ts` - existing server-side role checks
  - `/src/components/kanban/kanban-card.tsx` - existing dnd-kit usage
  - `/src/components/ui/tooltip.tsx` - existing tooltip component
  - `/src/components/ui/dialog.tsx` - existing dialog component

### Secondary (MEDIUM confidence)
- [Auth.js RBAC Guide](https://authjs.dev/guides/role-based-access-control) - Role-based access patterns
- [dnd-kit Documentation](https://docs.dndkit.com/api-documentation/draggable/usedraggable) - disabled prop usage
- [shadcn/ui GitHub Issue #1022](https://github.com/shadcn-ui/ui/issues/1022) - Tooltip on disabled button workaround

### Tertiary (LOW confidence)
- WebSearch results for React conditional rendering patterns - general guidance confirmed by codebase patterns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already installed and in use
- Architecture patterns: HIGH - Extends existing patterns (sidebar role check)
- Pitfalls: HIGH - Based on actual codebase investigation and documented issues

**Research date:** 2026-01-21
**Valid until:** Stable - patterns unlikely to change. Revalidate if upgrading next-auth or dnd-kit.
