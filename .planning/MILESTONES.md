# Milestone History

## v1.2: CRM & Project Financials

**Shipped:** 2026-01-22
**Duration:** 1 day
**Phases:** 7 (Phases 9-15)
**Plans:** 13

### Summary

Added complete CRM system with sales pipeline, repeat client tracking, project management with three entry points, cost tracking with profit calculation, and dashboard widgets for pipeline and financial visibility.

### Key Accomplishments

- CRM database schema with Company, Contact, Deal, PotentialProject, Project, Cost models
- Company/Contact management with inline editing and primary contact designation
- Sales Pipeline Kanban with 6-stage drag-drop and Lost reason capture
- Potential Projects Kanban for repeat client tracking (3 stages)
- Projects with 3 entry points (direct, from Deal won, from Potential confirmed) and KRI linking
- Project cost tracking with category breakdown and automatic profit calculation
- Dashboard with 6 CRM KPI cards and Pipeline Stage Chart

### Requirements Delivered

| ID | Requirement |
|----|-------------|
| COMP-01 | User can create company with name, industry, and notes |
| COMP-02 | User can view list of all companies |
| COMP-03 | User can edit company details |
| COMP-04 | User can delete company (with confirmation) |
| COMP-05 | Company detail page shows related deals, potentials, and projects |
| CONT-01 | User can add contact to a company |
| CONT-02 | User can view contacts for a company |
| CONT-03 | User can edit contact details |
| CONT-04 | User can delete contact |
| PIPE-01 | User can view deals in Kanban board by stage |
| PIPE-02 | User can create deal with title, description, value, company, contact |
| PIPE-03 | User can drag deal between stages |
| PIPE-04 | User can edit deal details |
| PIPE-05 | User can delete deal (with confirmation) |
| PIPE-06 | When deal moves to Won, system auto-creates Project |
| PIPE-07 | When deal moves to Lost, user prompted for reason |
| PIPE-08 | User can view pipeline metrics |
| PTNL-01 | User can view potential projects in Kanban board |
| PTNL-02 | User can create potential project |
| PTNL-03 | User can drag potential between stages |
| PTNL-04 | User can edit potential project details |
| PTNL-05 | User can delete potential project |
| PTNL-06 | When potential moves to Confirmed, system auto-creates Project |
| PROJ-01 | User can view list of all projects |
| PROJ-02 | User can create project directly |
| PROJ-03 | User can link project to a KRI (initiative) |
| PROJ-04 | User can edit project details |
| PROJ-05 | User can change project status |
| PROJ-06 | User can delete project |
| PROJ-07 | Project detail shows source (deal, potential, or direct) |
| PROJ-08 | Project detail shows linked KRI if present |
| PROJ-09 | Project detail shows cost breakdown and profit |
| COST-01 | User can add cost item to project |
| COST-02 | User can select cost category |
| COST-03 | User can edit cost item |
| COST-04 | User can delete cost item |
| COST-05 | Project shows total costs |
| COST-06 | Project shows profit (revenue minus costs) |
| DASH-01 | Dashboard shows pipeline by stage |
| DASH-02 | Dashboard shows pipeline total value |
| DASH-03 | Dashboard shows revenue summary |
| DASH-04 | Dashboard shows profit summary |
| DASH-05 | Dashboard shows weighted pipeline value |
| DASH-06 | Dashboard shows win rate |

### Artifacts

- Roadmap: `.planning/milestones/v1.2-ROADMAP.md`
- Requirements: `.planning/milestones/v1.2-REQUIREMENTS.md`
- Audit: `.planning/milestones/v1.2-MILESTONE-AUDIT.md`

---

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
