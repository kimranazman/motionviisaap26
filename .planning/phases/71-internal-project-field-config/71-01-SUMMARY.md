# Summary: 71-01 Internal Field Config Backend

## Status: COMPLETE

## What was built
- Added `internalFieldConfig Json?` to AdminDefaults Prisma model
- Created `src/types/internal-fields.ts` with 5 configurable field keys, TypeScript types, default config, and `isFieldHidden()` helper
- Extended `getAdminDefaults()` and `updateAdminDefaults()` in defaults.ts
- Created `GET/PUT /api/admin/internal-fields` API route (GET: any auth, PUT: admin only)
- Created `useInternalFieldConfig` React hook with `isHidden()` helper

## Commits
1. `65411b6` — feat(71-01): add internalFieldConfig to AdminDefaults schema
2. `17e2dd6` — feat(71-01): create internal field config types and defaults
3. `124bd65` — feat(71-01): extend AdminDefaults to support internal field config
4. `60f3fb4` — feat(71-01): add API endpoint for internal field config
5. `f070a18` — feat(71-01): add useInternalFieldConfig client hook

## Files Modified
- `prisma/schema.prisma` — Added internalFieldConfig field to AdminDefaults
- `src/types/internal-fields.ts` — New: types, constants, defaults, helper
- `src/lib/widgets/defaults.ts` — Extended get/update functions
- `src/app/api/admin/internal-fields/route.ts` — New: GET/PUT API
- `src/lib/hooks/use-internal-field-config.ts` — New: React hook

## Decisions
- GET endpoint uses `requireAuth` (any logged-in user) instead of `requireAdmin` since all users need to read the config to hide fields in their project views
- Default hidden fields for internal projects: revenue, potentialRevenue, pipelineSource, companyContact (initiative link visible by default)

## Issues
None.
