# Testing Patterns

**Analysis Date:** 2026-01-20

## Test Framework

**Runner:**
- Not configured
- No Jest or Vitest configuration files present
- No test scripts in `package.json`

**Assertion Library:**
- Not configured

**Run Commands:**
```bash
# No test commands available
# Suggested setup:
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

## Test File Organization

**Location:**
- No test files exist in the codebase

**Suggested Pattern:**
- Co-located: `src/components/kanban/kanban-board.test.tsx`
- Or separate: `__tests__/components/kanban/kanban-board.test.tsx`

**Naming:**
- Suggested: `*.test.ts` or `*.test.tsx`

## Test Structure

**Recommended Suite Organization:**
```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { KanbanCard } from './kanban-card'

describe('KanbanCard', () => {
  const mockInitiative = {
    id: 'test-id',
    sequenceNumber: 1,
    title: 'Test Initiative',
    keyResult: 'KR1.1',
    department: 'BIZ_DEV',
    status: 'IN_PROGRESS',
    personInCharge: 'KHAIRUL',
    startDate: '2026-01-01',
    endDate: '2026-03-31',
    position: 0,
  }

  it('renders initiative title', () => {
    render(<KanbanCard item={mockInitiative} />)
    expect(screen.getByText('Test Initiative')).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const onClick = vi.fn()
    render(<KanbanCard item={mockInitiative} onClick={onClick} />)
    fireEvent.click(screen.getByText('Test Initiative'))
    expect(onClick).toHaveBeenCalled()
  })
})
```

## Mocking

**Framework:** Not configured (recommend Vitest)

**Recommended Patterns:**

**Mock Prisma Client:**
```typescript
// src/lib/__mocks__/prisma.ts
import { vi } from 'vitest'

export default {
  initiative: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
    groupBy: vi.fn(),
  },
}
```

**Mock fetch:**
```typescript
beforeEach(() => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(mockData),
  })
})
```

**Mock Next.js Navigation:**
```typescript
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}))
```

**What to Mock:**
- Database client (Prisma)
- External API calls (fetch)
- Next.js router/navigation
- Date/time for deterministic tests

**What NOT to Mock:**
- Component internals
- Utility functions (test with real implementation)
- UI component library (shadcn/ui)

## Fixtures and Factories

**Recommended Test Data Pattern:**
```typescript
// src/test/fixtures/initiatives.ts
export const createInitiative = (overrides = {}) => ({
  id: 'cuid-test-123',
  sequenceNumber: 1,
  objective: 'OBJ1_SCALE_EVENTS',
  keyResult: 'KR1.1',
  department: 'BIZ_DEV',
  title: 'Test Initiative',
  monthlyObjective: null,
  weeklyTasks: null,
  startDate: '2026-01-01T00:00:00.000Z',
  endDate: '2026-03-31T00:00:00.000Z',
  resourcesFinancial: null,
  resourcesNonFinancial: null,
  personInCharge: 'KHAIRUL',
  accountable: null,
  status: 'NOT_STARTED',
  remarks: null,
  position: 0,
  ...overrides,
})

export const createInitiativeList = (count: number) =>
  Array.from({ length: count }, (_, i) =>
    createInitiative({
      id: `cuid-test-${i}`,
      sequenceNumber: i + 1,
      title: `Initiative ${i + 1}`,
    })
  )
```

**Location:**
- Suggested: `src/test/fixtures/`

## Coverage

**Requirements:** None enforced

**Suggested Setup:**
```json
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['node_modules/', 'src/components/ui/'],
    },
  },
})
```

**View Coverage:**
```bash
# After setup:
npm run test:coverage
```

## Test Types

**Unit Tests:**
- Scope: Individual functions, components in isolation
- Suggested for:
  - Utility functions in `src/lib/utils.ts` (formatDate, formatCurrency, etc.)
  - UI components like KanbanCard, KPICards
  - Form validation logic

**Integration Tests:**
- Scope: Component interactions, data flow
- Suggested for:
  - KanbanBoard with drag-and-drop
  - InitiativeForm submission flow
  - Filter/search functionality

**E2E Tests:**
- Framework: Not configured
- Suggested: Playwright or Cypress
- Scope: Full user flows (create initiative, drag to complete, etc.)

## Common Patterns

**Async Testing (Recommended):**
```typescript
it('fetches and displays initiatives', async () => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve([mockInitiative]),
  })

  render(<InitiativesList initialData={[]} />)

  await waitFor(() => {
    expect(screen.getByText('Test Initiative')).toBeInTheDocument()
  })
})
```

**Error Testing (Recommended):**
```typescript
it('handles API error gracefully', async () => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: false,
    status: 500,
  })

  render(<InitiativeForm onSuccess={vi.fn()} />)

  fireEvent.click(screen.getByText('Create Initiative'))

  await waitFor(() => {
    expect(window.alert).toHaveBeenCalledWith('Failed to save initiative')
  })
})
```

**Component Snapshot Testing (Recommended):**
```typescript
it('matches snapshot', () => {
  const { container } = render(<KPICards stats={mockStats} />)
  expect(container).toMatchSnapshot()
})
```

## Priority Test Areas

Based on codebase analysis, these areas should be tested first:

1. **Utility Functions** (`src/lib/utils.ts`)
   - `formatCurrency`, `formatDate`, `formatDateRange`
   - `getStatusColor`, `getDepartmentColor`
   - `calculateProgress`, `parseExcelDate`

2. **API Routes** (`src/app/api/`)
   - GET/POST/PUT/PATCH/DELETE handlers
   - Error handling paths
   - Query parameter parsing

3. **Interactive Components**
   - `KanbanBoard` - drag and drop
   - `InitiativeForm` - form submission
   - `InitiativesList` - filtering and search

4. **Dashboard Components**
   - `KPICards` - stat rendering
   - `StatusChart`, `DepartmentChart` - data visualization

## Recommended Setup Steps

1. Install dependencies:
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

2. Create `vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['**/*.test.{ts,tsx}'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

3. Create `src/test/setup.ts`:
```typescript
import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock Next.js router
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}))
```

4. Add scripts to `package.json`:
```json
{
  "scripts": {
    "test": "vitest",
    "test:coverage": "vitest --coverage"
  }
}
```

---

*Testing analysis: 2026-01-20*
