# Phase 61 Research: Calendar Enhancements

## Current Implementation

### Calendar Page (`src/app/(dashboard)/calendar/page.tsx`)
- Server component that fetches initiatives and events
- Passes data to `CalendarView` client component
- Currently fetches `keyResult: { select: { krId: true } }` - only the identifier code, NOT the description
- The `keyResult` field passed to `CalendarView` is just a string like "KR1.1" or "Unlinked"

### CalendarView Component (`src/components/calendar/calendar-view.tsx`)
- Client component with month-only view
- Uses `date-fns` for date calculations (already imports `startOfWeek`, `endOfWeek`, `eachDayOfInterval`, etc.)
- State: `currentDate`, `showEvents`, `showInitiatives`
- Month grid: 7 columns, each day cell is `min-h-[120px]`
- Shows up to 2 events + remaining slots for initiatives (total 3 items), then "+N more" overflow
- Initiative labels show only `initiative.keyResult` (e.g., "KR1.1") on the start day
- Navigation: Previous/Next month buttons, Today button

### KeyResult Model (Prisma)
- `krId`: String like "KR1.1", "KR2.3" (unique identifier)
- `description`: String like "Achieve RM1M Revenue" (full name)
- Initiative has `keyResultId` FK -> `KeyResult`

### date-fns Availability
- `addWeeks`, `subWeeks` are available in installed date-fns
- `startOfWeek`, `endOfWeek`, `eachDayOfInterval` already imported

## What Needs to Change

### CAL-01: Month/Week View Toggle
- Add a `viewMode` state: 'month' | 'week'
- Add toggle UI in the header (next to existing Initiatives/Events toggles)
- Navigation changes based on view: month navigates by month, week navigates by week

### CAL-02 & CAL-03: Week View Without Truncation
- Week view shows 7 days in expanded vertical space
- No "+N more" truncation - show ALL initiatives and events for each day
- Each day column needs much taller minimum height (no `min-h-[120px]` limit)
- Week navigation: Previous/Next week buttons

### CAL-04: Full KR Labels
- Calendar page query must include `description` from `keyResult`: `{ select: { krId: true, description: true } }`
- The `keyResult` field passed to CalendarView must become an object or formatted string like "KR1.1 - Achieve RM1M Revenue"
- Update the Initiative interface in CalendarView to support the new format
- Display the full label in both month and week views

## Implementation Approach

### Plan 1: Data Layer - Full KR Labels (CAL-04)
- Modify `calendar/page.tsx` to fetch `keyResult: { select: { krId: true, description: true } }`
- Format as `"KR1.1 - Achieve RM1M Revenue"` string before passing to CalendarView
- Update CalendarView to display the longer label (already truncates via CSS `truncate` class)

### Plan 2: Week View & Toggle (CAL-01, CAL-02, CAL-03)
- Add `viewMode` state to CalendarView
- Add toggle button group in header
- Implement week view rendering:
  - 7 day columns with no item limit
  - Taller min-height per day cell
  - Week navigation (prev/next week)
- Keep month view working as-is but update labels

## Dependencies
- No external package dependencies needed
- date-fns already has all required functions
- Only 2 files to modify: `calendar/page.tsx` and `calendar-view.tsx`

## RESEARCH COMPLETE
