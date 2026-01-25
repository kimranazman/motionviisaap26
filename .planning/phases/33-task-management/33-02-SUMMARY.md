---
phase: 33-task-management
plan: 02
subsystem: api, ui
tags: [tags, task-tree, prisma, react, shadcn]

# Dependency graph
requires:
  - phase: 33-01
    provides: Task model schema, Task CRUD API routes
provides:
  - Tags API (GET, POST, PATCH, DELETE)
  - TaskTagSelect component for tag selection UI
  - task-utils.ts with tree building and progress calculation
  - tag-utils.ts with color palette and validation
affects: [33-03, 33-04]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Global tags (not project-scoped) for simpler management"
    - "Case-insensitive tag name uniqueness via MySQL default collation"
    - "Lazy-load tags on popover open"

key-files:
  created:
    - src/app/api/tags/route.ts
    - src/app/api/tags/[tagId]/route.ts
    - src/components/projects/task-tag-select.tsx
    - src/lib/task-utils.ts
    - src/lib/tag-utils.ts
  modified: []

key-decisions:
  - "Global tags (not project-scoped) - simpler initial implementation"
  - "TAG_COLORS extracted to lib/tag-utils.ts (cannot export non-route from route files)"
  - "MySQL varchar is case-insensitive - use findUnique instead of mode: 'insensitive'"

patterns-established:
  - "buildTaskTree: flat list to nested tree in O(n)"
  - "Color palette picker with preset colors for consistent tag styling"

# Metrics
duration: 13min
completed: 2026-01-25
---

# Phase 33 Plan 02: Tags API and Task Utilities Summary

**Tags CRUD API with color palette, TaskTagSelect combobox component, and task tree utilities (buildTaskTree, calculateProgress, getDescendantIds)**

## Performance

- **Duration:** 13 min
- **Started:** 2026-01-25T00:46:07Z
- **Completed:** 2026-01-25T00:59:06Z
- **Tasks:** 2
- **Files created:** 5

## Accomplishments
- Tags API with full CRUD (list, create, update, delete) and duplicate name prevention
- TaskTagSelect component with lazy-load, search filter, and inline tag creation dialog
- task-utils.ts with tree building algorithm, progress calculation, and descendant ID retrieval
- TAG_COLORS palette (8 colors) for consistent tag styling

## Task Commits

Each task was committed atomically:

1. **Task 1: Tags API Routes** - `15ff294` (feat)
2. **Task 2: TaskTagSelect Component and Task Utilities** - `603d4d1` (feat)

Additional fix commits during execution:
- `e4bb0aa` - TaskForm/TaskCard components and ProjectDetailSheet integration (from Plan 33-01)
- `58655a0` - MySQL compatibility fixes for tags API

## Files Created/Modified

**Created:**
- `src/app/api/tags/route.ts` - GET (list) and POST (create) endpoints
- `src/app/api/tags/[tagId]/route.ts` - PATCH and DELETE endpoints
- `src/components/projects/task-tag-select.tsx` - Tag selection combobox with create-new dialog
- `src/lib/task-utils.ts` - Tree building, progress calculation, descendant utilities
- `src/lib/tag-utils.ts` - TAG_COLORS palette, isValidHexColor, DEFAULT_TAG_COLOR

## Decisions Made

1. **Global tags (not project-scoped)** - Simpler implementation per STATE.md decision, can add projectId scope later if needed
2. **TAG_COLORS in lib/tag-utils.ts** - Next.js route files cannot export non-route values, so extracted to shared utility
3. **MySQL case-insensitive collation** - Use `findUnique` instead of `mode: 'insensitive'` since MySQL varchar is naturally case-insensitive
4. **Admin role required for tag deletion** - Tags are shared resources, prevent accidental removal
5. **Optional parentId in Task interfaces** - Allows consistency between task-card, task-form, and project-detail-sheet

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] MySQL incompatibility with Prisma mode: 'insensitive'**
- **Found during:** Task 1 (Tags API Routes)
- **Issue:** Prisma's `mode: 'insensitive'` is not supported for MySQL StringFilter
- **Fix:** Removed mode: 'insensitive', rely on MySQL's default case-insensitive varchar collation
- **Files modified:** src/app/api/tags/route.ts, src/app/api/tags/[tagId]/route.ts
- **Verification:** Build passes, duplicate check works correctly
- **Committed in:** `58655a0`

**2. [Rule 3 - Blocking] Next.js route file export restriction**
- **Found during:** Task 1 (Tags API Routes)
- **Issue:** Exporting `TAG_COLORS` from route.ts causes build error "TAG_COLORS is not a valid Route export field"
- **Fix:** Extracted TAG_COLORS and isValidHexColor to new lib/tag-utils.ts
- **Files modified:** src/lib/tag-utils.ts (created), src/app/api/tags/route.ts, src/components/projects/task-tag-select.tsx
- **Verification:** Build passes
- **Committed in:** `58655a0`

**3. [Rule 1 - Bug] Type mismatch between Task interfaces**
- **Found during:** Task 2 (Build verification)
- **Issue:** Multiple Task interfaces with different optional/required fields caused TypeScript errors
- **Fix:** Standardized parentId as `string | null` across task-card, task-form, project-detail-sheet
- **Files modified:** src/components/projects/task-card.tsx, src/components/projects/project-detail-sheet.tsx
- **Verification:** Build passes without type errors
- **Committed in:** Linter auto-fixed

---

**Total deviations:** 3 auto-fixed (3 blocking)
**Impact on plan:** All auto-fixes necessary for build to pass. No scope creep.

## Issues Encountered
- Pre-existing code from Plan 33-01 (TaskForm, TaskCard, tasks section) was already integrated but had build issues - fixed as part of this plan's execution

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Tags API ready for integration with task tagging in Plan 33-03
- task-utils.ts ready for tree view component in Plan 33-03
- TaskTagSelect component needs actual API endpoints (created with TODO comments for Plan 33-03)

---
*Phase: 33-task-management*
*Completed: 2026-01-25*
