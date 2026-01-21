# Milestone History

## v1.1: Authentication

**Shipped:** 2026-01-22
**Duration:** 2 days
**Phases:** 5 (Phases 4-8)
**Plans:** 11

### Summary

Restricted access to authorized @talenta.com.my users with role-based permissions. Implemented Google OAuth login, domain restriction, three-tier RBAC (Admin/Editor/Viewer), admin user management, and role-based UI controls.

### Key Accomplishments

- Google OAuth login with NextAuth.js v5
- Domain restriction (@talenta.com.my only)
- Three-tier roles: Admin, Editor, Viewer
- Admin user management page (view/promote/demote/remove users)
- Role-based UI (Viewers see read-only, Editors/Admins see edit controls)
- Protected routes and API endpoints

### Requirements Delivered

| ID | Requirement |
|----|-------------|
| AUTH-01 | User can sign in with Google OAuth |
| AUTH-02 | User without @talenta.com.my email sees "Access Denied" |
| AUTH-03 | User session persists across browser refresh |
| AUTH-04 | User can sign out |
| AUTH-05 | User sees branded login page with Google sign-in button |
| ROLE-01 | New user automatically created as Viewer |
| ROLE-02 | User role stored in database |
| ROLE-03 | Admin (khairul@talenta.com.my) seeded |
| ROLE-04 | Admin can view list of users |
| ROLE-05 | Admin can change user role |
| ROLE-06 | Admin can remove user access |
| PROT-01 | Unauthenticated redirected to login |
| PROT-02 | API returns 401 for unauthenticated |
| PROT-03 | API returns 403 for unauthorized role |
| PROT-04 | Admin pages block non-admins |
| UI-01 | Viewer cannot see edit controls |
| UI-02 | Viewer CAN add comments |
| UI-03 | Viewer cannot see Kanban quick actions |
| UI-04 | Editor/Admin see full edit controls |
| UI-05 | Only Admin sees "Manage Users" link |

### Artifacts

- Roadmap: `.planning/milestones/v1.1-ROADMAP.md`
- Requirements: `.planning/milestones/v1.1-REQUIREMENTS.md`
- Audit: `.planning/milestones/v1.1-MILESTONE-AUDIT.md`

---

## v1: Complete Incomplete UI Elements

**Shipped:** 2026-01-20
**Duration:** 1 day
**Phases:** 3

### Summary

Filled gaps in navigation, initiative detail views, header features, and Kanban interactions. Polished the existing brownfield app into a complete internal tool.

### Key Accomplishments

- Initiative detail page with inline editing and comments
- Global search with debounced popover results
- Notification bell with badge count and grouped alerts
- Kanban quick actions (status change, reassign)
- Cleaned up dead navigation links

### Requirements Delivered

| ID | Requirement |
|----|-------------|
| NAV-01 | Settings link removed from sidebar |
| NAV-02 | Non-functional Profile/Settings/Logout removed |
| NAV-03 | All initiative links navigate to working detail page |
| DETL-01 | Initiative detail page at /initiatives/[id] |
| DETL-02 | Inline editing on detail page |
| DETL-03 | Comments on detail page |
| SRCH-01 | Global search filters initiatives |
| NOTF-01 | Bell icon shows overdue/at-risk count |
| NOTF-02 | Bell popover shows grouped initiative list |
| KANB-01 | Kanban status change via dropdown |
| KANB-02 | Kanban reassign via dropdown |

### Artifacts

- Archive: `.planning/archive/v1/`
- Audit: `.planning/archive/v1/v1-MILESTONE-AUDIT.md`

---
