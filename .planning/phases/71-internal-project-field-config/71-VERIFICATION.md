# Phase 71 Verification: Internal Project Field Config

status: passed

## Must-Haves Verification

### INTL-01: Admin settings section shows toggles for internal project field visibility
- **Status:** PASSED
- **Evidence:** `src/app/(dashboard)/settings/page.tsx` line 495-540 renders "Internal Project Fields" card with `INTERNAL_FIELD_KEYS.map()` rendering Switch toggles for all 5 fields

### INTL-02: Configurable fields include: revenue, potentialRevenue, pipeline source, company/contact, initiative link
- **Status:** PASSED
- **Evidence:** `src/types/internal-fields.ts` lines 8-22 define `InternalFieldKey` type with all 5 values and `INTERNAL_FIELD_KEYS` constant with labels/descriptions

### INTL-03: Configuration stored in AdminDefaults (system-wide, not per-user)
- **Status:** PASSED
- **Evidence:** `prisma/schema.prisma` line 636 adds `internalFieldConfig Json?` to `AdminDefaults` model. `src/lib/widgets/defaults.ts` integrates into singleton getter/setter. API at `src/app/api/admin/internal-fields/route.ts` uses `getAdminDefaults()/updateAdminDefaults()`.

### INTL-04: Project form dynamically hides fields based on admin config when project is internal
- **Status:** PASSED
- **Evidence:**
  - `src/components/projects/project-form-modal.tsx` lines 273, 289 use `isHidden()` to conditionally render Revenue and KRI Link fields
  - `src/components/projects/project-detail-sheet.tsx` lines 1132, 1220, 1245, 1258 use `isFieldHidden()` to conditionally render KRI Link, Source Info, KRI Display, and Financials Summary

### INTL-05: Project detail view follows same field visibility rules
- **Status:** PASSED
- **Evidence:** `src/app/(dashboard)/projects/[id]/project-detail-page-client.tsx` lines 392, 407, 420, 455, 485 use `isFieldHidden()` to conditionally render Company/Contact, Initiative, Source, and Financials Card

### INTL-06: Sensible defaults applied when no admin config exists
- **Status:** PASSED
- **Evidence:** `src/types/internal-fields.ts` lines 33-35 define `DEFAULT_INTERNAL_FIELD_CONFIG` with `hiddenFields: ['revenue', 'potentialRevenue', 'pipelineSource', 'companyContact']`. The hook at `src/lib/hooks/use-internal-field-config.ts` line 30 falls back to this default when config is null.

## Score: 6/6 must-haves verified

## Summary
All 6 INTL requirements are fully implemented. The admin can control field visibility for internal projects via the Settings page. Configuration is stored system-wide in AdminDefaults. All project views (create form, detail sheet, detail page) respect the configuration. Sensible defaults hide revenue, potential revenue, pipeline source, and company/contact for internal projects when no config exists.
