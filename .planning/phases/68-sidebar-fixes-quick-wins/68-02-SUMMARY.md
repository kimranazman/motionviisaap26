# Plan 68-02 Summary: Revenue Fix & Task CRUD Verification

## What Changed

### 1. `src/app/(dashboard)/page.tsx` -- `getCRMDashboardData()`
- **Replaced** `prisma.project.aggregate({ where: { status: 'COMPLETED' }, _sum: { revenue: true } })` with `prisma.project.findMany({ where: { status: { in: ['ACTIVE', 'COMPLETED'] } }, select: { revenue: true, potentialRevenue: true } })`
- **Added** per-project coalesce: `Number(p.revenue) || Number(p.potentialRevenue) || 0`
- Each project contributes exactly one value (actual revenue preferred, falls back to potentialRevenue)
- Profit calculation (`totalRevenue - totalCosts`) automatically uses corrected revenue

### 2. Task CRUD on Completed Projects -- Verification Only
- Checked task API routes (`src/app/api/projects/[id]/tasks/`) -- no status-based guards found
- Checked task UI components (`task-tree.tsx`, `task-form.tsx`, `task-detail-sheet.tsx`) -- no status-based disabling
- Checked tasks page client (`tasks-page-client.tsx`) -- no filtering that excludes completed projects
- Grep for `COMPLETED` in all API project routes returned zero matches
- **Conclusion:** No code changes needed. Task CRUD on completed projects works without any blocking code.

## Verification

- `npx tsc --noEmit` passes with zero errors
- `npm run build` succeeds
- Revenue query uses `findMany` with `{ status: { in: ['ACTIVE', 'COMPLETED'] } }`
- Per-project coalesce: `Number(p.revenue) || Number(p.potentialRevenue) || 0`
- No status-based task guards found in API routes or UI components

## Requirements Met

- REV-01: Dashboard CRM Revenue KPI uses per-project `revenue ?? potentialRevenue` fallback
- REV-02: Revenue calculation includes ACTIVE and COMPLETED projects
- REV-03: Projects with both revenue and potentialRevenue count actual revenue only (no double-counting)
- REV-04: Profit calculation updates consistently with new revenue logic
- TASK-01: User can create tasks on COMPLETED projects (verified, no code blocking)
- TASK-02: User can create subtasks on tasks belonging to completed projects (verified)
- TASK-03: User can edit existing tasks on completed projects (verified)
