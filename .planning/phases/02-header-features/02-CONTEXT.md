# Phase 2: Header Features - Context

**Gathered:** 2026-01-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Enable users to discover initiatives through search and get alerted to at-risk items via the header. Delivers global search functionality and a notification bell showing overdue/at-risk/due-soon initiatives.

</domain>

<decisions>
## Implementation Decisions

### Search Behavior
- Instant search (as you type) with debounce
- Search scope: all text fields (title, description, comments, owner names)
- Advanced filters available (status, owner, date range, etc.)

### Search Results UI
- Results appear in dropdown below search box (stay on current page)
- Each result shows: title + status badge + owner
- Full keyboard navigation: arrow keys to navigate, Enter to select, Esc to close

### Notification Criteria
- Triggers: Overdue + At Risk status + Due within 7 days
- Badge shows total count (no cap)

### Bell Popover Design
- Items grouped by type (Overdue, At Risk, Due Soon sections)
- Each item shows: title + status + due date
- Items link to initiative detail page (/initiatives/[id])

### Claude's Discretion
- Number of results to show in search dropdown
- Empty state handling for no search results
- Notification scope (all initiatives vs user's only)
- Empty state for bell popover when nothing needs attention

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 02-header-features*
*Context gathered: 2026-01-20*
