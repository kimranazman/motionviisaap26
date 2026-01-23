---
phase: 24
plan: 01
subsystem: dashboard
tags: [react-grid-layout, sonner, user-preferences, layout-utils]

dependency_graph:
  requires:
    - "Phase 21: Document infrastructure (UserPreferences model)"
    - "Phase 23: Widget registry and role permissions"
  provides:
    - "react-grid-layout and sonner dependencies"
    - "User preferences API for layout persistence"
    - "Layout manipulation utilities"
    - "Sonner Toaster provider in root layout"
  affects:
    - "24-02: Dashboard grid component will use layout-utils"
    - "24-03: Widget bank will use addWidgetToLayout"
    - "24-04: Date filter will use user preferences API"

tech_stack:
  added:
    - react-grid-layout: "^2.2.2"
    - sonner: "^2.0.7"
  patterns:
    - "Layout utility functions for grid operations"
    - "User preferences API with upsert pattern"
    - "LayoutWidgetConfig for instance-based widget tracking"

key_files:
  created:
    - src/app/api/user/preferences/route.ts
    - src/lib/widgets/layout-utils.ts
  modified:
    - package.json
    - src/app/layout.tsx
    - src/types/dashboard.ts

decisions:
  - id: "24-01-01"
    summary: "Use react-grid-layout v2 with LayoutItem type"
    reason: "v2 has built-in TypeScript with Layout as readonly LayoutItem[]"
  - id: "24-01-02"
    summary: "Sonner Toaster at root layout level"
    reason: "Global availability for undo notifications across dashboard"
  - id: "24-01-03"
    summary: "LayoutWidgetConfig extends WidgetConfig with instance ID"
    reason: "Allows duplicate widgets (same type, different ID) for comparison views"

metrics:
  duration: "4 min"
  completed: "2026-01-23"
---

# Phase 24 Plan 01: User Preferences Infrastructure Summary

**One-liner:** Install react-grid-layout/sonner, create user preferences API and layout utilities for dashboard customization.

## What Was Built

### Dependencies Installed
- **react-grid-layout ^2.2.2**: Dashboard grid with drag-drop and resize support
- **sonner ^2.0.7**: Toast notifications with undo actions for auto-save feedback

### API Endpoint
- **GET /api/user/preferences**: Returns user's dashboardLayout and dateFilter (or null for new users)
- **PATCH /api/user/preferences**: Upserts user preferences with partial updates

### Layout Utilities
Five functions for grid manipulation:
1. `generateLayoutId()` - Unique instance IDs using crypto.randomUUID()
2. `addWidgetToLayout()` - Add widget at bottom of grid
3. `removeWidgetFromLayout()` - Remove by instance ID
4. `convertToGridLayout()` - Convert to react-grid-layout format
5. `convertFromGridLayout()` - Merge position updates back

### Type Extensions
- `LayoutWidgetConfig` interface extending `WidgetConfig` with `i` (instance ID) field

## Key Technical Decisions

### 1. react-grid-layout v2 Types
Used `Layout` (readonly LayoutItem[]) and `LayoutItem` types directly from react-grid-layout v2, which includes built-in TypeScript definitions.

### 2. Instance ID Pattern
The `i` field in `LayoutWidgetConfig` enables duplicate widgets on the same dashboard (e.g., two revenue widgets showing different time periods).

### 3. Upsert for Preferences
User preferences API uses Prisma upsert to handle both new and existing users seamlessly.

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

```
npm list react-grid-layout sonner
saap2026v2@0.1.0
├── react-grid-layout@2.2.2
└── sonner@2.0.7

npx tsc --noEmit
(no errors)
```

## Commits

| Hash | Type | Description |
|------|------|-------------|
| 52fd65a | feat | Install react-grid-layout and sonner with toaster setup |
| fc2e0bb | feat | Create user preferences API for dashboard customization |
| 5af9415 | feat | Create layout utility functions for dashboard grid |

## Next Phase Readiness

Ready for Plan 24-02 (Dashboard Grid Component):
- react-grid-layout installed and typed
- Layout utilities available for grid operations
- User preferences API ready for persistence
- Sonner toaster available for undo notifications

## Files Changed

```
package.json                              (modified - dependencies)
package-lock.json                         (modified - lockfile)
src/app/layout.tsx                        (modified - Toaster added)
src/app/api/user/preferences/route.ts     (created - API)
src/lib/widgets/layout-utils.ts           (created - utilities)
src/types/dashboard.ts                    (modified - LayoutWidgetConfig)
```
