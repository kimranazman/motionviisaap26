---
phase: 35-ai-price-comparison
plan: 02
subsystem: ai
tags: [openai, embeddings, price-comparison, semantic-matching, react]

# Dependency graph
requires:
  - phase: 35-01
    provides: Embedding infrastructure (getEmbedding, cosineSimilarity, getConfidenceLevel)
provides:
  - Fire-and-forget embedding generation on cost create/update
  - POST /api/suppliers/compare endpoint for semantic matching
  - PriceComparisonSheet component for displaying similar items
  - Compare Prices button integrated with CostCard
affects: [35-03]

# Tech tracking
tech-stack:
  added: []
  patterns: [fire-and-forget async operations, lazy OpenAI initialization, semantic similarity matching]

key-files:
  created:
    - src/app/api/suppliers/compare/route.ts
    - src/components/suppliers/price-comparison-sheet.tsx
  modified:
    - src/app/api/projects/[id]/costs/route.ts
    - src/app/api/projects/[id]/costs/[costId]/route.ts
    - src/components/projects/cost-card.tsx
    - src/lib/embeddings.ts

key-decisions:
  - "Fire-and-forget pattern for embedding generation (no await, background execution)"
  - "0.7 similarity threshold for matching (filters out low-confidence matches)"
  - "Lazy OpenAI initialization to prevent build-time errors"
  - "Scale icon for Compare Prices button (visual semantic)"

patterns-established:
  - "Fire-and-forget: call async function without await, catch errors with .catch(console.error)"
  - "Lazy service init: check null, instantiate on first use, return cached instance"

# Metrics
duration: 6min
completed: 2026-01-25
---

# Phase 35 Plan 02: Comparison API Summary

**Automatic embedding generation on cost save with semantic price comparison UI using Scale button trigger and similarity-sorted results**

## Performance

- **Duration:** 6 min
- **Started:** 2026-01-25T16:00:00Z
- **Completed:** 2026-01-25T16:06:00Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments
- Costs with suppliers automatically get embeddings generated in background (fire-and-forget)
- Compare Prices button appears on cost cards with suppliers (Scale icon)
- PriceComparisonSheet displays similar items with confidence levels and price differences
- Price comparison shows percentage cheaper/more expensive with actual savings amount

## Task Commits

Each task was committed atomically:

1. **Task 1: Add fire-and-forget embedding generation to costs API** - `499fb51` (feat)
2. **Task 2: Create price comparison API endpoint** - `74b993c` (feat)
3. **Task 3: Create PriceComparisonSheet and integrate with CostCard** - `25544b3` (feat)

## Files Created/Modified
- `src/app/api/projects/[id]/costs/route.ts` - Added embedding generation on POST
- `src/app/api/projects/[id]/costs/[costId]/route.ts` - Added embedding regeneration on PATCH
- `src/app/api/suppliers/compare/route.ts` - POST endpoint for semantic matching
- `src/components/suppliers/price-comparison-sheet.tsx` - Sheet displaying similar items
- `src/components/projects/cost-card.tsx` - Added Compare Prices button
- `src/lib/embeddings.ts` - Fixed lazy initialization for build compatibility

## Decisions Made
- Fire-and-forget pattern: Don't await embedding generation, let it run in background so UI responds immediately
- 0.7 similarity threshold: Matches below 70% are filtered out as not useful for comparison
- Price difference display: Shows both percentage and absolute value (e.g., "15% cheaper (Save RM 50)")
- Lazy OpenAI init: Prevents build-time errors when OPENAI_API_KEY not set

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed OpenAI lazy initialization**
- **Found during:** Task 3 (during npm run build verification)
- **Issue:** OpenAI client instantiated at module load time, failing build when OPENAI_API_KEY not set
- **Fix:** Changed to lazy initialization pattern - getOpenAI() creates instance on first call
- **Files modified:** src/lib/embeddings.ts
- **Verification:** npm run build succeeds
- **Committed in:** 25544b3 (Task 3 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Essential fix for build process. No scope creep.

## Issues Encountered
None - all tasks completed as planned with one auto-fix during verification.

## User Setup Required

**External services require manual configuration.** See [35-01-SUMMARY.md](./35-01-SUMMARY.md) for OPENAI_API_KEY setup.

## Next Phase Readiness
- Comparison API fully functional
- Ready for 35-03 (price trend analysis/insights)
- Embedding data will accumulate as users create costs with suppliers

---
*Phase: 35-ai-price-comparison*
*Completed: 2026-01-25*
