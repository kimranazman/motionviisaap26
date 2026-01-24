# Phase 26: Revenue Model Refinement - Context

## Problem Statement

Currently, project revenue is a single field that can be:
1. Set manually via the edit form (confusing)
2. Auto-filled from deal value on conversion (estimate)
3. Replaced by AI invoice import (actual)

This leads to confusion about what the revenue number actually represents.

## Proposed Solution

Separate revenue into two distinct concepts:

| Field | Source | Meaning |
|-------|--------|---------|
| `potentialRevenue` | Deal won value / Potential value | Estimated revenue at project creation |
| `revenue` (actual) | AI-imported invoices | Confirmed revenue from invoices |

## Current Schema (to be changed)

```prisma
model Project {
  revenue           Decimal?  // Currently used for everything
  aiImportedRevenue Decimal?  // Tracks AI portion (will be removed)
}
```

## Target Schema

```prisma
model Project {
  potentialRevenue  Decimal?  // From deal/potential conversion
  revenue           Decimal?  // Actual revenue from invoices only
}
```

## Changes Required

### 1. Schema Migration
- Add `potentialRevenue` field
- Keep `revenue` for actual (AI-imported) values
- Remove `aiImportedRevenue` (no longer needed - all revenue is from AI)
- Migrate existing data: current `revenue` → `potentialRevenue` if not from AI

### 2. Conversion Logic Updates
- `src/app/api/deals/[id]/route.ts` - Deal Won → set `potentialRevenue`
- `src/app/api/potential-projects/[id]/route.ts` - Potential Confirmed → set `potentialRevenue`

### 3. AI Import Updates
- `src/lib/ai-auto-import.ts` - Set `revenue` only (remove aiImportedRevenue logic)
- `src/app/api/ai/import/invoice/route.ts` - Same

### 4. UI Updates
- `src/components/projects/project-detail-sheet.tsx`:
  - Remove manual revenue input field
  - Update FinancialsSummary to show both potential and actual
  - Show variance (potential vs actual)
  - Fix Profit card margin cutoff (flex layout issue)

### 5. Financials Summary New Design

```
┌─────────────────────────────────────────────┐
│ Potential Revenue          Actual Revenue   │
│ RM 17,000                  RM 17,800    AI  │
│ From deal                  From invoice     │
├─────────────────────────────────────────────┤
│ Variance: +RM 800 (4.7% above estimate)     │
├─────────────────────────────────────────────┤
│ Total Costs                                 │
│ RM 0                                        │
│ From 0 expenses                             │
├─────────────────────────────────────────────┤
│ Profit                              Margin  │
│ RM 17,800                           100%    │
└─────────────────────────────────────────────┘
```

## Files to Modify

1. `prisma/schema.prisma` - Add potentialRevenue, remove aiImportedRevenue
2. `src/app/api/deals/[id]/route.ts` - Update conversion logic
3. `src/app/api/potential-projects/[id]/route.ts` - Update conversion logic
4. `src/lib/ai-auto-import.ts` - Simplify to just set revenue
5. `src/app/api/ai/import/invoice/route.ts` - Simplify
6. `src/components/projects/project-detail-sheet.tsx` - Major UI updates
7. `src/app/api/projects/route.ts` - Remove revenue from create/update if manual
8. `src/app/api/projects/[id]/route.ts` - Remove revenue from PATCH

## Known UI Bug to Fix

The Profit card has "Margin" and percentage cut off on the right side. The flex layout needs adjustment:
- Add `flex-shrink-0` to the margin container
- Ensure proper overflow handling

## Requirements (for REQUIREMENTS.md)

- **REV-01**: Project has potentialRevenue field set from deal/potential conversion
- **REV-02**: Project revenue field is actual revenue from AI invoices only
- **REV-03**: Manual revenue input removed from project edit form
- **REV-04**: Financials Summary shows potential vs actual with variance
- **REV-05**: Profit card displays correctly without cutoff on all screen sizes

## Testing Notes

1. Create a deal, move to Won → check potentialRevenue is set
2. Upload invoice, run AI analysis → check revenue (actual) is set
3. Verify Financials Summary shows both values with variance
4. Verify no manual revenue input in edit form
5. Test on narrow screen - margin should not be cut off

---
*Created: 2026-01-24*
*For: Phase 26 planning*
