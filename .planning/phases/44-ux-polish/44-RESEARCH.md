# Phase 44: UX Polish - Research

**Researched:** 2026-01-26
**Domain:** React UI patterns - clickable rows, formatted inputs, text wrapping
**Confidence:** HIGH

## Summary

This phase involves three categories of UX improvements: making table/board rows clickable to open detail views, formatting currency value inputs with "RM" prefix and thousand separators, and allowing initiative titles to wrap instead of truncating.

After thorough codebase investigation, the scope is smaller than it appears. The Companies list already has clickable rows (ROW-02 is done). The Pipeline board already has clickable cards (ROW-03 is partially done -- the cards open detail sheets). The main work is: (1) making the Initiatives list table rows open a detail dialog instead of navigating to a separate page, (2) creating a formatted currency input component, and (3) removing `truncate` CSS from initiative titles.

**Primary recommendation:** Focus on the Initiatives list clickable row pattern (using the existing `InitiativeDetailSheet` from kanban), create a reusable `CurrencyInput` component for value fields, and change `truncate` to wrapping CSS on initiative titles.

## Standard Stack

No new libraries needed. Everything can be done with the existing stack.

### Core (Already in project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 18.x | UI framework | Already in use |
| Radix Dialog | 1.1.15 | Detail modals | Already used for sheets/dialogs |
| Tailwind CSS | 3.4.1 | Styling | Already in use |
| Intl.NumberFormat | Native | Currency formatting | Already used in `formatCurrency` |

### No New Dependencies Required
All requirements can be met with existing project dependencies and native browser APIs.

## Architecture Patterns

### Pattern 1: Clickable Table Rows Opening Dialog (Companies pattern - EXISTING)

The Companies list already implements the exact pattern needed for Initiatives. This is the reference implementation.

**What:** Table rows have `cursor-pointer` and `onClick` handler that sets state to open a detail dialog.
**Source:** `src/components/companies/company-list.tsx` lines 265-268

```typescript
// State management
const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null)
const [isDetailOpen, setIsDetailOpen] = useState(false)

// Row click handler
const handleRowClick = (companyId: string) => {
  setSelectedCompanyId(companyId)
  setIsDetailOpen(true)
}

// Table row with click handler
<TableRow
  key={company.id}
  className="group cursor-pointer hover:bg-gray-50"
  onClick={() => handleRowClick(company.id)}
>

// Dropdown button stops propagation
<Button onClick={(e) => e.stopPropagation()}>

// Detail modal rendered at bottom
<CompanyDetailModal
  companyId={selectedCompanyId}
  open={isDetailOpen}
  onOpenChange={(open) => { if (!open) handleDetailClose() }}
/>
```

### Pattern 2: Formatted Currency Input

**What:** An input field that displays "RM 200,000" while storing the raw number value.
**When to use:** Deal value and potential project estimated value input fields.

The pattern is a controlled text input (NOT `type="number"`) that:
1. On focus: shows the raw number for editing
2. On blur: formats with `Intl.NumberFormat` for display
3. On change: strips non-numeric characters before storing

```typescript
// CurrencyInput component pattern
function CurrencyInput({ value, onChange, ...props }) {
  const [displayValue, setDisplayValue] = useState('')
  const [isFocused, setIsFocused] = useState(false)

  useEffect(() => {
    if (!isFocused) {
      setDisplayValue(value ? formatCurrencyDisplay(Number(value)) : '')
    }
  }, [value, isFocused])

  const handleFocus = () => {
    setIsFocused(true)
    setDisplayValue(value || '')  // Show raw number
  }

  const handleBlur = () => {
    setIsFocused(false)
    // Clean and store raw value
    const cleaned = displayValue.replace(/[^0-9.]/g, '')
    onChange(cleaned)
  }

  const handleChange = (e) => {
    const raw = e.target.value.replace(/[^0-9.]/g, '')
    setDisplayValue(raw)
    onChange(raw)
  }

  return (
    <div className="relative">
      {!isFocused && displayValue && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
          RM
        </span>
      )}
      <Input
        type="text"
        inputMode="decimal"
        value={isFocused ? displayValue : (value ? formatCurrencyDisplay(Number(value)) : '')}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onChange={handleChange}
        className={!isFocused && value ? 'pl-10' : ''}
        {...props}
      />
    </div>
  )
}
```

### Pattern 3: Text Wrapping Instead of Truncation

**What:** Replace `truncate` class with normal text flow.
**Where:** Initiative title in `initiatives-list.tsx` line 226.

```typescript
// BEFORE (truncated):
<p className="font-medium text-gray-900 truncate">
  {initiative.title}
</p>

// AFTER (wrapping):
<p className="font-medium text-gray-900">
  {initiative.title}
</p>
```

The objectives view (`initiative-row.tsx`) already does NOT truncate initiative titles (line 48 has no truncate class). The kanban card uses `line-clamp-2` which is acceptable for card layouts.

### Anti-Patterns to Avoid
- **Using `type="number"` for formatted currency:** Number inputs cannot show "RM" prefix or thousand separators. Must use `type="text"` with `inputMode="decimal"`.
- **Navigating to a separate page for initiative detail from the list view:** The rest of the app uses in-page dialogs/sheets. The Initiatives list is the only one that navigates away (to `/initiatives/[id]`). Use the existing `InitiativeDetailSheet` component from kanban instead.
- **Adding `e.stopPropagation()` on every cell instead of on specific interactive elements:** Only stop propagation on buttons and dropdown triggers within the row.

## Existing State Analysis

### ROW-01: Initiative List Clickable Rows - NEEDS WORK
**Current behavior:** Initiatives list has a dropdown menu with "View Details" that navigates to `/initiatives/[id]` via `<Link>`.
**Target behavior:** Clicking the row opens `InitiativeDetailSheet` (already exists in `src/components/kanban/initiative-detail-sheet.tsx`).
**Changes needed:**
1. Import and use `InitiativeDetailSheet` in `initiatives-list.tsx`
2. Add `selectedInitiative` and `isSheetOpen` state
3. Add `onClick` handler to `<TableRow>`
4. Add `cursor-pointer` to row className
5. Add `e.stopPropagation()` to dropdown button
6. Render `InitiativeDetailSheet` at bottom of component
7. The `[id]` page route can remain for direct URL access

**Reference:** The `objective-hierarchy.tsx` component already uses this exact pattern with `InitiativeDetailSheet`.

### ROW-02: Company List Clickable Rows - ALREADY DONE
**Current behavior:** Company rows are already clickable (`cursor-pointer`, `onClick={handleRowClick}`), opening `CompanyDetailModal`.
**No work needed.** This requirement is already satisfied.

### ROW-03: Pipeline Clickable Rows - ALREADY DONE (board view)
**Current behavior:** Pipeline cards are already clickable via `handleCardClick` opening `DealDetailSheet`. Potential project cards also clickable opening `PotentialDetailSheet`.
**Important note:** Pipeline and Potential Projects only have board views (kanban), not list/table views. The cards are already clickable.
**No work needed** unless a list/table view is planned for pipeline.

### FMT-01/FMT-02: Value Input Formatting - NEEDS WORK
**Current behavior:** Value inputs use `<Input type="number" step="0.01" min="0">` showing raw numbers like "200000".
**Target behavior:** Display "RM 200,000" in the input while storing raw number.
**Affected files:**
1. `src/components/pipeline/deal-form-modal.tsx` (line 249) - deal value
2. `src/components/pipeline/deal-detail-sheet.tsx` (line 340) - deal value edit
3. `src/components/potential-projects/potential-form-modal.tsx` (line 249) - estimated value
4. `src/components/potential-projects/potential-detail-sheet.tsx` - estimated value edit

**Existing formatting:** `formatCurrency()` in `src/lib/utils.ts` already formats as "RM 200,000" using `Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR' })`. This can be reused for display formatting.

### FMT-03: Initiative Title Wrapping - NEEDS WORK (trivial)
**Current behavior:** `initiatives-list.tsx` line 226 uses `truncate` class.
**Target behavior:** Remove `truncate` so text wraps naturally.
**Scope:** Only one line change in one file. The `max-w-md` container on line 225 can optionally be removed too.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Currency formatting | Custom regex-based formatter | `Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR' })` | Already used in `formatCurrency()`, handles locale-specific separators |
| Initiative detail dialog | New detail component | `InitiativeDetailSheet` from `src/components/kanban/initiative-detail-sheet.tsx` | Already exists, fully featured with edit, comments, status changes |
| Company detail modal | Anything new | `CompanyDetailModal` from `src/components/companies/company-detail-modal.tsx` | Already wired up and working |

**Key insight:** Most of this phase's work is already done in the codebase. The main tasks are wiring up an existing component (`InitiativeDetailSheet`) in a new location, creating one small reusable component (`CurrencyInput`), and removing a CSS class.

## Common Pitfalls

### Pitfall 1: Click Event Propagation on Table Rows
**What goes wrong:** Clicking the dropdown menu button or action items inside a table row also triggers the row's onClick handler, double-firing the action.
**Why it happens:** Event bubbling from child elements to parent row.
**How to avoid:** Add `e.stopPropagation()` on dropdown trigger buttons and any interactive elements within the row. The Companies list already does this correctly (line 319): `onClick={(e) => e.stopPropagation()}`.
**Warning signs:** Clicking the "..." menu opens both the dropdown AND the detail dialog.

### Pitfall 2: Currency Input Losing Focus or Cursor Position
**What goes wrong:** Re-formatting the value on every keystroke causes the cursor to jump or the input to lose focus.
**Why it happens:** Setting displayValue with formatting on every change triggers React re-render that moves cursor.
**How to avoid:** Only format on blur, not on change. During active editing (focused state), show the raw number. This is the standard "format on blur" pattern.
**Warning signs:** Typing "200" shows "RM 200" mid-type and cursor jumps to end.

### Pitfall 3: Initiative Detail Sheet Data Mismatch
**What goes wrong:** The `InitiativeDetailSheet` expects a full initiative object with KPI fields, but the `InitiativesList` only has basic fields.
**Why it happens:** The list page query (`prisma.initiative.findMany`) returns fewer fields than what `InitiativeDetailSheet` needs.
**How to avoid:** The `InitiativeDetailSheet` fetches its own data by initiative ID (it likely needs to, similar to how `CompanyDetailModal` fetches by ID). Check the component's props to confirm what it expects.
**Warning signs:** Missing fields in the detail sheet, undefined errors.

### Pitfall 4: parseFloat Precision Issues with Currency
**What goes wrong:** `parseFloat("200000.1")` works fine, but `parseFloat("RM 200,000")` returns `NaN`.
**Why it happens:** Parsing formatted strings instead of raw values.
**How to avoid:** Always store and submit the raw numeric string. Strip formatting characters before parsing: `value.replace(/[^0-9.]/g, '')`.
**Warning signs:** API receives `NaN` or `null` for value field.

## Code Examples

### Example 1: Making Initiatives List Rows Clickable (adapting companies pattern)

```typescript
// In initiatives-list.tsx, add:
import { InitiativeDetailSheet } from '@/components/kanban/initiative-detail-sheet'

// Add state:
const [selectedInitiative, setSelectedInitiative] = useState<Initiative | null>(null)
const [isSheetOpen, setIsSheetOpen] = useState(false)

// Add handler:
const handleRowClick = (initiative: Initiative) => {
  setSelectedInitiative(initiative)
  setIsSheetOpen(true)
}

const handleInitiativeUpdate = async () => {
  // Refresh data
  const response = await fetch('/api/initiatives')
  const data = await response.json()
  setInitiatives(data)
}

// Update TableRow:
<TableRow
  key={initiative.id}
  className="group cursor-pointer hover:bg-gray-50"
  onClick={() => handleRowClick(initiative)}
>

// Update dropdown button:
<Button onClick={(e) => e.stopPropagation()}>

// Add sheet at end of component:
<InitiativeDetailSheet
  initiative={selectedInitiative}
  open={isSheetOpen}
  onOpenChange={setIsSheetOpen}
  onUpdate={handleInitiativeUpdate}
  allInitiatives={initiatives}
/>
```

### Example 2: CurrencyInput Component

```typescript
// src/components/ui/currency-input.tsx
'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface CurrencyInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  id?: string
}

export function CurrencyInput({
  value,
  onChange,
  placeholder = '0',
  disabled = false,
  className,
  id,
}: CurrencyInputProps) {
  const [isFocused, setIsFocused] = useState(false)

  const formatDisplay = (raw: string): string => {
    if (!raw) return ''
    const num = parseFloat(raw)
    if (isNaN(num)) return ''
    return new Intl.NumberFormat('en-MY', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(num)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow only digits and decimal point
    const cleaned = e.target.value.replace(/[^0-9.]/g, '')
    // Prevent multiple decimal points
    const parts = cleaned.split('.')
    const sanitized = parts.length > 2
      ? parts[0] + '.' + parts.slice(1).join('')
      : cleaned
    onChange(sanitized)
  }

  const displayValue = isFocused
    ? value
    : formatDisplay(value)

  return (
    <div className="relative">
      {!isFocused && value && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
          RM
        </span>
      )}
      <Input
        id={id}
        type="text"
        inputMode="decimal"
        value={displayValue}
        onChange={handleChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          !isFocused && value ? 'pl-10' : '',
          disabled && 'bg-gray-50 cursor-not-allowed',
          className
        )}
      />
    </div>
  )
}
```

### Example 3: Removing Initiative Title Truncation

```typescript
// BEFORE (initiatives-list.tsx line 225-227):
<div className="max-w-md">
  <p className="font-medium text-gray-900 truncate">
    {initiative.title}
  </p>

// AFTER:
<div>
  <p className="font-medium text-gray-900">
    {initiative.title}
  </p>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Navigate to detail page | Open detail in dialog/sheet overlay | Already adopted in companies/kanban | Keeps user context, faster UX |
| `type="number"` inputs | `type="text"` with `inputMode="decimal"` + formatting | Browser standard | Allows formatting while maintaining mobile numeric keyboard |
| `truncate` for long text | Natural text wrapping or `line-clamp-N` | CSS standard | Better readability for important content like titles |

## Open Questions

1. **InitiativeDetailSheet props compatibility**
   - What we know: The kanban view passes full initiative data including KPI fields. The list view has a simpler Initiative interface without KPI fields.
   - What's unclear: Whether `InitiativeDetailSheet` fetches its own data or relies entirely on props.
   - Recommendation: Read `InitiativeDetailSheet` props interface during implementation. If it needs KPI data, either fetch on open or update the list page query to include KPI fields.

2. **Pipeline "list views" interpretation**
   - What we know: Pipeline and Potential Projects currently only have board (kanban) views. Cards are already clickable.
   - What's unclear: Whether ROW-03 refers to the existing board cards or if a future list view is planned.
   - Recommendation: If the board cards are already clickable (they are), ROW-03 may already be satisfied. Verify with the user if a list/table view for pipeline is needed.

## Sources

### Primary (HIGH confidence)
- Direct codebase analysis of all relevant component files
- `src/components/companies/company-list.tsx` - Reference clickable row implementation
- `src/components/pipeline/pipeline-board.tsx` - Reference clickable card implementation
- `src/components/objectives/objective-hierarchy.tsx` - Reference initiative detail sheet usage
- `src/components/initiatives/initiatives-list.tsx` - Target file for ROW-01
- `src/components/pipeline/deal-form-modal.tsx` - Target file for FMT-01
- `src/components/pipeline/deal-detail-sheet.tsx` - Target file for FMT-01
- `src/components/potential-projects/potential-form-modal.tsx` - Target file for FMT-01
- `src/lib/utils.ts` - Existing `formatCurrency` function

### Secondary (MEDIUM confidence)
- Intl.NumberFormat behavior verified via Node.js: `RM 200,000` output confirmed

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - no new libraries needed, all patterns exist in codebase
- Architecture: HIGH - patterns directly copied from existing implementations
- Pitfalls: HIGH - based on direct code analysis of existing click handling patterns

**Research date:** 2026-01-26
**Valid until:** 2026-02-26 (stable, no external dependencies changing)
