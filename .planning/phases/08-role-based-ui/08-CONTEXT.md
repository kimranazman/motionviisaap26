# Phase 8: Role-Based UI - Context

**Gathered:** 2026-01-21
**Status:** Ready for planning

<domain>
## Phase Boundary

UI adapts based on user role (VIEWER, EDITOR, ADMIN). Controls are shown/hidden based on permissions. Viewers are read-only except for comments. Only Admins see user management.

</domain>

<decisions>
## Implementation Decisions

### Hide strategy
- Remove controls entirely by default (not in DOM)
- Exception: Some high-value controls show disabled with tooltip to hint at capabilities
- Tooltip text is role-specific: "Requires Editor or Admin role"
- Claude decides which controls warrant disabled+tooltip vs complete removal

### Permission boundaries
- Viewers CAN add comments (participation in discussion allowed)
- Viewers CANNOT edit any fields (title, description, status, assignee, dates — all read-only)
- Viewers CANNOT use Kanban drag-and-drop (status changes require Editor)
- Viewers CANNOT see/use quick action menu on Kanban cards
- No visual "read-only" indicator — just don't show edit controls (implicit)

### Admin visibility
- "Manage Users" link appears in sidebar navigation only
- Separate "Admin" section with divider in sidebar, then Users link underneath
- Subtle distinction in styling (different icon or slight color difference)
- Admins see same content as Editors on regular pages — no extra info

### Feedback for blocked actions
- Direct URL access to restricted page: Show popup/dialog saying no permission
- Popup requires user to dismiss (click OK), then redirects to view page
- API returns 403 with JSON error message: "Requires Editor role"
- Claude decides how to display API 403 errors in UI (toast vs in-place)

### Claude's Discretion
- Which specific controls get disabled+tooltip vs hidden
- Exact tooltip wording variations
- Sidebar Admin section icon choice
- API error display method (toast vs in-place error)

</decisions>

<specifics>
## Specific Ideas

- Permission popup should be "pop-up-ish" — a modal/dialog, not just a toast
- User must acknowledge the popup before being redirected

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 08-role-based-ui*
*Context gathered: 2026-01-21*
