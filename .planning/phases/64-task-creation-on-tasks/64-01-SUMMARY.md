# Summary: 64-01 Add Task Dialog with Project Selector

## Status: COMPLETE

## What Was Built

- **ProjectSelect combobox** (`src/components/tasks/project-select.tsx`): Searchable project selector using Command/Popover pattern (matching CompanySelect). Accepts projects via prop to avoid extra API calls.
- **All-projects data flow**: Added `getAllProjects()` server function to tasks page that fetches every project (not just those with tasks). Passed as `allProjects` prop for the creation form.
- **Add Task dialog** on `/tasks` page: "Add Task" button in toolbar opens Dialog with required project selector, required title, and optional description/status/priority/dueDate/assignee fields. Posts to existing `POST /api/projects/{id}/tasks` endpoint. Form resets on close, shows loading state and error handling.
- **Depth field**: Added `depth` to `CrossProjectTask` interface and server serialization for subtask creation validation in Plan 64-02.

## Commits

| # | Hash | Message |
|---|------|---------|
| 1 | 2869072 | feat(64-01): create ProjectSelect combobox component |
| 2 | 5cbdfc0 | feat(64-01): fetch all projects for task creation form |
| 3 | dbb6316 | feat(64-01): add task creation dialog to /tasks page |

## Files Modified

- `src/components/tasks/project-select.tsx` (new)
- `src/components/tasks/tasks-page-client.tsx` (modified)
- `src/app/(dashboard)/tasks/page.tsx` (modified)

## Deviations

None. All tasks executed as planned.

## Issues

None.
