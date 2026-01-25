# Phase 37: Convert Detail Sheets to Modals - Research

**Researched:** 2026-01-26
**Domain:** UI Component Conversion (Sheet to Dialog)
**Confidence:** HIGH

## Summary

The codebase has 5 detail sheet components that slide in from the right side. The requirement is to convert these to centered Dialog/Modal components for better UX. Research found:

1. **Both Sheet and Dialog use the same Radix primitive** (`@radix-ui/react-dialog`) - conversion is straightforward
2. **Existing Dialog component already has mobile-responsive behavior** - slides from bottom on mobile, centered on desktop
3. **Documents display issue is NOT a component bug** - documents fetch correctly when sheet opens, the issue is elsewhere
4. **Sheet's resizable feature complicates conversion** - Dialog doesn't have built-in resize, may need custom implementation

**Primary recommendation:** Convert Sheet to Dialog using existing Dialog component with custom width prop for larger content areas.

## Standard Stack

The codebase already has the correct components:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @radix-ui/react-dialog | ^1.1.15 | Both Sheet and Dialog primitives | Standard Radix UI - both components use same base |
| shadcn/ui Dialog | local | Centered modal component | Already configured with mobile-responsive animations |

### Key Finding: Sheet IS Dialog

Both `sheet.tsx` and `dialog.tsx` import from the same package:
```typescript
// sheet.tsx
import * as SheetPrimitive from "@radix-ui/react-dialog"

// dialog.tsx
import * as DialogPrimitive from "@radix-ui/react-dialog"
```

This means:
- Sheet is just Dialog with slide-in animations and side positioning
- Conversion is mostly CSS/Tailwind class changes
- All accessibility features carry over automatically
- Same API (Trigger, Content, Title, Description, Close)

## Architecture Patterns

### Current Sheet Pattern (5 components)

All detail sheets follow identical structure:

```typescript
// Pattern used in all 5 detail sheets
<Sheet open={open} onOpenChange={onOpenChange}>
  <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col" resizable>
    <SheetHeader className="p-6 pb-4 border-b">
      <Badge /> <SheetTitle />
    </SheetHeader>

    <ScrollArea className="flex-1">
      <div className="p-6 space-y-4">
        {/* Form fields, sections */}
      </div>
    </ScrollArea>

    <SheetFooter className="p-4 border-t">
      {/* Action buttons */}
    </SheetFooter>
  </SheetContent>
</Sheet>
```

### Target Dialog Pattern

Conversion requires minimal structure changes:

```typescript
<Dialog open={open} onOpenChange={onOpenChange}>
  <DialogContent className="max-w-2xl max-h-[90vh] p-0 flex flex-col">
    <DialogHeader className="p-6 pb-4 border-b">
      <Badge /> <DialogTitle />
    </DialogHeader>

    <ScrollArea className="flex-1 overflow-hidden">
      <div className="p-6 space-y-4">
        {/* Same content */}
      </div>
    </ScrollArea>

    <DialogFooter className="p-4 border-t">
      {/* Same buttons */}
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Existing Dialog Component Features

The dialog.tsx already has responsive behavior:
```typescript
// Mobile: slide from bottom, nearly full-screen
"inset-x-0 bottom-0 h-[calc(100vh-2rem)] rounded-t-2xl",
"data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",

// Desktop: centered modal with zoom
"md:inset-auto md:left-[50%] md:top-[50%] md:translate-x-[-50%] md:translate-y-[-50%]",
"md:h-auto md:max-h-[85vh] md:max-w-lg md:rounded-lg",
```

### Size Customization Strategy

Current Dialog default is `max-w-lg` (512px). For detail views, use:

| Content Type | Width | Tailwind Class |
|--------------|-------|----------------|
| Simple form | 512px | `max-w-lg` (default) |
| Detail view | 600px | `max-w-[600px]` |
| Wide content | 700px | `max-w-[700px]` or `max-w-2xl` |
| AI Review | 800px | `max-w-3xl` |

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Centered modal | Custom positioning | Existing Dialog component | Already handles centering, animations, accessibility |
| Mobile responsiveness | Media query logic | Dialog's built-in classes | Already slides from bottom on mobile |
| Scroll management | Custom overflow | ScrollArea within DialogContent | Handles long content properly |
| Focus management | Custom focus trap | Radix primitives | Automatic focus trapping and return |

## Common Pitfalls

### Pitfall 1: Losing Resizable Functionality
**What goes wrong:** Current sheets support resizable widths with localStorage persistence
**Why it happens:** Dialog doesn't have built-in resize functionality
**How to avoid:** Either:
  1. Accept fixed widths (simpler, recommended for MVP)
  2. Create custom ResizableDialog if needed later
**Warning signs:** User complaints about fixed modal size

### Pitfall 2: Scroll Breaking on Long Content
**What goes wrong:** Content overflows or double scrollbars appear
**Why it happens:** Dialog has `overflow-y-auto` but flex layout needs proper height constraints
**How to avoid:** Use this pattern:
```typescript
<DialogContent className="max-h-[90vh] flex flex-col">
  <DialogHeader />
  <ScrollArea className="flex-1 min-h-0">
    {/* Content */}
  </ScrollArea>
  <DialogFooter />
</DialogContent>
```
**Warning signs:** Content cut off, no scrollbar visible

### Pitfall 3: Mobile Height Issues
**What goes wrong:** Modal too tall or keyboard pushes content off screen
**Why it happens:** `h-[calc(100vh-2rem)]` doesn't account for keyboard on mobile
**How to avoid:** Keep existing mobile slide-up pattern unchanged
**Warning signs:** Content hidden on mobile when keyboard opens

### Pitfall 4: Close Button Position
**What goes wrong:** Close button overlaps with header content
**Why it happens:** Dialog's close button is absolute positioned
**How to avoid:** Ensure header has proper padding-right (`pr-10` or `pr-12`)
**Warning signs:** X button overlapping title or badges

## Code Examples

### Basic Sheet to Dialog Conversion

**Before (Sheet):**
```typescript
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter
} from '@/components/ui/sheet'

<Sheet open={open} onOpenChange={onOpenChange}>
  <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col">
    <SheetHeader className="p-6 pb-4 border-b">
      <SheetTitle>{title}</SheetTitle>
    </SheetHeader>
    <ScrollArea className="flex-1">{content}</ScrollArea>
    <SheetFooter className="p-4 border-t">{buttons}</SheetFooter>
  </SheetContent>
</Sheet>
```

**After (Dialog):**
```typescript
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog'

<Dialog open={open} onOpenChange={onOpenChange}>
  <DialogContent className="max-w-[650px] max-h-[90vh] p-0 flex flex-col">
    <DialogHeader className="p-6 pb-4 border-b shrink-0">
      <DialogTitle>{title}</DialogTitle>
    </DialogHeader>
    <ScrollArea className="flex-1 min-h-0">{content}</ScrollArea>
    <DialogFooter className="p-4 border-t shrink-0">{buttons}</DialogFooter>
  </DialogContent>
</Dialog>
```

### Key Class Changes

| Sheet Class | Dialog Equivalent | Notes |
|-------------|-------------------|-------|
| `w-full sm:max-w-lg` | `max-w-[650px]` | Fixed width instead of responsive |
| `flex flex-col` | `flex flex-col` | Same |
| (none) | `max-h-[90vh]` | Add height constraint |
| `resizable` prop | (remove) | Not supported, use fixed width |

## Components to Convert

Priority order based on usage frequency:

| Component | File | Complexity | Notes |
|-----------|------|------------|-------|
| 1. ProjectDetailSheet | `src/components/projects/project-detail-sheet.tsx` | HIGH | 1400 lines, most complex, has nested sheets |
| 2. DealDetailSheet | `src/components/pipeline/deal-detail-sheet.tsx` | MEDIUM | 535 lines, simpler structure |
| 3. PotentialDetailSheet | `src/components/potential-projects/potential-detail-sheet.tsx` | MEDIUM | 512 lines, similar to deal |
| 4. InitiativeDetailSheet | `src/components/kanban/initiative-detail-sheet.tsx` | MEDIUM | 493 lines, has comments section |
| 5. TaskDetailSheet | `src/components/projects/task-detail-sheet.tsx` | LOW | 353 lines, simplest |

### Nested Sheet Consideration

ProjectDetailSheet opens nested sheets for AI review:
- `AIReviewSheet` (for invoice/receipt review)
- `DeliverableReviewSheet` (for deliverable review)

These should ALSO be converted to Dialog for consistency. Opening a Dialog within a Dialog works fine with Radix primitives.

## Documents Issue Investigation

### Finding: Documents Load Correctly

Examined `project-detail-sheet.tsx` lines 494-508:
```typescript
useEffect(() => {
  const fetchDocuments = async () => {
    if (!project || !open) return
    try {
      const response = await fetch(`/api/projects/${project.id}/documents`)
      if (response.ok) {
        const data = await response.json()
        setDocuments(data)  // Documents ARE being set
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error)
    }
  }
  fetchDocuments()
}, [project?.id, open])
```

And `DocumentsSection` component renders documents:
```typescript
{documents.length > 0 && (
  <DocumentList
    documents={documents}
    projectId={projectId}
    onPreview={onPreview}
    onDocumentChange={onDocumentsChange}
    onReview={onReview}
    onReviewDeliverable={onReviewDeliverable}
  />
)}
```

**Possible causes for "documents not showing":**
1. API error (check network tab)
2. Empty documents array from API
3. CSS/visibility issue
4. JS error breaking render

**Recommendation:** This needs debugging in browser, not component restructuring. The Sheet to Dialog conversion is unrelated to this bug.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Side sheets for detail views | Centered modals for focus | UX trend 2024-2025 | Better attention, clearer context |
| Resizable panels | Fixed-width modals with responsive breakpoints | CSS container queries | Simpler implementation |
| Custom scroll handling | ScrollArea component | shadcn/ui standard | Consistent behavior |

## Open Questions

1. **Should resizable functionality be preserved?**
   - Current: Sheets have resize handle + localStorage
   - Recommendation: Use fixed widths for MVP, add resize later if requested
   - Impact: Simpler conversion, may need follow-up if users miss resize

2. **What about mobile keyboard handling?**
   - Current: Mobile slides from bottom with fixed height
   - Issue: May need adjustment for forms with keyboards
   - Recommendation: Test on actual devices, adjust viewport if needed

3. **Rename files or just change imports?**
   - Option A: Rename `*-sheet.tsx` to `*-modal.tsx`
   - Option B: Keep filenames, just change component internals
   - Recommendation: Rename for clarity (breaking change for imports)

## Sources

### Primary (HIGH confidence)
- Codebase analysis: `/src/components/ui/sheet.tsx` and `/src/components/ui/dialog.tsx`
- Codebase analysis: All 5 detail sheet components
- Package.json: `@radix-ui/react-dialog` version 1.1.15

### Secondary (MEDIUM confidence)
- Radix UI documentation patterns (verified against codebase implementation)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - verified against actual codebase
- Architecture: HIGH - examined all 5 sheet components
- Pitfalls: HIGH - based on component internals analysis
- Documents issue: MEDIUM - need browser debugging to confirm

**Research date:** 2026-01-26
**Valid until:** 2026-02-26 (stable UI patterns)
