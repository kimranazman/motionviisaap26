# Roadmap: SAAP2026v2

## Milestones

- ✅ **v1.0 MVP** - Phases 1-3 (shipped 2026-01-20)
- 🚧 **v1.1 Authentication** - Phases 4-8 (in progress)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1-3) - SHIPPED 2026-01-20</summary>

### Phase 1: Navigation & Detail Page
**Goal**: Users can navigate cleanly and view initiative details on dedicated page
**Plans**: 2 plans

Plans:
- [x] 01-01: Navigation cleanup and routing
- [x] 01-02: Initiative detail page with inline editing

### Phase 2: Header Features
**Goal**: Users can search and receive notifications from header
**Plans**: 2 plans

Plans:
- [x] 02-01: Global search with popover results
- [x] 02-02: Notification bell with badge and grouped alerts

### Phase 3: Kanban Quick Actions
**Goal**: Users can change status and reassign directly from Kanban cards
**Plans**: 1 plan

Plans:
- [x] 03-01: Quick action menu with status change and reassign

</details>

### 🚧 v1.1 Authentication (In Progress)

**Milestone Goal:** Restrict access to authorized @talenta.com.my users with role-based permissions.

#### Phase 4: Auth Foundation
**Goal**: Users can sign in with Google and only @talenta.com.my emails are allowed
**Depends on**: Phase 3 (v1.0 complete)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05
**Success Criteria** (what must be TRUE):
  1. User can click Google sign-in button on branded login page
  2. User with @talenta.com.my email successfully signs in and sees dashboard
  3. User without @talenta.com.my email sees "Access Denied" page
  4. User session persists after browser refresh (no re-login required)
  5. User can sign out and is redirected to login page
**Plans**: 4 plans

Plans:
- [ ] 04-01-PLAN.md — Dependencies and database schema (next-auth, prisma models)
- [ ] 04-02-PLAN.md — Auth configuration and route handler
- [ ] 04-03-PLAN.md — Login page and access denied page
- [ ] 04-04-PLAN.md — Environment setup and end-to-end verification

#### Phase 5: Role Infrastructure
**Goal**: Users are assigned roles and admin is seeded
**Depends on**: Phase 4
**Requirements**: ROLE-01, ROLE-02, ROLE-03
**Success Criteria** (what must be TRUE):
  1. New @talenta.com.my user is automatically created with VIEWER role
  2. User role is stored in database (ADMIN, EDITOR, or VIEWER)
  3. khairul@talenta.com.my is seeded as ADMIN on first run
**Plans**: TBD

Plans:
- [ ] 05-01: TBD

#### Phase 6: Route Protection
**Goal**: Unauthenticated and unauthorized users cannot access protected resources
**Depends on**: Phase 5
**Requirements**: PROT-01, PROT-02, PROT-03, PROT-04
**Success Criteria** (what must be TRUE):
  1. Unauthenticated user visiting any page is redirected to login
  2. API call without session returns 401 Unauthorized
  3. API call with wrong role returns 403 Forbidden
  4. Non-admin user visiting /admin/* routes is blocked
**Plans**: TBD

Plans:
- [ ] 06-01: TBD

#### Phase 7: Admin User Management
**Goal**: Admin can manage user access and roles
**Depends on**: Phase 6
**Requirements**: ROLE-04, ROLE-05, ROLE-06
**Success Criteria** (what must be TRUE):
  1. Admin can view list of all users with their email and role
  2. Admin can change user role (promote Viewer to Editor, demote Editor to Viewer)
  3. Admin can remove user (user can no longer access app)
**Plans**: TBD

Plans:
- [ ] 07-01: TBD

#### Phase 8: Role-Based UI
**Goal**: UI adapts based on user role
**Depends on**: Phase 7
**Requirements**: UI-01, UI-02, UI-03, UI-04, UI-05
**Success Criteria** (what must be TRUE):
  1. Viewer does not see edit controls (status dropdown, reassign, etc.)
  2. Viewer does not see comment form
  3. Viewer does not see Kanban quick action menu
  4. Editor and Admin see all edit controls
  5. Only Admin sees "Manage Users" link in navigation
**Plans**: TBD

Plans:
- [ ] 08-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order. Decimal phases (if inserted) execute between integers.

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Navigation & Detail Page | v1.0 | 2/2 | Complete | 2026-01-20 |
| 2. Header Features | v1.0 | 2/2 | Complete | 2026-01-20 |
| 3. Kanban Quick Actions | v1.0 | 1/1 | Complete | 2026-01-20 |
| 4. Auth Foundation | v1.1 | 0/4 | Ready | - |
| 5. Role Infrastructure | v1.1 | 0/? | Not started | - |
| 6. Route Protection | v1.1 | 0/? | Not started | - |
| 7. Admin User Management | v1.1 | 0/? | Not started | - |
| 8. Role-Based UI | v1.1 | 0/? | Not started | - |

---
*Roadmap created: 2026-01-21*
*Last updated: 2026-01-21*
