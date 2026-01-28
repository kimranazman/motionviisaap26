# Phase 58 Research: Dashboard & Kanban UX Fixes

## BUG-04: Dashboard Layout Breakpoint Persistence

### Current Implementation
- `dashboard-grid.tsx` uses `react-grid-layout/legacy` with `Responsive` + `WidthProvider`
- Passes the **same** `gridLayout` array to ALL breakpoints (lg, md, sm, xs, xxs):
  ```tsx
  layouts={{ lg: gridLayout, md: gridLayout, sm: gridLayout, xs: gridLayout, xxs: gridLayout }}
  ```
- `onLayoutChange` receives only a single `Layout` (the current breakpoint's layout), not the full `Layouts` object
- Layout saved to DB as a single `{ widgets: LayoutWidgetConfig[] }` — no breakpoint separation
- `useDashboardLayout` hook manages a single layout array

### Root Cause
react-grid-layout's `ResponsiveGridLayout` has TWO callback signatures:
1. `onLayoutChange(currentLayout: Layout)` — fires for the active breakpoint
2. `onLayoutChange(currentLayout: Layout, allLayouts: Layouts)` — full responsive callback

Currently using signature #1, which means mobile layout changes overwrite the desktop layout.

### Fix Approach
1. **DB schema**: Store `dashboardLayout` as `{ breakpoints: { lg: widgets[], sm: widgets[], ... } }` instead of `{ widgets: widgets[] }`
2. **Grid component**: Use `onLayoutChange(current, allLayouts)` and pass the full `allLayouts` to parent
3. **Client**: Track layouts per breakpoint; save per-breakpoint to preferences API
4. **Migration**: Treat existing single-array layouts as the `lg` breakpoint and auto-generate others

**Simpler alternative**: Since react-grid-layout internally manages per-breakpoint layouts when you provide initial `layouts` prop, we can:
1. Store `layouts: { lg: [], md: [], ... }` in preferences
2. Use `onLayoutChange(current, all)` to capture ALL breakpoint layouts at once
3. Save the entire `allLayouts` object
4. On load, pass stored breakpoint layouts to the `layouts` prop

## BUG-05 & BUG-06: Kanban Drag Handles

### Current Implementation
- `kanban-card.tsx` has a separate drag handle div with `GripVertical` icon
- Drag listeners (`...dragListeners`) are attached only to this handle div
- Handle has `md:opacity-0 md:group-hover:opacity-100` (hidden until hover on desktop)
- Card content area has `pl-10 md:pl-4` (left padding for handle on mobile only)
- Touch-based drag uses dnd-kit `TouchSensor` with 250ms delay

### Fix Approach
**Desktop**: Apply drag listeners to the entire card body, hide the grip handle completely
**Mobile**: Keep the existing grip handle visible for touch-hold drag

Changes to `kanban-card.tsx`:
1. On desktop (via md: classes), attach drag listeners to the card's outer div
2. Hide drag handle on desktop with `md:hidden` (not just opacity-0)
3. Keep mobile drag handle visible and functional
4. Use a wrapper approach: desktop gets full-card drag, mobile gets handle-only drag

Implementation detail: dnd-kit's `useSortable` returns `listeners` which are event handlers. We can conditionally apply them:
- On the card body: only on desktop (use CSS + JS approach)
- On the handle: only on mobile

Since we can't conditionally attach event handlers based on CSS breakpoints, the cleanest approach is:
1. Always attach drag listeners to the outer card div (the `setNodeRef` div)
2. Keep the grip handle visible on mobile only (`md:hidden`)
3. Remove left padding on desktop (`md:pl-4` → already done)
4. On mobile, touch-hold anywhere starts drag (dnd-kit TouchSensor delay handles this)

Actually, looking more carefully: dnd-kit's `useSortable` attaches listeners to the node ref. If we put `{...dragListeners}` on the outer card div instead of just the handle, clicking anywhere initiates drag on desktop. The MouseSensor already has `distance: 5` constraint, so regular clicks won't accidentally trigger drag.

## BUG-07 & BUG-08: Page Spacing

### Current Implementation
- Price Comparison: `<div className="space-y-6 p-6">` — has both spacing and padding
- Companies: `<div className="space-y-6">` — no padding
- Suppliers: `<div className="space-y-6">` — no padding
- Dashboard layout: `<main className="md:pl-64 pb-16 md:pb-0">` — no content padding

### Fix
Add `p-6` to both Companies and Suppliers page wrappers to match Price Comparison.

## Files to Modify

1. `src/components/dashboard/dashboard-grid.tsx` — breakpoint-aware layout handling
2. `src/components/dashboard/dashboard-client.tsx` — breakpoint-aware save/load
3. `src/lib/hooks/use-dashboard-layout.ts` — breakpoint-aware state management
4. `src/types/dashboard.ts` — update DashboardLayout type
5. `src/app/api/user/preferences/route.ts` — handle new layout format (backward compat)
6. `src/components/kanban/kanban-card.tsx` — drag on full card (desktop), handle (mobile)
7. `src/app/(dashboard)/companies/page.tsx` — add p-6 padding
8. `src/app/(dashboard)/suppliers/page.tsx` — add p-6 padding

## RESEARCH COMPLETE
