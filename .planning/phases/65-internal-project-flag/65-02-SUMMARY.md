# Summary: 65-02 UI for Internal Projects

## Status: COMPLETE

## What was built
- Added Internal Project toggle checkbox and Entity selector (Motionvii/Talenta) to project creation form
- Added amber "Internal" badge to project cards alongside existing source/KRI/archived badges
- Added entity name display (Motionvii/Talenta) on project cards for internal projects without a company
- Added All/Client/Internal type filter tabs to the project list page, before existing status filter
- Updated project detail sheet with internal toggle, entity selector, and conditional company/contact visibility
- Added Internal badge and entity display to the full project detail page
- Updated pending-analysis-widget for null-safe company display

## Commits
1. `31cfe25` - feat(65-02): add internal project toggle and entity selector to creation form
2. `bf6a2a1` - feat(65-02): add Internal badge and entity display to project cards
3. `3550e45` - feat(65-02): add type filter tabs (All/Client/Internal) to project list
4. `ed71c18` - feat(65-02): add internal project editing support to detail sheet
5. `cc1b964` - feat(65-02): add Internal badge and entity display to project detail page
6. `1664c60` - fix(65-02): handle null company in pending analysis widget

## Files modified
- `src/components/projects/project-form-modal.tsx` - Internal toggle, entity selector, conditional company/contact
- `src/components/projects/project-card.tsx` - Internal badge, entity name display
- `src/components/projects/project-list.tsx` - Type filter tabs, combined filtering
- `src/components/projects/project-detail-sheet.tsx` - Internal toggle, entity selector, validation
- `src/app/(dashboard)/projects/[id]/project-detail-page-client.tsx` - Internal badge, entity display
- `src/components/dashboard/pending-analysis-widget.tsx` - Null-safe company

## Deviations
- No changes needed for `src/app/(dashboard)/projects/page.tsx` (Task 6) -- the `...project` spread already passes through isInternal and internalEntity automatically.

## Verification
- TypeScript compiles without errors (`npx tsc --noEmit` passes)
