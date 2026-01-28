# Research: Phase 60 — Event CRUD

## Domain Model

The "events" feature uses the `EventToAttend` Prisma model (table `events_to_attend`), NOT the `Event` model (which tracks client events with revenue/cost).

### EventToAttend Schema

| Field           | Type            | Notes                                         |
|-----------------|-----------------|-----------------------------------------------|
| id              | String (cuid)   | Primary key                                   |
| priority        | EventPriority   | TIER_1, TIER_2, TIER_3, ENERGY                |
| name            | String(255)     | Required                                      |
| category        | EventCategory   | EVENTS, AI_TRAINING, BOTH                     |
| eventDate       | String(100)     | Flexible date format from Excel (not DateTime) |
| location        | String(255)     | Required                                      |
| estimatedCost   | Decimal(12,2)?  | Nullable                                      |
| whyAttend       | String? (Text)  | Nullable                                      |
| targetCompanies | String? (Text)  | Nullable                                      |
| actionRequired  | String?(255)    | Nullable                                      |
| status          | EventStatus     | PLANNED, REGISTERED, ATTENDED, CANCELLED, SKIPPED |
| remarks         | String? (Text)  | Nullable                                      |

### Related Enums
- `EventPriority`: TIER_1, TIER_2, TIER_3, ENERGY
- `EventCategory`: EVENTS, AI_TRAINING, BOTH
- `EventStatus`: PLANNED, REGISTERED, ATTENDED, CANCELLED, SKIPPED

## Existing Code

### API Route: `src/app/api/events-to-attend/route.ts`
- **GET** — Fetches events with optional priority/category/status query filters. Uses `requireAuth()`.
- **PATCH** — Updates only status and remarks by body `{ id, status, remarks }`. Uses `requireEditor()`.
- **Missing**: POST (create), full PATCH (all fields), DELETE, per-ID route `[id]/route.ts`.

### Page: `src/app/(dashboard)/events/page.tsx`
- Server component. Fetches all events via Prisma, passes to `EventsView`.
- Has `Header` with title "Events to Attend". No Add button currently.

### Component: `src/components/events/events-view.tsx`
- Client component with summary cards, filters (priority, category), and event card grid.
- Cards show: name, priority badge, category badge, status badge, date, location, cost, whyAttend, targetCompanies, actionRequired.
- **No edit/delete buttons on cards**. Read-only display.

### Calendar: `src/app/(dashboard)/calendar/page.tsx`
- Fetches events for calendar display. Read-only reference.

## Established CRUD Patterns

### API Pattern (Suppliers)
- `route.ts` — GET (list) + POST (create)
- `[id]/route.ts` — GET (single) + PATCH (partial update) + DELETE
- Auth: `requireAuth()` for reads, `requireEditor()` for writes
- Validation: Check required fields, return 400 on missing

### Form Modal Pattern (DealFormModal)
- Dialog with form fields
- State per field with useState
- Reset on close
- onSubmit POSTs to API, calls onSuccess callback, closes modal
- Loading state with Loader2 spinner
- Error display

### Detail/Edit Pattern (SupplierDetailModal)
- Uses `DetailView` (dialog/drawer based on user preference)
- Loads full entity on open via API
- Inline field editing with PATCH per field
- Delete with AlertDialog confirmation
- Callbacks: onDeleted, onUpdated

### Approach for Events
For events, we need a simpler approach since events have many fields but are relatively flat (no relations to other entities). A combined form modal that works for both create and edit is the most efficient pattern. The events page already has filter controls, so we just need to add:
1. An "Add Event" button in the header/filter area
2. Edit/Delete buttons on each event card
3. A form modal (Dialog) for create/edit
4. A confirmation dialog for delete
5. API routes for POST, full PATCH, and DELETE

## Key Decisions

1. **Model**: Use `EventToAttend` (not `Event`).
2. **Form Modal**: Single modal for both create and edit (like DealFormModal pattern but dual-purpose).
3. **API Structure**: Extend existing `events-to-attend/route.ts` with POST, add `events-to-attend/[id]/route.ts` for PATCH/DELETE.
4. **Client-side state**: Events page needs to become client-aware with `useRouter().refresh()` after mutations.
5. **eventDate field**: String type (not DateTime) — use a text input, not a date picker.

## Files to Create/Modify

### New Files
- `src/app/api/events-to-attend/[id]/route.ts` — GET/PATCH/DELETE for single event
- `src/components/events/event-form-modal.tsx` — Create/edit form modal

### Modified Files
- `src/app/api/events-to-attend/route.ts` — Add POST handler
- `src/app/(dashboard)/events/page.tsx` — Pass events as props (already does)
- `src/components/events/events-view.tsx` — Add create button, edit/delete buttons on cards, wire up modals

## Risk Assessment

- **Low risk**: No schema changes needed. EventToAttend model already exists.
- **Low risk**: Existing API route just needs POST added and a new [id] route.
- **Medium attention**: eventDate is a String, not DateTime — form must use text input.
