# Phase 6: Route Protection - Research

**Researched:** 2026-01-21
**Domain:** Auth.js v5 route protection, API authentication, role-based access control
**Confidence:** HIGH

## Summary

Phase 6 builds on the existing auth foundation (Phase 4) and role infrastructure (Phase 5) to protect routes and API endpoints. The current state already includes:

1. **Middleware** (`src/middleware.ts`) - Redirects unauthenticated users to login (PROT-01 done)
2. **Session with role** - `session.user.role` available via JWT callbacks
3. **Auth function** - `auth()` exported from `src/auth.ts` for session access

The remaining work is:
1. Protect API routes from unauthenticated access (401 responses)
2. Add role checking for authorization (403 responses)
3. Block non-admin users from /admin/* routes

**Primary recommendation:** Create reusable utility functions in `src/lib/auth-utils.ts` for consistent API protection. Use middleware enhancement for /admin/* route blocking. Avoid using Next.js 15's experimental `forbidden()`/`unauthorized()` functions.

## Success Criteria Mapping

| Criteria | Current State | Implementation Needed |
|----------|---------------|----------------------|
| 1. Unauthenticated user visiting any page is redirected to login | DONE (middleware.ts) | None |
| 2. API call without session returns 401 Unauthorized | NOT DONE | Add auth check to all API route handlers |
| 3. API call with wrong role returns 403 Forbidden | NOT DONE | Add role check utilities, apply to protected endpoints |
| 4. Non-admin user visiting /admin/* routes is blocked | NOT DONE | Enhance middleware OR layout-level check |

## Standard Stack

### Core (Already in Place)
| Library | Version | Purpose | Status |
|---------|---------|---------|--------|
| next-auth | 5.0.0-beta.30 | Authentication | Configured |
| @auth/prisma-adapter | 2.11.1 | Database adapter | Configured |
| next | 15.x | Framework | App Router |

### No New Dependencies
This phase requires no additional packages. All protection is implemented using existing Auth.js exports and standard Next.js patterns.

## Architecture Patterns

### Current File Structure (Relevant)
```
src/
├── auth.ts                      # Exports: auth, signIn, signOut, handlers
├── auth.config.ts               # Edge-safe config with authorized callback
├── middleware.ts                # Route protection (unauthenticated redirect)
├── lib/
│   ├── prisma.ts                # Prisma client
│   └── auth-utils.ts            # NEW: Reusable auth utilities
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/  # Auth handlers
│   │   ├── initiatives/         # NEEDS PROTECTION
│   │   ├── dashboard/           # NEEDS PROTECTION
│   │   ├── events-to-attend/    # NEEDS PROTECTION
│   │   └── notifications/       # NEEDS PROTECTION
│   ├── (dashboard)/             # Protected by middleware
│   ├── (auth)/                  # Public (login, access-denied)
│   └── admin/                   # NEW: Admin-only routes (Phase 7)
└── types/
    └── next-auth.d.ts           # Session type with role
```

### Pattern 1: Reusable API Protection Utilities

**What:** Create helper functions that wrap common auth checks for API routes.

**Why:** Avoids repeating auth boilerplate in every route handler. Ensures consistent 401/403 responses.

**Source:** [Auth.js Protecting Documentation](https://authjs.dev/getting-started/session-management/protecting)

```typescript
// src/lib/auth-utils.ts
import { auth } from "@/auth"
import { NextResponse } from "next/server"
import { UserRole } from "@prisma/client"

// Standard error responses
export function unauthorized(message = "Authentication required") {
  return NextResponse.json(
    { error: "Unauthorized", message },
    { status: 401 }
  )
}

export function forbidden(message = "You don't have permission to access this resource") {
  return NextResponse.json(
    { error: "Forbidden", message },
    { status: 403 }
  )
}

// Get session or return 401 response
export async function requireAuth() {
  const session = await auth()
  if (!session?.user) {
    return { session: null, error: unauthorized() }
  }
  return { session, error: null }
}

// Get session and verify role, or return appropriate error
export async function requireRole(...allowedRoles: UserRole[]) {
  const session = await auth()

  if (!session?.user) {
    console.log(`[AUTH] Unauthorized access attempt`)
    return { session: null, error: unauthorized() }
  }

  if (!allowedRoles.includes(session.user.role)) {
    console.log(`[AUTH] Forbidden: ${session.user.email} (${session.user.role}) attempted access requiring ${allowedRoles.join("|")}`)
    return { session: null, error: forbidden() }
  }

  return { session, error: null }
}

// Higher-order function for route handlers (alternative pattern)
export function withAuth(handler: (req: Request, session: Session) => Promise<Response>) {
  return async (req: Request) => {
    const session = await auth()
    if (!session?.user) {
      return unauthorized()
    }
    return handler(req, session)
  }
}

export function withRole(
  allowedRoles: UserRole[],
  handler: (req: Request, session: Session) => Promise<Response>
) {
  return async (req: Request) => {
    const session = await auth()
    if (!session?.user) {
      return unauthorized()
    }
    if (!allowedRoles.includes(session.user.role)) {
      console.log(`[AUTH] Forbidden: ${session.user.email} attempted ${req.method} ${req.url}`)
      return forbidden()
    }
    return handler(req, session)
  }
}
```

### Pattern 2: Using Auth Utilities in API Route Handlers

**What:** Apply protection at the start of each route handler.

**Source:** [Auth.js API Route Protection](https://authjs.dev/getting-started/session-management/protecting)

```typescript
// src/app/api/initiatives/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireRole } from '@/lib/auth-utils'
import { UserRole } from '@prisma/client'

// GET - any authenticated user can read
export async function GET(request: NextRequest) {
  const { session, error } = await requireAuth()
  if (error) return error

  // ... existing code
}

// POST - only ADMIN and EDITOR can create
export async function POST(request: NextRequest) {
  const { session, error } = await requireRole(UserRole.ADMIN, UserRole.EDITOR)
  if (error) return error

  // ... existing code
}
```

### Pattern 3: Admin Route Protection in Middleware

**What:** Extend middleware to check role for /admin/* routes.

**Challenge:** Middleware runs in Edge runtime. The `authorized` callback in `auth.config.ts` has access to `auth` object which contains user info from JWT.

**Source:** [Auth.js Role Based Access Control](https://authjs.dev/guides/role-based-access-control), [GitHub Discussion #9609](https://github.com/nextauthjs/next-auth/discussions/9609)

```typescript
// src/auth.config.ts
import type { NextAuthConfig } from "next-auth"

export const authConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnAuthPage =
        nextUrl.pathname.startsWith("/login") ||
        nextUrl.pathname.startsWith("/access-denied")
      const isAdminRoute = nextUrl.pathname.startsWith("/admin")

      // Allow access to auth pages regardless of login status
      if (isOnAuthPage) {
        if (isLoggedIn && nextUrl.pathname === "/login") {
          return Response.redirect(new URL("/", nextUrl))
        }
        return true
      }

      // Require login for all other pages
      if (!isLoggedIn) {
        return false // Redirects to signIn page
      }

      // Admin routes require ADMIN role
      if (isAdminRoute) {
        const isAdmin = auth?.user?.role === "ADMIN"
        if (!isAdmin) {
          console.log(`[AUTH] Admin access denied: ${auth?.user?.email} (${auth?.user?.role})`)
          return Response.redirect(new URL("/forbidden", nextUrl))
        }
      }

      return true
    },
  },
  providers: [],
} satisfies NextAuthConfig
```

### Pattern 4: Forbidden Page for 403 Responses

**What:** Create a dedicated forbidden page for role-based access denial.

**Per CONTEXT.md decision:** Show explicit 403 message, not silent redirect.

```typescript
// src/app/(auth)/forbidden/page.tsx
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ShieldAlert } from "lucide-react"

export default function ForbiddenPage() {
  return (
    <Card className="w-full max-w-md mx-4 text-center">
      <CardHeader className="space-y-1">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
            <ShieldAlert className="w-8 h-8 text-orange-600 dark:text-orange-400" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold">Access Forbidden</CardTitle>
        <CardDescription>
          You don't have permission to access this page.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          This area is restricted to administrators only.
          Contact your admin if you believe this is an error.
        </p>

        <Button asChild variant="outline" className="w-full">
          <Link href="/">Return to Dashboard</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
```

### Anti-Patterns to Avoid

- **Relying solely on middleware for API protection:** Middleware is for redirects. API routes should return proper status codes.
- **Using Next.js 15 experimental `forbidden()`/`unauthorized()`:** Still experimental, not stable for production.
- **Checking role on client side only:** Always verify server-side.
- **Duplicating auth logic in every route:** Use utility functions.
- **Forgetting to log access denials:** Context decision requires console logging.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Session access | Custom cookie parsing | `auth()` from Auth.js | Handles JWT verification |
| 401/403 responses | Inline objects | Utility functions | Consistency |
| Route-level auth | Custom HOC | `auth.config.ts` authorized callback | Built into Auth.js v5 |
| Role checking | String comparison everywhere | Enum-based utility | Type safety |

**Key insight:** Auth.js v5 provides everything needed. The `auth()` function gives session with role. The `authorized` callback handles middleware. No custom auth logic needed.

## Common Pitfalls

### Pitfall 1: Middleware Not Receiving Role
**What goes wrong:** `auth?.user?.role` is undefined in middleware.
**Why it happens:** Role not added to JWT token, or callbacks not in correct order.
**How to avoid:** Ensure `jwt` callback adds role to token, and callbacks are in `auth.ts` (not just `auth.config.ts`).
**Current status:** Already handled in Phase 4/5. JWT callback adds `token.role`.

### Pitfall 2: API Returns 200 Instead of 401
**What goes wrong:** API returns success even for unauthenticated requests.
**Why it happens:** Auth check not added to route handler.
**How to avoid:** Add `requireAuth()` at start of every handler.
**Warning signs:** API works in browser when logged out.

### Pitfall 3: Middleware Redirect Loop
**What goes wrong:** User stuck in redirect loop between /login and /forbidden.
**Why it happens:** Forbidden page not excluded from auth check.
**How to avoid:** Add `/forbidden` to `isOnAuthPage` check.
**Warning signs:** Browser shows "too many redirects".

### Pitfall 4: Role Check Before Auth Check
**What goes wrong:** Checking `session.user.role` when `session` might be null.
**Why it happens:** Skipping auth check and going straight to role check.
**How to avoid:** Always check authentication first, then authorization.
**Warning signs:** TypeError: Cannot read property 'role' of undefined.

### Pitfall 5: Inconsistent Error Response Format
**What goes wrong:** Different API routes return different error shapes.
**Why it happens:** Each route defines its own error response.
**How to avoid:** Use centralized `unauthorized()` and `forbidden()` utilities.
**Warning signs:** Frontend error handling breaks for some routes.

## Code Examples

### Complete API Route Protection Example

```typescript
// src/app/api/initiatives/route.ts
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth, requireRole } from '@/lib/auth-utils'
import { UserRole } from '@prisma/client'

// GET /api/initiatives - any authenticated user
export async function GET(request: NextRequest) {
  const { session, error } = await requireAuth()
  if (error) return error

  try {
    const initiatives = await prisma.initiative.findMany({
      orderBy: [{ sequenceNumber: 'asc' }],
    })
    return NextResponse.json(initiatives)
  } catch (error) {
    console.error('Error fetching initiatives:', error)
    return NextResponse.json(
      { error: 'Failed to fetch initiatives' },
      { status: 500 }
    )
  }
}

// POST /api/initiatives - ADMIN or EDITOR only
export async function POST(request: NextRequest) {
  const { session, error } = await requireRole(UserRole.ADMIN, UserRole.EDITOR)
  if (error) return error

  try {
    const body = await request.json()
    // ... rest of create logic
    return NextResponse.json(initiative, { status: 201 })
  } catch (error) {
    console.error('Error creating initiative:', error)
    return NextResponse.json(
      { error: 'Failed to create initiative' },
      { status: 500 }
    )
  }
}
```

### Complete Auth Utils Module

```typescript
// src/lib/auth-utils.ts
import { auth } from "@/auth"
import { NextResponse } from "next/server"
import { UserRole } from "@prisma/client"
import type { Session } from "next-auth"

/**
 * Standard 401 Unauthorized response
 */
export function unauthorizedResponse(message = "Authentication required") {
  return NextResponse.json(
    { error: "Unauthorized", message },
    { status: 401 }
  )
}

/**
 * Standard 403 Forbidden response
 */
export function forbiddenResponse(message = "You don't have permission to access this resource") {
  return NextResponse.json(
    { error: "Forbidden", message },
    { status: 403 }
  )
}

type AuthResult =
  | { session: Session; error: null }
  | { session: null; error: NextResponse }

/**
 * Require authentication for API route
 * Returns session if authenticated, 401 response otherwise
 */
export async function requireAuth(): Promise<AuthResult> {
  const session = await auth()

  if (!session?.user) {
    console.log(`[AUTH] Unauthorized API access attempt`)
    return { session: null, error: unauthorizedResponse() }
  }

  return { session, error: null }
}

/**
 * Require specific role(s) for API route
 * Returns session if authorized, 401 or 403 response otherwise
 */
export async function requireRole(...allowedRoles: UserRole[]): Promise<AuthResult> {
  const session = await auth()

  if (!session?.user) {
    console.log(`[AUTH] Unauthorized API access attempt`)
    return { session: null, error: unauthorizedResponse() }
  }

  if (!allowedRoles.includes(session.user.role)) {
    console.log(`[AUTH] Forbidden: ${session.user.email} (${session.user.role}) requires ${allowedRoles.join("|")}`)
    return { session: null, error: forbiddenResponse() }
  }

  return { session, error: null }
}

/**
 * Require ADMIN role specifically
 */
export async function requireAdmin(): Promise<AuthResult> {
  return requireRole(UserRole.ADMIN)
}

/**
 * Require ADMIN or EDITOR role (write access)
 */
export async function requireEditor(): Promise<AuthResult> {
  return requireRole(UserRole.ADMIN, UserRole.EDITOR)
}
```

### Enhanced Middleware Configuration

```typescript
// src/auth.config.ts
import type { NextAuthConfig } from "next-auth"

export const authConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const pathname = nextUrl.pathname

      // Public auth pages (login, access-denied, forbidden)
      const publicPaths = ["/login", "/access-denied", "/forbidden"]
      const isPublicPath = publicPaths.some(path => pathname.startsWith(path))

      if (isPublicPath) {
        // Redirect logged-in users away from login page
        if (isLoggedIn && pathname === "/login") {
          return Response.redirect(new URL("/", nextUrl))
        }
        return true
      }

      // Require login for all other pages
      if (!isLoggedIn) {
        const callbackUrl = encodeURIComponent(pathname + nextUrl.search)
        return Response.redirect(new URL(`/login?callbackUrl=${callbackUrl}`, nextUrl))
      }

      // Admin routes require ADMIN role
      if (pathname.startsWith("/admin")) {
        const isAdmin = auth?.user?.role === "ADMIN"
        if (!isAdmin) {
          console.log(`[AUTH] Admin access denied: ${auth?.user?.email} (${auth?.user?.role}) -> ${pathname}`)
          return Response.redirect(new URL("/forbidden", nextUrl))
        }
      }

      return true
    },
  },
  providers: [],
} satisfies NextAuthConfig
```

## 401 vs 403: Best Practices

| Scenario | Status Code | Response |
|----------|-------------|----------|
| No session/token | 401 Unauthorized | Redirect to login (pages) or JSON error (API) |
| Session exists, wrong role | 403 Forbidden | Redirect to forbidden (pages) or JSON error (API) |
| Session exists, resource doesn't exist | 404 Not Found | Standard 404 |
| Session exists, valid role, server error | 500 Internal Server Error | Standard 500 |

**Key principle:**
- 401 = "Who are you?" (authentication problem)
- 403 = "You can't do that." (authorization problem)

Source: [Auth0 - Forbidden vs Unauthorized](https://auth0.com/blog/forbidden-unauthorized-http-status-codes/)

## Implementation Order Recommendation

1. **Create auth utilities** (`src/lib/auth-utils.ts`)
   - `unauthorizedResponse()`, `forbiddenResponse()`
   - `requireAuth()`, `requireRole()`, `requireAdmin()`, `requireEditor()`

2. **Create forbidden page** (`src/app/(auth)/forbidden/page.tsx`)
   - Similar to existing access-denied page
   - Different messaging for role-based denial

3. **Update auth.config.ts**
   - Add /forbidden to public paths
   - Add /admin/* role checking
   - Preserve callbackUrl in redirect

4. **Update middleware matcher** (if needed)
   - Ensure /forbidden is excluded

5. **Protect API routes** (one by one)
   - Start with least-used route for testing
   - Apply to all API routes

6. **Test all scenarios**
   - Unauthenticated page access -> login
   - Unauthenticated API access -> 401
   - VIEWER accessing write endpoint -> 403
   - Non-admin accessing /admin/* -> forbidden page

## API Routes Requiring Protection

| Route | GET | POST | PUT/PATCH | DELETE |
|-------|-----|------|-----------|--------|
| /api/initiatives | requireAuth | requireEditor | requireEditor | requireEditor |
| /api/initiatives/[id] | requireAuth | - | requireEditor | requireEditor |
| /api/initiatives/[id]/comments | requireAuth | requireAuth* | - | requireEditor |
| /api/initiatives/reorder | - | requireEditor | - | - |
| /api/initiatives/search | requireAuth | - | - | - |
| /api/dashboard/stats | requireAuth | - | - | - |
| /api/events-to-attend | requireAuth | requireEditor | requireEditor | requireEditor |
| /api/notifications | requireAuth | - | - | - |
| /api/admin/* (future) | requireAdmin | requireAdmin | requireAdmin | requireAdmin |

*Note: Comments might allow any authenticated user to post their own comments.

## Open Questions

1. **VIEWER write access to comments**
   - What we know: VIEWERs can see everything
   - What's unclear: Can VIEWERs add comments?
   - Recommendation: Allow VIEWERs to add comments (their own), but not edit/delete others

2. **Rate limiting**
   - What we know: Auth protects who, not how much
   - What's unclear: Should we rate-limit failed auth attempts?
   - Recommendation: Out of scope for Phase 6, consider for future

## Sources

### Primary (HIGH confidence)
- [Auth.js v5 Protecting Documentation](https://authjs.dev/getting-started/session-management/protecting)
- [Auth.js Role-Based Access Control Guide](https://authjs.dev/guides/role-based-access-control)
- Current codebase: `src/auth.ts`, `src/auth.config.ts`, `src/middleware.ts`

### Secondary (MEDIUM confidence)
- [GitHub Discussion #9609 - Role-based access in middleware](https://github.com/nextauthjs/next-auth/discussions/9609)
- [Auth0 - 401 vs 403 HTTP Status Codes](https://auth0.com/blog/forbidden-unauthorized-http-status-codes/)
- [Next.js Security Guide 2025](https://www.turbostarter.dev/blog/complete-nextjs-security-guide-2025-authentication-api-protection-and-best-practices)

### Tertiary (LOW confidence - not recommended for use)
- [Next.js 15 experimental `forbidden()`/`unauthorized()`](https://nextjs.org/docs/app/api-reference/functions/forbidden) - Experimental, not stable

## Metadata

**Confidence breakdown:**
- Auth utilities pattern: HIGH - Direct from Auth.js docs
- Middleware role checking: HIGH - Documented pattern, already using authorized callback
- API protection: HIGH - Standard `auth()` usage
- 401/403 semantics: HIGH - REST/HTTP standards

**Research date:** 2026-01-21
**Valid until:** 2026-03-21 (60 days - auth patterns stable)

---
*Research complete. Ready for planning.*
