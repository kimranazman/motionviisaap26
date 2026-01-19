# Codebase Concerns

**Analysis Date:** 2026-01-20

## Tech Debt

**No Authentication/Authorization:**
- Issue: All API endpoints are unprotected; anyone can CRUD initiatives, comments, events
- Files: `src/app/api/initiatives/route.ts`, `src/app/api/initiatives/[id]/route.ts`, `src/app/api/initiatives/[id]/comments/route.ts`, `src/app/api/events-to-attend/route.ts`
- Impact: Data can be read, modified, or deleted by anyone with network access
- Fix approach: Add NextAuth.js or Clerk for authentication; add middleware at `src/middleware.ts` to protect API routes

**No Input Validation on API Routes:**
- Issue: Request body is used directly without validation (Zod, joi, etc.)
- Files: `src/app/api/initiatives/route.ts` lines 60-86, `src/app/api/initiatives/[id]/route.ts` lines 47-64, `src/app/api/initiatives/[id]/comments/route.ts` lines 31-58
- Impact: Invalid data can corrupt database; potential injection if Prisma doesn't sanitize all inputs
- Fix approach: Add Zod schemas for all request bodies; validate before database operations

**Hardcoded Team Members and Enums:**
- Issue: Team members (KHAIRUL, AZLAN, IZYANI), departments, objectives are hardcoded in Prisma enums and UI
- Files: `prisma/schema.prisma` lines 35-39 (TeamMember enum), `src/lib/utils.ts` lines 119-128, 171-175
- Impact: Adding/removing team members requires code changes, Prisma migration, and redeployment
- Fix approach: Move team members to database table with admin UI for management

**No Optimistic Updates Rollback:**
- Issue: Kanban board updates local state optimistically but doesn't rollback on API failure
- Files: `src/components/kanban/kanban-board.tsx` lines 309-316, 371-380
- Impact: UI shows successful change but server state differs; requires page refresh to see truth
- Fix approach: Store previous state before optimistic update; restore on API failure; show error toast

**Console Statements in Production Code:**
- Issue: 20+ console.error statements throughout API routes and components
- Files: `src/app/api/initiatives/route.ts`, `src/app/api/initiatives/[id]/route.ts`, `src/app/api/events-to-attend/route.ts`, `src/components/kanban/kanban-board.tsx`, `src/components/kanban/initiative-detail-sheet.tsx`
- Impact: Logs leak to browser console in production; no structured logging for debugging
- Fix approach: Replace with proper logging library (pino, winston); configure log levels by environment

**Missing Error Boundaries:**
- Issue: No React Error Boundaries to catch component errors gracefully
- Files: All components in `src/components/`
- Impact: Single component error crashes entire page; poor user experience
- Fix approach: Add error.tsx files to route groups; wrap critical components in ErrorBoundary

## Known Bugs

**Dead Links in Initiative List:**
- Symptoms: "View" and "Edit" buttons link to non-existent routes
- Files: `src/components/initiatives/initiatives-list.tsx` lines 209, 214-215
- Trigger: Click Eye or Pencil icons in initiatives table
- Workaround: None; these pages don't exist (`/initiatives/[id]`, `/initiatives/[id]/edit`)

**Stale Data After Initiative Create:**
- Symptoms: After creating initiative in dialog, list refetches but Kanban board doesn't update
- Files: `src/components/initiatives/initiatives-list.tsx` lines 82-88
- Trigger: Create new initiative from initiatives list page
- Workaround: Navigate away and back to see new initiative

## Security Considerations

**No CSRF Protection:**
- Risk: Cross-site request forgery attacks possible on all mutating endpoints
- Files: All API routes under `src/app/api/`
- Current mitigation: None
- Recommendations: Add CSRF tokens; use SameSite cookies; consider using NextAuth.js which handles this

**No Rate Limiting:**
- Risk: API endpoints vulnerable to brute force, DoS attacks
- Files: All API routes under `src/app/api/`
- Current mitigation: None
- Recommendations: Add rate limiting middleware; use Upstash Redis or similar for distributed rate limiting

**Database URL in Environment:**
- Risk: Database credentials exposed if .env file is leaked
- Files: `.env`, `prisma/schema.prisma` line 10
- Current mitigation: .env in .gitignore
- Recommendations: Ensure .env never committed; use secrets manager for production; rotate credentials regularly

**No Input Sanitization for Search:**
- Risk: SQL injection if Prisma's contains doesn't properly escape (unlikely but unverified)
- Files: `src/app/api/initiatives/route.ts` lines 33-39
- Current mitigation: Prisma's built-in parameterization
- Recommendations: Add explicit input sanitization; limit search term length

## Performance Bottlenecks

**No Pagination on List Endpoints:**
- Problem: All initiatives fetched at once; will slow as data grows
- Files: `src/app/api/initiatives/route.ts` line 42-45, `src/app/(dashboard)/kanban/page.tsx` lines 8-22
- Cause: `findMany()` without take/skip; all data loaded into client state
- Improvement path: Add cursor or offset pagination; implement virtual scrolling on client

**No Database Indexes for Text Search:**
- Problem: Search uses `contains` which does full table scan
- Files: `src/app/api/initiatives/route.ts` lines 33-39
- Cause: No full-text index on title, monthlyObjective, weeklyTasks, remarks
- Improvement path: Add MySQL full-text index; use MATCH AGAINST instead of LIKE

**Large Component Files:**
- Problem: Kanban board is 495 lines; difficult to maintain and test
- Files: `src/components/kanban/kanban-board.tsx` (495 lines), `src/components/kanban/initiative-detail-sheet.tsx` (425 lines), `src/components/initiatives/initiative-form.tsx` (392 lines)
- Cause: All logic in single files without extraction
- Improvement path: Extract custom hooks (useDragAndDrop, useInitiativeFilters); split into smaller components

**No Data Caching:**
- Problem: Every page load fetches fresh data from database
- Files: All page.tsx files use direct Prisma queries
- Cause: `force-dynamic` export prevents caching
- Improvement path: Use React Query or SWR for client caching; implement Next.js ISR where appropriate

## Fragile Areas

**Kanban Drag-and-Drop State Management:**
- Files: `src/components/kanban/kanban-board.tsx` lines 281-396
- Why fragile: Complex state coordination between local state, optimistic updates, and server persistence; status mapping between 6 statuses and 4 columns
- Safe modification: Add comprehensive tests before changing; log state transitions during development
- Test coverage: None

**Status/Column Mapping:**
- Files: `src/components/kanban/kanban-board.tsx` lines 125-171
- Why fragile: Multiple statuses map to single columns (ON_HOLD + AT_RISK -> NEEDS_ATTENTION); bidirectional mappings must stay in sync
- Safe modification: Update COLUMNS, COLUMN_TO_STATUS, and STATUS_TO_COLUMN together; add runtime validation
- Test coverage: None

**Date Filter Logic:**
- Files: `src/components/kanban/kanban-board.tsx` lines 32-106
- Why fragile: Many date calculation functions for week/month/quarter boundaries; timezone handling implicit
- Safe modification: Extract to utility file; add unit tests for edge cases (year boundaries, DST)
- Test coverage: None

## Scaling Limits

**In-Memory State for Large Initiative Lists:**
- Current capacity: Reasonable performance up to ~500 initiatives
- Limit: Browser performance degrades with 1000+ items in React state
- Scaling path: Implement server-side filtering; add virtual scrolling; paginate API results

**Single Database Connection:**
- Current capacity: Development/small production workloads
- Limit: Connection pooling not configured; concurrent requests may fail
- Scaling path: Configure Prisma connection pool; use PgBouncer or equivalent for MySQL

## Dependencies at Risk

**xlsx Package (0.18.5):**
- Risk: Unmaintained since 2023; known vulnerabilities in older versions
- Impact: Excel import functionality for seeding
- Migration plan: Move to exceljs or use server-side parsing only; never accept untrusted Excel files

**@dnd-kit/sortable (10.0.0):**
- Risk: Major version upgrade from @dnd-kit/core (6.3.1) version mismatch
- Impact: Potential compatibility issues; behavior inconsistencies
- Migration plan: Align versions; test drag-drop thoroughly after dependency updates

## Missing Critical Features

**No Audit Trail:**
- Problem: No tracking of who changed what and when
- Blocks: Compliance requirements; debugging data issues; accountability

**No Data Export:**
- Problem: Users cannot export their data (Excel, CSV, PDF)
- Blocks: Reporting requirements; data portability; stakeholder updates

**No Confirmation on Delete:**
- Problem: Delete actions execute immediately without confirmation
- Blocks: Safe user experience; accidental deletion recovery

**No Undo/Redo:**
- Problem: No way to reverse recent actions
- Blocks: User confidence in making changes; error recovery

## Test Coverage Gaps

**Zero Test Files:**
- What's not tested: Everything - no test files exist in codebase
- Files: Entire `src/` directory
- Risk: Any change could break functionality undetected; refactoring is dangerous
- Priority: High

**Critical Paths Without Tests:**
- API routes: No integration tests for CRUD operations
- Kanban drag-drop: No unit tests for state transitions
- Date filtering: No unit tests for boundary conditions
- Form validation: No tests for required fields, edge cases

---

*Concerns audit: 2026-01-20*
