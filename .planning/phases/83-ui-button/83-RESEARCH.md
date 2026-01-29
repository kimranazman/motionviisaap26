# Phase 83 Research: AiAnalyzeButton Component

## Research Question
What do I need to know to PLAN this phase well?

## Key Findings

### 1. Existing Header Structure

**File:** `src/components/layout/header.tsx`

The header component:
- Uses `useSession` from next-auth/react to get user data
- Has a right-side section with controls: DetailViewToggle, NotificationBell, User dropdown
- Uses DropdownMenu components from `@/components/ui/dropdown-menu`
- Already imports lucide-react icons

**Insert point for AiAnalyzeButton:** Between DetailViewToggle and NotificationBell
```tsx
{/* AI Analyze Button - admin only */}
{session?.user?.role === 'ADMIN' && <AiAnalyzeButton />}

{/* Notifications */}
<NotificationBell />
```

### 2. Similar Component Pattern: NotificationBell

**File:** `src/components/layout/notification-bell.tsx`

Key patterns to follow:
- Uses Popover (we should use DropdownMenu instead for simpler click-to-trigger)
- Fetches data on mount and periodically
- Shows badge with count: `<span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">`
- Hides badge when count is 0
- Loading state handling

### 3. Role Checking

**File:** `src/lib/permissions.ts`
```typescript
export function isAdmin(role: UserRole | undefined): boolean {
  return role === UserRole.ADMIN
}
```

**Usage in components:**
```typescript
import { useSession } from 'next-auth/react'
const { data: session } = useSession()
// Check: session?.user?.role === 'ADMIN'
```

### 4. Pending API Response

**File:** `src/app/api/ai/pending/route.ts`

Returns:
```typescript
{
  costs: number,      // costs with supplierId but no normalizedItem
  invoices: number,   // documents with category INVOICE and aiStatus PENDING
  receipts: number,   // documents with category RECEIPT and aiStatus PENDING
  deliverables: number, // projects with invoices but no aiExtracted deliverables
  total: number       // sum of all
}
```

### 5. Trigger API (Phase 82)

**Expected:** POST /api/ai/trigger with `{ type: "costs" | "invoice" | "receipt" | "deliverables" | "all" }`

Returns:
- 202 Accepted on successful trigger
- 403 for non-admin
- 500 on SSH/execution error

### 6. Toast Usage

**Pattern:**
```typescript
import { toast } from 'sonner'

// Success
toast.success('Message')

// Error
toast.error('Message')

// Info
toast.info('Message')

// With description
toast.success('Title', { description: 'Details' })
```

### 7. Badge Display

**File:** `src/components/ui/badge.tsx`

Standard badge component, but for header icon badge we should use inline span like NotificationBell:
```tsx
<span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-purple-500 text-[10px] font-medium text-white">
  {count > 99 ? '99+' : count}
</span>
```

### 8. Sparkles Icon

Already used in project for AI indicators:
```typescript
import { Sparkles } from 'lucide-react'
<Sparkles className="h-5 w-5" />
```

### 9. DropdownMenu Components

Available from `@/components/ui/dropdown-menu`:
- DropdownMenu (root)
- DropdownMenuTrigger
- DropdownMenuContent
- DropdownMenuItem
- DropdownMenuLabel
- DropdownMenuSeparator

## Architecture Decision

### Component Structure

```
AiAnalyzeButton
├── State: pendingCounts, isLoading, isPolling, initialCount
├── Fetch: /api/ai/pending on mount
├── Dropdown with trigger button (Sparkles + badge)
├── Menu items: All, Costs, Invoices, Receipts, Deliverables
└── Polling logic: start on trigger, stop at 90s or count change
```

### Polling Strategy

1. On trigger click:
   - Store current count as `initialCount`
   - Start polling every 15s
   - Set `isPolling = true`

2. During polling:
   - Fetch /api/ai/pending
   - Compare `total` to `initialCount`
   - If decreased: `toast.success(X items analyzed)`, stop polling
   - If 90s elapsed: `toast.info("Still running on Mac")`, stop polling

3. Track iterations: `pollCount * 15s >= 90s` = 6 polls max

## Files to Create/Modify

1. **Create:** `src/components/layout/ai-analyze-button.tsx`
   - New component with all logic

2. **Modify:** `src/components/layout/header.tsx`
   - Import AiAnalyzeButton
   - Add conditional render for admin users

## Success Criteria Mapping

| Requirement | Implementation |
|-------------|----------------|
| UI-01: Sparkles icon, admin-only | `session?.user?.role === 'ADMIN' && <AiAnalyzeButton />` |
| UI-02: Badge with total | Inline span badge, hidden when 0 |
| UI-03: Dropdown menu | DropdownMenu with options |
| UI-04: Counts per type | Show in dropdown items |
| UI-05: Toast on trigger | `toast('Analyzing...')` |
| UI-06: Error toast | `toast.error(message)` |
| POLL-01: Poll every 15s | setInterval in useEffect |
| POLL-02: Stop at 90s | pollCount >= 6 |
| POLL-03: Success toast | Compare counts, show diff |
| POLL-04: Timeout toast | "Still running on Mac" |
| POLL-05: Badge refresh | Re-fetch during poll |

## RESEARCH COMPLETE
