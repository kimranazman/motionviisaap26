# Phase 20: Dashboard & Detail Pages - Research

**Researched:** 2026-01-23
**Domain:** Responsive dashboard KPI cards, responsive charts, mobile detail pages
**Confidence:** HIGH

## Summary

This phase makes the dashboard KPI cards, charts, and detail pages work effectively on mobile. The project uses recharts for all charts (PieChart with Legend, horizontal BarChart) and standard Tailwind grid patterns for KPI cards. Detail pages use a combination of full-page layouts (initiative-detail.tsx) and Sheet components (initiative-detail-sheet.tsx, company-detail-modal.tsx).

The current dashboard page already has some responsive grid patterns (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`), but needs refinement for the requirements. The charts use fixed heights (h-64) with ResponsiveContainer, which handles width well but may have legend overflow issues on mobile. Detail pages have established patterns from Phase 19 (full-width sheets, stacked form grids).

The implementation follows existing patterns:
1. **KPI Cards Grid** - Already uses responsive classes; refine for 1-col mobile, 2-col tablet, 3-4-col desktop
2. **Charts Responsive** - Adjust legend positioning, use vertical layout on mobile for horizontal BarCharts
3. **Filter Controls** - Currently minimal on dashboard (filter bar already handled in Phase 17 for Kanban)
4. **Detail Pages** - Apply Phase 19 patterns: stacked layouts, full-width sheets, touch-friendly inputs

**Primary recommendation:** Refine existing responsive grid breakpoints on KPI cards. Add legend responsive positioning to recharts components (bottom on mobile, right on desktop). Detail pages already have responsive patterns from Phase 19; verify they're applied consistently.

## Standard Stack

### Core (Already in Project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| recharts | 3.6.0 | Charts (Pie, Bar) | Already used for dashboard charts |
| Tailwind CSS | 3.4.1 | Responsive grids, utilities | `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` |
| shadcn/ui Card | (Radix) | KPI card containers | Already used |
| shadcn/ui Sheet | (Radix) | Detail panels | Already used for detail sheets |
| shadcn/ui Tabs | (Radix) | Section organization | Already in project |

### Supporting (No New)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| N/A | | | All needed already present |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| recharts Legend position | Custom legend outside chart | recharts Legend with responsive wrapperStyle is simpler |
| Horizontal BarChart on mobile | Vertical BarChart | Horizontal bar with responsive YAxis width works |

**Installation:**
No new packages needed. All functionality available in existing stack.

## Architecture Patterns

### Recommended Project Structure
```
src/
components/
  dashboard/
    kpi-cards.tsx            # UPDATE: Ensure 1-col mobile, 2-col tablet, 4-col desktop
    crm-kpi-cards.tsx        # UPDATE: Ensure 1-col mobile, 2-col tablet, 3-col desktop
    pipeline-stage-chart.tsx # UPDATE: Responsive legend, mobile YAxis width
    status-chart.tsx         # UPDATE: Responsive legend positioning (bottom on mobile)
    department-chart.tsx     # UPDATE: Responsive YAxis width for mobile
    team-workload.tsx        # OK - simple vertical list
    recent-initiatives.tsx   # OK - single column list
  initiatives/
    initiative-detail.tsx    # UPDATE: Apply Phase 19 patterns (stacked grids, touch inputs)
  companies/
    company-detail-modal.tsx # UPDATE: Full-screen on mobile (Phase 19 pattern)
  kanban/
    initiative-detail-sheet.tsx # OK - already has Phase 19 patterns
  pipeline/
    deal-detail-sheet.tsx    # OK - already has responsive patterns
  projects/
    project-detail-sheet.tsx # OK - already has responsive patterns
  ui/
    tabs.tsx                 # UPDATE: Add horizontal scroll for overflow on mobile
```

### Pattern 1: KPI Cards Responsive Grid
**What:** Stack KPI cards vertically on mobile (1-col), 2 columns on tablet, 4 columns on desktop
**When to use:** Dashboard KPI cards sections
**Example:**
```typescript
// Source: Existing kpi-cards.tsx pattern + refined breakpoints
// DSH-01: 1 column on mobile (< sm)
// DSH-02: 2 columns on tablet (sm to lg)
// Desktop: 4 columns (lg+)
<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
  {kpis.map((kpi) => (
    <Card key={kpi.title}>
      <CardContent className="p-6">
        {/* KPI content */}
      </CardContent>
    </Card>
  ))}
</div>
```

### Pattern 2: CRM KPI Cards Grid (6 Cards)
**What:** 1 column mobile, 2 columns tablet, 3 columns desktop for 6 CRM KPI cards
**When to use:** CRM dashboard section with 6 cards
**Example:**
```typescript
// Source: crm-kpi-cards.tsx - already correct pattern
<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
  {/* 6 CRM KPI cards */}
</div>
```

### Pattern 3: Responsive Chart Legend Positioning
**What:** Position legend at bottom on mobile, side on desktop
**When to use:** PieChart (status-chart), BarChart with legend
**Example:**
```typescript
// Source: recharts Legend documentation + responsive detection
// For PieChart - legend below chart on mobile, beside on desktop
<ResponsiveContainer width="100%" height="100%">
  <PieChart>
    <Pie
      data={chartData}
      cx="50%"
      cy="50%"
      // Mobile: smaller radius to make room for bottom legend
      innerRadius={40}
      outerRadius={70}
      paddingAngle={2}
      dataKey="value"
    >
      {/* Cells */}
    </Pie>
    <Tooltip ... />
    {/* Legend - verticalAlign="bottom" works well on all sizes */}
    <Legend
      verticalAlign="bottom"
      height={36}
      formatter={(value) => (
        <span className="text-xs text-gray-600">{value}</span>
      )}
      wrapperStyle={{
        paddingTop: '8px',
      }}
    />
  </PieChart>
</ResponsiveContainer>
```

### Pattern 4: Horizontal Bar Chart Mobile Readability
**What:** Ensure horizontal BarChart YAxis labels are readable on mobile
**When to use:** pipeline-stage-chart.tsx, department-chart.tsx
**Example:**
```typescript
// Source: recharts BarChart + mobile considerations
// Issue: Fixed YAxis width of 80px may cut off labels on mobile
// Solution: Use responsive width or shorter label text on mobile
<ResponsiveContainer width="100%" height="100%">
  <BarChart data={data} layout="vertical" margin={{ left: 10, right: 10 }}>
    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
    <XAxis
      type="number"
      tick={{ fontSize: 10 }} // Smaller on mobile
      tickFormatter={(value) => formatCurrency(value)}
    />
    <YAxis
      dataKey="name"
      type="category"
      tick={{ fontSize: 10 }} // Smaller font for readability
      width={70} // Slightly smaller for mobile, or use responsive
    />
    <Tooltip content={<CustomTooltip />} />
    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
      {data.map((entry, index) => (
        <Cell key={`cell-${index}`} fill={entry.color} />
      ))}
    </Bar>
  </BarChart>
</ResponsiveContainer>
```

### Pattern 5: Chart Container Height for Mobile
**What:** Ensure chart has adequate height on mobile while fitting viewport
**When to use:** All dashboard charts
**Example:**
```typescript
// Source: recharts ResponsiveContainer best practices
// Current: h-64 (256px) - works reasonably on mobile
// Consider: min-h for very small screens
<div className="h-64 min-h-[200px]">
  <ResponsiveContainer width="100%" height="100%">
    {/* Chart content */}
  </ResponsiveContainer>
</div>
```

### Pattern 6: Detail Page Stacked Layout (Phase 19 Continuation)
**What:** Apply 1-column grid on mobile for detail page form fields
**When to use:** initiative-detail.tsx Details card
**Example:**
```typescript
// Source: Phase 19 research patterns
// Current in initiative-detail.tsx: grid-cols-2
// Updated for responsive:
<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
  {/* Status field */}
  {/* Person In Charge field */}
  {/* Department field */}
  {/* Key Result field */}
  {/* Start Date field */}
  {/* End Date field */}
</div>
```

### Pattern 7: Tabs Horizontal Scroll on Mobile
**What:** When tabs overflow viewport, enable horizontal scrolling
**When to use:** Detail pages with many tabs/sections
**Example:**
```typescript
// Source: Radix Tabs + Tailwind overflow utilities
// Wrap TabsList in scrollable container
<div className="overflow-x-auto">
  <TabsList className="inline-flex min-w-full md:min-w-0">
    <TabsTrigger value="details">Details</TabsTrigger>
    <TabsTrigger value="comments">Comments</TabsTrigger>
    <TabsTrigger value="history">History</TabsTrigger>
  </TabsList>
</div>

// Or update TabsList component directly
<TabsPrimitive.List
  ref={ref}
  className={cn(
    "inline-flex items-center justify-start rounded-lg bg-muted p-1",
    "overflow-x-auto whitespace-nowrap", // Horizontal scroll on overflow
    "text-muted-foreground",
    className
  )}
  {...props}
/>
```

### Pattern 8: Comments Section Mobile Readability
**What:** Ensure comments section is readable with adequate spacing on mobile
**When to use:** initiative-detail.tsx, any detail page with comments
**Example:**
```typescript
// Source: initiative-detail.tsx existing pattern (already good)
// Comments are in a scrollable Card with adequate padding
// Ensure avatar + text doesn't overflow
<div className="flex items-center gap-2">
  <Avatar className="h-6 w-6 shrink-0"> {/* shrink-0 prevents avatar compression */}
    {/* Avatar content */}
  </Avatar>
  <span className="text-sm font-medium truncate">
    {comment.user.name}
  </span>
</div>
<p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
  {comment.content}
</p>
```

### Anti-Patterns to Avoid
- **Fixed chart legend position cutting off on mobile:** Use `verticalAlign="bottom"` for legends on smaller charts
- **Side-by-side fields in detail pages on mobile:** Use `grid-cols-1 md:grid-cols-2`
- **Tabs that wrap instead of scroll:** Wrapped tabs become hard to parse; use horizontal scroll
- **Chart YAxis with long labels and fixed width:** Labels get cut off; use shorter labels or wider width
- **Hardcoded chart heights without min-height:** Very small screens may render charts unusably

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Responsive chart dimensions | Custom resize listeners | recharts ResponsiveContainer | Built-in, handles resize |
| Chart legend positioning | Manual legend component | recharts Legend with verticalAlign | Built-in responsive props |
| KPI cards grid | Custom breakpoint JS | Tailwind grid responsive classes | CSS-only, SSR-safe |
| Tabs overflow | Hide tabs in dropdown | TabsList with overflow-x-auto | Simpler, all tabs visible |
| Touch-friendly selects | Custom mobile select | Radix Select (already touch-aware) | Already handles touch |

**Key insight:** The dashboard components mostly already have responsive foundations (ResponsiveContainer, grid classes). The work is refining breakpoints and ensuring edge cases (legend overflow, YAxis width) are handled.

## Common Pitfalls

### Pitfall 1: Legend Overlapping Chart on Mobile
**What goes wrong:** PieChart legend overlaps the chart itself on small screens
**Why it happens:** Legend with `verticalAlign="middle"` or `layout="vertical"` on side takes chart space
**How to avoid:** Use `verticalAlign="bottom"` for legends on charts under 300px height
**Warning signs:** Legend text overlaps pie slices, or chart becomes tiny

### Pitfall 2: Bar Chart YAxis Labels Cut Off
**What goes wrong:** Stage names or department names truncated on mobile
**Why it happens:** Fixed YAxis width (80px) too narrow for long labels at small font sizes
**How to avoid:** Reduce font size to 10px, use abbreviations, or increase width to 70-90px
**Warning signs:** Labels show "Biz Dev..." instead of "Biz Development"

### Pitfall 3: KPI Cards Not Stacking on Mobile
**What goes wrong:** KPI cards show 2 columns on phones, making text too small
**Why it happens:** Using `sm:grid-cols-2` starts at 640px (small phones are below this)
**How to avoid:** Ensure `grid-cols-1` is the default (no breakpoint prefix)
**Warning signs:** KPI values are cramped, icons and text overlap

### Pitfall 4: Chart Tooltip Off-Screen on Mobile
**What goes wrong:** Touching a chart element shows tooltip that extends beyond viewport
**Why it happens:** Tooltip positioned based on touch point without viewport bounds check
**How to avoid:** recharts Tooltip has some built-in positioning; ensure chart has padding/margin
**Warning signs:** Users can't read tooltip content on chart edges

### Pitfall 5: Detail Page Fields Side-by-Side on Mobile
**What goes wrong:** Form fields in detail view are cramped and hard to tap
**Why it happens:** Using `grid-cols-2` without responsive prefix
**How to avoid:** Use `grid-cols-1 md:grid-cols-2` pattern consistently
**Warning signs:** Input fields at 50% width, labels barely visible

### Pitfall 6: Inline Edit Fields Hard to Tap
**What goes wrong:** Inline editable fields (CompanyInlineField) are hard to activate on mobile
**Why it happens:** Small touch target, no clear edit indicator on touch devices
**How to avoid:** Ensure inline fields have minimum 44px height, visible focus/edit state
**Warning signs:** Users tap repeatedly to edit, or accidentally trigger adjacent fields

### Pitfall 7: Tabs Wrapping Instead of Scrolling
**What goes wrong:** Tab labels wrap to multiple lines, looking broken
**Why it happens:** TabsList has `whitespace-nowrap` but parent container doesn't allow overflow
**How to avoid:** Wrap TabsList in `overflow-x-auto` container, or add to TabsList class
**Warning signs:** Tabs appear on two lines with broken alignment

## Code Examples

Verified patterns from official sources and project context:

### Dashboard Page Responsive Grid Layout
```typescript
// Source: Existing page.tsx + responsive refinements
export default async function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Dashboard" description="Strategic Annual Action Plan 2026" />

      <div className="p-4 md:p-6 space-y-6">
        {/* KPI Cards - 1 col mobile, 2 col tablet, 4 col desktop */}
        <KPICards stats={data.stats} />

        {/* Charts Row - stack on mobile, 2-col on desktop */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <StatusChart data={data.byStatus} />
          <DepartmentChart data={data.byDepartment} />
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <TeamWorkload data={data.byPerson} total={data.stats.totalInitiatives} />
          <RecentInitiatives initiatives={data.recentInitiatives} />
        </div>

        {/* CRM Section */}
        <div className="border-t border-gray-200 pt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Sales & Revenue</h2>
          {/* CRM KPIs - 1 col mobile, 2 col tablet, 3 col desktop */}
          <CRMKPICards ... />
          <div className="mt-6">
            <PipelineStageChart data={crmData.stageData} />
          </div>
        </div>
      </div>
    </div>
  )
}
```

### Responsive KPI Cards Component
```typescript
// Source: kpi-cards.tsx with verified responsive pattern
export function KPICards({ stats }: KPICardsProps) {
  return (
    <div className="space-y-6">
      {/* DSH-01: 1 col mobile, DSH-02: 2 col tablet, 4 col desktop */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.title} className="border border-gray-200">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-3 md:gap-4">
                <div className={`rounded-lg p-2.5 md:p-3 ${kpi.bgColor}`}>
                  <kpi.icon className={`h-4 w-4 md:h-5 md:w-5 ${kpi.color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs md:text-sm text-gray-500 truncate">{kpi.title}</p>
                  <p className="text-xl md:text-2xl font-semibold text-gray-900">
                    {kpi.value}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{kpi.subtitle}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
```

### Responsive PieChart with Bottom Legend
```typescript
// Source: status-chart.tsx with responsive legend
export function StatusChart({ data }: StatusChartProps) {
  return (
    <Card className="border border-gray-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium text-gray-900">
          Status Distribution
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Adequate height for chart + bottom legend */}
        <div className="h-64 md:h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="45%" // Slightly above center to leave room for legend
                innerRadius={35}
                outerRadius={60}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                }}
              />
              {/* Legend at bottom - works well on mobile */}
              <Legend
                verticalAlign="bottom"
                height={48}
                iconSize={8}
                formatter={(value) => (
                  <span className="text-xs text-gray-600 ml-1">{value}</span>
                )}
                wrapperStyle={{
                  paddingTop: '12px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
```

### Responsive Horizontal Bar Chart
```typescript
// Source: pipeline-stage-chart.tsx with mobile-friendly YAxis
export function PipelineStageChart({ data }: PipelineStageChartProps) {
  return (
    <Card className="border border-gray-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium text-gray-900">
          Pipeline by Stage
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ left: 0, right: 10, top: 5, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis
                type="number"
                tick={{ fontSize: 10 }}
                tickFormatter={(value) => {
                  // Shorter format on small values
                  if (value >= 1000000) return `${(value/1000000).toFixed(0)}M`
                  if (value >= 1000) return `${(value/1000).toFixed(0)}K`
                  return value
                }}
              />
              <YAxis
                dataKey="name"
                type="category"
                tick={{ fontSize: 10 }}
                width={75} // Slightly smaller for mobile
                tickFormatter={(value) => {
                  // Truncate long names on mobile
                  return value.length > 12 ? value.slice(0, 10) + '...' : value
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
```

### Initiative Detail Page Responsive Layout
```typescript
// Source: initiative-detail.tsx with Phase 19 responsive patterns
export function InitiativeDetail({ initiative }: InitiativeDetailProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - responsive padding */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center gap-3 md:gap-4">
            <Button variant="ghost" size="icon" onClick={handleBack} className="shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1 min-w-0">
              {/* Badges and title */}
            </div>
          </div>
        </div>
      </div>

      {/* Content - stack on mobile, 2-col on desktop */}
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 space-y-6">
        {/* Details Card with responsive grid */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4" />
              Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* DET-03: Stack on mobile, 2-col on desktop */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
              {/* Status field */}
              {/* Person In Charge field */}
              {/* Department field */}
              {/* Key Result field */}
              {/* Start Date field */}
              {/* End Date field */}
            </div>
          </CardContent>
        </Card>

        {/* Remarks Card */}
        <Card>
          {/* ... */}
        </Card>

        {/* Save Button - full width on mobile */}
        {hasChanges && (
          <Button onClick={handleSave} disabled={isSaving} className="w-full">
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        )}

        <Separator />

        {/* Comments Section - DET-05 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Comments
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Comment input with responsive avatar */}
            <div className="flex gap-2 md:gap-3">
              <Avatar className="h-8 w-8 shrink-0">
                {/* Avatar content */}
              </Avatar>
              <div className="flex-1 space-y-2">
                <Textarea
                  placeholder="Add a comment..."
                  className="min-h-[80px]"
                />
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400 hidden sm:block">
                    Cmd + Enter to submit
                  </span>
                  <Button size="sm" className="w-full sm:w-auto">
                    <Send className="h-4 w-4 mr-1" />
                    Send
                  </Button>
                </div>
              </div>
            </div>

            {/* Comments list with readable layout */}
            <div className="space-y-3">
              {comments.map((comment) => (
                <div key={comment.id} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar className="h-6 w-6 shrink-0">{/* ... */}</Avatar>
                      <span className="text-sm font-medium truncate">
                        {comment.user.name}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400 shrink-0">
                      {formatCommentTime(comment.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap break-words mt-2">
                    {comment.content}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
```

### Company Detail Modal (Full-Screen Mobile)
```typescript
// Source: company-detail-modal.tsx + Phase 19 patterns
<Dialog open={open} onOpenChange={onOpenChange}>
  <DialogContent className={cn(
    // Mobile: slide up, nearly full screen
    "fixed inset-x-0 bottom-0 h-[calc(100vh-2rem)] rounded-t-2xl",
    // Desktop: centered, constrained
    "md:inset-auto md:left-[50%] md:top-[50%]",
    "md:translate-x-[-50%] md:translate-y-[-50%]",
    "md:w-full md:max-w-2xl md:max-h-[85vh] md:rounded-lg",
    "overflow-y-auto"
  )}>
    {/* Content with responsive grid */}
    <div className="space-y-6 py-4">
      {/* Company Fields - stack on mobile */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Industry, Website, Phone, Address */}
      </div>
    </div>
  </DialogContent>
</Dialog>
```

### Responsive Tabs with Horizontal Scroll
```typescript
// Source: Radix Tabs + Tailwind overflow
// For detail pages with multiple sections
<Tabs defaultValue="details">
  {/* Scrollable tabs container */}
  <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
    <TabsList className="inline-flex min-w-max">
      <TabsTrigger value="details">Details</TabsTrigger>
      <TabsTrigger value="comments">Comments</TabsTrigger>
      <TabsTrigger value="history">History</TabsTrigger>
      <TabsTrigger value="related">Related</TabsTrigger>
    </TabsList>
  </div>
  <TabsContent value="details">{/* ... */}</TabsContent>
  <TabsContent value="comments">{/* ... */}</TabsContent>
</Tabs>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Fixed chart legend position | Responsive verticalAlign | 2024+ | Works on all screen sizes |
| Fixed grid columns | Mobile-first responsive grid | Best practice | Stacks properly on mobile |
| Fixed input heights | Touch-friendly 44px+ heights | Phase 19 | Better tap targets |
| Side-by-side detail fields | Stacked on mobile | Phase 19 | Readable on small screens |
| Fixed modal sizing | Full-screen mobile modals | Phase 19 | Full viewport utilization |

**Deprecated/outdated:**
- Fixed-size chart legends: Use responsive positioning
- Side-by-side form fields on all screens: Stack on mobile
- Fixed modal/sheet widths: Use full-width on mobile

## Open Questions

Things that couldn't be fully resolved:

1. **Chart legend with many items on mobile**
   - What we know: 5-6 legend items work well with bottom position
   - What's unclear: If 10+ items, will legend push chart too high?
   - Recommendation: Current app has 6 statuses max; bottom legend is sufficient

2. **Dashboard filters (if added later)**
   - What we know: Current dashboard has no user-facing filters
   - What's unclear: If filters are added, should they be in a collapsible panel?
   - Recommendation: If filters needed, use Phase 17 pattern (horizontal scroll filter bar)

3. **Very long stage names in bar chart**
   - What we know: Current stage names are short ("Discovery", "Proposal", etc.)
   - What's unclear: What happens if stage names are user-configurable and very long?
   - Recommendation: Current fixed names are fine; if configurable, add truncation

## Sources

### Primary (HIGH confidence)
- [recharts ResponsiveContainer](https://recharts.org/en-US/api/ResponsiveContainer) - Width/height responsiveness
- [recharts Legend](https://recharts.org/en-US/api/Legend) - verticalAlign, layout options
- [Tailwind CSS Grid](https://tailwindcss.com/docs/grid-template-columns) - Responsive grid columns
- Phase 16/17/18/19 Research - Established project responsive patterns

### Secondary (MEDIUM confidence)
- [recharts GitHub Issue #2636](https://github.com/recharts/recharts/issues/2636) - Legend overlapping with ResponsiveContainer
- [shadcn/ui Chart](https://ui.shadcn.com/docs/components/chart) - Chart component patterns
- [Radix Tabs](https://www.radix-ui.com/primitives/docs/components/tabs) - Tab component behavior

### Tertiary (LOW confidence)
- Community patterns for dashboard mobile layouts
- Blog posts on responsive chart design

## Metadata

**Confidence breakdown:**
- KPI cards responsive: HIGH - established Tailwind grid pattern, verified in codebase
- Chart legend responsive: HIGH - recharts Legend props well-documented
- Detail pages responsive: HIGH - Phase 19 patterns already tested
- Bar chart YAxis mobile: MEDIUM - may need testing with real data lengths
- Tabs overflow: HIGH - standard overflow-x-auto pattern

**Research date:** 2026-01-23
**Valid until:** 2026-04-23 (3 months - stable patterns, existing library stack)
