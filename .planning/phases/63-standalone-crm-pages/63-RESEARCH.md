# Research: Phase 63 - Standalone CRM Pages

## Existing Patterns

### Page Pattern (Server Component)
Pages follow `src/app/(dashboard)/{entity}/page.tsx` pattern:
- Server component that queries Prisma directly
- Passes `initialData` to client list component
- Structure: `<div className="space-y-6 p-6">` with h1 title + subtitle + list component
- Example: `/companies/page.tsx`, `/suppliers/page.tsx`

### List Component Pattern (Client Component)
Client components at `src/components/{entity}/{entity}-list.tsx`:
- `useState` for data, search, filters, create dialog state
- `filteredItems` computed from state
- `refreshItems()` function that re-fetches from API
- Toolbar: search input + filter selects + "Add" button (Dialog trigger)
- Table with header row + data rows + empty state
- Detail modal at bottom of component
- Row click opens detail modal
- Pattern: CompanyList, SupplierList

### Detail Modal Pattern
Uses `<DetailView>` component (`src/components/ui/detail-view.tsx`):
- Props: open, onOpenChange, title, children, footer, className, expandHref
- Supports dialog mode and drawer mode (responsive)
- Has built-in ScrollArea for content
- Pattern: `CompanyDetailModal`, `SupplierDetailModal`

### API Route Pattern
Routes at `src/app/api/{entity}/route.ts`:
- GET: `requireAuth()`, query Prisma, return JSON
- POST: `requireEditor()`, validate body, create, return 201
- Nested: `/api/companies/[id]/departments/route.ts` for scoped entities

### Sidebar Navigation
Defined in `src/lib/nav-config.ts`:
- `navGroups` array with groups (saap, crm, admin)
- CRM group has: Companies, Pipeline, Potential Projects, Projects, Suppliers, Price Comparison
- Need to add: Departments and Contacts to CRM group
- Used by both `sidebar.tsx` and `mobile-sidebar.tsx` (via shared `nav-config.ts`)
- Also a `mobile-nav.tsx` bottom bar (separate from mobile sidebar)

### Database Schema
**Department model:**
- Fields: id, name, description, companyId
- Relations: company, contacts[], deals[], potentials[]
- Unique constraint: [companyId, name]
- Currently accessed ONLY through company routes: `/api/companies/[id]/departments`

**Contact model:**
- Fields: id, companyId, name, email, phone, role, isPrimary, departmentId
- Relations: company, department?, deals[], potentials[], projects[]
- Currently accessed through company routes: `/api/companies/[id]/contacts`

### Existing Components (Reusable)
- `CompanySelect` (`src/components/pipeline/company-select.tsx`) - fetches companies, combobox
- `DepartmentSelect` (`src/components/pipeline/department-select.tsx`) - takes departments prop, combobox
- `DepartmentCard` (`src/components/companies/department-card.tsx`) - shows dept with stats
- `DepartmentForm` (`src/components/companies/department-form.tsx`) - create form (needs companyId)
- `ContactCard` (`src/components/companies/contact-card.tsx`) - shows contact with inline edit
- `ContactForm` (`src/components/companies/contact-form.tsx`) - create form (needs companyId)
- `CompanyInlineField` - generic inline edit field
- `DetailView` - generic modal/drawer wrapper
- `Badge`, `Card`, `Table`, `Select`, `Dialog` - UI primitives

## What Needs Building

### 1. New API Routes (Standalone, not company-scoped)
- `GET /api/departments` - List all departments with company info, supports ?companyId filter
- `POST /api/departments` - Create department (requires companyId in body)
- `GET /api/contacts` - List all contacts with company+dept info, supports ?companyId + ?departmentId filters
- `POST /api/contacts` - Create contact (requires companyId in body)

### 2. New Pages
- `src/app/(dashboard)/departments/page.tsx` - Server component, queries all departments
- `src/app/(dashboard)/contacts/page.tsx` - Server component, queries all contacts

### 3. New List Components
- `src/components/departments/department-list.tsx` - Table with company filter, create dialog, detail modal
- `src/components/contacts/contact-list.tsx` - Table with company+department cascading filters, create dialog, detail modal

### 4. New Detail Modals
- `DepartmentDetailModal` - Shows department info, contacts in dept, deals, company link
- `ContactDetailModal` - Shows contact info, company, department, deals, projects

### 5. New Create Dialogs
- Create Department dialog (standalone) - needs CompanySelect for company, then name+description
- Create Contact dialog (standalone) - needs CompanySelect, then DepartmentSelect (cascading), name, email, phone, role

### 6. Sidebar Updates
- Add `{ name: 'Departments', href: '/departments', icon: Building }` to CRM group
- Add `{ name: 'Contacts', href: '/contacts', icon: Users }` to CRM group
- Import new icons in nav-config.ts

## Key Design Decisions

1. **API strategy**: Create new top-level `/api/departments` and `/api/contacts` routes rather than trying to reuse company-scoped routes. The standalone pages need cross-company queries.

2. **Cascading filters**: Contacts page needs company filter first, then department filter loads departments for selected company. When company changes, department filter resets.

3. **Reuse existing components**: DepartmentCard, ContactCard can be reused in list views. DepartmentForm and ContactForm need companyId, which the standalone create dialogs must provide.

4. **Detail modals follow existing pattern**: Use DetailView wrapper, fetch full entity data on open, show related items.

5. **Cross-entity navigation**: Department rows show company name (clickable to company detail). Contact rows show company + department names.

## Waves

- **Wave 1**: API routes + sidebar nav (foundation)
- **Wave 2**: Departments page + list + detail modal + create dialog
- **Wave 3**: Contacts page + list + detail modal + create dialog (depends on departments working for cascading filter)

## RESEARCH COMPLETE
