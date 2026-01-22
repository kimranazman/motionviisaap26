---
phase: 11-sales-pipeline
plan: 01
subsystem: ui
tags: [dnd-kit, kanban, pipeline, deals, crm]

# Dependency graph
requires:
  - phase: 10-companies-contacts
    provides: Company and Contact models for deal associations
provides:
  - Deal CRUD API endpoints
  - Pipeline Kanban board with drag-and-drop
  - Deal stage management (6 stages)
  - Pipeline navigation in sidebar
affects: [12-repeat-client-pipeline, 13-projects, deal-detail]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Pipeline Kanban board using @dnd-kit/core and @dnd-kit/sortable
    - Stage-based column organization with value totals
    - Batch reorder API for drag-and-drop persistence

key-files:
  created:
    - src/app/api/deals/route.ts
    - src/app/api/deals/[id]/route.ts
    - src/app/api/deals/reorder/route.ts
    - src/lib/pipeline-utils.ts
    - src/components/pipeline/pipeline-board.tsx
    - src/components/pipeline/pipeline-column.tsx
    - src/components/pipeline/pipeline-card.tsx
    - src/app/(dashboard)/pipeline/page.tsx
  modified:
    - src/components/layout/sidebar.tsx

key-decisions:
  - "STAGES defined in pipeline-utils.ts for reuse across components"
  - "Column shows value total for quick pipeline value assessment"
  - "DealStage enum from Prisma used directly for type safety"

patterns-established:
  - "Pipeline board pattern: simpler than initiatives Kanban (no filters, swimlanes)"
  - "Stage column with droppable zone and value total display"
  - "Deal card with company/contact association icons"

# Metrics
duration: 3min
completed: 2026-01-22
---

# Phase 11 Plan 01: Pipeline Kanban Board Summary

**Sales Pipeline Kanban with 6-stage drag-and-drop board, deal cards showing value/company/contact, and optimistic updates**

## Performance

- **Duration:** 3 min
- **Started:** 2026-01-22T04:45:08Z
- **Completed:** 2026-01-22T04:48:18Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- Deal CRUD API with GET/POST/PATCH/DELETE and reorder endpoint
- Pipeline Kanban board with 6 stages (Lead, Qualified, Proposal, Negotiation, Won, Lost)
- Deal cards display title, value (formatted currency), company name, contact name
- Stage columns show deal count and total value
- Drag-and-drop with optimistic updates and server persistence
- Pipeline navigation added to sidebar under CRM section

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Deal API routes and pipeline utilities** - `56d6711` (feat)
2. **Task 2: Create Pipeline Kanban components and page** - `51f87fc` (feat)

## Files Created/Modified
- `src/app/api/deals/route.ts` - GET/POST deals with company/contact includes
- `src/app/api/deals/[id]/route.ts` - GET/PATCH/DELETE single deal with stageChangedAt tracking
- `src/app/api/deals/reorder/route.ts` - Batch position/stage update for drag-and-drop
- `src/lib/pipeline-utils.ts` - STAGES config, formatDealStage, getStageColor utilities
- `src/components/pipeline/pipeline-board.tsx` - DndContext with 6 stage columns and optimistic updates
- `src/components/pipeline/pipeline-column.tsx` - Droppable column with count and value total
- `src/components/pipeline/pipeline-card.tsx` - Sortable card with title, value, company, contact
- `src/app/(dashboard)/pipeline/page.tsx` - Server component with prisma.deal.findMany
- `src/components/layout/sidebar.tsx` - Added Pipeline link with Funnel icon

## Decisions Made
- Used STAGES constant in pipeline-utils.ts for centralized stage configuration
- Column displays total value sum for quick pipeline valuation visibility
- Kept pipeline board simpler than initiatives Kanban (no filters, swimlanes, date filtering)
- stageChangedAt updated on any stage change for future reporting

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Pipeline board ready for deal management
- Ready for Plan 02: Deal detail sheet, create dialog, Lost reason prompt
- Company and Contact dropdowns will need to be populated in create form

---
*Phase: 11-sales-pipeline*
*Completed: 2026-01-22*
