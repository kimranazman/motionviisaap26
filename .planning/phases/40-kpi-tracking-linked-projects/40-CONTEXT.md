# Phase 40: KPI Tracking & Linked Projects - Context

**Gathered:** 2026-01-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Each initiative row shows KPI progress (auto-calculated from linked project revenue or manually set) and inline linked project details. Users can assess initiative health at a glance. KPI editing happens in the existing detail sheet. Linked project click-through navigates to project detail page.

</domain>

<decisions>
## Implementation Decisions

### KPI Progress Display
- Thin horizontal progress bar below the initiative title — subtle, integrated into the row
- Color coding: green >80%, yellow 50-80%, red <50%
- KPI label visible on the row (e.g., "Revenue: 75/100 MYR") so users know what's being measured
- Small icon indicator to distinguish manual (pencil icon) vs auto-calculated (calculator icon) values

### KPI Edit Experience
- KPI fields (label, target, actual, unit) added to the existing initiative detail/edit sheet
- Confirmation dialog when user manually enters actual value: "This will override auto-calculated value. Continue?"
- Clear "Revert to auto" button visible when manual override is active — clicking it removes the override and resumes auto-calculation
- Field grouping (setup vs update split): Claude's discretion based on form layout

### Linked Projects Presentation
- Icon + count badge on the initiative row (e.g., folder icon with "3")
- Clicking the badge opens the initiative detail sheet/side panel scrolled to a linked projects section
- Each linked project shows: title, status badge, revenue, costs, client name, and project dates
- Clicking a linked project navigates to the full project detail page (/projects/[id])

### Empty & Edge States
- No KPI set: grayed-out placeholder progress bar (indicates KPI can be configured)
- No linked projects badge display: Claude's discretion based on row density
- Zero target handling: Claude's discretion (handle appropriately to avoid division issues)
- KPI exceeding target (>100%): Claude's discretion on visual treatment

### Claude's Discretion
- KPI field grouping in edit form (all together vs setup/update split)
- No-linked-projects badge behavior (hide vs show "0")
- Zero-target edge case visual treatment
- Over-target (>100%) progress bar visual treatment
- Exact spacing, typography, and icon choices
- Loading states and error handling

</decisions>

<specifics>
## Specific Ideas

- Progress bar should feel compact — tucked under the initiative title, not dominating the row
- Manual vs auto distinction is important — users need to know at a glance whether a value is system-derived or hand-entered
- Linked projects section in the side panel should show all four data points: title+status, revenue+costs, client, dates

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 40-kpi-tracking-linked-projects*
*Context gathered: 2026-01-26*
