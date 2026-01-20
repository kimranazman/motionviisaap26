# Architecture Research: NextAuth.js Integration

**Project:** SAAP 2026 v2
**Researched:** 2026-01-21
**Overall Confidence:** HIGH (verified with official Auth.js documentation)

---

## Executive Summary

NextAuth.js v5 (now branded as Auth.js) provides a well-documented integration path for Next.js 14 App Router with Prisma. The architecture centers on a root-level `auth.ts` configuration file that exports a universal `auth()` function, replacing the previous scattered `getServerSession` calls. For this project with existing MySQL/Prisma setup, **JWT session strategy is recommended** to maintain Edge middleware compatibility and avoid additional database queries per request.

---

## Folder Structure

### Recommended File Layout

```
src/
├── auth.ts                          # Main auth configuration (NEW)
├── auth.config.ts                   # Edge-compatible config subset (NEW)
├── middleware.ts                    # Route protection middleware (NEW)
├── app/
│   ├── api/
│   │   └── auth/
│   │       └── [...nextauth]/
│   │           └── route.ts         # Auth API route handler (NEW)
│   ├── (auth)/                      # Auth pages route group (NEW)
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   └── (dashboard)/                 # EXISTING - protected route group
│       ├── layout.tsx               # Add session check here
│       └── ...existing pages
├── lib/
│   ├── prisma.ts                    # EXISTING - no changes needed
│   └── auth/
│       └── hash.ts                  # Password hashing utilities (NEW)
└── components/
    └── auth/
        ├── login-form.tsx           # Login form component (NEW)
        ├── session-provider.tsx     # Client session provider (NEW)
        └── user-menu.tsx            # User dropdown in header (NEW)
```

### Key Files Explained

| File | Purpose |
|------|---------|
| `src/auth.ts` | Main Auth.js config with Prisma adapter, callbacks, providers |
| `src/auth.config.ts` | Edge-safe config (no Prisma) for middleware |
| `src/middleware.ts` | Protects routes using auth config |
| `src/app/api/auth/[...nextauth]/route.ts` | Handles OAuth callbacks, sign-in/out |

---

## Route Protection

### Three-Layer Protection Strategy

Auth.js documentation recommends **defense in depth**: middleware + server component + data layer.

### Layer 1: Middleware (First Line of Defense)

```typescript
// src/middleware.ts
import { auth } from "@/auth"

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isOnDashboard = req.nextUrl.pathname.startsWith("/(dashboard)")
  const isOnAuthPage = req.nextUrl.pathname.startsWith("/login")

  if (isOnDashboard && !isLoggedIn) {
    return Response.redirect(new URL("/login", req.nextUrl.origin))
  }

  if (isOnAuthPage && isLoggedIn) {
    return Response.redirect(new URL("/", req.nextUrl.origin))
  }
})

export const config = {
  matcher: [
    // Match all paths except static files and images
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}
```

**Edge Compatibility Note:** Because Prisma requires Node.js runtime, middleware must use a separate edge-compatible config:

```typescript
// src/auth.config.ts (Edge-safe, no Prisma)
import type { NextAuthConfig } from "next-auth"

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnDashboard = nextUrl.pathname.startsWith("/(dashboard)")
        || nextUrl.pathname === "/"

      if (isOnDashboard) {
        return isLoggedIn // Redirect to login if not authenticated
      }
      return true
    },
  },
  providers: [], // Providers added in main auth.ts
}
```

### Layer 2: Server Component Protection

```typescript
// src/app/(dashboard)/layout.tsx
import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen">
      <Sidebar user={session.user} />
      <main className="pl-64">{children}</main>
    </div>
  )
}
```

### Layer 3: API Route Protection

```typescript
// src/app/api/initiatives/route.ts (MODIFIED)
import { auth } from "@/auth"
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(request: Request) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    )
  }

  // Existing logic...
  const initiatives = await prisma.initiative.findMany({...})
  return NextResponse.json(initiatives)
}
```

**Alternative: Wrap API routes with auth helper**

```typescript
import { auth } from "@/auth"
import { NextResponse } from "next/server"

// Auth-wrapped handler
export const GET = auth(function GET(req) {
  if (!req.auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // req.auth.user is available here
  // ...existing logic
})
```

---

## Session Handling

### Server Components vs Client Components

| Context | Method | Example |
|---------|--------|---------|
| Server Component | `await auth()` | `const session = await auth()` |
| Server Action | `await auth()` | Same as above |
| API Route | `await auth()` or wrapped handler | `export const GET = auth(...)` |
| Client Component | `useSession()` hook | Requires `SessionProvider` wrapper |
| Middleware | `req.auth` | Available in auth callback |

### Server Component (Recommended Default)

```typescript
// Any Server Component
import { auth } from "@/auth"

export default async function AdminPanel() {
  const session = await auth()

  if (!session?.user) {
    return <div>Please sign in</div>
  }

  if (session.user.role !== "ADMIN") {
    return <div>Access denied</div>
  }

  return <AdminDashboard user={session.user} />
}
```

### Client Component (When Needed)

```typescript
// src/components/auth/session-provider.tsx
"use client"

import { SessionProvider } from "next-auth/react"

export function AuthSessionProvider({
  children
}: {
  children: React.ReactNode
}) {
  return <SessionProvider>{children}</SessionProvider>
}
```

```typescript
// src/app/layout.tsx
import { AuthSessionProvider } from "@/components/auth/session-provider"

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthSessionProvider>
          {children}
        </AuthSessionProvider>
      </body>
    </html>
  )
}
```

```typescript
// Any Client Component
"use client"

import { useSession } from "next-auth/react"

export function UserMenu() {
  const { data: session, status } = useSession()

  if (status === "loading") return <Skeleton />
  if (!session) return <LoginButton />

  return <UserDropdown user={session.user} />
}
```

### JWT vs Database Session Strategy

**Recommendation: Use JWT strategy** for this project.

| Factor | JWT | Database |
|--------|-----|----------|
| Edge Middleware | Compatible | Limited compatibility |
| Scalability | Stateless, no DB queries | Requires DB query per request |
| Session Invalidation | Cannot revoke before expiry | Can invalidate anytime |
| Use Case | Most web apps | High-security apps needing logout-everywhere |

**Configuration:**

```typescript
// src/auth.ts
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt", // Explicit JWT even with adapter
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  // ...
})
```

---

## Database Schema

### Required Auth.js Models

Add these to your existing `prisma/schema.prisma`:

```prisma
// ============================================
// AUTH.JS MODELS (add after existing models)
// ============================================

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  image         String?
  password      String?   // For credentials provider
  role          UserRole  @default(USER)

  accounts      Account[]
  sessions      Session[]

  // Relationship to existing models (optional)
  comments      Comment[]  // If you want to link comments to users

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
  @@index([userId])
  @@map("accounts")
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("sessions")
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
  @@map("verification_tokens")
}

enum UserRole {
  USER
  ADMIN
}
```

### Connecting to Existing Models

Update `Comment` model to optionally link to authenticated users:

```prisma
model Comment {
  id            String      @id @default(cuid())
  content       String      @db.Text
  author        TeamMember  // Keep existing enum for migration
  authorId      String?     // NEW: Optional link to User
  user          User?       @relation(fields: [authorId], references: [id])
  initiativeId  String
  initiative    Initiative  @relation(fields: [initiativeId], references: [id], onDelete: Cascade)

  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  @@index([initiativeId])
  @@index([authorId])
  @@index([createdAt])
  @@map("comments")
}
```

### Migration Strategy

1. Add auth models without breaking existing functionality
2. Keep `TeamMember` enum for backward compatibility during transition
3. Gradually migrate to `User.id` references
4. Eventually deprecate `TeamMember` enum

---

## Middleware

### Complete Middleware Implementation

```typescript
// src/middleware.ts
import NextAuth from "next-auth"
import { authConfig } from "./auth.config"

export default NextAuth(authConfig).auth

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api/auth (auth endpoints must be accessible)
     */
    "/((?!_next/static|_next/image|favicon.ico|public|api/auth).*)",
  ],
}
```

### Auth Config (Edge-Compatible)

```typescript
// src/auth.config.ts
import type { NextAuthConfig } from "next-auth"

export const authConfig = {
  pages: {
    signIn: "/login",
    error: "/login", // Redirect auth errors to login page
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user

      // Define protected routes
      const protectedRoutes = [
        "/",
        "/initiatives",
        "/timeline",
        "/kanban",
        "/events",
        "/calendar",
      ]

      const isProtected = protectedRoutes.some(
        route => nextUrl.pathname === route ||
                 nextUrl.pathname.startsWith(`${route}/`)
      )

      if (isProtected && !isLoggedIn) {
        const redirectUrl = new URL("/login", nextUrl.origin)
        redirectUrl.searchParams.set("callbackUrl", nextUrl.pathname)
        return Response.redirect(redirectUrl)
      }

      // Redirect logged-in users away from login page
      if (nextUrl.pathname === "/login" && isLoggedIn) {
        return Response.redirect(new URL("/", nextUrl.origin))
      }

      return true
    },
  },
  providers: [], // Configured in main auth.ts
} satisfies NextAuthConfig
```

### Main Auth Configuration

```typescript
// src/auth.ts
import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { authConfig } from "./auth.config"
import prisma from "@/lib/prisma"

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        })

        if (!user || !user.password) {
          return null
        }

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        )

        if (!isValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },
  },
})
```

### TypeScript Augmentation

```typescript
// src/types/next-auth.d.ts
import { DefaultSession, DefaultUser } from "next-auth"
import { JWT, DefaultJWT } from "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: string
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    role: string
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string
    role: string
  }
}
```

---

## Build Order

### Suggested Implementation Sequence

#### Phase 1: Core Auth Setup (Foundation)
1. Install dependencies: `npm install next-auth@beta @auth/prisma-adapter bcryptjs`
2. Install dev deps: `npm install -D @types/bcryptjs`
3. Add User, Account, Session, VerificationToken models to Prisma schema
4. Run `npx prisma db push` to sync schema
5. Create `src/auth.config.ts` (edge-compatible config)
6. Create `src/auth.ts` (main config with Prisma)
7. Create `src/app/api/auth/[...nextauth]/route.ts`
8. Create TypeScript augmentation file

#### Phase 2: Route Protection
1. Create `src/middleware.ts`
2. Update `src/app/(dashboard)/layout.tsx` with session check
3. Create `src/app/(auth)/login/page.tsx` with login form
4. Create `src/app/(auth)/layout.tsx` (minimal layout for auth pages)

#### Phase 3: API Protection
1. Update existing API routes to check session
2. Create auth utility helpers if needed
3. Test all protected routes

#### Phase 4: Client Components
1. Create `SessionProvider` wrapper
2. Update root layout to include provider
3. Update header/sidebar with user info
4. Create user menu component

#### Phase 5: Role-Based Access (Optional Enhancement)
1. Add admin-only routes/pages
2. Implement role checks in middleware
3. Add role guards in components

---

## Environment Variables

```env
# Auth.js Configuration
AUTH_SECRET="generate-with-openssl-rand-base64-32"
AUTH_URL="http://localhost:3000"  # Optional in v5, auto-detected

# Optional: OAuth Providers (if adding later)
# AUTH_GITHUB_ID="your-github-client-id"
# AUTH_GITHUB_SECRET="your-github-client-secret"
```

Generate secret:
```bash
openssl rand -base64 32
```

---

## Security Considerations

### Password Hashing

```typescript
// src/lib/auth/hash.ts
import bcrypt from "bcryptjs"

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}
```

### Input Validation with Zod

```typescript
// src/lib/auth/schemas.ts
import { z } from "zod"

export const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

export const signUpSchema = signInSchema.extend({
  name: z.string().min(2, "Name must be at least 2 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})
```

---

## Sources

### Official Documentation (HIGH Confidence)
- [Auth.js Prisma Adapter](https://authjs.dev/getting-started/adapters/prisma)
- [Auth.js Route Protection](https://authjs.dev/getting-started/session-management/protecting)
- [Auth.js Migration to v5](https://authjs.dev/getting-started/migrating-to-v5)
- [Auth.js Role-Based Access Control](https://authjs.dev/guides/role-based-access-control)
- [Auth.js Credentials Provider](https://authjs.dev/getting-started/authentication/credentials)
- [Auth.js Session Strategies](https://authjs.dev/concepts/session-strategies)

### Supplementary Resources (MEDIUM Confidence)
- [Next.js Authentication Tutorial](https://nextjs.org/learn/dashboard-app/adding-authentication)
- [Prisma Auth.js Integration Guide](https://www.prisma.io/docs/guides/authjs-nextjs)
