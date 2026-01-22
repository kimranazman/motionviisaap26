---
phase: 14-project-costs
plan: 01
subsystem: api
tags: [prisma, nextjs, cost-tracking, crud, decimal-handling]

# Dependency graph
requires:
  - phase: 13-projects-conversion
    provides: Project model and detail sheet to extend with costs
provides:
  - Cost CRUD API routes under /api/projects/[id]/costs
  - Cost categories lookup API at /api/cost-categories
  - CostForm component for add/edit with date picker
  - CostCard component with edit/delete actions
  - Cost utility functions for category colors and profit calculation
affects: [14-02, project-detail-integration, financial-reporting]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Nested resource API pattern for costs under projects"
    - "Decimal to Number conversion in API responses for financial accuracy"

key-files:
  created:
    - src/app/api/cost-categories/route.ts
    - src/app/api/projects/[id]/costs/route.ts
    - src/app/api/projects/[id]/costs/[costId]/route.ts
    - src/lib/cost-utils.ts
    - src/components/projects/cost-form.tsx
    - src/components/projects/cost-card.tsx
  modified: []

key-decisions:
  - "Category colors use distinct Tailwind palette for each of 6 categories"
  - "Cost date defaults to current date if not specified"
  - "Costs ordered by date desc then createdAt desc for chronological display"

patterns-established:
  - "Nested cost routes follow company/contacts pattern exactly"
  - "CostForm accepts categories prop (fetched by parent) for dropdown population"

# Metrics
duration: 3min
completed: 2026-01-22
---

# Phase 14 Plan 01: Cost CRUD Infrastructure Summary

**Cost API routes with Decimal-to-Number conversion, CostForm with date picker, CostCard with category badges and delete confirmation**

## Performance

- **Duration:** 3 min
- **Started:** 2026-01-22T08:01:36Z
- **Completed:** 2026-01-22T08:04:36Z
- **Tasks:** 2
- **Files created:** 6

## Accomplishments

- Cost categories seed verified (6 categories: Labor, Materials, Vendors, Travel, Software, Other)
- Full CRUD API for costs nested under projects with validation and auth
- CostForm component with description, amount, category select, and date picker
- CostCard component with category-colored badge and AlertDialog delete confirmation
- Cost utility functions for category colors and profit calculation

## Task Commits

Each task was committed atomically:

1. **Task 1: Cost API Routes** - `b4cac12` (feat)
2. **Task 2: Cost Components** - `d0db99c` (feat)

## Files Created

- `src/app/api/cost-categories/route.ts` - GET active categories ordered by sortOrder
- `src/app/api/projects/[id]/costs/route.ts` - GET/POST for listing and creating costs
- `src/app/api/projects/[id]/costs/[costId]/route.ts` - PATCH/DELETE for updating and removing costs
- `src/lib/cost-utils.ts` - getCategoryColor, calculateTotalCosts, calculateProfit utilities
- `src/components/projects/cost-form.tsx` - Add/edit cost form with validation and date picker
- `src/components/projects/cost-card.tsx` - Cost display with edit/delete actions

## Decisions Made

- Category colors: Purple (Labor), Amber (Materials), Blue (Vendors), Green (Travel), Cyan (Software), Gray (Other)
- Cost date defaults to current date when not specified on create
- All Decimal amounts converted to Number server-side before sending to client
- Costs ordered by date desc, then createdAt desc for most recent first

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - cost categories were seeded as prerequisite. No external service configuration required.

## Next Phase Readiness

- Cost CRUD infrastructure complete and ready for integration
- CostForm and CostCard components ready to embed in ProjectDetailSheet
- calculateTotalCosts and calculateProfit utilities ready for financial summary display
- Next plan (14-02) will integrate costs into project detail view with profit calculation

---
*Phase: 14-project-costs*
*Completed: 2026-01-22*
