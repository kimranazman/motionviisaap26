# Phase 19: Forms & Modals Responsive - Research

**Researched:** 2026-01-23
**Domain:** Responsive modals/dialogs, mobile form inputs, touch targets, date pickers
**Confidence:** HIGH

## Summary

This phase makes all forms and modals work effectively on mobile devices. The project uses Dialog for modals and Sheet for detail panels (slide-out panels), both built on Radix UI primitives. The forms use standard shadcn/ui Input, Select, Textarea components with Calendar (react-day-picker) for date picking.

The standard approach for responsive forms and modals involves:
1. **Full-Screen Modals on Mobile** - Dialog becomes full-width/full-height on mobile via responsive CSS classes
2. **Form Fields Stack Vertically** - Use `grid-cols-2 md:grid-cols-2` to ensure single-column on mobile
3. **Adequate Touch Targets** - Inputs at minimum 44px height (already ~36px, need increase)
4. **Date Pickers on Mobile** - react-day-picker works but needs larger touch targets and proper viewport containment
5. **Select Dropdowns on Mobile** - Radix Select works but may need viewport height constraints
6. **Detail Sheets Full-Width on Mobile** - Sheet already has `w-3/4 sm:max-w-sm`, needs `w-full md:w-3/4 md:max-w-sm`

**Primary recommendation:** Apply responsive CSS classes to existing Dialog/Sheet components for mobile fullscreen. Increase form input heights to 44px minimum (`h-11` instead of `h-9`). Stack form grids on mobile with `grid-cols-1 md:grid-cols-2`. Ensure all interactive elements have 44px minimum touch area.

## Standard Stack

### Core (Already in Project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @radix-ui/react-dialog | 1.1.15 | Modal dialogs | Already used for Dialog, Sheet |
| shadcn/ui Dialog | (Radix) | Modal wrapper | Standard responsive base |
| shadcn/ui Sheet | (Radix) | Slide-out panels | Detail panels, side="right" or "bottom" |
| react-day-picker | 9.13.0 | Date selection | Already in project, Calendar component |
| @radix-ui/react-select | 2.2.6 | Dropdown selects | Already used, touch-friendly |
| Tailwind CSS | 3.4.1 | Responsive utilities | `md:` breakpoints, height utilities |

### Supporting (Optional)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| vaul | latest | Native drawer gestures | If swipe-to-dismiss needed on mobile |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| CSS-only responsive Dialog | Drawer (Vaul) for mobile | Drawer adds dependency; CSS-only is simpler |
| react-day-picker | Native `<input type="date">` | Native is more mobile-friendly but less customizable |
| Popover-based date picker | Sheet-based on mobile | Sheet provides more space but different interaction |

**Installation:**
No new packages required for basic responsive forms. If drawer gestures desired:
```bash
npx shadcn@latest add drawer
```

## Architecture Patterns

### Recommended Project Structure
```
src/
components/
  ui/
    dialog.tsx            # UPDATE: Add responsive full-screen classes
    sheet.tsx             # UPDATE: Add mobile full-width variant
    input.tsx             # UPDATE: Increase height to h-11 for touch
    select.tsx            # UPDATE: Increase trigger height to h-11
    calendar.tsx          # UPDATE: Ensure touch-friendly day buttons
  pipeline/
    deal-form-modal.tsx   # UPDATE: Stack form fields on mobile
    deal-detail-sheet.tsx # UPDATE: Full-width on mobile
  potential-projects/
    potential-form-modal.tsx # UPDATE: Stack form fields
    potential-detail-sheet.tsx # UPDATE: Full-width on mobile
  projects/
    project-form-modal.tsx    # UPDATE: Stack form fields
    project-detail-sheet.tsx  # UPDATE: Full-width on mobile
    cost-form.tsx             # UPDATE: Stack fields on mobile
  initiatives/
    initiative-form.tsx       # UPDATE: Stack fields on mobile
  kanban/
    initiative-detail-sheet.tsx # UPDATE: Full-width on mobile
  companies/
    company-detail-modal.tsx    # UPDATE: Full-screen on mobile
    contact-form.tsx            # UPDATE: Stack fields on mobile
```

### Pattern 1: Full-Screen Dialog on Mobile
**What:** Dialog becomes full viewport on mobile, centered on desktop
**When to use:** All form modals (DealFormModal, ProjectFormModal, etc.)
**Example:**
```typescript
// Source: Radix Dialog + Tailwind responsive utilities
// Update DialogContent in dialog.tsx or per-component
<DialogContent className={cn(
  // Mobile: full screen
  "fixed inset-0 w-full h-full max-w-none rounded-none",
  // OR slide from bottom like a sheet
  "fixed inset-x-0 bottom-0 h-auto max-h-[90vh] rounded-t-xl",
  // Desktop: centered modal
  "md:inset-auto md:left-[50%] md:top-[50%] md:translate-x-[-50%] md:translate-y-[-50%]",
  "md:w-full md:max-w-md md:h-auto md:rounded-lg",
  // Shared
  "z-50 bg-background p-6 shadow-lg overflow-y-auto"
)}>
  {/* Close button - larger on mobile for touch */}
  <DialogClose className={cn(
    "absolute right-4 top-4",
    "h-8 w-8 rounded-sm", // 32px touch target, consider h-10 w-10
    "md:h-6 md:w-6"
  )}>
    <X className="h-4 w-4" />
  </DialogClose>
  {children}
</DialogContent>
```

### Pattern 2: Full-Width Sheet on Mobile
**What:** Detail sheets fill full width on mobile, partial width on tablet+
**When to use:** All detail sheets (DealDetailSheet, InitiativeDetailSheet, etc.)
**Example:**
```typescript
// Source: shadcn/ui Sheet with responsive width
// Current: w-3/4 sm:max-w-sm
// Updated for mobile full-width:
<SheetContent className={cn(
  // Mobile: full width
  "w-full",
  // Tablet+: partial width
  "md:w-3/4 md:max-w-lg",
  "p-0 flex flex-col"
)}>
```

### Pattern 3: Form Fields Stack on Mobile
**What:** Multi-column form layouts become single column on mobile
**When to use:** All forms with side-by-side fields
**Example:**
```typescript
// Source: Tailwind responsive grid
// Current pattern in forms:
<div className="grid grid-cols-2 gap-4">

// Updated for mobile stacking:
<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
  {/* Fields naturally stack on mobile */}
</div>
```

### Pattern 4: Touch-Friendly Input Heights
**What:** Increase input heights to meet 44px WCAG touch target minimum
**When to use:** All form inputs, selects, buttons
**Example:**
```typescript
// Source: WCAG 2.5.8 / Apple HIG 44pt minimum
// Current Input height: h-9 (36px)
// Updated Input in input.tsx:
<input
  className={cn(
    "flex w-full rounded-md border border-input bg-transparent",
    "px-3 py-2 text-base shadow-sm", // text-base prevents iOS zoom
    // Mobile: 44px height for touch
    "h-11",
    // Desktop: can be slightly smaller
    "md:h-9",
    // ... rest of classes
  )}
/>

// SelectTrigger height:
<SelectTrigger className="h-11 md:h-9">
```

### Pattern 5: Date Picker Touch Optimization
**What:** Ensure calendar day cells are touch-friendly
**When to use:** All date pickers (initiative-form, cost-form)
**Example:**
```typescript
// Source: react-day-picker customization
// Calendar.tsx already has [--cell-size:2rem] (32px)
// For mobile touch, increase to 2.75rem (44px)
<DayPicker
  className={cn(
    "bg-background group/calendar p-3",
    // Mobile: larger cells
    "[--cell-size:2.75rem]",
    // Desktop: standard size
    "md:[--cell-size:2rem]"
  )}
/>
```

### Pattern 6: Responsive Dialog Footer
**What:** Footer buttons stack on mobile, row on desktop
**When to use:** All dialog/sheet footers
**Example:**
```typescript
// Source: shadcn/ui DialogFooter (already has this!)
// DialogFooter already has: "flex flex-col-reverse sm:flex-row sm:justify-end"
// Just ensure full-width buttons on mobile:
<DialogFooter>
  <Button
    type="button"
    variant="outline"
    className="w-full sm:w-auto"
  >
    Cancel
  </Button>
  <Button type="submit" className="w-full sm:w-auto">
    Create
  </Button>
</DialogFooter>
```

### Anti-Patterns to Avoid
- **Side-by-side form fields on mobile:** Leads to cramped inputs. Always stack on mobile.
- **Small close buttons on mobile:** 24px X button is too small for touch. Use 44px minimum.
- **Horizontal scrolling in forms:** Never require horizontal scroll for form fields.
- **Hover-only form tooltips:** Touch devices have no hover. Use inline help text.
- **Popover-based date picker without height constraint:** Can overflow viewport on mobile.
- **Auto-zoom on iOS for inputs:** Use `text-base` (16px) or larger font on inputs to prevent zoom.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Mobile full-screen dialog | Separate MobileDialog component | Responsive CSS on existing Dialog | Single component, maintainable |
| Swipe-to-dismiss drawer | Custom touch handlers | Vaul/Drawer component (if needed) | Native-feeling gestures |
| Touch-friendly calendar | Custom mobile date picker | react-day-picker with larger cells | Already integrated, customizable |
| Stacking form fields | CSS media queries in <style> | Tailwind responsive utilities | Co-located, readable |
| iOS input zoom prevention | Custom JS zoom handler | font-size: 16px (text-base) | CSS-only solution |

**Key insight:** The existing shadcn/ui components have responsive foundations (DialogFooter, SheetHeader). The work is mostly applying responsive classes to content wrappers, not rebuilding components.

## Common Pitfalls

### Pitfall 1: iOS Auto-Zoom on Form Inputs
**What goes wrong:** iOS Safari zooms in when user focuses on input
**Why it happens:** Font size below 16px triggers iOS zoom behavior
**How to avoid:** Use `text-base` (16px) on all inputs, or set minimum input font-size to 16px
**Warning signs:** Users complain form zooms in unexpectedly, have to zoom out manually

### Pitfall 2: Modal Close Button Too Small
**What goes wrong:** Users can't easily close modal on mobile
**Why it happens:** Default X button is 16x16px or 24x24px, below touch target minimum
**How to avoid:** Make close button at least 44x44px hit area on mobile
**Warning signs:** Users tap wrong area, accidentally trigger other actions

### Pitfall 3: Form Fields Cramped on Mobile
**What goes wrong:** Side-by-side fields are too narrow to use
**Why it happens:** 50% width at 320px viewport = 160px per field
**How to avoid:** Stack fields on mobile with `grid-cols-1 md:grid-cols-2`
**Warning signs:** Users struggle to tap correct field, misclick frequently

### Pitfall 4: Date Picker Overflow on Mobile
**What goes wrong:** Calendar extends beyond viewport
**Why it happens:** Popover doesn't respect viewport bounds on small screens
**How to avoid:** Use `--radix-popover-content-available-height` CSS variable, or show calendar inline on mobile
**Warning signs:** Users can't see full calendar, can't select dates at edges

### Pitfall 5: Select Dropdown Cut Off
**What goes wrong:** Select options list extends beyond viewport bottom
**Why it happens:** Long option lists on mobile without max-height
**How to avoid:** SelectContent already uses `max-h-[--radix-select-content-available-height]` (verify it's applied)
**Warning signs:** Users can't scroll to last options, options hidden off-screen

### Pitfall 6: Detail Sheet Partially Hidden on Mobile
**What goes wrong:** Sheet content extends off-screen width
**Why it happens:** Fixed width (w-3/4 or sm:max-w-sm) is still less than viewport on mobile
**How to avoid:** Use `w-full md:w-3/4` for full width on mobile
**Warning signs:** Content truncated, horizontal scroll appears

### Pitfall 7: Touch Target Spacing Too Tight
**What goes wrong:** User taps one form element but activates adjacent one
**Why it happens:** Gap between elements less than 8px
**How to avoid:** Use `gap-4` (16px) or `space-y-4` (16px) between form elements
**Warning signs:** Frequent misclicks, users complain about form usability

## Code Examples

Verified patterns from official sources and project context:

### Responsive Dialog Content (Full-Screen Mobile)
```typescript
// Source: Radix Dialog + Tailwind responsive patterns
// Apply to dialog.tsx DialogContent
const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        // Base positioning
        "fixed z-50 bg-background shadow-lg",
        // Mobile: slide up from bottom, nearly full screen
        "inset-x-0 bottom-0 h-[calc(100vh-2rem)] rounded-t-2xl",
        // Desktop: centered modal
        "md:inset-auto md:left-[50%] md:top-[50%] md:h-auto",
        "md:translate-x-[-50%] md:translate-y-[-50%]",
        "md:w-full md:max-w-lg md:rounded-lg",
        // Animation
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        // Mobile: slide from bottom
        "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
        // Desktop: zoom
        "md:data-[state=closed]:zoom-out-95 md:data-[state=open]:zoom-in-95",
        "md:data-[state=closed]:slide-out-to-left-1/2 md:data-[state=closed]:slide-out-to-top-[48%]",
        "md:data-[state=open]:slide-in-from-left-1/2 md:data-[state=open]:slide-in-from-top-[48%]",
        // Content behavior
        "overflow-y-auto p-6 gap-4",
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className={cn(
        "absolute right-4 top-4 rounded-sm",
        "h-10 w-10 flex items-center justify-center", // 40px touch target
        "md:h-6 md:w-6", // Smaller on desktop
        "opacity-70 hover:opacity-100 focus:outline-none focus:ring-2"
      )}>
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
))
```

### Responsive Sheet Content (Full-Width Mobile)
```typescript
// Source: shadcn/ui Sheet with responsive width
// Update sheetVariants in sheet.tsx
const sheetVariants = cva(
  "fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out",
  {
    variants: {
      side: {
        right: cn(
          "inset-y-0 right-0 h-full border-l",
          // Mobile: full width
          "w-full",
          // Desktop: partial width
          "md:w-3/4 md:max-w-lg",
          // Animation
          "data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right"
        ),
        bottom: cn(
          "inset-x-0 bottom-0 border-t rounded-t-2xl",
          // Full width, limited height
          "w-full max-h-[90vh]",
          "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom"
        ),
        // ... other sides
      },
    },
  }
)
```

### Touch-Friendly Form Input
```typescript
// Source: WCAG 2.5.8 + Apple HIG
// Update Input component in input.tsx
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex w-full rounded-md border border-input bg-transparent",
          // Mobile: 44px height for touch target
          "h-11 px-3 py-2",
          // Desktop: can be slightly smaller
          "md:h-9",
          // Font size: 16px minimum prevents iOS zoom
          "text-base md:text-sm",
          // Other styles
          "shadow-sm transition-colors",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          "placeholder:text-muted-foreground",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
```

### Responsive Form Grid
```typescript
// Source: Existing form patterns + mobile-first
// Apply to initiative-form.tsx, cost-form.tsx, etc.
<form onSubmit={handleSubmit} className="space-y-4">
  {/* Two-column fields - stack on mobile */}
  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
    <div className="space-y-2">
      <Label htmlFor="field1">Field 1</Label>
      <Input id="field1" />
    </div>
    <div className="space-y-2">
      <Label htmlFor="field2">Field 2</Label>
      <Input id="field2" />
    </div>
  </div>

  {/* Full-width field - same on all sizes */}
  <div className="space-y-2">
    <Label htmlFor="description">Description</Label>
    <Textarea id="description" className="min-h-[100px]" />
  </div>

  {/* Date pickers - stack on mobile */}
  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
    <div className="space-y-2">
      <Label>Start Date</Label>
      <DatePickerField value={startDate} onChange={setStartDate} />
    </div>
    <div className="space-y-2">
      <Label>End Date</Label>
      <DatePickerField value={endDate} onChange={setEndDate} />
    </div>
  </div>
</form>
```

### Touch-Friendly Calendar
```typescript
// Source: react-day-picker customization
// Update Calendar in calendar.tsx
<DayPicker
  className={cn(
    "bg-background group/calendar p-3",
    // Mobile: larger cells for touch
    "[--cell-size:2.75rem]", // 44px
    // Desktop: standard size
    "md:[--cell-size:2rem]", // 32px
    // RTL support (existing)
    String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
    String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
    className
  )}
  // ... rest of props
/>
```

### Full-Screen Company Detail Modal
```typescript
// Source: company-detail-modal.tsx responsive update
<DialogContent className={cn(
  // Mobile: full screen with scroll
  "fixed inset-0 w-full h-full max-w-none rounded-none overflow-y-auto",
  // Desktop: centered, constrained
  "md:inset-auto md:left-[50%] md:top-[50%]",
  "md:translate-x-[-50%] md:translate-y-[-50%]",
  "md:w-full md:max-w-2xl md:max-h-[85vh] md:rounded-lg"
)}>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Fixed-size modals | Responsive modals (full-screen mobile) | Mobile-first design | Works on all devices |
| Side-by-side form fields always | Stack on mobile | Responsive design | Readable on small screens |
| 36px input heights | 44-48px input heights | WCAG 2.5.8 (2023) | Accessible touch targets |
| Small close buttons | 44px minimum touch area | Apple HIG / WCAG | Tappable controls |
| Fixed-width sheets | Full-width mobile sheets | Mobile-first | Content fits viewport |
| Popover date picker on all | Consider inline on mobile | Touch-first design | Better mobile UX |

**Deprecated/outdated:**
- Hover-dependent form validation: Use inline validation messages
- 36px input heights on mobile: Increase to 44px minimum for WCAG compliance
- Fixed modal positioning: Use responsive inset classes

## Open Questions

Things that couldn't be fully resolved:

1. **Should Drawer replace Dialog on mobile entirely?**
   - What we know: Drawer (Vaul) provides swipe-to-dismiss gestures native to mobile
   - What's unclear: Is the added dependency worth it for this app?
   - Recommendation: Start with CSS-only responsive Dialog (slide from bottom). Add Drawer only if users expect swipe gestures.

2. **Calendar display on mobile - popover vs inline?**
   - What we know: Popover-based calendar can overflow on small viewports
   - What's unclear: Is react-day-picker's viewport awareness sufficient?
   - Recommendation: Keep Popover but verify `--radix-popover-content-available-height` is being used. Consider Sheet-based calendar picker if issues persist.

3. **Select dropdown with many options on mobile?**
   - What we know: Long option lists may not all be visible
   - What's unclear: Whether search-in-select (Command) is better for mobile
   - Recommendation: Keep standard Select; ensure max-height is viewport-aware. For 10+ options, consider Command/Combobox pattern.

## Sources

### Primary (HIGH confidence)
- [Radix Dialog Documentation](https://www.radix-ui.com/primitives/docs/components/dialog) - Core dialog primitives
- [shadcn/ui Dialog](https://ui.shadcn.com/docs/components/dialog) - Current implementation
- [shadcn/ui Sheet](https://ui.shadcn.com/docs/components/sheet) - Current sheet implementation
- [shadcn/ui Drawer](https://ui.shadcn.com/docs/components/drawer) - Optional drawer component
- [WCAG 2.5.8 Target Size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) - 24px minimum, 44px recommended
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/) - 44pt touch targets
- Phase 16/17/18 Research - Established responsive patterns

### Secondary (MEDIUM confidence)
- [Responsive Dialog/Drawer Pattern](https://www.nextjsshop.com/resources/blog/responsive-dialog-drawer-shadcn-ui) - Combined component approach
- [Radix GitHub Discussions](https://github.com/radix-ui/primitives/discussions/796) - Mobile-responsive patterns
- [react-day-picker GitHub](https://github.com/gpbl/react-day-picker/discussions/2067) - Mobile friendliness discussion

### Tertiary (LOW confidence)
- Community patterns for mobile forms
- Blog posts on responsive dialogs

## Metadata

**Confidence breakdown:**
- Dialog responsive pattern: HIGH - well-documented Radix + Tailwind approach
- Sheet full-width mobile: HIGH - simple CSS change to existing component
- Touch target sizes: HIGH - WCAG/HIG standards are clear
- Date picker mobile: MEDIUM - react-day-picker mobile support is partial
- Form stacking: HIGH - established Tailwind responsive grid pattern

**Research date:** 2026-01-23
**Valid until:** 2026-04-23 (3 months - stable patterns, existing library stack)
