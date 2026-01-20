# Stack Research: NextAuth.js + Google OAuth

**Project:** SAAP 2026 v2 - Authentication Milestone
**Researched:** 2026-01-21
**Overall Confidence:** HIGH

## Executive Summary

NextAuth.js v5 (Auth.js) is the recommended solution for adding Google OAuth to this Next.js 14 App Router project. The v5 release provides native App Router support, a unified `auth()` function, and edge compatibility. While v5 remains in beta (5.0.0-beta.30), it is production-ready and widely adopted. The existing Prisma 6.19.2 setup is compatible with the latest `@auth/prisma-adapter` 2.11.1.

---

## Recommended Stack

### Core Authentication

| Package | Version | Purpose | Rationale |
|---------|---------|---------|-----------|
| `next-auth` | `^5.0.0-beta.30` | Authentication framework | Native App Router support, universal `auth()` function, edge-first design |
| `@auth/prisma-adapter` | `^2.11.1` | Database adapter | Official adapter with Prisma 6 support (peer deps: `>=6`) |

### Why v5 over v4

1. **Native App Router Support** - v4 claims App Router support but requires `pages/api/auth/[...nextauth].ts` workaround
2. **Universal auth() Function** - Single function works in Server Components, Route Handlers, and Middleware
3. **Edge Compatibility** - First-class support for Vercel Edge Runtime (important if migrating later)
4. **Active Development** - v5 is the future; v4 receives only security patches

### Installation Command

```bash
npm install next-auth@beta @auth/prisma-adapter
```

**Note:** Do NOT install `@next-auth/prisma-adapter` (deprecated v4 namespace).

---

## Prisma Adapter Integration

### Compatibility Status

| Component | Version | Status |
|-----------|---------|--------|
| Prisma | 6.19.2 | Compatible |
| @prisma/client | 6.19.2 | Compatible |
| @auth/prisma-adapter | 2.11.1 | Compatible (peer: `>=6`) |

**Previous Issue (Resolved):** An issue was reported in April 2025 where `@auth/prisma-adapter@2.9.0` failed with `@prisma/client@6.6.0`. The issue was closed as COMPLETED on May 14, 2025. Version 2.11.1 includes the fix.

### Required Prisma Schema Additions

Add these models to your existing `prisma/schema.prisma`:

```prisma
// ============================================================
// Auth.js Models (add below existing models)
// ============================================================

enum UserRole {
  ADMIN
  EDITOR
  VIEWER
}

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime? @map("email_verified")
  image         String?
  role          UserRole  @default(VIEWER)

  accounts      Account[]
  sessions      Session[]

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@map("users")
}

model Account {
  id                String  @id @default(cuid())
  userId            String  @map("user_id")
  type              String
  provider          String
  providerAccountId String  @map("provider_account_id")
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@index([userId])
  @@map("accounts")
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique @map("session_token")
  userId       String   @map("user_id")
  expires      DateTime

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("sessions")
}

model VerificationToken {
  identifier String
  token      String
  expires    DateTime

  @@unique([identifier, token])
  @@map("verification_tokens")
}
```

**Key Notes for MySQL/MariaDB:**
- Use `@db.Text` for token fields (can exceed VARCHAR(191) limit)
- `@@map()` uses snake_case for table names (Auth.js convention)
- Column names use snake_case via `@map()` for OAuth compatibility

---

## Google Cloud Console Setup

### Step 1: Create OAuth 2.0 Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. Select **Web application**

### Step 2: Configure OAuth Consent Screen

1. Navigate to **APIs & Services** > **OAuth consent screen**
2. Select **Internal** (restricts to @talenta.com.my organization automatically)
3. Fill in required fields:
   - App name: `SAAP 2026`
   - User support email: your email
   - Developer contact: your email
4. Add scopes: `email`, `profile`, `openid`

**Important:** Selecting "Internal" means only users within your Google Workspace organization (@talenta.com.my) can authenticate. This is the simplest domain restriction method.

### Step 3: Configure Authorized URIs

**Authorized JavaScript origins:**
```
https://saap.motionvii.com
http://localhost:3000
```

**Authorized redirect URIs:**
```
https://saap.motionvii.com/api/auth/callback/google
http://localhost:3000/api/auth/callback/google
```

### Step 4: Copy Credentials

Copy the **Client ID** and **Client Secret** for environment variables.

---

## Environment Variables

### Required Variables

Add to `.env` (local) and Docker environment:

```bash
# Auth.js Configuration
AUTH_SECRET="[generate with: npx auth secret]"
AUTH_URL="https://saap.motionvii.com"  # Production
# AUTH_URL="http://localhost:3000"     # Development

# Google OAuth
AUTH_GOOGLE_ID="your-google-client-id.apps.googleusercontent.com"
AUTH_GOOGLE_SECRET="your-google-client-secret"

# Existing
DATABASE_URL="mysql://saap_user:password@localhost:3306/saap2026"
```

### Generate AUTH_SECRET

```bash
# Option 1: Use Auth.js CLI
npx auth secret

# Option 2: OpenSSL
openssl rand -base64 32
```

### Variable Naming Convention

Auth.js v5 uses the `AUTH_` prefix convention:
- `AUTH_SECRET` - Required for encrypting cookies/tokens
- `AUTH_URL` - Required in production (auto-detected in dev)
- `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` - Provider credentials

---

## File Structure

```
/
├── auth.ts                           # Auth configuration
├── auth.config.ts                    # Edge-compatible config (optional)
├── middleware.ts                     # Route protection
├── app/
│   └── api/
│       └── auth/
│           └── [...nextauth]/
│               └── route.ts          # Auth route handler
├── lib/
│   └── prisma.ts                     # Prisma client (existing)
└── prisma/
    └── schema.prisma                 # Add auth models
```

---

## Configuration Files

### auth.ts (Main Configuration)

```typescript
import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ account, profile }) {
      // Restrict to @talenta.com.my domain
      if (account?.provider === "google") {
        return (
          profile?.email_verified === true &&
          profile?.email?.endsWith("@talenta.com.my")
        )
      }
      return false
    },
    async session({ session, user }) {
      // Include role in session
      session.user.role = user.role
      session.user.id = user.id
      return session
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
})
```

### app/api/auth/[...nextauth]/route.ts

```typescript
import { handlers } from "@/auth"
export const { GET, POST } = handlers
```

### middleware.ts

```typescript
import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isPublicRoute = req.nextUrl.pathname === "/login"

  if (!isLoggedIn && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  if (isLoggedIn && isPublicRoute) {
    return NextResponse.redirect(new URL("/", req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
```

---

## Role-Based Access Control (RBAC)

### Three-Tier Role System

| Role | Capabilities |
|------|-------------|
| ADMIN | Full access: manage users, settings, all CRUD operations |
| EDITOR | Create/edit initiatives, comments, events |
| VIEWER | Read-only access to dashboards and reports |

### Type Extensions

Create `types/next-auth.d.ts`:

```typescript
import { UserRole } from "@prisma/client"
import "next-auth"

declare module "next-auth" {
  interface User {
    role: UserRole
  }

  interface Session {
    user: User & {
      id: string
      role: UserRole
    }
  }
}
```

### Role Checking Utility

```typescript
// lib/auth-utils.ts
import { auth } from "@/auth"
import { UserRole } from "@prisma/client"

export async function requireRole(allowedRoles: UserRole[]) {
  const session = await auth()

  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  if (!allowedRoles.includes(session.user.role)) {
    throw new Error("Forbidden")
  }

  return session
}
```

---

## What NOT to Use

### 1. next-auth v4 (Stable)

**Why not:** Despite being "stable," v4 has poor App Router support. It requires `pages/api/` route handler, documentation is outdated, and you'll fight against the framework.

### 2. @next-auth/prisma-adapter (v4 Namespace)

**Why not:** Deprecated. Use `@auth/prisma-adapter` instead. The old namespace won't receive updates.

### 3. Google `hd` Parameter Alone

**Why not:** The `hd` (hosted domain) parameter only filters the Google sign-in UI. Users can still manually enter other accounts. Always verify domain server-side in the `signIn` callback.

### 4. Credentials Provider for Primary Auth

**Why not:** Credentials provider (email/password) bypasses OAuth benefits, requires password management, and has security footguns. Use Google OAuth as the sole provider for simplicity.

### 5. @sidebase/authjs-prisma-adapter

**Why not for this project:** This is a workaround for custom Prisma output paths (common in Nuxt/monorepos). Since this project uses standard `@prisma/client` location, the official `@auth/prisma-adapter` works fine.

### 6. Database Sessions Without Reason

**Why not:** JWT sessions are sufficient for most apps and don't require database queries on every request. Only use database sessions if you need session revocation or server-side session data.

**Note:** The PrismaAdapter uses database sessions by default. If you want JWT, explicitly set `session: { strategy: "jwt" }` in config.

---

## Session Strategy Decision

### Database Sessions (Default with Adapter)

**Pros:**
- Session revocation (logout user across devices)
- Server-side session data
- User data always fresh from DB

**Cons:**
- Database query on every authenticated request
- Slightly higher latency

### JWT Sessions

**Pros:**
- No database query per request
- Better performance
- Works on edge

**Cons:**
- Cannot revoke sessions instantly
- Token size limits

**Recommendation for SAAP:** Use database sessions (default). The small team size (~3 users) means database overhead is negligible, and session revocation may be useful for admin control.

---

## Migration Checklist

1. [ ] Install packages: `npm install next-auth@beta @auth/prisma-adapter`
2. [ ] Add auth models to `prisma/schema.prisma`
3. [ ] Run `npx prisma db push` or `npx prisma migrate dev`
4. [ ] Create Google OAuth credentials in Cloud Console
5. [ ] Add environment variables
6. [ ] Create `auth.ts` configuration
7. [ ] Create route handler at `app/api/auth/[...nextauth]/route.ts`
8. [ ] Create `middleware.ts` for route protection
9. [ ] Create login page at `app/login/page.tsx`
10. [ ] Add TypeScript declarations for session
11. [ ] Test login flow end-to-end

---

## Sources

### HIGH Confidence (Official Documentation)
- [Auth.js Installation Guide](https://authjs.dev/getting-started/installation)
- [Auth.js Prisma Adapter](https://authjs.dev/getting-started/adapters/prisma)
- [Auth.js Google Provider](https://authjs.dev/getting-started/providers/google)
- [Auth.js Migration to v5](https://authjs.dev/getting-started/migrating-to-v5)
- [Auth.js RBAC Guide](https://authjs.dev/guides/role-based-access-control)

### MEDIUM Confidence (Verified Issue Resolution)
- [Prisma Adapter Issue #12899](https://github.com/nextauthjs/next-auth/issues/12899) - Closed as COMPLETED May 2025
- [npm: next-auth versions](https://www.npmjs.com/package/next-auth?activeTab=versions)
- [npm: @auth/prisma-adapter](https://www.npmjs.com/package/@auth/prisma-adapter)

### Version Verification (npm registry)
- `next-auth@beta` resolves to `5.0.0-beta.30`
- `@auth/prisma-adapter@latest` resolves to `2.11.1`
- Peer dependency: `@prisma/client >=2.26.0 || >=3 || >=4 || >=5 || >=6`
