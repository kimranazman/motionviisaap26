---
phase: 40-kpi-tracking-linked-projects
plan: 02
subsystem: objectives-linked-projects
tags: [linked-projects, initiative, detail-sheet, navigation, prisma-serialization]
completed: 2026-01-26
duration: 4min
dependency-graph:
  requires: [40-01]
  provides: [linked-projects-section, project-count-badge, serialized-project-api]
  affects: [42-01]
tech-stack:
  added: []
  patterns: [LinkedProjectsSection, project-count-badge, decimal-serialization]
key-files:
  created:
    - src/components/objectives/linked-projects-section.tsx
  modified:
    - src/components/objectives/initiative-row.tsx
    - src/components/kanban/initiative-detail-sheet.tsx
    - src/app/api/initiatives/[id]/route.ts
decisions:
  - id: PROJ-BADGE-HIDE
    decision: "Hide project count badge entirely when initiative has no linked projects (no '0' shown)"
    context: "Keeps initiative row clean and dense; badge only appears when informational"
  - id: PROJ-NAV-LINK
    decision: "Linked projects use Next.js Link for client-side navigation; dialog unmounts naturally on navigation"
    context: "No special dialog close handler needed -- navigation away from /objectives page unmounts the dialog"
metrics:
  tasks: 2/2
  commits: 2
---

# Phase 40 Plan 02: Linked Projects Inline Display Summary

**One-liner:** Project count badge on initiative rows with LinkedProjectsSection in detail sheet showing title, status, revenue, costs, client, dates, and click-through navigation to /projects/[id].

## What Was Built

### Task 1: LinkedProjectsSection Component and Project Count Badge
- Created `linked-projects-section.tsx` with exported `LinkedProject` interface and `LinkedProjectsSection` component
- Each project rendered as a clickable `<Link>` to `/projects/[id]` with hover state and ExternalLink icon appearing on hover
- Left side: project title + client name; Right side: status badge (using getProjectStatusColor/formatProjectStatus), revenue, costs
- Date range shown below using formatDate utility
- Empty state: centered FolderOpen icon with "No linked projects" text
- Section header with FolderOpen icon, "Linked Projects" title, and count badge
- Added blue project count badge to initiative-row.tsx metadata row (FolderOpen icon + "N projects")
- Badge hidden entirely when initiative has no linked projects

### Task 2: Detail Sheet Integration and API Serialization
- Extended GET `/api/initiatives/[id]` to include `projects` relation with `costs`, `company`, `revenue`, `startDate`, `endDate`
- Added serialization step: Decimal fields (kpiTarget, kpiActual, revenue, cost amounts) converted to Number
- Aggregated per-project costs into `totalCosts` field in serialized response
- Added `projects` state to InitiativeDetailSheet, populated from fetched API data
- Rendered LinkedProjectsSection between KPI Tracking section and Comments section with Separator

## Decisions Made

| ID | Decision | Rationale |
|----|----------|-----------|
| PROJ-BADGE-HIDE | Hide badge entirely for 0 projects | Clean row density; badge is informational only |
| PROJ-NAV-LINK | Use Next.js Link without dialog close handler | Navigation away unmounts dialog naturally |

## Deviations from Plan

None -- plan executed exactly as written.

## Commits

| Hash | Type | Description |
|------|------|-------------|
| 0b05445 | feat | LinkedProjectsSection component and project count badge on initiative row |
| 5aa3e00 | feat | Integrate linked projects into detail sheet with serialized API response |

## Verification

- `npx tsc --noEmit` -- passes with zero errors
- `npm run build` -- production build succeeds
- All success criteria met:
  - PROJ-01: Each initiative detail sheet shows linked projects with title, status badge, revenue, costs
  - PROJ-02: Clicking a linked project navigates to /projects/[id]
  - PROJ-03: Initiative row shows project count badge (e.g., "3 projects")
  - PROJ-04: Initiatives with no linked projects show appropriate empty state (no badge on row, "No linked projects" in sheet)

## Next Phase Readiness

Phase 40 complete. All KPI tracking and linked projects features are implemented. Phase 41 (Export) can proceed.
