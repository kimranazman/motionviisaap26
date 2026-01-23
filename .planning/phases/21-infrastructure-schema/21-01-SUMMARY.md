---
phase: 21-infrastructure-schema
plan: 01
subsystem: infra
tags: [nextjs, docker, file-upload, volume-mount]

# Dependency graph
requires: []
provides:
  - 10MB file upload capability via server actions
  - Persistent uploads directory for Docker containers
  - UPLOADS_DIR environment variable for file path configuration
affects: [22-document-management, file-upload-routes]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - bodySizeLimit configuration for large file uploads
    - Docker bind mount for persistent file storage

key-files:
  created: []
  modified:
    - next.config.mjs
    - docker-compose.nas.yml
    - Dockerfile

key-decisions:
  - "Used uppercase 'MB' in bodySizeLimit per Next.js documentation (lowercase reported as inconsistent)"
  - "Placed uploads volume mount before environment variables for cleaner YAML structure"

patterns-established:
  - "UPLOADS_DIR env var pattern for configurable file storage path"
  - "Docker volume at /volume1/Motionvii/saap2026v2/uploads for NAS persistence"

# Metrics
duration: 1min
completed: 2026-01-23
---

# Phase 21 Plan 01: Infrastructure Configuration Summary

**Next.js 10MB body size limit and Docker uploads volume mount for persistent file storage on NAS**

## Performance

- **Duration:** 1 min
- **Started:** 2026-01-23T06:44:01Z
- **Completed:** 2026-01-23T06:45:26Z
- **Tasks:** 2/2
- **Files modified:** 3

## Accomplishments

- Configured Next.js serverActions with 10MB bodySizeLimit for file uploads
- Added Docker volume mount for persistent uploads storage on NAS
- Created /app/uploads directory in Dockerfile with proper nextjs:nodejs ownership
- Added UPLOADS_DIR environment variable for runtime path configuration

## Task Commits

Each task was committed atomically:

1. **Task 1: Configure Next.js body size limit** - `a64c160` (feat)
2. **Task 2: Configure Docker volume mount and directory** - `3c84c3e` (feat)

## Files Created/Modified

- `next.config.mjs` - Added bodySizeLimit: '10MB' to serverActions config
- `docker-compose.nas.yml` - Added uploads volume mount and UPLOADS_DIR env var
- `Dockerfile` - Added uploads directory creation with proper ownership

## Decisions Made

1. **Used uppercase 'MB' in bodySizeLimit** - Per Next.js documentation and community reports, lowercase 'mb' has been reported as inconsistent. Uppercase '10MB' is the documented format.

2. **Volume mount path structure** - Used `/volume1/Motionvii/saap2026v2/uploads` following the existing pattern from the database mount path for consistency.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Infrastructure ready for document upload feature implementation
- Next plan (21-02) can build Prisma schema for Document, UserPreferences, AdminDefaults models
- Build passes successfully with new configuration

---
*Phase: 21-infrastructure-schema*
*Completed: 2026-01-23*
