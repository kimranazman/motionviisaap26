# Summary: 78-06 Calendar Page Integration

## What was built

Updated the calendar page at `src/app/(dashboard)/calendar/page.tsx`:

- **Tasks loading** - Fetches tasks with dueDate not null
- **Projects loading** - Fetches non-archived projects with startDate or endDate
- **Initiatives loading** - Fetches all initiatives with dates
- **Date conversion** - Converts DateTime to ISO strings
- **MainCalendar usage** - Replaces old CalendarView with new unified MainCalendar
- **Updated description** - "Unified view of tasks, projects, and initiatives"

## Commits

| Hash | Message |
|------|---------|
| 1f1b20a | feat(78-06): integrate unified calendar with data loading |

## Files changed

- `src/app/(dashboard)/calendar/page.tsx` (modified)

## Verification

- [x] Tasks fetched with dueDate not null
- [x] Projects fetched with startDate or endDate
- [x] Initiatives fetched with all required fields
- [x] Dates converted to ISO strings
- [x] MainCalendar imported and used
- [x] No TypeScript errors
