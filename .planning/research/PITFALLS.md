# Pitfalls Research: NextAuth.js + Google OAuth

**Project:** SAAP 2026 v2
**Context:** Adding authentication to existing Next.js 14 App Router application
**Researched:** 2026-01-21
**Overall Confidence:** HIGH (verified with official documentation and recent security advisories)

---

## Critical Pitfalls

Mistakes that can cause security vulnerabilities, rewrites, or major issues.

### Pitfall 1: CVE-2025-29927 - Next.js Middleware Authorization Bypass

**What goes wrong:** Attackers can bypass middleware-based authentication by adding the `x-middleware-subrequest` header to HTTP requests. This critical vulnerability (CVSS 9.1) affects all Next.js versions from 11.1.4 through 13.5.6, 14.x before 14.2.25, and 15.x before 15.2.3.

**Why it happens:** The `x-middleware-subrequest` header was designed for internal use to prevent infinite middleware loops. Attackers can manipulate this header to skip middleware execution entirely.

**Consequences:**
- Complete authentication bypass
- Unauthorized access to protected routes
- All middleware security checks circumvented

**Warning signs:**
- Using Next.js < 14.2.25
- Relying solely on middleware for authentication
- No additional server-side auth checks in API routes

**Prevention:**
1. **Upgrade Next.js immediately** to 14.2.25+ (your `package.json` shows `^14.2.28` which is safe)
2. **Never rely solely on middleware** - Always verify authentication in Server Components, API Routes, and Server Actions
3. If upgrade not possible, configure reverse proxy/WAF to strip `x-middleware-subrequest` header

**Phase to address:** Phase 1 (Initial Setup) - Verify Next.js version, implement multi-layer auth checks

**Sources:**
- [CVE-2025-29927 - Datadog Security Labs](https://securitylabs.datadoghq.com/articles/nextjs-middleware-auth-bypass/)
- [CVE-2025-29927 - ProjectDiscovery](https://projectdiscovery.io/blog/nextjs-middleware-authorization-bypass)

---

### Pitfall 2: Domain Restriction Bypass via `hd` Parameter Only

**What goes wrong:** Using only the `hd` (hosted domain) parameter to restrict Google OAuth to `@talenta.com.my` is insufficient. The `hd` parameter only filters which accounts Google shows during sign-in UI - it does NOT prevent authorization of other accounts.

**Why it happens:** The `hd` parameter is a convenience hint for Google's UI, not a security control. An attacker can modify the authorization URL to remove the `hd` parameter or use direct API calls.

**Consequences:**
- Users from any Google account can authenticate
- Domain restriction completely bypassed
- Unauthorized access to internal application

**Warning signs:**
- Only using `authorization: { params: { hd: 'talenta.com.my' } }`
- No server-side email domain validation
- Assuming Google enforces domain restriction

**Prevention:**
```typescript
// CORRECT: Combine hd parameter WITH signIn callback validation
export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          hd: 'talenta.com.my' // UI hint only
        }
      }
    })
  ],
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider === "google") {
        // CRITICAL: Server-side validation
        return (
          profile?.email_verified === true &&
          profile?.email?.endsWith("@talenta.com.my")
        );
      }
      return false;
    }
  }
};
```

**Phase to address:** Phase 1 (Core Auth Setup) - Must implement signIn callback validation from day one

**Sources:**
- [Google Provider - Auth.js](https://authjs.dev/getting-started/providers/google)
- [Domain Restriction Discussion #266](https://github.com/nextauthjs/next-auth/discussions/266)

---

### Pitfall 3: Frontend-Only Permission Checks

**What goes wrong:** Checking user roles (Admin/Editor/Viewer) only in React components or middleware without backend verification. Users can modify frontend state or bypass checks.

**Why it happens:** Developers assume client-side checks are sufficient, or middleware is the final authority.

**Consequences:**
- Privilege escalation (Viewer accessing Admin functions)
- Data manipulation by unauthorized users
- Complete RBAC bypass using browser developer tools

**Warning signs:**
- Permission checks scattered across components: `if (user.role === 'admin')`
- No role verification in API routes
- Trusting session data without server-side verification

**Prevention:**
```typescript
// In every API route and Server Action:
export async function POST(req: Request) {
  const session = await auth();

  // ALWAYS verify on backend
  if (!session?.user || session.user.role !== 'ADMIN') {
    return new Response('Unauthorized', { status: 403 });
  }

  // Proceed with operation...
}
```

**Phase to address:** Phase 2 (Role Implementation) - Design centralized permission checking from start

**Sources:**
- [Role Based Access Control - Auth.js](https://authjs.dev/guides/role-based-access-control)
- [RBAC Discussion #9609](https://github.com/nextauthjs/next-auth/discussions/9609)

---

### Pitfall 4: Role Not Available in JWT/Session

**What goes wrong:** After adding a `role` field to the User model, the role is not accessible in middleware or client components because it's not included in the JWT/session by default.

**Why it happens:** NextAuth.js only includes `name`, `email`, and `image` in the session by default. Custom fields require explicit callbacks configuration.

**Consequences:**
- RBAC doesn't work
- Middleware can't check roles
- Need to fetch user from database on every request

**Warning signs:**
- `session.user.role` is undefined
- Role checks fail even for admin users
- Excessive database queries to check permissions

**Prevention:**
```typescript
// auth.ts
export const { handlers, auth } = NextAuth({
  callbacks: {
    async jwt({ token, user }) {
      // Add role to JWT when user signs in
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      // Add role to session from JWT
      if (session.user) {
        session.user.role = token.role as Role;
      }
      return session;
    }
  }
});

// types/next-auth.d.ts - Extend types
declare module "next-auth" {
  interface User {
    role: 'ADMIN' | 'EDITOR' | 'VIEWER';
  }
  interface Session {
    user: User & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: 'ADMIN' | 'EDITOR' | 'VIEWER';
  }
}
```

**Phase to address:** Phase 1 (Core Setup) and Phase 2 (Roles) - Design type extensions early

**Sources:**
- [Auth.js Callbacks](https://authjs.dev/getting-started/session-management/protecting-resources)
- [RBAC in Next.js with NextAuth - Medium](https://medium.com/@mkilincaslan/rbac-in-next-js-with-nextauth-b438fe59eeeb)

---

## MariaDB-Specific Issues

### Pitfall 5: Using `provider = "mariadb"` in Prisma Schema

**What goes wrong:** Attempting to use `provider = "mariadb"` in the Prisma schema results in error: "Datasource provider not known: 'mariadb'".

**Why it happens:** Prisma treats MariaDB as MySQL-compatible and uses the mysql provider for both.

**Prevention:**
```prisma
// CORRECT - Your current schema is correct
datasource db {
  provider = "mysql"  // Use mysql for MariaDB
  url      = env("DATABASE_URL")
}
```

**Phase to address:** Phase 1 (Schema Setup) - Already correct in existing schema

**Sources:**
- [Prisma MySQL Connector](https://www.prisma.io/docs/orm/overview/databases/mysql)

---

### Pitfall 6: Prisma Adapter Version Incompatibility

**What goes wrong:** Recent versions of `@auth/prisma-adapter` have breaking changes with certain Prisma client versions. Specifically:
- `@auth/prisma-adapter@2.9.0` doesn't work with `@prisma/client@6.6.0`
- `@auth/prisma-adapter@2.7.4` broke compatibility from v2.7.2

**Why it happens:** Rapid Auth.js v5 development causing dependency mismatches.

**Consequences:**
- Build failures with "UnhandledSchemeError"
- Application won't start
- Authentication completely broken

**Warning signs:**
- Webpack errors mentioning "node:child_process"
- Build failures after npm update
- Auth routes returning 500 errors

**Prevention:**
1. Pin specific compatible versions in `package.json`
2. Test auth flow after any dependency update
3. Use lockfile (`package-lock.json`) to prevent accidental updates

```bash
# If issues occur, try pinning to known working version
npm install @auth/prisma-adapter@2.7.2 --legacy-peer-deps
```

**Phase to address:** Phase 1 (Dependencies) - Lock versions from start

**Sources:**
- [Issue #12899 - Prisma Adapter Compatibility](https://github.com/nextauthjs/next-auth/issues/12899)
- [Issue #12325 - Breaking Changes](https://github.com/nextauthjs/next-auth/issues/12325)

---

### Pitfall 7: Prisma Connection Pool Exhaustion

**What goes wrong:** In development with Hot Module Reloading (HMR), each reload creates a new PrismaClient instance, exhausting database connections.

**Why it happens:** Next.js HMR re-executes modules, creating multiple PrismaClient instances without closing old connections.

**Consequences:**
- "Too many connections" database errors
- Application becomes unresponsive
- Database server under stress

**Warning signs:**
- Errors after few code changes in development
- Database refusing connections
- Slow queries due to connection contention

**Prevention:**
Your existing `/src/lib/prisma.ts` should use singleton pattern:
```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

**Phase to address:** Phase 1 - Verify existing prisma.ts uses singleton pattern

**Sources:**
- [Prisma Issue #23685](https://github.com/prisma/prisma/issues/23685)

---

### Pitfall 8: NextAuth Schema Missing Required Tables

**What goes wrong:** NextAuth.js with database sessions requires specific tables (User, Account, Session, VerificationToken) that aren't in your current schema.

**Why it happens:** The Prisma adapter expects specific table structure. Your current schema has `TeamMember` enum but no `User` model.

**Consequences:**
- Authentication completely fails
- "Table does not exist" errors
- Data model conflicts with existing schema

**Prevention:**
Add NextAuth required models to your Prisma schema:
```prisma
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  image         String?
  role          Role      @default(VIEWER)

  accounts      Account[]
  sessions      Session[]

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@map("users")
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@map("accounts")
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
  @@map("verification_tokens")
}

enum Role {
  ADMIN
  EDITOR
  VIEWER
}
```

**Phase to address:** Phase 1 (Schema Migration) - Plan migration carefully to preserve existing data

**Sources:**
- [Prisma Adapter - Auth.js](https://authjs.dev/getting-started/adapters/prisma)

---

## Docker/Cloudflare Issues

### Pitfall 9: NEXTAUTH_URL Mismatch Behind Cloudflare Tunnel

**What goes wrong:** OAuth callback URLs are generated incorrectly when behind Cloudflare tunnel, causing "redirect_uri_mismatch" errors from Google.

**Why it happens:** NextAuth.js uses the request host to generate callback URLs. Behind a tunnel, the internal host differs from the public URL.

**Consequences:**
- Google OAuth fails with redirect_uri error
- Users can't sign in
- Infinite redirect loops

**Warning signs:**
- OAuth works locally but fails in Docker
- Error mentions "redirect_uri_mismatch"
- Callback URL shows internal hostname/IP

**Prevention:**
```bash
# .env (Docker production)
NEXTAUTH_URL=https://your-public-domain.com
NEXTAUTH_SECRET=your-secure-secret-at-least-32-chars

# Google OAuth Console
# Add authorized redirect URI:
# https://your-public-domain.com/api/auth/callback/google
```

**Additional Docker configuration:**
```dockerfile
# Ensure environment variables are passed
ENV NEXTAUTH_URL=${NEXTAUTH_URL}
```

**Phase to address:** Phase 1 (Environment Setup) and Phase 3 (Deployment)

**Sources:**
- [Redirect URI Issue #6526](https://github.com/nextauthjs/next-auth/issues/6526)
- [Cloudflare Tunnel Docker Issues](https://community.cloudflare.com/t/cloudflare-tunnel-with-docker-issues/649505)

---

### Pitfall 10: Missing NEXTAUTH_SECRET in Production

**What goes wrong:** Application deploys but sessions don't persist, JWTs fail to decrypt, or random authentication errors occur.

**Why it happens:** `NEXTAUTH_SECRET` is used to encrypt JWTs. If missing or changed, all existing sessions become invalid.

**Consequences:**
- Users logged out unexpectedly
- "JWEDecryptionFailed" errors
- Session data corrupted

**Warning signs:**
- Authentication works in dev but not production
- "JWEDecryptionFailed" in logs
- Users randomly logged out

**Prevention:**
```bash
# Generate strong secret
openssl rand -base64 32

# .env.production
NEXTAUTH_SECRET=your-generated-secret-NEVER-CHANGE-THIS
```

**CRITICAL:** Once set, never change `NEXTAUTH_SECRET` without a migration plan - all existing sessions will be invalidated.

**Phase to address:** Phase 1 (Environment Setup)

**Sources:**
- [NextAuth.js Errors](https://next-auth.js.org/errors)

---

### Pitfall 11: Edge Runtime Incompatibility with Prisma Adapter

**What goes wrong:** Middleware using database sessions fails because Prisma doesn't run on Edge runtime.

**Why it happens:** NextAuth.js middleware runs on Edge runtime, but Prisma requires Node.js runtime.

**Consequences:**
- Middleware throws runtime errors
- Authentication breaks in production
- "PrismaClient is unable to run in this environment" errors

**Warning signs:**
- Works locally, fails on Vercel/Cloudflare
- Edge runtime errors in logs
- Database operations fail in middleware

**Prevention:**
Use JWT sessions for middleware compatibility:
```typescript
// auth.config.ts
export const authConfig = {
  session: {
    strategy: "jwt"  // Required for Edge compatibility
  },
  providers: [...],
  callbacks: {...}
};
```

If database sessions are needed, split configuration:
```typescript
// auth.config.ts - Edge-safe config for middleware
export const authConfig = {
  providers: [...],
  pages: { signIn: '/login' }
};

// auth.ts - Full config with adapter (Node.js runtime)
import { authConfig } from './auth.config';

export const { handlers, auth } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "database" }
});
```

**Phase to address:** Phase 1 (Architecture Decision) - Decide JWT vs Database sessions early

**Sources:**
- [Prisma Edge Runtime Issue #23685](https://github.com/prisma/prisma/issues/23685)
- [NextAuth.js Middleware Discussion #8547](https://github.com/nextauthjs/next-auth/discussions/8547)

---

## Moderate Pitfalls

### Pitfall 12: Google Refresh Token Only Issued Once

**What goes wrong:** Google only provides a refresh token the first time a user authorizes your app. Subsequent sign-ins don't include it.

**Why it happens:** Google's OAuth behavior - refresh tokens are issued only on initial consent.

**Consequences:**
- Access tokens expire and can't be refreshed
- Users need to re-authorize frequently
- Long-running operations fail

**Prevention:**
Force re-consent to get new refresh token:
```typescript
GoogleProvider({
  clientId: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  authorization: {
    params: {
      prompt: "consent",
      access_type: "offline",
      response_type: "code"
    }
  }
})
```

**Phase to address:** Phase 1 (Provider Setup) - Only if you need long-lived Google API access

**Sources:**
- [Google Provider - NextAuth.js](https://next-auth.js.org/providers/google)

---

### Pitfall 13: App Router vs Pages Router Confusion

**What goes wrong:** Following outdated tutorials that use Pages Router patterns in App Router project.

**Why it happens:** Most NextAuth.js tutorials were written for Pages Router. Auth.js v5 patterns differ significantly.

**Consequences:**
- Route handlers not found (404)
- Session not available in components
- Configuration doesn't work

**Warning signs:**
- Using `pages/api/auth/[...nextauth].js` (Pages Router)
- Using `getServerSession()` (v4 pattern)
- Session undefined in Server Components

**Prevention - App Router patterns:**
```typescript
// app/api/auth/[...nextauth]/route.ts (NOT pages/api/auth/)
import { handlers } from "@/auth";
export const { GET, POST } = handlers;

// Server Component - use auth()
import { auth } from "@/auth";
export default async function Page() {
  const session = await auth();
  // ...
}

// Client Component - use SessionProvider + useSession
"use client";
import { useSession } from "next-auth/react";
```

**Phase to address:** Phase 1 (Initial Setup) - Use Auth.js v5 patterns from start

**Sources:**
- [Auth.js v5 Getting Started](https://authjs.dev/getting-started)

---

### Pitfall 14: SessionProvider Bundle Size Bloat

**What goes wrong:** Importing `SessionProvider` causes large Node.js polyfills (crypto) to be bundled into client JavaScript.

**Why it happens:** NextAuth.js client utilities import Node.js modules that need polyfilling for browser.

**Consequences:**
- Large bundle size (100KB+ additional)
- Slower page loads
- Poor Core Web Vitals

**Warning signs:**
- Large JavaScript bundles
- Webpack warnings about Node.js polyfills
- Slow initial page load

**Prevention:**
- Use server-side `auth()` when possible
- Lazy load SessionProvider
- Only use `useSession()` where necessary

```typescript
// Prefer server components
import { auth } from "@/auth";

export default async function Page() {
  const session = await auth(); // No client bundle impact
  return <div>Welcome {session?.user?.name}</div>;
}
```

**Phase to address:** Phase 2 (Optimization) - Consider after basic auth works

**Sources:**
- [Issue #12902 - Performance Bug](https://github.com/nextauthjs/next-auth/issues/12902)

---

### Pitfall 15: Scattered Permission Code

**What goes wrong:** Permission checks like `if (user.role === 'admin')` scattered across 20+ files, making role changes difficult.

**Why it happens:** Organic code growth without centralized permission system.

**Consequences:**
- Adding new roles requires changes in many files
- Inconsistent permission enforcement
- Easy to miss permission checks

**Prevention:**
Create centralized permission config:
```typescript
// lib/permissions.ts
export const PERMISSIONS = {
  'initiatives:create': ['ADMIN', 'EDITOR'],
  'initiatives:edit': ['ADMIN', 'EDITOR'],
  'initiatives:delete': ['ADMIN'],
  'initiatives:view': ['ADMIN', 'EDITOR', 'VIEWER'],
} as const;

export function hasPermission(
  role: Role,
  permission: keyof typeof PERMISSIONS
): boolean {
  return PERMISSIONS[permission].includes(role);
}

// Usage everywhere:
if (!hasPermission(session.user.role, 'initiatives:delete')) {
  return new Response('Forbidden', { status: 403 });
}
```

**Phase to address:** Phase 2 (RBAC Implementation) - Design permission system before implementing

**Sources:**
- [Next.js Admin Panel RBAC Guide](https://eastondev.com/blog/en/posts/dev/20260107-nextjs-rbac-admin-guide/)

---

## Minor Pitfalls

### Pitfall 16: Missing email_verified Check

**What goes wrong:** Allowing users with unverified emails to sign in.

**Why it happens:** Assuming Google always returns verified emails.

**Prevention:**
Always check `profile.email_verified` in signIn callback (shown in Pitfall 2).

**Phase to address:** Phase 1 (Provider Setup)

---

### Pitfall 17: Not Handling Sign-In Errors Gracefully

**What goes wrong:** Users see cryptic error pages when authentication fails.

**Why it happens:** No custom error page configured.

**Prevention:**
```typescript
// auth.ts
export const { handlers, auth } = NextAuth({
  pages: {
    signIn: '/login',
    error: '/auth/error', // Custom error page
  }
});

// app/auth/error/page.tsx
export default function AuthError({ searchParams }) {
  const error = searchParams.error;
  // Show user-friendly message based on error type
}
```

**Phase to address:** Phase 1 (UX Polish)

---

### Pitfall 18: Linking Existing TeamMember to User

**What goes wrong:** After adding auth, existing `TeamMember` enum values (KHAIRUL, AZLAN, IZYANI) don't link to authenticated users.

**Why it happens:** Your schema uses enums for team members, but NextAuth creates separate User records.

**Consequences:**
- Disconnect between auth users and initiative assignments
- Can't determine which authenticated user is which team member
- Need manual data migration

**Prevention:**
Plan migration strategy:
1. Create User records for each team member
2. Add `userId` foreign key to Initiative for personInCharge/accountable
3. Migrate existing enum data to relationships
4. Consider keeping enum for backward compatibility during transition

**Phase to address:** Phase 1 (Schema Planning) - Design migration before implementation

---

## Phase-Specific Warnings Summary

| Phase | Topic | Likely Pitfall | Mitigation |
|-------|-------|---------------|------------|
| Phase 1 | Next.js Version | CVE-2025-29927 | Verify 14.2.25+, multi-layer auth |
| Phase 1 | Environment | NEXTAUTH_SECRET/URL | Set correctly for Docker/Cloudflare |
| Phase 1 | Domain Restriction | hd parameter bypass | signIn callback validation |
| Phase 1 | Schema | Missing NextAuth tables | Add User/Account/Session models |
| Phase 1 | Dependencies | Adapter version issues | Pin compatible versions |
| Phase 1 | Runtime | Edge/Prisma conflict | Use JWT strategy |
| Phase 2 | RBAC | Role not in session | JWT/session callbacks |
| Phase 2 | RBAC | Frontend-only checks | Backend verification |
| Phase 2 | RBAC | Scattered code | Centralized permissions |
| Phase 3 | Deployment | URL mismatch | Correct NEXTAUTH_URL |
| Phase 3 | Deployment | Session issues | Test auth flow end-to-end |

---

## Security Checklist

Before going live, verify:

- [ ] Next.js version >= 14.2.25 (CVE-2025-29927 patched)
- [ ] Domain restriction in signIn callback (not just hd parameter)
- [ ] NEXTAUTH_SECRET set and secure (32+ characters)
- [ ] NEXTAUTH_URL matches public domain
- [ ] Role included in JWT/session
- [ ] All API routes verify authentication AND authorization
- [ ] Server Actions verify permissions
- [ ] Custom error pages configured
- [ ] No client secrets in frontend code
- [ ] Session expiry configured appropriately

---

## Sources

**Official Documentation:**
- [Auth.js Getting Started](https://authjs.dev/getting-started)
- [Auth.js Prisma Adapter](https://authjs.dev/getting-started/adapters/prisma)
- [Auth.js Role Based Access Control](https://authjs.dev/guides/role-based-access-control)
- [NextAuth.js Google Provider](https://next-auth.js.org/providers/google)

**Security Advisories:**
- [CVE-2025-29927 - Datadog Security Labs](https://securitylabs.datadoghq.com/articles/nextjs-middleware-auth-bypass/)
- [CVE-2025-29927 - ProjectDiscovery](https://projectdiscovery.io/blog/nextjs-middleware-authorization-bypass)

**GitHub Issues & Discussions:**
- [Domain Restriction Discussion #266](https://github.com/nextauthjs/next-auth/discussions/266)
- [RBAC Middleware Discussion #9609](https://github.com/nextauthjs/next-auth/discussions/9609)
- [Prisma Adapter Issue #12899](https://github.com/nextauthjs/next-auth/issues/12899)
- [Redirect URI Issue #6526](https://github.com/nextauthjs/next-auth/issues/6526)

**Guides:**
- [Next.js Security Guide 2025 - TurboStarter](https://www.turbostarter.dev/blog/complete-nextjs-security-guide-2025-authentication-api-protection-and-best-practices)
- [RBAC in Next.js - Medium](https://medium.com/@mkilincaslan/rbac-in-next-js-with-nextauth-b438fe59eeeb)
