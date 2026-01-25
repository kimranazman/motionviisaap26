# Milestone History

## v1.4.2: UI Polish & Bug Fixes

**Shipped:** 2026-01-26
**Duration:** < 1 day
**Phases:** 1 (Phase 37)
**Plans:** 2
**Stats:** 11 commits, 15 files changed, +1,213 / -158 lines

### Summary

Fixed post-deployment bug where documents stopped displaying in project detail, and converted all detail sheet components from sliding Sheet to centered Dialog modals for better UX discoverability.

### Key Accomplishments

- Fixed documents display race condition (useEffect dependency mismatch — init effect reset state but fetch effect didn't re-trigger)
- Converted 7 detail sheet components to centered Dialog modals (project, deal, initiative, potential, task, AI review, deliverable review)
- Proper width sizing per component type (650px default, 512px task, 768px AI review, 672px deliverable review)
- Mobile responsive with automatic slide-from-bottom behavior on small screens

### Requirements Delivered

| Category | Count | IDs |
|----------|-------|-----|
| Bug Fix (documents display) | 1 | Bug fix |
| UX Improvement (sheet → modal) | 6 | Success criteria 1-6 |

### Artifacts

- Roadmap: `.planning/milestones/v1.4.2-ROADMAP.md`
- Requirements: `.planning/milestones/v1.4.2-REQUIREMENTS.md`

---

## v1.4.1: Line Item Categorization

**Shipped:** 2026-01-25
**Duration:** < 1 day
**Phases:** 1 (Phase 36)
**Plans:** 2
**Stats:** 10 commits, 20 files changed

### Summary

Corrected v1.4 price comparison — replaced semantic search with simpler approach: AI categorizes cost line items with normalized names, users compare prices by filtering a table manually.

### Key Accomplishments

- AI assigns normalizedItem on cost create/update using gpt-4o-mini
- Supplier items table showing all line items across suppliers
- Filter by normalizedItem (category) or supplier
- Sort by price for manual comparison
- Inline editing of normalizedItem for manual corrections

### Requirements Delivered

| Category | Count | IDs |
|----------|-------|-----|
| Line Item Categorization (ITEM) | 9 | ITEM-01 to ITEM-09 |

### Artifacts

- Roadmap: `.planning/milestones/v1.4.2-ROADMAP.md` (included in v1.4.2 archive)
- Requirements: `.planning/milestones/v1.4.2-REQUIREMENTS.md` (included in v1.4.2 archive)

---

## v1.4: Intelligent Automation & Organization

**Shipped:** 2026-01-25
**Duration:** 2 days
**Phases:** 7 (Phases 29-35)
**Plans:** 15
**Stats:** 84 commits, 129 files changed, +21,058 / -199 lines

### Summary

Transformed SAAP into an intelligent project delivery system with supplier management, company departments for organizational structure, project deliverables tracking, comprehensive task management with subtask hierarchies, bidirectional data sync between pipelines and projects, and AI-powered price comparison across suppliers.

### Key Accomplishments

- Full supplier management with CRUD, cost linking, spend analytics, and payment terms tracking
- Company departments with contact assignment and cascading Company → Department → Contact selection in forms
- Project deliverables with CRUD and AI extraction from Talenta/Motionvii invoices
- Comprehensive task management with subtasks (5-level nesting), tags with automatic inheritance, comments, and progress tracking
- Bidirectional sync between projects and source deals/potentials with activity logging timeline
- AI-powered price comparison using OpenAI embeddings for semantic item matching across suppliers with confidence levels

### Requirements Delivered

| Category | Count | IDs |
|----------|-------|-----|
| Live Project Summary (SYNC) | 6 | SYNC-01 to SYNC-06 |
| Supplier Management (SUPP) | 11 | SUPP-01 to SUPP-11 |
| Company Departments (DEPT) | 8 | DEPT-01 to DEPT-08 |
| Project Deliverables (DELV) | 5 | DELV-01 to DELV-05 |
| Task Management (TASK) | 14 | TASK-01 to TASK-14 |
| **Total** | **44** | |

### Artifacts

- Roadmap: `.planning/milestones/v1.4-ROADMAP.md`
- Requirements: `.planning/milestones/v1.4-REQUIREMENTS.md`
- Audit: `.planning/milestones/v1.4-MILESTONE-AUDIT.md`

---

## v1.3.2: Conversion Visibility & Archive

**Shipped:** 2026-01-24
**Duration:** 1 day
**Phases:** 2 (Phases 27-28)
**Plans:** 4
**Stats:** 28 commits, 90 files changed, +11,965 / -451 lines

### Summary

Added conversion visibility to pipeline deals and potential projects with badges linking to converted projects, variance display showing estimated vs actual revenue, read-only mode for converted/lost items, and archive system to hide completed work from active views.

### Key Accomplishments

- Conversion badge on WON deals and CONFIRMED potentials showing linked project title
- "View Project" button in detail sheets for quick navigation to converted project
- Variance display comparing estimated revenue (from deal/potential) vs actual revenue (from AI invoices)
- Read-only mode for converted deals/potentials and lost deals (edit controls disabled)
- Archive toggle in pipeline, potential-projects, and projects boards
- Archive/Unarchive buttons in all detail sheets with toast notifications
- Archived badge on cards with gray styling
- Drag disabled for archived items in kanban boards
- Server-side page queries now include project relation for initial-load conversion visibility

### Requirements Delivered

| ID | Requirement |
|----|-------------|
| CONV-01 | CONFIRMED potential shows "Converted to Project" badge with project title |
| CONV-02 | User can click "View Project" on converted potential to navigate to project detail |
| CONV-03 | Converted potential shows variance (Estimated vs Actual revenue) |
| CONV-04 | Converted potential is read-only (edit controls disabled) |
| CONV-05 | WON deal shows same conversion indicators as potential |
| ARCH-01 | User can archive completed/converted deals, potentials, and projects |
| ARCH-02 | Archived items hidden from default list/board views |
| ARCH-03 | User can toggle "Show Archived" to see archived items |
| ARCH-04 | User can unarchive items to restore them to active views |

### Artifacts

- Roadmap: `.planning/milestones/v1.3.2-ROADMAP.md`
- Requirements: `.planning/milestones/v1.3.2-REQUIREMENTS.md`
- Audit: `.planning/milestones/v1.3.2-MILESTONE-AUDIT.md`

---

## v1.3.1: Revenue Model Refinement

**Shipped:** 2026-01-24
**Duration:** < 1 day
**Phases:** 1 (Phase 26)
**Plans:** 3
**Stats:** 10 commits, 15 files changed

### Summary

Separated potential revenue (estimates from deal/potential conversion) from actual revenue (from AI-imported invoices). Fixed profit card UI cutoff on narrow screens.

### Key Accomplishments

- Added potentialRevenue field to Project model for deal/potential conversion estimates
- Deal WON and Potential CONFIRMED conversion now sets potentialRevenue (not revenue)
- AI invoice import only sets revenue field (actual revenue)
- Removed manual revenue input from project edit form
- Redesigned FinancialsSummary with dual revenue cards showing potential vs actual
- Added variance row showing difference between estimated and actual revenue
- Fixed profit card margin display with flex-shrink-0 whitespace-nowrap

### Requirements Delivered

| ID | Requirement |
|----|-------------|
| REV-01 | Project has potentialRevenue field set from deal/potential conversion |
| REV-02 | Project revenue field is actual revenue from AI invoices only |
| REV-03 | Manual revenue input removed from project edit form |
| REV-04 | Financials Summary shows potential vs actual with variance |
| REV-05 | Profit card displays correctly without cutoff on all screen sizes |

### Artifacts

- Roadmap: See `.planning/ROADMAP.md` (Phase 26 section)
- Audit: `.planning/milestones/v1.3.1-MILESTONE-AUDIT.md`

---

## v1.3: Document Management & Dashboard Customization

**Shipped:** 2026-01-24
**Duration:** 2 days
**Phases:** 5 (Phases 21-25)
**Plans:** 18
**Stats:** 95 commits, 180 files changed, +15,200 / -380 lines

### Summary

Enabled project document management (receipts, invoices) with folder-based storage, AI-powered document analysis for revenue/cost extraction, plus customizable per-user dashboards with role-based widget restrictions.

### Key Accomplishments

- Document upload via drag-drop or file picker with progress indicator
- File validation (PDF, PNG, JPG only, max 10MB)
- Per-project document storage in `/uploads/projects/{id}/`
- Document categorization (RECEIPT, INVOICE, OTHER) with filtering
- Project start/end date fields
- Widget registry with 7 dashboard widgets
- Role-based widget restrictions (Admin configures which roles see which widgets)
- Admin-defined default dashboard layout
- User dashboard customization with drag-drop, resize, persistence
- Dashboard date range filter with presets
- AI invoice parsing with line item extraction and revenue calculation
- AI receipt parsing with cost entry creation and category suggestions
- Manifest file generation per project for AI context

### Requirements Delivered

| ID | Requirement |
|----|-------------|
| DOC-01 to DOC-17 | Document management (upload, list, preview, categorize, project dates) |
| DASH-01 to DASH-15 | Dashboard customization (widget bank, drag-drop, resize, persist, roles) |
| INFRA-01 to INFRA-04 | Infrastructure (body size, Docker volume, file API, Prisma models) |
| AI-01 to AI-08 | AI document intelligence (invoice/receipt parsing, auto-categorization) |

### Artifacts

- Roadmap: See `.planning/ROADMAP.md` (Phases 21-25 section)
- Audit: `.planning/milestones/v1.3-MILESTONE-AUDIT.md`

---

## v1.2.1: Responsive / Mobile Web

**Shipped:** 2026-01-23
**Duration:** 2 days
**Phases:** 5 (Phases 16-20)
**Plans:** 14
**Stats:** 146 commits, 174 files changed, +28,206 / -601 lines

### Summary

Made SAAP fully usable on phone, tablet, and desktop with responsive navigation, touch-friendly Kanban boards, mobile-optimized tables, full-screen forms, and responsive dashboard/detail pages.

### Key Accomplishments

- Bottom navigation bar for mobile with Dashboard, Initiatives, CRM, Events
- Mobile hamburger menu with slide-out sidebar
- Responsive search (icon → dialog on mobile)
- Touch-enabled Kanban drag-and-drop with 250ms hold delay
- Horizontal scroll columns with 75% viewport width snap
- Always-visible quick actions on mobile (hover-only on desktop)
- Priority columns pattern for tables (secondary columns hidden on mobile)
- Full-screen modals sliding from bottom on mobile
- 44px touch targets on all interactive elements
- Responsive form field grids (1 column mobile, 2 columns tablet+)
- Dashboard KPI cards stacking (1/2/4 columns by breakpoint)
- Chart legends and axis labels optimized for mobile readability
- Initiative and company detail pages with responsive layouts
- Timeline Gantt chart with horizontal scroll on mobile

### Requirements Delivered

| ID | Requirement |
|----|-------------|
| NAV-01 | Bottom navigation bar appears on mobile (<768px) |
| NAV-02 | Bottom nav includes Dashboard, Initiatives, CRM, Events |
| NAV-03 | Sidebar hidden on mobile, visible on tablet/desktop |
| NAV-04 | Header adapts (search icon instead of full search bar) |
| NAV-05 | User menu accessible on all screen sizes |
| KAN-01 | Kanban columns scroll horizontally on mobile |
| KAN-02 | Column edges visible to indicate more columns exist |
| KAN-03 | Cards touch-friendly with adequate tap targets |
| KAN-04 | Drag-and-drop works on touch devices |
| KAN-05 | Quick actions menu accessible on mobile |
| KAN-06 | Applies to all 3 Kanban boards (Initiatives, Pipeline, Potentials) |
| TBL-01 | Tables show priority columns only on mobile |
| TBL-02 | Secondary columns hidden on mobile, visible on tablet+ |
| TBL-03 | Action buttons remain accessible on mobile |
| TBL-04 | Filter/search controls work on mobile |
| TBL-05 | Applies to all tables (Companies, Initiatives, Admin Users) |
| FRM-01 | Modals become full-screen on mobile |
| FRM-02 | Form fields stack vertically on mobile |
| FRM-03 | Input fields have adequate touch target size |
| FRM-04 | Date pickers work on mobile |
| FRM-05 | Select dropdowns work on mobile |
| FRM-06 | Detail sheets full-width on mobile |
| DSH-01 | KPI cards stack vertically on mobile (1 column) |
| DSH-02 | KPI cards show 2 columns on tablet |
| DSH-03 | Pipeline stage chart readable on mobile |
| DSH-04 | Chart legends don't overflow |
| DSH-05 | Filter controls work on mobile |
| DET-01 | Initiative detail page responsive layout |
| DET-02 | Company detail page responsive layout |
| DET-03 | Tabs/sections stack appropriately on mobile |
| DET-04 | Inline editing works on mobile |
| DET-05 | Comments section readable on mobile |

### Artifacts

- Roadmap: `.planning/milestones/v1.2.1-ROADMAP.md`
- Requirements: `.planning/milestones/v1.2.1-REQUIREMENTS.md`
- Audit: `.planning/milestones/v1.2.1-MILESTONE-AUDIT.md`

---

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
