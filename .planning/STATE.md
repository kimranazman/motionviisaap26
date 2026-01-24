# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-23)

**Core value:** Team can visualize and track initiative progress with secure access, full CRM, customizable dashboards with project document management, AI document intelligence, and refined revenue model separating estimates from actuals.
**Current focus:** v1.3.2 Conversion Visibility & Archive (complete)

## Current Position

Phase: 28 - Server Query Project Include Fix (2 of 2 in v1.3.2)
Plan: 00 of 1 pending
Status: Gap closure phase added
Last activity: 2026-01-24 - Created Phase 28 to close audit gaps

Progress: v1.3.2 [###########################-----] 75% (3/4 plans complete)

## Milestone History

| Version | Name | Phases | Shipped |
|---------|------|--------|---------|
| v1.0 | MVP | 1-3 | 2026-01-20 |
| v1.1 | Authentication | 4-8 | 2026-01-22 |
| v1.2 | CRM & Project Financials | 9-15 | 2026-01-22 |
| v1.2.1 | Responsive / Mobile Web | 16-20 | 2026-01-23 |
| v1.3 | Document Management & Dashboard Customization | 21-25 | 2026-01-24 |
| v1.3.1 | Revenue Model Refinement | 26 | 2026-01-24 |
| v1.3.2 | Conversion Visibility & Archive | 27 | 2026-01-24 |

**Archives:** `.planning/milestones/`

## Performance Metrics

**Velocity:**
- Total plans completed: 65
- Average duration: 4.2 min
- Total execution time: 271 min

**By Phase (v1.0-v1.3.2):**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-navigation-detail-page | 2 | 18min | 9min |
| 02-header-features | 2 | 8min | 4min |
| 03-kanban-quick-actions | 1 | 3min | 3min |
| 04-auth-foundation | 4 | 13min | 3min |
| 05-role-infrastructure | 1 | 3min | 3min |
| 06-route-protection | 2 | 5min | 2.5min |
| 07-admin-user-management | 2 | 7min | 3.5min |
| 08-role-based-ui | 2 | 7min | 3.5min |
| 09-foundation | 1 | 5min | 5min |
| 10-companies-contacts | 2 | 8min | 4min |
| 11-sales-pipeline | 2 | 7min | 3.5min |
| 12-potential-projects | 1 | 6min | 6min |
| 13-projects-conversion | 3 | 10min | 3.3min |
| 14-project-costs | 2 | 7min | 3.5min |
| 15-dashboard-widgets | 2 | 9min | 4.5min |
| 16-navigation-layout-foundation | 2 | 6min | 3min |
| 17-kanban-responsive | 3 | 21min | 7min |
| 18-tables-responsive | 3 | 11min | 3.7min |
| 19-forms-modals-responsive | 3 | 12min | 4min |
| 20-dashboard-detail-pages | 3 | 7min | 2.3min |
| 21-infrastructure-schema | 2 | 8min | 4min |
| 22-document-management | 3 | 28min | 9.3min |
| 23-widget-registry-roles | 3 | 10min | 3.3min |
| 24-dashboard-customization-ui | 5 | 21min | 4.2min |
| 25-ai-document-intelligence | 5 | 24min | 4.8min |
| 26-revenue-model-refinement | 3 | 8min | 2.7min |
| 27-conversion-visibility-archive | 3 | 16min | 5.3min |

## Accumulated Context

### Key Decisions

Full decision log in PROJECT.md Key Decisions table.

Recent (Phase 26-01):
- potentialRevenue field added for deal/potential conversion estimates
- aiImportedRevenue removed - all revenue now from AI invoices
- Database migrated via prisma db push

Recent (Phase 26-02):
- Deal WON conversion sets potentialRevenue, not revenue
- Potential CONFIRMED conversion sets potentialRevenue, not revenue
- AI invoice import only sets revenue field
- Manual revenue updates blocked in projects API

Recent (Phase 26-03):
- Manual revenue input removed from project edit form
- FinancialsSummary redesigned with dual revenue cards
- Variance row shows difference between potential and actual
- Profit card margin fixed with flex-shrink-0 whitespace-nowrap

Recent (Phase 27-01):
- isArchived field added to Deal, PotentialProject, Project models
- Archive filter applied by default (showArchived=true to include archived)
- Project relation included in deals/potentials API for conversion visibility

Recent (Phase 27-02):
- Conversion badge shows on WON deals and CONFIRMED potentials with linked project title
- View Project button navigates via /projects?open={id} pattern
- Variance display shows estimated vs actual with color coding
- Read-only mode for converted AND lost deals (no editing either)

Recent (Phase 27-03):
- Archive toggle updates URL param and refetches data client-side
- Archived items cannot be dragged in kanban boards
- Archive/Unarchive uses toast notifications for feedback
- Archived badge shows on all card types with gray styling

### Pending Todos

None.

### Blockers/Concerns

None.

## Session Continuity

Last session: 2026-01-24
Stopped at: Phase 28 created to close v1.3.2 audit gaps
Resume: `/gsd:plan-phase 28` to create execution plan for gap closure
