---
phase: 02-header-features
plan: 01
subsystem: search
tags: [search, api, debounce, popover, header]

dependency-graph:
  requires:
    - 01-navigation-detail-page (detail page for search result links)
  provides:
    - Global search API at /api/initiatives/search
    - useDebounce hook for input debouncing
    - HeaderSearch component with popover results
  affects:
    - 02-02 notifications (parallel header feature)

tech-stack:
  added: []
  patterns:
    - Debounced search with useEffect cleanup
    - Controlled Popover with focus management
    - API route with Prisma OR queries

key-files:
  created:
    - src/app/api/initiatives/search/route.ts
    - src/lib/hooks/use-debounce.ts
    - src/components/layout/header-search.tsx
  modified:
    - src/components/layout/header.tsx (updated by 02-02)

decisions:
  - id: search-limit
    choice: Limit to 10 results
    reason: Keeps dropdown manageable, matches common UX patterns
  - id: search-fields
    choice: Search title, monthlyObjective, weeklyTasks, remarks, personInCharge
    reason: Comprehensive text search across all user-visible fields
  - id: person-search
    choice: Match enum values to formatted names (e.g., "khai" matches KHAIRUL)
    reason: Users search by name, not enum value

metrics:
  duration: 3min
  completed: 2026-01-20
---

# Phase 2 Plan 1: Header Search Summary

Debounced search input in header with popover dropdown showing matching initiatives.

## What Was Built

### Search API (`/api/initiatives/search`)
- Accepts `q` query parameter for text search
- Searches across: title, monthlyObjective, weeklyTasks, remarks
- Also searches personInCharge (matches formatted names like "Khairul")
- Returns max 10 results with id, title, status, personInCharge
- Empty query returns empty array (not error)

### useDebounce Hook
- Generic hook: `useDebounce<T>(value: T, delay: number): T`
- Uses setTimeout/clearTimeout pattern with cleanup
- Default delay configurable (used 300ms for search)

### HeaderSearch Component
- Controlled input with debounced value
- Popover opens when results exist or query typed
- Results display: title, owner name, status badge
- Each result links to /initiatives/[id]
- Empty state shows "No results for {query}"
- Loading state shows "Searching..."
- Escape key closes popover
- Click on result closes popover and navigates
- `onOpenAutoFocus={(e) => e.preventDefault()}` prevents focus steal

## Commits

| Hash | Type | Description |
|------|------|-------------|
| efc75e1 | feat | Add search API and debounce hook |
| 902cdf9 | feat | Add HeaderSearch component with popover results |

## Deviations from Plan

### Integration Timing

The header.tsx update to use HeaderSearch was committed as part of plan 02-02 (notification bell) work that ran in parallel. The 02-02 commit (56db6d9) included both NotificationBell and HeaderSearch integration into header.tsx.

This is documented as an execution order deviation but does not affect functionality - all required artifacts are in place and working.

## Verification Results

1. **Search API tested:**
   - `curl "/api/initiatives/search?q=client"` returns matching initiatives
   - `curl "/api/initiatives/search?q="` returns empty array `[]`
   - `curl "/api/initiatives/search?q=zzzzz"` returns empty array `[]`

2. **Component integration:** HeaderSearch renders in header
3. **Navigation:** Result links point to /initiatives/[id]
4. **Debouncing:** 300ms delay prevents excessive API calls

## Success Criteria Status

- [x] User can type in header search and see matching initiatives
- [x] Results show title, status badge, and owner
- [x] Clicking result navigates to detail page
- [x] Empty search returns no results (not error)
- [x] Search is debounced (300ms delay)
- [x] Requirement SRCH-01 satisfied

## Next Phase Readiness

Ready for plan 02-02 (notification bell) - though commits show it was executed in parallel.

---

*Executed: 2026-01-20 | Duration: 3min*
