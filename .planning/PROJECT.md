# SAAP2026v2

## What This Is

Strategic Annual Action Plan (SAAP) application for Motionvii to track 2026 business initiatives. A visual planning tool with Kanban boards, Gantt timelines, and calendar views for a small team (Khairul, Azlan, Izyani) to manage strategic objectives, key results, and action items. Includes Google OAuth authentication, role-based access control, complete CRM with sales pipeline and company departments, project management with deliverables, tasks, document uploads and AI-powered intelligence (financial extraction, price comparison), customizable dashboards, supplier management, and bidirectional pipeline-project sync.

## Core Value

Team can visualize and track initiative progress across multiple views (Kanban, timeline, calendar) and update status through intuitive drag-and-drop — with secure access restricted to authorized @talenta.com.my users. Full CRM enables tracking sales pipeline, organizing contacts by department, converting deals to projects with live bidirectional sync, managing project scope (deliverables and tasks), tracking suppliers with AI-powered price comparison, and managing project documents with AI-extracted financials.

## Current State

**Version:** v1.4.2 UI Polish & Bug Fixes (shipped 2026-01-26)
**Codebase:** ~34,000 LOC TypeScript
**Tech stack:** Next.js 14, Prisma, MariaDB, Tailwind/shadcn, NextAuth.js, OpenAI

## Requirements

### Validated

<!-- Shipped and confirmed working. -->

**v1.0 MVP:**
- ✓ Dashboard with KPI summary (total initiatives, status breakdown, progress) — v1.0
- ✓ Kanban board with drag-and-drop status updates — v1.0
- ✓ Gantt timeline view showing initiative durations — v1.0
- ✓ Calendar view for date-based visualization — v1.0
- ✓ Initiatives list with filtering and search — v1.0
- ✓ Create/edit initiative via modal form — v1.0
- ✓ Delete initiative with confirmation — v1.0
- ✓ Comments on initiatives — v1.0
- ✓ Events to attend tracking — v1.0
- ✓ Initiative detail sheet (slide-out panel) — v1.0
- ✓ Filter by person, status, date range — v1.0
- ✓ NAS deployment with Docker — v1.0
- ✓ Public access via Cloudflare tunnel (saap.motionvii.com) — v1.0
- ✓ Global search with debounced popover results — v1.0
- ✓ Notification bell with badge count and grouped alerts — v1.0
- ✓ Initiative detail page (/initiatives/[id]) with inline editing — v1.0
- ✓ Comments on initiative detail page — v1.0
- ✓ Kanban quick action "Change Status" — v1.0
- ✓ Kanban quick action "Reassign" — v1.0
- ✓ Clean navigation (no dead links) — v1.0

**v1.1 Authentication:**
- ✓ Google OAuth login with NextAuth.js — v1.1
- ✓ Domain-restricted access (@talenta.com.my) — v1.1
- ✓ User roles (Admin, Editor, Viewer) — v1.1
- ✓ Admin user management page — v1.1
- ✓ Protected routes and API endpoints — v1.1
- ✓ Role-based UI (hide edit buttons for Viewers) — v1.1
- ✓ Comments auto-assigned to logged-in user — v1.1

**v1.2 CRM & Project Financials:**
- ✓ Company management (create, edit, delete, search, filter by industry) — v1.2
- ✓ Contact management with primary contact designation — v1.2
- ✓ Sales pipeline Kanban (Lead → Qualified → Proposal → Negotiation → Won/Lost) — v1.2
- ✓ Deal CRUD with company/contact linking — v1.2
- ✓ Lost reason capture on deal stage change — v1.2
- ✓ Pipeline metrics (open pipeline value, deal counts by stage) — v1.2
- ✓ Potential projects Kanban (Potential → Confirmed/Cancelled) — v1.2
- ✓ Auto-conversion: Deal Won → Project created — v1.2
- ✓ Auto-conversion: Potential Confirmed → Project created — v1.2
- ✓ Direct project creation (no pipeline required) — v1.2
- ✓ Project KRI (initiative) linking — v1.2
- ✓ Project status lifecycle (Draft, Active, Completed, Cancelled) — v1.2
- ✓ Company detail shows related deals, potentials, projects — v1.2
- ✓ Project cost tracking with categories (Labor, Materials, Vendors, Travel, Software, Other) — v1.2
- ✓ Project profit calculation (revenue minus costs) — v1.2
- ✓ Dashboard: Open Pipeline, Weighted Forecast, Win Rate, Total Deals — v1.2
- ✓ Dashboard: Revenue and Profit summaries — v1.2
- ✓ Pipeline Stage Chart visualization — v1.2

**v1.2.1 Responsive / Mobile Web:**
- ✓ Bottom navigation bar for mobile with Dashboard, Initiatives, CRM, Events — v1.2.1
- ✓ Mobile hamburger menu with slide-out sidebar — v1.2.1
- ✓ Responsive search (icon → dialog on mobile) — v1.2.1
- ✓ Touch-enabled Kanban drag-and-drop with 250ms hold delay — v1.2.1
- ✓ Horizontal scroll columns with 75% viewport width snap — v1.2.1
- ✓ Always-visible quick actions on mobile (hover-only on desktop) — v1.2.1
- ✓ Priority columns pattern for tables (secondary columns hidden on mobile) — v1.2.1
- ✓ Full-screen modals sliding from bottom on mobile — v1.2.1
- ✓ 44px touch targets on all interactive elements — v1.2.1
- ✓ Responsive form field grids (1 column mobile, 2 columns tablet+) — v1.2.1
- ✓ Dashboard KPI cards stacking (1/2/4 columns by breakpoint) — v1.2.1
- ✓ Chart legends and axis labels optimized for mobile readability — v1.2.1
- ✓ Initiative and company detail pages with responsive layouts — v1.2.1
- ✓ Timeline Gantt chart with horizontal scroll on mobile — v1.2.1

**v1.3 Document Management & Dashboard Customization:**
- ✓ Document upload via drag-drop and file picker — v1.3
- ✓ File validation (PDF, PNG, JPG only, max 10MB) — v1.3
- ✓ Per-project document storage in /uploads/projects/{id}/ — v1.3
- ✓ Document categorization (RECEIPT, INVOICE, OTHER) with filtering — v1.3
- ✓ Project start/end date fields — v1.3
- ✓ Widget registry with 7 dashboard widgets — v1.3
- ✓ Role-based widget restrictions — v1.3
- ✓ Admin-defined default dashboard layout — v1.3
- ✓ User dashboard customization with drag-drop, resize, persistence — v1.3
- ✓ Dashboard date range filter with presets — v1.3
- ✓ AI invoice parsing with line item extraction and revenue calculation — v1.3
- ✓ AI receipt parsing with cost entry creation and category suggestions — v1.3
- ✓ Manifest file generation per project for AI context — v1.3

**v1.3.1 Revenue Model Refinement:**
- ✓ potentialRevenue field for deal/potential conversion estimates — v1.3.1
- ✓ revenue field from AI invoices only (actual revenue) — v1.3.1
- ✓ Manual revenue input removed from project edit form — v1.3.1
- ✓ FinancialsSummary shows potential vs actual with variance — v1.3.1
- ✓ Profit card displays correctly on all screen sizes — v1.3.1

**v1.3.2 Conversion Visibility & Archive:**
- ✓ Conversion badge on WON deals/CONFIRMED potentials with project title — v1.3.2
- ✓ View Project button in detail sheets for navigation to converted project — v1.3.2
- ✓ Variance display (estimated vs actual revenue) with color coding — v1.3.2
- ✓ Read-only mode for converted deals/potentials and lost deals — v1.3.2
- ✓ Archive toggle in pipeline, potential-projects, and projects boards — v1.3.2
- ✓ Archive/Unarchive buttons in all detail sheets with toast notifications — v1.3.2
- ✓ Archived badge on cards, drag disabled for archived kanban items — v1.3.2
- ✓ Server-side project include for initial-load conversion visibility — v1.3.2

**v1.4 Intelligent Automation & Organization:**
- ✓ Converted deals/potentials show live project metrics (revenue, costs, status) — v1.4
- ✓ Project title changes sync back to source deal/potential — v1.4
- ✓ Activity history log on cards showing sync changes — v1.4
- ✓ Pipeline boards auto-refresh with 60-second polling — v1.4
- ✓ Supplier CRUD with contact info, credit terms, payment terms — v1.4
- ✓ Supplier list page with search filtering — v1.4
- ✓ Link suppliers to project costs via SupplierSelect — v1.4
- ✓ Supplier detail with price list, total spend, projects worked on — v1.4
- ✓ AI semantic matching for line item comparison across suppliers — v1.4
- ✓ Price comparison view with confidence levels and savings — v1.4
- ✓ Department CRUD under Company — v1.4
- ✓ Contacts belong to departments — v1.4
- ✓ Deals/potentials scoped to departments — v1.4
- ✓ Cascading Company → Department → Contact selection in forms — v1.4
- ✓ Project deliverables CRUD with AI extraction from invoices — v1.4
- ✓ Task CRUD with status, due date, assignee, priority — v1.4
- ✓ Subtasks with 5-level nesting and tag inheritance — v1.4
- ✓ Task comments and progress tracking — v1.4
- ✓ Task tree view with collapse/expand — v1.4

**v1.4.1 Line Item Categorization:**
- ✓ AI assigns normalizedItem to cost on create/update — v1.4.1
- ✓ Supplier items table with filtering by category and supplier — v1.4.1
- ✓ Price sorting for manual comparison — v1.4.1
- ✓ Inline editing of normalizedItem for corrections — v1.4.1

**v1.4.2 UI Polish & Bug Fixes:**
- ✓ Documents display fixed (useEffect dependency race condition) — v1.4.2
- ✓ All detail panels converted from Sheet to centered Dialog modal — v1.4.2
- ✓ Proper modal sizing (650px default, responsive mobile slide-from-bottom) — v1.4.2

### Active

<!-- No active milestone — run /gsd:new-milestone to start next -->

(None — next milestone not yet defined)

### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- Real-time collaboration — single user typically, not needed
- Mobile app — web-first, responsive design sufficient
- Email notifications — overkill for 3-person team
- Password authentication — Google OAuth is sufficient
- Multiple OAuth providers — Google covers all @talenta.com.my users
- Granular permissions — three-tier RBAC is sufficient for small team
- Self-service role requests — admin manually promotes, keeps it simple
- Complex lead scoring — 3-person team; manual review is fast enough
- AI-powered forecasting — low deal volume; insufficient data for ML
- Marketing automation — not a marketing tool; use external tools
- Custom pipeline stages — fixed stages are clearer for small team
- Multi-pipeline support — one business, one pipeline + potentials
- Activity tracking/logging — overhead for small team; activity history added specifically for sync events only
- Multi-currency support — MYR sufficient for current operations
- Time tracking — separate feature domain; use external tools
- Invoice generation — SAAP tracks invoices, doesn't generate them; use accounting software
- Email integration — overkill for 3-person team

## Context

- Internal tool for Motionvii team (3 people)
- Deployed on Synology DS925+ NAS via Docker
- Accessible at https://saap.motionvii.com (Cloudflare tunnel)
- Data seeded from Excel file (MotionVii_SAAP_2026.xlsx)
- 28 initiatives, 38 events currently in database
- v1.4.2 shipped — all major features complete through intelligent automation, supplier management, and UI polish
- Primary admin: khairul@talenta.com.my

## Infrastructure

- **NAS IP**: 192.168.1.20
- **NAS SSH**: `ssh adminmotionvii@192.168.1.20`
- **Database**: MariaDB running in Docker on NAS, port 3307 (external) → 3306 (internal)
- **Dev connection**: `mysql://saap_user:saap_password_2026@192.168.1.20:3307/saap2026`
- **Deployment docs**: See `DEPLOYMENT.md` in project root

## Constraints

- **Tech stack**: Next.js 14, Prisma, MariaDB, Tailwind/shadcn, NextAuth.js — established, don't change
- **Deployment**: Must work on NAS with low CPU priority (nice -n 19)
- **Team size**: 3 hardcoded team members (Khairul, Azlan, Izyani) in Prisma enum
- **Minimal dependencies**: Prefer existing UI components

## Key Decisions

<!-- Decisions that constrain future work. Add throughout project lifecycle. -->

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Use existing detail sheet for quick edits | Avoid duplicate UI, sheet already works well | ✓ Good |
| Full detail page for comprehensive view | Some workflows need full-page context | ✓ Good |
| Remove auth UI vs disable | Cleaner UX, auth coming in dedicated milestone | ✓ Good |
| Notifications as popover not page | Quick glance, not a separate view | ✓ Good |
| NextAuth.js v5 with JWT sessions | Edge middleware compatible, Prisma adapter | ✓ Good |
| Server-side domain validation | hd parameter alone insufficient | ✓ Good |
| Three-tier RBAC | Admin > Editor > Viewer is enough for small team | ✓ Good |
| Viewers can comment | Participation allowed, editing restricted | ✓ Good |
| Fetch role on sign-in only | Edge runtime doesn't support Prisma | ✓ Good |
| List view for projects (not Kanban) | Status is lifecycle not pipeline | ✓ Good |
| CompanySelect fetches on mount | ContactSelect receives contacts as prop | ✓ Good |
| Lost reason via AlertDialog | Modal intercepts drag completion | ✓ Good |
| Interactive transaction for auto-conversion | Project + source linking atomic | ✓ Good |
| STAGE_PROBABILITY constants | Lead 10%, Qualified 25%, Proposal 50%, Negotiation 75% | ✓ Good |
| Win rate from closed deals only | Won / (Won + Lost) reflects true conversion | ✓ Good |
| Profit card blue/orange coloring | Blue positive, orange negative for visual status | ✓ Good |
| Mobile-first responsive | Phone → tablet → desktop breakpoints | ✓ Good |
| Touch sensor with delay | 250ms hold prevents accidental drags | ✓ Good |
| Priority columns pattern | Hide secondary columns on mobile | ✓ Good |
| 44px touch targets | Apple HIG minimum for accessibility | ✓ Good |
| Bottom navigation on mobile | Standard mobile pattern for key actions | ✓ Good |
| Full-screen modals on mobile | Slide from bottom with rounded corners | ✓ Good |
| Folder-based document storage | /uploads/projects/{id}/ for easy project isolation | ✓ Good |
| react-grid-layout for dashboard | Proven library, handles drag-drop and resize | ✓ Good |
| AI prompts via manifest + Claude Code | Leverage existing Claude integration | ✓ Good |
| potentialRevenue vs revenue split | Clear separation of estimates from actuals | ✓ Good |
| Archive filter default off | Clean views by default, toggle to see archived | ✓ Good |
| Read-only for converted AND lost | Prevents accidental edits to finalized deals | ✓ Good |
| View Project via ?open= param | URL pattern enables deep linking to detail sheet | ✓ Good |
| Server queries mirror API includes | Initial render parity with client fetches | ✓ Good |
| InitiativeDepartment enum rename | Avoids collision with Department model | ✓ Good |
| Global tags for tasks | Simpler implementation, can add projectId later | ✓ Good |
| Task self-reference onDelete: NoAction | MySQL limitation, cascade in app code | ✓ Good |
| Delete protection on suppliers | Cannot delete if costs linked | ✓ Good |
| Lazy-load suppliers in combobox | Load when popover opens, not on mount | ✓ Good |
| Delete department via transaction | Unlinks contacts/deals/potentials first | ✓ Good |
| Contact filtering by department | Shows department contacts plus company-wide (null) | ✓ Good |
| DeliverableReviewSheet separate component | Simpler than extending AIReviewSheet | ✓ Good |
| Task cascade delete in app code | MySQL self-referential FK limitation | ✓ Good |
| TAG_COLORS in lib/tag-utils.ts | Next.js route files cannot export non-route values | ✓ Good |
| Admin role required for tag deletion | Shared resource protection | ✓ Good |
| Expand state in parent TaskTree | Preserves state across data refreshes | ✓ Good |
| Title sync in $transaction | Atomic update with activity logging | ✓ Good |
| 60-second poll interval | Balances freshness with server load | ✓ Good |
| OpenAI text-embedding-3-small | 1536 dimensions, $0.02/1M tokens | ✓ Good |
| JSON column for embedding storage | Works with any MariaDB version | ✓ Good |
| Fire-and-forget embedding generation | No await, background execution | ✓ Good |
| 0.7 similarity threshold | Balances recall with precision | ✓ Good |
| Lazy OpenAI initialization | Prevents build-time errors | ✓ Good |
| Reset state inside fetch effect | Prevents race condition with separate init/fetch effects | ✓ Good |
| Dialog modal for detail views | Better UX than sliding sheet — centered, discoverable | ✓ Good |
| Keep *-sheet.tsx file names | Minimizes import changes across codebase | ✓ Good |
| Dialog width per component type | 650px default, 512px task, 768px AI review | ✓ Good |

---
*Last updated: 2026-01-26 after v1.4.2 milestone*
