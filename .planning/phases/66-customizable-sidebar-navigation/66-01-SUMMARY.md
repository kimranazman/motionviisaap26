# Summary: 66-01 Schema + API + Nav Visibility Hook

## Result: COMPLETE

## What Was Built

1. **Schema**: Added `hiddenNavItems` (Json, nullable) field to UserPreferences model in Prisma, pushed to database
2. **Nav-config helpers**: Added `ALWAYS_VISIBLE_HREFS` Set, `isAlwaysVisible()`, and `getAllNavHrefs()` exports to nav-config.ts
3. **API**: Updated GET/PATCH `/api/user/preferences` to read/write `hiddenNavItems` array
4. **Hook**: Created `useNavVisibility` hook with `isVisible`, `toggleItem`, `autoReveal`, `isLoading`, and `hiddenItems`

## Commits

| Hash | Task | Description |
|------|------|-------------|
| 85995df | 01 | Add hiddenNavItems field to UserPreferences schema |
| d5e0502 | 02 | Add always-visible helpers to nav-config |
| 8fb9545 | 03 | Add hiddenNavItems to preferences API |
| 397a668 | 04 | Create useNavVisibility hook |

## Files Modified

- `prisma/schema.prisma` — added hiddenNavItems field
- `src/lib/nav-config.ts` — added ALWAYS_VISIBLE_HREFS, isAlwaysVisible, getAllNavHrefs
- `src/app/api/user/preferences/route.ts` — GET returns hiddenNavItems, PATCH accepts it
- `src/lib/hooks/use-nav-visibility.ts` — NEW: client-side hook for nav visibility

## Deviations

None.
