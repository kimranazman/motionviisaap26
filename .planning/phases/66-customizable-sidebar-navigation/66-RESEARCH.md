# Phase 66 Research: Customizable Sidebar Navigation

## Research Complete

### Current Architecture

**Nav Config (`src/lib/nav-config.ts`):**
- Exports `navGroups` (SAAP 8 items, CRM 8 items, Admin 1 item), `topLevelItems` (Tasks, Members), `settingsItem` (Settings)
- Each item has `name`, `href`, `icon`
- Groups have `key`, `label`, optional `requireRole`
- `findGroupForPath(pathname)` maps a URL to its group key

**Sidebar (`src/components/layout/sidebar.tsx`):**
- Desktop sidebar, renders navGroups filtered by role, topLevelItems, settingsItem
- Uses `useNavCollapseState` for group expand/collapse (localStorage-backed)
- Settings is always rendered at bottom with separator

**Mobile Sidebar (`src/components/layout/mobile-sidebar.tsx`):**
- Sheet-based sidebar (identical structure to desktop)
- Also renders navGroups, topLevelItems, settingsItem
- Has `onLinkClick` to close sheet on navigation

**NavGroupComponent (`src/components/layout/nav-group.tsx`):**
- Renders a collapsible group with items
- Accepts `group`, `isExpanded`, `onToggle`, `pathname`, `onLinkClick`

**Mobile Nav (`src/components/layout/mobile-nav.tsx`):**
- Bottom tab bar with 4 hardcoded items (Dashboard, Initiatives, CRM, Events)
- NOT customizable (fixed shortcuts, not part of this phase)

**UserPreferences Model (Prisma):**
- Already exists with `dashboardLayout` (Json), `dateFilter` (Json), `detailViewMode` (String)
- One-to-one with User via `userId`
- API: `GET/PATCH /api/user/preferences`

**Settings Page (`src/app/(dashboard)/settings/page.tsx`):**
- Currently only has Detail View Mode setting (dialog/drawer radio)
- Clean card-based layout, space for adding more settings sections

### Requirements Analysis

| Req | What | Implementation Approach |
|-----|------|------------------------|
| NAV-01 | Toggle sidebar items on/off from Settings | Add toggle list in Settings page per nav item |
| NAV-02 | Persist per user in database | Add `hiddenNavItems` Json field to UserPreferences |
| NAV-03 | Dashboard and Settings always visible | Hardcode these as non-hideable in the toggle UI |
| NAV-04 | Hidden item auto-reveals on direct URL nav | Sidebar checks pathname against hidden items, auto-unhides |

### Design Decisions

1. **Storage format:** `hiddenNavItems: string[]` as Json in UserPreferences -- stores href paths of hidden items (e.g., `["/timeline", "/kanban"]`). Simpler than boolean map.

2. **Always-visible items:** Dashboard (`/`), Settings (`/settings`), and the Admin group items should not be hideable. The toggle UI simply won't render toggles for these.

3. **Auto-reveal on direct navigation (NAV-04):** The sidebar hook checks if current pathname matches a hidden item. If so, it removes it from hiddenNavItems and PATCHes the API. This is a client-side effect.

4. **Hook pattern:** Create `useNavVisibility` hook that:
   - Fetches hidden items from `/api/user/preferences`
   - Provides `hiddenItems`, `toggleItem(href)`, `isVisible(href)`
   - Handles auto-reveal logic

5. **Settings UI:** Add a "Sidebar Navigation" card below the existing Detail View Mode card. Show grouped toggles matching the nav structure.

6. **Mobile sidebar:** Uses same visibility logic -- hidden items are hidden on mobile too.

### Files to Modify

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Add `hiddenNavItems Json?` to UserPreferences |
| `src/app/api/user/preferences/route.ts` | Handle `hiddenNavItems` in GET/PATCH |
| `src/lib/hooks/use-nav-visibility.ts` | NEW: Hook for nav visibility state |
| `src/components/layout/sidebar.tsx` | Filter items by visibility |
| `src/components/layout/mobile-sidebar.tsx` | Filter items by visibility |
| `src/components/layout/nav-group.tsx` | Accept filtered items or filter internally |
| `src/app/(dashboard)/settings/page.tsx` | Add sidebar customization UI |

### Risks & Mitigations

1. **Prisma push for MySQL:** The project uses `db push` (no migrations directory). Adding a nullable Json field is safe.
2. **Hydration mismatch:** Nav visibility must handle SSR gracefully. Show all items initially, then hide on client. Use same pattern as `useNavCollapseState`.
3. **Empty groups:** If all items in a group are hidden, hide the group header too.
