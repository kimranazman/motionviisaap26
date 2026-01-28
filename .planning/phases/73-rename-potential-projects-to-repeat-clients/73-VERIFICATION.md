# Verification: Phase 73 - Rename Potential Projects to Repeat Clients

---
status: passed
verified_at: 2026-01-28
---

## Goal

Rename "Potential Projects" to "Repeat Clients" throughout the application UI.

## Must-Haves Checklist

| # | Requirement | Status | Evidence |
|---|-------------|--------|----------|
| 1 | Sidebar navigation shows "Repeat Clients" not "Potential Projects" | PASS | `nav-config.ts:73` - `{ name: 'Repeat Clients', href: '/potential-projects' }` |
| 2 | /potential-projects page header says "Repeat Clients" | PASS | `page.tsx:61` - `title="Repeat Clients"` |
| 3 | Add dialog says "Add Repeat Client" | PASS | `potential-form-modal.tsx:182` - `<DialogTitle>Add Repeat Client</DialogTitle>` |
| 4 | Toast messages reference "Repeat client" not "Potential" | PASS | `potential-detail-sheet.tsx` - "Repeat client archived/unarchived" |
| 5 | Company/Contact/Department modals show "Repeat Clients" section header | PASS | All three modal files updated |
| 6 | No TypeScript errors | PASS | `npx tsc --noEmit` completed with no errors |
| 7 | URL path remains /potential-projects (unchanged) | PASS | href in nav-config.ts is `/potential-projects` |

## Verification Details

### Navigation Check
```typescript
// src/lib/nav-config.ts:73
{ name: 'Repeat Clients', href: '/potential-projects', icon: FolderKanban },
```

### Page Header Check
```typescript
// src/app/(dashboard)/potential-projects/page.tsx:61
title="Repeat Clients"
```

### Form Dialog Check
```typescript
// src/components/potential-projects/potential-form-modal.tsx:182
<DialogTitle>Add Repeat Client</DialogTitle>
```

### Toast Messages Check
```typescript
// src/components/potential-projects/potential-detail-sheet.tsx
toast.success(updated.isArchived ? 'Repeat client archived' : 'Repeat client unarchived')
```

### CRM Modal Checks
- Company modal: `Repeat Clients ({company._count.potentials})`
- Contact modal: `Repeat Clients ({contact.potentials.length})`
- Department modal: `Repeat Clients ({department._count.potentials})`

### Remaining "Potential Project" References
Only 1 file contains "Potential Project" text:
- `src/lib/potential-utils.ts` - This is a code comment (`// Potential Projects stage configuration`), not UI-facing text

## Score

7/7 must-haves verified

## Result

**PASSED** - All requirements met. Phase 73 goal achieved.
