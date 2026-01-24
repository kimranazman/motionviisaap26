# SAAP2026v2

## What This Is

Strategic Annual Action Plan (SAAP) application for Motionvii to track 2026 business initiatives. A visual planning tool with Kanban boards, Gantt timelines, and calendar views for a small team (Khairul, Azlan, Izyani) to manage strategic objectives, key results, and action items. Includes Google OAuth authentication, role-based access control, complete CRM with sales pipeline, project management with document uploads and AI-powered financial extraction, customizable dashboards, and conversion visibility with archive management.

## Core Value

Team can visualize and track initiative progress across multiple views (Kanban, timeline, calendar) and update status through intuitive drag-and-drop — with secure access restricted to authorized @talenta.com.my users. Full CRM enables tracking sales pipeline, converting deals to projects with clear visibility into conversion status and revenue variance, managing project documents with AI-extracted financials, and archiving completed work.

## Current State

**Version:** v1.3.2 Conversion Visibility & Archive (shipped 2026-01-24)
**Codebase:** ~50,000 LOC TypeScript
**Tech stack:** Next.js 14, Prisma, MariaDB, Tailwind/shadcn, NextAuth.js

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

### Active

<!-- Current milestone scope. v1.4 Intelligent Automation & Organization -->

**v1.4 Intelligent Automation & Organization:**

*Live Project Summary on Pipeline:*
- [ ] Converted deals/potentials show live project metrics (revenue, costs, status)
- [ ] Project title changes sync back to source deal/potential
- [ ] Activity history log on cards showing changes ("Revenue updated: RM 50K → RM 55K")
- [ ] Data refreshes automatically when viewing pipeline boards

*Supplier Management:*
- [ ] Supplier model with contact info, credit terms, payment terms
- [ ] Supplier list page with search and filtering
- [ ] Link suppliers to project costs
- [ ] Complete price list per supplier (all line items purchased)
- [ ] Price history tracking over time
- [ ] Line item comparison across suppliers (AI semantic matching)
- [ ] Supplier detail page showing total spent, projects worked on

*Company Departments:*
- [ ] Department model under Company
- [ ] Contacts belong to departments
- [ ] Deals/potentials scoped to departments
- [ ] Department-specific notes and behavior tracking
- [ ] Company → Department → Contact selection flow

*Enhanced AI Document Intelligence:*
- [ ] Our invoices/quotes (Talenta/Motionvii) → Project deliverables
- [ ] Supplier invoices → Cost entries (enhanced with supplier linking)
- [ ] Supplier quotations → Supplier pricing info (for comparison)
- [ ] Auto-extract and link suppliers from documents
- [ ] Auto-extract contacts from client invoices

*Project Deliverables & Tasks:*
- [ ] Deliverables model (scope items from our quotes with values)
- [ ] Convert deliverable to task (optional)
- [ ] Standalone tasks on projects
- [ ] Full task tracking: due dates, status, assignee, comments, tags
- [ ] Infinite subtask nesting with inherited tags

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
- v1.3.2 shipped — conversion visibility, archive system, AI document intelligence
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

---
*Last updated: 2026-01-24 after starting v1.4 milestone*
