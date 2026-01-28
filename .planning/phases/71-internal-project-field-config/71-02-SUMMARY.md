# Summary: 71-02 Internal Field Config UI & Integration

## Status: COMPLETE

## What was built
- Settings page now has "Internal Project Fields" card with 5 toggle switches (checked = hidden for internal projects)
- Save button with dirty detection appears only when local state differs from persisted state
- ProjectFormModal conditionally hides Revenue and KRI Link fields when creating internal projects
- ProjectDetailSheet conditionally hides KRI Link edit field, Source Info, KRI Display, and Financials Summary
- ProjectDetailPageClient conditionally hides Company/Contact, Initiative, Source, and entire Financials Card
- All views pass through `useInternalFieldConfig` hook for consistent behavior
- Non-internal projects always show all fields regardless of config

## Commits
1. `04ea1f2` — feat(71-02): add internal project fields settings UI with toggles
2. `48e6fec` — feat(71-02): integrate field config into project create form
3. `9abfb9e` — feat(71-02): integrate field config into project detail sheet
4. `c5aa9da` — feat(71-02): integrate field config into project detail page

## Files Modified
- `src/app/(dashboard)/settings/page.tsx` — Added Internal Project Fields card with toggles
- `src/components/projects/project-form-modal.tsx` — Conditional Revenue and KRI fields
- `src/components/projects/project-detail-sheet.tsx` — Conditional Source, KRI, Financials sections
- `src/app/(dashboard)/projects/[id]/project-detail-page-client.tsx` — Conditional Company, Contact, Initiative, Source, Financials Card

## Decisions
- Toggle "checked" state represents "hidden when internal" (not "visible") for intuitive admin UX
- Submit handlers nullify hidden field values to prevent stale data being saved
- Entity name (Motionvii/Talenta) always shown in header for internal projects regardless of companyContact config

## Issues
None.
