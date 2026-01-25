---
phase: 36-line-item-categorization
plan: 01
subsystem: api
tags: [openai, gpt-4o-mini, prisma, categorization, ai]

# Dependency graph
requires:
  - phase: 35-semantic-price-comparison
    provides: embeddings.ts pattern for lazy OpenAI initialization
provides:
  - normalizedItem field on Cost model for price comparison filtering
  - AI categorization via gpt-4o-mini for standardizing item names
  - Manual normalize endpoint for user override
affects: [36-02, price-table-ui, cost-filtering]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - fire-and-forget AI categorization on cost create/update
    - lazy OpenAI client initialization

key-files:
  created:
    - src/lib/ai-categorization.ts
    - src/app/api/costs/[id]/normalize/route.ts
  modified:
    - prisma/schema.prisma
    - src/app/api/projects/[id]/costs/route.ts
    - src/app/api/projects/[id]/costs/[costId]/route.ts

key-decisions:
  - "Use gpt-4o-mini with temperature=0 for consistent categorization"
  - "Fire-and-forget pattern for non-blocking API responses"
  - "Only categorize costs with suppliers (price comparison context)"

patterns-established:
  - "AI categorization helper follows same lazy init pattern as embeddings"
  - "generateCostCategorization mirrors generateCostEmbedding fire-and-forget"

# Metrics
duration: 5min
completed: 2026-01-25
---

# Phase 36 Plan 01: Line Item Categorization Summary

**AI categorization via gpt-4o-mini assigns normalizedItem to costs for price comparison filtering**

## Performance

- **Duration:** 5 min
- **Started:** 2026-01-25T13:13:26Z
- **Completed:** 2026-01-25T13:18:01Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments
- Cost model extended with normalizedItem field (varchar 100, indexed)
- AI categorization helper using gpt-4o-mini with temperature=0
- Automatic categorization on cost create/update (fire-and-forget)
- Manual normalize endpoint for user override when AI gets it wrong

## Task Commits

Each task was committed atomically:

1. **Task 1: Add normalizedItem field and AI helper** - `2fc6eff` (feat)
2. **Task 2: Modify cost APIs to trigger categorization** - `5f208b8` (feat)
3. **Task 3: Create manual normalize endpoint** - `9330e73` (feat)

## Files Created/Modified
- `prisma/schema.prisma` - Added normalizedItem field and index to Cost model
- `src/lib/ai-categorization.ts` - AI categorization helper using gpt-4o-mini
- `src/app/api/projects/[id]/costs/route.ts` - Fire-and-forget categorization on POST
- `src/app/api/projects/[id]/costs/[costId]/route.ts` - Fire-and-forget categorization on PATCH
- `src/app/api/costs/[id]/normalize/route.ts` - Manual normalize endpoint

## Decisions Made
- Used gpt-4o-mini (not full gpt-4) for cost efficiency - categorization is simple task
- Temperature=0 for consistent outputs (same description = same category)
- Only trigger categorization when cost has supplier (price comparison context)
- System prompt limits output to 3-6 words in title case

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all tasks completed successfully.

## User Setup Required

None - uses existing OPENAI_API_KEY from .env (already configured in v1.3/v1.4).

## Next Phase Readiness
- normalizedItem field ready for UI filtering in 36-02
- Users can now filter costs by normalizedItem to compare prices across suppliers
- Manual override available if AI categorization needs correction

---
*Phase: 36-line-item-categorization*
*Completed: 2026-01-25*
