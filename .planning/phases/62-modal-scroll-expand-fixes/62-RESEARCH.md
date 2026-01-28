# Phase 62 Research: Modal Scroll + Expand Fixes

## Current Architecture

### DetailView Component (`src/components/ui/detail-view.tsx`)
Central wrapper for all detail modals. Supports two modes:
- **Dialog mode** (default): Radix Dialog with centered overlay modal
- **Drawer mode**: Radix Sheet sliding from right (desktop) or bottom (mobile)

Both modes use `ScrollArea` from `@/components/ui/scroll-area` to wrap `children`.

### Dialog Component (`src/components/ui/dialog.tsx`)
- `DialogContent` has `overflow-y-auto` on the outer container
- On mobile: full height minus 2rem (`h-[calc(100vh-2rem)]`), slides from bottom
- On desktop: `md:max-h-[85vh]`, centered with transforms
- Uses `flex flex-col` layout

### Sheet Component (`src/components/ui/sheet.tsx`)
- Right-side sheets: full height (`h-full`), resizable width with drag handle
- Supports resize via mouse drag, persists width in localStorage
- No explicit overflow control on the content wrapper

### ScrollArea Component (`src/components/ui/scroll-area.tsx`)
- Wraps Radix `ScrollAreaPrimitive`
- Root: `relative overflow-hidden`
- Viewport: `h-full w-full rounded-[inherit]`
- **Issue**: Viewport has `h-full` but needs an explicit height constraint from its parent to enable scrolling

## Detail Sheet Types (7 Consumers)

| # | Component | File | expandHref | Content Length |
|---|-----------|------|------------|---------------|
| 1 | ProjectDetailSheet | `src/components/projects/project-detail-sheet.tsx` | `/projects/${id}` | Very long (financials, deliverables, tasks, costs, documents) |
| 2 | DealDetailSheet | `src/components/pipeline/deal-detail-sheet.tsx` | None | Medium (form fields, converted project info, activity) |
| 3 | PotentialDetailSheet | `src/components/potential-projects/potential-detail-sheet.tsx` | None | Medium (form fields, converted info, activity) |
| 4 | CompanyDetailModal | `src/components/companies/company-detail-modal.tsx` | None | Long (fields, contacts, departments, related items) |
| 5 | SupplierDetailModal | `src/components/suppliers/supplier-detail-modal.tsx` | None | Long (fields, credit terms, financials, price list, projects) |
| 6 | TaskDetailSheet | `src/components/projects/task-detail-sheet.tsx` | None | Medium (form fields, tags, comments) |
| 7 | InitiativeDetailSheet | `src/components/kanban/initiative-detail-sheet.tsx` | `/initiatives/${id}` | Long (info grid, linked projects, comments) |

## Identified Issues

### Issue 1: ScrollArea in Dialog Mode Not Scrolling Properly
- `DetailView` wraps children in `<ScrollArea className="flex-1 min-h-0">` (Dialog mode)
- `DialogContent` has `overflow-y-auto` AND `flex flex-col` with `md:max-h-[85vh]`
- **Problem**: `DialogContent` already has `overflow-y-auto`, which conflicts with ScrollArea's own scrolling mechanism. The `overflow-y-auto` on the outer `DialogContent` means the entire content scrolls as a block, but ScrollArea's viewport needs a fixed height parent to enable its custom scrollbar.
- **Fix needed**: Remove `overflow-y-auto` from DialogContent when used with DetailView, or ensure the flex layout correctly constrains ScrollArea height.

### Issue 2: DetailView passes `p-0` to DialogContent
- `DetailView` passes `className="md:max-w-[650px] p-0 flex flex-col"` to DialogContent
- The `flex flex-col` is good, but `DialogContent` already has `flex flex-col` in its base styles (mobile)
- The `p-0` removes default padding, which is correct since children handle their own padding

### Issue 3: ScrollArea Height Constraint
- In Dialog mode: `ScrollArea` has `className="flex-1 min-h-0"` -- this is correct for flex layout
- In Drawer mode: `ScrollArea` has `className="flex-1 mt-4"` -- this works because SheetContent uses `flex flex-col` when not mobile
- **Potential issue**: On mobile drawer (`h-[85vh] rounded-t-2xl`), SheetContent doesn't add `flex flex-col`, so `flex-1` on ScrollArea won't work
- The mobile drawer class only adds `h-[85vh] rounded-t-2xl` but not `flex flex-col`

### Issue 4: Expand-to-Page Missing for Most Detail Views
- Only 2 of 7 detail views have `expandHref`:
  - ProjectDetailSheet: `/projects/${project.id}` -- BUT no `/projects/[id]/page.tsx` exists!
  - InitiativeDetailSheet: `/initiatives/${initiative.id}` -- page exists via `initiative-detail.tsx`
- **Problem**: The expand button links exist but the target pages don't exist for projects. For initiatives, the page exists.
- Other detail views (deal, potential, company, supplier, task) have NO expand button at all.

### Issue 5: Project Full Page Missing
- `expandHref={`/projects/${project.id}`}` but no `src/app/(protected)/projects/[id]/page.tsx` exists
- When user clicks expand, they get a 404 or empty page
- Need to create a dedicated project detail page

## Scroll Fix Strategy

The core scroll issue is a conflict between:
1. `DialogContent` having `overflow-y-auto` (native browser scroll)
2. `ScrollArea` inside DetailView providing custom Radix scrollbar

**Solution**:
- In `dialog.tsx`, the `overflow-y-auto` class should be removed or made conditional. When DetailView wraps content in ScrollArea, the outer container should NOT scroll.
- Add `overflow-hidden` to DialogContent base styles (replacing `overflow-y-auto`)
- This lets ScrollArea handle all scrolling with its custom scrollbar
- Ensure `max-h-[85vh]` + `flex flex-col` properly constrains the flex layout so ScrollArea knows its available height

For mobile drawer:
- Add `flex flex-col` to the mobile drawer variant in DetailView

## Expand-to-Page Strategy

For UX-02, the expand button should open a dedicated full page. Currently:
- Only initiatives has a working full-page detail view
- Projects has the expand button but no page

Options:
1. Create full-page routes for project detail at minimum (it has the expand button)
2. Add expand buttons to remaining detail views that warrant it (company, supplier potentially)

Minimum for UX-02: Fix the project expand link to work by creating `/projects/[id]/page.tsx`.

## Files to Modify

### Plan 1: Fix Scroll in All Detail Modals
- `src/components/ui/dialog.tsx` -- Remove/change `overflow-y-auto` to `overflow-hidden`
- `src/components/ui/detail-view.tsx` -- Fix mobile drawer flex layout, ensure ScrollArea constraints
- `src/components/ui/scroll-area.tsx` -- Potentially no changes needed

### Plan 2: Fix Expand-to-Page
- Create `src/app/(protected)/projects/[id]/page.tsx` -- Project full-page detail
- Verify `/initiatives/[id]` page works correctly
- Consider adding expandHref to other detail views that have enough content (company, supplier)

## Key Findings Summary

1. **Scroll conflict**: `DialogContent` has `overflow-y-auto` that fights with `ScrollArea`
2. **Mobile drawer**: Missing `flex flex-col` in mobile drawer mode
3. **Expand pages**: Project expand link broken (404), other views lack expand
4. **All 7 detail sheets** use `DetailView` wrapper, so fixing the wrapper fixes all
5. The fix is centralized: modify `dialog.tsx` and `detail-view.tsx` to fix scroll for all consumers
