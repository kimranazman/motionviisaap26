# Requirements: SAAP2026v2

**Defined:** 2026-01-21
**Core Value:** Team can visualize and track initiative progress across multiple views with intuitive drag-and-drop.

## v1.1 Requirements

Requirements for authentication milestone: Restrict access to authorized @talenta.com.my users with role-based permissions.

### Authentication

- [x] **AUTH-01**: User can sign in with Google OAuth
- [x] **AUTH-02**: User without @talenta.com.my email sees "Access Denied" page
- [x] **AUTH-03**: User session persists across browser refresh
- [x] **AUTH-04**: User can sign out
- [x] **AUTH-05**: User sees branded login page with Google sign-in button

### Role Management

- [x] **ROLE-01**: New @talenta.com.my user is automatically created as Viewer
- [x] **ROLE-02**: User role (ADMIN, EDITOR, VIEWER) is stored in database
- [x] **ROLE-03**: Admin (khairul@talenta.com.my) is seeded on first run
- [ ] **ROLE-04**: Admin can view list of all users with their roles
- [ ] **ROLE-05**: Admin can change user role (promote/demote)
- [ ] **ROLE-06**: Admin can remove user access

### Route Protection

- [x] **PROT-01**: Unauthenticated user is redirected to login page
- [ ] **PROT-02**: API endpoints return 401 for unauthenticated requests
- [ ] **PROT-03**: API endpoints return 403 for unauthorized role
- [ ] **PROT-04**: Admin-only pages (user management) block non-admins

### Role-Based UI

- [ ] **UI-01**: Viewer cannot see edit controls (status dropdown, reassign, etc.)
- [ ] **UI-02**: Viewer cannot see comment form
- [ ] **UI-03**: Viewer cannot see Kanban quick action menu
- [ ] **UI-04**: Editor and Admin see full edit controls
- [ ] **UI-05**: Only Admin sees "Manage Users" link in navigation

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Enhanced Auth

- **AUTH-06**: User can sign in with Apple OAuth
- **AUTH-07**: User can sign in with GitHub OAuth
- **AUTH-08**: Failed login attempts are logged

### Audit

- **AUDIT-01**: Initiative changes are logged with user who made them
- **AUDIT-02**: Admin can view activity log

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Password authentication | Google OAuth is sufficient, no password management needed |
| Multiple OAuth providers | Google covers all @talenta.com.my users |
| Granular permissions | Three-tier RBAC is sufficient for small team |
| Self-service role requests | Admin manually promotes, keeps it simple |
| Email notifications for auth | Overkill for 3-person team |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 4 | Complete |
| AUTH-02 | Phase 4 | Complete |
| AUTH-03 | Phase 4 | Complete |
| AUTH-04 | Phase 4 | Complete |
| AUTH-05 | Phase 4 | Complete |
| ROLE-01 | Phase 5 | Complete |
| ROLE-02 | Phase 5 | Complete |
| ROLE-03 | Phase 5 | Complete |
| ROLE-04 | Phase 7 | Pending |
| ROLE-05 | Phase 7 | Pending |
| ROLE-06 | Phase 7 | Pending |
| PROT-01 | Phase 4 | Complete |
| PROT-02 | Phase 6 | Pending |
| PROT-03 | Phase 6 | Pending |
| PROT-04 | Phase 6 | Pending |
| UI-01 | Phase 8 | Pending |
| UI-02 | Phase 8 | Pending |
| UI-03 | Phase 8 | Pending |
| UI-04 | Phase 8 | Pending |
| UI-05 | Phase 8 | Pending |

**Coverage:**
- v1.1 requirements: 20 total
- Mapped to phases: 20
- Unmapped: 0

---
*Requirements defined: 2026-01-21*
*Last updated: 2026-01-21 after Phase 5 completion*
