# Phase 30: Supplier Management - Research

**Researched:** 2026-01-24
**Domain:** Supplier CRUD with cost linkage and aggregated spend tracking
**Confidence:** HIGH

## Summary

Phase 30 implements Supplier Management, allowing users to track vendors/suppliers and link them to project costs. This builds on the established Company/Contact pattern but with a focus on vendor relationships rather than client relationships. The Supplier model already exists in the Prisma schema with all required fields (contact info, credit terms, payment terms).

The implementation follows existing codebase patterns closely:
1. **Database model exists:** `Supplier` model is fully defined in Prisma schema with `Cost` relationship
2. **Cost model has supplier field:** The `Cost` model already has `supplierId` and `supplier` relation
3. **UI patterns established:** Companies module provides the exact template for list + detail modal pattern
4. **API patterns established:** Nested route pattern (`/api/companies/[id]`) provides CRUD template

The key unique aspects of Supplier Management are:
- Linking suppliers to cost entries (SUPP-06)
- Aggregated spend calculation (sum of linked costs) (SUPP-07)
- Price list view showing all purchased items (SUPP-08)
- Projects worked on via cost linkage (SUPP-09)

**Primary recommendation:** Create a new `/suppliers` page following the Companies pattern, with a SupplierDetailModal that shows total spend, cost items (price list), and linked projects. Extend the CostForm to include optional Supplier selection.

## Current State Analysis

### Supplier Model (Already Exists in Schema)
```prisma
model Supplier {
  id              String        @id @default(cuid())
  name            String        @db.VarChar(255)

  // Contact info
  email           String?       @db.VarChar(255)
  phone           String?       @db.VarChar(50)
  address         String?       @db.Text
  website         String?       @db.VarChar(255)
  contactPerson   String?       @map("contact_person") @db.VarChar(255)

  // Credit terms
  acceptsCredit   Boolean       @default(false) @map("accepts_credit")
  paymentTerms    PaymentTerms? @map("payment_terms")

  notes           String?       @db.Text

  // Relations
  costs           Cost[]

  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  @@index([name])
  @@map("suppliers")
}
```

### PaymentTerms Enum (Already Exists)
```prisma
enum PaymentTerms {
  IMMEDIATE
  NET_7
  NET_15
  NET_30
  NET_45
  NET_60
  NET_90
}
```

### Cost Model Supplier Relation (Already Exists)
```prisma
model Cost {
  // ... other fields
  supplierId String?   @map("supplier_id")
  supplier   Supplier? @relation(fields: [supplierId], references: [id])

  @@index([supplierId])
}
```

### Navigation Structure
The sidebar currently has a CRM section with: Companies, Pipeline, Potential Projects, Projects. Suppliers could be added to this section as a vendor management complement to client management.

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Prisma | `^6.19.2` | Supplier CRUD with cost relations | Already configured, schema ready |
| shadcn/ui | various | Dialog, Table, Select, Input | Consistent with app patterns |
| lucide-react | `^0.562.0` | Icons (Truck, Building, DollarSign) | Existing pattern |
| date-fns | `^4.1.0` | Date formatting | Already used throughout app |

### Supporting (Already Installed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@radix-ui/react-dialog` | via shadcn | Supplier detail modal | Same as CompanyDetailModal |
| `@radix-ui/react-select` | via shadcn | Payment terms dropdown | Select from enum values |
| `@radix-ui/react-alert-dialog` | via shadcn | Delete confirmation | Same pattern as companies |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Modal detail view | Separate page | Modal keeps context, matches companies pattern |
| Inline supplier select in cost form | Separate supplier linking step | Inline is simpler UX, one-step process |
| Hardcoded payment terms | Database-driven options | Enum is simpler, terms rarely change |

**Installation:**
```bash
# No new packages needed - all dependencies already installed
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   ├── (dashboard)/
│   │   └── suppliers/
│   │       └── page.tsx                  # Supplier list page (server component)
│   └── api/
│       └── suppliers/
│           ├── route.ts                  # GET (list), POST (create)
│           └── [id]/
│               └── route.ts              # GET (detail), PATCH, DELETE
├── components/
│   └── suppliers/
│       ├── supplier-list.tsx             # Client: table + search
│       ├── supplier-detail-modal.tsx     # Client: modal with inline editing
│       ├── supplier-inline-field.tsx     # Client: reusable inline edit field
│       ├── supplier-select.tsx           # Client: combobox for cost form
│       └── payment-terms-select.tsx      # Client: payment terms dropdown
└── lib/
    └── supplier-utils.ts                 # Payment terms formatters, colors
```

### Pattern 1: Supplier List Page (Server Component)
**What:** Follow the Companies page pattern for initial data fetch
**Source:** `src/app/(dashboard)/companies/page.tsx`
**Example:**
```typescript
// src/app/(dashboard)/suppliers/page.tsx
import prisma from '@/lib/prisma'
import { SupplierList } from '@/components/suppliers/supplier-list'

export default async function SuppliersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>
}) {
  const { search } = await searchParams

  const suppliers = await prisma.supplier.findMany({
    where: search ? { name: { contains: search } } : {},
    include: {
      _count: {
        select: { costs: true },
      },
    },
    orderBy: { name: 'asc' },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your vendors and track spending
        </p>
      </div>
      <SupplierList initialData={suppliers} />
    </div>
  )
}
```

### Pattern 2: Supplier API Routes (CRUD)
**What:** Follow the Companies API pattern for GET list, POST create, GET one, PATCH update, DELETE
**Source:** `src/app/api/companies/route.ts`, `src/app/api/companies/[id]/route.ts`
**Example:**
```typescript
// src/app/api/suppliers/route.ts
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth, requireEditor } from '@/lib/auth-utils'

// GET /api/suppliers - List all suppliers with cost counts
export async function GET(request: NextRequest) {
  const { error } = await requireAuth()
  if (error) return error

  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search')

    const suppliers = await prisma.supplier.findMany({
      where: search ? { name: { contains: search } } : {},
      include: {
        _count: {
          select: { costs: true },
        },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(suppliers)
  } catch (error) {
    console.error('Error fetching suppliers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch suppliers' },
      { status: 500 }
    )
  }
}

// POST /api/suppliers - Create new supplier
export async function POST(request: NextRequest) {
  const { error } = await requireEditor()
  if (error) return error

  try {
    const body = await request.json()

    if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
      return NextResponse.json(
        { error: 'Supplier name is required' },
        { status: 400 }
      )
    }

    const supplier = await prisma.supplier.create({
      data: {
        name: body.name.trim(),
        email: body.email || null,
        phone: body.phone || null,
        address: body.address || null,
        website: body.website || null,
        contactPerson: body.contactPerson || null,
        acceptsCredit: body.acceptsCredit ?? false,
        paymentTerms: body.paymentTerms || null,
        notes: body.notes || null,
      },
      include: {
        _count: {
          select: { costs: true },
        },
      },
    })

    return NextResponse.json(supplier, { status: 201 })
  } catch (error) {
    console.error('Error creating supplier:', error)
    return NextResponse.json(
      { error: 'Failed to create supplier' },
      { status: 500 }
    )
  }
}
```

### Pattern 3: Supplier Detail API with Aggregations
**What:** GET endpoint returns supplier with total spend, cost items, and linked projects
**Example:**
```typescript
// src/app/api/suppliers/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth, requireEditor } from '@/lib/auth-utils'

// GET /api/suppliers/[id] - Get supplier with costs, spend, and projects
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth()
  if (error) return error

  try {
    const { id } = await params
    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        costs: {
          select: {
            id: true,
            description: true,
            amount: true,
            date: true,
            category: { select: { id: true, name: true } },
            project: {
              select: {
                id: true,
                title: true,
                company: { select: { id: true, name: true } },
              }
            },
          },
          orderBy: { date: 'desc' },
        },
        _count: {
          select: { costs: true },
        },
      },
    })

    if (!supplier) {
      return NextResponse.json(
        { error: 'Supplier not found' },
        { status: 404 }
      )
    }

    // Calculate total spend
    const totalSpend = supplier.costs.reduce(
      (sum, cost) => sum + Number(cost.amount),
      0
    )

    // Get unique projects
    const projectMap = new Map()
    supplier.costs.forEach((cost) => {
      if (cost.project && !projectMap.has(cost.project.id)) {
        projectMap.set(cost.project.id, {
          id: cost.project.id,
          title: cost.project.title,
          company: cost.project.company,
        })
      }
    })
    const projects = Array.from(projectMap.values())

    // Serialize costs with Number conversion
    const serializedCosts = supplier.costs.map((cost) => ({
      ...cost,
      amount: Number(cost.amount),
    }))

    return NextResponse.json({
      ...supplier,
      costs: serializedCosts,
      totalSpend,
      projects,
    })
  } catch (error) {
    console.error('Error fetching supplier:', error)
    return NextResponse.json(
      { error: 'Failed to fetch supplier' },
      { status: 500 }
    )
  }
}

// PATCH /api/suppliers/[id] - Partial update
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireEditor()
  if (error) return error

  try {
    const { id } = await params
    const body = await request.json()

    const supplier = await prisma.supplier.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.email !== undefined && { email: body.email || null }),
        ...(body.phone !== undefined && { phone: body.phone || null }),
        ...(body.address !== undefined && { address: body.address || null }),
        ...(body.website !== undefined && { website: body.website || null }),
        ...(body.contactPerson !== undefined && { contactPerson: body.contactPerson || null }),
        ...(body.acceptsCredit !== undefined && { acceptsCredit: body.acceptsCredit }),
        ...(body.paymentTerms !== undefined && { paymentTerms: body.paymentTerms || null }),
        ...(body.notes !== undefined && { notes: body.notes || null }),
      },
    })

    return NextResponse.json(supplier)
  } catch (error) {
    console.error('Error updating supplier:', error)
    return NextResponse.json(
      { error: 'Failed to update supplier' },
      { status: 500 }
    )
  }
}

// DELETE /api/suppliers/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireEditor()
  if (error) return error

  try {
    const { id } = await params

    // Check for linked costs
    const linkedCount = await prisma.supplier.findUnique({
      where: { id },
      select: {
        _count: { select: { costs: true } },
      },
    })

    if (linkedCount && linkedCount._count.costs > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete: ${linkedCount._count.costs} cost${linkedCount._count.costs > 1 ? 's' : ''} linked to this supplier`,
        },
        { status: 400 }
      )
    }

    await prisma.supplier.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting supplier:', error)
    return NextResponse.json(
      { error: 'Failed to delete supplier' },
      { status: 500 }
    )
  }
}
```

### Pattern 4: Supplier Select Combobox for Cost Form
**What:** Searchable dropdown for selecting supplier when creating/editing cost
**Source:** Similar to `CompanySelect` in pipeline module
**Example:**
```typescript
// src/components/suppliers/supplier-select.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Check, ChevronsUpDown, Truck, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Supplier {
  id: string
  name: string
}

interface SupplierSelectProps {
  value: string | null
  onValueChange: (value: string | null) => void
  disabled?: boolean
}

export function SupplierSelect({
  value,
  onValueChange,
  disabled,
}: SupplierSelectProps) {
  const [open, setOpen] = useState(false)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const fetchSuppliers = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/suppliers')
      if (response.ok) {
        const data = await response.json()
        setSuppliers(data)
      }
    } catch (error) {
      console.error('Failed to fetch suppliers:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open && suppliers.length === 0) {
      fetchSuppliers()
    }
  }, [open, suppliers.length, fetchSuppliers])

  const selectedSupplier = suppliers.find((s) => s.id === value)

  return (
    <div className="flex gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="flex-1 justify-between"
            disabled={disabled}
          >
            {selectedSupplier ? (
              <span className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-gray-400" />
                {selectedSupplier.name}
              </span>
            ) : (
              <span className="text-muted-foreground">Select supplier (optional)</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search suppliers..." />
            <CommandList>
              <CommandEmpty>
                {isLoading ? 'Loading...' : 'No supplier found.'}
              </CommandEmpty>
              <CommandGroup>
                {suppliers.map((supplier) => (
                  <CommandItem
                    key={supplier.id}
                    value={supplier.name}
                    onSelect={() => {
                      onValueChange(supplier.id)
                      setOpen(false)
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value === supplier.id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <Truck className="mr-2 h-4 w-4 text-gray-400" />
                    {supplier.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {value && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onValueChange(null)}
          disabled={disabled}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
```

### Pattern 5: Supplier Detail Modal with Spend Summary
**What:** Modal showing supplier details, total spend, price list (costs), and linked projects
**Source:** Follow `CompanyDetailModal` pattern
**Example structure:**
```typescript
// src/components/suppliers/supplier-detail-modal.tsx
// Key sections:
// 1. Header with supplier name (inline editable)
// 2. Contact info grid (email, phone, address, website, contact person)
// 3. Credit terms section (accepts credit toggle, payment terms select)
// 4. Notes (inline editable textarea)
// 5. Separator
// 6. Financial Summary Card showing Total Spend
// 7. Price List section (all cost items from this supplier)
// 8. Projects Worked On section (unique projects from costs)
// 9. Footer with delete button and close
```

### Pattern 6: Extended Cost Form with Supplier
**What:** Add optional supplier selection to the existing CostForm
**Where:** Modify `src/components/projects/cost-form.tsx`
**Example addition:**
```typescript
// Add to cost-form.tsx interface
interface CostFormProps {
  projectId: string
  cost?: Cost & { supplierId?: string | null }  // Extended to include supplierId
  categories: CostCategory[]
  onSuccess: () => void
  onCancel: () => void
}

// Add state
const [supplierId, setSupplierId] = useState<string | null>(cost?.supplierId || null)

// Add to form body (after category select)
<div className="space-y-2">
  <Label>Supplier</Label>
  <SupplierSelect
    value={supplierId}
    onValueChange={setSupplierId}
  />
  <p className="text-xs text-muted-foreground">
    Optional: Link this cost to a supplier for spend tracking
  </p>
</div>

// Add to submit body
body: JSON.stringify({
  // ... existing fields
  supplierId: supplierId || null,
}),
```

### Pattern 7: Supplier Utils
**What:** Helper functions for payment terms formatting and credit status display
**Example:**
```typescript
// src/lib/supplier-utils.ts

// Payment terms display names
export const PAYMENT_TERMS_OPTIONS = [
  { id: 'IMMEDIATE', label: 'Immediate', description: 'Payment due immediately' },
  { id: 'NET_7', label: 'Net 7', description: 'Payment due in 7 days' },
  { id: 'NET_15', label: 'Net 15', description: 'Payment due in 15 days' },
  { id: 'NET_30', label: 'Net 30', description: 'Payment due in 30 days' },
  { id: 'NET_45', label: 'Net 45', description: 'Payment due in 45 days' },
  { id: 'NET_60', label: 'Net 60', description: 'Payment due in 60 days' },
  { id: 'NET_90', label: 'Net 90', description: 'Payment due in 90 days' },
]

export function formatPaymentTerms(terms: string | null): string {
  if (!terms) return 'Not specified'
  const option = PAYMENT_TERMS_OPTIONS.find((o) => o.id === terms)
  return option?.label || terms
}

export function getPaymentTermsColor(terms: string | null): string {
  if (!terms) return 'bg-gray-100 text-gray-600'

  const colors: Record<string, string> = {
    IMMEDIATE: 'bg-red-100 text-red-700',
    NET_7: 'bg-amber-100 text-amber-700',
    NET_15: 'bg-yellow-100 text-yellow-700',
    NET_30: 'bg-blue-100 text-blue-700',
    NET_45: 'bg-indigo-100 text-indigo-700',
    NET_60: 'bg-purple-100 text-purple-700',
    NET_90: 'bg-violet-100 text-violet-700',
  }

  return colors[terms] || 'bg-gray-100 text-gray-600'
}

export function getCreditStatusBadge(acceptsCredit: boolean): {
  label: string
  color: string
} {
  return acceptsCredit
    ? { label: 'Accepts Credit', color: 'bg-green-100 text-green-700' }
    : { label: 'No Credit', color: 'bg-gray-100 text-gray-600' }
}
```

### Anti-Patterns to Avoid
- **Separate supplier-cost linking step:** Link supplier directly in cost form, not as a separate action
- **Storing spend totals in Supplier table:** Calculate dynamically from costs, not stored (would get stale)
- **Cascading delete of costs:** Don't delete costs when supplier is deleted; set supplierId to null instead (or prevent deletion if costs exist)
- **Complex supplier hierarchy:** Keep it flat for now, no supplier categories or parent-child relationships
- **Duplicate navigation entry:** Add Suppliers under CRM section, not as a top-level item

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Supplier searchable select | Custom autocomplete | Command component (cmdk) | Already installed, keyboard navigation |
| Delete confirmation | window.confirm | AlertDialog | Consistent UI, accessible |
| Inline field editing | Custom toggle states | CompanyInlineField pattern | Already exists, proven |
| Total spend calculation | Stored aggregate | Prisma `reduce` on costs | Always accurate, no sync issues |
| Payment terms dropdown | Hardcoded text | Select with PAYMENT_TERMS_OPTIONS | Type-safe, consistent |

**Key insight:** The Supplier module is almost identical to Companies module in structure. Use the exact same patterns (table list, detail modal, inline editing, CRUD API routes) with adjusted fields and additional spend/price list views.

## Common Pitfalls

### Pitfall 1: Decimal to Number Conversion for Spend
**What goes wrong:** Total spend shows as "[object Object]" or NaN
**Why it happens:** Prisma Decimal not converted before aggregation
**How to avoid:** Convert each cost.amount to Number before reduce
**Warning signs:** Display showing wrong spend values
```typescript
// Correct approach
const totalSpend = supplier.costs.reduce(
  (sum, cost) => sum + Number(cost.amount),
  0
)
```

### Pitfall 2: Supplier Deletion with Linked Costs
**What goes wrong:** Foreign key constraint error or orphaned costs
**Why it happens:** Costs still reference deleted supplier
**How to avoid:** Prevent deletion if costs exist, or set supplierId to null (updateMany)
**Warning signs:** Error on delete, or costs with null supplier showing errors

### Pitfall 3: Projects List Duplication
**What goes wrong:** Same project appears multiple times in "Projects Worked On"
**Why it happens:** Multiple costs from same project
**How to avoid:** Use Map or Set to deduplicate projects from costs
**Warning signs:** Project list shows duplicates
```typescript
// Correct approach
const projectMap = new Map()
supplier.costs.forEach((cost) => {
  if (cost.project && !projectMap.has(cost.project.id)) {
    projectMap.set(cost.project.id, cost.project)
  }
})
const projects = Array.from(projectMap.values())
```

### Pitfall 4: Supplier Select Not Loading
**What goes wrong:** Empty dropdown when opening supplier select
**Why it happens:** Fetch not triggered, or suppliers not loaded on open
**How to avoid:** Fetch suppliers when popover opens (if not already loaded)
**Warning signs:** Empty command list despite having suppliers

### Pitfall 5: Missing Supplier in Cost Card
**What goes wrong:** Cost card doesn't show supplier name
**Why it happens:** Supplier not included in costs query
**How to avoid:** Include supplier in costs fetch: `include: { supplier: { select: { id, name } } }`
**Warning signs:** Supplier field empty on cost cards

### Pitfall 6: Payment Terms Null Handling
**What goes wrong:** Error when paymentTerms is null
**Why it happens:** Direct access without null check
**How to avoid:** Use optional chaining and fallback: `formatPaymentTerms(supplier.paymentTerms)`
**Warning signs:** TypeScript errors or runtime null reference

## Code Examples

### Navigation Update
```typescript
// Add to src/components/layout/sidebar.tsx after Projects link
<Link
  href="/suppliers"
  className={cn(
    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
    pathname.startsWith('/suppliers')
      ? 'bg-gray-100 text-gray-900'
      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
  )}
>
  <Truck className="h-5 w-5" />
  Suppliers
</Link>
```

### Cost API Update for Supplier
```typescript
// Update src/app/api/projects/[id]/costs/route.ts POST handler
const cost = await prisma.cost.create({
  data: {
    projectId: id,
    description: body.description.trim(),
    amount: parseFloat(body.amount),
    categoryId: body.categoryId,
    date: body.date ? new Date(body.date) : new Date(),
    supplierId: body.supplierId || null,  // NEW: optional supplier
  },
  include: {
    category: { select: { id: true, name: true } },
    supplier: { select: { id: true, name: true } },  // NEW: include supplier
  },
})
```

### Cost Card with Supplier Display
```typescript
// Update src/components/projects/cost-card.tsx
interface Cost {
  id: string
  description: string
  amount: number
  date: string
  category: { id: string; name: string }
  supplier?: { id: string; name: string } | null  // NEW
}

// In the card display, add supplier name if present
{cost.supplier && (
  <div className="flex items-center gap-1 text-xs text-gray-500">
    <Truck className="h-3 w-3" />
    {cost.supplier.name}
  </div>
)}
```

### Supplier Detail Modal Financial Summary
```typescript
// Financial summary section in supplier-detail-modal.tsx
<div className="space-y-3">
  <Label className="text-muted-foreground">Financial Summary</Label>

  {/* Total Spend Card */}
  <Card className="p-4 bg-blue-50 border-blue-200">
    <div className="flex items-center gap-2">
      <DollarSign className="h-5 w-5 text-blue-600" />
      <div className="text-sm text-blue-600 font-medium">Total Spend</div>
    </div>
    <div className="text-2xl font-bold text-blue-700 mt-1">
      {formatCurrency(supplier.totalSpend)}
    </div>
    <div className="text-xs text-blue-600/70 mt-0.5">
      From {supplier.costs.length} purchase{supplier.costs.length !== 1 ? 's' : ''}
    </div>
  </Card>

  {/* Credit Terms */}
  <div className="flex items-center gap-2">
    <Badge className={getCreditStatusBadge(supplier.acceptsCredit).color}>
      {getCreditStatusBadge(supplier.acceptsCredit).label}
    </Badge>
    {supplier.paymentTerms && (
      <Badge className={getPaymentTermsColor(supplier.paymentTerms)}>
        {formatPaymentTerms(supplier.paymentTerms)}
      </Badge>
    )}
  </div>
</div>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Supplier as free text on cost | Supplier as linked entity | Schema v1.4 | Enables spend tracking, reporting |
| No credit tracking | acceptsCredit + paymentTerms fields | Schema v1.4 | Better vendor management |
| Manual spend calculation | Auto-calculated from costs | This phase | Always accurate |

**Deprecated/outdated:**
- None - this is new implementation following established patterns

## Open Questions

1. **Should suppliers have categories/types?**
   - What we know: Schema has no category field
   - What's unclear: Whether users need to categorize suppliers (e.g., "Materials", "Services")
   - Recommendation: Defer for now, can add later if needed

2. **Should cost deletion affect supplier?**
   - Current: Deleting cost removes it from supplier's cost list
   - What's unclear: Should we track "former purchases" separately?
   - Recommendation: Simple delete is fine, historical tracking is overkill for MVP

3. **Should suppliers be shareable across companies?**
   - Current: Suppliers are global (not company-specific)
   - What's unclear: Whether suppliers should be company-scoped
   - Recommendation: Keep global - a supplier can serve multiple projects/companies

## Dependencies

Phase 30 depends on:
- **Phase 29 (Schema Foundation):** Supplier model exists - COMPLETE
- **Phase 14 (Project Costs):** Cost model with supplierId field - EXISTS

## Implementation Priority

Based on requirements (SUPP-01 through SUPP-09):

1. **Supplier CRUD Foundation** (SUPP-01 to SUPP-05)
   - Create API routes (list, create, read, update, delete)
   - Create supplier list page with search
   - Create supplier detail modal with inline editing
   - Add navigation link

2. **Cost-Supplier Linkage** (SUPP-06)
   - Add SupplierSelect component
   - Extend CostForm with supplier field
   - Update cost API to include supplierId
   - Update cost card to show supplier name

3. **Supplier Analytics** (SUPP-07 to SUPP-09)
   - Add total spend calculation in detail API
   - Create price list section (cost items) in detail modal
   - Create projects worked on section in detail modal

## Sources

### Primary (HIGH confidence)
- Prisma schema: `prisma/schema.prisma` - Supplier model verified
- Existing codebase: `src/app/api/companies/route.ts` - API pattern
- Existing codebase: `src/app/api/companies/[id]/route.ts` - Detail API pattern
- Existing codebase: `src/components/companies/company-list.tsx` - List pattern
- Existing codebase: `src/components/companies/company-detail-modal.tsx` - Modal pattern
- Existing codebase: `src/components/projects/cost-form.tsx` - Form to extend
- Existing codebase: `src/components/layout/sidebar.tsx` - Navigation structure

### Secondary (MEDIUM confidence)
- Phase 10 (Companies & Contacts) research - same patterns apply
- Phase 14 (Project Costs) research - cost form extension pattern

### Tertiary (LOW confidence)
- None - all patterns verified against existing codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries already installed, schema exists
- Architecture: HIGH - directly adapting existing company/cost patterns
- Pitfalls: HIGH - based on existing code patterns and common issues
- UI patterns: HIGH - exact templates exist in codebase (companies pattern)

**Research date:** 2026-01-24
**Valid until:** Indefinite - patterns stable, based on existing codebase
