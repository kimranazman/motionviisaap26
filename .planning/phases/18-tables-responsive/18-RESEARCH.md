# Phase 18: Tables Responsive - Research

**Researched:** 2026-01-23
**Domain:** Responsive data tables, mobile column visibility, touch-friendly actions
**Confidence:** HIGH

## Summary

This phase makes all data tables (Companies, Contacts, Projects, Costs, Initiatives list) work effectively on mobile devices. The project already has established responsive patterns from Phases 16-17 using TailwindCSS responsive utilities (`md:` at 768px). The tables currently use shadcn/ui Table components without responsive column visibility.

The standard approach for responsive tables involves:
1. **Priority Columns Pattern** - Show essential columns (name, status, key metric) on mobile, hide secondary columns using `hidden md:table-cell`
2. **Consistent Column Priority** - Same pattern across all tables: primary identifier always visible, secondary data hidden on mobile
3. **Touch-Friendly Actions** - Make row actions accessible via visible MoreHorizontal button (not hover-only)
4. **Responsive Filters** - Horizontal scroll or collapse filters on mobile

**Primary recommendation:** Use CSS-only responsive column hiding (`hidden md:table-cell`) combined with always-visible action buttons on mobile (`md:opacity-0 md:group-hover:opacity-100`). This approach is already established in Phase 17 for Kanban cards and provides consistent UX across the app.

## Standard Stack

### Core (Already in Project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Tailwind CSS | 3.4.1 | Responsive utilities | `hidden md:table-cell` for column visibility |
| shadcn/ui Table | (Radix) | Table components | Already in use for all tables |
| shadcn/ui DropdownMenu | (Radix) | Row actions | Already in project, touch-friendly |
| Lucide React | 0.562.0 | Action icons | MoreHorizontal, Eye, Edit2, Trash2 |

### Supporting (May Need)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| N/A | | | All needed components already present |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Hidden columns | Card layout on mobile | Cards require duplicate UI; columns simpler for this app |
| Hidden columns | Horizontal scroll only | User loses context; priority columns better UX |
| Individual row actions | Swipe actions | Requires additional library; dropdown is sufficient |

**Installation:**
No new packages needed. All functionality available in existing stack.

## Architecture Patterns

### Recommended Project Structure
```
src/
components/
  companies/
    company-list.tsx         # UPDATE: Add responsive column visibility
  initiatives/
    initiatives-list.tsx     # UPDATE: Add responsive column visibility
  admin/
    user-list.tsx           # UPDATE: Add responsive column visibility
  projects/
    cost-card.tsx           # UPDATE: Touch-friendly actions (already okay)
```

### Pattern 1: Priority Column Visibility
**What:** Hide secondary columns on mobile using Tailwind responsive utilities
**When to use:** All table headers and cells for non-essential columns
**Example:**
```typescript
// Source: Tailwind CSS responsive utilities
// TableHead and TableCell for secondary columns
<TableHead className="hidden md:table-cell">Industry</TableHead>
<TableCell className="hidden md:table-cell">
  {company.industry || '-'}
</TableCell>

// Primary columns stay visible (no hidden class)
<TableHead>Name</TableHead>
<TableCell>
  <div className="flex items-center gap-3">
    {/* Primary content always visible */}
  </div>
</TableCell>
```

### Pattern 2: Touch-Friendly Row Actions
**What:** Make action buttons visible on mobile, hover-only on desktop
**When to use:** All table rows with edit/delete/view actions
**Example:**
```typescript
// Source: Phase 17 Kanban pattern
// Actions column - always visible on mobile, hover on desktop
<TableCell>
  <div className="flex items-center justify-end gap-1">
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-8 w-8",
            // Mobile: always visible; Desktop: show on row hover
            "md:opacity-0 md:group-hover:opacity-100",
            "focus:opacity-100 transition-opacity"
          )}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleView}>
          <Eye className="h-4 w-4 mr-2" />
          View
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleEdit}>
          <Edit2 className="h-4 w-4 mr-2" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleDelete}
          className="text-red-600 focus:text-red-600"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
</TableCell>

// Add group class to TableRow for hover detection
<TableRow className="group cursor-pointer hover:bg-gray-50">
```

### Pattern 3: Responsive Filter/Search Bar
**What:** Stack filters on mobile, horizontal on tablet+
**When to use:** Filter toolbars above tables
**Example:**
```typescript
// Source: Existing company-list.tsx toolbar pattern
// Toolbar - stack on mobile, row on tablet+
<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
  <div className="flex flex-col sm:flex-row flex-1 items-stretch sm:items-center gap-3 sm:gap-4">
    {/* Search input - full width on mobile */}
    <div className="relative flex-1 sm:max-w-sm">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <Input
        placeholder="Search..."
        className="pl-9 w-full"
      />
    </div>

    {/* Filter select - full width on mobile, fixed on tablet+ */}
    <Select value={filter} onValueChange={setFilter}>
      <SelectTrigger className="w-full sm:w-40">
        <Filter className="mr-2 h-4 w-4" />
        <SelectValue placeholder="Filter" />
      </SelectTrigger>
      <SelectContent>
        {/* options */}
      </SelectContent>
    </Select>
  </div>

  {/* Add button */}
  <Button className="w-full sm:w-auto">
    <Plus className="mr-2 h-4 w-4" />
    Add Item
  </Button>
</div>
```

### Pattern 4: Compact Primary Column with Metadata on Mobile
**What:** Combine related info in primary column to reduce needed columns
**When to use:** When hiding columns would lose critical context
**Example:**
```typescript
// Instead of separate Name and Status columns on mobile,
// show status badge inline with name
<TableCell>
  <div className="flex items-center gap-3">
    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 shrink-0">
      <Building2 className="h-4 w-4 text-gray-600" />
    </div>
    <div className="min-w-0">
      <div className="flex items-center gap-2">
        <p className="font-medium text-gray-900 truncate">{name}</p>
        {/* Show badge on mobile to preserve status info */}
        <Badge className="md:hidden" variant="secondary">
          {status}
        </Badge>
      </div>
      {/* Subtitle visible on all sizes */}
      <p className="text-sm text-gray-500 truncate">{subtitle}</p>
    </div>
  </div>
</TableCell>

{/* Separate status column visible only on tablet+ */}
<TableCell className="hidden md:table-cell">
  <Badge>{status}</Badge>
</TableCell>
```

### Anti-Patterns to Avoid
- **Hiding too many columns:** Mobile should still have enough context. Keep 2-3 columns minimum.
- **Horizontal scroll as only solution:** Users lose context when scrolling; priority columns are better.
- **Hover-only actions on mobile:** Touch has no hover. Make actions visible or use tap.
- **Fixed-width columns on mobile:** Use responsive widths or let columns auto-size.
- **Inconsistent column priority across tables:** Same type of data (name, status, actions) should behave same way.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Column visibility toggle | JavaScript breakpoint detection | `hidden md:table-cell` | CSS is SSR-safe, no hydration issues |
| Row action menu | Custom tap/long-press handler | shadcn/ui DropdownMenu | Handles accessibility, positioning |
| Mobile-specific table | Separate mobile component | Responsive classes on same component | Maintainability, single source of truth |
| Swipe to reveal actions | Custom gesture handler | Visible action button | Simpler, discoverable, no library needed |

**Key insight:** The responsive column pattern is purely CSS-based, making it safe for SSR and requiring no JavaScript for basic show/hide behavior.

## Common Pitfalls

### Pitfall 1: Actions Inaccessible on Mobile
**What goes wrong:** Users can't edit/delete table rows on mobile
**Why it happens:** Action buttons only appear on hover; touch devices have no hover
**How to avoid:** Use `md:opacity-0 md:group-hover:opacity-100` pattern - visible on mobile, hover on desktop
**Warning signs:** Users report they can't find edit/delete buttons on phone

### Pitfall 2: Too Few Columns on Mobile
**What goes wrong:** Users can't identify rows or make decisions from table
**Why it happens:** Hiding too many columns leaves insufficient context
**How to avoid:** Keep primary identifier + status/key metric + actions visible
**Warning signs:** Users constantly need to tap into detail view for basic info

### Pitfall 3: Filter Controls Don't Fit
**What goes wrong:** Search and filter controls overflow on mobile
**Why it happens:** Multiple controls side-by-side don't fit 320px width
**How to avoid:** Stack controls vertically on mobile (`flex-col sm:flex-row`)
**Warning signs:** Filter buttons cut off, search input truncated

### Pitfall 4: Inconsistent Column Priority Across Tables
**What goes wrong:** User learns pattern on one table, different table behaves differently
**Why it happens:** Each table implemented independently without shared pattern
**How to avoid:** Define column priority rules and apply consistently:
  - Always visible: Primary identifier (name/title), Actions
  - Hidden on mobile: Dates, counts, secondary metadata
  - Conditionally visible: Status (inline or separate column)
**Warning signs:** User confusion about where to find information

### Pitfall 5: Table Summary Breaks on Mobile
**What goes wrong:** "Showing X of Y items" text wraps awkwardly
**Why it happens:** No responsive text handling
**How to avoid:** Use shorter text on mobile or move summary below table
**Warning signs:** Layout shift, text overlapping other elements

### Pitfall 6: Empty State Not Mobile-Friendly
**What goes wrong:** Empty table message and CTA button don't fit mobile
**Why it happens:** Hardcoded widths, horizontal layout in empty state
**How to avoid:** Ensure empty state uses full width, centered, stacked layout
**Warning signs:** "Add first item" button cut off or too small

## Code Examples

Verified patterns from official sources:

### Complete Responsive Table Implementation
```typescript
// Source: Tailwind responsive utilities + Phase 17 patterns
'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MoreHorizontal, Eye, Edit2, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ResponsiveTable({ items, onView, onEdit, onDelete }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {/* Primary - Always visible */}
          <TableHead>Name</TableHead>
          {/* Secondary - Hidden on mobile */}
          <TableHead className="hidden md:table-cell w-32">Category</TableHead>
          <TableHead className="hidden md:table-cell w-24 text-center">Count</TableHead>
          <TableHead className="hidden md:table-cell w-32">Date</TableHead>
          {/* Actions - Always visible, narrow width */}
          <TableHead className="w-16">
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow
            key={item.id}
            className="group cursor-pointer hover:bg-gray-50"
            onClick={() => onView(item)}
          >
            {/* Primary column with mobile-friendly metadata */}
            <TableCell>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 shrink-0">
                  <item.icon className="h-4 w-4 text-gray-600" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {item.name}
                  </p>
                  {/* Show category on mobile inline */}
                  <p className="text-sm text-gray-500 truncate md:hidden">
                    {item.category}
                  </p>
                </div>
              </div>
            </TableCell>

            {/* Secondary columns - hidden on mobile */}
            <TableCell className="hidden md:table-cell">
              <span className="text-sm text-gray-600">{item.category}</span>
            </TableCell>
            <TableCell className="hidden md:table-cell text-center">
              <span className="text-sm text-gray-600">{item.count}</span>
            </TableCell>
            <TableCell className="hidden md:table-cell">
              <span className="text-sm text-gray-500">{item.date}</span>
            </TableCell>

            {/* Actions column */}
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-8 w-8",
                      "md:opacity-0 md:group-hover:opacity-100",
                      "focus:opacity-100 transition-opacity"
                    )}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Actions</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onView(item)}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onEdit(item)}>
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDelete(item)}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
```

### Responsive Table Toolbar
```typescript
// Source: Existing company-list.tsx pattern, enhanced
export function TableToolbar({ search, onSearchChange, filter, onFilterChange, onAdd }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col sm:flex-row flex-1 items-stretch sm:items-center gap-3">
        {/* Search - full width mobile, constrained desktop */}
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 w-full"
          />
        </div>

        {/* Filter - full width mobile, auto desktop */}
        <Select value={filter} onValueChange={onFilterChange}>
          <SelectTrigger className="w-full sm:w-44">
            <Filter className="mr-2 h-4 w-4 shrink-0" />
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {/* filter options */}
          </SelectContent>
        </Select>
      </div>

      {/* Add button - full width mobile */}
      <Button onClick={onAdd} className="w-full sm:w-auto">
        <Plus className="mr-2 h-4 w-4" />
        <span className="sm:hidden">Add</span>
        <span className="hidden sm:inline">Add Item</span>
      </Button>
    </div>
  )
}
```

### Column Priority Matrix by Table

```typescript
// Reference for implementing consistent column visibility
const COLUMN_PRIORITY = {
  // Companies Table
  companies: {
    alwaysVisible: ['Name (with icon)', 'Actions'],
    hiddenOnMobile: ['Industry', 'Contacts count', 'Added date'],
    mobileInline: 'Industry shown under name on mobile',
  },

  // Initiatives List Table
  initiatives: {
    alwaysVisible: ['#', 'Initiative title', 'Actions'],
    hiddenOnMobile: ['Key Result', 'Department', 'Status', 'Owner', 'End Date'],
    mobileInline: 'Status badge inline with title',
  },

  // User List (Admin)
  users: {
    alwaysVisible: ['User (avatar + name)', 'Role', 'Actions'],
    hiddenOnMobile: ['Email', 'Joined date'],
    mobileInline: 'Email shown under name on mobile',
  },

  // Projects (currently card layout - optional table view)
  projects: {
    alwaysVisible: ['Title', 'Status', 'Actions'],
    hiddenOnMobile: ['Company', 'Revenue', 'Initiative'],
    mobileInline: 'Company shown under title',
  },

  // Costs (within project detail sheet - already card-based)
  costs: {
    // Uses CostCard component, already mobile-friendly
    // No changes needed - card layout works well on mobile
  },
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Horizontal scroll only | Priority columns + responsive visibility | 2020+ | Better mobile UX, less scrolling |
| Card layout on mobile | Same table with hidden columns | Best practice | Simpler maintenance, consistent |
| Hover-only row actions | Always-visible on mobile triggers | Touch-first design | Accessibility on touch devices |
| JavaScript breakpoint detection | CSS responsive utilities | SSR adoption | No hydration issues |
| 44px touch targets | 48px minimum recommended | WCAG 2.5.8 (2023) | Accessibility compliance |

**Deprecated/outdated:**
- Separate mobile table component: Use responsive classes on single component
- JS-based column toggle: CSS `hidden md:table-cell` is simpler and SSR-safe
- Hover-only interactions: Must provide visible alternatives for touch devices

## Open Questions

Things that couldn't be fully resolved:

1. **Projects page: Table vs Card layout on mobile?**
   - What we know: Currently uses card grid layout, not table
   - What's unclear: Should projects switch to table with priority columns, or keep cards?
   - Recommendation: Keep card layout for projects (already mobile-friendly), focus on tables for Companies, Initiatives, Users

2. **Initiatives: Show status badge inline or in separate column on mobile?**
   - What we know: Status is important context for initiatives
   - What's unclear: Inline badge makes primary column busy; separate column adds clutter
   - Recommendation: Show status inline on mobile (`md:hidden` badge), separate column on tablet+ (`hidden md:table-cell`)

3. **Filter count: Show on mobile?**
   - What we know: "Showing X of Y" is useful context
   - What's unclear: Takes space on mobile, may wrap awkwardly
   - Recommendation: Keep it, but use shorter format on mobile ("X of Y" vs "Showing X of Y companies")

## Sources

### Primary (HIGH confidence)
- [Tailwind CSS Visibility Documentation](https://tailwindcss.com/docs/visibility) - `collapse` utility for tables
- [Tailwind CSS Display Documentation](https://tailwindcss.com/docs/display) - `hidden`, `table-cell` utilities
- [shadcn/ui Table Documentation](https://ui.shadcn.com/docs/components/table) - Base table component
- [shadcn/ui DropdownMenu](https://ui.shadcn.com/docs/components/dropdown-menu) - Row actions pattern
- Phase 16/17 Research - Established responsive patterns for this project

### Secondary (MEDIUM confidence)
- [Tailkits Responsive Tables](https://tailkits.com/blog/tailwind-responsive-tables/) - `hidden md:table-cell` pattern
- [Flowbite Tables](https://flowbite.com/docs/components/tables/) - Table component patterns
- [Pencil & Paper Data Table UX](https://www.pencilandpaper.io/articles/ux-pattern-analysis-enterprise-data-tables) - Mobile table best practices

### Tertiary (LOW confidence)
- [UX Movement Stacked Lists](https://uxmovement.medium.com/) - Alternative mobile pattern (not recommended for this project)
- Community patterns for responsive tables

## Metadata

**Confidence breakdown:**
- Column visibility pattern: HIGH - well-documented CSS pattern, already used in project
- Row actions: HIGH - Pattern established in Phase 17 Kanban
- Filter toolbar: HIGH - Already implemented in company-list.tsx
- Column priority decisions: MEDIUM - Specific to this app's data

**Research date:** 2026-01-23
**Valid until:** 2026-04-23 (3 months - stable patterns)
