# Phase 78 Research: Main Calendar View

## Date Field Analysis

### Task Model
- `dueDate: DateTime?` - Optional due date for the task
- **No startDate field** - Tasks only have due dates

### Project Model
- `startDate: DateTime?` - Optional project start date
- `endDate: DateTime?` - Optional project end date

### Initiative Model
- `startDate: DateTime` - **Required** initiative start date
- `endDate: DateTime` - **Required** initiative end date

**Summary:**
| Entity | Start Date | End Date | Status Field |
|--------|------------|----------|--------------|
| Task | None | `dueDate` (optional) | `status` (TODO, IN_PROGRESS, DONE) |
| Project | `startDate` (optional) | `endDate` (optional) | `status` (DRAFT, ACTIVE, COMPLETED, CANCELLED) |
| Initiative | `startDate` (required) | `endDate` (required) | `status` (NOT_STARTED, IN_PROGRESS, etc.) |

## Existing Calendar Implementation

**Current state:** A `/calendar` page already exists at:
- `src/app/(dashboard)/calendar/page.tsx` - Server component
- `src/components/calendar/calendar-view.tsx` - Client component

**Current features:**
- Shows initiatives with spanning bars (not markers)
- Shows events with spanning bars
- Month and week view toggle
- Initiative/event filter toggles
- Department color coding for initiatives
- Priority color coding for events

**What needs to change for Phase 78:**
1. Current implementation shows **spanning bars** - we need **markers only** (per CAL-10)
2. Need to add Tasks and Projects (currently only shows Initiatives and Events)
3. Need to add day view (currently only month/week)
4. Need grey color for completed items (currently uses status colors)
5. Need entity type legend (Task, Project, Initiative)
6. Need click-to-open detail sheet functionality

## Navigation Config Pattern

From `src/lib/nav-config.ts`:
- Calendar nav item already exists at line 51: `{ name: 'Calendar', href: '/calendar', icon: Calendar }`
- Already placed under SAAP group
- **CAL-11 is already satisfied** - no nav change needed

## Detail Sheet Pattern

Existing detail sheets use `DetailView` component:
- `src/components/projects/task-detail-sheet.tsx` - Uses DetailView
- `src/components/projects/project-detail-sheet.tsx` - Uses DetailView
- `src/components/kanban/initiative-detail-sheet.tsx` - Uses DetailView

**Pattern for opening sheets:**
```tsx
const [selectedTask, setSelectedTask] = useState<Task | null>(null)
const [taskSheetOpen, setTaskSheetOpen] = useState(false)

// On marker click:
setSelectedTask(task)
setTaskSheetOpen(true)

// Sheet component:
<TaskDetailSheet
  task={selectedTask}
  projectId={selectedTask?.projectId}
  open={taskSheetOpen}
  onOpenChange={setTaskSheetOpen}
  onTaskUpdate={() => { /* refresh */ }}
/>
```

## Date-fns Usage

Current calendar uses date-fns (already imported):
- `startOfMonth`, `endOfMonth` - Month boundaries
- `eachDayOfInterval` - Generate day arrays
- `isSameDay`, `isSameMonth` - Day comparisons
- `addMonths`, `subMonths`, `addWeeks`, `subWeeks` - Navigation
- `format` - Date formatting
- `parseISO`, `startOfDay` - Date parsing

For day view, we would need:
- `startOfDay`, `endOfDay` - Day boundaries
- `addDays`, `subDays` - Day navigation
- `addHours`, `eachHourOfInterval` - Hour intervals (optional)

## Responsive Layout Pattern

Current calendar is already responsive:
- Full grid on desktop
- Same grid structure on mobile (7 columns)
- Smaller text/padding on mobile via responsive classes
- `min-h-[120px]` for month cells, `min-h-[400px]` for week cells

**Mobile considerations:**
- Day view works well on mobile (single column)
- Week view may need horizontal scroll
- Month view already works but cells are small

## Color Pattern for Status

From `src/lib/utils.ts`:
```typescript
export function getStatusColor(status: string): string {
  switch (status) {
    case 'NOT_STARTED': return 'bg-gray-500'
    case 'IN_PROGRESS': return 'bg-blue-500'
    case 'COMPLETED': return 'bg-green-500'
    case 'BLOCKED': return 'bg-red-500'
    case 'CANCELLED': return 'bg-gray-400'
    default: return 'bg-gray-500'
  }
}
```

**For completed items (CAL-09):** Use `bg-gray-400 text-gray-500` to show muted grey.

## Implementation Approach

### Option A: Modify Existing CalendarView
- Pros: Less duplication, reuse existing structure
- Cons: May be complex to refactor spanning bars to markers

### Option B: Create New MainCalendar Component
- Pros: Clean slate, easier to implement markers-only approach
- Cons: Some code duplication

**Recommendation:** Option B - Create new component
- The existing CalendarView is tightly coupled to spanning bars
- The new requirements (markers only, three entities, grey completed) are different enough
- Keep existing CalendarView for backwards compatibility (or deprecate later)

### Component Structure

```
src/components/calendar/
├── calendar-view.tsx          # Existing (initiatives + events, spanning)
├── main-calendar.tsx          # NEW: Unified calendar orchestrator
├── calendar-day-view.tsx      # NEW: Day view (single day, all markers)
├── calendar-week-view.tsx     # NEW: Week view (7 days, markers)
├── calendar-month-view.tsx    # NEW: Month view (grid, markers)
├── calendar-date-marker.tsx   # NEW: Small marker component
└── calendar-legend.tsx        # NEW: Entity type legend
```

### Data Loading Strategy

**Server Component (page.tsx):**
```typescript
// Load all entities with dates in date range
const [tasks, projects, initiatives] = await Promise.all([
  prisma.task.findMany({
    where: { dueDate: { not: null } },
    select: { id, title, dueDate, status, projectId }
  }),
  prisma.project.findMany({
    where: { OR: [{ startDate: { not: null } }, { endDate: { not: null } }] },
    select: { id, title, startDate, endDate, status }
  }),
  prisma.initiative.findMany({
    select: { id, title, startDate, endDate, status, keyResultId }
  })
])
```

**Pass to client as unified CalendarItem[]:**
```typescript
interface CalendarItem {
  id: string
  title: string
  entityType: 'task' | 'project' | 'initiative'
  dateType: 'start' | 'end' | 'due'  // 'due' for tasks
  date: string  // ISO string
  status: string
  isCompleted: boolean  // Pre-computed for easy grey logic
  href?: string  // Link to entity detail
}
```

### Marker Design

Small dot or pill marker:
- Task: Blue dot/pill
- Project: Orange dot/pill
- Initiative: Purple dot/pill
- Completed: Grey dot (overrides entity color)

Marker shows:
- Color indicator (entity type or grey if done)
- Truncated title (on hover show full)
- Start/End indicator (S/E icon or "Start"/"End" text)

### Click Handling

On marker click:
1. Determine entity type
2. Open appropriate detail sheet:
   - Task: TaskDetailSheet
   - Project: ProjectDetailSheet
   - Initiative: InitiativeDetailSheet

All three sheets already exist and use the same DetailView pattern.

## API Endpoint Consideration

Could add `/api/calendar/items` endpoint for client-side date filtering, but since we're using server components, direct Prisma queries are simpler.

If needed for date range changes (navigating months without page reload), could add:
```typescript
GET /api/calendar/items?start=2026-01-01&end=2026-01-31
```

## Files to Create

1. `src/app/(dashboard)/calendar/page.tsx` - **Modify** existing to use new MainCalendar
2. `src/components/calendar/main-calendar.tsx` - New unified calendar client component
3. `src/components/calendar/calendar-day-view.tsx` - Day view implementation
4. `src/components/calendar/calendar-week-view.tsx` - Week view implementation
5. `src/components/calendar/calendar-month-view.tsx` - Month view implementation
6. `src/components/calendar/calendar-date-marker.tsx` - Marker component
7. `src/components/calendar/calendar-legend.tsx` - Legend component (optional, can be inline)

## Dependencies

- date-fns (already installed)
- No new dependencies needed

## Key Decision: Keep Old Calendar?

The existing CalendarView shows initiative timelines with spanning bars, which might still be useful for timeline visualization. Options:

1. **Replace entirely** - /calendar becomes unified marker view
2. **Add route** - /calendar/unified for new view, keep /calendar as-is
3. **View toggle** - Same page, toggle between "Timeline" and "Markers" view

**Recommendation:** Option 1 (Replace). The requirements specify "unified calendar showing start/end dates" with markers only. The old spanning view can be sunset.

## RESEARCH COMPLETE
