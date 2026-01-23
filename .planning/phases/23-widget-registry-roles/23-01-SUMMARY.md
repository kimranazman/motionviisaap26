---
phase: 23-widget-registry-roles
plan: 01
subsystem: dashboard
tags: [typescript, registry-pattern, role-based-access, widgets]

# Dependency graph
requires:
  - phase: 21-infrastructure-schema
    provides: AdminDefaults model with widgetRoles JSON field
  - phase: 05-role-infrastructure
    provides: UserRole enum (VIEWER, EDITOR, ADMIN)
provides:
  - WidgetDefinition interface for typed widget metadata
  - AdminDashboardSettings interface for admin defaults
  - WIDGET_REGISTRY with 7 dashboard widgets defined
  - WIDGET_IDS array for widget enumeration
affects: [23-02 (permissions), 23-03 (admin endpoints), 24-dashboard-customization]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Registry pattern for widget definitions"
    - "UserRole enum usage (not string literals) for type safety"

key-files:
  created:
    - src/lib/widgets/registry.ts
  modified:
    - src/types/dashboard.ts

key-decisions:
  - "CRM widgets require EDITOR role (revenue-sensitive data)"
  - "KRI widgets require VIEWER role (general access)"
  - "Widget registry uses Record<string, WidgetDefinition> for typed lookup"

patterns-established:
  - "Widget IDs as string literals: 'kpi-cards', 'status-chart', etc."
  - "Widget categories: 'kri', 'crm', 'financials'"
  - "minRole uses UserRole enum values for type safety"

# Metrics
duration: 3min
completed: 2026-01-23
---

# Phase 23 Plan 01: Widget Registry Foundation Summary

**TypeScript widget registry with 7 dashboard widgets, role-based minRole requirements, and centralized metadata definitions**

## Performance

- **Duration:** 3 min
- **Started:** 2026-01-23T12:25:16Z
- **Completed:** 2026-01-23T12:27:45Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Extended dashboard types with WidgetDefinition and AdminDashboardSettings interfaces
- Created widget registry with all 7 existing dashboard widgets fully defined
- Established role-based access control foundation (5 KRI widgets = VIEWER, 2 CRM widgets = EDITOR)
- Used UserRole enum values (not strings) for type-safe role checking

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend Dashboard Types** - `a68486c` (feat)
2. **Task 2: Create Widget Registry** - `2a8b2df` (feat)

## Files Created/Modified

- `src/types/dashboard.ts` - Added WidgetDefinition and AdminDashboardSettings interfaces with UserRole import
- `src/lib/widgets/registry.ts` - Widget registry with WIDGET_REGISTRY and WIDGET_IDS exports

## Decisions Made

- **CRM widgets require EDITOR role:** Revenue and profit data (crm-kpi-cards) and pipeline values (pipeline-stage-chart) are business-sensitive, restricted to Editor+
- **KRI widgets require VIEWER role:** General initiative tracking accessible to all authenticated users
- **Used UserRole enum:** `UserRole.VIEWER` and `UserRole.EDITOR` instead of string literals for compile-time type safety

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Widget registry foundation complete with all metadata defined
- Ready for 23-02: Permission utilities (canViewWidget, filterWidgetsByRole, hasMinimumRole)
- Registry exports available for import: WIDGET_REGISTRY, WIDGET_IDS, WidgetDefinition

---
*Phase: 23-widget-registry-roles*
*Completed: 2026-01-23*
