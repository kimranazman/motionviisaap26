# Phase 2: Header Features - Research

**Researched:** 2026-01-20
**Domain:** React search UI, notification systems, shadcn/ui patterns
**Confidence:** HIGH

## Summary

This phase adds working search and notifications to the existing header component at `/src/components/layout/header.tsx`. The header already has placeholder UI for both features:
- A search input with icon (currently non-functional)
- A bell icon with hardcoded badge showing "3" (currently non-functional)

The codebase uses shadcn/ui components built on Radix primitives, with Popover and DropdownMenu components already available. Initiative data is fetched via Prisma from MySQL, with existing API routes that support filtering. The Phase 1 detail page exists at `/initiatives/[id]`, enabling notification items to link directly to initiatives.

**Primary recommendation:** Use the existing Popover component for both search results and notifications. Implement client-side debounced search with a new API endpoint, and create a notifications API that queries by status and endDate.

## Standard Stack

The project already has all required libraries installed.

### Core (Already Installed)
| Library | Version | Purpose | Notes |
|---------|---------|---------|-------|
| @radix-ui/react-popover | 1.1.15 | Search results + notification dropdowns | Already has shadcn wrapper |
| lucide-react | 0.562.0 | Bell, Search icons | Already used in header |
| date-fns | 4.1.0 | Date calculations for "due within 7 days" | Already available |

### Supporting (Already Installed)
| Library | Version | Purpose | Notes |
|---------|---------|---------|-------|
| @radix-ui/react-scroll-area | 1.2.10 | Scrollable notification list | Already has shadcn wrapper |
| tailwind-merge | 3.4.0 | Class merging for conditional styles | Used via cn() utility |

### No New Dependencies Required

All functionality can be built with existing packages. No new npm installs needed.

## Architecture Patterns

### Existing Project Structure
```
src/
├── app/
│   ├── (dashboard)/
│   │   └── initiatives/[id]/page.tsx  # Phase 1 detail page (dependency met)
│   └── api/
│       └── initiatives/
│           └── route.ts               # Existing GET with filters
├── components/
│   ├── layout/
│   │   └── header.tsx                 # Target file for modifications
│   └── ui/
│       ├── popover.tsx                # Available - use for dropdowns
│       ├── input.tsx                  # Already used in header
│       ├── scroll-area.tsx            # Available for notification list
│       └── badge.tsx                  # Available for status badges
└── lib/
    ├── prisma.ts                      # Database client
    └── utils.ts                       # Has formatStatus, getStatusColor, etc.
```

### Pattern 1: Search with Popover Dropdown

**What:** Replace static search input with controlled input + Popover results
**When to use:** This exact use case - search results that appear on typing

**Implementation approach:**
```typescript
// Source: Existing codebase patterns in kanban-filter-bar.tsx and header.tsx
// 1. Controlled input with debounced value
// 2. Popover that opens when results exist
// 3. Keyboard navigation via Radix primitives
```

The kanban-filter-bar.tsx (line 73-80) shows the existing search input pattern:
```typescript
<div className="relative flex-1 max-w-xs">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
  <Input
    placeholder="Search initiatives..."
    value={searchQuery}
    onChange={(e) => onSearchChange(e.target.value)}
    className="pl-9 h-9 ..."
  />
</div>
```

### Pattern 2: Notifications with Popover

**What:** Bell button with badge count + Popover showing grouped notifications
**When to use:** This exact use case - notification bell in header

**Existing header bell (line 39-45):**
```typescript
<Button variant="ghost" size="icon" className="relative">
  <Bell className="h-5 w-5 text-gray-600" />
  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
    3
  </span>
</Button>
```

Replace with Popover trigger pattern from user dropdown (line 48-68).

### Pattern 3: Date-based Query for Notifications

**What:** Query initiatives that are overdue, at-risk, or due within 7 days
**Logic already exists in:**
- `dashboard/stats/route.ts`: Shows pattern for date queries with Prisma
- `kanban-board.tsx` lines 68-106: Has `matchesDateFilter` function for overdue logic

```typescript
// From dashboard/stats/route.ts - upcoming deadlines query:
const upcomingDeadlines = await prisma.initiative.count({
  where: {
    endDate: { gte: today, lte: thirtyDaysLater },
    status: { notIn: ['COMPLETED', 'CANCELLED'] },
  },
})

// From kanban-board.tsx - overdue check:
case 'overdue':
  return endDate < today
```

### Anti-Patterns to Avoid
- **Full page reload on search:** Use client-side fetch, not server actions with redirects
- **Uncontrolled Popover:** Always use controlled open state for search to handle edge cases
- **Polling for notifications:** Fetch on mount + interval is sufficient for this use case
- **Complex state management:** Simple useState + useEffect is enough, no need for React Query or SWR

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Debounce search input | Custom setTimeout logic | Simple custom hook with useEffect | But pattern is simple enough |
| Popover positioning | Manual positioning CSS | Radix Popover (already in use) | Handles edge cases, a11y |
| Scrollable list | overflow-auto div | ScrollArea component | Consistent scrollbar styling |
| Date formatting | Manual date math | date-fns already installed | Handles timezone edge cases |

**Key insight:** The codebase already has established patterns for all these concerns. Copy existing patterns rather than inventing new ones.

## Common Pitfalls

### Pitfall 1: Search Input Focus Issues
**What goes wrong:** Popover steals focus from input, making typing impossible
**Why it happens:** Radix Popover auto-focuses content by default
**How to avoid:** Set `onOpenAutoFocus={(e) => e.preventDefault()}` on PopoverContent
**Warning signs:** Can't type more than one character before focus jumps

### Pitfall 2: Search Debounce Causing Stale Results
**What goes wrong:** Fast typing shows results for intermediate queries
**Why it happens:** Multiple API calls in flight, responses arrive out of order
**How to avoid:** Cancel previous fetch with AbortController or compare query versions
**Warning signs:** Results flash or show wrong data after fast typing

### Pitfall 3: Notification Badge Flicker
**What goes wrong:** Badge count flickers between 0 and actual count on navigation
**Why it happens:** Component remounts, state resets before fetch completes
**How to avoid:** Consider lifting notification state to layout level OR cache results
**Warning signs:** Badge shows 0 briefly when navigating between pages

### Pitfall 4: Empty State in Popover
**What goes wrong:** Popover renders as tiny box when no results
**Why it happens:** No min-height or empty state handling
**How to avoid:** Always render meaningful empty state with helpful message
**Warning signs:** Popover opens to a 10px sliver

### Pitfall 5: Keyboard Navigation Conflicts
**What goes wrong:** Arrow keys scroll page instead of navigating results
**Why it happens:** Missing keyboard event handling
**How to avoid:** Use Radix's built-in keyboard navigation via aria roles
**Warning signs:** Arrow keys don't work, only mouse clicks

## Code Examples

### Example 1: Debounced Search Hook
```typescript
// Simple debounce hook - no external dependency needed
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}

// Usage in component:
const [searchQuery, setSearchQuery] = useState('')
const debouncedQuery = useDebounce(searchQuery, 300)

useEffect(() => {
  if (debouncedQuery) {
    fetch(`/api/initiatives/search?q=${encodeURIComponent(debouncedQuery)}`)
      .then(res => res.json())
      .then(setResults)
  } else {
    setResults([])
  }
}, [debouncedQuery])
```

### Example 2: Notification Categories Query
```typescript
// API route pattern combining status and date criteria
// Matches context decision: "Overdue + At Risk status + Due within 7 days"
const today = new Date()
today.setHours(0, 0, 0, 0)
const sevenDaysLater = new Date(today)
sevenDaysLater.setDate(sevenDaysLater.getDate() + 7)

const [overdue, atRisk, dueSoon] = await Promise.all([
  // Overdue: endDate < today AND not completed/cancelled
  prisma.initiative.findMany({
    where: {
      endDate: { lt: today },
      status: { notIn: ['COMPLETED', 'CANCELLED'] }
    },
    orderBy: { endDate: 'asc' }
  }),
  // At Risk: status = AT_RISK
  prisma.initiative.findMany({
    where: { status: 'AT_RISK' },
    orderBy: { endDate: 'asc' }
  }),
  // Due Soon: endDate within 7 days AND not overdue
  prisma.initiative.findMany({
    where: {
      endDate: { gte: today, lte: sevenDaysLater },
      status: { notIn: ['COMPLETED', 'CANCELLED', 'AT_RISK'] }
    },
    orderBy: { endDate: 'asc' }
  })
])
```

### Example 3: Search Popover Structure
```typescript
// Using existing Popover + ScrollArea components
<Popover open={isOpen} onOpenChange={setIsOpen}>
  <PopoverTrigger asChild>
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setIsOpen(true)}
        placeholder="Search initiatives..."
        className="w-64 pl-9"
      />
    </div>
  </PopoverTrigger>
  <PopoverContent
    className="w-80 p-0"
    onOpenAutoFocus={(e) => e.preventDefault()}
    align="start"
  >
    <ScrollArea className="max-h-80">
      {results.length === 0 ? (
        <div className="p-4 text-center text-sm text-gray-500">
          No results for "{query}"
        </div>
      ) : (
        <div className="p-1">
          {results.map((item) => (
            <Link
              key={item.id}
              href={`/initiatives/${item.id}`}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 p-2 rounded hover:bg-gray-100"
            >
              <span className="flex-1 truncate">{item.title}</span>
              <Badge className={getStatusColor(item.status)}>
                {formatStatus(item.status)}
              </Badge>
            </Link>
          ))}
        </div>
      )}
    </ScrollArea>
  </PopoverContent>
</Popover>
```

### Example 4: Notification Bell with Badge
```typescript
// Replacing hardcoded "3" with dynamic count
<Popover>
  <PopoverTrigger asChild>
    <Button variant="ghost" size="icon" className="relative">
      <Bell className="h-5 w-5 text-gray-600" />
      {totalCount > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
          {totalCount > 99 ? '99+' : totalCount}
        </span>
      )}
    </Button>
  </PopoverTrigger>
  <PopoverContent className="w-80 p-0" align="end">
    <ScrollArea className="max-h-96">
      {/* Grouped sections: Overdue, At Risk, Due Soon */}
      {overdue.length > 0 && (
        <NotificationSection title="Overdue" items={overdue} type="overdue" />
      )}
      {atRisk.length > 0 && (
        <NotificationSection title="At Risk" items={atRisk} type="at-risk" />
      )}
      {dueSoon.length > 0 && (
        <NotificationSection title="Due Soon" items={dueSoon} type="due-soon" />
      )}
      {totalCount === 0 && (
        <div className="p-6 text-center text-sm text-gray-500">
          No items need attention
        </div>
      )}
    </ScrollArea>
  </PopoverContent>
</Popover>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Global search page | Inline search popover | Modern UX standard | Stay on current page |
| Static notification count | Dynamic API-driven count | Always | Real-time awareness |
| Modal dialogs | Popover dropdowns | Radix/shadcn era | Lighter UX, less disruptive |

**Already using current approaches:** The codebase uses modern patterns with Radix primitives and shadcn/ui.

## Open Questions

1. **Search result limit**
   - What we know: Context says Claude's discretion
   - Recommendation: 8-10 results with "View all results" link to initiatives page with search pre-filled

2. **Notification refresh interval**
   - What we know: Not specified in context
   - Recommendation: Fetch on mount + every 60 seconds, or on window focus

3. **Notification scope**
   - What we know: Context says Claude's discretion (all vs user's only)
   - Recommendation: All initiatives (no user auth yet based on prior decisions)

## Sources

### Primary (HIGH confidence)
- Codebase inspection of `/src/components/layout/header.tsx` - Current header structure
- Codebase inspection of `/src/components/ui/popover.tsx` - Available Popover component
- Codebase inspection of `/src/app/api/dashboard/stats/route.ts` - Date query patterns
- Codebase inspection of `/src/components/kanban/kanban-board.tsx` - Date filter logic
- Codebase inspection of `/prisma/schema.prisma` - Initiative model with status and endDate fields

### Secondary (MEDIUM confidence)
- Codebase inspection of `/src/components/kanban/kanban-filter-bar.tsx` - Search input pattern

### Tertiary (LOW confidence)
- None - all findings verified against codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Verified all packages exist in package.json
- Architecture: HIGH - Patterns verified against existing codebase
- Pitfalls: HIGH - Based on established React/Radix patterns

**Research date:** 2026-01-20
**Valid until:** 2026-02-20 (stable patterns, unlikely to change)

---

## Key Implementation Notes for Planner

1. **Files to Modify:**
   - `/src/components/layout/header.tsx` - Main changes go here
   - May need to create new components in `/src/components/layout/` for search/notifications

2. **New API Routes Needed:**
   - `/api/initiatives/search` - Returns filtered initiatives for search
   - `/api/notifications` - Returns grouped overdue/at-risk/due-soon items

3. **Existing Utilities to Reuse:**
   - `formatStatus()`, `getStatusColor()` from `/src/lib/utils.ts`
   - `formatDate()` from `/src/lib/utils.ts`

4. **Phase 1 Dependency Met:**
   - `/initiatives/[id]` route exists, notifications can link to it

5. **Context Decisions to Follow:**
   - Instant search with debounce
   - Search scope: all text fields
   - Results in dropdown (not new page)
   - Keyboard navigation required
   - Badge shows total count (no cap mentioned, but 99+ is sensible)
   - Items grouped by type in bell popover
