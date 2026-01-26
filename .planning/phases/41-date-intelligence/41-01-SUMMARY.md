---
phase: 41-date-intelligence
plan: 01
subsystem: objectives-ui
tags: [date-intelligence, badges, overlap-detection, timeline-suggestions]
dependency-graph:
  requires: [38-initiative-views, 39-objectives-view]
  provides: [date-badges-on-initiative-rows, owner-overlap-detection, timeline-suggestions-util]
  affects: [41-02-detail-sheet-timeline-panel]
tech-stack:
  added: []
  patterns: [computed-overlap-map-via-useMemo, flag-config-driven-badge-rendering]
key-files:
  created:
    - src/components/objectives/date-badges.tsx
  modified:
    - src/lib/initiative-date-utils.ts
    - src/components/objectives/objective-hierarchy.tsx
    - src/components/objectives/objective-group.tsx
    - src/components/objectives/key-result-group.tsx
    - src/components/objectives/initiative-row.tsx
decisions:
  - id: DATE-BADGES-INLINE
    decision: "DateBadges render inline between title and KPI bar (not in metadata row)"
    rationale: "Badges are contextual to the initiative timeline, visually distinct from metadata"
  - id: OVERLAP-USEMEMO
    decision: "Overlap map computed once via useMemo at ObjectiveHierarchy level"
    rationale: "Single computation avoids redundant per-row overlap detection"
  - id: NO-TOOLTIPS
    decision: "Badges use text labels only, no Tooltip wrappers"
    rationale: "Badge text is already descriptive; tooltips add TooltipProvider complexity"
metrics:
  duration: 6min
  completed: 2026-01-26
---

# Phase 41 Plan 01: Date Intelligence Badges Summary

**One-liner:** Color-coded date intelligence badges on initiative rows with owner overlap detection computed once via useMemo

## What Was Built

Extended the initiative date utility with three new capabilities and created a DateBadges component that renders inline color-coded badges on every initiative row in the By Objective hierarchy view.

### Task 1: Extended date utility (27f3279)

Added to `src/lib/initiative-date-utils.ts`:

- **daysOverdue field** on DateIntelligence interface -- returns positive number when overdue, null otherwise
- **detectOwnerOverlap()** -- accepts array of initiatives, groups by personInCharge, counts concurrent active initiatives per owner using date range overlap detection. Returns `Map<string, number>` (initiative ID to concurrent count)
- **generateTimelineSuggestions()** -- produces human-readable suggestion strings based on flags, duration, and overlap count
- **InitiativeForOverlap** interface for type-safe input to overlap detection

### Task 2: DateBadges component and hierarchy integration (6358610)

Created `src/components/objectives/date-badges.tsx`:
- Calls `analyzeDates()` to get flags and intelligence data
- Uses FLAG_CONFIG record mapping each DateFlag to color class, icon, and dynamic label
- Renders red "Xd overdue", orange "Ends in Xd", yellow "Late start", red "Invalid dates", gray "Xd span" badges
- Adds orange "Workload: X concurrent" badge when overlap count > 3
- Returns null when no badges to show (zero DOM overhead)

Integrated through component tree:
- `ObjectiveHierarchy` computes `overlapMap` via `useMemo(detectOwnerOverlap(initialData))`
- `ObjectiveGroup` passes `overlapMap` through
- `KeyResultGroup` resolves `overlapCount` per initiative from map
- `InitiativeRow` renders `<DateBadges>` between title and KPI progress bar

## Deviations from Plan

None -- plan executed exactly as written.

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| DateBadges placed between title and KPI bar | Contextual to timeline, visually distinct from metadata row |
| Overlap map computed once at hierarchy root | Avoids N redundant per-row overlap computations |
| No Tooltip wrappers on badges | Badge text is already descriptive enough; avoids TooltipProvider requirement |
| forEach instead of for-of on Map values | TypeScript target compatibility (avoids --downlevelIteration requirement) |

## Verification

- [x] `npx tsc --noEmit` -- zero type errors
- [x] `npm run build` -- build succeeds
- [x] Exports verified: analyzeDates, detectOwnerOverlap, generateTimelineSuggestions, DateIntelligence, DateFlag, InitiativeForOverlap

## Requirements Coverage

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| DATE-01: Overdue badge | Done | Red badge with "Xd overdue" text |
| DATE-02: Ending-soon badge | Done | Orange badge with "Ends in Xd" (14-day window) |
| DATE-03: Late-start badge | Done | Yellow "Late start" for NOT_STARTED past start date |
| DATE-04: Invalid dates badge | Done | Red "Invalid dates" for end < start |
| DATE-05: Long duration badge | Done | Gray "Xd span" for >180 days |
| DATE-06: Owner overlap badge | Done | Orange "Workload: X concurrent" for >3 |
| DATE-07: Badges in hierarchy | Done | Inline per initiative row in By Objective view |
| DATE-08: Timeline suggestions | Utility only | generateTimelineSuggestions() ready for detail sheet (Plan 02) |
