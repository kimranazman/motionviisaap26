# Phase 31: Department Organization - Research

**Researched:** 2026-01-24
**Domain:** Department CRUD within companies, contact/deal/potential assignment
**Confidence:** HIGH

## Summary

Phase 31 implements Department Organization, allowing users to subdivide companies into departments and assign contacts, deals, and potential projects to those departments. The database schema is already complete with the `Department` model and all necessary foreign key relationships (`departmentId` on Contact, Deal, and PotentialProject models).

The implementation follows established codebase patterns:
1. **Schema fully defined:** `Department` model exists with `companyId`, `name`, `description` and relations to Contact, Deal, PotentialProject
2. **Cascading delete configured:** Department uses `onDelete: Cascade` on company relation
3. **Contact relation ready:** Contact has optional `departmentId` field with index
4. **Deal/Potential relations ready:** Both have `departmentId` with indexes
5. **No existing department UI/API:** The departmentId fields exist in schema but are NOT yet used in any API routes or UI components

The key implementation challenges are:
- DEPT-08 (Company -> Department -> Contact cascading selection) requires a new DepartmentSelect component that filters by company
- Contact form needs department selection (optional, only shown after company context known)
- Deal/Potential forms need department selection (optional, shown after company selected)
- Company detail modal should show departments inline (not separate page)

**Primary recommendation:** Add department management inline within CompanyDetailModal (similar to how Contacts are managed). Create a DepartmentSelect component for forms. Extend existing deal/potential/contact APIs and forms to include department selection.

## Current State Analysis

### Department Model (Already Exists in Schema)
```prisma
model Department {
  id          String   @id @default(cuid())
  name        String   @db.VarChar(255)
  description String?  @db.Text

  companyId   String   @map("company_id")
  company     Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)

  contacts    Contact[]
  deals       Deal[]
  potentials  PotentialProject[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([companyId, name])
  @@index([companyId])
  @@map("departments")
}
```

### Related Model Fields (Already Exist)

**Contact:**
```prisma
departmentId String?     @map("department_id")
department   Department? @relation(fields: [departmentId], references: [id])
@@index([departmentId])
```

**Deal:**
```prisma
departmentId String?     @map("department_id")
department   Department? @relation(fields: [departmentId], references: [id])
@@index([departmentId])
```

**PotentialProject:**
```prisma
departmentId String?     @map("department_id")
department   Department? @relation(fields: [departmentId], references: [id])
@@index([departmentId])
```

### Current Company Relations
```prisma
model Company {
  // ... other fields
  contacts    Contact[]
  deals       Deal[]
  potentials  PotentialProject[]
  projects    Project[]
  departments Department[]  // <-- exists
}
```

### Existing UI Patterns to Follow

**CompanyDetailModal (`src/components/companies/company-detail-modal.tsx`):**
- Shows company fields (inline editable)
- Shows contacts inline with add form toggle
- Shows related deals/potentials/projects in "Related Items" section
- Good template for adding departments section

**ContactSelect (pipeline) and CompanySelect:**
- CompanySelect: Fetches all companies, searchable combobox
- ContactSelect: Receives contacts as prop (filtered by selected company), searchable combobox
- DepartmentSelect should follow ContactSelect pattern (receive departments as prop, filtered by company)

**DealFormModal (`src/components/pipeline/deal-form-modal.tsx`):**
- Company -> Contact cascading pattern already exists
- Fetches contacts when company changes: `fetch(/api/companies/${companyId})` then extracts contacts
- Department selection should be added after company selection, before contact

**ContactForm (`src/components/companies/contact-form.tsx`):**
- Simple inline form for adding contact to company
- Needs optional department selection (departments come from parent company context)

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Prisma | `^6.19.2` | Department CRUD with company/contact relations | Schema exists, relations ready |
| shadcn/ui | various | Dialog, Table, Select, Input, Command | Consistent with app patterns |
| lucide-react | `^0.562.0` | Icons (Building, Users, GitBranch) | Existing pattern |

### Supporting (Already Installed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@radix-ui/react-dialog` | via shadcn | Used in company detail modal | Extend existing modal |
| `@radix-ui/react-select` | via shadcn | Department dropdown | Simple single select |
| cmdk | via shadcn | Department searchable select | For forms with many departments |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Inline departments in company detail | Separate /departments page | Inline keeps context, matches contacts pattern |
| Select component for department | Command/Combobox | Select simpler for small lists (<20), Combobox for larger |
| Fetch departments with company | Separate API call | Include in company fetch is simpler, less requests |

**Installation:**
```bash
# No new packages needed - all dependencies already installed
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   └── api/
│       └── companies/
│           └── [id]/
│               └── departments/
│                   ├── route.ts              # GET list, POST create
│                   └── [deptId]/
│                       └── route.ts          # GET, PATCH, DELETE
├── components/
│   ├── companies/
│   │   ├── department-section.tsx            # Departments in company modal
│   │   ├── department-card.tsx               # Single department card (expandable)
│   │   └── department-form.tsx               # Add/edit department form
│   └── pipeline/
│       └── department-select.tsx             # Reusable department combobox
```

### Pattern 1: Departments Nested Under Company API
**What:** API routes scoped to company, matching contacts pattern
**Why:** Departments only make sense in company context
**Source:** `src/app/api/companies/[id]/contacts/route.ts`
**Example:**
```typescript
// src/app/api/companies/[id]/departments/route.ts
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth, requireEditor } from '@/lib/auth-utils'

// GET /api/companies/[id]/departments
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth()
  if (error) return error

  try {
    const { id } = await params

    const departments = await prisma.department.findMany({
      where: { companyId: id },
      include: {
        _count: {
          select: { contacts: true, deals: true, potentials: true },
        },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(departments)
  } catch (error) {
    console.error('Error fetching departments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch departments' },
      { status: 500 }
    )
  }
}

// POST /api/companies/[id]/departments
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireEditor()
  if (error) return error

  try {
    const { id } = await params
    const body = await request.json()

    if (!body.name || !body.name.trim()) {
      return NextResponse.json(
        { error: 'Department name is required' },
        { status: 400 }
      )
    }

    // Check for duplicate name in same company
    const existing = await prisma.department.findUnique({
      where: {
        companyId_name: {
          companyId: id,
          name: body.name.trim(),
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Department with this name already exists' },
        { status: 400 }
      )
    }

    const department = await prisma.department.create({
      data: {
        companyId: id,
        name: body.name.trim(),
        description: body.description?.trim() || null,
      },
      include: {
        _count: {
          select: { contacts: true, deals: true, potentials: true },
        },
      },
    })

    return NextResponse.json(department, { status: 201 })
  } catch (error) {
    console.error('Error creating department:', error)
    return NextResponse.json(
      { error: 'Failed to create department' },
      { status: 500 }
    )
  }
}
```

### Pattern 2: Include Departments in Company Detail Fetch
**What:** Extend company GET to include departments
**Where:** `src/app/api/companies/[id]/route.ts`
**Example modification:**
```typescript
const company = await prisma.company.findUnique({
  where: { id },
  include: {
    contacts: {
      orderBy: [{ isPrimary: 'desc' }, { name: 'asc' }],
      include: {
        department: { select: { id: true, name: true } },  // NEW
      },
    },
    departments: {  // NEW
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { contacts: true, deals: true, potentials: true },
        },
      },
    },
    deals: { /* existing */ },
    potentials: { /* existing */ },
    projects: { /* existing */ },
    _count: { /* existing */ },
  },
})
```

### Pattern 3: DepartmentSelect Component (Cascading Selection)
**What:** Combobox that receives departments as prop (filtered by company)
**Source:** Follow `ContactSelect` pattern exactly
**Example:**
```typescript
// src/components/pipeline/department-select.tsx
'use client'

import { useState } from 'react'
import { Check, ChevronsUpDown, Building } from 'lucide-react'
import { cn } from '@/lib/utils'
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

interface Department {
  id: string
  name: string
}

interface DepartmentSelectProps {
  value: string | null
  onValueChange: (departmentId: string | null) => void
  departments: Department[]
  disabled?: boolean
}

export function DepartmentSelect({
  value,
  onValueChange,
  departments,
  disabled = false,
}: DepartmentSelectProps) {
  const [open, setOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')

  const selectedDepartment = departments.find((d) => d.id === value)
  const isEmpty = departments.length === 0

  const filteredDepartments = departments.filter((dept) =>
    dept.name.toLowerCase().includes(inputValue.toLowerCase())
  )

  const handleSelect = (departmentId: string) => {
    onValueChange(departmentId === value ? null : departmentId)
    setOpen(false)
    setInputValue('')
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled || isEmpty}
          className={cn(
            'w-full justify-between font-normal',
            !value && 'text-muted-foreground'
          )}
        >
          {isEmpty
            ? '(No departments)'
            : selectedDepartment?.name || 'Select department...'}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            value={inputValue}
            onValueChange={setInputValue}
            placeholder="Search department..."
          />
          <CommandList>
            {filteredDepartments.length === 0 ? (
              <CommandEmpty>No departments found.</CommandEmpty>
            ) : null}
            <CommandGroup>
              {filteredDepartments.map((dept) => (
                <CommandItem
                  key={dept.id}
                  value={dept.id}
                  onSelect={() => handleSelect(dept.id)}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === dept.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <Building className="mr-2 h-4 w-4 text-gray-400" />
                  {dept.name}
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

### Pattern 4: Cascading Selection Flow in Forms
**What:** Company -> Department -> Contact selection chain
**Where:** DealFormModal, PotentialFormModal, any form with contact selection
**Example flow in deal form:**
```typescript
// State
const [companyId, setCompanyId] = useState<string | null>(null)
const [departmentId, setDepartmentId] = useState<string | null>(null)
const [contactId, setContactId] = useState<string | null>(null)
const [departments, setDepartments] = useState<Department[]>([])
const [contacts, setContacts] = useState<Contact[]>([])

// Fetch company data when company changes
useEffect(() => {
  if (!companyId) {
    setDepartments([])
    setDepartmentId(null)
    setContacts([])
    setContactId(null)
    return
  }

  const fetchCompanyData = async () => {
    const response = await fetch(`/api/companies/${companyId}`)
    if (response.ok) {
      const data = await response.json()
      setDepartments(data.departments || [])
      setContacts(data.contacts || [])
    }
  }
  fetchCompanyData()
}, [companyId])

// Filter contacts when department changes
const filteredContacts = useMemo(() => {
  if (!departmentId) return contacts  // Show all if no department selected
  return contacts.filter((c) => c.departmentId === departmentId || c.departmentId === null)
}, [contacts, departmentId])

// Clear contact if department changes and contact not in department
useEffect(() => {
  if (departmentId && contactId) {
    const contact = contacts.find((c) => c.id === contactId)
    if (contact && contact.departmentId && contact.departmentId !== departmentId) {
      setContactId(null)
    }
  }
}, [departmentId, contactId, contacts])
```

### Pattern 5: Department Section in Company Detail Modal
**What:** Inline department management similar to contacts section
**Where:** Extend `CompanyDetailModal`
**Example structure:**
```typescript
{/* Departments Section */}
<div className="space-y-3">
  <div className="flex items-center justify-between">
    <h3 className="font-medium text-gray-900">
      Departments
      {company.departments.length > 0 && (
        <span className="ml-2 text-sm font-normal text-gray-500">
          ({company.departments.length})
        </span>
      )}
    </h3>
    {company.departments.length > 0 && !showAddDeptForm && (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowAddDeptForm(true)}
      >
        <Plus className="mr-1 h-4 w-4" />
        Add Department
      </Button>
    )}
  </div>

  {/* Add Department Form */}
  {showAddDeptForm && (
    <DepartmentForm
      companyId={company.id}
      onSuccess={handleDepartmentAdded}
      onCancel={() => setShowAddDeptForm(false)}
    />
  )}

  {/* Department Cards or Empty State */}
  {company.departments.length === 0 && !showAddDeptForm ? (
    <Card className="p-6 text-center">
      <Building className="mx-auto h-8 w-8 text-gray-400 mb-2" />
      <p className="text-sm text-gray-500 mb-3">
        No departments yet
      </p>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowAddDeptForm(true)}
      >
        <Plus className="mr-1 h-4 w-4" />
        Add your first department
      </Button>
    </Card>
  ) : (
    <div className="space-y-2">
      {company.departments.map((dept) => (
        <DepartmentCard
          key={dept.id}
          department={dept}
          companyId={company.id}
          onUpdate={handleDepartmentUpdated}
          onDelete={handleDepartmentDeleted}
        />
      ))}
    </div>
  )}
</div>
```

### Anti-Patterns to Avoid
- **Separate /departments page:** Keep departments within company context, not standalone navigation
- **Fetching departments separately from company:** Include in company fetch for efficiency
- **Forcing department selection:** Department should always be optional (many contacts/deals span departments)
- **Showing department select before company selected:** Only show after company context established
- **Cascading contact delete on department delete:** Set contactId to null, don't delete contacts

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Department searchable select | Custom autocomplete | Command component | Already used, keyboard navigation |
| Delete confirmation | window.confirm | AlertDialog | Consistent UI, accessible |
| Inline field editing | Custom toggle states | CompanyInlineField pattern | Already exists, proven |
| Cascading selection state | Complex useReducer | useState with useEffect chain | Simpler, pattern exists in deal form |
| Unique constraint error handling | Generic error | Prisma P2002 check | Specific "name exists" message |

**Key insight:** Department management is a subset of company management. Follow the exact Contacts pattern within CompanyDetailModal. The cascading Company -> Department -> Contact selection extends the existing Company -> Contact pattern.

## Common Pitfalls

### Pitfall 1: Orphaned Contacts on Department Delete
**What goes wrong:** Deleting department leaves contacts with invalid departmentId
**Why it happens:** No ON DELETE SET NULL in Prisma
**How to avoid:** Manually set contacts' departmentId to null before deleting department:
```typescript
await prisma.$transaction([
  prisma.contact.updateMany({
    where: { departmentId },
    data: { departmentId: null },
  }),
  prisma.deal.updateMany({
    where: { departmentId },
    data: { departmentId: null },
  }),
  prisma.potentialProject.updateMany({
    where: { departmentId },
    data: { departmentId: null },
  }),
  prisma.department.delete({ where: { id: departmentId } }),
])
```
**Warning signs:** Contacts showing "undefined" department after department deleted

### Pitfall 2: Duplicate Department Names
**What goes wrong:** Creates duplicate departments with same name in company
**Why it happens:** No validation before create
**How to avoid:** Schema has `@@unique([companyId, name])` - handle Prisma P2002 error
```typescript
try {
  const department = await prisma.department.create({ ... })
} catch (error) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Department with this name already exists' },
        { status: 400 }
      )
    }
  }
  throw error
}
```
**Warning signs:** 500 error when creating department with existing name

### Pitfall 3: Contact Department Mismatch
**What goes wrong:** Contact's departmentId doesn't match contact's companyId
**Why it happens:** No validation that department belongs to same company as contact
**How to avoid:** Validate before update:
```typescript
if (body.departmentId) {
  const department = await prisma.department.findFirst({
    where: {
      id: body.departmentId,
      companyId: contact.companyId,  // Must match
    },
  })
  if (!department) {
    return NextResponse.json(
      { error: 'Department must belong to same company' },
      { status: 400 }
    )
  }
}
```
**Warning signs:** Contacts appearing under wrong company's departments

### Pitfall 4: Stale Department List After Company Change
**What goes wrong:** Old departments still showing after switching companies in form
**Why it happens:** State not reset when companyId changes
**How to avoid:** Clear department and contact selections when company changes:
```typescript
useEffect(() => {
  if (!companyId) {
    setDepartments([])
    setDepartmentId(null)  // Clear selection
    setContacts([])
    setContactId(null)     // Clear selection
    return
  }
  // ... fetch new company data
}, [companyId])
```
**Warning signs:** Departments from previous company visible in dropdown

### Pitfall 5: Including Non-Department Contacts in Department View
**What goes wrong:** All company contacts shown regardless of department filter
**Why it happens:** Not filtering contacts by departmentId
**How to avoid:** Filter properly with null handling:
```typescript
// Show contacts that either:
// 1. Belong to selected department
// 2. Have no department (can be assigned to any)
const filteredContacts = contacts.filter((c) =>
  c.departmentId === departmentId || c.departmentId === null
)
```
**Warning signs:** Contacts from other departments appearing in filtered list

### Pitfall 6: Department Select Enabled Before Company Selected
**What goes wrong:** Department dropdown active with no departments
**Why it happens:** Not checking for company context
**How to avoid:** Disable department select until company selected:
```jsx
<DepartmentSelect
  value={departmentId}
  onValueChange={setDepartmentId}
  departments={departments}
  disabled={!companyId || isLoadingCompanyData}  // Disabled until company ready
/>
{!companyId && (
  <p className="text-xs text-muted-foreground">
    Select a company first
  </p>
)}
```
**Warning signs:** Users clicking disabled-looking but active department dropdown

## Code Examples

### Department Form (Create)
```typescript
// src/components/companies/department-form.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

interface DepartmentFormProps {
  companyId: string
  onSuccess: () => void
  onCancel: () => void
}

export function DepartmentForm({ companyId, onSuccess, onCancel }: DepartmentFormProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      setError('Name is required')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`/api/companies/${companyId}/departments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
        }),
      })

      if (response.ok) {
        setName('')
        setDescription('')
        onSuccess()
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to create department')
      }
    } catch {
      setError('Failed to create department')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="p-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <h4 className="font-medium text-sm text-gray-900">Add New Department</h4>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="dept-name" className="text-xs">
              Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="dept-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Marketing, Engineering"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="dept-description" className="text-xs">
              Description
            </Label>
            <Textarea
              id="dept-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description..."
              disabled={isSubmitting}
              className="min-h-[60px]"
            />
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={isSubmitting} className="w-full sm:w-auto">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              'Add Department'
            )}
          </Button>
        </div>
      </form>
    </Card>
  )
}
```

### Department Card (Display/Edit/Delete)
```typescript
// src/components/companies/department-card.tsx
'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
import { Building, Trash2, Users, Briefcase, FileStack } from 'lucide-react'
import { CompanyInlineField } from './company-inline-field'

interface Department {
  id: string
  name: string
  description: string | null
  _count: {
    contacts: number
    deals: number
    potentials: number
  }
}

interface DepartmentCardProps {
  department: Department
  companyId: string
  onUpdate: () => void
  onDelete: () => void
}

export function DepartmentCard({
  department,
  companyId,
  onUpdate,
  onDelete,
}: DepartmentCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const handleFieldSave = async (field: string, value: string) => {
    const response = await fetch(
      `/api/companies/${companyId}/departments/${department.id}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      }
    )

    if (!response.ok) {
      throw new Error('Failed to update')
    }

    onUpdate()
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    setDeleteError(null)

    try {
      const response = await fetch(
        `/api/companies/${companyId}/departments/${department.id}`,
        { method: 'DELETE' }
      )

      if (response.ok) {
        onDelete()
      } else {
        const data = await response.json()
        setDeleteError(data.error || 'Failed to delete department')
      }
    } catch {
      setDeleteError('Failed to delete department')
    } finally {
      setIsDeleting(false)
    }
  }

  const totalLinked =
    department._count.contacts +
    department._count.deals +
    department._count.potentials

  return (
    <Card className="p-3">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-50">
          <Building className="h-5 w-5 text-purple-600" />
        </div>

        <div className="flex-1 min-w-0">
          <CompanyInlineField
            value={department.name}
            onSave={(value) => handleFieldSave('name', value)}
            placeholder="Department name"
            className="font-medium"
          />

          {department.description && (
            <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">
              {department.description}
            </p>
          )}

          {/* Stats */}
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {department._count.contacts} contacts
            </span>
            <span className="flex items-center gap-1">
              <Briefcase className="h-3 w-3" />
              {department._count.deals} deals
            </span>
            <span className="flex items-center gap-1">
              <FileStack className="h-3 w-3" />
              {department._count.potentials} potentials
            </span>
          </div>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 text-gray-400 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Department</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete &quot;{department.name}&quot;?
                {totalLinked > 0 && (
                  <span className="block mt-2 text-amber-600">
                    {totalLinked} linked item{totalLinked !== 1 ? 's' : ''} will be
                    unassigned from this department.
                  </span>
                )}
                {deleteError && (
                  <span className="block mt-2 text-red-600">{deleteError}</span>
                )}
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
    </Card>
  )
}
```

### Extended Deal Form with Department Selection
```typescript
// In deal-form-modal.tsx, add department selection after company:

// State additions
const [departmentId, setDepartmentId] = useState<string | null>(null)
const [departments, setDepartments] = useState<Department[]>([])

// Effect: clear department when company changes
useEffect(() => {
  setDepartmentId(null)
  setDepartments([])
  if (companyId) {
    // Fetch includes departments now
    fetchCompanyData()
  }
}, [companyId])

// In the form body, after Company select:
<div className="space-y-2">
  <Label>Department</Label>
  <DepartmentSelect
    value={departmentId}
    onValueChange={setDepartmentId}
    departments={departments}
    disabled={!companyId || isLoadingContacts}
  />
  {!companyId && (
    <p className="text-xs text-muted-foreground">
      Select a company first
    </p>
  )}
</div>

// In the submit body:
body: JSON.stringify({
  title: title.trim(),
  companyId,
  departmentId: departmentId || null,  // NEW
  contactId: contactId || null,
  value: value ? parseFloat(value) : null,
  description: description.trim() || null,
}),
```

### Contact API Extension
```typescript
// Update src/app/api/companies/[id]/contacts/route.ts POST handler

const contact = await prisma.contact.create({
  data: {
    companyId: id,
    name: body.name.trim(),
    email: body.email?.trim() || null,
    phone: body.phone?.trim() || null,
    role: body.role?.trim() || null,
    departmentId: body.departmentId || null,  // NEW
    isPrimary: existingContacts === 0,
  },
})
```

### Deal API Extension
```typescript
// Update src/app/api/deals/route.ts POST handler

const deal = await prisma.deal.create({
  data: {
    title: body.title.trim(),
    description: body.description || null,
    value: body.value ? parseFloat(body.value) : null,
    companyId: body.companyId,
    departmentId: body.departmentId || null,  // NEW
    contactId: body.contactId || null,
    stage: DealStage.LEAD,
    position: nextPosition,
  },
  include: {
    company: { select: { id: true, name: true } },
    department: { select: { id: true, name: true } },  // NEW
    contact: { select: { id: true, name: true } },
    project: { /* existing */ },
  },
})
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Contacts directly under company | Contacts optionally grouped by department | Phase 31 | Better organization for large clients |
| Deals/potentials company-scoped only | Deals/potentials can be department-scoped | Phase 31 | More precise targeting |
| Single company -> contact selection | Company -> department -> contact cascade | Phase 31 | Clearer hierarchy in forms |

**Deprecated/outdated:**
- None - this is new implementation following established patterns

## Open Questions

1. **Should contacts WITHOUT department be hidden when department is selected?**
   - Current recommendation: Show contacts with no department alongside department contacts (they can work across departments)
   - Alternative: Only show contacts explicitly in selected department
   - Decision: Allow both - contacts with null departmentId are "company-wide"

2. **Should department be shown in contact cards/lists?**
   - Current recommendation: Yes, show department badge on contact cards when assigned
   - Adds context without cluttering UI

3. **Should deals filter to show only contacts from selected department?**
   - Current recommendation: Filter but also show contacts with null departmentId
   - Allows flexibility for cross-department deals

4. **Department as required vs optional field?**
   - Recommendation: Always optional - not all companies need department organization
   - Many small companies have no department structure

## Dependencies

Phase 31 depends on:
- **Phase 29 (Schema Foundation):** Department model exists - COMPLETE
- **Phase 10 (Companies & Contacts):** Company CRUD, Contact CRUD - COMPLETE
- **Phase 11 (Pipeline):** Deal CRUD - COMPLETE
- **Phase 12 (Potential Projects):** PotentialProject CRUD - COMPLETE

## Implementation Priority

Based on requirements (DEPT-01 through DEPT-08):

**Wave 1: Department CRUD (DEPT-01 to DEPT-04)**
1. Create department API routes (`/api/companies/[id]/departments/...`)
2. Extend company API to include departments
3. Add department section to CompanyDetailModal (form + cards)
4. Test: Create, view, edit, delete departments within company

**Wave 2: Contact-Department Assignment (DEPT-05)**
1. Create DepartmentSelect component
2. Add department field to ContactForm
3. Update contact API to handle departmentId
4. Show department on contact cards
5. Test: Assign contacts to departments

**Wave 3: Deal/Potential-Department Assignment (DEPT-06, DEPT-07)**
1. Add DepartmentSelect to DealFormModal
2. Add DepartmentSelect to PotentialFormModal (if exists)
3. Update deal/potential APIs to handle departmentId
4. Show department in deal/potential details
5. Test: Assign deals/potentials to departments

**Wave 4: Cascading Selection Flow (DEPT-08)**
1. Implement Company -> Department -> Contact cascade in DealFormModal
2. Filter contacts by department when department selected
3. Test full flow: Select company, select department, select contact (filtered)

## Sources

### Primary (HIGH confidence)
- Prisma schema: `prisma/schema.prisma` - Department model verified, all relations exist
- Existing codebase: `src/components/companies/company-detail-modal.tsx` - Modal pattern with inline sections
- Existing codebase: `src/components/companies/contact-form.tsx` - Inline form pattern
- Existing codebase: `src/components/companies/contact-card.tsx` - Card with edit/delete
- Existing codebase: `src/components/pipeline/company-select.tsx` - Combobox pattern
- Existing codebase: `src/components/pipeline/contact-select.tsx` - Filtered combobox pattern
- Existing codebase: `src/components/pipeline/deal-form-modal.tsx` - Company -> Contact cascade
- Existing codebase: `src/app/api/companies/[id]/contacts/route.ts` - Nested API pattern

### Secondary (MEDIUM confidence)
- Phase 30 research: `30-RESEARCH.md` - Similar CRUD pattern for Suppliers

### Tertiary (LOW confidence)
- None - all patterns verified against existing codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries already installed, schema complete
- Architecture: HIGH - directly adapting existing company/contact/pipeline patterns
- Pitfalls: HIGH - based on existing patterns and cascading selection complexity
- UI patterns: HIGH - exact templates exist in codebase (contact form, company modal, deal form)

**Research date:** 2026-01-24
**Valid until:** Indefinite - patterns stable, based on existing codebase
