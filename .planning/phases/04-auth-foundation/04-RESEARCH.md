# Phase 4 Research: Auth Foundation

**Phase:** 04-auth-foundation
**Goal:** Users can sign in with Google and only @talenta.com.my emails are allowed
**Requirements:** AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05
**Researched:** 2026-01-21
**Source:** Synthesized from v1.1 milestone research

## Summary

Phase 4 establishes the authentication foundation. This is the blocking phase - nothing else can be tested without working sign-in. The phase delivers:

1. Google OAuth sign-in working end-to-end
2. Domain restriction enforced server-side
3. Session persistence across refresh
4. Sign-out functionality
5. Branded login page

## Success Criteria Mapping

| Criteria | Implementation |
|----------|----------------|
| 1. Google sign-in button on branded login page | Login page + GoogleProvider |
| 2. @talenta.com.my email signs in, sees dashboard | signIn callback domain check |
| 3. Non-domain email sees "Access Denied" | signIn callback returns false |
| 4. Session persists after refresh | JWT strategy with adapter |
| 5. Sign out redirects to login | signOut function + pages config |

## Technical Decisions (from research)

### Stack
- `next-auth@5.0.0-beta.30` (Auth.js v5)
- `@auth/prisma-adapter@2.11.1`
- JWT session strategy (Edge middleware compatible)

### File Structure
```
src/
├── auth.ts                          # Main config with Prisma adapter
├── auth.config.ts                   # Edge-safe config (for middleware)
├── middleware.ts                    # Route protection
├── app/
│   ├── api/auth/[...nextauth]/
│   │   └── route.ts                 # Auth route handler
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx             # Branded login page
│   └── (auth)/
│       └── access-denied/
│           └── page.tsx             # Domain rejection page
└── types/
    └── next-auth.d.ts               # TypeScript augmentation
```

### Schema Additions
```prisma
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

model Account { ... }  // Standard Auth.js schema
model Session { ... }  // Standard Auth.js schema
model VerificationToken { ... }
```

## Critical Pitfalls to Avoid

### 1. Domain Restriction (Pitfall #2)
**Wrong:** Only using `hd` parameter
**Right:** Server-side validation in `signIn` callback

```typescript
signIn({ account, profile }) {
  if (account?.provider === "google") {
    return (
      profile?.email_verified === true &&
      profile?.email?.endsWith("@talenta.com.my")
    )
  }
  return false
}
```

### 2. Role Not in Session (Pitfall #4)
**Wrong:** Expecting `session.user.role` to work automatically
**Right:** Configure `jwt` and `session` callbacks + TypeScript augmentation

### 3. NEXTAUTH_URL Behind Cloudflare (Pitfall #9)
**Wrong:** Let it auto-detect
**Right:** Explicitly set `AUTH_URL=https://saap.motionvii.com`

### 4. Missing AUTH_SECRET (Pitfall #10)
**Wrong:** Forget to set in Docker
**Right:** Generate and set `AUTH_SECRET` in all environments

## Environment Variables

```bash
# Required
AUTH_SECRET="[generate with: openssl rand -base64 32]"
AUTH_URL="https://saap.motionvii.com"
AUTH_GOOGLE_ID="your-client-id.apps.googleusercontent.com"
AUTH_GOOGLE_SECRET="your-client-secret"

# Existing
DATABASE_URL="mysql://..."
```

## Implementation Order

1. **Dependencies + Schema** - Install packages, update Prisma schema
2. **Auth Configuration** - auth.ts, auth.config.ts, TypeScript types
3. **Route Handler** - api/auth/[...nextauth]/route.ts
4. **Login Page** - Branded page with Google button
5. **Access Denied Page** - For rejected domains
6. **Environment** - Ensure all env vars set
7. **Test** - End-to-end sign-in flow

## Out of Scope for Phase 4

- ❌ Route protection middleware (Phase 6)
- ❌ Role management (Phase 5)
- ❌ API protection (Phase 6)
- ❌ Admin user management (Phase 7)
- ❌ Role-based UI (Phase 8)

Phase 4 ONLY establishes the auth foundation. Users can sign in/out, sessions persist. That's it.

## Open Questions

1. **Session duration** - Default 30 days acceptable?
2. **Google Cloud Console** - "Internal" (Workspace only) or "External" (with domain validation)?

**Recommendation:** Use "Internal" OAuth app type since all users are @talenta.com.my Google Workspace users. This provides automatic domain restriction at Google's level (belt) while we also validate server-side (suspenders).

---
*Research complete. Ready for planning.*
