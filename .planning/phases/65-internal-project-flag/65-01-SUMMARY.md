# Summary: 65-01 Schema + API for Internal Projects

## Status: COMPLETE

## What was built
- Added `isInternal` (Boolean, default false) and `internalEntity` (String?, VARCHAR 50) fields to the Project model
- Made `companyId` optional (String? instead of String) to support internal projects without a company
- Added `@@index([isInternal])` for efficient filtering
- Updated POST /api/projects to support internal project creation with entity validation (MOTIONVII/TALENTA)
- Updated GET /api/projects with `type` query parameter filter (client/internal/all)
- Updated PATCH /api/projects/[id] to support isInternal and internalEntity updates, with automatic company/contact clearing when switching to internal
- Fixed null-safe company access in /api/ai/pending route
- Fixed null-safe company access in manifest-utils.ts

## Commits
1. `29c1f9a` - feat(65-01): add isInternal and internalEntity fields to Project model
2. `bede401` - feat(65-01): support internal project creation and type filter in projects API
3. `6481138` - feat(65-01): support internal project fields in PATCH /api/projects/[id]
4. `7880286` - fix(65-01): null-safe company access in ai/pending route
5. `bc8b332` - fix(65-01): null-safe company access in manifest-utils

## Files modified
- `prisma/schema.prisma` - Added isInternal, internalEntity, made companyId nullable, added index
- `src/app/api/projects/route.ts` - GET type filter, POST internal project support
- `src/app/api/projects/[id]/route.ts` - PATCH internal project fields
- `src/app/api/ai/pending/route.ts` - Null-safe company access
- `src/lib/manifest-utils.ts` - Null-safe company access

## Deviations
- Used `npx prisma db push` instead of `prisma migrate dev` due to shadow database permission issue. Schema is in sync.

## Verification
- TypeScript compiles without errors (`npx tsc --noEmit` passes)
- Prisma schema validates and client generated successfully
