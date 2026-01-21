# Phase 7: Admin User Management - Research

**Researched:** 2026-01-21
**Domain:** Admin user management UI, Prisma user operations, role-based access control
**Confidence:** HIGH

## Summary

Phase 7 implements admin-only user management capabilities. The admin needs to:
1. View all users with their email and role
2. Change user roles (promote VIEWER to EDITOR, demote EDITOR to VIEWER)
3. Remove users (delete from database, revoking access)

The codebase already has:
- User model with role enum (ADMIN, EDITOR, VIEWER) in Prisma schema
- Auth utilities (`requireAdmin()`) for protecting admin-only endpoints
- Middleware protection for `/admin/*` routes (redirects non-admins to /forbidden)
- UI components (Table, Select, Dialog, Button, Badge) from shadcn/ui
- Existing list pattern in `initiatives-list.tsx` to follow

**Primary recommendation:** Create a simple admin page at `/admin/users` with a table listing all users. Use inline Select dropdowns for role changes and a delete button with AlertDialog confirmation. Server Actions for mutations instead of API routes (simpler, type-safe). Prevent admin self-demotion/deletion.

## Success Criteria Mapping

| Criteria | Implementation |
|----------|----------------|
| 1. Admin can view list of all users with email and role | Admin page with Prisma `findMany` on User model |
| 2. Admin can change user role (promote/demote) | Select dropdown with Server Action for update |
| 3. Admin can remove user | Delete button with confirmation dialog, Server Action |

## Standard Stack

### Core (Already in Place)
| Library | Version | Purpose | Status |
|---------|---------|---------|--------|
| next-auth | 5.0.0-beta.30 | Authentication | Configured with JWT |
| @prisma/client | 6.19.2 | Database ORM | User model exists |
| @radix-ui/react-select | 2.2.6 | Role dropdown | Available |
| @radix-ui/react-dialog | 1.1.15 | Confirmation modal | Available |

### New Component Needed
| Library | Version | Purpose | How to Add |
|---------|---------|---------|------------|
| @radix-ui/react-alert-dialog | 1.1.x | Delete confirmation | `npx shadcn@latest add alert-dialog` |

### No New Dependencies
This phase uses existing packages. Only need to add AlertDialog component from shadcn/ui.

**Installation:**
```bash
npx shadcn@latest add alert-dialog
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   └── admin/
│       └── users/
│           └── page.tsx           # Admin users page (RSC)
├── components/
│   └── admin/
│       ├── user-list.tsx          # Client component for user table
│       └── user-actions.tsx       # Role change & delete actions
├── lib/
│   └── actions/
│       └── user-actions.ts        # Server Actions for user CRUD
```

### Pattern 1: Server Component with Client Island

**What:** Admin page is a Server Component that fetches users, renders a Client Component for interactivity.

**When to use:** When you need server-side data fetching but client-side interactivity.

**Why:** Protects data fetching on server, enables optimistic UI on client.

```typescript
// src/app/admin/users/page.tsx
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { UserList } from "@/components/admin/user-list"

export default async function AdminUsersPage() {
  // Double-check auth (middleware already protects, but defense in depth)
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    redirect("/forbidden")
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">User Management</h1>
        <p className="text-muted-foreground">
          Manage user access and roles
        </p>
      </div>
      <UserList users={users} currentUserId={session.user.id} />
    </div>
  )
}
```

### Pattern 2: Server Actions for Mutations

**What:** Use Server Actions instead of API routes for user mutations.

**When to use:** Simple CRUD operations that don't need to be called from external clients.

**Why:** Type-safe, co-located with usage, automatic revalidation.

**Source:** Next.js App Router documentation

```typescript
// src/lib/actions/user-actions.ts
"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { UserRole } from "@prisma/client"
import { revalidatePath } from "next/cache"

export async function updateUserRole(userId: string, newRole: UserRole) {
  const session = await auth()

  if (!session || session.user.role !== "ADMIN") {
    return { error: "Unauthorized" }
  }

  // Prevent admin from demoting themselves
  if (session.user.id === userId) {
    return { error: "Cannot change your own role" }
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
    })

    revalidatePath("/admin/users")
    return { success: true }
  } catch (error) {
    console.error("[ADMIN] Failed to update user role:", error)
    return { error: "Failed to update user role" }
  }
}

export async function deleteUser(userId: string) {
  const session = await auth()

  if (!session || session.user.role !== "ADMIN") {
    return { error: "Unauthorized" }
  }

  // Prevent admin from deleting themselves
  if (session.user.id === userId) {
    return { error: "Cannot delete your own account" }
  }

  try {
    await prisma.user.delete({
      where: { id: userId },
    })

    revalidatePath("/admin/users")
    return { success: true }
  } catch (error) {
    console.error("[ADMIN] Failed to delete user:", error)
    return { error: "Failed to delete user" }
  }
}
```

### Pattern 3: Inline Role Selector with Optimistic Updates

**What:** Use Select dropdown directly in table cell for role changes.

**When to use:** When editing a single field in a list.

**Why:** Reduces clicks, immediate feedback.

```typescript
// src/components/admin/user-role-select.tsx
"use client"

import { useState, useTransition } from "react"
import { UserRole } from "@prisma/client"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { updateUserRole } from "@/lib/actions/user-actions"

interface UserRoleSelectProps {
  userId: string
  currentRole: UserRole
  disabled?: boolean
}

const ROLE_OPTIONS = [
  { value: "VIEWER", label: "Viewer" },
  { value: "EDITOR", label: "Editor" },
  { value: "ADMIN", label: "Admin" },
]

export function UserRoleSelect({
  userId,
  currentRole,
  disabled,
}: UserRoleSelectProps) {
  const [isPending, startTransition] = useTransition()
  const [optimisticRole, setOptimisticRole] = useState(currentRole)

  const handleRoleChange = (newRole: UserRole) => {
    setOptimisticRole(newRole) // Optimistic update
    startTransition(async () => {
      const result = await updateUserRole(userId, newRole)
      if (result.error) {
        setOptimisticRole(currentRole) // Revert on error
        // Could add toast notification here
      }
    })
  }

  return (
    <Select
      value={optimisticRole}
      onValueChange={(value) => handleRoleChange(value as UserRole)}
      disabled={disabled || isPending}
    >
      <SelectTrigger className="w-[120px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ROLE_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
```

### Pattern 4: Delete with AlertDialog Confirmation

**What:** Use AlertDialog for destructive action confirmation.

**When to use:** Any action that cannot be undone.

**Why:** Prevents accidental deletions, follows accessibility best practices.

```typescript
// src/components/admin/delete-user-button.tsx
"use client"

import { useState, useTransition } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { deleteUser } from "@/lib/actions/user-actions"

interface DeleteUserButtonProps {
  userId: string
  userEmail: string
  disabled?: boolean
}

export function DeleteUserButton({
  userId,
  userEmail,
  disabled,
}: DeleteUserButtonProps) {
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteUser(userId)
      if (result.error) {
        // Could add toast notification here
      }
      setOpen(false)
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          disabled={disabled}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove User</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to remove {userEmail}? This action cannot be
            undone. The user will lose access to the application.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isPending}
            className="bg-red-600 hover:bg-red-700"
          >
            {isPending ? "Removing..." : "Remove User"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
```

### Anti-Patterns to Avoid

- **Allowing admin to demote/delete themselves:** Always check `session.user.id !== userId`
- **Using API routes for simple admin mutations:** Server Actions are simpler for this use case
- **Fetching users client-side:** Use Server Component to keep user list off the client bundle
- **Hardcoding roles without enum:** Use `UserRole` enum from Prisma
- **Forgetting optimistic updates:** Makes UI feel sluggish without them
- **Using confirm() for deletions:** AlertDialog is accessible, confirm() is not

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Delete confirmation | `window.confirm()` | AlertDialog | Accessible, styled |
| Role dropdown | Custom dropdown | shadcn Select | Consistent with app |
| User table | Custom table | shadcn Table | Existing pattern |
| Form mutations | Fetch + useState | Server Actions | Type-safe, simpler |
| Optimistic updates | Manual state sync | useTransition | Built into React |

**Key insight:** The existing `initiatives-list.tsx` shows the exact pattern to follow: Table with filters, inline actions, dialogs for forms. Admin user list is simpler (no filters needed, fewer columns).

## Common Pitfalls

### Pitfall 1: Admin Self-Modification
**What goes wrong:** Admin demotes themselves to VIEWER and loses admin access.
**Why it happens:** No server-side check for self-modification.
**How to avoid:** In Server Actions, compare `session.user.id` with `userId` being modified.
**Warning signs:** Admin locked out, no way to restore.

### Pitfall 2: Stale User List After Action
**What goes wrong:** User list doesn't update after role change or deletion.
**Why it happens:** Missing `revalidatePath()` in Server Actions.
**How to avoid:** Always call `revalidatePath("/admin/users")` after mutations.
**Warning signs:** Need to refresh page to see changes.

### Pitfall 3: Race Condition with Optimistic Updates
**What goes wrong:** UI shows wrong role after failed update.
**Why it happens:** Optimistic update not reverted on error.
**How to avoid:** Store original value, revert on error.
**Warning signs:** Role shows as changed but refresh shows old value.

### Pitfall 4: Deleting User with Active Sessions
**What goes wrong:** Deleted user can still access app until JWT expires.
**Why it happens:** JWT is stateless, no session revocation.
**How to avoid:** Accept limitation for now (JWT expires in 30 days). For stricter control, would need to add session checking against database on each request.
**Warning signs:** Deleted user reports they can still access app. This is expected behavior with JWT strategy.

### Pitfall 5: N+1 Query on User List
**What goes wrong:** Slow page load with many users.
**Why it happens:** Fetching related data separately.
**How to avoid:** Use `select` to fetch only needed fields. User list doesn't need relations.
**Current mitigation:** Only fetch `id, name, email, image, role, createdAt`.

## Code Examples

### Complete Admin Users Page

```typescript
// src/app/admin/users/page.tsx
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { UserList } from "@/components/admin/user-list"

export const metadata = {
  title: "User Management - Admin",
}

export default async function AdminUsersPage() {
  const session = await auth()

  // Defense in depth - middleware already checks this
  if (!session || session.user.role !== "ADMIN") {
    redirect("/forbidden")
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground">
          View and manage user access and roles
        </p>
      </div>

      <UserList users={users} currentUserId={session.user.id} />
    </div>
  )
}
```

### Complete User List Component

```typescript
// src/components/admin/user-list.tsx
"use client"

import { UserRole } from "@prisma/client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { UserRoleSelect } from "./user-role-select"
import { DeleteUserButton } from "./delete-user-button"
import { formatDistanceToNow } from "date-fns"

interface User {
  id: string
  name: string | null
  email: string | null
  image: string | null
  role: UserRole
  createdAt: Date
}

interface UserListProps {
  users: User[]
  currentUserId: string
}

function getRoleBadgeVariant(role: UserRole) {
  switch (role) {
    case "ADMIN":
      return "bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400"
    case "EDITOR":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
    case "VIEWER":
      return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
  }
}

function getInitials(name: string | null): string {
  if (!name) return "?"
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function UserList({ users, currentUserId }: UserListProps) {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => {
              const isCurrentUser = user.id === currentUserId
              return (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.image ?? undefined} />
                        <AvatarFallback>
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {user.name ?? "Unknown"}
                          {isCurrentUser && (
                            <Badge variant="outline" className="ml-2">
                              You
                            </Badge>
                          )}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.email}
                  </TableCell>
                  <TableCell>
                    <UserRoleSelect
                      userId={user.id}
                      currentRole={user.role}
                      disabled={isCurrentUser}
                    />
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDistanceToNow(user.createdAt, { addSuffix: true })}
                  </TableCell>
                  <TableCell>
                    <DeleteUserButton
                      userId={user.id}
                      userEmail={user.email ?? "this user"}
                      disabled={isCurrentUser}
                    />
                  </TableCell>
                </TableRow>
              )
            })}

            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <p className="text-muted-foreground">No users found</p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>

      <div className="px-4 py-3 border-t text-sm text-muted-foreground">
        {users.length} user{users.length !== 1 ? "s" : ""} total
      </div>
    </Card>
  )
}
```

### Complete Server Actions

```typescript
// src/lib/actions/user-actions.ts
"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { UserRole } from "@prisma/client"
import { revalidatePath } from "next/cache"

type ActionResult = { success: true } | { error: string }

export async function updateUserRole(
  userId: string,
  newRole: UserRole
): Promise<ActionResult> {
  const session = await auth()

  if (!session || session.user.role !== "ADMIN") {
    console.log("[ADMIN] Unauthorized attempt to update user role")
    return { error: "Unauthorized" }
  }

  if (session.user.id === userId) {
    console.log("[ADMIN] Blocked self-role-change attempt:", session.user.email)
    return { error: "You cannot change your own role" }
  }

  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
      select: { email: true },
    })

    console.log(
      `[ADMIN] ${session.user.email} changed ${user.email} role to ${newRole}`
    )

    revalidatePath("/admin/users")
    return { success: true }
  } catch (error) {
    console.error("[ADMIN] Failed to update user role:", error)
    return { error: "Failed to update user role" }
  }
}

export async function deleteUser(userId: string): Promise<ActionResult> {
  const session = await auth()

  if (!session || session.user.role !== "ADMIN") {
    console.log("[ADMIN] Unauthorized attempt to delete user")
    return { error: "Unauthorized" }
  }

  if (session.user.id === userId) {
    console.log("[ADMIN] Blocked self-deletion attempt:", session.user.email)
    return { error: "You cannot delete your own account" }
  }

  try {
    const user = await prisma.user.delete({
      where: { id: userId },
      select: { email: true },
    })

    console.log(`[ADMIN] ${session.user.email} deleted user ${user.email}`)

    revalidatePath("/admin/users")
    return { success: true }
  } catch (error) {
    console.error("[ADMIN] Failed to delete user:", error)
    return { error: "Failed to delete user" }
  }
}
```

## UI Design Notes

### User List Table Columns

| Column | Content | Width |
|--------|---------|-------|
| User | Avatar + Name (+ "You" badge if current user) | auto |
| Email | user@example.com | auto |
| Role | Select dropdown (ADMIN/EDITOR/VIEWER) | 120px |
| Joined | "2 days ago" (date-fns) | auto |
| Actions | Delete button | 100px |

### Visual Indicators

- **Current user row:** "You" badge, disabled role select and delete button
- **Role badges:** Purple for ADMIN, Blue for EDITOR, Gray for VIEWER
- **Delete button:** Red ghost icon, destructive AlertDialog

### Admin Navigation

Add "Users" link to sidebar when user is ADMIN:

```typescript
// In sidebar component, conditionally render:
{session?.user?.role === "ADMIN" && (
  <NavLink href="/admin/users" icon={Users}>
    Users
  </NavLink>
)}
```

## Implementation Order Recommendation

1. **Add AlertDialog component** (shadcn/ui)
   ```bash
   npx shadcn@latest add alert-dialog
   ```

2. **Create Server Actions** (`src/lib/actions/user-actions.ts`)
   - `updateUserRole()` with self-check
   - `deleteUser()` with self-check

3. **Create Admin Page** (`src/app/admin/users/page.tsx`)
   - Server Component with auth check
   - Fetch users with Prisma

4. **Create User List Components**
   - `src/components/admin/user-list.tsx` - Main table
   - `src/components/admin/user-role-select.tsx` - Role dropdown
   - `src/components/admin/delete-user-button.tsx` - Delete with dialog

5. **Update Sidebar Navigation**
   - Add "Users" link for ADMIN role

6. **Test all scenarios**
   - View user list
   - Change role (verify revalidation)
   - Delete user (verify confirmation dialog)
   - Verify admin cannot change own role
   - Verify admin cannot delete self

## Security Considerations

1. **Defense in depth:** Middleware protects `/admin/*` routes, but Server Actions also check auth
2. **Self-protection:** Server Actions prevent admin from modifying/deleting themselves
3. **Audit logging:** Console logs all admin actions with actor email
4. **JWT limitation:** Deleted users retain access until JWT expires (30 days). Acceptable for this app's scope.

## Open Questions

1. **Should deleted users be soft-deleted instead?**
   - What we know: Currently using hard delete (Prisma `delete`)
   - What's unclear: Business requirement for audit trail
   - Recommendation: Hard delete is fine for this app. No regulatory requirements.

2. **Should role changes require confirmation?**
   - What we know: Deletes have AlertDialog, role changes are inline
   - What's unclear: User preference
   - Recommendation: Inline is fine. Role changes are reversible.

## Sources

### Primary (HIGH confidence)
- Codebase: `src/auth.ts`, `src/auth.config.ts`, `src/lib/auth-utils.ts`
- Codebase: `src/components/initiatives/initiatives-list.tsx` (pattern reference)
- Codebase: `prisma/schema.prisma` (User model, UserRole enum)
- Next.js App Router documentation for Server Actions

### Secondary (MEDIUM confidence)
- shadcn/ui documentation for AlertDialog component
- date-fns documentation for formatDistanceToNow

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Page structure: HIGH - Following existing patterns in codebase
- Server Actions: HIGH - Standard Next.js App Router pattern
- User CRUD: HIGH - Simple Prisma operations
- Self-protection logic: HIGH - Straightforward comparison

**Research date:** 2026-01-21
**Valid until:** 2026-03-21 (60 days - patterns stable)

---
*Research complete. Ready for planning.*
