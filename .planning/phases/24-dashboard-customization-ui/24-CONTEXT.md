# Phase 24: Dashboard Customization UI - Context

**Gathered:** 2026-01-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can customize their dashboard layout — add/remove widgets from a bank, drag to reposition, resize, and have it persist per user. Role restrictions from Phase 23 apply. Mobile/responsive behavior included.

</domain>

<decisions>
## Implementation Decisions

### Widget Bank UI
- Sidebar panel slides in from right, stays open while working
- Widgets grouped by category (e.g., "Analytics", "CRM", "Projects")
- Two ways to add: drag from sidebar to specific spot OR click to auto-place
- Widgets already on dashboard: greyed out with checkmark
- **Revised:** Allow duplicate widgets (same widget can appear multiple times with different date ranges)

### Drag-drop & Resize
- 12-column responsive grid system
- Widgets span 3, 4, 6, or 12 columns depending on size
- Resize via drag handles (snaps to columns) + quick size buttons in widget menu
- Collision behavior: widgets below push down to make room (Notion-style)
- Mobile/tablet: touch-optimized with larger touch targets, full drag-drop preserved

### Layout Persistence
- Auto-save immediately on every change
- Undo available for recent changes (toast notification with undo action)
- Layout actions (Reset, Undo) live in dashboard header top-right
- "Reset to default" shows confirmation dialog before replacing layout
- When admin updates default: notify customized users via banner ("Default layout updated. Want to see changes?")

### Date Range Filter
- Global date picker in dashboard header, always visible
- Business presets: Last 7/30/90 days, MTD, QTD, YTD, Custom
- All data widgets respect global filter by default
- Per-widget date override available (widget can have its own date range)
- Duplicate widgets enable comparison (e.g., two revenue widgets showing different years)

### Claude's Discretion
- Exact animation/transition timing
- Category names and grouping of existing widgets
- Undo history depth (how many actions to keep)
- Toast/notification styling for auto-save feedback

</decisions>

<specifics>
## Specific Ideas

- Collision behavior should feel like Notion's block dragging — smooth, predictable
- Widget bank sidebar should feel lightweight, not overwhelming
- Date comparison use case: user adds two revenue widgets, sets one to "This Year" and one to "Last Year"

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 24-dashboard-customization-ui*
*Context gathered: 2026-01-23*
