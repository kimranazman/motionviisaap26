# Architecture

**Analysis Date:** 2026-01-20

## Pattern Overview

**Overall:** Next.js 14 App Router with Server Components and API Routes

**Key Characteristics:**
- Server-first rendering with React Server Components (RSC)
- Direct Prisma database access in Server Components (no API layer for reads)
- REST API routes for client-side mutations (POST, PUT, PATCH, DELETE)
- Feature-based component organization
- No authentication layer (single-user internal tool)

## Layers

**Data Layer:**
- Purpose: Database models and ORM configuration
- Location: `src/lib/prisma.ts`, `prisma/schema.prisma`
- Contains: Prisma client singleton, database schema with enums and models
- Depends on: MySQL database via `DATABASE_URL`
- Used by: Server Components, API Routes

**API Layer:**
- Purpose: HTTP endpoints for client-side data mutations
- Location: `src/app/api/`
- Contains: REST endpoints for CRUD operations
- Depends on: Prisma client
- Used by: Client Components for mutations
- Pattern: Next.js Route Handlers (GET, POST, PUT, PATCH, DELETE)

**Page Layer:**
- Purpose: Server Components that fetch and render data
- Location: `src/app/(dashboard)/*/page.tsx`
- Contains: Async data fetching functions, page composition
- Depends on: Prisma client, Layout components
- Used by: Next.js router
- Pattern: RSC with direct Prisma queries, passes serialized data to Client Components

**Component Layer:**
- Purpose: Reusable UI and feature components
- Location: `src/components/`
- Contains: Client and Server components, UI primitives
- Depends on: UI library (shadcn/ui), utility functions
- Used by: Pages

**Utility Layer:**
- Purpose: Shared helper functions, constants, formatting
- Location: `src/lib/utils.ts`
- Contains: Class utilities, formatters, color mappings, option constants
- Depends on: clsx, tailwind-merge
- Used by: All components

## Data Flow

**Server-Side Rendering (Primary Read Pattern):**

1. User navigates to route (e.g., `/kanban`)
2. Server Component (`page.tsx`) executes
3. Async function queries Prisma directly
4. Data serialized (Dates to ISO strings, Decimals to numbers)
5. Serialized data passed as props to Client Components
6. Client Component hydrates with initial data

Example from `src/app/(dashboard)/kanban/page.tsx`:
```typescript
async function getInitiatives() {
  const initiatives = await prisma.initiative.findMany({...})
  return initiatives.map(i => ({
    ...i,
    startDate: i.startDate.toISOString(),
    endDate: i.endDate.toISOString(),
  }))
}
```

**Client-Side Mutations:**

1. User action triggers mutation (drag-drop, form submit)
2. Client Component calls `fetch('/api/...')`
3. API Route Handler processes request
4. Prisma executes database operation
5. Response returned to client
6. Client updates local state (optimistic or from response)

Example from `src/components/kanban/kanban-board.tsx`:
```typescript
const response = await fetch('/api/initiatives/reorder', {
  method: 'PATCH',
  body: JSON.stringify({ updates }),
})
```

**State Management:**
- Local React state (`useState`) for component-level data
- Props drilling from Server to Client Components
- No global state management library (no Redux, Zustand)
- Data refetch via API calls after mutations

## Key Abstractions

**Initiative:**
- Purpose: Core domain entity representing a strategic action item
- Examples: `prisma/schema.prisma` (model), `src/app/api/initiatives/route.ts` (API)
- Pattern: Full CRUD via Prisma model with comments relation

**Event/EventToAttend:**
- Purpose: External events for networking/business development
- Examples: `prisma/schema.prisma`, `src/app/api/events-to-attend/route.ts`
- Pattern: Read with filters, status updates only

**UI Primitives (shadcn/ui):**
- Purpose: Consistent, accessible base components
- Examples: `src/components/ui/button.tsx`, `src/components/ui/card.tsx`
- Pattern: Radix UI primitives + CVA variants + Tailwind styling

**Feature Components:**
- Purpose: Domain-specific composed components
- Examples: `src/components/kanban/kanban-board.tsx`, `src/components/dashboard/kpi-cards.tsx`
- Pattern: Client Components receiving serialized data as props

## Entry Points

**Application Root:**
- Location: `src/app/layout.tsx`
- Triggers: All page loads
- Responsibilities: HTML structure, global font, body styling

**Dashboard Layout:**
- Location: `src/app/(dashboard)/layout.tsx`
- Triggers: All routes in (dashboard) group
- Responsibilities: Sidebar rendering, main content area

**Page Entry Points:**
- Location: `src/app/(dashboard)/page.tsx` (Dashboard home)
- Location: `src/app/(dashboard)/kanban/page.tsx`
- Location: `src/app/(dashboard)/initiatives/page.tsx`
- Location: `src/app/(dashboard)/timeline/page.tsx`
- Location: `src/app/(dashboard)/calendar/page.tsx`
- Location: `src/app/(dashboard)/events/page.tsx`
- Pattern: `export const dynamic = 'force-dynamic'` disables caching

**API Entry Points:**
- Location: `src/app/api/initiatives/route.ts` (GET, POST)
- Location: `src/app/api/initiatives/[id]/route.ts` (GET, PUT, PATCH, DELETE)
- Location: `src/app/api/initiatives/[id]/comments/route.ts` (comments)
- Location: `src/app/api/initiatives/reorder/route.ts` (Kanban reorder)
- Location: `src/app/api/events-to-attend/route.ts` (GET, PATCH)
- Location: `src/app/api/dashboard/stats/route.ts` (dashboard stats)

## Error Handling

**Strategy:** Try-catch with console logging and generic error responses

**Patterns:**
- API routes wrap Prisma calls in try-catch
- Return 500 status with `{ error: 'Failed to...' }` message
- Console.error for server-side logging
- No client-side error boundaries configured
- No structured error types

Example from `src/app/api/initiatives/route.ts`:
```typescript
catch (error) {
  console.error('Error fetching initiatives:', error)
  return NextResponse.json(
    { error: 'Failed to fetch initiatives' },
    { status: 500 }
  )
}
```

## Cross-Cutting Concerns

**Logging:**
- Approach: `console.error()` for errors in API routes
- No structured logging or log levels

**Validation:**
- Approach: Minimal - relies on Prisma schema constraints
- No runtime validation library (no Zod, Yup)
- Type assertions for query params: `as InitiativeStatus`

**Authentication:**
- Not implemented - internal single-user tool
- Hardcoded user "Khairul" in header

**Date Serialization:**
- All Prisma Date fields converted to ISO strings before passing to client
- Decimal fields converted to numbers
- Pattern applied in all page data fetching functions

---

*Architecture analysis: 2026-01-20*
