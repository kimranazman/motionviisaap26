# Phase 24: Dashboard Customization UI - Research

**Researched:** 2026-01-23
**Domain:** Drag-drop grid layouts, user preferences persistence, date filtering
**Confidence:** HIGH

## Summary

This research investigates the optimal approach for implementing a customizable dashboard with drag-drop widget positioning, resizing, and persistent layouts. The project already has `@dnd-kit` installed (v6.3.1) for Kanban boards, but react-grid-layout emerges as the better choice for dashboard grids with resize support.

**Key findings:**
1. **react-grid-layout v2** is the standard for React dashboard widgets - it provides drag-drop, resize, responsive breakpoints, and collision/compaction out of the box
2. The existing `@dnd-kit` is excellent for list/Kanban sorting but lacks built-in grid layout and resize capabilities
3. Project already has infrastructure: UserPreferences model, AdminDefaults model, debounce hook, Sheet component, Calendar component
4. Sonner (toast library) should be added for undo notifications - currently marked as TODO in pipeline-board.tsx

**Primary recommendation:** Install `react-grid-layout` for the dashboard grid system; use existing Sheet component for widget bank sidebar; implement undo with sonner toast actions; extend existing date picker for dashboard filter.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-grid-layout | ^2.0.0 | Dashboard grid with drag-drop and resize | Purpose-built for dashboards, includes responsive breakpoints, TypeScript support in v2 |
| sonner | ^1.7.0 | Toast notifications with undo actions | shadcn/ui ecosystem standard, clean API for action buttons |
| date-fns | ^4.1.0 (existing) | Date calculations for presets | Already installed, handles MTD/QTD/YTD calculations |

### Supporting (Already Installed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @radix-ui/react-dialog (Sheet) | existing | Widget bank sidebar | Slide-out panel from right |
| react-day-picker | existing | Date range selection | Extend for date filter UI |
| @dnd-kit/core | 6.3.1 | Drag from widget bank | Use for dragging widgets from bank to grid |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-grid-layout | @dnd-kit alone | Would require building grid logic, resize handles, compaction from scratch |
| react-grid-layout | gridstack.js | gridstack has weaker React integration (external bindings) |
| sonner | react-toastify | sonner is shadcn/ui standard, smaller bundle, better action button support |

**Installation:**
```bash
npm install react-grid-layout sonner
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/
│   ├── dashboard/
│   │   ├── dashboard-grid.tsx       # Main grid container using react-grid-layout
│   │   ├── dashboard-header.tsx     # Actions: date filter, undo, reset, customize
│   │   ├── widget-bank.tsx          # Sheet sidebar with available widgets
│   │   ├── widget-wrapper.tsx       # Common wrapper for all widgets (handles resize handles)
│   │   ├── date-range-filter.tsx    # Global date filter with presets
│   │   └── [existing widgets]       # kpi-cards.tsx, status-chart.tsx, etc.
│   └── ui/
│       └── toaster.tsx              # Sonner Toaster provider
├── lib/
│   ├── widgets/
│   │   ├── registry.ts              # (existing) Widget definitions
│   │   ├── defaults.ts              # (existing) AdminDefaults utilities
│   │   ├── permissions.ts           # (existing) Role-based filtering
│   │   └── layout-utils.ts          # New: layout manipulation helpers
│   └── hooks/
│       ├── use-debounce.ts          # (existing) Debounce hook
│       ├── use-dashboard-layout.ts  # New: Layout state + persistence
│       └── use-undo-history.ts      # New: Undo stack management
├── types/
│   └── dashboard.ts                 # (existing) Extend with new types
└── app/
    ├── (dashboard)/
    │   └── page.tsx                 # Convert to use dashboard-grid
    └── api/
        └── user/
            └── preferences/
                └── route.ts         # New: User preferences API
```

### Pattern 1: Layout State Management with Undo
**What:** Custom hook managing layout state with undo history
**When to use:** Dashboard grid state that needs undo/redo capability
**Example:**
```typescript
// Source: Custom pattern based on use-debounce + history stack
interface LayoutState {
  current: DashboardLayout;
  history: DashboardLayout[];
  historyIndex: number;
}

function useDashboardLayout(initialLayout: DashboardLayout) {
  const [state, setState] = useState<LayoutState>({
    current: initialLayout,
    history: [initialLayout],
    historyIndex: 0,
  });

  const updateLayout = useCallback((newLayout: DashboardLayout) => {
    setState(prev => {
      // Trim future history if we branched
      const newHistory = prev.history.slice(0, prev.historyIndex + 1);
      newHistory.push(newLayout);
      // Keep last N entries (e.g., 20)
      if (newHistory.length > 20) newHistory.shift();
      return {
        current: newLayout,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    });
  }, []);

  const undo = useCallback(() => {
    setState(prev => {
      if (prev.historyIndex <= 0) return prev;
      const newIndex = prev.historyIndex - 1;
      return {
        ...prev,
        current: prev.history[newIndex],
        historyIndex: newIndex,
      };
    });
  }, []);

  const canUndo = state.historyIndex > 0;
  return { layout: state.current, updateLayout, undo, canUndo };
}
```

### Pattern 2: react-grid-layout Responsive Setup
**What:** Responsive grid configuration with disabled drag on mobile
**When to use:** Dashboard component initialization
**Example:**
```typescript
// Source: react-grid-layout v2 API
'use client';

import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

const BREAKPOINTS = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 };
const COLS = { lg: 12, md: 12, sm: 6, xs: 4, xxs: 2 };

interface DashboardGridProps {
  layout: WidgetConfig[];
  onLayoutChange: (layout: WidgetConfig[]) => void;
  isEditMode: boolean;
}

export function DashboardGrid({ layout, onLayoutChange, isEditMode }: DashboardGridProps) {
  // Disable drag/resize on mobile (xs, xxs)
  const [currentBreakpoint, setCurrentBreakpoint] = useState<string>('lg');
  const isMobile = ['xs', 'xxs'].includes(currentBreakpoint);

  return (
    <ResponsiveGridLayout
      layouts={{ lg: layout, md: layout, sm: layout, xs: layout, xxs: layout }}
      breakpoints={BREAKPOINTS}
      cols={COLS}
      rowHeight={100}
      onLayoutChange={(newLayout, allLayouts) => onLayoutChange(newLayout)}
      onBreakpointChange={(bp) => setCurrentBreakpoint(bp)}
      isDraggable={isEditMode && !isMobile}
      isResizable={isEditMode && !isMobile}
      compactType="vertical"  // Push items down (Notion-style)
      preventCollision={false}
      margin={[16, 16]}
    >
      {/* Widgets rendered here */}
    </ResponsiveGridLayout>
  );
}
```

### Pattern 3: Auto-Save with Debounce and Toast
**What:** Save layout changes with debounce, show undo toast
**When to use:** Every layout modification
**Example:**
```typescript
// Source: Combined patterns from use-debounce + sonner
import { toast } from 'sonner';
import { useDebounce } from '@/lib/hooks/use-debounce';

function usePersistLayout(layout: DashboardLayout, onUndo: () => void) {
  const debouncedLayout = useDebounce(layout, 1000); // 1 second delay
  const prevLayoutRef = useRef<string>('');

  useEffect(() => {
    const serialized = JSON.stringify(debouncedLayout);
    if (serialized === prevLayoutRef.current) return;
    prevLayoutRef.current = serialized;

    // Save to API
    fetch('/api/user/preferences', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dashboardLayout: debouncedLayout }),
    }).then(() => {
      toast('Layout saved', {
        action: {
          label: 'Undo',
          onClick: onUndo,
        },
        duration: 5000,
      });
    });
  }, [debouncedLayout, onUndo]);
}
```

### Pattern 4: Widget Bank with Categories
**What:** Sheet sidebar showing available widgets grouped by category
**When to use:** Opening widget bank to add/remove widgets
**Example:**
```typescript
// Source: Uses existing Sheet component + WIDGET_REGISTRY
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { WIDGET_REGISTRY } from '@/lib/widgets/registry';
import { ScrollArea } from '@/components/ui/scroll-area';

interface WidgetBankProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentWidgetIds: string[];
  onAddWidget: (widgetId: string) => void;
  onRemoveWidget: (widgetId: string) => void;
}

export function WidgetBank({ open, onOpenChange, currentWidgetIds, onAddWidget, onRemoveWidget }: WidgetBankProps) {
  const widgetsByCategory = useMemo(() => {
    const grouped: Record<string, WidgetDefinition[]> = {};
    Object.values(WIDGET_REGISTRY).forEach(widget => {
      if (!grouped[widget.category]) grouped[widget.category] = [];
      grouped[widget.category].push(widget);
    });
    return grouped;
  }, []);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-80">
        <SheetHeader>
          <SheetTitle>Widget Bank</SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-8rem)] mt-4">
          {Object.entries(widgetsByCategory).map(([category, widgets]) => (
            <div key={category} className="mb-6">
              <h3 className="text-sm font-medium text-gray-500 uppercase mb-2">
                {category}
              </h3>
              {widgets.map(widget => {
                const isOnDashboard = currentWidgetIds.includes(widget.id);
                return (
                  <WidgetBankItem
                    key={widget.id}
                    widget={widget}
                    isOnDashboard={isOnDashboard}
                    onAdd={() => onAddWidget(widget.id)}
                    onRemove={() => onRemoveWidget(widget.id)}
                  />
                );
              })}
            </div>
          ))}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
```

### Anti-Patterns to Avoid
- **Don't use `data-grid` attribute for dynamic layouts**: Always pass `layout` prop to react-grid-layout for controlled layouts
- **Don't skip CSS imports**: Missing `react-grid-layout/css/styles.css` or `react-resizable/css/styles.css` causes invisible resize handles
- **Don't render during SSR**: react-grid-layout requires browser APIs; always use `'use client'` and wait for mount
- **Don't save on every change without debounce**: Will hammer the API; use 500-1000ms debounce
- **Don't use `compactType="horizontal"` for dashboard grids**: Vertical compaction (push down) is more intuitive for dashboards

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Grid drag-drop with resize | Custom CSS Grid + event handlers | react-grid-layout | Handles collision detection, compaction, responsive breakpoints, resize handles |
| Responsive breakpoints | Media queries + manual layout switching | react-grid-layout Responsive component | Already handles breakpoint detection, column changes, layout per breakpoint |
| Undo history | Manual array manipulation | Simple history stack pattern | Edge cases: branching, memory limits, state sync |
| Toast with undo | Alert or custom modal | sonner with action | Battle-tested, accessible, auto-dismiss with action button |
| Date presets (MTD/QTD/YTD) | Hard-coded date math | date-fns helpers | startOfMonth, startOfQuarter, startOfYear + edge cases |
| Collision detection | Manual rect intersection | react-grid-layout compactor | Handles vertical/horizontal compaction correctly |

**Key insight:** react-grid-layout provides the complete dashboard grid solution including features that seem simple but have edge cases: resize handle UI, collision during drag, responsive column changes, and compaction algorithms.

## Common Pitfalls

### Pitfall 1: Hydration Mismatch with SSR
**What goes wrong:** react-grid-layout uses window dimensions; SSR renders different HTML than client
**Why it happens:** Server doesn't have window object; layout computed differently
**How to avoid:**
1. Always mark dashboard grid component with `'use client'`
2. Use mounted state pattern: `if (!mounted) return <Skeleton />`
3. Or use Next.js dynamic import: `dynamic(() => import('./grid'), { ssr: false })`
**Warning signs:** Console error "Hydration failed because the initial UI does not match"

### Pitfall 2: Missing CSS Styles
**What goes wrong:** Grid items stack on top of each other, no resize handles visible
**Why it happens:** CSS files not imported
**How to avoid:** Import both CSS files at component top:
```typescript
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
```
**Warning signs:** Items overlap, no visual drag/resize affordances

### Pitfall 3: Layout Reset on Page Load
**What goes wrong:** User's saved layout reverts to default after refresh
**Why it happens:** State initialized before localStorage/API fetch completes
**How to avoid:**
1. Fetch saved layout server-side in page.tsx
2. Pass as prop to client component
3. Don't initialize state until data loaded
**Warning signs:** Layout "flickers" to default then back to saved

### Pitfall 4: Excessive API Calls on Drag
**What goes wrong:** Every pixel of movement triggers save API call
**Why it happens:** Using onLayoutChange directly without debounce
**How to avoid:** Debounce layout changes (500-1000ms) before API call
**Warning signs:** Network tab shows dozens of requests during single drag

### Pitfall 5: Mobile Touch Conflicts
**What goes wrong:** User can't scroll page because touch is captured by grid
**Why it happens:** Touch events being used for drag
**How to avoid:** Disable drag/resize on mobile breakpoints (xs, xxs)
**Warning signs:** Page won't scroll on mobile devices

### Pitfall 6: Widget Bank Drag vs Click Confusion
**What goes wrong:** User tries to drag widget from bank but nothing happens
**Why it happens:** @dnd-kit drag and react-grid-layout are separate systems
**How to avoid:** Use click-to-add as primary; drag-to-add as enhancement using @dnd-kit DragOverlay
**Warning signs:** Inconsistent behavior when trying to add widgets

## Code Examples

Verified patterns from official sources:

### Date Range Presets with date-fns
```typescript
// Source: date-fns library patterns
import {
  startOfMonth, startOfQuarter, startOfYear,
  subDays, subMonths, format
} from 'date-fns';

export type DatePreset =
  | 'last7days' | 'last30days' | 'last90days'
  | 'mtd' | 'qtd' | 'ytd' | 'custom';

export function getDateRangeFromPreset(preset: DatePreset): { start: Date; end: Date } {
  const today = new Date();

  switch (preset) {
    case 'last7days':
      return { start: subDays(today, 7), end: today };
    case 'last30days':
      return { start: subDays(today, 30), end: today };
    case 'last90days':
      return { start: subDays(today, 90), end: today };
    case 'mtd':
      return { start: startOfMonth(today), end: today };
    case 'qtd':
      return { start: startOfQuarter(today), end: today };
    case 'ytd':
      return { start: startOfYear(today), end: today };
    default:
      return { start: subDays(today, 30), end: today };
  }
}
```

### Sonner Toast Setup for Next.js App Router
```typescript
// app/layout.tsx or providers.tsx
import { Toaster } from 'sonner';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster position="bottom-right" richColors />
    </>
  );
}

// Usage in component
import { toast } from 'sonner';

toast('Layout saved', {
  action: {
    label: 'Undo',
    onClick: () => handleUndo(),
  },
  duration: 5000,
});
```

### User Preferences API Route
```typescript
// app/api/user/preferences/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import type { DashboardLayout, DateFilter } from '@/types/dashboard';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const prefs = await prisma.userPreferences.findUnique({
    where: { userId: session.user.id },
  });

  return NextResponse.json({
    dashboardLayout: prefs?.dashboardLayout ?? null,
    dateFilter: prefs?.dateFilter ?? null,
  });
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { dashboardLayout, dateFilter } = body as {
    dashboardLayout?: DashboardLayout;
    dateFilter?: DateFilter;
  };

  const data: Record<string, unknown> = {};
  if (dashboardLayout !== undefined) data.dashboardLayout = dashboardLayout;
  if (dateFilter !== undefined) data.dateFilter = dateFilter;

  await prisma.userPreferences.upsert({
    where: { userId: session.user.id },
    update: data,
    create: {
      userId: session.user.id,
      ...data,
    },
  });

  return NextResponse.json({ success: true });
}
```

### react-grid-layout WidthProvider with SSR Guard
```typescript
// Source: react-grid-layout v2 + Next.js pattern
'use client';

import { useState, useEffect } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

export function DashboardGridSafe(props: DashboardGridProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <DashboardSkeleton />;
  }

  return <DashboardGridInner {...props} />;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| react-grid-layout v1 (Flow types) | v2 (TypeScript, hooks API) | 2025 | Full TS support, no @types needed, new hooks |
| WidthProvider HOC only | useContainerWidth hook | v2 | More flexible width management |
| lodash debounce | use-debounce library or custom hook | 2024 | Better React integration, cleanup |
| Custom toast components | sonner | 2024 | Industry standard for shadcn/ui projects |

**Deprecated/outdated:**
- **react-grid-layout v1 API**: Still works via `react-grid-layout/legacy` but v2 hooks API is preferred
- **@types/react-grid-layout**: v2 includes its own types, package no longer needed
- **jQuery-based grid libraries**: gridster.js, packery - use React-native solutions instead

## Open Questions

Things that couldn't be fully resolved:

1. **Duplicate widgets with different date filters**
   - What we know: CONTEXT.md says allow duplicates with different date ranges
   - What's unclear: How to distinguish duplicate widget instances in layout (same widget ID)
   - Recommendation: Use instance ID (uuid) separate from widget type ID. Layout uses instance ID; widget type determines component to render.

2. **Admin default update notification**
   - What we know: CONTEXT.md mentions "notify customized users via banner when admin updates default"
   - What's unclear: Implementation mechanism (polling? websocket? next request?)
   - Recommendation: Add `adminLayoutVersion` timestamp to AdminDefaults; compare on page load; show banner if user's savedLayoutVersion < adminLayoutVersion

## Sources

### Primary (HIGH confidence)
- [react-grid-layout GitHub](https://github.com/react-grid-layout/react-grid-layout) - Full API documentation, v2 features
- [sonner GitHub](https://github.com/emilkowalski/sonner) - Toast with action buttons
- [shadcn/ui Sonner docs](https://ui.shadcn.com/docs/components/sonner) - Integration pattern

### Secondary (MEDIUM confidence)
- [ilert blog: Why React-Grid-Layout](https://www.ilert.com/blog/building-interactive-dashboards-why-react-grid-layout-was-our-best-choice) - Real-world comparison with alternatives
- [npm trends comparison](https://npmtrends.com/@dnd-kit/core-vs-react-dnd-vs-react-grid-layout) - Library popularity
- [Debounce patterns blog](https://www.developerway.com/posts/debouncing-in-react) - React debounce best practices

### Tertiary (LOW confidence)
- Various GitHub issues for edge cases (hydration, mobile touch)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - react-grid-layout is clearly the standard for dashboard grids with resize
- Architecture: HIGH - Patterns verified against official docs and existing codebase
- Pitfalls: HIGH - Common issues well-documented in GitHub issues

**Research date:** 2026-01-23
**Valid until:** 30 days (react-grid-layout v2 is stable; sonner is stable)
