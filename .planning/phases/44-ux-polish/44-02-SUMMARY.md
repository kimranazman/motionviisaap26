---
phase: 44-ux-polish
plan: 02
subsystem: ui-components
tags: [currency, formatting, input, ux]
dependency-graph:
  requires: []
  provides: [CurrencyInput component, RM-formatted value inputs]
  affects: [any future value/currency input fields]
tech-stack:
  added: []
  patterns: [format-on-blur, Intl.NumberFormat locale formatting]
key-files:
  created:
    - src/components/ui/currency-input.tsx
  modified:
    - src/components/pipeline/deal-form-modal.tsx
    - src/components/pipeline/deal-detail-sheet.tsx
    - src/components/potential-projects/potential-form-modal.tsx
    - src/components/potential-projects/potential-detail-sheet.tsx
decisions:
  - Use format-on-blur pattern to avoid cursor jumping during editing
  - Use Intl.NumberFormat('en-MY') for Malaysian locale number formatting
  - Use type="text" with inputMode="decimal" instead of type="number"
metrics:
  duration: ~2 minutes
  completed: 2026-01-26
---

# Phase 44 Plan 02: Currency Input Formatting Summary

**One-liner:** Reusable CurrencyInput component with RM prefix and thousand-separator formatting using Intl.NumberFormat('en-MY') format-on-blur pattern.

## What Was Done

### Task 1: Create CurrencyInput component
Created `src/components/ui/currency-input.tsx` -- a reusable component implementing the format-on-blur pattern:
- **Focused state:** Shows raw numeric string (e.g., "200000") for easy keyboard editing
- **Blurred state:** Shows formatted display with RM prefix (e.g., "RM 200,000")
- **Input sanitization:** Strips non-numeric characters except decimal point, prevents multiple decimals
- **Disabled state:** Supports disabled prop for read-only contexts (converted/lost deals)
- Uses `type="text"` with `inputMode="decimal"` to allow formatting while showing numeric keyboard on mobile

### Task 2: Replace value inputs in deal and potential project forms
Updated four files to use CurrencyInput instead of `<Input type="number">`:
- `deal-form-modal.tsx` -- value field for new deal creation
- `deal-detail-sheet.tsx` -- value field for deal editing (with disabled support for converted/lost deals)
- `potential-form-modal.tsx` -- estimatedValue field for new potential project creation
- `potential-detail-sheet.tsx` -- estimatedValue field for potential project editing (with disabled support)

All `parseFloat()` calls in form submission handlers remained unchanged since CurrencyInput stores raw numeric strings.

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Format-on-blur (not on-keystroke) | Prevents cursor jumping issues during typing |
| Intl.NumberFormat('en-MY') | Proper Malaysian locale thousand separators |
| type="text" + inputMode="decimal" | Allows formatted display while showing numeric keyboard on mobile |
| RM prefix as positioned span | Clean visual without modifying the actual input value |

## Deviations from Plan

None -- plan executed exactly as written.

## Verification

- `npx tsc --noEmit` passes with no errors
- CurrencyInput component exports correctly
- All four form files import and use CurrencyInput
- Form submission handlers preserve parseFloat() for raw number storage

## Success Criteria Met

- [x] FMT-01: Pipeline/Deal value inputs display with "RM" prefix and thousand separators
- [x] FMT-02: Values stored as raw numbers, formatting is display-only
- [x] CurrencyInput component is reusable for future value fields
- [x] No regressions: Forms still submit correctly, values still parse to numbers

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | de33080 | feat(44-02): create CurrencyInput component |
| 2 | 3ed5bab | feat(44-02): replace value inputs with CurrencyInput in deal and potential forms |
