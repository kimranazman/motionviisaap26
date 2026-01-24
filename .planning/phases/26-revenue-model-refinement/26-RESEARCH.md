# Phase 26: Revenue Model Refinement - Research

**Researched:** 2026-01-24
**Domain:** Prisma schema migration, Next.js API routes, React UI components
**Confidence:** HIGH

## Summary

This phase refines the revenue model to clearly separate estimated revenue (from deal/potential conversions) from actual revenue (from AI-imported invoices). The current codebase uses a single `revenue` field that conflates these concepts, plus an `aiImportedRevenue` field that tracks AI-imported amounts.

The solution requires a Prisma schema migration to add `potentialRevenue`, updates to conversion logic in two reorder routes, simplification of AI import logic, and UI changes to show both values with variance calculations. All patterns already exist in the codebase - this is a refinement, not a new feature.

**Primary recommendation:** Add `potentialRevenue` field to Project model, update conversion routes to set `potentialRevenue` instead of `revenue`, simplify AI import to only set `revenue`, and update FinancialsSummary component to display both values with variance.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Prisma | existing | Schema definition and migrations | Already used throughout codebase |
| Next.js API Routes | 14.x | Backend logic for conversions | Current architecture |
| React | existing | UI components | Current stack |
| shadcn/ui | existing | UI components (Card, Badge) | Already used |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Tailwind CSS | existing | Styling for variance display | All UI styling |
| Decimal.js (via Prisma) | existing | Currency precision | All financial calculations |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Schema field addition | JSON field for revenue types | Schema field is cleaner, matches existing pattern |
| Remove aiImportedRevenue | Keep for tracking | Remove - redundant if revenue only comes from AI |

## Architecture Patterns

### Recommended Changes

```
prisma/schema.prisma:
  - Add: potentialRevenue Decimal?
  - Keep: revenue (actual from AI invoices)
  - Remove: aiImportedRevenue (redundant)

src/app/api/deals/reorder/route.ts:
  - Change: revenue: currentDeal.value -> potentialRevenue: currentDeal.value

src/app/api/potential-projects/reorder/route.ts:
  - Change: revenue: currentPotential.estimatedValue -> potentialRevenue: currentPotential.estimatedValue

src/lib/ai-auto-import.ts:
  - Change: Remove aiImportedRevenue update, just set revenue

src/app/api/ai/import/invoice/route.ts:
  - Change: Remove aiImportedRevenue, just set revenue

src/components/projects/project-detail-sheet.tsx:
  - Update FinancialsSummary to show potentialRevenue and revenue
  - Remove manual revenue input field
  - Fix Profit card margin cutoff
```

### Pattern 1: Two-Field Revenue Model
**What:** Separate `potentialRevenue` (estimate) from `revenue` (actual)
**When to use:** When deal/potential converts to project, set potentialRevenue; when AI imports invoice, set revenue

### Pattern 2: Variance Display
**What:** Show difference between potential and actual revenue with percentage
**When to use:** In FinancialsSummary when both values exist
**Example:**
```typescript
// Calculate variance
const variance = (revenue ?? 0) - (potentialRevenue ?? 0)
const variancePercent = potentialRevenue > 0
  ? Math.round((variance / potentialRevenue) * 100)
  : 0

// Display logic
const isAboveEstimate = variance > 0
const isBelowEstimate = variance < 0
const isOnTarget = variance === 0
```

### Anti-Patterns to Avoid
- **Setting revenue on conversion:** Don't set `revenue` when deal wins - only `potentialRevenue`
- **Manual revenue input:** Don't allow users to manually enter revenue - it should only come from AI invoices
- **Keeping aiImportedRevenue:** Remove it - all revenue is now from AI, so tracking is redundant

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Currency formatting | Custom formatter | Existing `formatCurrency` from lib/utils | Already handles RM prefix |
| Decimal handling | Number math | Prisma Decimal type | Financial precision |
| Percentage calculation | Complex logic | Simple `(diff/base)*100` | Already used in margin calc |

**Key insight:** This phase refines existing patterns - no new solutions needed.

## Common Pitfalls

### Pitfall 1: Data Migration Oversight
**What goes wrong:** Existing projects have revenue set from conversions, not AI - this data should become potentialRevenue
**Why it happens:** Schema adds new field but doesn't migrate existing data
**How to avoid:** Create data migration script that:
1. For projects with `aiImportedRevenue` > 0: keep `revenue` as-is (it's actual)
2. For projects with `aiImportedRevenue` = 0 or null but `revenue` > 0: move `revenue` to `potentialRevenue`
**Warning signs:** Projects showing 0 potential revenue after migration when they came from deals

### Pitfall 2: Partial Variance Display
**What goes wrong:** Showing variance when only one value exists looks confusing
**Why it happens:** Not handling null cases properly
**How to avoid:** Only show variance section when BOTH potentialRevenue AND revenue exist
**Warning signs:** "Variance: NaN%" or "Variance: RM Infinity"

### Pitfall 3: Profit Card Cutoff Not Fixed
**What goes wrong:** Margin percentage still gets cut off on narrow screens
**Why it happens:** Forgetting to add `flex-shrink-0` to margin container
**How to avoid:** Add `flex-shrink-0` class to the margin div in Profit card
**Warning signs:** "100" visible but "%" is cut off on mobile

### Pitfall 4: API Response Missing potentialRevenue
**What goes wrong:** Frontend shows undefined for potential revenue
**Why it happens:** API routes don't include potentialRevenue in select/return
**How to avoid:** Update project GET endpoints to include potentialRevenue in serialized response
**Warning signs:** potentialRevenue always shows as 0 even after conversion

### Pitfall 5: Type Definitions Not Updated
**What goes wrong:** TypeScript errors when accessing potentialRevenue
**Why it happens:** Project interface in components not updated
**How to avoid:** Update Project interface in project-detail-sheet.tsx to include potentialRevenue
**Warning signs:** TypeScript compilation errors

## Code Examples

Verified patterns from the codebase:

### Schema Migration Pattern
```prisma
// Source: prisma/schema.prisma (existing pattern)
model Project {
  id              String          @id @default(cuid())
  title           String          @db.VarChar(255)
  potentialRevenue Decimal?       @db.Decimal(12, 2) @map("potential_revenue")  // NEW
  revenue         Decimal?        @db.Decimal(12, 2)  // Keep - now means actual only
  // Remove aiImportedRevenue - no longer needed
}
```

### Conversion Logic Update
```typescript
// Source: src/app/api/deals/reorder/route.ts (lines 52-63)
// CURRENT:
const project = await tx.project.create({
  data: {
    title: currentDeal.title,
    revenue: currentDeal.value,  // WRONG: sets actual revenue
    status: ProjectStatus.DRAFT,
    companyId: currentDeal.companyId,
    contactId: currentDeal.contactId,
  },
})

// TARGET:
const project = await tx.project.create({
  data: {
    title: currentDeal.title,
    potentialRevenue: currentDeal.value,  // CORRECT: sets potential
    // revenue is null - will be set by AI invoice import
    status: ProjectStatus.DRAFT,
    companyId: currentDeal.companyId,
    contactId: currentDeal.contactId,
  },
})
```

### AI Import Simplification
```typescript
// Source: src/lib/ai-auto-import.ts (lines 156-162)
// CURRENT:
await prisma.project.update({
  where: { id: projectId },
  data: {
    revenue: results.total,
    aiImportedRevenue: results.total,  // REMOVE: redundant
  },
})

// TARGET:
await prisma.project.update({
  where: { id: projectId },
  data: {
    revenue: results.total,  // Only set actual revenue
  },
})
```

### Financials Summary Update
```typescript
// Source: src/components/projects/project-detail-sheet.tsx (lines 119-127)
// NEW Props interface
interface FinancialsSummaryProps {
  potentialRevenue: number | null  // NEW
  revenue: number | null           // Actual revenue
  totalCosts: number
  profit: number
  costsCount: number
  aiImportedCostsCount?: number
}

// NEW Variance calculation
function FinancialsSummary({ potentialRevenue, revenue, ... }) {
  const actualValue = revenue ?? 0
  const potentialValue = potentialRevenue ?? 0
  const hasBothValues = potentialValue > 0 && actualValue > 0

  // Variance: how much actual differs from potential
  const variance = actualValue - potentialValue
  const variancePercent = potentialValue > 0
    ? Math.round((variance / potentialValue) * 100)
    : 0

  // ...render both cards and variance
}
```

### Profit Card Flex Fix
```typescript
// Source: src/components/projects/project-detail-sheet.tsx (lines 248-257)
// CURRENT (line 249):
<div className={cn(
  'text-right',  // Missing flex-shrink-0

// TARGET:
<div className={cn(
  'text-right flex-shrink-0',  // Prevents cutoff
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single revenue field | potentialRevenue + revenue | This phase | Clear distinction |
| aiImportedRevenue tracking | Remove - all revenue is AI | This phase | Simpler model |
| Manual revenue input | AI-only revenue | This phase | Data integrity |

**Deprecated/outdated:**
- `aiImportedRevenue` field: Being removed - redundant when all revenue comes from AI
- Manual revenue input: Being removed from edit form

## Open Questions

Things that couldn't be fully resolved:

1. **Multiple Invoice Handling**
   - What we know: AI can import invoices setting revenue
   - What's unclear: What happens if multiple invoices imported? Sum or replace?
   - Recommendation: Currently replaces (source code lines 156-162). Keep this behavior - last invoice is source of truth. May need future enhancement for multi-invoice projects.

2. **Existing Data Migration Strategy**
   - What we know: Need to migrate existing revenue to potentialRevenue for non-AI projects
   - What's unclear: Exact query to identify projects to migrate
   - Recommendation: Projects where `aiImportedRevenue` is null/0 but `revenue` > 0 should have revenue moved to potentialRevenue

## Sources

### Primary (HIGH confidence)
- `prisma/schema.prisma` - Current Project model (lines 384-421)
- `src/app/api/deals/reorder/route.ts` - Deal conversion logic (lines 52-77)
- `src/app/api/potential-projects/reorder/route.ts` - Potential conversion logic (lines 53-76)
- `src/lib/ai-auto-import.ts` - AI import logic (lines 123-180)
- `src/components/projects/project-detail-sheet.tsx` - FinancialsSummary component (lines 118-263)
- `.planning/phases/26-revenue-model-refinement/26-CONTEXT.md` - Requirements and design

### Secondary (MEDIUM confidence)
- Prisma documentation for schema migrations
- Next.js API route patterns from codebase

### Tertiary (LOW confidence)
- None - all findings verified from source code

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Verified from existing codebase
- Architecture: HIGH - Patterns match existing code
- Pitfalls: HIGH - Identified from code analysis

**Research date:** 2026-01-24
**Valid until:** Indefinite - internal refactoring, no external dependencies
