# Phase 15: Dashboard Widgets - Research

**Researched:** 2026-01-22
**Domain:** Dashboard data visualization, aggregation queries, recharts integration
**Confidence:** HIGH

## Summary

This phase adds financial and pipeline dashboard widgets to the existing initiative-focused dashboard. The codebase already has all infrastructure needed:

1. **Recharts v3.6.0** is installed and actively used for PieChart (status-chart.tsx) and BarChart (department-chart.tsx) with established patterns
2. **Dashboard page pattern** uses Server Components with data fetching functions returning shaped data for client components
3. **All data models exist** (Deal, Project, Cost) with the relationships needed for aggregations
4. **Utility functions exist** for currency formatting, stage colors, and profit calculation

The dashboard currently shows initiative metrics. Phase 15 adds a new section for CRM/financial metrics: pipeline by stage, total/weighted pipeline, revenue, profit, and win rate. These are additive widgets - the existing initiative dashboard remains unchanged.

**Primary recommendation:** Create a dedicated `/api/dashboard/crm-stats` endpoint that returns all aggregated CRM metrics in a single response, following the existing `/api/dashboard/stats` pattern. Add new widget components to a new CRM section below the existing initiative dashboard.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| recharts | 3.6.0 | Charting | Already installed, established patterns in codebase |
| @radix-ui/react-progress | 1.1.8 | Progress bars | Already used in KPI cards |
| Prisma | 6.19.2 | Database aggregations | groupBy, aggregate, count functions |
| Next.js | 14.2.28 | Server Components | Direct DB access in page, no API round-trip for initial load |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | 0.562.0 | Icons | Dashboard card icons (TrendingUp, DollarSign, etc.) |
| date-fns | 4.1.0 | Date formatting | If date ranges needed in widgets |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| recharts | chart.js | recharts already in codebase, no benefit switching |
| Server Component data | tRPC | overkill for this use case, existing REST pattern works |

**Installation:**
```bash
# No new packages needed - all libraries already installed
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/(dashboard)/
│   └── page.tsx                    # Add CRM section with getCRMDashboardData()
├── components/dashboard/
│   ├── crm-kpi-cards.tsx          # NEW: Pipeline/Revenue/Profit/Win Rate cards
│   ├── pipeline-stage-chart.tsx   # NEW: Horizontal bar chart by stage
│   └── [existing files]           # Keep unchanged
├── lib/
│   ├── pipeline-utils.ts          # ADD: STAGE_PROBABILITY constant
│   └── dashboard-utils.ts         # NEW: Aggregation helper functions
└── api/dashboard/
    └── crm-stats/route.ts         # NEW: API endpoint for client-side refresh
```

### Pattern 1: Server Component Data Fetching
**What:** Fetch aggregated data directly in the Server Component, pass to client widgets
**When to use:** Initial page load - avoids client-side loading states
**Example:**
```typescript
// Source: Existing src/app/(dashboard)/page.tsx pattern
async function getCRMDashboardData() {
  // Pipeline by stage
  const pipelineByStage = await prisma.deal.groupBy({
    by: ['stage'],
    _count: true,
    _sum: { value: true },
    where: { stage: { notIn: ['WON', 'LOST'] } }
  })

  // Revenue from completed projects
  const revenueResult = await prisma.project.aggregate({
    where: { status: 'COMPLETED' },
    _sum: { revenue: true }
  })

  // Total costs from all projects
  const costsResult = await prisma.cost.aggregate({
    _sum: { amount: true }
  })

  // Win rate calculation
  const closedDeals = await prisma.deal.count({
    where: { stage: { in: ['WON', 'LOST'] } }
  })
  const wonDeals = await prisma.deal.count({
    where: { stage: 'WON' }
  })

  return {
    pipelineByStage,
    totalRevenue: Number(revenueResult._sum.revenue) || 0,
    totalCosts: Number(costsResult._sum.amount) || 0,
    winRate: closedDeals > 0 ? Math.round((wonDeals / closedDeals) * 100) : 0
  }
}
```

### Pattern 2: Widget Card Layout
**What:** Consistent KPI card structure with icon, value, subtitle
**When to use:** All summary metrics (pipeline total, revenue, profit, win rate)
**Example:**
```typescript
// Source: Existing src/components/dashboard/kpi-cards.tsx pattern
const kpis = [
  {
    title: 'Open Pipeline',
    value: formatCurrency(openPipelineValue),
    subtitle: `${dealCount} deals`,
    icon: Target,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    title: 'Weighted Forecast',
    value: formatCurrency(weightedValue),
    subtitle: 'Probability-adjusted',
    icon: TrendingUp,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  // ... more cards
]
```

### Pattern 3: Horizontal Bar Chart for Pipeline
**What:** Stacked horizontal bars showing deal count and value per stage
**When to use:** Pipeline by stage visualization (DASH-01)
**Example:**
```typescript
// Source: Existing department-chart.tsx pattern adapted for pipeline
<ResponsiveContainer width="100%" height="100%">
  <BarChart data={stageData} layout="vertical" margin={{ left: 20 }}>
    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
    <XAxis type="number" tick={{ fontSize: 12 }} />
    <YAxis dataKey="name" type="category" width={80} />
    <Tooltip />
    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
      {stageData.map((entry, index) => (
        <Cell key={`cell-${index}`} fill={entry.color} />
      ))}
    </Bar>
  </BarChart>
</ResponsiveContainer>
```

### Anti-Patterns to Avoid
- **Fetching all records then aggregating in JS:** Use Prisma groupBy/aggregate for DB-level computation
- **Separate API calls per widget:** Batch all CRM metrics into single data fetch function
- **Hardcoded stage colors without reuse:** Use existing STAGES constant from pipeline-utils.ts
- **Converting Decimal to number on client:** Do it server-side before JSON response (per prior decision)

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Pipeline stage colors | Custom color map | STAGES from pipeline-utils.ts | Already defined, consistent with Kanban |
| Currency formatting | Inline toLocaleString | formatCurrency from utils.ts | MYR formatting already configured |
| Profit calculation | Inline math | calculateProfit from cost-utils.ts | Already handles null revenue |
| Progress bars | Custom div styling | Progress from @radix-ui | Already in UI components |
| Chart responsiveness | Fixed dimensions | ResponsiveContainer from recharts | Already used in existing charts |

**Key insight:** Every utility needed for this phase already exists in the codebase. The primary work is aggregation queries and widget composition, not creating new utilities.

## Common Pitfalls

### Pitfall 1: Decimal Handling in Aggregations
**What goes wrong:** Prisma returns Decimal objects from _sum aggregations that JSON.stringify doesn't handle
**Why it happens:** Prisma uses Decimal.js for precision, but it's not JSON-serializable
**How to avoid:** Convert to Number immediately after query: `Number(result._sum.value) || 0`
**Warning signs:** "Cannot serialize" errors, NaN in UI, widget values showing as [object Object]

### Pitfall 2: Empty State Division
**What goes wrong:** Win rate shows NaN or Infinity when no deals exist
**Why it happens:** Division by zero when closedDeals = 0
**How to avoid:** Guard clause: `closedDeals > 0 ? Math.round((wonDeals / closedDeals) * 100) : 0`
**Warning signs:** NaN%, Infinity% displayed in widget

### Pitfall 3: Stale Dashboard Data
**What goes wrong:** Dashboard shows outdated numbers after creating deals/projects
**Why it happens:** Server Component data fetched once on initial load
**How to avoid:** For MVP, accept that refresh is needed. For polish, add client-side refetch trigger or use revalidatePath
**Warning signs:** User creates deal, navigates to dashboard, doesn't see it

### Pitfall 4: Stage Order in Chart
**What goes wrong:** Pipeline chart shows stages in wrong order (LOST, LEAD, NEGOTIATION...)
**Why it happens:** groupBy returns results in arbitrary order
**How to avoid:** Map results to ordered STAGES constant, fill in zeros for missing stages
**Warning signs:** Visual inconsistency between Kanban column order and chart bar order

### Pitfall 5: Weighted Value Excluding Won Deals
**What goes wrong:** Weighted pipeline is confusingly low because it excludes Won deals
**Why it happens:** Weighted forecast is for predicting FUTURE revenue, not counting past
**How to avoid:** Label clearly: "Weighted Forecast" not "Weighted Pipeline". Show total pipeline separately.
**Warning signs:** User confusion about why weighted is lower than total

## Code Examples

Verified patterns from official sources and existing codebase:

### Stage Probability Constants
```typescript
// Source: .planning/research/PITFALLS.md - verified approach
// ADD to src/lib/pipeline-utils.ts

export const STAGE_PROBABILITY: Record<string, number> = {
  LEAD: 0.10,        // 10% - most leads don't convert
  QUALIFIED: 0.25,   // 25% - qualified but early
  PROPOSAL: 0.50,    // 50% - active opportunity
  NEGOTIATION: 0.75, // 75% - likely to close
  WON: 1.00,         // 100% - closed
  LOST: 0.00,        // 0% - lost
}
```

### Aggregation Query Pattern
```typescript
// Source: Existing prisma patterns in codebase + Prisma docs

// Pipeline metrics - single query with groupBy
const pipelineMetrics = await prisma.deal.groupBy({
  by: ['stage'],
  _count: { _all: true },
  _sum: { value: true },
  where: {
    stage: { notIn: ['WON', 'LOST'] } // Open pipeline only
  }
})

// Transform to ordered array matching STAGES constant
const stageData = STAGES.filter(s => !['WON', 'LOST'].includes(s.id)).map(stage => {
  const found = pipelineMetrics.find(m => m.stage === stage.id)
  return {
    id: stage.id,
    name: stage.title,
    count: found?._count._all ?? 0,
    value: Number(found?._sum.value) || 0,
    color: stage.colorDot.replace('bg-', '#').replace('-400', ''), // Convert to hex
  }
})
```

### Profit Summary Widget
```typescript
// Source: Existing project-detail-sheet.tsx profit card pattern

// Server-side calculation
const revenueResult = await prisma.project.aggregate({
  where: { status: 'COMPLETED' },
  _sum: { revenue: true }
})
const costsResult = await prisma.cost.aggregate({
  _sum: { amount: true }
})
const totalRevenue = Number(revenueResult._sum.revenue) || 0
const totalCosts = Number(costsResult._sum.amount) || 0
const profit = totalRevenue - totalCosts

// Client-side display (from project-detail-sheet pattern)
<Card className={cn(
  'p-3',
  profit >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'
)}>
  <div className={cn(
    'text-xs font-medium',
    profit >= 0 ? 'text-blue-600' : 'text-orange-600'
  )}>
    Total Profit
  </div>
  <div className={cn(
    'text-lg font-semibold',
    profit >= 0 ? 'text-blue-700' : 'text-orange-700'
  )}>
    {formatCurrency(profit)}
  </div>
</Card>
```

### Stage Color Mapping for Charts
```typescript
// Source: Existing STAGES constant + recharts pattern from department-chart.tsx

// Convert Tailwind classes to hex colors for recharts
const STAGE_CHART_COLORS: Record<string, string> = {
  LEAD: '#9CA3AF',       // gray-400
  QUALIFIED: '#60A5FA',  // blue-400
  PROPOSAL: '#A78BFA',   // purple-400
  NEGOTIATION: '#FBBF24', // amber-400
  WON: '#22C55E',        // green-500
  LOST: '#F87171',       // red-400
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| recharts v2 | recharts v3 | 2024 | New API for some components, but existing patterns still work |
| Client-side data fetching | Server Components | Next.js 13+ | No loading states on initial render |
| Separate dashboard pages | Tabbed sections | Current | Single page with initiative + CRM sections |

**Deprecated/outdated:**
- Using `getServerSideProps` - replaced by Server Components in App Router
- Client-side-only data fetching for dashboard - causes loading flash

## Open Questions

Things that couldn't be fully resolved:

1. **Dashboard layout: Single page or separate pages?**
   - What we know: Current dashboard shows initiatives only
   - What's unclear: Whether CRM widgets should be on same page or `/dashboard/crm`
   - Recommendation: Add as new section on same page (simpler, one-stop view)

2. **Widget refresh mechanism**
   - What we know: Server Component fetches once on load
   - What's unclear: How to handle real-time updates after deal/project changes
   - Recommendation: For v1.2, manual page refresh is acceptable. Can add revalidation later.

3. **Color mapping for recharts**
   - What we know: Existing STAGES use Tailwind classes like `bg-gray-400`
   - What's unclear: Best way to share colors between Tailwind and recharts
   - Recommendation: Create parallel STAGE_CHART_COLORS constant with hex values

## Sources

### Primary (HIGH confidence)
- `/src/components/dashboard/department-chart.tsx` - Existing BarChart pattern
- `/src/components/dashboard/status-chart.tsx` - Existing PieChart pattern
- `/src/components/dashboard/kpi-cards.tsx` - Existing KPI card layout
- `/src/app/(dashboard)/page.tsx` - Dashboard data fetching pattern
- `/src/lib/pipeline-utils.ts` - Stage definitions and colors
- `/src/lib/cost-utils.ts` - Profit calculation function
- `/prisma/schema.prisma` - Data model for Deal, Project, Cost
- `.planning/research/PITFALLS.md` - STAGE_PROBABILITY values

### Secondary (MEDIUM confidence)
- recharts v3 documentation (verified compatible with existing usage patterns)
- Prisma groupBy/aggregate documentation

### Tertiary (LOW confidence)
- None required - all patterns verified in existing codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in use, patterns established
- Architecture: HIGH - Following exact existing dashboard patterns
- Pitfalls: HIGH - Common issues documented in prior research + observed in codebase

**Research date:** 2026-01-22
**Valid until:** Stable - no external dependencies changing
