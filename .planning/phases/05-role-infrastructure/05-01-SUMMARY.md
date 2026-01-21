---
phase: 05-role-infrastructure
plan: 01
subsystem: auth
tags: [auth, roles, seeding, prisma, oauth]

# Dependency graph
requires:
  - phase: 04-auth-foundation
    provides: User model with role field, Google OAuth integration
provides:
  - Profile callback returning VIEWER role for new users
  - Idempotent admin seed script
  - db:seed:admin npm script
affects: [06-route-protection, 07-admin-dashboard]

# Tech tracking
tech-stack:
  added: [tsx]
  patterns: [profile-callback-role-assignment, idempotent-seeding]

key-files:
  created: [prisma/seed-admin.ts]
  modified: [src/auth.ts, package.json]

key-decisions:
  - "Use profile callback for explicit role assignment (clarity over relying only on @default)"
  - "Use tsx over ts-node for npm scripts (better compatibility)"
  - "Admin seed uses upsert (idempotent, always ensures ADMIN role)"

patterns-established:
  - "Profile callback pattern: Return user object with role for explicit role control"
  - "Idempotent seeding: Use upsert with update block ensuring correct state"

# Metrics
duration: 3min
completed: 2026-01-21
---

# Phase 05 Plan 01: Role Infrastructure Summary

**OAuth profile callback assigns VIEWER role to new users; idempotent admin seed establishes khairul@talenta.com.my as ADMIN**

## Performance

- **Duration:** 3 min
- **Started:** 2026-01-21T08:40:00Z
- **Completed:** 2026-01-21T08:43:00Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- Google OAuth profile callback now explicitly returns role: "VIEWER" for all new users
- Created idempotent admin seed script that uses Prisma upsert for safety
- Admin user khairul@talenta.com.my seeded with ADMIN role

## Task Commits

Each task was committed atomically:

1. **Task 1: Add profile callback to Google provider** - `1810509` (feat)
2. **Task 2: Create idempotent admin seed script** - `fc3ef5b` (feat)
3. **Task 3: Add npm script and run admin seed** - `3429ee7` (feat)

## Files Created/Modified
- `src/auth.ts` - Added profile callback returning user object with role: "VIEWER"
- `prisma/seed-admin.ts` - New script for idempotent admin user seeding using upsert
- `package.json` - Added db:seed:admin npm script using tsx

## Decisions Made
- **Profile callback explicit role:** While Prisma schema has `@default(VIEWER)`, explicit profile callback provides clarity and enables future conditional role logic (e.g., different roles based on email patterns)
- **tsx over ts-node:** Used tsx for npm script execution for better shell compatibility (ts-node compiler-options JSON escaping issues with npm)
- **Upsert with update block:** Admin seed always sets role to ADMIN even if user exists, ensuring admin can't be accidentally demoted

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed npm script shell quoting issue**
- **Found during:** Task 3 (npm script execution)
- **Issue:** ts-node --compiler-options JSON escaping failed in npm scripts
- **Fix:** Changed to use tsx instead of ts-node for the db:seed:admin script
- **Files modified:** package.json
- **Verification:** `npm run db:seed:admin` executes successfully
- **Committed in:** 3429ee7 (Task 3 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Auto-fix necessary for script to run via npm. No scope creep.

## Issues Encountered
None - execution proceeded smoothly after fixing the shell quoting issue.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Role infrastructure complete: new users get VIEWER, admin seeded as ADMIN
- Ready for route protection (Phase 6) to use roles for authorization
- Ready for admin dashboard (Phase 7) to leverage ADMIN role

---
*Phase: 05-role-infrastructure*
*Completed: 2026-01-21*
