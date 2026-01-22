# Phase 14: Project Costs - Research

**Researched:** 2026-01-22
**Domain:** Cost tracking and profit calculation for projects
**Confidence:** HIGH

## Summary

Phase 14 implements cost tracking for projects, allowing users to add, edit, and delete cost items categorized by type (Labor, Materials, Vendors, Travel, Software, Other). The phase also adds profit calculation (revenue minus total costs) to the project detail view.

The foundation is already in place:
1. **Database models exist:** `Cost` and `CostCategory` models are fully defined in Prisma schema with proper relationships
2. **Seed data prepared:** `prisma/seed-cost-categories.ts` already defines the 6 required categories
3. **Project detail sheet exists:** `ProjectDetailSheet` component provides the base UI to extend with cost management
4. **Patterns established:** Company contacts pattern provides the exact template for nested item CRUD

The implementation follows existing patterns closely - costs are child items of projects, similar to how contacts are child items of companies. The nested API route pattern (`/api/projects/[id]/costs`) and the inline CRUD UI pattern (ContactCard/ContactForm) can be directly adapted.

**Primary recommendation:** Extend the existing `ProjectDetailSheet` component with a costs section following the `CompanyDetailModal` contacts pattern. Add costs API routes nested under projects. Run cost categories seed before development.

## Current State Analysis

### Cost Model (Already Exists in Schema)
```prisma
model Cost {
  id            String            @id @default(cuid())
  description   String            @db.VarChar(500)
  amount        Decimal           @db.Decimal(12, 2)
  date          DateTime          @default(now())

  projectId     String            @map("project_id")
  project       Project           @relation(fields: [projectId], references: [id], onDelete: Cascade)

  categoryId    String            @map("category_id")
  category      CostCategory      @relation(fields: [categoryId], references: [id])

  receiptPath   String?           @db.VarChar(500) @map("receipt_path")

  createdAt     DateTime          @default(now())
  updatedAt     DateTime          @updatedAt

  @@index([projectId])
  @@index([categoryId])
  @@index([date])
  @@map("costs")
}
```

### CostCategory Model (Already Exists in Schema)
```prisma
model CostCategory {
  id          String              @id @default(cuid())
  name        String              @unique @db.VarChar(50)
  description String?             @db.VarChar(255)
  sortOrder   Int                 @default(0) @map("sort_order")
  isActive    Boolean             @default(true) @map("is_active")

  costs       Cost[]

  createdAt   DateTime            @default(now())
  updatedAt   DateTime            @updatedAt

  @@map("cost_categories")
}
```

### Seed Data (Already Exists)
```typescript
// prisma/seed-cost-categories.ts
const categories = [
  { name: 'Labor', description: 'Internal staff costs', sortOrder: 1 },
  { name: 'Materials', description: 'Physical materials and supplies', sortOrder: 2 },
  { name: 'Vendors', description: 'Third-party contractor/vendor costs', sortOrder: 3 },
  { name: 'Travel', description: 'Transportation and accommodation', sortOrder: 4 },
  { name: 'Software', description: 'Software licenses and subscriptions', sortOrder: 5 },
  { name: 'Other', description: 'Miscellaneous costs', sortOrder: 6 },
]
```

### Project-Cost Relationship (Already Exists)
```prisma
model Project {
  // ... other fields
  costs           Cost[]
}
```

### Existing UI Components Available
- `ProjectDetailSheet`: Base component to extend (like CompanyDetailModal has contacts)
- `Calendar`: Date picker using react-day-picker 9.x
- `ContactCard` / `ContactForm`: Pattern for inline item editing
- All required shadcn/ui components installed

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Prisma | `^6.5.0` | Cost CRUD with cascading deletes | Already configured, schema ready |
| shadcn/ui | various | Dialog, Select, Input, Calendar | Consistent with app patterns |
| react-day-picker | `^9.13.0` | Date picker for cost date | Already used in initiative form |
| date-fns | `^4.1.0` | Date formatting | Already used throughout app |
| lucide-react | `^0.562.0` | Icons (DollarSign, Receipt, Plus, Trash2) | Existing pattern |

### Supporting (Already Installed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@radix-ui/react-select` | via shadcn | Category dropdown | Select cost category |
| `@radix-ui/react-popover` | via shadcn | Date picker popover | Wrap Calendar component |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Inline editing in sheet | Separate modal for each cost | Sheet keeps context, modal would lose project context |
| Cost list in sheet | Separate costs page | Sheet provides immediate visibility; page adds navigation |
| Decimal for amount | Float | Decimal avoids floating point errors for financial data |

**Installation:**
```bash
# No new packages needed - all dependencies already installed
# Run seed for cost categories:
npx ts-node prisma/seed-cost-categories.ts
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   └── api/
│       ├── projects/
│       │   └── [id]/
│       │       └── costs/
│       │           ├── route.ts                  # GET (list), POST (create)
│       │           └── [costId]/
│       │               └── route.ts              # PATCH, DELETE
│       └── cost-categories/
│           └── route.ts                          # GET (list active categories)
├── components/
│   └── projects/
│       ├── project-detail-sheet.tsx              # Extend with costs section
│       ├── cost-list.tsx                         # Cost items list with totals
│       ├── cost-form.tsx                         # Add/edit cost form
│       └── cost-card.tsx                         # Individual cost display/edit
└── lib/
    └── cost-utils.ts                             # Category colors, formatters
```

### Pattern 1: Nested API Routes (Costs under Projects)
**What:** Follow the contacts-under-companies pattern for costs-under-projects
**Source:** `src/app/api/companies/[id]/contacts/route.ts`
**Example:**
```typescript
// src/app/api/projects/[id]/costs/route.ts
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth, requireEditor } from '@/lib/auth-utils'

// GET /api/projects/[id]/costs - List costs for project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth()
  if (error) return error

  try {
    const { id } = await params

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    const costs = await prisma.cost.findMany({
      where: { projectId: id },
      include: {
        category: { select: { id: true, name: true } },
      },
      orderBy: [
        { date: 'desc' },
        { createdAt: 'desc' },
      ],
    })

    return NextResponse.json(costs)
  } catch (error) {
    console.error('Error fetching costs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch costs' },
      { status: 500 }
    )
  }
}

// POST /api/projects/[id]/costs - Create cost
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireEditor()
  if (error) return error

  try {
    const { id } = await params
    const body = await request.json()

    // Validate required fields
    if (!body.description?.trim()) {
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 }
      )
    }
    if (!body.amount || isNaN(parseFloat(body.amount))) {
      return NextResponse.json(
        { error: 'Valid amount is required' },
        { status: 400 }
      )
    }
    if (!body.categoryId) {
      return NextResponse.json(
        { error: 'Category is required' },
        { status: 400 }
      )
    }

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Verify category exists and is active
    const category = await prisma.costCategory.findUnique({
      where: { id: body.categoryId },
      select: { id: true, isActive: true },
    })

    if (!category || !category.isActive) {
      return NextResponse.json(
        { error: 'Invalid category' },
        { status: 400 }
      )
    }

    const cost = await prisma.cost.create({
      data: {
        projectId: id,
        description: body.description.trim(),
        amount: parseFloat(body.amount),
        categoryId: body.categoryId,
        date: body.date ? new Date(body.date) : new Date(),
      },
      include: {
        category: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json(cost, { status: 201 })
  } catch (error) {
    console.error('Error creating cost:', error)
    return NextResponse.json(
      { error: 'Failed to create cost' },
      { status: 500 }
    )
  }
}
```

### Pattern 2: Cost Categories API (Simple Lookup)
**What:** Read-only endpoint to fetch active cost categories for dropdown
**Example:**
```typescript
// src/app/api/cost-categories/route.ts
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-utils'

// GET /api/cost-categories - List active categories
export async function GET() {
  const { error } = await requireAuth()
  if (error) return error

  try {
    const categories = await prisma.costCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        name: true,
        description: true,
      },
    })

    return NextResponse.json(categories)
  } catch (error) {
    console.error('Error fetching cost categories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}
```

### Pattern 3: Cost Form with Date Picker
**What:** Form component for adding/editing costs with date picker
**Source:** Date picker pattern from `src/components/initiatives/initiative-form.tsx`
**Example:**
```typescript
// src/components/projects/cost-form.tsx
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { format } from 'date-fns'
import { CalendarIcon, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CostCategory {
  id: string
  name: string
  description: string | null
}

interface CostFormProps {
  projectId: string
  cost?: {
    id: string
    description: string
    amount: number
    categoryId: string
    date: string
  }
  categories: CostCategory[]
  onSuccess: () => void
  onCancel: () => void
}

export function CostForm({
  projectId,
  cost,
  categories,
  onSuccess,
  onCancel,
}: CostFormProps) {
  const [description, setDescription] = useState(cost?.description || '')
  const [amount, setAmount] = useState(cost?.amount?.toString() || '')
  const [categoryId, setCategoryId] = useState(cost?.categoryId || '')
  const [date, setDate] = useState<Date>(
    cost?.date ? new Date(cost.date) : new Date()
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!description.trim()) {
      setError('Description is required')
      return
    }
    if (!amount || isNaN(parseFloat(amount))) {
      setError('Valid amount is required')
      return
    }
    if (!categoryId) {
      setError('Category is required')
      return
    }

    setIsSubmitting(true)

    try {
      const url = cost
        ? `/api/projects/${projectId}/costs/${cost.id}`
        : `/api/projects/${projectId}/costs`

      const response = await fetch(url, {
        method: cost ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: description.trim(),
          amount: parseFloat(amount),
          categoryId,
          date: date.toISOString(),
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Failed to save cost')
        return
      }

      onSuccess()
    } catch (err) {
      console.error('Failed to save cost:', err)
      setError('Failed to save cost')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg bg-gray-50">
      <div className="grid grid-cols-2 gap-4">
        {/* Description */}
        <div className="col-span-2 space-y-2">
          <Label htmlFor="cost-description">
            Description <span className="text-red-500">*</span>
          </Label>
          <Input
            id="cost-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g., Venue rental deposit"
            autoFocus
          />
        </div>

        {/* Amount */}
        <div className="space-y-2">
          <Label htmlFor="cost-amount">
            Amount (RM) <span className="text-red-500">*</span>
          </Label>
          <Input
            id="cost-amount"
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
          />
        </div>

        {/* Category */}
        <div className="space-y-2">
          <Label>
            Category <span className="text-red-500">*</span>
          </Label>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date */}
        <div className="space-y-2">
          <Label>Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !date && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, 'PPP') : 'Pick a date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => d && setDate(d)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Error message */}
      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {cost ? 'Update' : 'Add'} Cost
        </Button>
      </div>
    </form>
  )
}
```

### Pattern 4: Cost Card with Inline Edit/Delete
**What:** Display cost item with edit and delete capabilities
**Source:** Adapted from ContactCard pattern
**Example:**
```typescript
// src/components/projects/cost-card.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Edit2, Trash2 } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { getCategoryColor } from '@/lib/cost-utils'

interface Cost {
  id: string
  description: string
  amount: number
  date: string
  category: { id: string; name: string }
}

interface CostCardProps {
  cost: Cost
  projectId: string
  onEdit: (cost: Cost) => void
  onDelete: () => void
}

export function CostCard({ cost, projectId, onEdit, onDelete }: CostCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(
        `/api/projects/${projectId}/costs/${cost.id}`,
        { method: 'DELETE' }
      )

      if (response.ok) {
        onDelete()
      }
    } catch (error) {
      console.error('Failed to delete cost:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="flex items-center justify-between p-3 border rounded-lg bg-white hover:bg-gray-50">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{cost.description}</span>
          <Badge variant="outline" className={getCategoryColor(cost.category.name)}>
            {cost.category.name}
          </Badge>
        </div>
        <div className="text-sm text-gray-500 mt-1">
          {formatDate(cost.date)}
        </div>
      </div>

      <div className="flex items-center gap-2 ml-4">
        <span className="font-medium text-gray-900">
          {formatCurrency(cost.amount)}
        </span>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onEdit(cost)}
        >
          <Edit2 className="h-4 w-4" />
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Cost</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this cost item? This action
                cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
```

### Pattern 5: Project Detail Sheet with Costs Section
**What:** Extend existing ProjectDetailSheet to include costs management and profit display
**Where:** Modify `src/components/projects/project-detail-sheet.tsx`
**Example additions:**
```typescript
// Add to project-detail-sheet.tsx after KRI section

{/* Financial Summary */}
<Separator />
<div className="space-y-4">
  <h3 className="font-medium text-gray-900">Financial Summary</h3>
  <div className="grid grid-cols-3 gap-4">
    <div className="p-3 bg-green-50 rounded-lg">
      <p className="text-sm text-green-600 font-medium">Revenue</p>
      <p className="text-lg font-semibold text-green-700">
        {formatCurrency(project.revenue)}
      </p>
    </div>
    <div className="p-3 bg-red-50 rounded-lg">
      <p className="text-sm text-red-600 font-medium">Total Costs</p>
      <p className="text-lg font-semibold text-red-700">
        {formatCurrency(totalCosts)}
      </p>
    </div>
    <div className={cn(
      'p-3 rounded-lg',
      profit >= 0 ? 'bg-blue-50' : 'bg-orange-50'
    )}>
      <p className={cn(
        'text-sm font-medium',
        profit >= 0 ? 'text-blue-600' : 'text-orange-600'
      )}>
        Profit
      </p>
      <p className={cn(
        'text-lg font-semibold',
        profit >= 0 ? 'text-blue-700' : 'text-orange-700'
      )}>
        {formatCurrency(profit)}
      </p>
    </div>
  </div>
</div>

{/* Costs Section */}
<Separator />
<div className="space-y-3">
  <div className="flex items-center justify-between">
    <h3 className="font-medium text-gray-900">
      Costs
      {costs.length > 0 && (
        <span className="ml-2 text-sm font-normal text-gray-500">
          ({costs.length})
        </span>
      )}
    </h3>
    {userCanEdit && costs.length > 0 && !showAddCostForm && (
      <Button variant="ghost" size="sm" onClick={() => setShowAddCostForm(true)}>
        <Plus className="mr-1 h-4 w-4" />
        Add Cost
      </Button>
    )}
  </div>

  {/* Cost Form (Add/Edit) */}
  {showAddCostForm && (
    <CostForm
      projectId={project.id}
      cost={editingCost}
      categories={categories}
      onSuccess={handleCostAdded}
      onCancel={handleCancelCostForm}
    />
  )}

  {/* Cost List or Empty State */}
  {costs.length === 0 && !showAddCostForm ? (
    <Card className="p-6 text-center">
      <DollarSign className="mx-auto h-8 w-8 text-gray-400 mb-2" />
      <p className="text-sm text-gray-500 mb-3">No costs recorded yet</p>
      {userCanEdit && (
        <Button variant="outline" size="sm" onClick={() => setShowAddCostForm(true)}>
          <Plus className="mr-1 h-4 w-4" />
          Add your first cost
        </Button>
      )}
    </Card>
  ) : (
    <div className="space-y-2">
      {costs.map((cost) => (
        <CostCard
          key={cost.id}
          cost={cost}
          projectId={project.id}
          onEdit={handleEditCost}
          onDelete={handleCostDeleted}
        />
      ))}
    </div>
  )}
</div>
```

### Pattern 6: Cost Utils (Colors and Formatters)
**What:** Utility functions for cost category colors and formatting
**Example:**
```typescript
// src/lib/cost-utils.ts

// Cost category color mapping for badges
export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    Labor: 'bg-purple-100 text-purple-700 border-purple-200',
    Materials: 'bg-amber-100 text-amber-700 border-amber-200',
    Vendors: 'bg-blue-100 text-blue-700 border-blue-200',
    Travel: 'bg-green-100 text-green-700 border-green-200',
    Software: 'bg-cyan-100 text-cyan-700 border-cyan-200',
    Other: 'bg-gray-100 text-gray-700 border-gray-200',
  }
  return colors[category] || 'bg-gray-100 text-gray-700 border-gray-200'
}

// Calculate total costs from cost array
export function calculateTotalCosts(costs: { amount: number }[]): number {
  return costs.reduce((sum, cost) => sum + Number(cost.amount), 0)
}

// Calculate profit (revenue minus costs)
export function calculateProfit(revenue: number | null, totalCosts: number): number {
  return (revenue || 0) - totalCosts
}

// Group costs by category for breakdown display
export function groupCostsByCategory(
  costs: { amount: number; category: { name: string } }[]
): Record<string, number> {
  return costs.reduce((acc, cost) => {
    const categoryName = cost.category.name
    acc[categoryName] = (acc[categoryName] || 0) + Number(cost.amount)
    return acc
  }, {} as Record<string, number>)
}
```

### Anti-Patterns to Avoid
- **Storing costs directly in Project model:** Keep costs as separate entities for detailed tracking and querying
- **Client-side profit calculation from string amounts:** Always convert Decimal to Number server-side before sending to client
- **Fetching costs on every sheet render:** Fetch costs only when sheet opens, not on initial project list load
- **Hard-coding categories in frontend:** Fetch from API to allow future extensibility
- **Skipping project existence check:** Always verify project exists before cost CRUD operations

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Date picker | Custom date input | react-day-picker Calendar + Popover | Already installed and styled |
| Currency formatting | Custom formatter | `formatCurrency` from lib/utils | Consistent MYR formatting |
| Decimal handling | Float arithmetic | Prisma Decimal, convert to Number server-side | Financial accuracy |
| Category management | Admin UI for categories | Seed file for initial data | Categories rarely change |
| Delete confirmation | Custom modal | AlertDialog from shadcn | Consistent UX |

**Key insight:** The Cost entity follows the same parent-child pattern as Company-Contact. Use the exact same API structure and UI patterns (nested routes, inline forms, cards with actions).

## Common Pitfalls

### Pitfall 1: Decimal to Number Conversion
**What goes wrong:** Prisma Decimal values serialized as strings, causing display issues
**Why it happens:** Prisma Decimal is BigInt-based, not JSON-serializable as number
**How to avoid:** Convert to Number in API response before sending to client
**Warning signs:** Cost amounts showing as "123.45" strings or [object Object]
```typescript
// In API response transformation
const costs = await prisma.cost.findMany(...)
const serializedCosts = costs.map(cost => ({
  ...cost,
  amount: Number(cost.amount),
}))
```

### Pitfall 2: Race Condition on Rapid Add/Delete
**What goes wrong:** UI state out of sync after quick successive operations
**Why it happens:** Multiple fetch calls returning in wrong order
**How to avoid:** Refresh full costs list after any mutation, use optimistic updates carefully
**Warning signs:** Deleted items reappearing, duplicate items in list

### Pitfall 3: Missing Category Validation
**What goes wrong:** Cost created with invalid/inactive category
**Why it happens:** Frontend uses stale categories list or user manipulates request
**How to avoid:** Always validate categoryId exists and isActive in API
**Warning signs:** Costs with null category in database, broken UI displays

### Pitfall 4: Sheet State Not Reset on Close
**What goes wrong:** Edit form shows previous cost data when reopened
**Why it happens:** Form state not cleared when sheet closes
**How to avoid:** Reset form states in useEffect when `open` changes to false
**Warning signs:** Opening sheet shows stale form data from previous edit

### Pitfall 5: Profit Calculation with Null Revenue
**What goes wrong:** NaN or undefined profit displayed
**Why it happens:** Revenue is null (not set), arithmetic fails
**How to avoid:** Treat null revenue as 0 in profit calculation
**Warning signs:** "NaN" or "-" in profit display when revenue is empty

### Pitfall 6: Missing Cascade Delete Understanding
**What goes wrong:** Developer tries to manually delete costs before project
**Why it happens:** Not aware of Prisma onDelete: Cascade in schema
**How to avoid:** Trust the schema - deleting project auto-deletes all costs
**Warning signs:** Extra API calls to delete costs before project deletion

## Code Examples

### Extending Project API to Include Costs
```typescript
// src/app/api/projects/[id]/route.ts - Enhanced GET
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth()
  if (error) return error

  try {
    const { id } = await params
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        company: { select: { id: true, name: true } },
        contact: { select: { id: true, name: true } },
        sourceDeal: { select: { id: true, title: true, value: true } },
        sourcePotential: { select: { id: true, title: true, estimatedValue: true } },
        initiative: { select: { id: true, title: true } },
        // Include costs with category
        costs: {
          include: {
            category: { select: { id: true, name: true } },
          },
          orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
        },
      },
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Transform Decimals to Numbers
    const serialized = {
      ...project,
      revenue: project.revenue ? Number(project.revenue) : null,
      costs: project.costs.map(cost => ({
        ...cost,
        amount: Number(cost.amount),
      })),
    }

    return NextResponse.json(serialized)
  } catch (error) {
    console.error('Error fetching project:', error)
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    )
  }
}
```

### Individual Cost Route (PATCH/DELETE)
```typescript
// src/app/api/projects/[id]/costs/[costId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireEditor } from '@/lib/auth-utils'

// PATCH /api/projects/[id]/costs/[costId] - Update cost
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; costId: string }> }
) {
  const { error } = await requireEditor()
  if (error) return error

  try {
    const { id: projectId, costId } = await params
    const body = await request.json()

    // Verify cost exists and belongs to project
    const existingCost = await prisma.cost.findFirst({
      where: { id: costId, projectId },
    })

    if (!existingCost) {
      return NextResponse.json(
        { error: 'Cost not found' },
        { status: 404 }
      )
    }

    // If changing category, verify new category is valid
    if (body.categoryId && body.categoryId !== existingCost.categoryId) {
      const category = await prisma.costCategory.findUnique({
        where: { id: body.categoryId },
        select: { id: true, isActive: true },
      })

      if (!category || !category.isActive) {
        return NextResponse.json(
          { error: 'Invalid category' },
          { status: 400 }
        )
      }
    }

    const cost = await prisma.cost.update({
      where: { id: costId },
      data: {
        ...(body.description !== undefined && { description: body.description.trim() }),
        ...(body.amount !== undefined && { amount: parseFloat(body.amount) }),
        ...(body.categoryId !== undefined && { categoryId: body.categoryId }),
        ...(body.date !== undefined && { date: new Date(body.date) }),
      },
      include: {
        category: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json({
      ...cost,
      amount: Number(cost.amount),
    })
  } catch (error) {
    console.error('Error updating cost:', error)
    return NextResponse.json(
      { error: 'Failed to update cost' },
      { status: 500 }
    )
  }
}

// DELETE /api/projects/[id]/costs/[costId]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; costId: string }> }
) {
  const { error } = await requireEditor()
  if (error) return error

  try {
    const { id: projectId, costId } = await params

    // Verify cost exists and belongs to project
    const existingCost = await prisma.cost.findFirst({
      where: { id: costId, projectId },
    })

    if (!existingCost) {
      return NextResponse.json(
        { error: 'Cost not found' },
        { status: 404 }
      )
    }

    await prisma.cost.delete({ where: { id: costId } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting cost:', error)
    return NextResponse.json(
      { error: 'Failed to delete cost' },
      { status: 500 }
    )
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Storing cost as single field on project | Separate Cost entity with categories | Schema design v1.2 | Detailed tracking, category breakdown |
| Manual category text input | Dropdown from CostCategory lookup | Schema design v1.2 | Consistency, validation |

**Deprecated/outdated:**
- None - this is new implementation following established patterns

## Open Questions

1. **Should costs be editable after project is COMPLETED?**
   - Current: No restriction
   - Recommendation: Allow edits (corrections happen), but consider audit log for COMPLETED projects

2. **Should there be a maximum number of costs per project?**
   - Current: Unlimited
   - Recommendation: No limit needed for MVP, monitor if performance becomes an issue

3. **Receipt file upload - should it be implemented?**
   - Schema has `receiptPath` field ready
   - Recommendation: Defer to future phase - adds significant complexity (file storage, security)
   - Keep field in schema for future use

## Dependencies

Phase 14 depends on:
- **Phase 13 (Projects & Conversion):** Project model, API routes, detail sheet - ALL EXIST
- **Cost categories seed:** Must run `npx ts-node prisma/seed-cost-categories.ts` before development

## Pre-Implementation Checklist

Before starting implementation:
- [ ] Run cost categories seed: `npx ts-node prisma/seed-cost-categories.ts`
- [ ] Verify Cost and CostCategory tables exist in database
- [ ] Confirm 6 categories seeded: Labor, Materials, Vendors, Travel, Software, Other

## Sources

### Primary (HIGH confidence)
- Prisma schema: `prisma/schema.prisma` - Cost, CostCategory models verified
- Seed file: `prisma/seed-cost-categories.ts` - Category data verified
- Existing codebase: `src/app/api/companies/[id]/contacts/route.ts` - Nested API pattern
- Existing codebase: `src/components/companies/company-detail-modal.tsx` - Contacts UI pattern
- Existing codebase: `src/components/initiatives/initiative-form.tsx` - Date picker pattern
- Existing codebase: `src/components/projects/project-detail-sheet.tsx` - Sheet to extend
- Existing codebase: `src/lib/utils.ts` - formatCurrency, formatDate utilities

### Secondary (MEDIUM confidence)
- Phase 13 research patterns

### Tertiary (LOW confidence)
- None - all patterns verified against existing codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries already installed, schema exists
- Architecture: HIGH - directly adapting existing nested resource patterns
- Pitfalls: HIGH - based on Prisma Decimal handling and existing code patterns
- UI patterns: HIGH - exact templates exist in codebase (contacts pattern)

**Research date:** 2026-01-22
**Valid until:** Indefinite - patterns stable, based on existing codebase

## Implementation Priority

Based on requirements (COST-01 through COST-06, PROJ-09):

1. **Setup & API Foundation**
   - Run cost categories seed
   - Create cost-categories API route (GET)
   - Create costs nested API routes (CRUD)

2. **Cost Form Component** (COST-01, COST-02)
   - Form with description, amount, category, date
   - Date picker using Calendar component

3. **Cost Card Component** (COST-03, COST-04)
   - Display cost with edit/delete actions
   - Inline editing capability

4. **Project Detail Enhancement** (COST-05, COST-06, PROJ-09)
   - Add costs section to ProjectDetailSheet
   - Show total costs calculation
   - Show profit calculation (revenue - costs)
   - Show cost breakdown by category
