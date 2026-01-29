# Milestone History

## v2.8: AI Analyze Button

**Shipped:** 2026-01-29
**Duration:** < 1 day
**Phases:** 4 (Phases 80-83)
**Plans:** 5
**Stats:** 6 commits, 7 files changed, +570 lines

### Summary

Added a header button that triggers Claude Code's /ai-analyze command on the Mac via SSH from the NAS deployment. Admin-only with pending count badge, dropdown menu for analysis types, and hybrid polling for completion feedback.

### Key Accomplishments

- SSH setup documentation for NAS-to-Mac communication (Mac IP: 192.168.100.148)
- Extended /api/ai/pending with granular counts by type (costs, invoices, receipts, deliverables, total)
- Created /api/ai/trigger endpoint that SSHs to Mac and runs Claude /ai-analyze in background
- AiAnalyzeButton component with Sparkles icon, badge, dropdown menu, and hybrid polling (15s for 90s)
- Toast feedback on trigger success/failure and completion detection

### Requirements Delivered

| Category | Count | IDs |
|----------|-------|-----|
| Infrastructure (INFRA) | 2 | INFRA-01 to INFRA-02 |
| Pending API (API) | 3 | API-01 to API-03 |
| Trigger API (TRIG) | 5 | TRIG-01 to TRIG-05 |
| UI Component (UI) | 6 | UI-01 to UI-06 |
| Polling (POLL) | 5 | POLL-01 to POLL-05 |
| **Total** | **21** | |

### Artifacts

- Roadmap: `.planning/milestones/v2.8-ROADMAP.md`
- Requirements: `.planning/milestones/v2.8-REQUIREMENTS.md`

---

## v2.7: Services Pricing History

**Shipped:** 2026-01-29
**Duration:** < 1 day
**Phases:** 1 (Phase 79)
**Plans:** 6
**Stats:** Services pricing view with three tabs, statistics, and Excel export

### Summary

Added a dedicated Services Pricing History page showing all deliverables with value across projects, with three-tab organization (All Services, By Service, By Client), statistics per view, search/filter, Excel export, and row-click detail editing.

### Key Accomplishments

- Services Pricing History page at /services-pricing/
- Three-tab view: All Services, By Service, By Client
- Statistics per view (count, min/max/avg pricing, total revenue)
- Search and filter functionality
- Export to Excel (XLSX)
- Row click to open deliverable detail modal
- Navigation link under Work group with Receipt icon

### Artifacts

- Roadmap: `.planning/milestones/v2.7-ROADMAP.md`
- Requirements: `.planning/milestones/v2.7-REQUIREMENTS.md`

---

## v2.6: Views & Calendar Enhancement

**Shipped:** 2026-01-29
**Duration:** 1 day
**Phases:** 4 (Phases 75-78)
**Plans:** 11
**Stats:** 18 files changed, +2,159 / -324 lines

### Summary

Enhanced visualization capabilities with Kanban views for projects and tasks, a unified main calendar showing all entity dates, and richer project card information. Moved Members navigation under Work group for logical organization.

### Key Accomplishments

- Moved Members nav item to Work group in sidebar (consolidated team access)
- Projects Kanban board with drag-and-drop status columns (Draft, Active, Completed, Cancelled)
- Enhanced project cards with status badges, client info, date ranges, task progress, revenue/cost summary
- Tasks Kanban view with project grouping option (collapsible project sections with status columns)
- Unified Calendar view showing task/project/initiative dates with day/week/month views
- Date markers only (no spanning between dates) with grey color for completed items

### Requirements Delivered

| Category | Count | IDs |
|----------|-------|-----|
| Navigation (NAV) | 3 | NAV-01 to NAV-03 |
| Projects Kanban (PROJ) | 10 | PROJ-01 to PROJ-10 |
| Tasks Grouping (TASK) | 4 | TASK-01 to TASK-04 |
| Main Calendar (CAL) | 12 | CAL-01 to CAL-12 |
| **Total** | **29** | |

### Artifacts

- Roadmap: `.planning/milestones/v2.6-ROADMAP.md`
- Requirements: `.planning/milestones/v2.6-REQUIREMENTS.md`

---

## v2.5: Navigation Reorganization

**Shipped:** 2026-01-28
**Duration:** < 1 day
**Phases:** 3 (Phases 72-74)
**Plans:** 3
**Stats:** 19 files changed, +821 / -90 lines

### Summary

Reorganized sidebar navigation to group related items logically. Created "Work" navigation group between SAAP and CRM containing Projects and Tasks together. Renamed "Potential Projects" to "Repeat Clients" throughout the UI. Added expandable Members navigation with clickable links to individual team member pages.

### Key Accomplishments

- Created "Work" nav group between SAAP and CRM with Projects and Tasks together for logical grouping
- Renamed "Potential Projects" to "Repeat Clients" in nav label, page header, dialogs, toasts, and modals (7 files)
- Added expandable Members navigation with children for Khairul, Azlan, Izyani
- Active child route auto-expands parent in both desktop and mobile sidebars
- Maintained backward compatibility: URLs (/potential-projects) and database models (PotentialProject) unchanged

### Requirements Delivered

| Category | Count | IDs |
|----------|-------|-----|
| Navigation Reorganization (NAV) | 7 | NAV-01 to NAV-07 |
| Repeat Clients Rename (RENAME) | 4 | RENAME-01 to RENAME-04 |
| Members Quick Navigation (MBR) | 5 | MBR-01 to MBR-05 |
| **Total** | **16** | |

### Artifacts

- Roadmap: `.planning/milestones/v2.5-ROADMAP.md`
- Requirements: `.planning/milestones/v2.5-REQUIREMENTS.md`

---

## v2.4: Settings, Sidebar & Bug Fixes

**Shipped:** 2026-01-28
**Duration:** 1 day
**Phases:** 4 (Phases 68-71)
**Plans:** 8
**Stats:** 34 files changed, +2,630 / -303 lines

### Summary

Fixed sidebar settings persistence bugs (removed autoReveal, added Save button with dirty detection), added nested Company/Departments/Contacts sidebar navigation, drag-and-drop sidebar reordering via Settings, fixed dashboard revenue accuracy with per-project coalesce, verified task CRUD on completed projects, and added admin-configurable field visibility for internal projects.

### Key Accomplishments

- Fixed sidebar persistence: removed autoReveal entirely, added batch Save button with dirty detection and toast confirmation
- Nested sidebar navigation: Companies expands to show Departments and Contacts with cascade hide, split click zones, parent highlighting
- Drag-and-drop sidebar reorder: @dnd-kit sortable within groups, per-user persistence, Reset Order button
- Dashboard revenue fix: per-project `revenue ?? potentialRevenue` for ACTIVE + COMPLETED projects without double-counting
- Internal project field config: admin toggles for 5 field types, system-wide via AdminDefaults, conditional rendering in forms and detail views
- Task CRUD on completed projects verified working (no blocking code existed)

### Requirements Delivered

| Category | Count | IDs |
|----------|-------|-----|
| Sidebar Fixes (SIDE) | 5 | SIDE-01 to SIDE-05 |
| Nested Navigation (NEST) | 7 | NEST-01 to NEST-07 |
| Sidebar Reorder (REORD) | 7 | REORD-01 to REORD-07 |
| Revenue Accuracy (REV) | 4 | REV-01 to REV-04 |
| Task on Completed (TASK) | 3 | TASK-01 to TASK-03 |
| Internal Field Config (INTL) | 6 | INTL-01 to INTL-06 |
| **Total** | **32** | |

### Artifacts

- Roadmap: `.planning/milestones/v2.4-ROADMAP.md`
- Requirements: `.planning/milestones/v2.4-REQUIREMENTS.md`

---

## v2.3: CRM & UX Improvements

**Shipped:** 2026-01-28
**Duration:** 1 day
**Phases:** 6 (Phases 62-67)
**Plans:** 13
**Stats:** 95 files changed, +11,894 / -281 lines

### Summary

Fixed persistent modal scroll and expand-to-page bugs, added standalone CRM pages for Departments and Contacts with cascading filters, enabled task creation from the cross-project /tasks page, introduced internal project support (Motionvii/Talenta) without external company requirement, added customizable sidebar navigation with per-user preferences, and built line item pricing history with quantity/unitPrice tracking and by-item/by-client views.

### Key Accomplishments

- Fixed modal scroll across all 7 detail views (DialogContent overflow-hidden) and rebuilt project expand-to-page as full dedicated page
- Standalone /departments and /contacts pages with cascading company/department filters, create dialogs, and detail modals
- Task creation from /tasks page with searchable ProjectSelect combobox + subtask creation from task detail with depth validation
- Internal project support with isInternal flag, entity selection (Motionvii/Talenta), nullable companyId, type filter tabs, and Internal badges
- Customizable sidebar navigation with hiddenNavItems per user, always-visible Dashboard/Settings, and auto-reveal on direct URL navigation
- Line item pricing history with quantity/unitPrice fields, CostForm auto-calc, AI receipt extraction, and three-tab Pricing History page (All Items, By Item, By Client)

### Requirements Delivered

| Category | Count | IDs |
|----------|-------|-----|
| UX Fixes (UX) | 4 | UX-01 to UX-04 |
| CRM Browsing (CRM) | 11 | CRM-01 to CRM-11 |
| Task Management (TASK) | 3 | TASK-01 to TASK-03 |
| Internal Projects (INT) | 5 | INT-01 to INT-05 |
| Sidebar Customization (NAV) | 4 | NAV-01 to NAV-04 |
| Line Item Pricing (PRICE) | 6 | PRICE-01 to PRICE-06 |
| **Total** | **33** | |

### Artifacts

- Roadmap: `.planning/milestones/v2.3-ROADMAP.md`
- Requirements: `.planning/milestones/v2.3-REQUIREMENTS.md`

---

## v2.2: Bug Fixes & UX Polish

**Shipped:** 2026-01-28
**Duration:** 1 day
**Phases:** 5 (Phases 57-61)
**Plans:** 11
**Stats:** 23 commits, 20 files changed, +1,163 / -146 lines

### Summary

Fixed critical UI bugs (project detail navigation error, unscrollable modals, sidebar scroll, dashboard breakpoint persistence, kanban drag handles, page spacing), verified department and task visibility in detail views, added full event CRUD (create, edit, delete), and enhanced the calendar with week view toggle and full KR labels.

### Key Accomplishments

- Fixed project detail navigation with dedicated /projects/[id] server page and client wrapper
- Fixed modal scroll by removing conflicting grid class and adding flex layout for mobile containers
- Fixed sidebar scroll with flex-col layout and overflow-y-auto on nav element
- Per-breakpoint dashboard layout persistence so mobile saves don't overwrite desktop
- Full-card drag on desktop kanban (hidden grip handles), touch handles on mobile
- Event CRUD with POST/PATCH/DELETE API routes, form modal for create/edit, delete confirmation dialog
- Calendar week view toggle with expanded day cells and no item truncation
- Full KR labels in calendar (e.g., "KR1.1 - Achieve RM1M Revenue" instead of just identifier)

### Requirements Delivered

| Category | Count | IDs |
|----------|-------|-----|
| Bug Fixes (BUG) | 8 | BUG-01 to BUG-08 |
| UI Visibility (VIS) | 5 | VIS-01 to VIS-05 |
| Events (EVT) | 5 | EVT-01 to EVT-05 |
| Calendar (CAL) | 4 | CAL-01 to CAL-04 |
| **Total** | **22** | |

### Artifacts

- Roadmap: `.planning/milestones/v2.2-ROADMAP.md`
- Requirements: `.planning/milestones/v2.2-REQUIREMENTS.md`

---

## v2.1: Navigation & Views

**Shipped:** 2026-01-28
**Duration:** 2 days
**Phases:** 3 (Phases 54-56)
**Plans:** 5
**Stats:** 24 commits, 41 files changed, +6,002 / -296 lines

### Summary

Consolidated sidebar navigation into collapsible groups with a unified config (fixing mobile drift), added a cross-project task page with table and kanban views (sortable columns, 6 filters, drag-and-drop status changes), and delivered per-member workload dashboards with overview cards and detail pages showing KRs, initiatives, tasks, and support tasks per team member.

### Key Accomplishments

- Unified navigation config eliminating sidebar duplication, with collapsible groups, localStorage persistence, and auto-expand for active routes
- Cross-project /tasks page with sortable table view (6 columns), 6-filter bar, and detail sheet integration
- dnd-kit kanban view with 3 status columns, drag-and-drop status changes, and mobile touch support
- /members overview with 3 member cards showing aggregated workload counts from 4 database models
- /members/[name] detail page with summary stats header, status breakdowns, and 5 sections (KRs, Initiatives, Accountable For, Tasks, Support Tasks)
- Red highlighting for overdue, AT_RISK, and HIGH priority items across all member detail sections

### Requirements Delivered

| Category | Count | IDs |
|----------|-------|-----|
| Navigation (NAV) | 11 | NAV-01 to NAV-11 |
| Tasks (TASK) | 15 | TASK-01 to TASK-15 |
| Members (MBR) | 11 | MBR-01 to MBR-11 |
| **Total** | **37** | |

### Artifacts

- Roadmap: `.planning/milestones/v2.1-ROADMAP.md`
- Requirements: `.planning/milestones/v2.1-REQUIREMENTS.md`

---

## v2.0: OKR Restructure & Support Tasks

**Shipped:** 2026-01-27
**Duration:** 8 days
**Phases:** 8 (Phases 46-53)
**Plans:** 13
**Stats:** 58 commits, 83 files changed, +10,289 / -1,110 lines

### Summary

Promoted KeyResult from a free-text string to a first-class tracked entity with targets, actuals, progress, and status. Added support task management with KR linkage, reseeded from updated Excel (6 KRs, 37 initiatives, 30 support tasks), added revenue target dashboard widget, and enhanced the timeline with drag-to-edit dates and objective grouping.

### Key Accomplishments

- KeyResult as first-class entity: 3 new models (KeyResult, SupportTask, SupportTaskKeyResult), 3 new enums, full OKR hierarchy
- Complete data reseed from MotionVii_SAAP_2026_v2.xlsx: 6 KRs, 37 initiatives, 30 support tasks, 59 join links
- OKR hierarchy UI with KR metrics display (target/actual/progress/status), weighted objective rollup, simplified initiative rows
- Support Tasks page with 4-category grouping, filtering, KR badge links, and sidebar navigation
- Revenue target dashboard widget showing RM1M total with Events (RM800K) and AI Training (RM200K) breakdown
- Timeline drag-to-edit dates with move/resize handles, full titles, and default Objective > KeyResult grouping

### Requirements Delivered

| Category | Count | IDs |
|----------|-------|-----|
| Schema (SCHEMA) | 8 | SCHEMA-01 to SCHEMA-08 |
| Seed (SEED) | 6 | SEED-01 to SEED-06 |
| API (API) | 4 | API-01 to API-04 |
| Utilities (UTIL) | 3 | UTIL-01 to UTIL-03 |
| OKR UI (UI-OKR) | 7 | UI-OKR-01 to UI-OKR-07 |
| Support Tasks UI (UI-ST) | 4 | UI-ST-01 to UI-ST-04 |
| Revenue Widget (UI-REV) | 2 | UI-REV-01 to UI-REV-02 |
| Cleanup (CLEAN) | 3 | CLEAN-01 to CLEAN-03 |
| Timeline (TIMELINE) | 3 | TIMELINE-01 to TIMELINE-03 |
| **Total** | **40** | |

### Artifacts

- Roadmap: `.planning/milestones/v2.0-ROADMAP.md`
- Requirements: `.planning/milestones/v2.0-REQUIREMENTS.md`
- Audit: `.planning/milestones/v2.0-MILESTONE-AUDIT.md`

---

## v1.5.1: Site Audit Fixes & Detail View Preferences

**Shipped:** 2026-01-27
**Duration:** 2 days
**Phases:** 3 (Phases 43-45)
**Plans:** 5
**Stats:** 28 commits, 47 files changed, +4,525 / -644 lines

### Summary

Fixed critical bugs from site audit (Price Comparison crash, Timeline Gantt rendering), improved UX friction points (clickable initiative rows, currency formatting with RM prefix, title wrapping), and built a user-configurable detail view system allowing users to choose between centered dialog and slide-over drawer modes with persistent preferences.

### Key Accomplishments

- Fixed Radix Select empty value crashes (Price Comparison + 2 latent bugs) using sentinel value pattern
- Fixed Timeline Gantt bar rendering (container height) and empty state messaging
- Added clickable initiative rows with detail sheet integration and title wrapping
- Created reusable CurrencyInput component with RM prefix and format-on-blur pattern
- Built DetailView wrapper system with Dialog/Sheet mode switching based on user preference context
- Created settings page (/settings) and header quick-toggle for one-click mode switching

### Requirements Delivered

| Category | Count | IDs |
|----------|-------|-----|
| Bug Fixes (BUG) | 3 | BUG-01 to BUG-03 |
| Clickable Rows (ROW) | 3 | ROW-01 to ROW-03 |
| Data Formatting (FMT) | 3 | FMT-01 to FMT-03 |
| Detail View System (VIEW) | 7 | VIEW-01 to VIEW-07 |
| **Total** | **16** | |

### Artifacts

- Roadmap: `.planning/milestones/v1.5.1-ROADMAP.md`
- Requirements: `.planning/milestones/v1.5.1-REQUIREMENTS.md`
- Audit: `.planning/milestones/v1.5.1-MILESTONE-AUDIT.md`

---

## v1.5: Initiative Intelligence & Export

**Shipped:** 2026-01-26
**Duration:** 1 day
**Phases:** 5 (Phases 38-42)
**Plans:** 8
**Stats:** 39 commits, 54 files changed, +7,350 / -118 lines

### Summary

Transformed the initiatives view from a flat list into an objective-driven intelligence layer. Added three-level hierarchy (Objective > Key Result > Initiative), KPI tracking with auto-calculation from linked projects, date intelligence badges, owner overlap detection, timeline suggestions, and single-click Excel export.

### Key Accomplishments

- Three-level Objective > Key Result > Initiative hierarchy as default view with expand/collapse and view mode toggle across 5 pages
- KPI tracking with auto-calculation from linked project revenue, manual override with AlertDialog confirmation, color-coded progress bars
- Linked project inline visibility with navigation, count badges, revenue/costs aggregation in hierarchy and detail sheet
- Date intelligence badges (overdue, ending-soon, late-start, invalid dates, long duration, owner overlap) with timeline suggestions
- Single-click Excel export with 20-column formatted XLSX via server-side API route

### Requirements Delivered

| Category | Count | IDs |
|----------|-------|-----|
| Schema (SCHEMA) | 2 | SCHEMA-01, SCHEMA-02 |
| Hierarchy & Views (VIEW) | 7 | VIEW-01 to VIEW-07 |
| KPI Tracking (KPI) | 7 | KPI-01 to KPI-07 |
| Linked Projects (PROJ) | 4 | PROJ-01 to PROJ-04 |
| Date Intelligence (DATE) | 8 | DATE-01 to DATE-08 |
| Excel Export (EXPORT) | 5 | EXPORT-01 to EXPORT-05 |
| **Total** | **34** | |

### Artifacts

- Roadmap: `.planning/milestones/v1.5-ROADMAP.md`
- Requirements: `.planning/milestones/v1.5-REQUIREMENTS.md`
- Audit: `.planning/milestones/v1.5-MILESTONE-AUDIT.md`

---

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
