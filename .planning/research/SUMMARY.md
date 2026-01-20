# Research Summary: Authentication (v1.1)

**Project:** SAAP 2026 v2 - Authentication Milestone
**Domain:** Internal team app with Google OAuth and role-based access control
**Researched:** 2026-01-21
**Confidence:** HIGH

## Executive Summary

NextAuth.js v5 (Auth.js) with Google OAuth is the correct approach for adding authentication to this Next.js 14 App Router application. The research confirms high compatibility between the existing stack (Prisma 6.19.2, MariaDB) and the recommended packages (`next-auth@5.0.0-beta.30`, `@auth/prisma-adapter@2.11.1`). The v5 release provides native App Router support with a universal `auth()` function that works across Server Components, Route Handlers, and Middleware.

The critical security finding is CVE-2025-29927 (CVSS 9.1), a middleware authorization bypass affecting Next.js versions before 14.2.25. The current project uses `^14.2.28` which is patched. However, the research strongly recommends **multi-layer authentication** (middleware + Server Component + API route verification) rather than relying solely on middleware. Additionally, domain restriction via the `hd` parameter alone is insufficient - server-side email validation in the `signIn` callback is mandatory.

For a small internal team (~3 users), the recommended approach is: Google OAuth as the sole provider (no password management), JWT session strategy (Edge middleware compatible, no database queries per request), and a simple three-tier role system (Admin > Editor > Viewer) with new users auto-approved as Viewer. The primary admin user (khairul@talenta.com.my) should be seeded during initial deployment.

## Stack Decision

**Core packages:**
- `next-auth@5.0.0-beta.30` - Native App Router support, universal `auth()` function
- `@auth/prisma-adapter@2.11.1` - Official adapter, compatible with Prisma 6.x

**Key architecture choice: JWT sessions**
- Edge middleware compatible (Prisma cannot run on Edge runtime)
- No database query per authenticated request
- Trade-off: Cannot revoke sessions instantly (acceptable for small team)

**Do NOT use:**
- `@next-auth/prisma-adapter` (deprecated v4 namespace)
- Credentials provider (adds password management complexity)
- Database sessions (breaks Edge middleware)

## Table Stakes

Features that must ship for authentication to feel complete:

| Feature | Complexity | Notes |
|---------|------------|-------|
| Google OAuth sign-in | Low | GoogleProvider with `hd` parameter hint |
| Domain restriction (@talenta.com.my) | Low | `signIn` callback validates email domain |
| Auto-approval as Viewer | Low | Database adapter auto-creates user with default role |
| Role in JWT/session | Low | Requires `jwt()` and `session()` callbacks |
| Protected routes (middleware) | Medium | Edge-compatible auth.config.ts |
| Server-side authorization | Medium | Verify `session.user.role` in all API routes |
| Admin role management UI | Medium | Allow Admin to promote/demote users |
| Sign out | Low | Provided by NextAuth.js |
| User profile display | Low | Google profile data in session |

## Architecture Overview

**File structure:**
```
src/
  auth.ts                    # Main config with Prisma adapter
  auth.config.ts             # Edge-safe config for middleware
  middleware.ts              # Route protection
  app/
    api/auth/[...nextauth]/route.ts
    (auth)/login/page.tsx
    (dashboard)/layout.tsx   # Server-side session check
  types/
    next-auth.d.ts           # TypeScript augmentation
```

**Three-layer protection:**
1. **Middleware** - First line; redirects unauthenticated users
2. **Server Component** - Layout-level session verification
3. **API Route** - Every mutation verifies role permissions

**Session flow:**
```
User clicks Google Sign-In
    -> Google OAuth completes
    -> signIn callback validates @talenta.com.my domain
    -> User created/loaded with role (default: VIEWER)
    -> JWT minted with role included
    -> Session available via auth()
```

## Critical Pitfalls

Top 5 pitfalls with prevention strategies:

### 1. CVE-2025-29927 - Middleware Authorization Bypass
**Risk:** Attackers bypass middleware by adding `x-middleware-subrequest` header
**Prevention:** Already patched in Next.js 14.2.25+. Implement multi-layer auth - never rely solely on middleware.

### 2. Domain Restriction via `hd` Parameter Only
**Risk:** `hd` parameter only filters Google UI; does not prevent unauthorized domains
**Prevention:** ALWAYS validate domain server-side in `signIn` callback:
```typescript
signIn({ profile }) {
  return profile?.email?.endsWith("@talenta.com.my") && profile?.email_verified
}
```

### 3. Role Not Available in Session
**Risk:** `session.user.role` is undefined because custom fields require explicit callbacks
**Prevention:** Configure `jwt()` and `session()` callbacks to include role. Create TypeScript declaration file.

### 4. NEXTAUTH_URL Mismatch Behind Cloudflare Tunnel
**Risk:** OAuth callback URLs generated incorrectly, causing redirect_uri_mismatch errors
**Prevention:** Set `AUTH_URL=https://saap.motionvii.com` in Docker environment. Add correct redirect URI in Google Cloud Console.

### 5. Frontend-Only Permission Checks
**Risk:** Client-side role checks trivially bypassed via browser tools
**Prevention:** Every API route and Server Action must verify `session.user.role`. Client-side checks are for UX only.

## Recommended Phase Structure

### Phase 1: Core Auth Foundation
**Rationale:** Authentication is blocking; nothing else can be tested without login
**Delivers:** Working Google OAuth with domain restriction
**Features:**
- Install packages, add Prisma schema (User, Account, Session, VerificationToken)
- Create auth.ts, auth.config.ts, route handler
- Implement signIn callback with domain validation
- Configure JWT/session callbacks for role
- TypeScript declarations
- Environment variables (AUTH_SECRET, AUTH_URL, AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET)

**Avoids:** Pitfalls 2, 3, 4, 10

### Phase 2: Route Protection
**Rationale:** Must protect existing pages before testing RBAC
**Delivers:** All routes require authentication
**Features:**
- Middleware for route protection
- Login page with Google button
- Update dashboard layout with session check
- Redirect flows (login -> dashboard, authenticated -> away from login)

**Avoids:** Pitfalls 1, 13

### Phase 3: API Authorization
**Rationale:** Critical security layer; mutations must verify permissions
**Delivers:** All API routes verify session and role
**Features:**
- Update existing API routes to check auth
- Create centralized permission utility (`lib/permissions.ts`)
- Role-based access: Viewer (read), Editor (create/edit), Admin (delete/manage)

**Avoids:** Pitfalls 3, 5, 15

### Phase 4: Admin User Management
**Rationale:** Admin needs to promote first user; others need dashboard access
**Delivers:** Admin can view users and change roles
**Features:**
- Admin-only users page
- Role change functionality
- Seed initial admin user (khairul@talenta.com.my)

**Avoids:** None specific; completes RBAC implementation

### Phase 5: UI Integration
**Rationale:** Polish after core functionality works
**Delivers:** Auth integrated into existing UI
**Features:**
- User menu in header (avatar, name, sign out)
- SessionProvider wrapper (only where needed for client components)
- Error handling for auth failures
- Custom error page

**Avoids:** Pitfall 14 (minimize SessionProvider usage)

### Phase Ordering Rationale

1. **Phases 1-3 are tightly coupled** - Auth foundation must exist before protection, protection before authorization
2. **Phase 4 enables team testing** - Once admin can promote users, team can test different roles
3. **Phase 5 is polish** - UI integration can be refined without blocking functionality
4. **Dependencies discovered:** JWT strategy required for Edge middleware; role in session required before any RBAC

### Research Flags

**Phases with standard patterns (skip deep research):**
- Phase 1: Official Auth.js documentation covers everything
- Phase 2: Middleware patterns well-documented
- Phase 5: Standard UI patterns

**Phases that may need validation during implementation:**
- Phase 3: Permission matrix (Admin/Editor/Viewer capabilities) may need adjustment based on actual workflow
- Phase 4: Seeding admin user - confirm best approach for Docker deployment

## Open Questions

Items requiring user decision during planning:

1. **Session duration:** Default 30 days. Shorter? Longer?
2. **Role change notifications:** Email users when role changes? (Recommended: defer to post-MVP)
3. **Existing TeamMember enum:** Keep for backward compatibility or migrate to User relationships?
4. **Google Cloud Console:** "Internal" OAuth app (auto-restricts to Workspace org) vs "External" with domain validation?

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Official Auth.js docs, npm version verification, issue #12899 resolution confirmed |
| Features | HIGH | Auth.js RBAC guide, industry best practices verified |
| Architecture | HIGH | Official migration guide, Next.js 14 App Router patterns |
| Pitfalls | HIGH | CVE verified, official security advisories, recent GitHub issues |

**Overall confidence:** HIGH

### Gaps to Address

- **Permission matrix granularity:** May need adjustment after seeing actual usage patterns (e.g., "Editor can only reassign within own department" - unclear if needed)
- **TeamMember to User migration:** Strategy documented but exact migration script not researched (lower priority, can use enum during transition)

## Sources

### Primary (HIGH confidence)
- [Auth.js Installation Guide](https://authjs.dev/getting-started/installation)
- [Auth.js Prisma Adapter](https://authjs.dev/getting-started/adapters/prisma)
- [Auth.js Google Provider](https://authjs.dev/getting-started/providers/google)
- [Auth.js RBAC Guide](https://authjs.dev/guides/role-based-access-control)
- [Auth.js Migration to v5](https://authjs.dev/getting-started/migrating-to-v5)

### Security (HIGH confidence)
- [CVE-2025-29927 - Datadog Security Labs](https://securitylabs.datadoghq.com/articles/nextjs-middleware-auth-bypass/)
- [CVE-2025-29927 - ProjectDiscovery](https://projectdiscovery.io/blog/nextjs-middleware-authorization-bypass)

### Supplementary (MEDIUM confidence)
- [Prisma Adapter Issue #12899](https://github.com/nextauthjs/next-auth/issues/12899) - Compatibility confirmed
- [Domain Restriction Discussion #266](https://github.com/nextauthjs/next-auth/discussions/266)
- [Auth0: Common Authentication Mistakes](https://auth0.com/blog/five-common-authentication-and-authorization-mistakes-to-avoid-in-your-saas-application/)

---
*Research completed: 2026-01-21*
*Ready for roadmap: yes*
