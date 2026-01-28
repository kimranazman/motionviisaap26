# Phase 67 Verification: Line Item Pricing History

status: passed

## Phase Goal
Users can track and compare item pricing with quantity and unit price detail

## Must-Haves Verification

### 1. User can enter quantity and unit price when creating/editing a cost, with total auto-calculated (PRICE-01, PRICE-02)
**Status: PASSED**
- `prisma/schema.prisma`: Cost model has `quantity Decimal?` and `unitPrice Decimal?` fields
- `src/components/projects/cost-form.tsx`: Quantity and Unit Price input fields with `useEffect` auto-calculation
- `src/app/api/projects/[id]/costs/route.ts`: POST accepts and persists quantity/unitPrice
- `src/app/api/projects/[id]/costs/[costId]/route.ts`: PATCH accepts and persists quantity/unitPrice

### 2. AI receipt import extracts and persists quantity and unit price from scanned documents (PRICE-03)
**Status: PASSED**
- `src/types/ai-extraction.ts`: ReceiptItem interface has optional quantity and unitPrice
- `src/app/api/ai/import/receipt/route.ts`: ReceiptImportItem includes quantity/unitPrice, cost creation persists them
- `src/lib/ai-auto-import.ts`: Auto-import items interface includes quantity/unitPrice, cost creation persists them
- `.claude/skills/ai-analyze/instructions/document-receipt.md`: Extraction instructions updated with qty/unitPrice

### 3. User can view pricing history for a specific normalized item across all projects (PRICE-04)
**Status: PASSED**
- `src/app/api/pricing-history/route.ts`: handleByItem query returns costs with normalizedItem filter, includes qty/unitPrice/supplier/project
- `src/components/supplier-items/pricing-history-by-item.tsx`: Client component with item dropdown, min/max/avg stats, detailed table
- `src/app/(dashboard)/supplier-items/page.tsx`: PricingTabs with "By Item" tab

### 4. User can view all items charged to a specific company (PRICE-05)
**Status: PASSED**
- `src/app/api/pricing-history/route.ts`: handleByClient query returns costs filtered by project.company, includes category/qty/unitPrice
- `src/components/supplier-items/pricing-history-by-client.tsx`: Client component with company dropdown, count/total stats, detailed table
- `src/app/(dashboard)/supplier-items/page.tsx`: PricingTabs with "By Client" tab

### 5. Existing cost aggregation (sum of amount) remains unchanged (PRICE-06)
**Status: PASSED**
- `src/lib/cost-utils.ts`: calculateTotalCosts still uses `cost.amount` only -- unchanged
- quantity and unitPrice are purely optional enrichment fields
- amount remains the required canonical total

## Build Verification
- `npx next build` passes with no errors

## Score: 5/5 must-haves verified

## Result: PASSED
