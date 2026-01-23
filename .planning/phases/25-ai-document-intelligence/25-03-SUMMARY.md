---
phase: 25-ai-document-intelligence
plan: 03
subsystem: api
tags: [ai, document-intelligence, import, cost-management, prisma, typescript]

# Dependency graph
requires:
  - phase: 25-01
    provides: DocumentAIStatus enum, AI extraction types, manifest utilities
  - phase: 25-02
    provides: Prompt templates defining AIAnalysisResult JSON structure
  - phase: 14-project-costs
    provides: Cost model, CostCategory model
provides:
  - Invoice import API that updates project revenue from AI extraction
  - Receipt import API that creates cost entries with automatic category creation
  - Pending documents API showing projects needing AI analysis with Claude command
  - AI results API to read ai-results.json for frontend review
affects: [25-04, 25-05]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - AI import endpoints with validation and document status tracking
    - Automatic category creation from AI suggestions
    - File-based AI results storage with API retrieval

key-files:
  created:
    - src/app/api/ai/import/invoice/route.ts
    - src/app/api/ai/import/receipt/route.ts
    - src/app/api/ai/pending/route.ts
    - src/app/api/projects/[id]/ai-results/route.ts
  modified: []

key-decisions:
  - "Invoice import adds extraction.total to existing revenue (additive, not replacement)"
  - "Receipt import creates new categories when categoryId is null but suggestedCategory provided"
  - "Case-insensitive category matching to avoid duplicates (Materials vs materials)"
  - "Pending API includes ready-to-run Claude command for bulk analysis"

patterns-established:
  - "AI import endpoints update document aiStatus to IMPORTED after successful import"
  - "File-based AI results stored at UPLOADS_DIR/projects/{id}/ai-results.json"

# Metrics
duration: 5min
completed: 2026-01-24
---

# Phase 25 Plan 03: AI Import API Summary

**API routes for importing AI-extracted invoice/receipt data, querying pending documents, and retrieving AI analysis results**

## Performance

- **Duration:** 5 min
- **Started:** 2026-01-23T22:04:51Z
- **Completed:** 2026-01-23T22:09:44Z
- **Tasks:** 4
- **Files created:** 4

## Accomplishments

- Created invoice import API that adds extraction total to project revenue and marks document as IMPORTED
- Created receipt import API with automatic category creation from AI suggestions
- Created pending documents API showing summary across all projects with ready-to-run Claude command
- Created AI results API to retrieve ai-results.json for frontend review display

## Task Commits

Each task was committed atomically:

1. **Task 1: Create invoice import API route** - `a0940bc` (feat)
2. **Task 2: Create receipt import API route with category creation** - `f078b09` (feat)
3. **Task 3: Create pending documents query API** - `ae2ce3a` (feat)
4. **Task 4: Create AI results retrieval API** - `39f7f97` (feat)

**Bug fix:** `2f206dc` (fix) - TypeScript compatibility issues

## Files Created

- `src/app/api/ai/import/invoice/route.ts` - POST endpoint accepting InvoiceExtraction, updates project revenue, marks document IMPORTED
- `src/app/api/ai/import/receipt/route.ts` - POST endpoint accepting ReceiptExtraction with items, creates Cost entries, auto-creates categories
- `src/app/api/ai/pending/route.ts` - GET endpoint returning pending document summary per project with Claude command
- `src/app/api/projects/[id]/ai-results/route.ts` - GET endpoint reading ai-results.json from project folder

## Decisions Made

- **Additive revenue:** Invoice import adds to existing revenue rather than replacing, allowing multiple invoices
- **Category creation flow:** When categoryId is null but suggestedCategory provided, system either finds existing category (case-insensitive) or creates new one
- **Category deduplication:** Case-insensitive matching prevents "Materials" and "materials" from being created as separate categories
- **Claude command format:** `claude "Read .claude/prompts/bulk-analysis.md and process uploads/projects/"` provided in pending API response

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Prisma mode:'insensitive' not supported on MySQL**
- **Found during:** Task 2 (Receipt import route)
- **Issue:** `mode: 'insensitive'` in Prisma string filter doesn't work with MySQL database
- **Fix:** Replaced with JavaScript case-insensitive comparison using `toLowerCase()`
- **Files modified:** src/app/api/ai/import/receipt/route.ts
- **Verification:** Build passes, case-insensitive matching works correctly
- **Committed in:** 2f206dc

**2. [Rule 1 - Bug] Map iteration not supported by TypeScript target**
- **Found during:** Task 3 (Pending documents route)
- **Issue:** `for (const [, summary] of projectMap)` fails with TypeScript target settings
- **Fix:** Used `Array.from(projectMap.values())` for iteration
- **Files modified:** src/app/api/ai/pending/route.ts
- **Verification:** Build passes, iteration works correctly
- **Committed in:** 2f206dc

---

**Total deviations:** 2 auto-fixed (2 bugs)
**Impact on plan:** Both auto-fixes necessary for build success. No scope creep.

## Issues Encountered

None - after bug fixes, all routes compiled and build succeeded.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All import APIs ready for frontend integration
- AI results API enables review sheet to load extractions
- Pending API provides dashboard data for "AI Analysis Needed" indicator
- Ready for Plan 04: Review Sheet UI

---
*Phase: 25-ai-document-intelligence*
*Completed: 2026-01-24*
