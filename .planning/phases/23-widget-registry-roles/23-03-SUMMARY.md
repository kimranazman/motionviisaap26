---
phase: 23-widget-registry-roles
plan: 03
subsystem: api, ui
tags: [next-api, role-based-access, dashboard, widgets, admin]

# Dependency graph
requires:
  - phase: 23-02
    provides: Widget registry, permission utilities, AdminDefaults management
provides:
  - Admin API for managing default dashboard layout
  - Admin API for managing widget role restrictions
  - Server-side widget filtering on dashboard page
  - CRM data conditional fetching based on role
affects: [24-dashboard-customization, admin-ui]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Admin-only API routes with requireAdmin middleware
    - Server-side widget filtering using filterWidgetsByRole
    - Conditional data fetching based on widget visibility

key-files:
  created:
    - src/app/api/admin/dashboard/layout/route.ts
    - src/app/api/admin/dashboard/roles/route.ts
  modified:
    - src/app/(dashboard)/page.tsx

key-decisions:
  - "Admin APIs use requireAdmin middleware for consistent access control"
  - "Widget ID validation against WIDGET_REGISTRY on both PUT endpoints"
  - "Cache revalidation with revalidatePath('/') on layout/role updates"
  - "CRM data only fetched if at least one CRM widget is visible to user"

patterns-established:
  - "Admin API routes: check requireAdmin first, validate against registry, revalidate cache"
  - "Dashboard filtering: get session, filter widgets, conditionally fetch data, conditionally render"

# Metrics
duration: 4min
completed: 2026-01-23
---

# Phase 23 Plan 03: Admin Endpoints & Dashboard Filtering Summary

**Admin API routes for default layout/role management and server-side widget filtering on dashboard page**

## Performance

- **Duration:** 4 min
- **Started:** 2026-01-23T12:34:00Z
- **Completed:** 2026-01-23T12:38:00Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- Admin API for getting/updating default dashboard layout
- Admin API for getting/updating widget role restrictions
- Dashboard page filters widgets server-side based on user role
- CRM data only fetched when CRM widgets are visible (performance optimization)
- VIEWER users see only 5 KRI widgets, EDITOR+ see all 7 widgets

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Admin Dashboard Layout API** - `74bedce` (feat)
2. **Task 2: Create Admin Widget Roles API** - `98e03f1` (feat)
3. **Task 3: Update Dashboard Page with Server-Side Filtering** - `a21eb0f` (feat)

## Files Created/Modified
- `src/app/api/admin/dashboard/layout/route.ts` - Admin API for default layout (GET/PUT)
- `src/app/api/admin/dashboard/roles/route.ts` - Admin API for role restrictions (GET/PUT)
- `src/app/(dashboard)/page.tsx` - Added server-side widget filtering and conditional data fetching

## Decisions Made
- Used requireAdmin middleware for consistent admin-only access control
- Validate all widget IDs against WIDGET_REGISTRY before updating (return 400 for invalid IDs)
- Use revalidatePath('/') to invalidate dashboard cache when layout/roles change
- Redirect to /login if no session on dashboard page
- Only fetch CRM data if crm-kpi-cards OR pipeline-stage-chart is visible (avoids unnecessary DB queries for VIEWER)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Widget registry, permissions, and admin APIs all complete
- Dashboard enforces role-based widget visibility server-side
- Ready for Phase 24 (Dashboard Customization UI) if that follows
- Admin endpoints ready for admin UI consumption

---
*Phase: 23-widget-registry-roles*
*Completed: 2026-01-23*
