# Phase 57 Research: Critical Bug Fixes

## BUG-01: Project Detail Error on Card Click

### Problem
When a user clicks a project card on `/projects`, the project detail view should open without errors.

### Root Cause Analysis

1. **Missing `/projects/[id]` page route**: `ProjectDetailSheet` has `expandHref={/projects/${project.id}}` but there is no corresponding `src/app/(dashboard)/projects/[id]/page.tsx`. Clicking the expand button navigates to a 404.

2. **Anti-pattern in `project-list.tsx` line 50**: Uses `useState(() => { ... })` to run side effects (setting `selectedProject` and `isDetailOpen`). This is a lazy initializer meant to return initial state, not run effects. The side effects inside may not trigger on re-renders or may cause unexpected behavior on React strict mode.

### Files Affected
- `src/app/(dashboard)/projects/[id]/page.tsx` — MISSING (must create)
- `src/components/projects/project-list.tsx` — line 50, `useState` anti-pattern

### Fix Strategy
1. Create a `/projects/[id]` page that loads full project data and renders a full-page project detail
2. Fix the `useState` anti-pattern: convert to `useEffect` for opening project from URL param

---

## BUG-02: Unscrollable Modals

### Problem
Modals with content taller than the viewport do not scroll, making bottom content unreachable.

### Root Cause Analysis

The `DialogContent` in `dialog.tsx` uses:
- `grid` layout (`"fixed z-50 grid w-full gap-4"`)
- `overflow-y-auto` on the container
- Desktop: `md:max-h-[85vh]`
- Mobile: `h-[calc(100vh-2rem)]`

The `detail-view.tsx` dialog mode wraps children in `ScrollArea` with `flex-1 min-h-0`, but `DialogContent` uses **grid** layout (not flex-col). The `p-0 flex flex-col` override in `detail-view.tsx` conflicts with the base `grid` + `p-6` from `dialog.tsx`.

Additionally, the `overflow-y-auto` on the dialog content container and the `ScrollArea` inside create competing scroll contexts.

### Files Affected
- `src/components/ui/dialog.tsx` — DialogContent base classes
- `src/components/ui/detail-view.tsx` — Dialog mode scroll setup

### Fix Strategy
1. Change `DialogContent` base from `grid` to `flex flex-col` layout so child flex items work correctly
2. Ensure `ScrollArea` viewport gets a bounded height by proper flex containment
3. Remove the redundant `overflow-y-auto` from the container when `ScrollArea` handles scrolling (or keep it as fallback for non-ScrollArea dialogs)

---

## BUG-03: Sidebar Not Scrolling

### Problem
Desktop sidebar navigation doesn't scroll when menu items exceed viewport height. This is especially apparent on smaller screens (e.g., 768-900px height).

### Root Cause Analysis

Desktop sidebar (`sidebar.tsx`):
- `<aside>` has `md:fixed md:inset-y-0` (full viewport height)
- `<nav>` has `flex flex-col gap-1 p-4` but **no overflow/scroll classes**
- When all nav groups are expanded (SAAP: 8 items, CRM: 6 items, Admin: 1 item, Tasks, Members, Settings), total items exceed viewport on smaller screens

Mobile sidebar (`mobile-sidebar.tsx`):
- Already has `overflow-y-auto max-h-[calc(100vh-80px)]` on nav — CORRECT

### Files Affected
- `src/components/layout/sidebar.tsx` — nav element needs scroll

### Fix Strategy
1. Make the sidebar a flex column with the logo as a shrink-0 header
2. Make the nav element `flex-1 overflow-y-auto` so it scrolls when content exceeds available space

---

## Shared Context

### Component Architecture
- `DetailView` component (`detail-view.tsx`) wraps both dialog and sheet modes
- Uses `useDetailViewMode()` hook to determine rendering mode
- Sheet mode already uses `ScrollArea` with `flex-1 mt-4`
- Dialog mode uses `ScrollArea` with `flex-1 min-h-0`

### Navigation Architecture
- Desktop sidebar: fixed position, full viewport height
- Mobile sidebar: Sheet (slide-from-left), already scrollable
- Mobile bottom nav: Fixed position, 4 key items only
- Nav groups are collapsible via `NavGroupComponent`

## RESEARCH COMPLETE
