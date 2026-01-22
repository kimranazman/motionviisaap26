# Phase 10: Companies & Contacts - Research

**Researched:** 2026-01-22
**Domain:** CRM CRUD with inline editing, modal-based detail view, combobox inputs
**Confidence:** HIGH

## Summary

This phase implements Companies & Contacts CRUD functionality within an existing Next.js 14 App Router + Prisma + shadcn/ui stack. The schema already exists (Company and Contact models) but needs extension for additional fields (website, address, phone for Company; isPrimary for Contact).

The implementation follows established patterns in the codebase: table list with search/filter (like initiatives-list.tsx), Dialog modals for detail views, API routes with PATCH support for partial updates, and AlertDialog for delete confirmations.

Key technical additions required: Combobox component for industry field (select from presets OR type custom), inline editing pattern using input blur to auto-save, Skeleton component for loading states, and contact cards within the company modal.

**Primary recommendation:** Use existing codebase patterns, add Command component for combobox, implement inline edit using input + blur + PATCH API, display contacts as cards in company detail modal.

## Standard Stack

The project already uses these libraries (from package.json analysis):

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | ^14.2.28 | App Router, API routes | Project foundation |
| @prisma/client | ^6.19.2 | Database queries | ORM for MySQL |
| @radix-ui/react-dialog | ^1.1.15 | Modal dialogs | Company detail modal |
| @radix-ui/react-alert-dialog | ^1.1.15 | Confirmation dialogs | Delete confirmation |
| @radix-ui/react-popover | ^1.1.15 | Popover container | Combobox dropdown |
| @radix-ui/react-select | ^2.2.6 | Select dropdowns | Filter dropdowns |
| tailwindcss | ^3.4.1 | Styling | Project standard |
| lucide-react | ^0.562.0 | Icons | Consistent iconography |

### Required Additions
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| cmdk | ^1.0.0 | Command menu | Combobox for industry field |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| cmdk | ariakit/combobox | cmdk integrates better with existing Radix primitives |
| Inline edit library | Custom implementation | Custom matches existing patterns, no extra dependency |

**Installation:**
```bash
pnpm add cmdk
pnpm dlx shadcn@latest add command skeleton
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   ├── (dashboard)/
│   │   └── companies/
│   │       └── page.tsx              # Company list page (server component)
│   └── api/
│       └── companies/
│           ├── route.ts              # GET list, POST create
│           └── [id]/
│               ├── route.ts          # GET one, PATCH update, DELETE
│               └── contacts/
│                   └── route.ts      # GET contacts, POST create contact
├── components/
│   ├── companies/
│   │   ├── company-list.tsx          # Client: table + search/filter
│   │   ├── company-detail-modal.tsx  # Client: modal with inline editing
│   │   ├── company-inline-field.tsx  # Client: reusable inline edit field
│   │   ├── contact-card.tsx          # Client: contact display card
│   │   ├── contact-form.tsx          # Client: add/edit contact form
│   │   └── industry-combobox.tsx     # Client: industry selector
│   └── ui/
│       ├── command.tsx               # NEW: cmdk wrapper
│       ├── combobox.tsx              # NEW: industry combobox
│       └── skeleton.tsx              # NEW: loading skeleton
└── lib/
    └── industry-presets.ts           # Industry list constants
```

### Pattern 1: Inline Editing with Auto-Save
**What:** Click to edit pattern using input blur to trigger save
**When to use:** Company and contact field editing in modal
**Example:**
```typescript
// Source: https://www.emgoto.com/react-inline-edit/
interface InlineEditProps {
  value: string
  onSave: (value: string) => Promise<void>
  placeholder?: string
}

export function InlineEditField({ value, onSave, placeholder }: InlineEditProps) {
  const [editingValue, setEditingValue] = useState(value)
  const [isSaving, setIsSaving] = useState(false)

  const handleBlur = async () => {
    if (editingValue.trim() === value.trim()) return // No change
    setIsSaving(true)
    try {
      await onSave(editingValue.trim())
    } catch (error) {
      setEditingValue(value) // Rollback on error
    } finally {
      setIsSaving(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === 'Escape') {
      e.currentTarget.blur()
    }
  }

  return (
    <input
      value={editingValue}
      onChange={(e) => setEditingValue(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      disabled={isSaving}
      className={cn(
        "bg-transparent border-0 focus:border focus:border-input focus:ring-1 focus:ring-ring",
        "hover:bg-muted/50 rounded px-2 py-1 -mx-2 -my-1",
        "transition-colors"
      )}
    />
  )
}
```

### Pattern 2: Table with URL Search Params
**What:** Server component fetches data, client component handles filtering
**When to use:** Company list page
**Example:**
```typescript
// Source: https://nextjs.org/learn/dashboard-app/adding-search-and-pagination
// page.tsx (Server Component)
export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; industry?: string }>
}) {
  const { search, industry } = await searchParams
  const companies = await prisma.company.findMany({
    where: {
      AND: [
        search ? { name: { contains: search } } : {},
        industry ? { industry } : {},
      ],
    },
    include: { _count: { select: { contacts: true } } },
    orderBy: { name: 'asc' },
  })

  return <CompanyList initialData={companies} />
}
```

### Pattern 3: Modal with Nested Data
**What:** Dialog containing company details with contact cards
**When to use:** Company detail view
**Example:**
```typescript
// Source: Codebase pattern from dialog.tsx + initiative-detail-sheet.tsx
export function CompanyDetailModal({
  company,
  open,
  onOpenChange,
}: CompanyDetailModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            <InlineEditField
              value={company.name}
              onSave={(name) => updateCompany(company.id, { name })}
            />
          </DialogTitle>
        </DialogHeader>

        {/* Company fields section */}
        <div className="grid gap-4">
          {/* Inline editable fields */}
        </div>

        {/* Contacts section */}
        <Separator />
        <div className="space-y-3">
          <h3 className="font-medium">Contacts</h3>
          {company.contacts.length === 0 ? (
            <EmptyState
              message="No contacts yet"
              action={<Button>Add Contact</Button>}
            />
          ) : (
            <div className="grid gap-2">
              {company.contacts.map((contact) => (
                <ContactCard key={contact.id} contact={contact} />
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <DeleteCompanyButton companyId={company.id} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

### Pattern 4: Combobox for Industry (Select OR Custom)
**What:** Searchable dropdown with ability to use custom value
**When to use:** Industry field that allows presets or custom entry
**Example:**
```typescript
// Source: https://ui.shadcn.com/docs/components/combobox + cmdk
const INDUSTRY_PRESETS = [
  'Technology',
  'Healthcare',
  'Finance',
  'Manufacturing',
  'Retail',
  'Education',
  'Government',
  'Media',
  'Energy',
  'Other',
]

export function IndustryCombobox({
  value,
  onValueChange,
}: {
  value: string
  onValueChange: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [inputValue, setInputValue] = useState(value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox">
          {value || 'Select industry...'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command shouldFilter={false}>
          <CommandInput
            value={inputValue}
            onValueChange={setInputValue}
            placeholder="Search or type..."
          />
          <CommandList>
            <CommandEmpty>
              <Button
                variant="ghost"
                onClick={() => {
                  onValueChange(inputValue)
                  setOpen(false)
                }}
              >
                Use "{inputValue}"
              </Button>
            </CommandEmpty>
            <CommandGroup>
              {INDUSTRY_PRESETS.filter((i) =>
                i.toLowerCase().includes(inputValue.toLowerCase())
              ).map((industry) => (
                <CommandItem
                  key={industry}
                  onSelect={() => {
                    onValueChange(industry)
                    setOpen(false)
                  }}
                >
                  {industry}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
```

### Anti-Patterns to Avoid
- **Separate view/edit modes:** Don't toggle between read-only and editable states. Use always-editable input with transparent background that shows editing on focus/hover.
- **Full page refresh on save:** Use PATCH API + optimistic updates, not full page navigation.
- **Contacts as separate page:** Keep contacts within company modal context as specified in requirements.
- **Nested modals for contacts:** Use inline form or expandable card, not modal-in-modal.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Searchable select with custom input | Custom autocomplete | cmdk + Popover | Keyboard navigation, accessibility, filtering built-in |
| Delete confirmation | window.confirm | AlertDialog | Consistent UI, accessible, matches design system |
| Loading placeholders | Custom spinners | Skeleton component | Consistent animation, matches content layout |
| Debounced search | Manual setTimeout | useDebounce hook | Already exists in codebase at lib/hooks/use-debounce.ts |
| Form validation | Manual checks | Zod schema validation | Type-safe, reusable, clear error messages |

**Key insight:** The codebase already has patterns for tables (initiatives-list.tsx), modals (dialog.tsx), confirmations (delete-user-button.tsx), and API routes (initiatives/[id]/route.ts). Follow these patterns rather than inventing new ones.

## Common Pitfalls

### Pitfall 1: Inline Edit Losing Focus
**What goes wrong:** User edits, clicks elsewhere, but save fails silently
**Why it happens:** onBlur fires but async save isn't awaited properly
**How to avoid:** Show loading state on input, disable during save, rollback on error
**Warning signs:** User complains edits "don't stick"

### Pitfall 2: Modal Scroll with Long Content
**What goes wrong:** Modal content overflows, can't scroll to see all contacts
**Why it happens:** Missing overflow-y-auto or fixed max-height
**How to avoid:** Use `max-h-[85vh] overflow-y-auto` on DialogContent
**Warning signs:** Content cut off at bottom of modal

### Pitfall 3: Primary Contact Unique Constraint
**What goes wrong:** Multiple contacts marked as primary
**Why it happens:** No check before setting isPrimary=true
**How to avoid:** In API, unset isPrimary on all other contacts before setting new primary
**Warning signs:** Multiple contacts showing primary badge

### Pitfall 4: Delete Company with Linked Records
**What goes wrong:** Foreign key constraint error on delete
**Why it happens:** Company has deals/projects referencing it
**How to avoid:** Check for linked records before delete, show warning, or use cascade (schema already has onDelete: Cascade for contacts)
**Warning signs:** Delete fails with database error

### Pitfall 5: Combobox Custom Value Not Persisting
**What goes wrong:** User types custom industry but it reverts to empty
**Why it happens:** Controlled input resets to empty when no preset matches
**How to avoid:** Allow inputValue as valid selection, persist to value state
**Warning signs:** Custom industry disappears after blur

## Code Examples

### API Route for Companies CRUD
```typescript
// Source: Codebase pattern from app/api/initiatives/[id]/route.ts
// app/api/companies/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth, requireEditor } from '@/lib/auth-utils'

// GET /api/companies/[id] - Get company with contacts
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth()
  if (error) return error

  const { id } = await params
  const company = await prisma.company.findUnique({
    where: { id },
    include: {
      contacts: {
        orderBy: [
          { isPrimary: 'desc' },
          { name: 'asc' },
        ],
      },
      _count: {
        select: { deals: true, projects: true },
      },
    },
  })

  if (!company) {
    return NextResponse.json({ error: 'Company not found' }, { status: 404 })
  }

  return NextResponse.json(company)
}

// PATCH /api/companies/[id] - Partial update
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireEditor()
  if (error) return error

  const { id } = await params
  const body = await request.json()

  const company = await prisma.company.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.industry !== undefined && { industry: body.industry }),
      ...(body.website !== undefined && { website: body.website }),
      ...(body.address !== undefined && { address: body.address }),
      ...(body.phone !== undefined && { phone: body.phone }),
      ...(body.notes !== undefined && { notes: body.notes }),
    },
  })

  return NextResponse.json(company)
}

// DELETE /api/companies/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireEditor()
  if (error) return error

  const { id } = await params

  // Check for linked records
  const linkedCount = await prisma.company.findUnique({
    where: { id },
    select: {
      _count: { select: { deals: true, projects: true, potentials: true } },
    },
  })

  if (linkedCount) {
    const total = linkedCount._count.deals + linkedCount._count.projects + linkedCount._count.potentials
    if (total > 0) {
      return NextResponse.json(
        { error: `Cannot delete: ${total} linked records exist` },
        { status: 400 }
      )
    }
  }

  await prisma.company.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
```

### Setting Primary Contact
```typescript
// Source: Prisma transaction pattern
// app/api/companies/[id]/contacts/[contactId]/route.ts

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; contactId: string }> }
) {
  const { error } = await requireEditor()
  if (error) return error

  const { id: companyId, contactId } = await params
  const body = await request.json()

  // If setting as primary, unset others first
  if (body.isPrimary === true) {
    await prisma.$transaction([
      prisma.contact.updateMany({
        where: { companyId, isPrimary: true },
        data: { isPrimary: false },
      }),
      prisma.contact.update({
        where: { id: contactId },
        data: { isPrimary: true },
      }),
    ])
  } else {
    await prisma.contact.update({
      where: { id: contactId },
      data: body,
    })
  }

  return NextResponse.json({ success: true })
}
```

### Skeleton Loading for Company Modal
```typescript
// Source: https://ui.shadcn.com/docs/components/skeleton
export function CompanyDetailSkeleton() {
  return (
    <div className="space-y-4">
      {/* Company name */}
      <Skeleton className="h-8 w-64" />

      {/* Company fields */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-9 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-9 w-full" />
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-24 w-full" />
      </div>

      <Separator />

      {/* Contacts section */}
      <Skeleton className="h-5 w-20" />
      <div className="space-y-2">
        <Skeleton className="h-20 w-full rounded-lg" />
        <Skeleton className="h-20 w-full rounded-lg" />
      </div>
    </div>
  )
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Form with Save button | Inline edit with auto-save | 2023+ | Better UX, feels immediate |
| Client-side filtering only | URL search params + server fetch | Next.js 13+ | Shareable URLs, SEO, SSR benefits |
| Toggle view/edit mode | Always editable inputs | 2024+ | Simpler code, better accessibility |
| Separate contact page | Contacts in company modal | Decision | Keeps context, fewer page navigations |

**Deprecated/outdated:**
- **pages/ directory API routes**: Use app/ directory route handlers
- **getServerSideProps**: Use async server components with searchParams
- **Manual debouncing in components**: Use useDebounce hook

## Schema Updates Required

The existing schema needs these additions:

```prisma
model Company {
  id          String              @id @default(cuid())
  name        String              @db.VarChar(255)
  industry    String?             @db.VarChar(100)
  website     String?             @db.VarChar(255)  // NEW
  address     String?             @db.Text          // NEW - single field, not structured
  phone       String?             @db.VarChar(50)   // NEW
  notes       String?             @db.Text

  contacts    Contact[]
  deals       Deal[]
  potentials  PotentialProject[]
  projects    Project[]

  createdAt   DateTime            @default(now())
  updatedAt   DateTime            @updatedAt

  @@index([name])
  @@map("companies")
}

model Contact {
  id          String              @id @default(cuid())
  companyId   String              @map("company_id")
  company     Company             @relation(fields: [companyId], references: [id], onDelete: Cascade)

  name        String              @db.VarChar(255)
  email       String?             @db.VarChar(255)
  phone       String?             @db.VarChar(50)
  role        String?             @db.VarChar(100)
  isPrimary   Boolean             @default(false) @map("is_primary")  // NEW

  deals       Deal[]
  potentials  PotentialProject[]
  projects    Project[]

  createdAt   DateTime            @default(now())
  updatedAt   DateTime            @updatedAt

  @@index([companyId])
  @@map("contacts")
}
```

## Open Questions

Things that couldn't be fully resolved:

1. **Contact Card Inline Edit vs. Expand Pattern**
   - What we know: Cards show name, role, email, phone
   - What's unclear: Should editing be directly on card, or expand card to show form?
   - Recommendation: Start with inline edit on card fields, same as company. Add expand if too cramped.

2. **Industry Presets List**
   - What we know: Combo box with presets + custom option
   - What's unclear: Exact list of industries to pre-populate
   - Recommendation: Use common B2B industries (Technology, Healthcare, Finance, Manufacturing, Retail, Education, Government, Media, Energy, Other)

3. **Table Pagination**
   - What we know: Requirements mention search/filter, not pagination
   - What's unclear: Whether pagination is needed
   - Recommendation: Defer pagination unless company list exceeds 50+ entries. Add server-side pagination if needed.

## Sources

### Primary (HIGH confidence)
- Codebase analysis: schema.prisma (Company/Contact models)
- Codebase analysis: initiatives-list.tsx (table + search pattern)
- Codebase analysis: dialog.tsx, alert-dialog.tsx (modal patterns)
- Codebase analysis: initiatives/[id]/route.ts (PATCH API pattern)
- [shadcn/ui Combobox](https://ui.shadcn.com/docs/components/combobox) - cmdk integration
- [shadcn/ui Skeleton](https://ui.shadcn.com/docs/components/skeleton) - loading states
- [Next.js Search and Pagination](https://nextjs.org/learn/dashboard-app/adding-search-and-pagination) - URL params pattern
- [Prisma Relation Queries](https://www.prisma.io/docs/orm/prisma-client/queries/relation-queries) - nested includes

### Secondary (MEDIUM confidence)
- [React Inline Edit Pattern](https://www.emgoto.com/react-inline-edit/) - input blur save pattern
- [React useOptimistic Hook](https://react.dev/reference/react/useOptimistic) - optimistic UI

### Tertiary (LOW confidence)
- WebSearch results for inline editing libraries - verified against official docs

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All from existing codebase + official docs
- Architecture: HIGH - Follows established codebase patterns
- Pitfalls: HIGH - Based on common React/Next.js issues
- Schema updates: HIGH - Matches CONTEXT.md requirements

**Research date:** 2026-01-22
**Valid until:** 2026-02-22 (30 days - stable technology stack)
