# Plan 68-01 Summary: Sidebar Bug Fixes

## What Changed

### 1. `src/lib/hooks/use-nav-visibility.ts`
- **Removed** `autoReveal` callback function and `lastRevealedRef` ref entirely
- **Removed** fire-and-forget `fetch` PATCH from `toggleItem` -- now a pure local state toggle
- **Added** `saveHiddenItems(items: string[])` -- batch persists hidden items in a single API call, updates local state atomically on success
- **Updated** return signature: `{ hiddenItems, isLoading, isVisible, toggleItem, saveHiddenItems }`

### 2. `src/components/layout/sidebar.tsx`
- **Removed** `useEffect` import and `autoReveal` destructure
- **Removed** the autoReveal `useEffect` that fired on pathname changes
- Sidebar now only uses `isVisible` for filtering -- hidden items stay hidden regardless of navigation

### 3. `src/app/(dashboard)/settings/page.tsx`
- **Added** local editing state (`localHidden`) synced from hook on load
- **Added** dirty detection comparing local state to persisted state
- **Added** Save button (only visible when dirty) with loading state
- **Added** toast notifications: "Settings saved" on success, "Failed to save settings" on error
- **Replaced** direct `toggleItem` calls with `handleToggle` (local-only toggle)
- **Replaced** `isVisible(item.href)` checks with `!localHidden.includes(item.href)` for local state

## Verification

- `npx tsc --noEmit` passes with zero errors
- `npm run build` succeeds
- No references to `autoReveal` anywhere in `src/`
- `saveHiddenItems` exported from `use-nav-visibility.ts`
- Save button appears only when toggles have unsaved changes
- Settings page imports `Button` from `@/components/ui/button` and `toast` from `sonner`

## Requirements Met

- SIDE-01: Hidden nav items stay hidden regardless of URL navigation (autoReveal removed)
- SIDE-02: Settings page has a Save button that batch-persists all visibility changes
- SIDE-03: Save button only visible when local state differs from persisted state
- SIDE-04: Sidebar updates immediately after save (hook state updated atomically)
- SIDE-05: Toast notification "Settings saved" appears on successful save
