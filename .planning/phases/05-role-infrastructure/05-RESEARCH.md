# Phase 5: Role Infrastructure - Research

**Researched:** 2026-01-21
**Domain:** NextAuth.js v5 (Auth.js) role assignment, Prisma database seeding
**Confidence:** HIGH

## Summary

Phase 5 establishes role infrastructure on top of the existing Phase 4 auth foundation. The core challenges are:

1. Automatically assigning VIEWER role to new @talenta.com.my users
2. Storing the role in the database via the existing User model
3. Seeding khairul@talenta.com.my as ADMIN on first run (idempotent)

The existing codebase already has the User model with `role: UserRole @default(VIEWER)` and TypeScript augmentation for `session.user.role`. Phase 4 also implemented the `jwt` and `session` callbacks to expose role. The primary work is:
- Ensuring the profile callback returns role for proper adapter behavior
- Creating an idempotent admin seeding mechanism

**Primary recommendation:** Use the profile callback in the Google provider to explicitly return role, and create a separate idempotent seed script for admin user that can be run both on first deployment and safely re-run.

## Standard Stack

The established libraries/tools for this domain:

### Core (Already Installed in Phase 4)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next-auth | 5.0.0-beta.30 | Authentication | Already configured in Phase 4 |
| @auth/prisma-adapter | 2.11.1 | Database adapter | Already configured in Phase 4 |
| @prisma/client | 6.19.2 | Database ORM | Already in use |

### Supporting (No New Dependencies)
This phase requires no additional packages. All work uses existing infrastructure.

**Installation:** No new packages required.

## Architecture Patterns

### Current Project Structure (Relevant Files)
```
src/
├── auth.ts                      # Main config with Prisma adapter + callbacks
├── auth.config.ts               # Edge-safe config (for middleware)
├── types/
│   └── next-auth.d.ts           # TypeScript augmentation (already has role)
prisma/
├── schema.prisma                # User model with role field (done)
├── seed.ts                      # Existing seed script (initiatives/events)
└── seed-admin.ts                # NEW: Admin user seeding (idempotent)
```

### Pattern 1: Profile Callback for Default Role Assignment

**What:** Use the Google provider's `profile` callback to explicitly return role field so PrismaAdapter creates user with correct default.

**When to use:** Always for OAuth providers when using database adapter with custom fields.

**Why needed:** The PrismaAdapter creates users based on what the profile callback returns. If role is not explicitly returned, it relies on Prisma schema default. Explicitly returning role ensures clarity and allows conditional logic.

**Example:**
```typescript
// Source: https://authjs.dev/guides/role-based-access-control
Google({
  clientId: process.env.AUTH_GOOGLE_ID!,
  clientSecret: process.env.AUTH_GOOGLE_SECRET!,
  authorization: {
    params: {
      hd: "talenta.com.my",
    },
  },
  profile(profile) {
    // Explicitly return role so adapter creates user with it
    return {
      id: profile.sub,
      name: profile.name,
      email: profile.email,
      image: profile.picture,
      role: "VIEWER", // Default role for all new users
    }
  },
}),
```

### Pattern 2: Idempotent Admin Seeding with Upsert

**What:** Use Prisma's `upsert` to seed admin user in a way that can be run multiple times safely.

**When to use:** When seeding critical system data that must exist but should not duplicate.

**Example:**
```typescript
// Source: https://www.prisma.io/docs/orm/prisma-migrate/workflows/seeding
// prisma/seed-admin.ts
import { PrismaClient, UserRole } from '@prisma/client'

const prisma = new PrismaClient()

async function seedAdmin() {
  const adminEmail = 'khairul@talenta.com.my'

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: UserRole.ADMIN }, // Ensure admin role even if user exists
    create: {
      email: adminEmail,
      name: 'Khairul',
      role: UserRole.ADMIN,
    },
  })

  console.log(`Admin user seeded: ${admin.email} (${admin.role})`)
  return admin
}

seedAdmin()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

### Pattern 3: Application Startup Seeding (Alternative)

**What:** Check and seed admin on application startup instead of manual script.

**When to use:** When seed data is critical for application function and must always exist.

**Example:**
```typescript
// src/lib/ensure-admin.ts
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'

let adminEnsured = false

export async function ensureAdminUser() {
  if (adminEnsured) return

  const adminEmail = 'khairul@talenta.com.my'

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {}, // Don't override if exists
    create: {
      email: adminEmail,
      name: 'Khairul',
      role: UserRole.ADMIN,
    },
  })

  adminEnsured = true
}
```

**Note:** This approach adds database call on startup. For small team app, manual seeding via script is simpler.

### Anti-Patterns to Avoid

- **Relying only on schema default:** While Prisma schema has `@default(VIEWER)`, the profile callback should explicitly return role for clarity.
- **Non-idempotent seeding:** Never use `create()` alone for admin seeding; always use `upsert()` to prevent duplicates.
- **Seeding with `createMany`:** Not idempotent; fails on unique constraint violation.
- **Checking user count to determine if seeded:** Fragile; use `upsert` instead.

## Don't Hand-Roll

Problems that have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Role assignment on first login | Manual database update | Profile callback | Built into Auth.js |
| Idempotent data creation | Custom check-then-create | Prisma `upsert()` | Atomic, race-condition-free |
| Session role access | Direct database query every request | JWT callback (existing) | Already implemented in Phase 4 |

**Key insight:** Phase 4 already did most of the work. The User model has role, the callbacks exist, TypeScript types are augmented. Phase 5 is primarily:
1. Minor tweak to profile callback (optional but recommended)
2. Admin seeding script

## Common Pitfalls

### Pitfall 1: Profile Callback Return Shape
**What goes wrong:** Forgetting to return all required fields from profile callback causes adapter to fail.
**Why it happens:** Profile callback replaces default user object mapping.
**How to avoid:** Always return `id`, `name`, `email`, `image`, and `role`.
**Warning signs:** User created without role or creation fails.

### Pitfall 2: Admin Seeding Creates Incomplete User
**What goes wrong:** Admin user seeded without Account record; can't log in via OAuth.
**Why it happens:** OAuth creates User + Account together; manual seed creates only User.
**How to avoid:**
- Option A: Pre-seed only the User; Account created on first OAuth login
- Option B: Have admin log in first (as VIEWER), then upgrade role
**Warning signs:** Admin user exists but session shows VIEWER role on first login.

**Recommended approach:** Seed User without Account. On first login:
1. Auth.js creates Account linked to existing User (matched by email)
2. JWT callback reads role from User (ADMIN)
3. Session has correct role

### Pitfall 3: Upsert Update Overwriting Data
**What goes wrong:** Using `update: { role: UserRole.ADMIN }` overwrites role even if user changed it.
**Why it happens:** Every time seed runs, role is reset to ADMIN.
**How to avoid:** Use `update: {}` (empty object) to preserve existing data on re-run.
**Warning signs:** User role changes revert after deployment.

**Note:** For admin user specifically, always setting ADMIN might be desired behavior.

### Pitfall 4: Seed Script Not Running in Production
**What goes wrong:** `prisma db seed` doesn't run automatically in production.
**Why it happens:** Prisma seed only runs on `migrate reset` (dev) or explicit call.
**How to avoid:** Add seed to deployment process: `npx prisma db seed` after migrations.
**Warning signs:** Admin user doesn't exist in production.

## Code Examples

Verified patterns from official sources:

### Complete Profile Callback with Role
```typescript
// Source: https://authjs.dev/guides/role-based-access-control
// Modified for this project's needs

Google({
  clientId: process.env.AUTH_GOOGLE_ID!,
  clientSecret: process.env.AUTH_GOOGLE_SECRET!,
  authorization: {
    params: {
      hd: "talenta.com.my",
    },
  },
  profile(profile) {
    return {
      id: profile.sub,
      name: profile.name,
      email: profile.email,
      image: profile.picture,
      role: "VIEWER", // UserRole.VIEWER - default for all new users
    }
  },
}),
```

### Idempotent Admin Seed Script
```typescript
// Source: https://www.prisma.io/docs/orm/prisma-migrate/workflows/seeding
// prisma/seed-admin.ts

import { PrismaClient, UserRole } from '@prisma/client'

const prisma = new PrismaClient()

const ADMIN_EMAIL = 'khairul@talenta.com.my'

async function main() {
  console.log('Seeding admin user...')

  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {
      // Always ensure admin role (even if somehow demoted)
      role: UserRole.ADMIN,
    },
    create: {
      email: ADMIN_EMAIL,
      name: 'Khairul',
      role: UserRole.ADMIN,
      // Note: emailVerified, image, accounts left for OAuth to fill
    },
  })

  console.log(`Admin user ready: ${admin.email} (role: ${admin.role})`)
}

main()
  .catch((e) => {
    console.error('Admin seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

### Package.json Script
```json
{
  "scripts": {
    "db:seed:admin": "npx ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed-admin.ts"
  }
}
```

### JWT Callback (Already Exists in src/auth.ts)
```typescript
// Source: Current codebase - no changes needed
callbacks: {
  async jwt({ token, user }) {
    if (user) {
      token.id = user.id!
      token.role = user.role
    }
    return token
  },
  async session({ session, token }) {
    if (session.user && token.id) {
      session.user.id = token.id
      session.user.role = token.role
    }
    return session
  },
},
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Events.createUser for role | Profile callback | Auth.js v4+ | Cleaner, no post-creation update |
| Database session strategy | JWT strategy | When using Edge middleware | Phase 4 chose JWT for Edge compat |
| Manual role lookup in jwt callback | Profile returns role, user object has it | Auth.js v4+ | Simpler callback logic |

**Deprecated/outdated:**
- `events.createUser` for role assignment: Still works but profile callback is cleaner
- Using `adapter.createUser` override: Unnecessary with profile callback approach

## Open Questions

Things that couldn't be fully resolved:

1. **Profile callback vs schema default**
   - What we know: Both work. Schema has `@default(VIEWER)`, profile callback can also return `"VIEWER"`.
   - What's unclear: Does profile callback override schema default, or is schema default used when profile doesn't return role?
   - Recommendation: Explicitly return role in profile callback for safety.

2. **First login timing for admin**
   - What we know: If admin user is seeded before first OAuth login, the Account will be created and linked on first login.
   - What's unclear: Does Prisma adapter match by email when creating Account, even if User already exists?
   - Recommendation: Test this flow explicitly. If matching fails, alternative is to have admin log in first, then upgrade role.

## Sources

### Primary (HIGH confidence)
- Auth.js Role-Based Access Control Guide: https://authjs.dev/guides/role-based-access-control
- Prisma Seeding Documentation: https://www.prisma.io/docs/orm/prisma-migrate/workflows/seeding
- Current codebase: `src/auth.ts`, `prisma/schema.prisma`, `src/types/next-auth.d.ts`

### Secondary (MEDIUM confidence)
- GitHub Discussion #4117 (roles with Prisma and v4): https://github.com/nextauthjs/next-auth/discussions/4117
- Blog: Building Role-Based Auth with Next.js and Prisma: https://blog.lama.dev/role-based-auth-prisma-next-auth/
- GitHub Discussion #15890 (seed in production): https://github.com/prisma/prisma/discussions/15890

### Tertiary (LOW confidence)
- Various community blog posts and Stack Overflow answers (used for pattern validation only)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Using existing installed packages
- Architecture: HIGH - Patterns from official Auth.js and Prisma docs
- Admin seeding: MEDIUM - upsert pattern is solid, but admin-without-account flow needs testing
- Pitfalls: MEDIUM - Based on documentation and community discussions

**Research date:** 2026-01-21
**Valid until:** 2026-03-21 (60 days - auth patterns stable)

---
*Research complete. Ready for planning.*
