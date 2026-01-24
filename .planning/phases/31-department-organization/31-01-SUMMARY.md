---
phase: 31-department-organization
plan: 01
subsystem: crm
tags: [departments, companies, contacts, prisma, shadcn, combobox]

# Dependency graph
requires:
  - phase: 10-companies-contacts
    provides: Company and Contact CRUD, CompanyDetailModal pattern
  - phase: 29-schema-foundation
    provides: Department model with company/contact/deal/potential relations
provides:
  - Department CRUD API routes
  - Department UI in company detail modal
  - DepartmentSelect component for forms
  - Contact-department assignment capability
affects: [32-deal-department, 33-potential-department]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Nested API routes under company for department CRUD
    - Transaction-based delete with linked record unlinking
    - DepartmentSection pattern matching ContactSection

key-files:
  created:
    - src/app/api/companies/[id]/departments/route.ts
    - src/app/api/companies/[id]/departments/[deptId]/route.ts
    - src/components/companies/department-section.tsx
    - src/components/companies/department-card.tsx
    - src/components/companies/department-form.tsx
    - src/components/pipeline/department-select.tsx
  modified:
    - src/app/api/companies/[id]/route.ts
    - src/app/api/companies/[id]/contacts/route.ts
    - src/components/companies/company-detail-modal.tsx
    - src/components/companies/contact-form.tsx

key-decisions:
  - "Delete departments via transaction that unlinks contacts/deals/potentials first"
  - "DepartmentSelect only shown in ContactForm when departments.length > 0"
  - "Departments section placed between contacts and related items in modal"

patterns-established:
  - "DepartmentSection: inline CRUD section in company modal following ContactSection pattern"
  - "DepartmentSelect: reusable combobox for department selection with client-side filtering"

# Metrics
duration: 6min
completed: 2026-01-24
---

# Phase 31 Plan 01: Department CRUD Summary

**Department CRUD API routes with inline UI in company modal, DepartmentSelect combobox, and contact-department assignment capability**

## Performance

- **Duration:** 6 min
- **Started:** 2026-01-24T15:08:41Z
- **Completed:** 2026-01-24T15:14:30Z
- **Tasks:** 3
- **Files modified:** 10

## Accomplishments
- Department API routes with list, create, get, update, delete operations
- Company GET extended to include departments with _count and contacts include department
- Department section in company detail modal with form, cards, empty state
- DepartmentSelect component following ContactSelect pattern
- Contact form with department selection when departments exist

## Task Commits

Each task was committed atomically:

1. **Task 1: Department API routes and company API extension** - `bf2b163` (feat)
2. **Task 2: Department UI components in company modal** - `7248ede` (feat)
3. **Task 3: DepartmentSelect and contact form integration** - `c709d0a` (feat)

## Files Created/Modified
- `src/app/api/companies/[id]/departments/route.ts` - GET list, POST create department
- `src/app/api/companies/[id]/departments/[deptId]/route.ts` - GET, PATCH, DELETE single department
- `src/app/api/companies/[id]/route.ts` - Extended to include departments
- `src/app/api/companies/[id]/contacts/route.ts` - Extended to handle departmentId
- `src/components/companies/department-section.tsx` - Departments section in modal
- `src/components/companies/department-card.tsx` - Single department display with edit/delete
- `src/components/companies/department-form.tsx` - Form to add new department
- `src/components/pipeline/department-select.tsx` - Reusable department combobox
- `src/components/companies/company-detail-modal.tsx` - Updated with Department interface and section
- `src/components/companies/contact-form.tsx` - Updated with department selection

## Decisions Made
- Delete department uses transaction to set departmentId to null on linked contacts/deals/potentials before deleting (avoids orphaned references)
- DepartmentSelect component uses client-side filtering (departments typically < 20 per company)
- Department selection in contact form only shown when company has departments (cleaner UX)
- Departments section placed after contacts section in modal (logical grouping)

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Department CRUD complete for contacts
- Ready for deal-department assignment (Phase 32)
- Ready for potential-department assignment (Phase 33)
- DepartmentSelect component reusable in deal/potential forms

---
*Phase: 31-department-organization*
*Completed: 2026-01-24*
