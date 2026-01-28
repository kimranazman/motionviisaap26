# Phase 67: Line Item Pricing History - Research

## RESEARCH COMPLETE

### 1. Current Cost Model (Prisma Schema)

**File:** `prisma/schema.prisma` (lines 538-574)

The `Cost` model has these fields:
- `id` (String, cuid)
- `description` (String, VarChar(500))
- `amount` (Decimal, 12,2) -- THE canonical total
- `date` (DateTime)
- `projectId` (FK to Project)
- `categoryId` (FK to CostCategory)
- `receiptPath` (String?, optional)
- `aiImported` (Boolean)
- `embedding` (Json?, for semantic matching)
- `normalizedItem` (String?, VarChar(100)) -- AI-assigned item name for price comparison
- `supplierId` (FK to Supplier?, optional)
- `createdAt`, `updatedAt`

**Missing fields for Phase 67:** `quantity` and `unitPrice`. These do NOT exist yet. Need a migration to add them as optional Decimal fields.

### 2. CostForm Component

**File:** `src/components/projects/cost-form.tsx`

Current fields: description, amount (RM), category, date, supplier.
- Uses standard controlled state (useState)
- Submits to `POST /api/projects/${projectId}/costs` or `PATCH /api/projects/${projectId}/costs/${cost.id}`
- Body payload: `{ description, amount, categoryId, date, supplierId }`

**Changes needed:** Add optional `quantity` and `unitPrice` fields. When both are filled, auto-calculate `amount = quantity * unitPrice`. Amount should still be directly editable (for cases without unit pricing).

### 3. CostCard Component

**File:** `src/components/projects/cost-card.tsx`

Renders cost items in project detail view. Shows: description, category badge, AI badge, date, supplier, amount.

**Changes needed:** Show quantity/unit price info when present (e.g., "5 x RM 10.00").

### 4. Cost API Routes

**POST /api/projects/[id]/costs** (`src/app/api/projects/[id]/costs/route.ts`)
- Creates cost with: description, amount, categoryId, date, supplierId
- Needs to accept optional `quantity` and `unitPrice`

**PATCH /api/projects/[id]/costs/[costId]** (`src/app/api/projects/[id]/costs/[costId]/route.ts`)
- Updates cost fields selectively
- Needs to accept optional `quantity` and `unitPrice`

**GET /api/projects/[id]/costs** (`src/app/api/projects/[id]/costs/route.ts`)
- Lists costs for a project, includes category and supplier
- Will automatically return new fields once schema updated

### 5. AI Receipt Import

**File:** `src/app/api/ai/import/receipt/route.ts`

The `ReceiptImportItem` interface has: description, amount, categoryId, suggestedCategory, include.
- Does NOT have quantity or unitPrice yet.
- Creates cost entries with: projectId, description, amount, categoryId, date, aiImported.

**File:** `src/types/ai-extraction.ts`

The `ReceiptItem` interface has: description, amount, suggestedCategory, suggestedCategoryId, confidence.
- Does NOT have quantity or unitPrice (but `InvoiceLineItem` DOES have optional quantity and unitPrice).
- The receipt document extraction instructions (`document-receipt.md`) mention "Unit counts and prices" for hardware store receipts but the line item output format only has description and amount.

**File:** `src/lib/ai-auto-import.ts`

Auto-imports receipts with HIGH confidence. The receipt items interface has: description, amount, suggestedCategory, confidence. No quantity/unitPrice.

### 6. Existing Price Comparison Page (Supplier Items)

**File:** `src/app/(dashboard)/supplier-items/page.tsx`

Already exists at `/supplier-items` as "Price Comparison". Fetches costs with suppliers, shows in a filterable table. Filters by normalizedItem (category) and supplier.

**File:** `src/components/supplier-items/supplier-items-table.tsx`

Table shows: Description, Category (normalizedItem with inline edit), Supplier, Price (amount), Project.
- Already has search, category filter, supplier filter
- This page currently shows costs that have a supplier only

### 7. Nav Config

**File:** `src/lib/nav-config.ts`

Already has `{ name: 'Price Comparison', href: '/supplier-items', icon: Scale }` in the CRM group.
For Phase 67, we need new views:
- By-item view: pricing history for a specific normalized item across projects
- By-client view: all items charged to a specific company

These could be tabs/views within the existing Price Comparison page OR new pages. The existing page is scoped to supplier items only. The new views need broader scope.

### 8. Project Model (Company Relation)

Projects have optional `companyId` (FK to Company). Internal projects may not have a company. The by-client view needs to group costs by project.company.

### 9. Key Design Decisions

1. **quantity and unitPrice as optional Decimal fields** -- Both nullable so existing costs work fine. When both present, amount = qty * unitPrice. Amount remains the canonical total (PRICE-06).

2. **Auto-calculation in form** -- When user enters qty and unit price, amount auto-fills. User can still override amount directly.

3. **Receipt extraction** -- Add quantity and unitPrice to ReceiptItem and ReceiptImportItem interfaces. Update receipt import API to persist these fields.

4. **By-item view** -- New API endpoint that groups costs by normalizedItem, shows all prices across projects. Can be a tab on the existing Price Comparison page.

5. **By-client view** -- New API endpoint that groups costs by company (via project.company). Can be another tab on the Price Comparison page.

### 10. Files to Modify

**Schema & Migration:**
- `prisma/schema.prisma` -- Add quantity and unitPrice to Cost model

**API Routes:**
- `src/app/api/projects/[id]/costs/route.ts` -- Accept quantity/unitPrice in POST
- `src/app/api/projects/[id]/costs/[costId]/route.ts` -- Accept quantity/unitPrice in PATCH
- `src/app/api/ai/import/receipt/route.ts` -- Persist quantity/unitPrice
- `src/app/api/supplier-items/route.ts` -- Return quantity/unitPrice
- NEW: `src/app/api/pricing-history/route.ts` -- By-item and by-client queries

**Types:**
- `src/types/ai-extraction.ts` -- Add quantity/unitPrice to ReceiptItem

**Components:**
- `src/components/projects/cost-form.tsx` -- Add qty/unitPrice fields with auto-calc
- `src/components/projects/cost-card.tsx` -- Show qty/unitPrice when present
- `src/components/supplier-items/supplier-items-table.tsx` -- Add qty/unitPrice columns
- `src/app/(dashboard)/supplier-items/page.tsx` -- Add tabs for by-item/by-client views

**AI Instructions:**
- `.claude/skills/ai-analyze/instructions/document-receipt.md` -- Update extraction format to include qty/unitPrice
- `src/lib/ai-auto-import.ts` -- Pass quantity/unitPrice when creating costs
