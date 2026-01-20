# Features Research: Authentication

**Domain:** Internal team app with Google OAuth and role-based access control
**Researched:** 2026-01-21
**Confidence:** HIGH (verified with official Auth.js documentation and industry best practices)

## Context

This research addresses authentication features for an internal team app with:
- Small team at @talenta.com.my domain
- Three-tier roles: Admin, Editor, Viewer
- Auto-approve domain users as Viewer
- Admin manually promotes users
- Goal: Restrict who can edit/comment vs view-only

---

## Table Stakes

Features users expect. Missing = app feels incomplete or insecure.

| Feature | Why Expected | Complexity | Implementation Notes |
|---------|--------------|------------|---------------------|
| **Google OAuth Sign-In** | Standard for internal apps; no password management burden | Low | Use NextAuth.js GoogleProvider; eliminates password-related vulnerabilities |
| **Domain Restriction** | Internal app must reject non-@talenta.com.my users | Low | Use `signIn` callback to verify `profile.email.endsWith("@talenta.com.my")` + `hd` parameter for UI filtering |
| **Session Management** | Users expect to stay logged in across browser sessions | Low | JWT strategy with reasonable expiry (7-30 days); auto-refresh on activity |
| **Role Storage in Session** | Role must be available for UI/API authorization | Low | Persist role in JWT via `jwt()` callback; expose via `session` callback |
| **Protected Routes** | Unauthorized users should not see protected pages | Medium | Next.js middleware checks session before rendering |
| **Server-Side Authorization** | API routes must verify permissions (not just UI) | Medium | Validate `session.user.role` in every API handler |
| **Sign Out** | Users must be able to log out cleanly | Low | NextAuth.js provides this out of the box |
| **User Profile Display** | Show who is logged in (name, avatar) | Low | Access Google profile data via session |

### Why These Are Table Stakes

According to [Auth.js official documentation](https://authjs.dev/guides/role-based-access-control), role-based access control requires:
1. Storing roles in JWT tokens or database
2. Exposing roles via session callback
3. Server-side validation (client-side is "for UX only")

Industry consensus from [enterprise authentication standards](https://www.linkedin.com/pulse/table-stake-features-saas-enterprise-products-rohit-pareek) identifies SSO via Google Workspace as "hypercritical" for internal enterprise apps, along with RBAC/Admin features for user management.

---

## Differentiators

Features that improve experience but are not expected for MVP. Consider for v1.1+.

| Feature | Value Proposition | Complexity | When to Add |
|---------|-------------------|------------|-------------|
| **Activity Audit Log** | Track who changed what, when (accountability for sensitive actions) | Medium | Post-MVP if compliance needs arise |
| **Role Change Notifications** | Email users when their role changes | Low | Nice-to-have for transparency |
| **"Remember Me" Toggle** | Let users choose session duration | Low | If users request shorter sessions |
| **Session Device List** | Show active sessions, allow remote logout | High | Only if security concerns arise |
| **Passkeys/WebAuthn** | Phishing-resistant authentication | High | [Moving toward table stakes](https://www.centerforcybersecuritypolicy.org/insights-and-research/is-phishing-resistant-mfa-table-stakes) but overkill for small internal team |
| **MFA/2FA** | Extra layer of security | Medium | Google OAuth already provides Google's MFA; adding app-level MFA is redundant |
| **Granular Permissions** | Per-initiative permissions beyond roles | High | Only if role-based proves insufficient |
| **Invite-Only Registration** | Admins must invite users before they can join | Medium | Consider if auto-approve feels too open |
| **User Deactivation (vs Delete)** | Disable accounts without deleting history | Low | Post-MVP for audit trail preservation |

### Why These Are Differentiators (Not Table Stakes)

For a small internal team app (3 users currently):
- **Google's MFA** already protects accounts; app-level MFA adds friction without significant security gain
- **Audit logs** matter for compliance; small teams often know who did what
- **Passkeys** are emerging but not yet expected for internal tools
- **Granular permissions** add complexity; start with role-based, add granularity only if needed

---

## Anti-Features

Features to deliberately NOT build. Common mistakes in this domain.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Username/Password Authentication** | Adds password storage, reset flows, security burden. [Google deprecated basic auth March 2025](https://support.google.com/a/answer/14114704?hl=en) | Use Google OAuth exclusively; no passwords to manage |
| **Email/Magic Link Auth** | Adds email sending complexity; doesn't integrate with Workspace | Rely on Google OAuth which users already have |
| **Self-Registration Without Domain Check** | Anyone could create accounts | Always validate @talenta.com.my domain in `signIn` callback |
| **Client-Side Only Authorization** | Trivially bypassed; security theater | Always validate on server; client-side is for UX only |
| **Complex Permission Trees** | Overkill for 3 roles; maintenance nightmare | Simple role hierarchy (Admin > Editor > Viewer) |
| **Custom Role Creation UI** | YAGNI for fixed 3-role system | Hardcode Admin/Editor/Viewer; add custom roles only if actually needed |
| **Multiple Auth Providers** | Adds complexity; team already has Google Workspace | Google OAuth only; one provider, one user record |
| **Public User Profiles** | Internal app; no need for discoverability | Keep user data internal to the app |
| **Social Features (Follow, Friend)** | This is a work tool, not a social network | Focus on task/initiative collaboration |
| **Password Reset Flow** | No passwords = no reset flow needed | OAuth handles all authentication |
| **Email Verification** | Google already verified the email | Trust Google's `email_verified` claim |
| **Remember Password Across Devices** | No passwords to remember | OAuth session management handles this |
| **Rate Limiting Login Attempts** | OAuth provider handles brute force protection | Google protects their own auth flow |

### Why Anti-Features Matter

According to [Auth0's common authentication mistakes](https://auth0.com/blog/five-common-authentication-and-authorization-mistakes-to-avoid-in-your-saas-application/):
- Building password auth when OAuth is available creates unnecessary attack surface
- Client-side authorization is a critical mistake: "always validate on the server"
- [Overprivileged accounts and permission sprawl](https://www.valencesecurity.com/resources/blogs/saas-security-best-practices-and-strategies-for-2025) are major 2025 security concerns

---

## Role Permission Matrix

What each role should be able to do in the SAAP application.

### Core Permissions

| Action | Admin | Editor | Viewer |
|--------|-------|--------|--------|
| **View Dashboard** | Yes | Yes | Yes |
| **View Initiatives** | Yes | Yes | Yes |
| **View Timeline/Gantt** | Yes | Yes | Yes |
| **View Kanban** | Yes | Yes | Yes |
| **View Events** | Yes | Yes | Yes |
| **View Calendar** | Yes | Yes | Yes |

### Initiative Management

| Action | Admin | Editor | Viewer |
|--------|-------|--------|--------|
| **Create Initiative** | Yes | Yes | No |
| **Edit Initiative** | Yes | Yes | No |
| **Delete Initiative** | Yes | No | No |
| **Change Initiative Status** | Yes | Yes | No |
| **Drag/Reorder Kanban Cards** | Yes | Yes | No |
| **Reassign Initiative** | Yes | Yes (own dept) | No |

### Comments/Collaboration

| Action | Admin | Editor | Viewer |
|--------|-------|--------|--------|
| **View Comments** | Yes | Yes | Yes |
| **Add Comments** | Yes | Yes | No |
| **Edit Own Comments** | Yes | Yes | No |
| **Delete Own Comments** | Yes | Yes | No |
| **Delete Any Comment** | Yes | No | No |

### User/Admin Functions

| Action | Admin | Editor | Viewer |
|--------|-------|--------|--------|
| **View User List** | Yes | No | No |
| **Promote User Role** | Yes | No | No |
| **Demote User Role** | Yes | No | No |
| **Remove User** | Yes | No | No |

### Role Hierarchy Rationale

**Viewer (Default for new @talenta.com.my users)**
- Read-only access to all data
- Cannot modify anything
- Suitable for stakeholders who need visibility but shouldn't change data

**Editor**
- Full create/edit capabilities for initiatives and comments
- Cannot delete initiatives (prevents accidents)
- Cannot manage users
- Suitable for team members actively working on initiatives

**Admin**
- Full permissions including destructive actions
- User management (role changes)
- Should be limited to 1-2 trusted individuals

### Implementation Notes

1. **New users auto-approved as Viewer** - Implemented via `signIn` callback checking domain
2. **Role stored in database User model** - Per [Auth.js recommendation](https://authjs.dev/guides/role-based-access-control) for database strategy
3. **Role exposed in session** - Via `session` callback for both client and server access
4. **Server-side enforcement** - Every API route checks `session.user.role` before mutations

---

## Auto-Approval Flow

Recommended flow for domain-restricted auto-approval:

```
User clicks "Sign in with Google"
        |
        v
Google OAuth flow completes
        |
        v
NextAuth signIn callback fires
        |
        v
Check: Does email end with @talenta.com.my?
        |
    NO -+-> Return false (reject sign-in)
        |     User sees error message
        |
   YES -+-> Check: Does user exist in database?
              |
          NO -+-> Create user with role: "VIEWER"
              |
         YES -+-> Load existing user (role unchanged)
              |
              v
        Sign-in successful
        Session contains user.role
```

### Key Implementation Points

1. **`hd` parameter** - Add to Google auth URL to pre-filter account selection UI
   ```typescript
   GoogleProvider({
     authorization: {
       params: { hd: 'talenta.com.my' }
     }
   })
   ```
   Note: This only filters the UI; actual validation must happen in callback

2. **`signIn` callback** - Server-side domain validation (required)
   ```typescript
   callbacks: {
     async signIn({ account, profile }) {
       if (account?.provider === "google") {
         return profile?.email?.endsWith("@talenta.com.my") ?? false
       }
       return true
     }
   }
   ```

3. **Database adapter** - User record created automatically with role field defaulting to "VIEWER"

---

## Feature Dependencies

```
Google OAuth Setup
       |
       +---> Domain Restriction (signIn callback)
       |            |
       |            +---> Auto-Approval Flow
       |
       +---> Session Management (JWT/Database)
                    |
                    +---> Role in Session
                              |
                              +---> Protected Routes (Middleware)
                              |
                              +---> Server-Side Authorization (API)
                              |
                              +---> Client-Side UI Adaptation
                                        |
                                        +---> Role-Based UI (hide/show buttons)
```

---

## MVP Recommendation

For MVP authentication (v1.1), prioritize:

### Must Have (Table Stakes)
1. Google OAuth sign-in
2. Domain restriction (@talenta.com.my only)
3. Auto-approval as Viewer
4. Role storage (Admin/Editor/Viewer)
5. Protected routes via middleware
6. Server-side authorization in API routes
7. Admin UI to change user roles

### Defer to Post-MVP
- Activity audit logging (add if compliance needed)
- Session device management (add if security concerns)
- Granular per-initiative permissions (add if roles prove insufficient)
- Role change notifications (nice-to-have)

---

## Sources

### Official Documentation
- [Auth.js Role-Based Access Control Guide](https://authjs.dev/guides/role-based-access-control)
- [Auth.js Google Provider](https://authjs.dev/getting-started/providers/google)
- [NextAuth.js Google Provider](https://next-auth.js.org/providers/google)
- [Google OAuth Domain Restriction Discussion](https://github.com/nextauthjs/next-auth/discussions/266)
- [Google Workspace OAuth Transition](https://support.google.com/a/answer/14114704?hl=en)

### Industry Best Practices
- [Auth0: Common Authentication Mistakes](https://auth0.com/blog/five-common-authentication-and-authorization-mistakes-to-avoid-in-your-saas-application/)
- [SaaS Security Best Practices 2025](https://www.valencesecurity.com/resources/blogs/saas-security-best-practices-and-strategies-for-2025)
- [Enterprise Table-Stake Features](https://www.linkedin.com/pulse/table-stake-features-saas-enterprise-products-rohit-pareek)
- [Phishing-Resistant MFA as Table Stakes](https://www.centerforcybersecuritypolicy.org/insights-and-research/is-phishing-resistant-mfa-table-stakes)

### Permission Matrix References
- [Best Practices for Users, Roles, and Permissions](https://dev.to/anna_p_s/best-practices-for-managing-users-roles-and-permissions-5140)
- [Grafana Roles and Permissions](https://grafana.com/docs/grafana/latest/administration/roles-and-permissions/)
- [Sirv Users, Roles, Permissions](https://sirv.com/help/articles/users-roles-permissions/)

---

## Confidence Assessment

| Area | Confidence | Reason |
|------|------------|--------|
| Table Stakes | HIGH | Verified with Auth.js official docs and industry standards |
| Differentiators | HIGH | Based on complexity analysis and small team context |
| Anti-Features | HIGH | Auth0 and security best practices clearly document these pitfalls |
| Permission Matrix | MEDIUM | Standard patterns; may need adjustment based on actual workflow |
| Auto-Approval Flow | HIGH | Verified implementation patterns from NextAuth.js discussions |
