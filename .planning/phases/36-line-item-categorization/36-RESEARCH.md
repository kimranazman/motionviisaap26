# Phase 36: Line Item Categorization & Price Table - Research

**Researched:** 2026-01-25
**Domain:** AI Text Categorization, Table Filtering, Cost Model Extension
**Confidence:** HIGH

## Summary

This phase implements a simpler approach to price comparison than v1.4's semantic search: AI assigns normalized item names (categories) to cost entries, and users compare prices by filtering a table. The v1.4 embedding-based approach (PriceComparisonSheet) will be deprecated in favor of manual table filtering.

The implementation requires:
1. **Schema change:** Add `normalizedItem` field to Cost model (AI-assigned category like "A4 Paper 80gsm")
2. **AI categorization:** Call OpenAI/Claude when cost is created/updated to assign normalizedItem
3. **Supplier items table:** New page showing all costs across suppliers with filtering by normalizedItem and supplier

The existing codebase provides all needed patterns: embeddings.ts for OpenAI calls, supplier-list.tsx for table patterns, and costs API for mutation hooks.

**Primary recommendation:** Add `normalizedItem` field to Cost, reuse existing OpenAI integration for categorization, build filterable table with shadcn/ui Table component.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `openai` | ^6.16.0 | AI text categorization via GPT | Already in use for embeddings |
| Prisma | ^6.19.2 | Schema extension for normalizedItem | Existing ORM |
| shadcn/ui Table | N/A | Supplier items table | Already used in supplier-list.tsx |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| cmdk | ^1.1.1 | Command palette for filtering | Already installed, used in supplier-select |
| lucide-react | ^0.562.0 | Icons for UI | Already in use |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| OpenAI GPT | Claude API | Claude already used for doc analysis; OpenAI already configured for embeddings |
| Custom table | @tanstack/table | Not installed; shadcn/ui Table sufficient for <1000 items |
| Separate model | Cost field extension | Simpler to add field to existing Cost model |

**Installation:**
```bash
# No new packages needed - all dependencies already installed
```

## Architecture Patterns

### Recommended Project Structure
```
src/
+-- app/
|   +-- (dashboard)/
|   |   +-- supplier-items/
|   |       +-- page.tsx                  # Supplier items table page (server component)
|   +-- api/
|       +-- costs/
|       |   +-- categorize/
|       |       +-- route.ts              # POST: AI categorize a description
|       +-- supplier-items/
|           +-- route.ts                  # GET: All costs with suppliers, filtering
+-- components/
|   +-- supplier-items/
|       +-- supplier-items-table.tsx      # Client: table with filters
|       +-- normalized-item-filter.tsx    # Client: category filter dropdown
|       +-- supplier-filter.tsx           # Client: supplier filter dropdown
|       +-- normalized-item-edit.tsx      # Client: inline edit for normalizedItem
+-- lib/
    +-- ai-categorization.ts              # AI categorization logic
```

### Pattern 1: AI Categorization on Cost Create/Update
**What:** Call OpenAI GPT to generate normalizedItem when cost is created or description changes
**When to use:** POST /api/projects/[id]/costs and PATCH /api/projects/[id]/costs/[costId]
**Example:**
```typescript
// lib/ai-categorization.ts
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

/**
 * Generate a normalized item name from a cost description.
 * Returns a standardized product/service name for grouping similar items.
 *
 * Examples:
 * - "PVC Pipe 1/2 inch 10 pcs" -> "PVC Pipe 1/2 inch"
 * - "A4 Paper 80gsm 5 reams" -> "A4 Paper 80gsm"
 * - "Grab ride to venue" -> "Transportation - Ride Hailing"
 */
export async function getNormalizedItem(description: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0,
    messages: [
      {
        role: 'system',
        content: `You are a cost item categorizer. Given a cost item description, return a normalized product/service name suitable for grouping similar items across suppliers.

Rules:
1. Remove quantity, units, and supplier-specific variations
2. Keep essential product identifiers (size, grade, type)
3. Use title case
4. Keep it concise (3-6 words max)
5. For services, prefix with category (e.g., "Transportation - Taxi")

Examples:
- "PVC Pipe 1/2 inch 10 pcs" -> "PVC Pipe 1/2 Inch"
- "A4 Paper 80gsm 5 reams" -> "A4 Paper 80gsm"
- "Grab ride to venue" -> "Transportation - Ride Hailing"
- "Chicken Rice x 10 pax" -> "Catering - Chicken Rice"
- "Event Tent 20x20ft rental" -> "Tent Rental 20x20ft"

Return ONLY the normalized name, nothing else.`,
      },
      {
        role: 'user',
        content: description,
      },
    ],
    max_tokens: 50,
  })

  return response.choices[0].message.content?.trim() || description
}
```

### Pattern 2: Fire-and-Forget AI Categorization
**What:** Generate normalizedItem async after cost creation, don't block UI
**When to use:** Same pattern as existing embedding generation
**Example:**
```typescript
// In POST /api/projects/[id]/costs
const cost = await prisma.cost.create({
  data: {
    projectId: id,
    description: body.description.trim(),
    amount: parseFloat(body.amount),
    categoryId: body.categoryId,
    date: body.date ? new Date(body.date) : new Date(),
    supplierId: body.supplierId || null,
    // normalizedItem initially null, set async
  },
  include: { /* ... */ },
})

// Fire-and-forget: Generate normalizedItem and embedding
if (cost.supplierId) {
  generateCostCategorization(cost.id, cost.description).catch(console.error)
  generateCostEmbedding(cost.id, cost.description).catch(console.error)
}

// Categorization function
async function generateCostCategorization(costId: string, description: string) {
  try {
    const normalizedItem = await getNormalizedItem(description)
    await prisma.cost.update({
      where: { id: costId },
      data: { normalizedItem },
    })
  } catch (error) {
    console.error(`Failed to categorize cost ${costId}:`, error)
  }
}
```

### Pattern 3: Supplier Items Table with Filters
**What:** Table showing all costs with suppliers, filterable by normalizedItem and supplier
**When to use:** New /supplier-items page
**Example:**
```typescript
// components/supplier-items/supplier-items-table.tsx
'use client'

import { useState, useMemo } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ArrowUpDown } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface SupplierItem {
  id: string
  description: string
  normalizedItem: string | null
  amount: number
  date: string
  supplier: { id: string; name: string }
  project: { id: string; title: string } | null
}

interface SupplierItemsTableProps {
  items: SupplierItem[]
  categories: string[] // Unique normalizedItem values
  suppliers: { id: string; name: string }[]
}

export function SupplierItemsTable({ items, categories, suppliers }: SupplierItemsTableProps) {
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)
  const [supplierFilter, setSupplierFilter] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [search, setSearch] = useState('')

  const filteredItems = useMemo(() => {
    let result = items

    // Category filter
    if (categoryFilter) {
      result = result.filter(item => item.normalizedItem === categoryFilter)
    }

    // Supplier filter
    if (supplierFilter) {
      result = result.filter(item => item.supplier.id === supplierFilter)
    }

    // Search
    if (search) {
      const lowerSearch = search.toLowerCase()
      result = result.filter(item =>
        item.description.toLowerCase().includes(lowerSearch) ||
        item.normalizedItem?.toLowerCase().includes(lowerSearch)
      )
    }

    // Sort by amount
    result = [...result].sort((a, b) =>
      sortDirection === 'asc' ? a.amount - b.amount : b.amount - a.amount
    )

    return result
  }, [items, categoryFilter, supplierFilter, search, sortDirection])

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <Input
          placeholder="Search items..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64"
        />
        <Select value={categoryFilter || 'all'} onValueChange={(v) => setCategoryFilter(v === 'all' ? null : v)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={supplierFilter || 'all'} onValueChange={(v) => setSupplierFilter(v === 'all' ? null : v)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Suppliers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Suppliers</SelectItem>
            {suppliers.map((sup) => (
              <SelectItem key={sup.id} value={sup.id}>{sup.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Description</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Supplier</TableHead>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSortDirection(d => d === 'asc' ? 'desc' : 'asc')}
              >
                Price <ArrowUpDown className="ml-1 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>Project</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredItems.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.description}</TableCell>
              <TableCell>{item.normalizedItem || '-'}</TableCell>
              <TableCell>{item.supplier.name}</TableCell>
              <TableCell>{formatCurrency(item.amount)}</TableCell>
              <TableCell>{item.project?.title || '-'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="text-sm text-muted-foreground">
        Showing {filteredItems.length} of {items.length} items
      </div>
    </div>
  )
}
```

### Pattern 4: Inline Edit for normalizedItem
**What:** User can click to edit normalizedItem if AI got it wrong
**When to use:** In table cell or cost detail
**Example:**
```typescript
// components/supplier-items/normalized-item-edit.tsx
'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Check, X, Pencil } from 'lucide-react'

interface NormalizedItemEditProps {
  costId: string
  value: string | null
  onUpdate: (newValue: string) => void
}

export function NormalizedItemEdit({ costId, value, onUpdate }: NormalizedItemEditProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value || '')
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/costs/${costId}/normalize`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ normalizedItem: editValue.trim() }),
      })
      if (response.ok) {
        onUpdate(editValue.trim())
        setIsEditing(false)
      }
    } catch (error) {
      console.error('Failed to update:', error)
    } finally {
      setIsSaving(false)
    }
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <Input
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          className="h-7 w-40"
        />
        <Button size="icon" variant="ghost" onClick={handleSave} disabled={isSaving}>
          <Check className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost" onClick={() => setIsEditing(false)}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1 group">
      <span>{value || '-'}</span>
      <Button
        size="icon"
        variant="ghost"
        className="h-6 w-6 opacity-0 group-hover:opacity-100"
        onClick={() => setIsEditing(true)}
      >
        <Pencil className="h-3 w-3" />
      </Button>
    </div>
  )
}
```

### Anti-Patterns to Avoid
- **Storing embedding AND normalizedItem:** Both serve same purpose; normalizedItem is simpler and more user-friendly
- **Blocking UI on AI categorization:** Use fire-and-forget pattern, not await
- **Creating separate SupplierItem model:** Reuse Cost with supplier link (already exists)
- **Complex AI prompt for categorization:** Keep it simple; user can edit if wrong
- **Not indexing normalizedItem:** Add database index for efficient filtering

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| AI categorization | Custom NLP | OpenAI gpt-4o-mini | Already integrated, $0.0001/1K tokens |
| Table filtering | Complex state logic | useMemo with filter chain | React pattern, no library needed |
| Table sorting | Custom comparators | Array.sort with direction toggle | Simple, built-in |
| Inline editing | Custom input toggle | Component pattern from company-list | Existing pattern in codebase |

**Key insight:** The existing codebase has all patterns needed. No new libraries or complex solutions required. The AI categorization is a simple text-in-text-out call.

## Common Pitfalls

### Pitfall 1: AI Categorization Inconsistency
**What goes wrong:** Same item gets different normalizedItem values from different descriptions
**Why it happens:** AI is non-deterministic; "A4 paper" vs "A4 printing paper"
**How to avoid:** Set temperature=0 in OpenAI call; use explicit examples in system prompt
**Warning signs:** Same product from same supplier has different categories

### Pitfall 2: Blocking UI on AI Call
**What goes wrong:** Cost creation feels slow (2-3 seconds wait)
**Why it happens:** Synchronous AI call in request handler
**How to avoid:** Fire-and-forget pattern; create cost first, categorize async
**Warning signs:** Users complaining about slow cost creation

### Pitfall 3: Missing normalizedItem for Existing Costs
**What goes wrong:** Table has many "-" values after deployment
**Why it happens:** Existing costs have no normalizedItem
**How to avoid:** Create backfill script/endpoint to categorize existing costs with suppliers
**Warning signs:** Empty category filter dropdown, many uncategorized items

### Pitfall 4: Too Many Unique Categories
**What goes wrong:** Filter dropdown has hundreds of options
**Why it happens:** AI creates slightly different names for same product
**How to avoid:** User can edit to normalize; consider suggesting existing values
**Warning signs:** "A4 Paper 80gsm" and "A4 Paper 80 GSM" as separate categories

### Pitfall 5: Not Re-categorizing on Description Update
**What goes wrong:** normalizedItem becomes stale when description changes
**Why it happens:** Only categorize on create, not update
**How to avoid:** Also trigger categorization in PATCH handler when description changes
**Warning signs:** Old category after user edits description

## Code Examples

Verified patterns from official sources:

### Prisma Schema Addition
```prisma
// Add to Cost model in schema.prisma
model Cost {
  id          String   @id @default(cuid())
  description String   @db.VarChar(500)
  amount      Decimal  @db.Decimal(12, 2)
  date        DateTime @default(now())

  projectId String  @map("project_id")
  project   Project @relation(fields: [projectId], references: [id], onDelete: Cascade)

  categoryId String       @map("category_id")
  category   CostCategory @relation(fields: [categoryId], references: [id])

  receiptPath String? @map("receipt_path") @db.VarChar(500)
  aiImported Boolean @default(false) @map("ai_imported")
  embedding Json? @db.Json

  supplierId String?   @map("supplier_id")
  supplier   Supplier? @relation(fields: [supplierId], references: [id])

  // NEW: AI-assigned normalized item name for categorization
  normalizedItem String? @map("normalized_item") @db.VarChar(100)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([projectId])
  @@index([categoryId])
  @@index([date])
  @@index([supplierId])
  @@index([normalizedItem])  // NEW: index for filtering
  @@map("costs")
}
```

### Supplier Items API Route
```typescript
// src/app/api/supplier-items/route.ts
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-utils'

// GET /api/supplier-items - List all costs with suppliers for price comparison
export async function GET(request: NextRequest) {
  const { error } = await requireAuth()
  if (error) return error

  try {
    const searchParams = request.nextUrl.searchParams
    const categoryFilter = searchParams.get('category')
    const supplierFilter = searchParams.get('supplier')

    // Build where clause
    const where: Record<string, unknown> = {
      supplierId: { not: null },
    }

    if (categoryFilter) {
      where.normalizedItem = categoryFilter
    }

    if (supplierFilter) {
      where.supplierId = supplierFilter
    }

    // Fetch costs with suppliers
    const costs = await prisma.cost.findMany({
      where,
      select: {
        id: true,
        description: true,
        normalizedItem: true,
        amount: true,
        date: true,
        supplier: { select: { id: true, name: true } },
        project: { select: { id: true, title: true } },
      },
      orderBy: { date: 'desc' },
    })

    // Get unique categories and suppliers for filter dropdowns
    const [categories, suppliers] = await Promise.all([
      prisma.cost.groupBy({
        by: ['normalizedItem'],
        where: {
          supplierId: { not: null },
          normalizedItem: { not: null },
        },
      }),
      prisma.supplier.findMany({
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
    ])

    // Serialize costs
    const serializedCosts = costs.map(cost => ({
      ...cost,
      amount: Number(cost.amount),
    }))

    return NextResponse.json({
      items: serializedCosts,
      categories: categories
        .map(c => c.normalizedItem)
        .filter((c): c is string => c !== null)
        .sort(),
      suppliers,
    })
  } catch (error) {
    console.error('Error fetching supplier items:', error)
    return NextResponse.json(
      { error: 'Failed to fetch supplier items' },
      { status: 500 }
    )
  }
}
```

### Cost Normalize Endpoint
```typescript
// src/app/api/costs/[id]/normalize/route.ts
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireEditor } from '@/lib/auth-utils'

// PATCH /api/costs/[id]/normalize - Update normalizedItem manually
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireEditor()
  if (error) return error

  try {
    const { id } = await params
    const body = await request.json()

    if (body.normalizedItem === undefined) {
      return NextResponse.json(
        { error: 'normalizedItem is required' },
        { status: 400 }
      )
    }

    const cost = await prisma.cost.update({
      where: { id },
      data: {
        normalizedItem: body.normalizedItem?.trim() || null,
      },
      select: {
        id: true,
        normalizedItem: true,
      },
    })

    return NextResponse.json(cost)
  } catch (error) {
    console.error('Error updating normalizedItem:', error)
    return NextResponse.json(
      { error: 'Failed to update' },
      { status: 500 }
    )
  }
}
```

### Backfill Script
```typescript
// scripts/backfill-normalized-items.ts
// Run with: npx tsx scripts/backfill-normalized-items.ts
import prisma from '../src/lib/prisma'
import { getNormalizedItem } from '../src/lib/ai-categorization'

async function backfillNormalizedItems() {
  // Get all costs with suppliers but no normalizedItem
  const costs = await prisma.cost.findMany({
    where: {
      supplierId: { not: null },
      normalizedItem: null,
    },
    select: {
      id: true,
      description: true,
    },
  })

  console.log(`Found ${costs.length} costs to categorize`)

  let processed = 0
  for (const cost of costs) {
    try {
      const normalizedItem = await getNormalizedItem(cost.description)
      await prisma.cost.update({
        where: { id: cost.id },
        data: { normalizedItem },
      })
      processed++
      if (processed % 10 === 0) {
        console.log(`Processed ${processed}/${costs.length}`)
      }
    } catch (error) {
      console.error(`Failed to categorize ${cost.id}:`, error)
    }
  }

  console.log(`Done. Categorized ${processed} costs.`)
}

backfillNormalizedItems()
```

## State of the Art

| Old Approach (v1.4) | New Approach (v1.4.1) | Why Changed | Impact |
|---------------------|----------------------|-------------|--------|
| Embedding-based semantic search | Text-based normalizedItem | Simpler, more transparent | User sees and controls categories |
| On-demand comparison | Pre-categorized table filtering | Better UX, no wait | Instant filtering |
| PriceComparisonSheet modal | Supplier items table page | Full view, easier comparison | See all prices at once |
| similarity threshold (0.7) | Exact category match | Predictable, editable | No false matches |

**Deprecated/outdated (from v1.4):**
- `PriceComparisonSheet` component - To be removed or deprecated
- `/api/suppliers/compare` endpoint - No longer needed; table filtering replaces it
- `Cost.embedding` field - Can remain for future use but not primary mechanism

## Open Questions

Things that couldn't be fully resolved:

1. **Should embedding field be removed?**
   - What we know: normalizedItem replaces its purpose
   - What's unclear: Whether embeddings might be useful for other features
   - Recommendation: Keep embedding field but stop generating new ones; remove in v2 if unused

2. **AI model selection: GPT-4o-mini vs Claude**
   - What we know: OpenAI already configured for embeddings
   - What's unclear: Claude may give better categorization (already used for doc analysis)
   - Recommendation: Use gpt-4o-mini (cheapest, fastest, already integrated)

3. **Category normalization/merging**
   - What we know: AI may create similar but not identical categories
   - What's unclear: Should system auto-merge similar categories?
   - Recommendation: Start with manual edit; add "suggest similar" feature later if needed

4. **Should normalizedItem be required for supplier costs?**
   - What we know: Required for filtering to work well
   - What's unclear: What to do if AI call fails
   - Recommendation: Optional field; null values show as "-" in table

## Dependencies

Phase 36 depends on:
- **Phase 30 (Supplier Management):** Supplier model and Cost.supplierId - COMPLETE
- **Phase 35 (AI Price Comparison):** OpenAI integration - COMPLETE (to be deprecated for this use case)
- **v1.4 completion:** All prerequisites met

## Implementation Priority

Based on requirements (ITEM-01 through ITEM-09):

1. **Schema & AI Foundation** (ITEM-01, ITEM-02)
   - Add normalizedItem field to Cost model
   - Create ai-categorization.ts helper
   - Modify cost creation to trigger categorization

2. **Update on Description Change** (ITEM-03)
   - Modify cost update API to re-categorize
   - Only when description actually changes

3. **Manual Edit** (ITEM-04)
   - Add normalize endpoint
   - Add inline edit component to table

4. **Supplier Items Table** (ITEM-05, ITEM-06, ITEM-07, ITEM-08, ITEM-09)
   - Create supplier-items page
   - Create supplier-items API
   - Add category filter
   - Add supplier filter
   - Add price sorting

5. **Backfill & Polish**
   - Create backfill script for existing costs
   - Add navigation link
   - Mark PriceComparisonSheet as deprecated

## Sources

### Primary (HIGH confidence)
- Existing codebase: `src/lib/embeddings.ts` - OpenAI integration pattern
- Existing codebase: `src/components/suppliers/supplier-list.tsx` - Table with filtering pattern
- Existing codebase: `src/app/api/projects/[id]/costs/route.ts` - Cost mutation pattern
- [OpenAI Chat Completions API](https://platform.openai.com/docs/api-reference/chat) - GPT-4o-mini for categorization

### Secondary (MEDIUM confidence)
- [OpenAI Pricing](https://platform.openai.com/docs/pricing) - gpt-4o-mini at $0.0001/1K input tokens
- Existing patterns: Company inline edit, supplier detail modal

### Tertiary (LOW confidence)
- Community patterns for text categorization prompts

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries already installed, patterns exist
- Architecture: HIGH - directly adapting existing cost/supplier patterns
- Pitfalls: HIGH - based on existing embedding generation experience
- AI categorization: MEDIUM - prompt may need tuning for domain-specific items

**Research date:** 2026-01-25
**Valid until:** Indefinite - patterns stable, based on existing codebase
