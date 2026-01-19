# Coding Conventions

**Analysis Date:** 2026-01-20

## Naming Patterns

**Files:**
- Components: `kebab-case.tsx` (e.g., `kanban-board.tsx`, `initiative-form.tsx`)
- API routes: `route.ts` in directory structure (Next.js App Router convention)
- Utilities: `kebab-case.ts` (e.g., `utils.ts`, `prisma.ts`)
- UI components (shadcn): `kebab-case.tsx` (e.g., `button.tsx`, `card.tsx`)

**Functions:**
- camelCase for all functions: `formatCurrency`, `getStatusColor`, `handleSubmit`
- Event handlers prefixed with `handle`: `handleDragStart`, `handleCreateSuccess`, `handleCardClick`
- Getter functions prefixed with `get`: `getBarStyle`, `getActiveItem`, `getColumnItems`
- Format functions prefixed with `format`: `formatDate`, `formatStatus`, `formatDepartment`

**Variables:**
- camelCase for variables: `totalInitiatives`, `statusCounts`, `filteredInitiatives`
- SCREAMING_SNAKE_CASE for constants: `COLUMNS`, `STATUS_OPTIONS`, `TEAM_MEMBER_OPTIONS`
- Boolean variables prefixed with `is`/`has`: `isLoading`, `isOverdue`, `isActive`

**Types/Interfaces:**
- PascalCase for types and interfaces: `Initiative`, `KanbanBoardProps`, `InitiativeFormProps`
- Props interfaces suffixed with `Props`: `KPICardsProps`, `GanttChartProps`
- Prisma enums in SCREAMING_SNAKE_CASE: `InitiativeStatus`, `NOT_STARTED`, `IN_PROGRESS`

## Code Style

**Formatting:**
- No explicit Prettier config (uses ESLint defaults)
- 2-space indentation
- Single quotes for strings
- Semicolons omitted (implicit)
- Trailing commas in multi-line structures

**Linting:**
- ESLint with Next.js presets: `next/core-web-vitals`, `next/typescript`
- Config file: `.eslintrc.json`
- Run with: `npm run lint`

## Import Organization

**Order:**
1. React/Next.js imports: `import { useState, useMemo } from 'react'`
2. Third-party libraries: `import { format } from 'date-fns'`
3. Internal UI components: `import { Button } from '@/components/ui/button'`
4. Internal feature components: `import { InitiativeForm } from './initiative-form'`
5. Utilities and constants: `import { cn, formatStatus, STATUS_OPTIONS } from '@/lib/utils'`
6. Icons (always last): `import { Plus, Search, Filter } from 'lucide-react'`

**Path Aliases:**
- `@/*` maps to `./src/*`
- Always use `@/` prefix for imports from `src/` directory
- Relative imports (`./`) only for same-directory imports

**Example Pattern:**
```typescript
'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { InitiativeForm } from './initiative-form'
import { formatStatus, STATUS_OPTIONS } from '@/lib/utils'
import { Plus, Search } from 'lucide-react'
```

## Error Handling

**API Routes Pattern:**
```typescript
export async function GET(request: NextRequest) {
  try {
    // ... business logic
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching initiatives:', error)
    return NextResponse.json(
      { error: 'Failed to fetch initiatives' },
      { status: 500 }
    )
  }
}
```

**Client-Side Pattern:**
```typescript
try {
  const response = await fetch(url, { method, headers, body })
  if (!response.ok) {
    throw new Error('Failed to save initiative')
  }
  onSuccess()
} catch (error) {
  console.error('Error saving initiative:', error)
  alert('Failed to save initiative')
}
```

**Patterns:**
- Wrap all async operations in try/catch
- Log errors with `console.error()` including context message
- Return standardized error JSON: `{ error: 'Human-readable message' }`
- Use appropriate HTTP status codes: 404 for not found, 500 for server errors
- Client-side: Show user feedback via `alert()` (basic) - consider toast library for production

## Logging

**Framework:** `console` (native)

**Patterns:**
- Error logging: `console.error('Error <context>:', error)`
- No verbose logging in production code
- Include contextual message before error object

## Comments

**When to Comment:**
- Complex business logic (date calculations, collision detection)
- Status/column mapping explanations
- Section headers in long components (e.g., `{/* Row 1: Objective & Key Result */}`)

**Style:**
```typescript
// Single line for brief explanations
// Map from column ID to the primary status for that column (used when dropping)

{/* JSX comments for section markers */}
{/* Controls */}
{/* Chart */}
```

**JSDoc/TSDoc:**
- Not used in this codebase
- Interfaces serve as documentation

## Function Design

**Size:**
- Functions generally 20-50 lines
- Components can be larger (100-400 lines) but are well-sectioned

**Parameters:**
- Destructure props directly in function signature
- Use TypeScript interfaces for all props
- Optional parameters use `?` or default values

**Example:**
```typescript
interface KanbanCardProps {
  item: Initiative
  isDragging?: boolean
  onClick?: () => void
}

export function KanbanCard({ item, isDragging, onClick }: KanbanCardProps) {
  // ...
}
```

**Return Values:**
- Components return JSX
- Utility functions return typed values
- API handlers return `NextResponse.json()`

## Module Design

**Exports:**
- Named exports preferred: `export function KanbanBoard() {}`
- Default exports only for Next.js pages/layouts
- Export constants alongside functions: `export const STATUS_OPTIONS = [...]`

**Barrel Files:**
- Not used - direct imports to specific files

## Component Patterns

**Client vs Server Components:**
- Mark client components with `'use client'` directive at top
- Server components are default (no directive needed)
- Pages that fetch data: server components with `async function`
- Pages with interactivity: pass data to client components as props

**State Management:**
```typescript
const [initiatives, setInitiatives] = useState(initialData)
const [isLoading, setIsLoading] = useState(false)
const [formData, setFormData] = useState<Initiative>({ ... })
```

**Derived State with useMemo:**
```typescript
const filteredInitiatives = useMemo(() => {
  return initiatives.filter(initiative => {
    // filter logic
  })
}, [initiatives, searchQuery, selectedPerson])
```

## UI Component Patterns

**shadcn/ui Components:**
- Located in `src/components/ui/`
- Use `class-variance-authority` for variants
- Extend with `React.forwardRef` for ref forwarding
- Use `cn()` utility for conditional classes

**Custom Component Pattern:**
```typescript
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"
```

## Styling Conventions

**Tailwind CSS:**
- Use semantic color classes from theme: `text-gray-900`, `bg-primary`
- Use CSS variables via `hsl(var(--background))`
- Responsive prefixes: `sm:`, `lg:` for breakpoints
- Custom utilities in `globals.css`: `.glass`, `.shadow-apple`

**Class Merging:**
```typescript
import { cn } from '@/lib/utils'

className={cn(
  'base-classes',
  conditional && 'conditional-classes',
  className // allow override
)}
```

## Data Fetching Patterns

**Server Components (Pages):**
```typescript
async function getDashboardData() {
  const data = await prisma.initiative.findMany({...})
  return data
}

export default async function DashboardPage() {
  const data = await getDashboardData()
  return <Component data={data} />
}
```

**Client Components:**
```typescript
const response = await fetch('/api/initiatives')
const data = await response.json()
setInitiatives(data)
```

## Type Definitions

**Interface Location:**
- Define interfaces at the top of files where used
- Repeat common interfaces (e.g., `Initiative`) per component for isolation
- Import Prisma types when needed: `import { InitiativeStatus } from '@prisma/client'`

**Common Interface Pattern:**
```typescript
interface Initiative {
  id: string
  sequenceNumber: number
  title: string
  status: string
  // ... other fields
}
```

---

*Convention analysis: 2026-01-20*
